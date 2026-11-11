class MealsController < ApplicationController
  def index
    @meals = Meal.includes(:preferred_weekdays)
    render json: { data: @meals }, status: :ok
  end

  def show
    @meal = Meal.find_by(id: params[:id])

    if @meal.present?
      render json: { data: @meal }, status: :ok
    else
      render json: { errors: I18n.t("api.meal_not_found", id: params[:id]) }, status: 404
    end
  end

  def create
    @meal = Meal.new
    save_meal
  end

  def update
    @meal = Meal.find(params[:id])

    save_meal
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
    permitted = params.permit(
      :id,
      :name,
      :recipe_url,
      :description,
      :servings,
      preferred_days: [],
      meal_type_ids: [],
      ingredients: %i[ingredient_id name quantity unit preparation_note position]
    )
    if params.key?(:servings)
      value = params[:servings]
      permitted[:servings] = value.is_a?(Integer) || value.is_a?(String) ? value : nil
    end
    if params.key?(:preferred_days)
      days = params[:preferred_days]
      permitted[:preferred_days] = days.is_a?(Array) && days.all? { |day| day.is_a?(String) } ? days : nil
    end
    if params.key?(:ingredients)
      rows = params[:ingredients]
      unless rows.is_a?(Array) && rows.all? { |row| row.is_a?(ActionController::Parameters) }
        permitted[:ingredients] = nil
      end
    end
    permitted
  end

  def save_meal
    MealSaveService.new(@meal, meal_params).call
    render json: { data: @meal }, status: :ok
  rescue ActiveRecord::RecordInvalid
    render json: { errors: @meal.errors }, status: :unprocessable_entity
  end
end
