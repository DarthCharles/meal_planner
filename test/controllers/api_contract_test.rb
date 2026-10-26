require "test_helper"

# Characterize the existing JSON API before upgrading Rails and its defaults.
class ApiContractTest < ActionDispatch::IntegrationTest
  setup do
    @breakfast = MealType.find_or_create_by!(description: "breakfast")
    @dinner = MealType.find_or_create_by!(description: "dinner")
    @unit = Unit.find_or_create_by!(code: "pieza") { |unit| unit.name = "pieces" }
    @meal = Meal.create!(name: "Avena", description: "Con leche", recipe_url: nil)
    @meal.meal_types << @breakfast
  end

  test "meal list and detail preserve fields, decimal strings, and ingredient order" do
    later = @meal.meal_ingredients.create!(
      ingredient: Ingredient.create!(name: "Plátano"), unit: @unit,
      quantity: "0.125", position: 2, preparation_note: "rebanado"
    )
    earlier = @meal.meal_ingredients.create!(
      ingredient: Ingredient.create!(name: "Manzana"), unit: @unit,
      quantity: 1, position: 0
    )
    expected = {
      "id" => @meal.id, "name" => "Avena", "description" => "Con leche",
      "recipe_url" => nil, "meal_types" => ["breakfast"],
      "ingredients" => [
        { "id" => earlier.id, "ingredient_id" => earlier.ingredient_id,
          "name" => "Manzana", "quantity" => "1.0", "unit" => "pieza",
          "preparation_note" => nil, "position" => 0 },
        { "id" => later.id, "ingredient_id" => later.ingredient_id,
          "name" => "Plátano", "quantity" => "0.125", "unit" => "pieza",
          "preparation_note" => "rebanado", "position" => 2 }
      ]
    }

    get "/meals/#{@meal.id}", as: :json
    assert_response :ok
    assert_equal({ "data" => expected }, response.parsed_body)

    get "/meals", as: :json
    assert_response :ok
    assert_includes response.parsed_body.fetch("data"), expected
  end

  test "meal writes accept nested ingredients and replace meal types" do
    post "/meals", params: {
      name: "Tacos", description: "Con verduras", meal_type_ids: [@breakfast.id],
      ingredients: [{ name: "  Zanahoria  ", quantity: "0.25", unit: "PIEZA" }]
    }, as: :json
    assert_response :ok
    created = response.parsed_body.fetch("data")
    assert_equal ["breakfast"], created.fetch("meal_types")
    assert_equal "Zanahoria", created.fetch("ingredients").first.fetch("name")
    assert_equal "0.25", created.fetch("ingredients").first.fetch("quantity")

    put "/meals/#{created.fetch('id')}", params: {
      name: "Tacos actualizados", meal_type_ids: [@dinner.id], ingredients: []
    }, as: :json
    assert_response :ok
    updated = response.parsed_body.fetch("data")
    assert_equal "Tacos actualizados", updated.fetch("name")
    assert_equal "Con verduras", updated.fetch("description")
    assert_equal ["dinner"], updated.fetch("meal_types")
    assert_equal [], updated.fetch("ingredients")
  end

  test "omitting associations on update preserves them" do
    @meal.meal_ingredients.create!(
      ingredient: Ingredient.create!(name: "Avena"), unit: @unit, quantity: 1
    )
    put "/meals/#{@meal.id}", params: { description: "Sin leche" }, as: :json
    assert_response :ok
    assert_equal ["breakfast"], response.parsed_body.dig("data", "meal_types")
    assert_equal 1, response.parsed_body.dig("data", "ingredients").length
  end

  test "invalid meal creates and updates return field errors without saving" do
    assert_no_difference "Meal.count" do
      post "/meals", params: { name: "", description: "" }, as: :json
    end
    assert_response :unprocessable_entity
    assert_equal ["can't be blank"], response.parsed_body.dig("errors", "name")
    assert_equal ["can't be blank"], response.parsed_body.dig("errors", "description")

    put "/meals/#{@meal.id}", params: { name: "" }, as: :json
    assert_response :unprocessable_entity
    assert_equal ["can't be blank"], response.parsed_body.dig("errors", "name")
    assert_equal "Avena", @meal.reload.name
  end

  test "deleting a meal removes joins and returns a boolean" do
    @meal.meal_ingredients.create!(
      ingredient: Ingredient.create!(name: "Avena"), unit: @unit, quantity: 1
    )
    assert_difference "Meal.count", -1 do
      delete "/meals/#{@meal.id}", as: :json
    end
    assert_response :ok
    assert_equal({ "data" => true }, response.parsed_body)
    assert_empty MealIngredient.where(meal_id: @meal.id)
    assert_empty MealMealType.where(meal_id: @meal.id)
  end

  test "missing meal and menu reads return string errors" do
    %w[meals menus].each do |resource|
      get "/#{resource}/0", as: :json
      assert_response :not_found
      assert_equal "#{resource.singularize.capitalize} with id 0 not found",
        response.parsed_body.fetch("errors")
    end
  end

  test "reference endpoints preserve meal type tuples and sorted unit objects" do
    get "/meal_types", as: :json
    assert_response :ok
    assert_includes response.parsed_body.fetch("data"), ["breakfast", @breakfast.id]

    get "/units", as: :json
    assert_response :ok
    units = response.parsed_body.fetch("data")
    assert_includes units, { "code" => "pieza", "name" => "pieces" }
    assert_equal units.map { |unit| unit.fetch("code") }.sort,
      units.map { |unit| unit.fetch("code") }
  end

  test "day creation and menu reads preserve nested ordering and UTC timestamps" do
    menu = Menu.create!(from: Time.utc(2026, 10, 26), to: Time.utc(2026, 11, 1, 23, 59, 59))
    weekday = Weekday.find_or_create_by!(name: "monday")
    post "/days", params: {
      menu_id: menu.id, weekday_id: weekday.id
    }, as: :json
    assert_response :ok
    day = response.parsed_body.fetch("data")
    assert_equal "monday", day.fetch("weekday")
    assert_equal [], day.fetch("meals")
    DailyMeal.create!(day_id: day.fetch("id"), meal: @meal, position: 0)

    second = Meal.create!(name: "Sopa", description: "Verduras")
    DailyMeal.create!(day_id: day.fetch("id"), meal: second, position: -1)
    get "/menus/#{menu.id}", as: :json
    assert_response :ok
    expected = response.parsed_body.fetch("data")
    assert_equal %w[created_at days from id to], expected.keys.sort
    assert_equal "2026-10-26T00:00:00.000Z", expected.fetch("from")
    assert_equal "2026-11-01T23:59:59.000Z", expected.fetch("to")
    assert_equal menu.created_at.iso8601(3), expected.fetch("created_at")
    assert_equal [second.id, @meal.id], expected.fetch("days").first.fetch("meals").map { |meal| meal.fetch("id") }

    get "/menus", as: :json
    assert_response :ok
    assert_includes response.parsed_body.fetch("data"), expected
  end

  test "invalid day returns association validation errors" do
    post "/days", params: {}, as: :json
    assert_response :unprocessable_entity
    assert_equal ["must exist"], response.parsed_body.dig("errors", "menu")
    assert_equal ["must exist"], response.parsed_body.dig("errors", "weekday")
  end

  test "CORS preflight permits the local React client" do
    process :options, "/meals", headers: {
      "Origin" => "http://127.0.0.1:5173",
      "Access-Control-Request-Method" => "PUT",
      "Access-Control-Request-Headers" => "content-type"
    }
    assert_response :success
    assert_equal "http://127.0.0.1:5173", response.headers["Access-Control-Allow-Origin"]
    assert_includes response.headers.fetch("Access-Control-Allow-Methods"), "PUT"
  end
end
