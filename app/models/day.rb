class Day < ApplicationRecord
  belongs_to :menu
  has_many :daily_meals
  has_many :meals, through: :daily_meals

  def as_json(options = {})
    {}.tap do |h|
      h[:id] = id
      h[:weekday] = weekday
      h[:meals] = meals
    end
  end
end
