require "test_helper"

class MenuShoppingListServiceTest < ActiveSupport::TestCase
  setup do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code, name: name) }
    @menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 1)
    @monday = @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday"))
    @tuesday = @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "tuesday"))
  end

  test "mixed recipe measures produce one packaged grocery without asking for conversions" do
    mayo = ingredient("Mayonnaise", mode: "package", shopping_unit: "jar", package_quantity: 250, package_unit: "g")
    meal = recipe(mayo, [[10, "g"], [1, "tablespoon"], [0.5, "cup"]])
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    assert_name_only result[:items].sole, mayo
    assert_empty result[:conversion_warnings]
    assert_empty mayo.measurement_references
    # A density reference makes all recipe measures convertible to package contents.
    reference(mayo, "density", 13, basis: 15)
    assert_equal ["jar", "2", "approximate"], result[:items].sole.values_at(:unit, :quantity, :status)
  end

  test "known package contents calculate a purchase count from recipe weight" do
    mayo = ingredient("Mayonnaise", mode: "package", shopping_unit: "jar")
    meal = recipe(mayo, [[500, "g"]])
    @monday.daily_meals.create!(meal: meal)
    assert_name_only result[:items].sole, mayo
    mayo.shopping_profile.update!(package_quantity: 250, package_unit: unit("g"))
    assert_equal ["jar", "2"], result[:items].sole.values_at(:unit, :quantity)
    assert_equal 500, meal.meal_ingredients.sole.quantity
  end

  test "pieces round up only after all scheduled recipe quantities are added" do
    onion = ingredient("Onion", mode: "piece", shopping_unit: "piece")
    meal = recipe(onion, [[0.25, "piece"]])
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    assert_equal ["piece", "1", "0.5"], result[:items].sole.values_at(:unit, :quantity, :required_quantity)
    meal.meal_ingredients.sole.update!(quantity: 1.2)
    assert_equal ["piece", "3", "2.4"], result[:items].sole.values_at(:unit, :quantity, :required_quantity)
  end

  test "scales compatible weights by servings and sums occurrences before display rounding" do
    chicken = ingredient("Chicken", mode: "bulk", shopping_unit: "kg")
    meal = recipe(chicken, [[0.5, "kg"], [300, "g"]], servings: 4)
    @menu.update!(people_count: 2)
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    other = Menu.create!(from: Time.utc(2026, 11, 23), to: Time.utc(2026, 11, 29))
    other.days.create!(weekday: @monday.weekday).daily_meals.create!(meal: meal)
    assert_equal ["g", "800.0"], result[:items].sole.values_at(:unit, :quantity)
  end

  test "culinary volumes combine without requiring ingredient references" do
    oil = Ingredient.create!(name: "Oil")
    @monday.daily_meals.create!(meal: recipe(oil, [[1, "tablespoon"], [3, "teaspoon"], [0.5, "cup"]]))
    assert_equal ["ml", "150.0"], result[:items].sole.values_at(:unit, :quantity)
    assert_empty oil.measurement_references
  end

  test "unresolved mixed dimensions stay as one name instead of separate partial purchases" do
    tomato = Ingredient.create!(name: "Tomato")
    meal = recipe(tomato, [[200, "g"], [2, "piece"]])
    @monday.daily_meals.create!(meal: meal)
    assert_name_only result[:items].sole, tomato
    assert_empty result[:conversion_warnings]
    # Every source quantity is still present in its recipe.
    assert_equal [200, 2], meal.meal_ingredients.ordered.pluck(:quantity)
  end

  test "a configured target with a missing bridge stays name only even for one source unit" do
    onion = ingredient("Onion", mode: "piece", shopping_unit: "piece")
    @monday.daily_meals.create!(meal: recipe(onion, [[30, "g"]]))
    assert_name_only result[:items].sole, onion
    reference(onion, "piece_weight", 150)
    assert_equal ["piece", "1", "0.2", "approximate"], result[:items].sole.values_at(:unit, :quantity, :required_quantity, :status)
  end

  test "unknown recipe container contents do not fail or discard other ingredients" do
    tuna = Ingredient.create!(name: "Tuna")
    tomato = Ingredient.create!(name: "Tomato")
    meal = recipe(tuna, [[1, "can"], [10, "g"]])
    meal.meal_ingredients.create!(ingredient: tomato, unit: unit("piece"), quantity: 2)
    @monday.daily_meals.create!(meal: meal)
    items = result[:items].index_by { |item| item[:ingredient_id] }
    assert_equal 2, items.size
    assert_name_only items.fetch(tuna.id), tuna
    assert_equal "2", items.fetch(tomato.id)[:quantity]
  end

  test "recipe package contents remain independent of the buying presentation" do
    tuna = ingredient("Tuna", mode: "package", shopping_unit: "can", package_quantity: 140, package_unit: "g")
    meal = recipe(tuna, [[1, "can", 140, "g"], [0.5, "can", 280, "g"]])
    @monday.daily_meals.create!(meal: meal)
    assert_equal ["can", "2"], result[:items].sole.values_at(:unit, :quantity)
    tuna.shopping_profile.update!(package_quantity: 100)
    assert_equal ["can", "3"], result[:items].sole.values_at(:unit, :quantity)
    assert_equal [140, 280], meal.meal_ingredients.ordered.pluck(:package_quantity)
    tuna.shopping_profile.destroy!
    assert_equal ["g", "280.0"], result[:items].sole.values_at(:unit, :quantity)
  end

  test "one recipe can stays one can with or without buying contents or a profile" do
    tuna = ingredient("Tuna", mode: "package", shopping_unit: "can")
    meal = recipe(tuna, [[1, "can"]])
    @monday.daily_meals.create!(meal: meal)
    assert_equal ["can", "1"], result[:items].sole.values_at(:unit, :quantity)
    tuna.shopping_profile.update!(package_quantity: 140, package_unit: unit("g"))
    assert_equal ["can", "1"], result[:items].sole.values_at(:unit, :quantity)
    meal.meal_ingredients.sole.update!(package_quantity: 140, package_unit: unit("g"))
    assert_equal ["can", "1"], result[:items].sole.values_at(:unit, :quantity)
    tuna.shopping_profile.destroy!
    assert_equal ["can", "1"], result[:items].sole.values_at(:unit, :quantity)
  end

  test "container counts scale by people and servings and round after all occurrences" do
    tuna = ingredient("Tuna", mode: "package", shopping_unit: "can")
    meal = recipe(tuna, [[1, "can"]], servings: 4)
    @menu.update!(people_count: 2)
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    assert_equal ["can", "1", "1.0"], result[:items].sole.values_at(:unit, :quantity, :required_quantity)
    tuna.shopping_profile.destroy!
    assert_equal ["can", "1", "1.0"], result[:items].sole.values_at(:unit, :quantity, :required_quantity)
  end

  test "unknown counts combine with convertible weight but never imply a different container" do
    tuna = ingredient("Tuna", mode: "package", shopping_unit: "can", package_quantity: 140, package_unit: "g")
    meal = recipe(tuna, [[1, "can"], [70, "g"]])
    @monday.daily_meals.create!(meal: meal)
    assert_equal ["can", "2", "1.5"], result[:items].sole.values_at(:unit, :quantity, :required_quantity)
    tuna.shopping_profile.update!(shopping_unit: unit("jar"))
    assert_name_only result[:items].sole, tuna
  end

  test "metric display preserves positive tiny needs and rounds only the total" do
    flour = Ingredient.create!(name: "Flour")
    salt = Ingredient.create!(name: "Salt")
    meal = recipe(flour, [[1, "g"]], servings: 3)
    meal.meal_ingredients.create!(ingredient: salt, unit: unit("g"), quantity: "0.000001")
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    assert_equal ["0.667", "0.001"], result[:items].map { |item| item[:quantity] }
  end

  test "empty menus and recipes without ingredient rows remain explicit" do
    assert_empty result[:items]
    meal = Meal.create!(name: "Empty recipe", description: "No ingredients yet", servings: 1)
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    assert_equal [{ id: meal.id, name: meal.name }], result[:meals_without_ingredients]
    assert_empty result[:items]
  end

  test "sorts categories and keeps different ingredient identities separate" do
    first = Ingredient.create!(name: "Zucchini", shopping_category: "produce")
    second = Ingredient.create!(name: "Apples", shopping_category: "frozen")
    meal = recipe(first, [[1, "g"]])
    meal.meal_ingredients.create!(ingredient: second, unit: unit("g"), quantity: 1)
    @monday.daily_meals.create!(meal: meal)
    assert_equal %w[Zucchini Apples], result[:items].map { |item| item[:name] }
    assert_equal ShoppingCategory.catalog, result[:categories]
  end

  private

  def assert_name_only(item, ingredient)
    assert_equal ingredient.id, item[:ingredient_id]
    assert_equal ingredient.name, item[:name]
    assert_equal "unquantified", item[:status]
    assert_nil item[:quantity]
    assert_nil item[:unit]
    assert_nil item[:required_quantity]
    assert_nil item[:required_unit]
  end

  def unit(code)
    Unit.find_by!(code: code)
  end

  def ingredient(name, **attributes)
    ingredient = Ingredient.create!(name: name)
    IngredientShoppingProfileSaveService.new.call(ingredient: ingredient, attributes: attributes)
    ingredient
  end

  def reference(ingredient, kind, quantity, basis: 1)
    ingredient.measurement_references.create!(kind: kind, quantity: quantity, reference_quantity: basis,
      source: "Synthetic test reference", description: "Test conversion", approximate: true)
  end

  def recipe(ingredient, rows, servings: 1)
    meal = Meal.create!(name: "Recipe #{Meal.count}", description: "Test recipe", servings: servings)
    rows.each do |quantity, code, package_quantity, package_code|
      meal.meal_ingredients.create!(ingredient: ingredient, quantity: quantity, unit: unit(code),
        package_quantity: package_quantity, package_unit: package_code && unit(package_code))
    end
    meal
  end

  def result
    MenuShoppingListService.new.call(menu: @menu)
  end
end
