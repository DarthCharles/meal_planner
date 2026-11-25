class MenuHomeQuery
  # SQLite numbers weekdays from Sunday. The modifier finds the first matching
  # calendar day on or after the menu starts, including legacy non-Monday menus.
  SCHEDULED_DATE = <<~SQL.squish.freeze
    date(substr(menus."from", 1, 10), 'weekday ' || CASE lower(weekdays.name)
      WHEN 'sunday' THEN 0 WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2
      WHEN 'wednesday' THEN 3 WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5
      WHEN 'saturday' THEN 6 END)
  SQL

  def call(date:)
    start_of_day = date.in_time_zone("UTC")
    tomorrow = start_of_day.tomorrow
    current_menu = Menu.newest_first.where(from: ...tomorrow, to: start_of_day..)
      .with_recipe_details.first
    next_week_start = MenuGenerationService.next_monday
    next_week_end = next_week_start + 6
    next_week_menu_id = Menu.newest_first
      .where(from: next_week_start.in_time_zone("UTC")...(next_week_end + 1).in_time_zone("UTC"))
      .pick(:id)
    weekday = Date::DAYNAMES[date.wday].downcase
    needs_next_meal = current_menu && current_menu.days.none? do |day|
      day.weekday.name.downcase == weekday && day.daily_meals.any?
    end

    {
      current_menu: current_menu,
      next_week: { from: next_week_start, to: next_week_end },
      next_week_menu_id: next_week_menu_id,
      next_meal_date: needs_next_meal ? next_meal_date(date, tomorrow) : nil,
      has_saved_menus: current_menu.present? || next_week_menu_id.present? || Menu.exists?,
      has_meals: Meal.exists?
    }
  end

  private

  def next_meal_date(date, tomorrow)
    Menu.where(to: tomorrow..).joins(days: :weekday)
      .where("EXISTS (SELECT 1 FROM daily_meals WHERE daily_meals.day_id = days.id)")
      .where("#{SCHEDULED_DATE} > ? AND #{SCHEDULED_DATE} <= substr(menus.\"to\", 1, 10)", date.iso8601)
      .pick(Arel.sql("MIN(#{SCHEDULED_DATE})"))
  end
end
