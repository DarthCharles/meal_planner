class MealIngredient < ApplicationRecord
  belongs_to :meal
  belongs_to :ingredient
  belongs_to :unit
  belongs_to :package_unit, class_name: "Unit", optional: true

  validates :quantity, positive_quantity: true, numericality: { greater_than: 0, less_than_or_equal_to: PositiveQuantityValidator::MAXIMUM }
  validates :package_quantity, positive_quantity: true, if: -> { unit&.package? && (package_quantity.present? || package_unit.present?) }
  validate :valid_package_contents

  scope :ordered, -> { order(:position, :id) }

  def as_json(options = {})
    { id: id, ingredient_id: ingredient_id, name: ingredient.name, quantity: quantity,
      unit: unit.code, package_quantity: package_quantity, package_unit: package_unit&.code,
      preparation_note: preparation_note, position: position }
  end

  # Recipe package contents are a snapshot, independent of the current shopping profile.
  def requirement
    if unit.package?
      return nil unless package_quantity && package_unit

      [Rational(quantity.to_s) * Rational(package_quantity.to_s) * package_unit.canonical_factor, package_unit.canonical_code]
    else
      [Rational(quantity.to_s) * unit.canonical_factor, unit.canonical_code]
    end
  end

  private

  def valid_package_contents
    if unit&.package? && (package_quantity.present? || package_unit.present?)
      errors.add(:package_unit, :invalid) unless package_unit && %w[g kg ml l piece].include?(package_unit.code)
    elsif (package_quantity || package_unit) && !unit&.package?
      errors.add(:package_quantity, :unexpected_contents)
    end
  end
end
