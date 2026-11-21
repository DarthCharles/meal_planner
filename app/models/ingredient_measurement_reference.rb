class IngredientMeasurementReference < ApplicationRecord
  KINDS = %w[density piece_weight].freeze

  belongs_to :ingredient
  validates :kind, inclusion: { in: KINDS }, uniqueness: { scope: :ingredient_id }
  validates :quantity, :reference_quantity, positive_quantity: true
  validates :source, :description, presence: true
  validates :approximate, inclusion: { in: [true, false] }

  # Density is quantity grams per reference_quantity ml; piece_weight uses pieces.
  def configuration_json
    { kind: kind, quantity: quantity, reference_quantity: reference_quantity, source: source, description: description, approximate: approximate }
  end
end
