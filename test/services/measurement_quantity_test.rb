require "test_helper"

class MeasurementQuantityTest < ActiveSupport::TestCase
  test "accepts familiar fractions while rejecting invalid or unusable quantities" do
    { "1/2" => "0.5", "½" => "0.5", "1½" => "1.5", "1 1/4" => "1.25", "0.125" => "0.125", 0.000001 => "0.000001", BigDecimal("140") => "140" }.each do |input, expected|
      assert_equal BigDecimal(expected), MeasurementQuantity.parse(input)
    end
    [nil, true, [], {}, "0", "-1", "1/0", "NaN", "Infinity", "1g", "1000000001", "0.0000001"].each do |input|
      assert_nil MeasurementQuantity.parse(input), input.inspect
    end
  end
end
