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
      "items" => [{ "ingredient_id" => row.ingredient_id, "name" => "Rice", "unit" => "g", "quantity" => "200.0" }],
      "meals_without_ingredients" => [] }, response.parsed_body.fetch("data"))

    row.update!(quantity: 150)
    meal.update!(servings: 4)
    row.ingredient.update!(name: "White rice")
    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_equal "150.0", response.parsed_body.dig("data", "items", 0, "quantity")
    assert_equal "White rice", response.parsed_body.dig("data", "items", 0, "name")

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

  def create_meal_pool_for_generate
    %w[monday tuesday wednesday thursday friday saturday sunday].each { |n| Weekday.find_or_create_by!(name: n) }
    %w[breakfast lunch dinner].each { |d| MealType.find_or_create_by!(description: d) }
    Meal.destroy_all
    %w[breakfast lunch dinner].each do |type_name|
      type = MealType.find_by!(description: type_name)
      7.times do |i|
        meal = Meal.create!(name: "#{type_name}_#{i}_#{SecureRandom.hex(2)}", description: "Desc", recipe_url: "")
        meal.meal_types << type unless meal.meal_types.include?(type)
      end
    end
  end
end
