# frozen_string_literal: true

class MealMealType < ApplicationRecord
  belongs_to :meal
  belongs_to :meal_type
end
