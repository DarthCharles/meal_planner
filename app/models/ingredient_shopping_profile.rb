class IngredientShoppingProfile < ApplicationRecord
  belongs_to :ingredient
  belongs_to :base_unit, class_name: "Unit"
  belongs_to :shopping_unit, class_name: "Unit"
  has_many :unit_equivalences, class_name: "IngredientUnitEquivalence", dependent: :destroy,
    inverse_of: :ingredient_shopping_profile, autosave: true

  validates :ingredient_id, uniqueness: true
  validates :round_up, inclusion: { in: [true, false] }
  validates_associated :unit_equivalences
  validate :valid_units

  # Returns [base quantity per unit, approximate], or nil if no conversion exists.
  def factor_for(code)
    canonical, multiplier = Unit.canonical(code)
    return [multiplier, false] if canonical == base_unit&.code

    equivalence = unit_equivalences.find { |row| row.unit&.code == canonical }
    return unless equivalence&.usable_quantity?

    [Rational(equivalence.quantity.to_s) * multiplier, equivalence.approximate]
  end

  def configuration_json
    {
      ingredient_id: ingredient_id, base_unit: base_unit.code,
      shopping_unit: shopping_unit.code, round_up: round_up,
      equivalences: unit_equivalences.sort_by { |row| row.unit.code }.map do |row|
        { unit: row.unit.code, quantity: row.quantity, source: row.source,
          description: row.description, approximate: row.approximate }
      end
    }
  end

  private

  def valid_units
    errors.add(:base_unit, :invalid_base_unit) if base_unit && !%w[g ml pieza].include?(base_unit.code)
    return if unit_equivalences.any? { |row| !row.valid? }

    codes = unit_equivalences.map { |row| row.unit.code }
    errors.add(:unit_equivalences, :duplicate_units) if codes.uniq.size != codes.size
    if base_unit && shopping_unit && !factor_for(shopping_unit.code)
      errors.add(:shopping_unit, :missing_equivalence)
    end
  end
end
