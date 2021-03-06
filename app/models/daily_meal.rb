class DailyMeal < ApplicationRecord
    belongs_to :meal
    belongs_to :day
end
