require "test_helper"

class IngredientShoppingProfileTest < ActiveSupport::TestCase
  setup do
    Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code, name: name) }
    @ingredient = Ingredient.create!(name: "Profile ingredient")
  end

  test "piece shopping does not require a fictional weight" do
    profile = @ingredient.create_shopping_profile!(mode: "piece", shopping_unit: Unit.find_by!(code: "piece"))
    assert profile.valid?
    assert_empty @ingredient.measurement_references
  end

  test "mode and package contents must agree with the selected units" do
    invalid = [
      { mode: "piece", shopping_unit: "g" },
      { mode: "bulk", shopping_unit: "cup" },
      { mode: "package", shopping_unit: "g", package_quantity: 100, package_unit: "g" },
      { mode: "package", shopping_unit: "can", package_quantity: 100, package_unit: "can" },
      { mode: "package", shopping_unit: "can", package_quantity: 0, package_unit: "g" },
      { mode: "package", shopping_unit: "can", package_quantity: 140 },
      { mode: "package", shopping_unit: "can", package_unit: "g" },
      { mode: "bulk", shopping_unit: "g", package_quantity: 100, package_unit: "g" }
    ]
    invalid.each do |attributes|
      assert_raises(ActiveRecord::RecordInvalid) do
        IngredientShoppingProfileSaveService.new.call(ingredient: @ingredient, attributes: attributes)
      end
      @ingredient.reload
      assert_nil @ingredient.shopping_profile
    end
  end
end
