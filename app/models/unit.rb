class Unit < ApplicationRecord
  STANDARD = {
    "g" => ["grams", "mass", 1], "kg" => ["kilograms", "mass", 1000],
    "ml" => ["milliliters", "volume", 1], "l" => ["liters", "volume", 1000],
    "teaspoon" => ["teaspoons", "volume", 5], "tablespoon" => ["tablespoons", "volume", 15],
    "cup" => ["cups", "volume", 240], "piece" => ["pieces", "count", 1],
    "jar" => ["jars", "package", nil], "bag" => ["bags", "package", nil],
    "can" => ["cans", "package", nil], "bottle" => ["bottles", "package", nil],
    "package" => ["packages", "package", nil]
  }.freeze
  DEFAULTS = STANDARD.transform_values(&:first).freeze
  CANONICAL_CODES = { "mass" => "g", "volume" => "ml", "count" => "piece" }.freeze

  has_many :meal_ingredients, dependent: :restrict_with_exception
  has_many :shopping_profiles, class_name: "IngredientShoppingProfile", foreign_key: :shopping_unit_id, dependent: :restrict_with_exception
  has_many :package_shopping_profiles, class_name: "IngredientShoppingProfile", foreign_key: :package_unit_id, dependent: :restrict_with_exception
  has_many :packaged_meal_ingredients, class_name: "MealIngredient", foreign_key: :package_unit_id, dependent: :restrict_with_exception

  before_validation :apply_standard, on: :create
  validates :code, uniqueness: true, inclusion: { in: STANDARD.keys }
  validates :name, :dimension, presence: true
  validate :standard_definition

  def package?
    dimension == "package"
  end

  def canonical_code
    CANONICAL_CODES.fetch(dimension)
  end

  def canonical_factor
    Rational(factor.to_s)
  end

  def selection_json
    { code: code, name: name, dimension: dimension,
      canonical_unit: package? ? nil : canonical_code, factor: factor }
  end

  def self.for_select
    order(:code).map(&:selection_json)
  end

  private

  def apply_standard
    return unless (definition = STANDARD[code])

    self.name ||= definition[0]
    self.dimension = definition[1]
    self.factor = definition[2]
  end

  def standard_definition
    return unless (definition = STANDARD[code])

    errors.add(:dimension, :invalid) unless dimension == definition[1]
    errors.add(:factor, :invalid) unless factor == definition[2]
  end
end
