class MealIngredient < ApplicationRecord
  belongs_to :meal
  belongs_to :ingredient
  belongs_to :unit

  validates :quantity, numericality: { greater_than: 0 }
  validates :ingredient_id, uniqueness: { scope: :meal_id }

  scope :ordered, -> { order(:position, :id) }

  def as_json(options = {})
    {}.tap do |hash|
      hash[:id] = id
      hash[:ingredient_id] = ingredient_id
      hash[:name] = ingredient.name
      hash[:quantity] = quantity
      hash[:unit] = unit.code
      hash[:preparation_note] = preparation_note
      hash[:position] = position
    end
  end
end
