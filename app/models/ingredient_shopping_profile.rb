class IngredientShoppingProfile < ApplicationRecord
  belongs_to :ingredient
  belongs_to :shopping_unit, class_name: "Unit"
  belongs_to :package_unit, class_name: "Unit", optional: true

  validates :ingredient_id, uniqueness: true
  validates :mode, inclusion: { in: %w[bulk piece package] }
  validates :package_quantity, positive_quantity: true, if: -> { mode == "package" }
  validate :valid_units

  def requirement_unit
    mode == "package" ? package_unit : shopping_unit
  end

  def configuration_json
    { ingredient_id: ingredient_id, mode: mode, shopping_unit: shopping_unit.code,
      package_quantity: package_quantity, package_unit: package_unit&.code }
  end

  private

  def valid_units
    if shopping_unit
      valid = case mode
      when "bulk" then %w[g kg ml l].include?(shopping_unit.code)
      when "piece" then shopping_unit.code == "piece"
      when "package" then shopping_unit.package?
      else false
      end
      errors.add(:shopping_unit, :invalid) unless valid
    end
    if mode == "package"
      errors.add(:package_unit, :invalid) unless package_unit && %w[g kg ml l piece].include?(package_unit.code)
    elsif package_unit || package_quantity
      errors.add(:package_quantity, :unexpected_contents)
    end
  end
end
