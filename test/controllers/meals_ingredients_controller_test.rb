require "test_helper"

class MealsIngredientsControllerTest < ActionDispatch::IntegrationTest
  setup do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code) { |unit| unit.name = name } }
  end

  test "creates a meal with ingredients" do
    post "/meals", params: {
      name: "Tacos de pollo",
      description: "Tacos con verduras",
      ingredients: [
        { name: "  Pollo ", quantity: 500, unit: "g", preparation_note: "En cubos" },
        { name: "Tortilla", quantity: 12, unit: "pieza" }
      ]
    }, as: :json

    assert_response :ok
    meal = Meal.find(response.parsed_body.dig("data", "id"))
    assert_equal %w[Pollo Tortilla], meal.meal_ingredients.map { |item| item.ingredient.name }
    assert_equal "pollo", Ingredient.find_by(name: "Pollo").normalized_name
  end

  test "replaces ingredients when updating a meal with ingredients" do
    meal = Meal.create!(name: "Ensalada", description: "Ensalada verde")
    meal.meal_ingredients.create!(ingredient: Ingredient.create!(name: "Lechuga"), quantity: 1, unit: Unit.find_by!(code: "pieza"))

    put "/meals/#{meal.id}", params: {
      name: meal.name,
      description: meal.description,
      ingredients: [{ name: "Pepino", quantity: 2, unit: "pieza" }]
    }, as: :json

    assert_response :ok
    assert_equal ["Pepino"], meal.reload.meal_ingredients.map { |item| item.ingredient.name }
  end
end
