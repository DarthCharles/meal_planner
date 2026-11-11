class Unit < ApplicationRecord
  DEFAULTS = {
    "g" => "grams",
    "kg" => "kilograms",
    "ml" => "milliliters",
    "l" => "liters",
    "pieza" => "pieces",
    "taza" => "cups",
    "cucharada" => "tablespoons",
    "cucharadita" => "teaspoons",
    "diente" => "cloves",
    "frasco" => "jars",
    "bag" => "bags",
    "can" => "cans",
    "bottle" => "bottles",
    "package" => "packages"
  }.freeze

  has_many :meal_ingredients, dependent: :restrict_with_exception
  has_many :ingredient_unit_equivalences, dependent: :restrict_with_exception
  has_many :base_shopping_profiles, class_name: "IngredientShoppingProfile", foreign_key: :base_unit_id, dependent: :restrict_with_exception
  has_many :shopping_profiles, class_name: "IngredientShoppingProfile", foreign_key: :shopping_unit_id, dependent: :restrict_with_exception

  # Only these conversions are universal. Household measures and package sizes
  # must be defined for an ingredient; a cup is not assumed to have one size.
  def self.canonical(code)
    case code
    when "kg" then ["g", Rational(1000)]
    when "l" then ["ml", Rational(1000)]
    else [code, Rational(1)]
    end
  end

  validates :code, :name, presence: true
  validates :code, uniqueness: true

  def self.for_select
    order(:code).map { |unit| { code: unit.code, name: unit.name } }
  end
end
