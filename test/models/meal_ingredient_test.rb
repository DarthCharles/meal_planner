require "test_helper"

class MealIngredientTest < ActiveSupport::TestCase
  test "requires a positive quantity and a unit" do
    meal = Meal.create!(name: "Sopa", description: "Sopa de verduras")
    ingredient = Ingredient.create!(name: "Zanahoria")
    unit = Unit.find_or_create_by!(code: "pieza", name: "pieces")
    meal_ingredient = MealIngredient.new(meal: meal, ingredient: ingredient, unit: unit, quantity: 0)

    assert_not meal_ingredient.valid?
    assert_includes meal_ingredient.errors[:quantity], "must be greater than 0"
    assert_not_nil meal_ingredient.unit
  end
end
