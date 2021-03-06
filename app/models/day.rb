class Day < ApplicationRecord
    belongs_to :menu
    has_many :daily_meals
    has_many :meals, through: :daily_meals
end
