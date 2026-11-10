require "test_helper"

class MealsIngredientsControllerTest < ActionDispatch::IntegrationTest
  setup do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code) { |unit| unit.name = name } }
    %w[monday friday].each { |name| Weekday.find_or_create_by!(name: name) }
  end

  test "lists the shared ingredient catalog in normalized name order" do
    Ingredient.delete_all
    egg = Ingredient.create!(name: "Egg")
    apple = Ingredient.create!(name: "Apple")
    get "/ingredients"
    assert_response :ok
    assert_equal [{ "id" => apple.id, "name" => "Apple", "meals" => [] }, { "id" => egg.id, "name" => "Egg", "meals" => [] }], response.parsed_body["data"]
  end

  test "selects existing ingredients by id and creates new names in the same save" do
    egg = Ingredient.create!(name: "Egg")
    assert_difference "Ingredient.count", 1 do
      post "/meals", params: {
        name: "Breakfast", description: "Egg and potato",
        ingredients: [{ ingredient_id: egg.id, quantity: 2, unit: "pieza" }, { name: "Potato", quantity: 1, unit: "g" }]
      }, as: :json
    end
    assert_response :ok
    assert_equal [egg.id, Ingredient.find_by!(name: "Potato").id], response.parsed_body["data"]["ingredients"].map { |row| row["ingredient_id"] }
  end

  test "reuses existing ingredients for case and whitespace variants" do
    egg = Ingredient.create!(name: "Egg")
    assert_no_difference "Ingredient.count" do
      post "/meals", params: {
        name: "Breakfast", description: "Egg",
        ingredients: [{ name: "  eGG  ", quantity: 2, unit: "pieza" }]
      }, as: :json
    end
    assert_response :ok
    assert_equal egg.id, response.parsed_body.dig("data", "ingredients", 0, "ingredient_id")
  end

  test "invalid ingredient rows return field errors and roll back the entire update" do
    egg = Ingredient.create!(name: "Egg")
    meal = Meal.create!(name: "Breakfast", description: "Original", preferred_days: ["monday"])
    breakfast = MealType.create!(description: "breakfast")
    dinner = MealType.create!(description: "dinner")
    meal.meal_types = [breakfast]
    original = meal.meal_ingredients.create!(ingredient: egg, quantity: 2, unit: Unit.find_by!(code: "pieza"))
    invalid_rows = [
      { ingredient_id: -1, quantity: 1, unit: "g" },
      { ingredient_id: egg.id, name: "Egg", quantity: 1, unit: "g" },
      { name: " ", quantity: 1, unit: "g" },
      { ingredient_id: egg.id, quantity: 0, unit: "g" },
      { ingredient_id: egg.id, quantity: 1, unit: "unknown" },
      { ingredient_id: egg.id, quantity: 1, unit: "g" }
    ]
    invalid_rows.each do |row|
      assert_no_difference ["Ingredient.count", "MealIngredient.count"] do
        put "/meals/#{meal.id}", params: {
          name: "Changed", preferred_days: ["friday"], meal_type_ids: [dinner.id],
          ingredients: [
            { name: "New draft", quantity: 1, unit: "g" },
            { ingredient_id: egg.id, quantity: 1, unit: "g" },
            row
          ]
        }, as: :json
      end
      assert_response :unprocessable_entity
      assert response.parsed_body.dig("errors", "ingredients").present?
      assert_equal "Breakfast", meal.reload.name
      assert_equal ["monday"], meal.preferred_days
      assert_equal [breakfast.id], meal.meal_type_ids
      assert_equal [original.id], meal.meal_ingredients.pluck(:id)
    end
  end

  test "failed creation leaves neither a meal nor draft ingredients" do
    assert_no_difference ["Meal.count", "Ingredient.count"] do
      post "/meals", params: {
        name: "Breakfast", description: "Invalid recipe",
        ingredients: [{ name: "New draft", quantity: 1, unit: "g" }, { name: "Invalid", quantity: -1, unit: "g" }]
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "an empty ingredient array clears the recipe" do
    meal = Meal.create!(name: "Breakfast", description: "Egg")
    meal.meal_ingredients.create!(ingredient: Ingredient.create!(name: "Egg"), quantity: 2, unit: Unit.find_by!(code: "pieza"))
    put "/meals/#{meal.id}", params: { ingredients: [] }, as: :json
    assert_response :ok
    assert_empty meal.reload.meal_ingredients
  end

  test "rejects non-array ingredients" do
    [nil, "Egg", { name: "Egg" }, ["Egg"]].each do |ingredients|
      post "/meals", params: { name: "Breakfast", description: "Egg", ingredients: ingredients }, as: :json
      assert_response :unprocessable_entity
      assert response.parsed_body.dig("errors", "ingredients").present?
    end
  end
end
