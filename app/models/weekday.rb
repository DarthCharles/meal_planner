class Weekday < ApplicationRecord
  Date::DAYNAMES.map(&:downcase).each do |day_name|
    scope day_name.to_sym, -> { find_by(name: day_name) }
  end

  def self.for_select
    Weekday.all.map { |weekday| [weekday.name, type.id] }
  end
end
