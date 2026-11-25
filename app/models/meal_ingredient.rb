class MealIngredient < ApplicationRecord
  belongs_to :meal
  belongs_to :ingredient
  belongs_to :unit

  validates :quantity, positive_quantity: true, numericality: { greater_than: 0, less_than_or_equal_to: PositiveQuantityValidator::MAXIMUM }

  scope :ordered, -> { order(:position, :id) }

  def as_json(options = {})
    profile = package_presentation
    { id: id, ingredient_id: ingredient_id, name: ingredient.name, quantity: quantity,
      unit: unit.code, package_quantity: profile&.package_quantity, package_unit: profile&.package_unit&.code,
      preparation_note: preparation_note, position: position }
  end

  def requirement
    if unit.package?
      profile = package_presentation
      return nil unless profile&.package_quantity && profile.package_unit

      return [Rational(quantity.to_s) * Rational(profile.package_quantity.to_s) * profile.package_unit.canonical_factor,
        profile.package_unit.canonical_code]
    end

    [Rational(quantity.to_s) * unit.canonical_factor, unit.canonical_code]
  end

  private

  def package_presentation
    profile = ingredient.shopping_profile if unit.package?
    profile if profile&.mode == "package"
  end
end
