class Ingredient < ApplicationRecord
  has_many :meal_ingredients, dependent: :restrict_with_exception
  has_many :meals, through: :meal_ingredients

  before_validation :normalize_name

  validates :name, presence: true
  validates :normalized_name, presence: true, uniqueness: true

  def catalog_json
    {
      id: id,
      name: name,
      meals: meals.sort_by { |meal| [meal.name.downcase, meal.id] }
        .map { |meal| { id: meal.id, name: meal.name } }
    }
  end

  private

  def normalize_name
    self.name = name.to_s.strip
    self.normalized_name = name.downcase
  end
end
