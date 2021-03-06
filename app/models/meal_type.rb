class MealType < ApplicationRecord
  has_many :meals

  def self.for_select
    MealType.all.map { |type| [type.description, type.id] }
  end
end
