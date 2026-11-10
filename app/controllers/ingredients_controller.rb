class IngredientsController < ApplicationController
  def index
    render json: { data: Ingredient.includes(:meals).order(:normalized_name, :id).map(&:catalog_json) }
  end

  def create
    save_ingredient(Ingredient.new, :created)
  end

  def update
    ingredient = Ingredient.find_by(id: params[:id])
    unless ingredient
      render json: { errors: "Ingredient not found" }, status: :not_found
      return
    end

    save_ingredient(ingredient, :ok)
  end

  def destroy
    ingredient = Ingredient.find_by(id: params[:id])
    unless ingredient
      render json: { errors: "Ingredient not found" }, status: :not_found
      return
    end

    ingredient.destroy!
    render json: { data: true }, status: :ok
  rescue ActiveRecord::DeleteRestrictionError, ActiveRecord::InvalidForeignKey
    render json: { errors: "Cannot delete an ingredient used by meals. Remove it from those meals first." }, status: :unprocessable_entity
  end

  private

  def save_ingredient(ingredient, status)
    if ingredient.update(params.permit(:name))
      render json: { data: ingredient.catalog_json }, status: status
    else
      errors = ingredient.errors.to_hash.transform_keys { |key| key == :normalized_name ? :name : key }
      render json: { errors: errors }, status: :unprocessable_entity
    end
  end
end
