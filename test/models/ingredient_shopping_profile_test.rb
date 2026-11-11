require "test_helper"

class IngredientShoppingProfileTest < ActiveSupport::TestCase
  setup do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code) { |unit| unit.name = name } }
    @ingredient = Ingredient.create!(name: "Configured ingredient")
  end

  test "ingredient-specific density composes with exact metric conversions" do
    profile = IngredientShoppingProfileSaveService.new.call(ingredient: @ingredient, attributes: {
      base_unit: "g", shopping_unit: "frasco", round_up: true,
      equivalences: [
        { unit: "ml", quantity: "0.95", source: "Test measurement", description: "Measured density", approximate: true },
        { unit: "frasco", quantity: "390", source: "Test label", description: "Selected package", approximate: false }
      ]
    })
    assert_equal [Rational(950), true], profile.factor_for("l")
    assert_equal [Rational(1000), false], profile.factor_for("kg")
    assert_equal [Rational(390), false], profile.factor_for("frasco")
    assert_nil profile.factor_for("cucharada")
  end

  test "rejects contradictory built-in conversions and nonfinite or missing amounts" do
    profile = @ingredient.build_shopping_profile(base_unit: Unit.find_by!(code: "g"), shopping_unit: Unit.find_by!(code: "g"))
    row = profile.unit_equivalences.build(unit: Unit.find_by!(code: "kg"), quantity: "999",
      source: "Test reference", description: "Must not override metric units")
    assert_not profile.valid?
    assert row.errors[:unit].present?
    row.unit = Unit.find_by!(code: "pieza")
    [nil, 0, -1, "invalid", "Infinity", "NaN", "0.0000001", "1e1000", 1_000_000_001].each do |quantity|
      row.quantity = quantity
      assert_not row.valid?, "Expected #{quantity.inspect} to be invalid"
      assert row.errors[:quantity].present?
    end
  end

  test "supported storage boundaries round trip and unusable legacy factors are ignored" do
    profile = IngredientShoppingProfileSaveService.new.call(ingredient: @ingredient,
      attributes: { base_unit: "g", shopping_unit: "pieza",
        equivalences: [{ unit: "pieza", quantity: "1000000000", source: "Test measurement",
          description: "Maximum supported factor", approximate: false }] })
    assert_equal [Rational(1_000_000_000), false], profile.reload.factor_for("pieza")
    row = profile.unit_equivalences.first
    row.update!(quantity: "0.000001")
    assert_equal [Rational(1, 1_000_000), false], profile.reload.factor_for("pieza")
    row.update_column(:quantity, BigDecimal("1e1000"))
    assert_nil profile.reload.factor_for("pieza")
  end

  test "database enforces positive factors when validations are bypassed" do
    profile = IngredientShoppingProfileSaveService.new.call(ingredient: @ingredient,
      attributes: { base_unit: "g", shopping_unit: "pieza", round_up: true,
        equivalences: [{ unit: "pieza", quantity: "148", source: "Test measurement",
          description: "Example piece weight", approximate: true }] })
    equivalence = profile.unit_equivalences.first
    assert_raises(ActiveRecord::StatementInvalid) { equivalence.update_column(:quantity, 0) }
    assert_equal 148, equivalence.reload.quantity
  end
end
