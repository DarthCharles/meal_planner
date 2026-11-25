# frozen_string_literal: true

class MenuGenerationService
  class InsufficientMealsError < StandardError; end

  WEEKDAY_ORDER = %w[monday tuesday wednesday thursday friday saturday sunday].freeze
  PRESERVE_PEOPLE_COUNT = Object.new.freeze

  def self.next_monday(from: Time.current)
    from.utc.to_date.next_occurring(:monday)
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
    from_begin = week_start.to_date.in_time_zone("UTC")
    from_end = from_begin.advance(weeks: 1)
    existing = Menu.where(from: from_begin...from_end)
    if people_count.equal?(PRESERVE_PEOPLE_COUNT)
      people_count = existing.order(from: :desc, id: :desc).first&.people_count || 1
    end
    menu = Menu.new(people_count: people_count)
    menu.validate!
    existing.find_each(&:destroy!)
    create_menu(menu, from: from_begin, to: from_end - 1.second)
  end

  def create_menu(menu, from:, to:)
    menu.update!(from: from, to: to)
    WEEKDAY_ORDER.each do |name|
      weekday = Weekday.find_by!(name: name)
      Day.create!(menu: menu, weekday: weekday)
    end
    menu.reload
  end
end
