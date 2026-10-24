# frozen_string_literal: true

require "test_helper"

class MenuGenerationServiceTest < ActiveSupport::TestCase
  setup do
    create_weekdays_and_meal_types
    create_meals_for_generation
  end

  test "creates menu with 7 days and 21 daily_meals" do
    week_start = Date.new(2025, 3, 3)

    menu = MenuGenerationService.new.call(week_start: week_start)

    assert menu.persisted?
    assert_equal 7, menu.days.count
    assert_equal 21, DailyMeal.joins(:day).where(days: { menu_id: menu.id }).count
  end

  test "raises InsufficientMealsError when fewer than 7 meals per type" do
    Meal.destroy_all
    create_meals_for_generation(breakfast_count: 3, lunch_count: 7, dinner_count: 7)

    error = assert_raises(MenuGenerationService::InsufficientMealsError) do
      MenuGenerationService.new.call(week_start: Date.new(2025, 3, 3))
    end
    assert_match(/Need at least 7 meals per type/, error.message)
  end

  test "raises InsufficientMealsError when no meals in database" do
    Meal.destroy_all

    error = assert_raises(MenuGenerationService::InsufficientMealsError) do
      MenuGenerationService.new.call(week_start: Date.new(2025, 3, 3))
    end
    assert_match(/Need at least 7 meals per type/, error.message)
  end

  test "replaces existing menu for same week" do
    week_start = Date.new(2025, 3, 3)
    MenuGenerationService.new.call(week_start: week_start)
    initial_count = Menu.count

    MenuGenerationService.new.call(week_start: week_start)

    assert_equal initial_count, Menu.count
    assert_equal 1, Menu.where('"from" >= ? AND "from" < ?', week_start, week_start + 7.days).count
  end

  test "next_monday returns next Monday when given Sunday" do
    sunday = Time.utc(2025, 3, 2, 6, 0, 0)
    assert_equal Date.new(2025, 3, 3), MenuGenerationService.next_monday(from: sunday)
  end

  test "next_monday returns next Monday when given Monday" do
    monday = Time.utc(2025, 3, 3, 6, 0, 0)
    assert_equal Date.new(2025, 3, 10), MenuGenerationService.next_monday(from: monday)
  end

  private

  def create_weekdays_and_meal_types
    %w[monday tuesday wednesday thursday friday saturday sunday].each do |name|
      Weekday.find_or_create_by!(name: name)
    end
    %w[breakfast lunch dinner].each do |desc|
      MealType.find_or_create_by!(description: desc)
    end
  end

  def create_meals_for_generation(breakfast_count: 7, lunch_count: 7, dinner_count: 7)
    Meal.destroy_all
    { breakfast: breakfast_count, lunch: lunch_count, dinner: dinner_count }.each do |type_name, count|
      type = MealType.find_by!(description: type_name.to_s)
      count.times do |i|
        meal = Meal.create!(name: "#{type_name}_meal_#{i}_#{SecureRandom.hex(2)}", description: "Description #{i}", recipe_url: "")
        meal.meal_types << type unless meal.meal_types.include?(type)
      end
    end
  end
end
