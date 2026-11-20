require "test_helper"

class MenuShoppingListServiceTest < ActiveSupport::TestCase
  setup do
    @menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22), people_count: 3)
    @monday = @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday"))
    @tuesday = @menu.days.create!(weekday: Weekday.find_or_create_by!(name: "tuesday"))
    @grams = Unit.find_or_create_by!(code: "g") { |unit| unit.name = "grams" }
  end

  test "scales each occurrence and combines compatible units without merging ingredient identities" do
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
    assert_equal [[other_rice.id, "g", "30.0"], [rice.id, "g", "1500.5"]],
      items.map { |item| item.values_at(:ingredient_id, :unit, :quantity) }
  end

  test "combines onion requirements in grams without rounding to purchase pieces" do
    @menu.update!(people_count: 1)
    onion = Ingredient.create!(name: "Cebolla")
    piece = Unit.find_or_create_by!(code: "pieza") { |unit| unit.name = "pieces" }
    profile = configure_shopping(onion)
    first = Meal.create!(name: "First", description: "Recipe")
    second = Meal.create!(name: "Second", description: "Recipe")
    first.meal_ingredients.create!(ingredient: onion, unit: @grams, quantity: "80.25")
    second.meal_ingredients.create!(ingredient: onion, unit: piece, quantity: "1.25")
    @monday.daily_meals.create!(meal: first)
    @tuesday.daily_meals.create!(meal: second)

    result = MenuShoppingListService.new.call(menu: @menu)
    assert_equal [{ ingredient_id: onion.id, name: "Cebolla", shopping_category: "uncategorized", unit: "g",
      quantity: "265.25", approximate: true }], result[:items]
    assert_empty result[:conversion_warnings]
    profile.update!(round_up: false)
    item = MenuShoppingListService.new.call(menu: @menu)[:items].first
    assert_equal "265.25", item[:quantity]
    assert_not item.key?(:required_quantity)
  end

  test "sums recipe requirements in grams regardless of jar size and purchase rounding" do
    @menu.update!(people_count: 1)
    Unit.find_or_create_by!(code: "frasco") { |unit| unit.name = "jars" }
    mayonnaise = Ingredient.create!(name: "Mayonnaise")
    configure_shopping(mayonnaise, unit: "frasco", quantity: "390", approximate: false)
    meal = Meal.create!(name: "Sandwich", description: "Recipe", servings: 2)
    meal.meal_ingredients.create!(ingredient: mayonnaise, unit: @grams, quantity: 400)
    @monday.daily_meals.create!(meal: meal)
    @tuesday.daily_meals.create!(meal: meal)
    item = MenuShoppingListService.new.call(menu: @menu)[:items].first
    assert_equal "g", item[:unit]
    assert_equal "400.0", item[:quantity]
    assert_not item.key?(:required_quantity)
    assert_not item.key?(:approximate)
  end

  test "keeps quantities and warns when conversions are unavailable" do
    @menu.update!(people_count: 1)
    onion = Ingredient.create!(name: "Onion")
    piece = Unit.find_or_create_by!(code: "pieza") { |unit| unit.name = "pieces" }
    cup = Unit.find_or_create_by!(code: "taza") { |unit| unit.name = "cups" }
    units = [@grams, piece, cup]
    units.each_with_index do |unit, index|
      meal = Meal.create!(name: "Recipe #{index}", description: "Recipe")
      meal.meal_ingredients.create!(ingredient: onion, unit: unit, quantity: 1)
      @monday.daily_meals.create!(meal: meal, position: index)
    end
    result = MenuShoppingListService.new.call(menu: @menu)
    assert_equal %w[g pieza taza], result[:items].map { |item| item[:unit] }
    assert_equal "shopping_profile_missing", result[:conversion_warnings].first[:reason]

    configure_shopping(onion)
    result = MenuShoppingListService.new.call(menu: @menu)
    assert_equal %w[g taza], result[:items].map { |item| item[:unit] }
    assert_equal [{ ingredient_id: onion.id, name: "Onion", units: ["taza"],
      target_unit: "g", reason: "equivalence_missing" }], result[:conversion_warnings]
    assert_equal "1.0", result[:items].last[:quantity]
  end

  test "converts liters exactly and never borrows another ingredient's equivalence" do
    @menu.update!(people_count: 1)
    liters = Unit.find_or_create_by!(code: "l") { |unit| unit.name = "liters" }
    milliliters = Unit.find_or_create_by!(code: "ml") { |unit| unit.name = "milliliters" }
    first = Meal.create!(name: "First", description: "Recipe")
    second = Meal.create!(name: "Second", description: "Recipe")
    milk = Ingredient.create!(name: "Milk")
    first.meal_ingredients.create!(ingredient: milk, unit: liters, quantity: "0.5")
    second.meal_ingredients.create!(ingredient: milk, unit: milliliters, quantity: "250")
    @monday.daily_meals.create!(meal: first)
    @tuesday.daily_meals.create!(meal: second)
    other = Ingredient.create!(name: "Unrelated")
    Unit.find_or_create_by!(code: "pieza") { |unit| unit.name = "pieces" }
    configure_shopping(other)
    result = MenuShoppingListService.new.call(menu: @menu)
    assert_equal [{ ingredient_id: milk.id, name: "Milk", shopping_category: "uncategorized", unit: "ml", quantity: "750.0" }], result[:items]
    assert_empty result[:conversion_warnings]
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

  test "sorts categories before names and uses live ingredient categories" do
    meal = Meal.create!(name: "Mixed groceries", description: "Recipe")
    ingredients = [
      Ingredient.create!(name: "Apples", shopping_category: "frozen"),
      Ingredient.create!(name: "Zucchini", shopping_category: "produce"),
      Ingredient.create!(name: "Bananas", shopping_category: "produce"),
      Ingredient.create!(name: "Unknown")
    ]
    ingredients.each { |ingredient| meal.meal_ingredients.create!(ingredient: ingredient, unit: @grams, quantity: 10) }
    @monday.daily_meals.create!(meal: meal)
    result = MenuShoppingListService.new.call(menu: @menu)
    assert_equal ShoppingCategory.catalog, result[:categories]
    assert_equal %w[Bananas Zucchini Apples Unknown], result[:items].map { |item| item[:name] }
    assert_equal %w[produce produce frozen uncategorized], result[:items].map { |item| item[:shopping_category] }
    ingredients.first.update!(shopping_category: "pantry")
    assert_equal "pantry", MenuShoppingListService.new.call(menu: @menu)[:items][2][:shopping_category]
  end

  test "keeps fractional pieces and cloves when recipes already use one common unit" do
    @menu.update!(people_count: 1)
    piece = Unit.find_or_create_by!(code: "pieza") { |unit| unit.name = "pieces" }
    clove = Unit.find_or_create_by!(code: "diente") { |unit| unit.name = "cloves" }
    avocado = Ingredient.create!(name: "Avocado")
    garlic = Ingredient.create!(name: "Garlic")
    configure_shopping(avocado)
    garlic.create_shopping_profile!(base_unit: piece, shopping_unit: piece, round_up: true)
    meal = Meal.create!(name: "Small portion", description: "Recipe")
    meal.meal_ingredients.create!(ingredient: avocado, unit: piece, quantity: "0.5")
    meal.meal_ingredients.create!(ingredient: garlic, unit: clove, quantity: "0.5")
    @monday.daily_meals.create!(meal: meal)
    result = MenuShoppingListService.new.call(menu: @menu)
    assert_equal [["pieza", "0.5"], ["diente", "0.5"]], result[:items].map { |item| item.values_at(:unit, :quantity) }
    assert_empty result[:conversion_warnings]
    assert result[:items].none? { |item| item.key?(:approximate) || item.key?(:required_quantity) }
  end

  test "converts teaspoons to ingredient grams without calculating whole jars" do
    @menu.update!(people_count: 1)
    spoon = Unit.find_or_create_by!(code: "cucharadita") { |unit| unit.name = "teaspoons" }
    Unit.find_or_create_by!(code: "frasco") { |unit| unit.name = "jars" }
    mayonnaise = Ingredient.create!(name: "Mayonnaise")
    profile = configure_shopping(mayonnaise, unit: "frasco", quantity: "425", approximate: false)
    profile.unit_equivalences.create!(unit: spoon, quantity: "4.6", source: "Test reference", description: "Approximate spoon weight", approximate: true)
    meal = Meal.create!(name: "Sandwich", description: "Recipe")
    meal.meal_ingredients.create!(ingredient: mayonnaise, unit: spoon, quantity: 2)
    @monday.daily_meals.create!(meal: meal)
    item = MenuShoppingListService.new.call(menu: @menu)[:items].sole
    assert_equal "g", item[:unit]
    assert_equal "9.2", item[:quantity]
    assert_equal true, item[:approximate]
    assert_not item.key?(:required_quantity)
  end

  test "combines fractional containers and grams as requirements rather than purchases" do
    @menu.update!(people_count: 2)
    package = Unit.find_or_create_by!(code: "package") { |unit| unit.name = "packages" }
    yogurt = Ingredient.create!(name: "Yogurt")
    configure_shopping(yogurt, unit: "package", quantity: "150", approximate: false)
    first = Meal.create!(name: "Yogurt bowl", description: "Recipe")
    second = Meal.create!(name: "Overnight oats", description: "Recipe")
    first.meal_ingredients.create!(ingredient: yogurt, unit: package, quantity: "0.5")
    second.meal_ingredients.create!(ingredient: yogurt, unit: @grams, quantity: 75)
    @monday.daily_meals.create!(meal: first)
    @tuesday.daily_meals.create!(meal: second)
    item = MenuShoppingListService.new.call(menu: @menu)[:items].sole
    assert_equal "g", item[:unit]
    assert_equal "300.0", item[:quantity]
    assert_not item.key?(:required_quantity)
    assert_not item.key?(:approximate)
  end

  private

  def configure_shopping(ingredient, unit: "pieza", quantity: "148", approximate: true)
    IngredientShoppingProfileSaveService.new.call(ingredient: ingredient, attributes: {
      base_unit: "g", shopping_unit: unit, round_up: true,
      equivalences: [{ unit: unit, quantity: quantity, source: "Test measurement",
        description: "Example ingredient conversion", approximate: approximate }]
    })
  end

end
