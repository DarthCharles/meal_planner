class MealType < ApplicationRecord
  has_many :meals

  %i{breakfast lunch dinner collation}.each do |meal_type|
    scope meal_type, -> { find_by(description: meal_type) }
  end

  def self.for_select
    MealType.all.map { |type| [type.description, type.id] }
  end
end
