require "test_helper"

class UnitTest < ActiveSupport::TestCase
  test "culinary measures share a single global volume standard" do
    { "teaspoon" => 5, "tablespoon" => 15, "cup" => 240, "l" => 1000 }.each do |code, factor|
      unit = Unit.find_or_create_by!(code: code)
      assert_equal "ml", unit.canonical_code
      assert_equal Rational(factor), unit.canonical_factor
    end
    cup = Unit.find_by!(code: "cup")
    cup.factor = 250
    assert_not cup.valid?
    assert cup.errors[:factor].present?
  end
end
