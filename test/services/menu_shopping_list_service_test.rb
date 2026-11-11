require "test_helper"

class MenuShoppingListServiceTest < ActiveSupport::TestCase
  setup do
    @menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 3)
    @monday = @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday"))
    @tuesday = @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "tuesday"))
    @grams = Unit.find_or_create_by!(code: "g") { |unit| unit.name = "grams" }
  end

  test "scales each occurrence and sums shared ingredients without merging units or identities" do
    rice = Ingredient.create!(name: "Rice")
    other_rice = Ingredient.create!(name: "Brown rice")
    kilograms = Unit.find_or_create_by!(code: "kg") { |unit| unit.name = "kilograms" }
    first = Meal.create!(name: "First", description: "Recipe", servings: 2)
    second = Meal.create!(name: "Second", description: "Recipe", servings: 3)
    third = Meal.create!(name: "Third", description: "Recipe")
    first.meal_ingredients.create!(ingredient: rice, unit: @grams, quantity: "0.1", preparation_note: "cooked")
    second.meal_ingredients.create!(ingredient: rice, unit: @grams, quantity: "0.2")
    third.meal_ingredients.create!(ingredient: rice, unit: kilograms, quantity: "0.5")
    third.meal_ingredients.create!(ingredient: other_rice, unit: @grams, quantity: "10")
    @monday.daily_meals.create!(meal: first)
    @tuesday.daily_meals.create!(meal: first)
    @monday.daily_meals.create!(meal: second, position: 1)
    @monday.daily_meals.create!(meal: third, position: 2)
    # Other menus must not contribute to the totals.
    other = Menu.create!(from: Time.utc(2026, 11, 23), to: Time.utc(2026, 11, 29))
    other.days.create!(weekday: @monday.weekday).daily_meals.create!(meal: first)

    items = MenuShoppingListService.new.call(menu: @menu).fetch(:items)
    assert_equal [[other_rice.id, "g", "30.0"], [rice.id, "g", "0.5"], [rice.id, "kg", "1.5"]],
      items.map { |item| item.values_at(:ingredient_id, :unit, :quantity) }
  end

  test "rounds only final totals and keeps tiny positive requirements visible" do
    meal = Meal.create!(name: "Thirds", description: "Recipe", servings: 9)
    meal.meal_ingredients.create!(ingredient: Ingredient.create!(name: "Flour"), unit: @grams, quantity: 1)
    meal.meal_ingredients.create!(ingredient: Ingredient.create!(name: "Salt"), unit: @grams, quantity: "0.001")
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    items = MenuShoppingListService.new.call(menu: @menu).fetch(:items)
    assert_equal ["0.667", "0.001"], items.map { |item| item[:quantity] }
  end

  test "empty menus return empty lists and repeated missing recipes are reported once" do
    assert_equal [], MenuShoppingListService.new.call(menu: @menu).fetch(:items)
    assert_equal [], MenuShoppingListService.new.call(menu: @menu).fetch(:meals_without_ingredients)
    meal = Meal.create!(name: "Unspecified", description: "Recipe")
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    result = MenuShoppingListService.new.call(menu: @menu)
    assert_empty result[:items]
    assert_equal [{ id: meal.id, name: meal.name }], result[:meals_without_ingredients]
  end
end
