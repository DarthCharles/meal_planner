class MealPreferredDay < ApplicationRecord
  belongs_to :meal
  belongs_to :weekday
end
