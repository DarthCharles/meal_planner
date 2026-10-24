# frozen_string_literal: true

require "test_helper"

class MenusControllerTest < ActionDispatch::IntegrationTest
  setup do
    create_meal_pool_for_generate
  end

  test "generate creates menu and returns 201" do
    post "/menus/generate", as: :json
    assert_response :created
    json = response.parsed_body
    assert json["data"]["id"].present?
    assert_equal 7, Menu.find(json["data"]["id"]).days.count
  end

  test "generate returns 422 when insufficient meals" do
    Meal.destroy_all
    post "/menus/generate", as: :json
    assert_response :unprocessable_entity
    json = response.parsed_body
    assert_match(/Need at least 7 meals per type/, json["errors"].to_s)
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
