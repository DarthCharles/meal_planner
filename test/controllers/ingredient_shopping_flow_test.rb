require "test_helper"

class IngredientShoppingFlowTest < ActionDispatch::IntegrationTest
  test "recipe measures produce a simple grocery checklist through the real API" do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code, name: name) }
    mayo = Ingredient.create!(name: "Flow mayonnaise")
    tuna = Ingredient.create!(name: "Flow tuna")
    onion = Ingredient.create!(name: "Flow onion")
    { mayo => { mode: "package", shopping_unit: "jar", package_quantity: 390, package_unit: "g" },
      tuna => { mode: "package", shopping_unit: "can", package_quantity: 140, package_unit: "g" },
      onion => { mode: "piece", shopping_unit: "piece" } }.each do |ingredient, attributes|
      put "/ingredients/#{ingredient.id}/shopping_profile", params: attributes, as: :json
      assert_response :ok
    end
    post "/meals", params: { name: "Tuna salad", description: "Recipe", servings: 2, ingredients: [
      { ingredient_id: mayo.id, quantity: "½", unit: "cup" },
      { ingredient_id: mayo.id, quantity: 2, unit: "tablespoon" },
      { ingredient_id: tuna.id, quantity: 1, unit: "can" },
      { ingredient_id: onion.id, quantity: "1/2", unit: "piece" }
    ] }, as: :json
    assert_response :ok
    meal = Meal.find(response.parsed_body.dig("data", "id"))
    assert_equal 4, meal.meal_ingredients.count
    assert_nil response.parsed_body.dig("data", "ingredients", 2, "package_quantity")
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 6)
    menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday")).daily_meals.create!(meal: meal)
    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_response :ok
    items = response.parsed_body.dig("data", "items").index_by { |item| item["ingredient_id"] }
    assert_equal [nil, nil, "unquantified"], items[mayo.id].values_at("unit", "quantity", "status")
    assert_equal [nil, nil, "unquantified"], items[tuna.id].values_at("unit", "quantity", "status")
    assert_equal 3, items.size
    assert_equal ["piece", "2"], items[onion.id].values_at("unit", "quantity")
    assert_empty response.parsed_body.dig("data", "conversion_warnings")
    patch "/ingredients/#{tuna.id}/shopping_profile", params: {
      mode: "package", shopping_unit: "can", package_quantity: 100, package_unit: "g"
    }, as: :json
    assert_response :ok
    get "/menus/#{menu.id}/shopping_list", as: :json
    item = response.parsed_body.dig("data", "items").find { |entry| entry["ingredient_id"] == tuna.id }
    assert_equal [nil, nil, "unquantified"], item.values_at("unit", "quantity", "status")
    assert_nil meal.meal_ingredients.find_by!(ingredient: tuna).package_quantity
    get "/ingredients", as: :json
    assert_equal 1, response.parsed_body["data"].find { |entry| entry["id"] == mayo.id }["meals"].size
  end

  test "a simple buying weight combines recipe pieces and grams in the actual shopping endpoint" do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code, name: name) }
    chicken = Ingredient.create!(name: "Chicken with buying weight")
    put "/ingredients/#{chicken.id}/shopping_profile", params: {
      mode: "bulk", shopping_unit: "g", piece_weight: { quantity: 272 }
    }, as: :json
    assert_response :ok
    meal = Meal.create!(name: "Chicken recipe", description: "Mixed recipe measures", servings: 1)
    meal.meal_ingredients.create!(ingredient: chicken, unit: Unit.find_by!(code: "piece"), quantity: 2)
    meal.meal_ingredients.create!(ingredient: chicken, unit: Unit.find_by!(code: "g"), quantity: 100)
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 1)
    menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday")).daily_meals.create!(meal: meal)
    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_response :ok
    assert_equal ["g", "644.0"], response.parsed_body.fetch("data").fetch("items").sole.values_at("unit", "quantity")
    put "/ingredients/#{chicken.id}/shopping_profile", params: {
      mode: "bulk", shopping_unit: "g", piece_weight: nil
    }, as: :json
    assert_response :ok
    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_response :ok
    assert_nil response.parsed_body.dig("data", "items", 0, "quantity")
    assert_equal [2, 100], meal.meal_ingredients.ordered.pluck(:quantity)
  end
end
