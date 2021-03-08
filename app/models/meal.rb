class Meal < ApplicationRecord
  belongs_to :meal_type
  has_many :daily_meals
  has_many :days, through: :daily_meals

  scope :breakfast, -> { Meal.where(meal_type: MealType.breakfast) }
  scope :lunch, -> { Meal.where(meal_type: MealType.lunch) }
  scope :dinner, -> { Meal.where(meal_type: MealType.dinner) }
  scope :collation, -> { Meal.where(meal_type: MealType.collation) }

  validates :name, :description, presence: true

  def as_json(options = {})
    {}.tap do |h|
      h[:id] = id
      h[:description] = description
      h[:name] = name
      h[:recipe_url] = recipe_url
      h[:type] = meal_type.description
    end
  end
end
