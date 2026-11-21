require "test_helper"

class IngredientShoppingFlowTest < ActionDispatch::IntegrationTest
  test "recipe measures and explicit cans produce shopping quantities through the real API" do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code, name: name) }
    mayo = Ingredient.create!(name: "Flow mayonnaise")
    tuna = Ingredient.create!(name: "Flow tuna")
    onion = Ingredient.create!(name: "Flow onion")
    put "/ingredients/#{mayo.id}/measurement_references", params: { references: [{
      kind: "density", quantity: 13, reference_quantity: 15,
      source: "Synthetic test reference", description: "13 g per 15 ml", approximate: true
    }] }, as: :json
    assert_response :ok
    { mayo => { mode: "package", shopping_unit: "jar", package_quantity: 390, package_unit: "g" },
      tuna => { mode: "package", shopping_unit: "can", package_quantity: 140, package_unit: "g" },
      onion => { mode: "piece", shopping_unit: "piece" } }.each do |ingredient, attributes|
      put "/ingredients/#{ingredient.id}/shopping_profile", params: attributes, as: :json
      assert_response :ok
    end
    post "/meals", params: { name: "Tuna salad", description: "Recipe", servings: 2, ingredients: [
      { ingredient_id: mayo.id, quantity: "½", unit: "cup" },
      { ingredient_id: mayo.id, quantity: 2, unit: "tablespoon" },
      { ingredient_id: tuna.id, quantity: 1, unit: "can", package_quantity: 140, package_unit: "g" },
      { ingredient_id: onion.id, quantity: "1/2", unit: "piece" }
    ] }, as: :json
    assert_response :ok
    meal = Meal.find(response.parsed_body.dig("data", "id"))
    assert_equal 4, meal.meal_ingredients.count
    assert_equal "140.0", response.parsed_body.dig("data", "ingredients", 2, "package_quantity")
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 6)
    menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday")).daily_meals.create!(meal: meal)
    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_response :ok
    items = response.parsed_body.dig("data", "items").index_by { |item| item["ingredient_id"] }
    assert_equal ["jar", "1", "390.0"], items[mayo.id].values_at("unit", "quantity", "required_quantity")
    assert_equal ["can", "3"], items[tuna.id].values_at("unit", "quantity")
    assert_equal ["piece", "2"], items[onion.id].values_at("unit", "quantity")
    assert_empty response.parsed_body.dig("data", "conversion_warnings")
    patch "/ingredients/#{tuna.id}/shopping_profile", params: {
      mode: "package", shopping_unit: "can", package_quantity: 100, package_unit: "g"
    }, as: :json
    assert_response :ok
    get "/menus/#{menu.id}/shopping_list", as: :json
    item = response.parsed_body.dig("data", "items").find { |entry| entry["ingredient_id"] == tuna.id }
    assert_equal ["can", "5", "420.0"], item.values_at("unit", "quantity", "required_quantity")
    assert_equal 140, meal.meal_ingredients.find_by!(ingredient: tuna).package_quantity
    get "/ingredients", as: :json
    assert_equal 1, response.parsed_body["data"].find { |entry| entry["id"] == mayo.id }["meals"].size
  end
end
