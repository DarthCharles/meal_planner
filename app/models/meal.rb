class Meal < ApplicationRecord
  has_many :meal_meal_types, dependent: :destroy
  has_many :meal_types, through: :meal_meal_types
  has_many :daily_meals, dependent: :destroy
  has_many :days, through: :daily_meals

  # Scopes by meal time (a meal can appear in more than one, e.g. avena at breakfast or dinner)
  # Classified Mexican-style: lunch = main/heavy meal, dinner = lighter evening
  scope :breakfast, -> { joins(:meal_types).where(meal_types: { description: "breakfast" }).distinct }
  scope :lunch,     -> { joins(:meal_types).where(meal_types: { description: "lunch" }).distinct }
  scope :dinner,    -> { joins(:meal_types).where(meal_types: { description: "dinner" }).distinct }

  validates :name, :description, presence: true

  def as_json(options = {})
    {}.tap do |h|
      h[:id] = id
      h[:description] = description
      h[:name] = name
      h[:recipe_url] = recipe_url
      h[:meal_types] = meal_types.pluck(:description)
    end
  end
end
