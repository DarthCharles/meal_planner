# frozen_string_literal: true

require "test_helper"

class MenuGenerationServiceTest < ActiveSupport::TestCase
  setup do
    create_weekdays_and_meal_types
    create_meals_for_generation
  end

  test "creates a seven-day menu with 21 distinct meals when the pool allows" do
    week_start = Date.new(2025, 3, 3)

    menu = MenuGenerationService.new.call(week_start: week_start)

    assert menu.persisted?
    assert_equal 7, menu.days.count
    assert_equal 21, DailyMeal.joins(:day).where(days: { menu_id: menu.id }).count
    assert_equal 21, menu.days.flat_map { |day| day.meals.pluck(:id) }.uniq.size
  end

  test "small pools repeat meals to complete a week" do
    create_meals_for_generation(breakfast_count: 1, lunch_count: 1, dinner_count: 1)
    menu = MenuGenerationService.new.call(week_start: Date.new(2025, 3, 3))
    assert_equal 21, menu.days.sum { |day| day.daily_meals.count }
    assert_empty menu.generation_notices
  end

  test "replaces existing menu for same week" do
    week_start = Date.new(2025, 3, 3)
    MenuGenerationService.new.call(week_start: week_start, people_count: 4)
    initial_count = Menu.count

    replacement = MenuGenerationService.new.call(week_start: week_start)

    assert_equal initial_count, Menu.count
    assert_equal 4, replacement.people_count
    assert_equal 1, Menu.where('"from" >= ? AND "from" < ?', week_start, week_start + 7.days).count
  end

  test "people default to one for new weeks and explicit values override an existing week" do
    week_start = Date.new(2025, 3, 3)
    menu = MenuGenerationService.new.call(week_start: week_start)
    assert_equal 1, menu.people_count
    replacement = MenuGenerationService.new.call(week_start: week_start, people_count: 3)
    assert_equal 3, replacement.people_count
    next_week = MenuGenerationService.new.call(week_start: week_start + 7.days)
    assert_equal 1, next_week.people_count
  end

  test "weekend meals never displace suitable weekday meals and Friday is included" do
    meals = Meal.lunch.to_a
    pizza = meals.first
    pizza.update!(preferred_days: %w[friday saturday sunday])
    meals.drop(1).each { |meal| meal.update!(preferred_days: %w[monday tuesday wednesday thursday]) }

    menu = MenuGenerationService.new.call(week_start: Date.new(2025, 3, 3))
    menu.days.includes(:weekday, :daily_meals).each do |day|
      lunch = day.daily_meals.find_by!(position: 1).meal
      if %w[friday saturday sunday].include?(day.weekday.name)
        assert_equal pizza.id, lunch.id
      else
        assert_not_equal pizza.id, lunch.id
      end
    end
    assert_empty menu.generation_notices
  end

  test "fallbacks are minimal and persist in menu responses" do
    Meal.lunch.each { |meal| meal.update!(preferred_days: %w[friday saturday sunday]) }
    menu = MenuGenerationService.new.call(week_start: Date.new(2025, 3, 3))
    assert_equal 4, menu.generation_notices.size
    assert menu.generation_notices.any? { |notice| notice.fetch("weekday") == "monday" }
    assert menu.generation_notices.all? { |notice| notice.fetch("preferred_days") == %w[friday saturday sunday] }
    messages = menu.as_json[:generation_notices]
    assert messages.any? { |notice| notice.include?("on Monday") }
    assert_equal messages, menu.reload.as_json[:generation_notices]
    snapshots = menu.generation_notices.deep_dup
    Meal.lunch.each { |meal| meal.update!(name: "Renamed", preferred_days: []) }
    I18n.with_locale(:es) do
      translated = menu.reload.as_json[:generation_notices]
      assert translated.any? { |notice| notice.include?("el lunes") }
      assert translated.all? { |notice| notice.include?("viernes, sábado, domingo") }
      assert translated.none? { |notice| notice.include?("Renamed") }
    end
    assert_equal snapshots, menu.reload.generation_notices
  end

  test "global planning preserves an unrestricted meal for another meal time" do
    Meal.destroy_all
    breakfast = MealType.find_by!(description: "breakfast")
    lunch = MealType.find_by!(description: "lunch")
    dinner = MealType.find_by!(description: "dinner")
    shared = Meal.create!(name: "Shared", description: "Flexible", meal_types: [breakfast, lunch])
    Meal.create!(name: "Breakfast", description: "Morning", meal_types: [breakfast])
    Meal.create!(name: "Dinner", description: "Evening", meal_types: [dinner])
    menu = MenuGenerationService.new.call(week_start: Date.new(2025, 3, 3))
    menu.days.each do |day|
      assert_equal shared.id, day.daily_meals.find_by!(position: 1).meal_id
      assert_equal 3, day.meals.distinct.count
    end
    assert_empty menu.generation_notices
  end

  test "an impossible schedule preserves the existing menu" do
    week_start = Date.new(2025, 3, 3)
    existing = MenuGenerationService.new.call(week_start: week_start)
    Meal.lunch.each { |meal| meal.meal_types.delete_all }
    assert_no_difference ["Menu.count", "Day.count", "DailyMeal.count"] do
      assert_raises(MenuGenerationService::InsufficientMealsError) do
        MenuGenerationService.new.call(week_start: week_start)
      end
    end
    assert Menu.exists?(existing.id)
  end

  test "persistence errors roll back replacement" do
    week_start = Date.new(2025, 3, 3)
    existing = MenuGenerationService.new.call(week_start: week_start)
    Weekday.find_by!(name: "monday").update!(name: "invalid")
    assert_no_difference ["Menu.count", "Day.count", "DailyMeal.count"] do
      assert_raises(ActiveRecord::RecordNotFound) do
        MenuGenerationService.new.call(week_start: week_start)
      end
    end
    assert Menu.exists?(existing.id)
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
