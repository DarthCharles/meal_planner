class MealType < ApplicationRecord
  has_many :meal_meal_types, dependent: :destroy
  has_many :meals, through: :meal_meal_types

  %i[breakfast lunch dinner].each do |name|
    scope name, -> { find_by(description: name.to_s) }
  end

  def self.for_select
    MealType.all.map { |type| [type.description, type.id] }
  end
end
