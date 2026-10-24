require "test_helper"

class IngredientTest < ActiveSupport::TestCase
  test "normalizes the name before validation" do
    ingredient = Ingredient.create!(name: "  Jitomate  ")

    assert_equal "Jitomate", ingredient.name
    assert_equal "jitomate", ingredient.normalized_name
  end

  test "does not allow duplicate normalized names" do
    Ingredient.create!(name: "Jitomate")

    duplicate = Ingredient.new(name: " jitomate ")

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:normalized_name], "has already been taken"
  end
end
