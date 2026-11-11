class IngredientUnitEquivalence < ApplicationRecord
  # Keep six decimal places within the range safely persisted by SQLite numeric affinity.
  MAXIMUM_QUANTITY = 1_000_000_000

  belongs_to :ingredient_shopping_profile, inverse_of: :unit_equivalences
  belongs_to :unit

  validates :quantity, numericality: { greater_than: 0, less_than_or_equal_to: MAXIMUM_QUANTITY }
  validates :unit_id, uniqueness: { scope: :ingredient_shopping_profile_id }
  validates :source, :description, presence: true
  validates :approximate, inclusion: { in: [true, false] }
  validate :canonical_unit
  validate :finite_quantity

  def usable_quantity?
    quantity && quantity.finite? && quantity.positive? && quantity <= MAXIMUM_QUANTITY
  end

  private

  def finite_quantity
    return unless quantity

    if !quantity.finite?
      errors.add(:quantity, :not_a_number)
    elsif !quantity.positive?
      # Numericality can inspect the input before decimal scale is applied.
      errors.add(:quantity, :greater_than, count: 0) unless errors[:quantity].any?
    elsif quantity > MAXIMUM_QUANTITY
      errors.add(:quantity, :less_than_or_equal_to, count: MAXIMUM_QUANTITY) unless errors[:quantity].any?
    end
  end

  def canonical_unit
    return unless unit

    if Unit.canonical(unit.code).first != unit.code || unit == ingredient_shopping_profile&.base_unit
      errors.add(:unit, :redundant_equivalence)
    end
  end
end
