require "test_helper"

class IngredientMeasurementReferencesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @ingredient = Ingredient.create!(name: "Reference ingredient")
    @path = "/ingredients/#{@ingredient.id}/measurement_references"
    @reference = { kind: "density", quantity: 13, reference_quantity: 15,
      source: "Synthetic test reference", description: "13 g per 15 ml", approximate: true }
  end

  test "references are independent of shopping setup and replace atomically" do
    get @path, as: :json
    assert_equal [], response.parsed_body["data"]
    put @path, params: { references: [@reference] }, as: :json
    assert_response :ok
    saved = response.parsed_body["data"]
    assert_equal "13.0", saved.first["quantity"]
    assert_equal "15.0", saved.first["reference_quantity"]
    assert_nil @ingredient.reload.shopping_profile
    invalid_rows = [nil, {}, [1], [@reference, @reference], [@reference.merge(kind: "cup")]]
    %i[quantity reference_quantity].each do |key|
      [0, "0.0000001", "1e1000", [], {}, true, "1000000001"].each { |value| invalid_rows << [@reference.merge(key => value)] }
    end
    ["true", nil, [], {}].each { |value| invalid_rows << [@reference.merge(approximate: value)] }
    [[], nil].each { |value| invalid_rows << [@reference.merge(source: value)] }
    invalid_rows.each do |references|
      put @path, params: { references: references }, as: :json
      assert_response :unprocessable_entity
      get @path, as: :json
      assert_equal saved, response.parsed_body["data"]
    end
    put @path, params: { references: [] }, as: :json
    assert_response :ok
    assert_empty @ingredient.measurement_references.reload
  end

  test "missing ingredients return 404 rather than accepting reference writes" do
    put "/ingredients/0/measurement_references", params: { references: [@reference] }, as: :json
    assert_response :not_found
  end
end
