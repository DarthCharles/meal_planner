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

  test "packages can be configured without documenting contents" do
    put @path, params: { mode: "package", shopping_unit: "jar" }, as: :json
    assert_response :ok
    assert_equal "package", response.parsed_body.dig("data", "mode")
    assert_nil response.parsed_body.dig("data", "package_quantity")
    assert_nil response.parsed_body.dig("data", "package_unit")
    put @path, params: { mode: "package", shopping_unit: "jar", package_quantity: 250 }, as: :json
    assert_response :unprocessable_entity
    get @path, as: :json
    assert_nil response.parsed_body.dig("data", "package_quantity")
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

  test "piece weight saves with buying setup and preserves other reference data" do
    density = @ingredient.measurement_references.create!(kind: "density", quantity: 13, reference_quantity: 15,
      source: "Existing label", description: "Existing density", approximate: false)
    density_attributes = density.attributes
    put @path, params: { mode: "bulk", shopping_unit: "g",
      piece_weight: { quantity: "272", reference_quantity: "1" } }, as: :json
    assert_response :ok
    assert_equal({ "quantity" => "272.0", "reference_quantity" => "1.0" }, response.parsed_body.dig("data", "piece_weight"))
    weight = @ingredient.measurement_references.find_by!(kind: "piece_weight")
    assert weight.approximate
    assert_equal density_attributes, density.reload.attributes
    get @path, as: :json
    assert_equal "272.0", response.parsed_body.dig("data", "piece_weight", "quantity")
    put @path, params: { mode: "bulk", shopping_unit: "kg", piece_weight: nil }, as: :json
    assert_response :ok
    assert_not @ingredient.measurement_references.exists?(kind: "piece_weight")
    assert_equal density_attributes, density.reload.attributes
  end

  test "unchanged and omitted piece weights retain the original ratio and provenance" do
    weight = @ingredient.measurement_references.create!(kind: "piece_weight", quantity: "150.123456", reference_quantity: "2.000001",
      source: "Original source", description: "Original measured pieces", approximate: false)
    original = weight.attributes
    put @path, params: { mode: "piece", shopping_unit: "piece",
      piece_weight: { quantity: "150.123456", reference_quantity: "2.000001" } }, as: :json
    assert_response :ok
    assert_equal original, weight.reload.attributes
    put @path, params: { mode: "package", shopping_unit: "bag" }, as: :json
    assert_response :ok
    assert_equal original, weight.reload.attributes
    assert_equal "2.000001", response.parsed_body.dig("data", "piece_weight", "reference_quantity")
  end

  test "invalid piece weights roll back the buying profile as well as reference changes" do
    put @path, params: { mode: "piece", shopping_unit: "piece", piece_weight: { quantity: 60 } }, as: :json
    assert_response :ok
    [[], true, "bad", {}, { quantity: 0 }, { quantity: "1e1000" }, { quantity: 272, reference_quantity: 0 }].each do |invalid|
      put @path, params: { mode: "bulk", shopping_unit: "kg", piece_weight: invalid }, as: :json
      assert_response :unprocessable_entity
      assert response.parsed_body.fetch("errors").key?("piece_weight")
      assert_equal "piece", @ingredient.reload.shopping_profile.mode
      assert_equal 60, @ingredient.measurement_references.find_by!(kind: "piece_weight").quantity
    end
  end

  test "missing ingredients have a localized 404" do
    get "/ingredients/0/shopping_profile", headers: { "Accept-Language" => "es" }, as: :json
    assert_response :not_found
    assert_equal "Ingrediente no encontrado", response.parsed_body["errors"]
  end
end
