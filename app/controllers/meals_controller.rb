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
      render json: { errors: "Meal with id #{params[:id]} not found" }, status: 404
    end
  end

  def create
    @meal = Meal.new(meal_params.except(:meal_type_ids))

    if @meal.valid?
      @meal.save!
      assign_meal_types(@meal)
      render json: { data: @meal }, status: :ok
    else
      render json: { errors: @meal.errors }, status: :unprocessable_entity
    end
  end

  def update
    @meal = Meal.find(params[:id])

    if @meal.update(meal_params.except(:meal_type_ids))
      assign_meal_types(@meal)
      render json: { data: @meal }, status: :ok
    else
      render json: { errors: @meal.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @meal = Meal.find(params[:id])

    if @meal.destroy!
      render json: { data: true }, status: :ok
    else
      render json: { errors: @meal.errors }, status: :unprocessable_entity
    end
  end

  private

  def meal_params
    params.permit(
      :id,
      :name,
      :recipe_url,
      :description,
      meal_type_ids: []
    )
  end

  def assign_meal_types(meal)
    ids = Array(params[:meal_type_ids]).reject(&:blank?).map(&:to_i)
    meal.meal_type_ids = ids if ids.any?
  end
end
