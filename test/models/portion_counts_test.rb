require "test_helper"

class PortionCountsTest < ActiveSupport::TestCase
  test "counts default to one and validate raw values before integer coercion" do
    records = { Meal.new(name: "Soup", description: "Warm") => :servings,
      Menu.new(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22)) => :people_count }
    records.each do |record, attribute|
      assert_equal 1, record.public_send(attribute)
      [0, -1, 1.5, "1.5", "1person", nil, true, 2**63, (2**63).to_s].each do |invalid|
        record.public_send("#{attribute}=", invalid)
        assert_not record.valid?, "Expected #{attribute}=#{invalid.inspect} to be invalid"
        assert record.errors[attribute].present?
      end
      record.public_send("#{attribute}=", "2")
      assert record.valid?
      assert_equal 2, record.public_send(attribute)
      record.public_send("#{attribute}=", (2**63) - 1)
      assert record.valid?
    end
  end

  test "database constraints reject nonpositive and null counts when validations are bypassed" do
    meal = Meal.create!(name: "Soup", description: "Warm")
    menu = Menu.create!(from: Time.utc(2026, 11, 16), to: Time.utc(2026, 11, 22))
    { meal => :servings, menu => :people_count }.each do |record, attribute|
      [0, -1, nil].each do |invalid|
        assert_raises(ActiveRecord::StatementInvalid) { record.update_column(attribute, invalid) }
        assert_equal 1, record.reload.public_send(attribute)
      end
    end
  end
end
