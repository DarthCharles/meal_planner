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
    "diente" => "cloves"
  }.freeze

  has_many :meal_ingredients, dependent: :restrict_with_exception

  validates :code, :name, presence: true
  validates :code, uniqueness: true

  def self.for_select
    order(:code).map { |unit| { code: unit.code, name: unit.name } }
  end
end
