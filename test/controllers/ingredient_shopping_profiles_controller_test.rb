require "test_helper"

class IngredientShoppingProfilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code) { |unit| unit.name = name } }
    @ingredient = Ingredient.create!(name: "Profile onion")
    @path = "/ingredients/#{@ingredient.id}/shopping_profile"
  end

  test "saves explicit equivalences without changing the ingredient catalog contract" do
    assert_nil @ingredient.shopping_profile
    get @path, as: :json
    assert_response :ok
    assert_nil response.parsed_body["data"]

    put @path, params: custom_profile, as: :json
    assert_response :ok
    data = response.parsed_body.fetch("data")
    assert_equal "g", data["base_unit"]
    assert_equal "pieza", data["shopping_unit"]
    assert_equal true, data["round_up"]
    assert_equal true, data.fetch("equivalences").first["approximate"]
    assert_equal "200.0", data.fetch("equivalences").first["quantity"]
    assert_equal "Manual household measurement", data.fetch("equivalences").first["source"]
    assert_equal @ingredient.id, data["ingredient_id"]
    get @path, as: :json
    assert_equal data, response.parsed_body["data"]

    get "/ingredients", as: :json
    entry = response.parsed_body["data"].find { |row| row["id"] == @ingredient.id }
    assert_equal %w[id meals name shopping_category], entry.keys.sort
  end

  test "replaces a profile atomically and preserves recipes" do
    meal = Meal.create!(name: "Onion soup", description: "Recipe")
    row = meal.meal_ingredients.create!(ingredient: @ingredient, unit: Unit.find_by!(code: "g"), quantity: "80.25")
    initial_profile = custom_profile.deep_dup
    initial_profile[:equivalences][0][:quantity] = "150"
    put @path, params: initial_profile, as: :json
    assert_response :ok
    put @path, params: custom_profile, as: :json
    assert_response :ok
    assert_equal "200.0", response.parsed_body.dig("data", "equivalences", 0, "quantity")
    assert_equal 1, @ingredient.reload.shopping_profile.unit_equivalences.count
    assert_equal BigDecimal("80.25"), row.reload.quantity

    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22))
    day = menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday"))
    day.daily_meals.create!(meal: meal)
    get "/menus/#{menu.id}/shopping_list", as: :json
    assert_response :ok
    assert_equal "g", response.parsed_body.dig("data", "items", 0, "unit")
    assert_equal "80.25", response.parsed_body.dig("data", "items", 0, "quantity")
    assert_not response.parsed_body.dig("data", "items", 0).key?("required_quantity")
    assert_not response.parsed_body.dig("data", "items", 0).key?("approximate")

    invalid = custom_profile.deep_dup
    invalid[:equivalences][0][:quantity] = 0
    put @path, params: invalid, as: :json
    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].present?
    get @path, as: :json
    assert_equal "200.0", response.parsed_body.dig("data", "equivalences", 0, "quantity")
  end

  test "rejects malformed conversions and unknown units without creating a profile" do
    invalid_payloads = [
      {},
      custom_profile.merge(equivalences: nil), custom_profile.merge(equivalences: {}),
      custom_profile.merge(equivalences: [1]), custom_profile.merge(base_unit: "kg"),
      custom_profile.merge(shopping_unit: "unknown"), custom_profile.merge(equivalences: []),
      custom_profile.merge(round_up: "true"), custom_profile.merge(round_up: []),
      custom_profile.merge(equivalences: [custom_profile[:equivalences].first] * 2)
    ]
    %i[unit quantity source description approximate].each do |key|
      invalid = custom_profile.deep_dup
      invalid[:equivalences][0][key] = []
      invalid_payloads << invalid
    end
    invalid = custom_profile.deep_dup
    invalid[:equivalences][0][:quantity] = "0.0000001"
    invalid_payloads << invalid
    invalid_payloads.each do |payload|
      assert_no_difference ["IngredientShoppingProfile.count", "IngredientUnitEquivalence.count"] do
        put @path, params: payload, headers: { "Accept-Language" => "es" }, as: :json
        assert_response :unprocessable_entity
        assert response.parsed_body["errors"].present?
        assert_not response.body.include?("Translation missing")
      end
    end
  end

  test "clears configuration and deletes configuration belonging to an unused ingredient" do
    put @path, params: custom_profile, as: :json
    assert_response :ok
    delete @path, as: :json
    assert_response :ok
    assert_empty IngredientUnitEquivalence.all
    assert_nil @ingredient.reload.shopping_profile
    assert Ingredient.exists?(@ingredient.id)

    put @path, params: custom_profile, as: :json
    assert_response :ok
    delete "/ingredients/#{@ingredient.id}", as: :json
    assert_response :ok
    assert_empty IngredientShoppingProfile.all
    assert_empty IngredientUnitEquivalence.all
  end

  test "missing ingredients return the existing localized error" do
    get "/ingredients/0/shopping_profile", headers: { "Accept-Language" => "es" }, as: :json
    assert_response :not_found
    assert_equal "Ingrediente no encontrado", response.parsed_body["errors"]
  end

  test "shopping lists switch to configured bags and cans after reaching one container" do
    meal = Meal.create!(name: "Packaged oats", description: "Recipe")
    meal.meal_ingredients.create!(ingredient: @ingredient, unit: Unit.find_by!(code: "g"), quantity: 600)
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22))
    menu.days.create!(weekday: Weekday.find_or_create_by!(name: "monday")).daily_meals.create!(meal: meal)
    %w[bag can].each do |unit|
      put @path, params: { base_unit: "g", shopping_unit: unit, round_up: true,
        equivalences: [{ unit: unit, quantity: "500", source: "Package label", description: "Selected 500 g package", approximate: false }] }, as: :json
      assert_response :ok
      get "/menus/#{menu.id}/shopping_list", as: :json
      assert_response :ok
      assert_equal unit, response.parsed_body.dig("data", "items", 0, "unit")
      assert_equal "2", response.parsed_body.dig("data", "items", 0, "quantity")
      assert_not response.parsed_body.dig("data", "items", 0).key?("required_quantity")
    end
  end

  test "malformed and duplicate equivalences return API field errors and preserve saved settings" do
    put @path, params: custom_profile, as: :json
    assert_response :ok
    [nil, {}, [1], [custom_profile[:equivalences].first] * 2].each do |invalid|
      put @path, params: custom_profile.merge(equivalences: invalid), as: :json
      assert_response :unprocessable_entity
      assert response.parsed_body.dig("errors", "equivalences").present?
      get @path, as: :json
      assert_equal "200.0", response.parsed_body.dig("data", "equivalences", 0, "quantity")
    end
  end

  test "factors exceeding the supported storage range return 422 without replacing configuration" do
    put @path, params: custom_profile, as: :json
    assert_response :ok
    ["1e1000", "1000000001", 1_000_000_001].each do |quantity|
      invalid = custom_profile.deep_dup
      invalid[:equivalences][0][:quantity] = quantity
      put @path, params: invalid, headers: { "Accept-Language" => "es" }, as: :json
      assert_response :unprocessable_entity
      assert response.parsed_body["errors"].present?
      get @path, as: :json
      assert_equal "200.0", response.parsed_body.dig("data", "equivalences", 0, "quantity")
    end
  end

  private

  def custom_profile
    { base_unit: "g", shopping_unit: "pieza", round_up: true,
      equivalences: [{ unit: "pieza", quantity: "200", source: "Manual household measurement",
        description: "Average of the onions normally purchased", approximate: true }] }
  end
end
