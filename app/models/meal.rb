class Meal < ApplicationRecord
    has_many :daily_meals
    has_many :days, through: :daily_meals
    belongs_to :meal_type

    validates :name, :description, presence: true
end
