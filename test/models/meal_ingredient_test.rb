require "test_helper"

class MealIngredientTest < ActiveSupport::TestCase
  test "rejects zero quantity" do
    meal = Meal.create!(servings: 1, name: "Sopa", description: "Sopa de verduras")
    ingredient = Ingredient.create!(name: "Zanahoria")
    unit = Unit.find_or_create_by!(code: "piece", name: "pieces")
    meal_ingredient = MealIngredient.new(meal: meal, ingredient: ingredient, unit: unit, quantity: 0)

    assert_not meal_ingredient.valid?
    assert_includes meal_ingredient.errors[:quantity], "must be greater than 0"
  end

  test "package requirements use the ingredient presentation" do
    meal = Meal.create!(name: "Tuna", description: "Test", servings: 1)
    tuna = Ingredient.create!(name: "Tuna")
    package = Unit.find_or_create_by!(code: "package")
    row = meal.meal_ingredients.build(ingredient: tuna, quantity: "0.5", unit: package)
    assert_nil row.requirement

    IngredientShoppingProfileSaveService.new.call(ingredient: tuna, attributes: {
      mode: "package", shopping_unit: Unit.find_or_create_by!(code: "can").code,
      package_quantity: 140, package_unit: Unit.find_or_create_by!(code: "g").code
    })
    assert_equal [Rational(70), "g"], row.requirement
  end
end
