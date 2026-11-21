require "test_helper"

class MenuShoppingListServiceTest < ActiveSupport::TestCase
  setup do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code, name: name) }
    @menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 1)
    @monday = @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday"))
    @tuesday = @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "tuesday"))
  end

  test "combines all culinary measures using one reference before rounding jars" do
    mayonnaise = ingredient("Mayonnaise", mode: "package", shopping_unit: "jar", package_quantity: 390, package_unit: "g")
    reference(mayonnaise, "density", 13, basis: 15)
    # 1 tbsp + 3 tsp + half a cup = 150 ml = 130 g, repeated three times = exactly 390 g.
    meal = recipe(mayonnaise, [[1, "tablespoon"], [3, "teaspoon"], [0.5, "cup"]])
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "wednesday")).daily_meals.create!(meal: meal)
    item = result[:items].sole
    assert_equal ["jar", "1", "390.0", "g", "approximate"], item.values_at(:unit, :quantity, :required_quantity, :required_unit, :status)
    assert_empty result[:conversion_warnings]
  end

  test "pieces always round up including a fraction of one and only after accumulation" do
    onion = ingredient("Onion", mode: "piece", shopping_unit: "piece")
    reference(onion, "piece_weight", 150)
    meal = recipe(onion, [[30, "g"]])
    @monday.daily_meals.create!(meal: meal)
    assert_equal ["piece", "1", "0.2"], result[:items].sole.values_at(:unit, :quantity, :required_quantity)
    meal.meal_ingredients.first.update!(quantity: 360)
    assert_equal "3", result[:items].sole[:quantity]
    meal.meal_ingredients.destroy_all
    meal.meal_ingredients.create!(ingredient: onion, unit: unit("piece"), quantity: 0.25)
    @tuesday.daily_meals.create!(meal: meal)
    item = result[:items].sole
    assert_equal "1", item[:quantity]
    assert_equal "calculated", item[:status]
    assert_not item.key?(:approximate)
  end

  test "containers preserve small needs and use exact thresholds even beyond display precision" do
    mayo = ingredient("Threshold mayo", mode: "package", shopping_unit: "jar", package_quantity: 390, package_unit: "g")
    meal = recipe(mayo, [[20, "g"]])
    @monday.daily_meals.create!(meal: meal)
    { "20" => ["g", "20.0"], "389.999999" => ["g", "390.0"],
      "390" => ["jar", "1"], "390.000001" => ["jar", "2"], "780" => ["jar", "2"] }.each do |quantity, expected|
      meal.meal_ingredients.first.update!(quantity: quantity)
      assert_equal expected, result[:items].sole.values_at(:unit, :quantity)
    end
  end

  test "scales by recipe servings for every occurrence and excludes other menus" do
    chicken = ingredient("Chicken", mode: "bulk", shopping_unit: "g")
    meal = recipe(chicken, [[0.5, "kg"], [300, "g"]], servings: 4)
    @menu.update!(people_count: 2)
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    other = Menu.create!(from: Time.utc(2026, 11, 23), to: Time.utc(2026, 11, 29))
    other.days.create!(weekday: @monday.weekday).daily_meals.create!(meal: meal)
    assert_equal ["g", "800.0"], result[:items].sole.values_at(:unit, :quantity)
  end

  test "recipe can contents are immutable when the shopping presentation changes" do
    tuna = ingredient("Tuna", mode: "package", shopping_unit: "can", package_quantity: 140, package_unit: "g")
    meal = recipe(tuna, [[1, "can", 140, "g"], [0.5, "can", 280, "g"]])
    @monday.daily_meals.create!(meal: meal)
    assert_equal ["can", "2", "280.0"], result[:items].sole.values_at(:unit, :quantity, :required_quantity)
    tuna.shopping_profile.update!(package_quantity: 100)
    assert_equal ["can", "3", "280.0"], result[:items].sole.values_at(:unit, :quantity, :required_quantity)
    assert_equal [140, 280], meal.meal_ingredients.pluck(:package_quantity)
  end

  test "missing conversions warn even for a single unit and never round partial needs" do
    mayo = ingredient("Unresolved", mode: "package", shopping_unit: "jar", package_quantity: 390, package_unit: "g")
    meal = recipe(mayo, [[1, "tablespoon"]])
    @monday.daily_meals.create!(meal: meal)
    assert_equal ["ml", "15.0", "incomplete"], result[:items].sole.values_at(:unit, :quantity, :status)
    assert_equal ["ml"], result[:conversion_warnings].sole[:units]
    meal.meal_ingredients.create!(ingredient: mayo, unit: unit("g"), quantity: 500)
    assert_equal %w[g ml], result[:items].map { |item| item[:unit] }
    assert result[:items].all? { |item| item[:status] == "incomplete" }
    reference(mayo, "density", 13, basis: 15)
    assert_empty result[:conversion_warnings]
    assert_equal ["jar", "2"], result[:items].sole.values_at(:unit, :quantity)
  end

  test "eggs need no weight for pieces or packages containing pieces" do
    egg = ingredient("Egg", mode: "piece", shopping_unit: "piece")
    meal = recipe(egg, [[6, "piece"]])
    @monday.daily_meals.create!(meal: meal)
    assert_equal ["piece", "6"], result[:items].sole.values_at(:unit, :quantity)
    egg.shopping_profile.update!(mode: "package", shopping_unit: unit("package"), package_quantity: 6, package_unit: unit("piece"))
    assert_equal ["package", "1"], result[:items].sole.values_at(:unit, :quantity)
    meal.meal_ingredients.first.update!(quantity: 0.5)
    assert_equal ["piece", "1"], result[:items].sole.values_at(:unit, :quantity)
    assert_empty egg.measurement_references
  end

  test "volume to pieces can use both references without borrowing another ingredient's data" do
    onion = ingredient("Chopped onion", mode: "piece", shopping_unit: "piece")
    reference(onion, "density", 1)
    reference(onion, "piece_weight", 150)
    other = ingredient("Other onion", mode: "piece", shopping_unit: "piece")
    meal = recipe(onion, [[1, "cup"]])
    meal.meal_ingredients.create!(ingredient: other, unit: unit("cup"), quantity: 1)
    @monday.daily_meals.create!(meal: meal)
    assert_equal ["piece", "2"], result[:items].first.values_at(:unit, :quantity)
    assert_equal other.id, result[:conversion_warnings].sole[:ingredient_id]
  end

  test "unconfigured metric ingredients use standard units and tiny needs remain visible" do
    flour = Ingredient.create!(name: "Flour")
    salt = Ingredient.create!(name: "Salt")
    meal = recipe(flour, [[1, "g"]], servings: 3)
    meal.meal_ingredients.create!(ingredient: salt, unit: unit("g"), quantity: "0.000001")
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    assert_equal ["0.667", "0.001"], result[:items].map { |item| item[:quantity] }
    assert_empty result[:conversion_warnings]
  end

  test "empty menus and recipes without ingredient rows remain explicit" do
    assert_empty result[:items]
    meal = Meal.create!(name: "Empty recipe", description: "No ingredients yet", servings: 1)
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    assert_equal [{ id: meal.id, name: meal.name }], result[:meals_without_ingredients]
    assert_empty result[:items]
  end

  test "sorts by category and keeps ingredient identities separate" do
    first = Ingredient.create!(name: "Zucchini", shopping_category: "produce")
    second = Ingredient.create!(name: "Apples", shopping_category: "frozen")
    meal = recipe(first, [[1, "g"]])
    meal.meal_ingredients.create!(ingredient: second, unit: unit("g"), quantity: 1)
    @monday.daily_meals.create!(meal: meal)
    assert_equal %w[Zucchini Apples], result[:items].map { |item| item[:name] }
    assert_equal ShoppingCategory.catalog, result[:categories]
  end

  private

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
