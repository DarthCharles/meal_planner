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
  test "new ingredients default to uncategorized and only accept known codes" do
    ingredient = Ingredient.new(name: "New grocery")
    assert_equal "uncategorized", ingredient.shopping_category
    ShoppingCategory::CODES.each do |code|
      ingredient.shopping_category = code
      assert ingredient.valid?, code
    end
    ingredient.shopping_category = "seafood"
    assert_not ingredient.valid?
  end

end
