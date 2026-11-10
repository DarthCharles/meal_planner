# frozen_string_literal: true

require "test_helper"

class MenusControllerTest < ActionDispatch::IntegrationTest
  test "generate returns 422 when insufficient meals" do
    Meal.destroy_all
    post "/menus/generate", as: :json
    assert_response :unprocessable_entity
    json = response.parsed_body
    assert_match(/Cannot complete the menu/, json["errors"].to_s)
  end

  test "generation returns the weekly menu and keeps it first on later reads" do
    create_meal_pool_for_generate
    Menu.create!(from: Time.utc(2025, 3, 3), to: Time.utc(2025, 3, 9, 23, 59, 59))

    travel_to Time.utc(2026, 11, 9, 12) do
      post "/menus/generate", as: :json
      assert_response :created
      generated = response.parsed_body.fetch("data")
      assert_equal 7, generated.fetch("days").size
      assert_equal [], generated.fetch("generation_notices")
      assert_equal [], generated.fetch("days").first.fetch("meals").first.fetch("preferred_days")

      # A later insertion for an older week must not displace the latest plan.
      Menu.create!(from: Time.utc(2026, 11, 2), to: Time.utc(2026, 11, 8, 23, 59, 59))

      get "/menus", as: :json
      assert_response :ok
      menus = response.parsed_body.fetch("data")
      assert_equal generated, menus.first
      assert_equal %w[2026-11-16 2026-11-02 2025-03-03], menus.map { |menu| menu.fetch("from").first(10) }
    end
  end

  private

  def create_meal_pool_for_generate
    %w[monday tuesday wednesday thursday friday saturday sunday].each { |n| Weekday.find_or_create_by!(name: n) }
    %w[breakfast lunch dinner].each { |d| MealType.find_or_create_by!(description: d) }
    Meal.destroy_all
    %w[breakfast lunch dinner].each do |type_name|
      type = MealType.find_by!(description: type_name)
      7.times do |i|
        meal = Meal.create!(name: "#{type_name}_#{i}_#{SecureRandom.hex(2)}", description: "Desc", recipe_url: "")
        meal.meal_types << type unless meal.meal_types.include?(type)
      end
    end
  end
end
