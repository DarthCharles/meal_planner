# frozen_string_literal: true

class MenuGenerationService
  class InsufficientMealsError < StandardError; end

  WEEKDAY_ORDER = %w[monday tuesday wednesday thursday friday saturday sunday].freeze
  PRESERVE_PEOPLE_COUNT = Object.new.freeze

  def self.next_monday(from: Time.current)
    date = from.utc.to_date
    date += 1
    date += 1 until date.monday?
    date
  end

  def call(week_start:, people_count: PRESERVE_PEOPLE_COUNT)
    schedule = MealScheduleService.new.call
    Menu.transaction do
      menu = replace_or_create_menu(week_start, people_count)
      days = menu.days.includes(:weekday).index_by { |day| day.weekday.name }
      schedule.each do |assignment|
        DailyMeal.create!(day: days.fetch(assignment[:weekday]), meal: assignment[:meal], position: assignment[:position])
      end
      notices = schedule.select { |assignment| assignment[:exception] }.map do |assignment|
        meal = assignment[:meal]
        { "meal_name" => meal.name, "weekday" => assignment[:weekday], "preferred_days" => meal.preferred_days }
      end
      menu.update!(generation_notices: notices)
      menu
    end
  end

  private

  def replace_or_create_menu(week_start, people_count)
    from_begin = Time.utc(week_start.year, week_start.month, week_start.day)
    from_end = Time.utc((week_start + 7.days).year, (week_start + 7.days).month, (week_start + 7.days).day)
    existing = Menu.where(from: from_begin...from_end)
    if people_count.equal?(PRESERVE_PEOPLE_COUNT)
      people_count = existing.order(from: :desc, id: :desc).first&.people_count || 1
    end
    menu = Menu.new(people_count: people_count)
    menu.validate!
    existing.find_each(&:destroy!)
    create_menu(week_start, menu)
  end

  def create_menu(week_start, menu)
    from_time = Time.utc(week_start.year, week_start.month, week_start.day)
    to_date = week_start + 6.days
    to_time = Time.utc(to_date.year, to_date.month, to_date.day, 23, 59, 59)
    menu.update!(from: from_time, to: to_time)
    WEEKDAY_ORDER.each do |name|
      weekday = Weekday.find_by!(name: name)
      Day.create!(menu: menu, weekday: weekday)
    end
    menu.reload
  end
end
