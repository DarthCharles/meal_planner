# frozen_string_literal: true

class MenuGenerationService
  class InsufficientMealsError < StandardError; end

  WEEKDAY_ORDER = %w[monday tuesday wednesday thursday friday saturday sunday].freeze

  def self.next_monday(from: Time.current)
    date = from.utc.to_date
    date += 1
    date += 1 until date.monday?
    date
  end

  def call(week_start:)
    validate_meal_pool!
    menu = replace_or_create_menu(week_start)
    assign_meals(menu)
    menu
  end

  private

  def validate_meal_pool!
    counts = {
      breakfast: Meal.breakfast.count,
      lunch: Meal.lunch.count,
      dinner: Meal.dinner.count
    }
    missing = counts.select { |_, count| count < 7 }
    return if missing.empty?

    raise InsufficientMealsError,
          "Need at least 7 meals per type. Got: #{counts.map { |k, v| "#{k}=#{v}" }.join(', ')}"
  end

  def replace_or_create_menu(week_start)
    from_begin = Time.utc(week_start.year, week_start.month, week_start.day)
    from_end = Time.utc((week_start + 7.days).year, (week_start + 7.days).month, (week_start + 7.days).day)
    existing = Menu.where(from: from_begin...from_end)
    existing.find_each(&:destroy)
    create_menu(week_start)
  end

  def create_menu(week_start)
    from_time = Time.utc(week_start.year, week_start.month, week_start.day)
    to_date = week_start + 6.days
    to_time = Time.utc(to_date.year, to_date.month, to_date.day, 23, 59, 59)
    menu = Menu.create!(from: from_time, to: to_time)
    WEEKDAY_ORDER.each do |name|
      weekday = Weekday.find_by!(name: name)
      Day.create!(menu: menu, weekday: weekday)
    end
    menu.reload
  end

  def assign_meals(menu)
    used_meal_ids = Set.new
    days_by_weekday = menu.days.includes(:weekday).index_by { |d| d.weekday.name }
    scope_by_position = { 0 => :breakfast, 1 => :lunch, 2 => :dinner }

    WEEKDAY_ORDER.each do |weekday_name|
      day = days_by_weekday[weekday_name]
      [0, 1, 2].each do |position|
        scope = scope_by_position[position]
        candidates = Meal.public_send(scope).where.not(id: used_meal_ids)
        candidates = Meal.public_send(scope) if candidates.empty?
        meal = candidates.order(Arel.sql("RANDOM()")).first
        raise InsufficientMealsError, "No meals available for #{scope}" if meal.nil?
        DailyMeal.create!(day: day, meal: meal, position: position)
        used_meal_ids << meal.id
      end
    end
  end
end
