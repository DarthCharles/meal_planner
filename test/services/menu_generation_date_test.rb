# frozen_string_literal: true

require "test_helper"

# Calendar calculations do not need the scheduling suite's database meal pool.
class MenuGenerationDateTest < ActiveSupport::TestCase
  test "next_monday returns next Monday when given Sunday" do
    sunday = Time.utc(2025, 3, 2, 6, 0, 0)
    assert_equal Date.new(2025, 3, 3), MenuGenerationService.next_monday(from: sunday)
  end

  test "next_monday returns next Monday when given Monday" do
    monday = Time.utc(2025, 3, 3, 6, 0, 0)
    assert_equal Date.new(2025, 3, 10), MenuGenerationService.next_monday(from: monday)
  end
end
