class Meal < ApplicationRecord
    has_many :daily_meals
    has_many :days, through: :daily_meals
    belongs_to :meal_type

    validates :name, :description, presence: true

    def as_json(options = {})
        {}.tap do |h|
            h[:id] = id
            h[:name] = name
            h[:description] = description
            h[:recipe_url] = recipe_url
            h[:type] = meal_type.description
        end
    end
end
