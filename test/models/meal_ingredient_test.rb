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

  test "package ingredients require contents and ordinary measures reject them" do
    meal = Meal.create!(name: "Canned tuna", description: "Test", servings: 1)
    tuna = Ingredient.create!(name: "Tuna")
    can = Unit.find_or_create_by!(code: "can")
    grams = Unit.find_or_create_by!(code: "g")
    row = meal.meal_ingredients.build(ingredient: tuna, quantity: 1, unit: can)
    assert_not row.valid?
    row.assign_attributes(package_quantity: 140, package_unit: grams)
    assert row.valid?
    assert_equal [Rational(140), "g"], row.requirement
    row.unit = grams
    assert_not row.valid?
  end

end
