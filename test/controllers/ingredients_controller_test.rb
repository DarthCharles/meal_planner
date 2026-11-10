require "test_helper"

class IngredientsControllerTest < ActionDispatch::IntegrationTest
  test "creates a standalone ingredient with a trimmed name" do
    assert_difference "Ingredient.count", 1 do
      post "/ingredients", params: { name: "  Standalone onion  " }, as: :json
    end
    assert_response :created
    ingredient = Ingredient.find_by!(normalized_name: "standalone onion")
    assert_equal({ "id" => ingredient.id, "name" => "Standalone onion", "meals" => [] }, response.parsed_body["data"])
    assert_empty ingredient.meals
  end

  test "rejects blank and duplicate names on create and update" do
    ingredient = Ingredient.create!(name: "Catalog egg")
    other = Ingredient.create!(name: "Catalog onion")
    ["", "  ", " CATALOG EGG "].each do |name|
      assert_no_difference "Ingredient.count" do
        post "/ingredients", params: { name: name }, as: :json
      end
      assert_response :unprocessable_entity
      assert response.parsed_body.dig("errors", "name").present?

      put "/ingredients/#{other.id}", params: { name: name }, as: :json
      assert_response :unprocessable_entity
      assert response.parsed_body.dig("errors", "name").present?
      assert_equal "Catalog onion", other.reload.name
    end
    assert_equal "Catalog egg", ingredient.reload.name
  end

  test "renames a shared ingredient without changing recipe quantities or identity" do
    ingredient = Ingredient.create!(name: "Catalog tomato")
    unit = Unit.find_or_create_by!(code: "g") { |record| record.name = "grams" }
    meal = Meal.create!(name: "Soup", description: "Tomato soup")
    row = meal.meal_ingredients.create!(ingredient: ingredient, unit: unit, quantity: 150, preparation_note: "diced")
    patch "/ingredients/#{ingredient.id}", params: { name: "  Catalog cherry tomato  " }, as: :json
    assert_response :ok
    assert_equal({ "id" => ingredient.id, "name" => "Catalog cherry tomato", "meals" => [{ "id" => meal.id, "name" => meal.name }] }, response.parsed_body["data"])
    get "/meals/#{meal.id}"
    assert_response :ok
    saved = response.parsed_body.dig("data", "ingredients", 0)
    assert_equal "Catalog cherry tomato", saved["name"]
    assert_equal ingredient.id, saved["ingredient_id"]
    assert_equal row.id, saved["id"]
    assert_equal "diced", saved["preparation_note"]
    assert_equal 150, row.reload.quantity
    assert_equal unit.id, row.unit_id
  end

  test "returns a JSON error for a missing ingredient" do
    put "/ingredients/-1", params: { name: "Missing" }, as: :json
    assert_response :not_found
    assert_equal "Ingredient not found", response.parsed_body["errors"]
  end

  test "catalog lists every meal using an ingredient in name order" do
    ingredient = Ingredient.create!(name: "Usage onion")
    unit = Unit.find_or_create_by!(code: "g") { |record| record.name = "grams" }
    soup = Meal.create!(name: "Soup", description: "Onion soup")
    pasta = Meal.create!(name: "Pasta", description: "Onion pasta")
    [soup, pasta].each { |meal| meal.meal_ingredients.create!(ingredient: ingredient, unit: unit, quantity: 100) }
    get "/ingredients"
    assert_response :ok
    entry = response.parsed_body["data"].find { |row| row["id"] == ingredient.id }
    assert_equal [{ "id" => pasta.id, "name" => pasta.name }, { "id" => soup.id, "name" => soup.name }], entry["meals"]
  end

  test "deletes an unused ingredient and removes it from the catalog" do
    ingredient = Ingredient.create!(name: "Unused catalog onion")

    assert_difference "Ingredient.count", -1 do
      delete "/ingredients/#{ingredient.id}", as: :json
    end
    assert_response :ok
    assert_equal({ "data" => true }, response.parsed_body)

    get "/ingredients"
    assert_response :ok
    assert_not response.parsed_body["data"].any? { |row| row["id"] == ingredient.id }
  end

  test "rejects deletion of an ingredient used by a meal and preserves the recipe" do
    ingredient = Ingredient.create!(name: "Used catalog onion")
    unit = Unit.find_or_create_by!(code: "g") { |record| record.name = "grams" }
    meal = Meal.create!(name: "Onion soup", description: "Soup with onions")
    row = meal.meal_ingredients.create!(ingredient: ingredient, unit: unit, quantity: 100, preparation_note: "diced")

    assert_no_difference ["Ingredient.count", "Meal.count", "MealIngredient.count"] do
      delete "/ingredients/#{ingredient.id}", as: :json
    end
    assert_response :unprocessable_entity
    assert_equal "Cannot delete an ingredient used by meals. Remove it from those meals first.", response.parsed_body["errors"]
    assert_equal ingredient.id, row.reload.ingredient_id
    assert_equal 100, row.quantity
    assert_equal "diced", row.preparation_note
  end

  test "deleting a missing ingredient returns a JSON error" do
    assert_no_difference "Ingredient.count" do
      delete "/ingredients/-1", as: :json
    end
    assert_response :not_found
    assert_equal({ "errors" => "Ingredient not found" }, response.parsed_body)
  end
end
