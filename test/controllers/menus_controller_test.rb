# frozen_string_literal: true

require "test_helper"

class MenusControllerTest < ActionDispatch::IntegrationTest
  test "generate returns 422 when insufficient meals" do
    Meal.destroy_all
    post "/menus/generate", as: :json
    assert_response :unprocessable_entity
    json = response.parsed_body
    assert_match(/Cannot complete the menu/, json["errors"].to_s)
  end

  test "generation returns the weekly menu and keeps it first on later reads" do
    create_meal_pool_for_generate
    Menu.create!(from: Time.utc(2025, 3, 3), to: Time.utc(2025, 3, 9, 23, 59, 59))

    travel_to Time.utc(2026, 11, 9, 12) do
      post "/menus/generate", params: { people_count: 4 }, as: :json
      assert_response :created
      generated = response.parsed_body.fetch("data")
      assert_equal 4, generated.fetch("people_count")
      assert_equal 1, generated.fetch("days").first.fetch("meals").first.fetch("servings")
      assert_equal 7, generated.fetch("days").size
      assert_equal [], generated.fetch("generation_notices")
      assert_equal [], generated.fetch("days").first.fetch("meals").first.fetch("preferred_days")

      # A later insertion for an older week must not displace the latest plan.
      Menu.create!(from: Time.utc(2026, 11, 2), to: Time.utc(2026, 11, 8, 23, 59, 59))

      get "/menus", as: :json
      assert_response :ok
      menus = response.parsed_body.fetch("data")
      assert_equal generated, menus.first
      assert_equal %w[2026-11-16 2026-11-02 2025-03-03], menus.map { |menu| menu.fetch("from").first(10) }
    end
  end

  test "people updates persist and accept only the people count" do
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22))
    patch "/menus/#{menu.id}", params: { people_count: 3, from: "2000-01-01" }, as: :json
    assert_response :ok
    assert_equal 3, response.parsed_body.dig("data", "people_count")
    assert_equal Time.utc(2026, 11, 16), menu.reload.from
    get "/menus/#{menu.id}", as: :json
    assert_equal 3, response.parsed_body.dig("data", "people_count")
  end

  test "home uses the requested calendar date and the next UTC generation week" do
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22, 23, 59, 59))
    current = Menu.create!(from: menu.from, to: menu.to)
    future = Menu.create!(from: Time.utc(2026, 11, 25), to: Time.utc(2026, 12, 1))
    upcoming = Menu.create!(from: Time.utc(2026, 11, 30), to: Time.utc(2026, 12, 6))
    meal = Meal.create!(name: "Rice", description: "Steamed", servings: 1)
    add_scheduled_meal(future, meal, weekday: "thursday")
    add_scheduled_meal(upcoming, meal, weekday: "monday")

    travel_to Time.utc(2026, 11, 23, 0, 30) do
      get "/menus/home", params: { date: "2026-11-22" }
      assert_response :ok
      home = response.parsed_body.fetch("data")
      assert_equal current.id, home.dig("current_menu", "id")
      assert_equal({ "from" => "2026-11-30", "to" => "2026-12-06" }, home.fetch("next_week"))
      assert_equal upcoming.id, home.fetch("next_week_menu_id")
      assert_equal "2026-11-26", home.fetch("next_meal_date")
      assert home.fetch("has_saved_menus")
      assert home.fetch("has_meals")
    end
  end

  test "home rejects invalid dates and reports an empty library and history" do
    travel_to Time.utc(2026, 11, 22, 12)
    get "/menus/home", params: { date: "2026-02-30" }
    assert_response :unprocessable_entity

    get "/menus/home", params: { date: "2026-11-22" }
    assert_response :ok
    home = response.parsed_body.fetch("data")
    assert_nil home.fetch("current_menu")
    assert_nil home.fetch("next_week_menu_id")
    assert_nil home.fetch("next_meal_date")
    assert_equal false, home.fetch("has_saved_menus")
    assert_equal false, home.fetch("has_meals")
  end

  test "summaries only include menu identity and dates in history order" do
    from = Time.utc(2026, 11, 16)
    to = Time.utc(2026, 11, 22, 23, 59, 59)
    earlier = Menu.create!(from: from, to: to)
    later = Menu.create!(from: from, to: to)

    get "/menus/summaries"
    assert_response :ok
    assert_equal [later, earlier].map { |menu| { "id" => menu.id, "from" => from.as_json, "to" => to.as_json } },
      response.parsed_body.fetch("data")
  end

  test "home and the full menu index batch recipe queries as history grows" do
    travel_to Time.utc(2026, 11, 16, 12)
    current = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22, 23, 59, 59))
    Weekday.find_or_create_by!(name: "monday")
    first = Meal.create!(name: "Breakfast", description: "Steamed", servings: 1, preferred_days: ["monday"])
    second = Meal.create!(name: "Lunch", description: "Steamed", servings: 2)
    first.meal_types << MealType.find_or_create_by!(description: "breakfast")
    first.meal_ingredients.create!(ingredient: Ingredient.create!(name: "Rice"),
      unit: Unit.find_or_create_by!(code: "g"), quantity: 100)
    add_scheduled_meal(current, second, weekday: "monday", position: 1)
    add_scheduled_meal(current, first, weekday: "monday", position: 0)

    home_path = "/menus/home?date=2026-11-16"
    home_before = count_selects { get home_path }
    assert_response :ok
    assert_operator home_before, :<=, 16
    home = response.parsed_body.fetch("data")
    assert_nil home.fetch("next_meal_date")
    day_meals = home.dig("current_menu", "days", 0, "meals")
    assert_equal [first.id, second.id], day_meals.map { |meal| meal.fetch("id") }
    assert_equal ["breakfast"], day_meals.first.fetch("meal_types")
    assert_equal ["monday"], day_meals.first.fetch("preferred_days")
    assert_equal "Rice", day_meals.first.dig("ingredients", 0, "name")
    index_before = count_selects { get "/menus" }
    assert_response :ok

    12.times do |index|
      from = current.from - (index + 1).weeks
      archived = Menu.create!(from: from, to: from + 6.days)
      add_scheduled_meal(archived, first, weekday: "monday")
    end

    assert_equal home_before, count_selects { get home_path }
    assert_response :ok
    assert_equal home, response.parsed_body.fetch("data")
    assert_equal index_before, count_selects { get "/menus" }
    assert_response :ok
    assert_equal 13, response.parsed_body.fetch("data").size
  end

  test "invalid people updates return localized errors and preserve the saved count" do
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 2)
    [0, -1, 1.5, "2.5", "2people", nil, true, [], {}].each do |invalid|
      patch "/menus/#{menu.id}", params: { people_count: invalid },
        headers: { "Accept-Language" => "es" }, as: :json
      assert_response :unprocessable_entity
      assert_equal ["debe ser un número entero positivo"], response.parsed_body.dig("errors", "people_count")
      assert_equal 2, menu.reload.people_count
    end
  end

  test "invalid generation input does not replace the existing week" do
    create_meal_pool_for_generate
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 2)
    travel_to Time.utc(2026, 11, 9, 12) do
      [0, 1.5, nil, [], {}, 2**63, (2**63).to_s].each do |invalid|
        assert_no_difference ["Menu.count", "Day.count", "DailyMeal.count"] do
          post "/menus/generate", params: { people_count: invalid }, as: :json
          assert_response :unprocessable_entity
          assert response.parsed_body.dig("errors", "people_count").present?
        end
        assert_equal 2, menu.reload.people_count
      end
    end
  end

  test "shopping list uses live recipe data and saved people count" do
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 4)
    day = menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday"))
    meal = Meal.create!(name: "Rice", description: "Steamed", servings: 2)
    row = meal.meal_ingredients.create!(ingredient: Ingredient.create!(name: "Rice"),
      unit: Unit.find_or_create_by!(code: "g") { |unit| unit.name = "grams" }, quantity: 100)
    day.daily_meals.create!(meal: meal)

    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_response :ok
    assert_equal({ "menu_id" => menu.id, "people_count" => 4,
      "from" => menu.from.as_json, "to" => menu.to.as_json,
      "categories" => ShoppingCategory.catalog.as_json,
      "items" => [{ "ingredient_id" => row.ingredient_id, "name" => "Rice", "shopping_category" => "uncategorized", "unit" => "g", "quantity" => "200.0", "status" => "calculated", "required_unit" => "g", "required_quantity" => "200.0" }],
      "meals_without_ingredients" => [], "conversion_warnings" => [] }, response.parsed_body.fetch("data"))

    row.update!(quantity: 150)
    meal.update!(servings: 4)
    row.ingredient.update!(name: "White rice", shopping_category: "pantry")
    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_equal "150.0", response.parsed_body.dig("data", "items", 0, "quantity")
    assert_equal "White rice", response.parsed_body.dig("data", "items", 0, "name")
    assert_equal "pantry", response.parsed_body.dig("data", "items", 0, "shopping_category")

    patch "/menus/#{menu.id}", params: { people_count: 2 }, as: :json
    assert_response :ok
    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_equal "75.0", response.parsed_body.dig("data", "items", 0, "quantity")
  end

  test "missing menus return localized errors for shopping lists and updates" do
    id = Menu.maximum(:id).to_i + 1
    get "/menus/#{id}/shopping_list", headers: { "Accept-Language" => "es" }, as: :json
    assert_response :not_found
    assert_equal "No se encontró el menú con id #{id}", response.parsed_body["errors"]
    patch "/menus/#{id}", params: { people_count: 2 }, as: :json
    assert_response :not_found
  end

  private

  def add_scheduled_meal(menu, meal, weekday:, position: 0)
    day = menu.days.find_or_create_by!(weekday: Weekday.find_or_create_by!(name: weekday))
    day.daily_meals.create!(meal: meal, position: position)
  end

  def count_selects
    queries = 0
    subscriber = ->(_name, _started, _finished, _id, payload) do
      queries += 1 if payload[:name] != "SCHEMA" && payload[:sql].match?(/\ASELECT\b/i)
    end
    ActiveSupport::Notifications.subscribed(subscriber, "sql.active_record") { yield }
    queries
  end

  def create_meal_pool_for_generate
    %w[monday tuesday wednesday thursday friday saturday sunday].each { |n| Weekday.find_or_create_by!(name: n) }
    %w[breakfast lunch dinner].each { |d| MealType.find_or_create_by!(description: d) }
    Meal.destroy_all
    %w[breakfast lunch dinner].each do |type_name|
      type = MealType.find_by!(description: type_name)
      7.times do |i|
        meal = Meal.create!(servings: 1, name: "#{type_name}_#{i}_#{SecureRandom.hex(2)}", description: "Desc", recipe_url: "")
        meal.meal_types << type unless meal.meal_types.include?(type)
      end
    end
  end
end
