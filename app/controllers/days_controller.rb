class DaysController < ApplicationController
  def create
    permitted = params.permit(:id, :weekday_id, :menu_id, meal_ids: [])
    meal_ids = Array(permitted[:meal_ids]).reject(&:blank?)

    @day = Day.new(permitted.except(:meal_ids))
    @day.meals = Meal.where(id: meal_ids) if meal_ids.any?

    if @day.valid?
      @day.save!
      render json: { data: @day }, status: :ok
    else
      render json: { errors: @day.errors }, status: :unprocessable_entity
    end
  end
end
