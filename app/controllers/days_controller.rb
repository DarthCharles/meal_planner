class DaysController < ApplicationController
  def create
    binding.pry
    @meals = Meal.find_by(id: day_params[:meal_ids])

    @day = Day.new(day_params)
    @day.meals = @meals

    if @day.valid?
      @day.save!
      render json: { data: @day }, status: :ok
    else
      render json: { erros: @day.errors }, status: 500
    end
  end

  def day_params
    params.permit(
      :id,
      :weekday_id,
      :menu_id,
      :meal_ids
    )
  end
end
