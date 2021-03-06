class Day < ApplicationRecord
  belongs_to :menu
  belongs_to :weekday

  has_many :daily_meals
  has_many :meals, through: :daily_meals

  def as_json(options = {})
    {}.tap do |h|
      h[:id] = id
      h[:weekday] = weekday.name
      h[:meals] = meals
    end
  end
end
