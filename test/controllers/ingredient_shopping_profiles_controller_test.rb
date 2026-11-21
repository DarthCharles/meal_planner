require "test_helper"

class IngredientShoppingProfilesControllerTest < ActionDispatch::IntegrationTest
  setup do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code, name: name) }
    @ingredient = Ingredient.create!(name: "Shopping ingredient")
    @path = "/ingredients/#{@ingredient.id}/shopping_profile"
  end

  test "shopping configuration can change without removing ingredient references" do
    @ingredient.measurement_references.create!(kind: "piece_weight", quantity: 148,
      source: "Test reference", description: "Synthetic piece weight")
    get @path, as: :json
    assert_nil response.parsed_body["data"]
    put @path, params: { mode: "piece", shopping_unit: "piece" }, as: :json
    assert_response :ok
    assert_equal "piece", response.parsed_body.dig("data", "mode")
    put @path, params: { mode: "package", shopping_unit: "bag", package_quantity: "1/2", package_unit: "kg" }, as: :json
    assert_response :ok
    assert_equal "0.5", response.parsed_body.dig("data", "package_quantity")
    delete @path, as: :json
    assert_response :ok
    assert_nil @ingredient.reload.shopping_profile
    assert_equal 1, @ingredient.measurement_references.count
    delete "/ingredients/#{@ingredient.id}", as: :json
    assert_response :ok
    assert_empty IngredientMeasurementReference.where(ingredient_id: @ingredient.id)
  end

  test "invalid updates preserve the previous presentation" do
    valid = { mode: "package", shopping_unit: "can", package_quantity: "140", package_unit: "g" }
    put @path, params: valid, as: :json
    assert_response :ok
    [{}, valid.merge(package_quantity: "1e1000"), valid.merge(package_quantity: []),
      valid.merge(package_unit: []), valid.merge(package_quantity: "0.0000001"),
      valid.merge(package_quantity: "1000000001"), valid.merge(shopping_unit: "missing")].each do |invalid|
      put @path, params: invalid, headers: { "Accept-Language" => "es" }, as: :json
      assert_response :unprocessable_entity
      assert response.parsed_body["errors"].present?
      assert_not response.body.include?("Translation missing")
      get @path, as: :json
      assert_equal "140.0", response.parsed_body.dig("data", "package_quantity")
    end
  end

  test "missing ingredients have a localized 404" do
    get "/ingredients/0/shopping_profile", headers: { "Accept-Language" => "es" }, as: :json
    assert_response :not_found
    assert_equal "Ingrediente no encontrado", response.parsed_body["errors"]
  end
end
