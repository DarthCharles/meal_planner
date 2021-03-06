class MealsController < ApplicationController
  def index
    @meals = Meal.all
    render json: { data: @meals }, status: :ok
  end

  def show
    @meal = Meal.find_by(id: params[:id])

    if @meal.present?
      render json: { data: @meal }, status: :ok
    else
      render json: { erros: "Meal with id #{params[:id]} not found" }, status: 404
    end
  end

  def create
    @meal = Meal.new(meal_params)

    binding.pry
    if @meal.valid?
      @meal.save!
      render json: { data: @meal }, status: :ok
    else
      render json: { erros: @meal.errors }, status: 500
    end
  end

  def update
    @meal = Meal.find(params[:id])

    if @meal.update!(meal_params)
      render json: { data: @meal }, status: :ok
    else
      render json: { erros: @meal.errors }, status: 500
    end
  end

  def destroy
    @meal = Meal.find(params[:id])

    if @meal.destroy!
      render json: { data: true }, status: :ok
    else
      render json: { erros: @meal.errors }, status: 500
    end
  end

  private

  def meal_params
    params.permit(
      :id,
      :name,
      :recipe_url,
      :meal_type_id,
      :description
    )
  end
end
