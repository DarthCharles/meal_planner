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
      render json: { errors: "Meal with id #{params[:id]} not found" }, status: 404
    end
  end

  def create
    @meal = Meal.new(meal_params.except(:meal_type_ids, :ingredients))

    if @meal.valid?
      Meal.transaction do
        @meal.save!
        sync_ingredients(@meal) if params.key?(:ingredients)
      end
      assign_meal_types(@meal)
      render json: { data: @meal }, status: :ok
    else
      render json: { errors: @meal.errors }, status: :unprocessable_entity
    end
  end

  def update
    @meal = Meal.find(params[:id])

    if @meal.update(meal_params.except(:meal_type_ids, :ingredients))
      assign_meal_types(@meal)
      sync_ingredients(@meal) if params.key?(:ingredients)
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
    permitted = params.permit(
      :id,
      :name,
      :recipe_url,
      :description,
      preferred_days: [],
      meal_type_ids: [],
      ingredients: %i[name quantity unit preparation_note position]
    )
    if params.key?(:preferred_days)
      days = params[:preferred_days]
      permitted[:preferred_days] = days.is_a?(Array) && days.all? { |day| day.is_a?(String) } ? days : nil
    end
    permitted
  end

  def assign_meal_types(meal)
    ids = Array(params[:meal_type_ids]).reject(&:blank?).map(&:to_i)
    meal.meal_type_ids = ids if ids.any?
  end

  def sync_ingredients(meal)
    ingredient_rows = Array(params[:ingredients])
    meal.meal_ingredients.destroy_all

    ingredient_rows.each_with_index do |attributes, index|
      ingredient = Ingredient.find_or_create_by!(name: attributes[:name])
      unit = Unit.find_by!(code: attributes[:unit].to_s.strip.downcase)
      meal.meal_ingredients.create!(
        ingredient: ingredient,
        unit: unit,
        quantity: attributes[:quantity],
        preparation_note: attributes[:preparation_note],
        position: attributes[:position].presence || index
      )
    end
  end
end
