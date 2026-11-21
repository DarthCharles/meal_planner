class IngredientShoppingProfilesController < ApplicationController
  before_action :find_ingredient

  def show
    render json: { data: @ingredient.shopping_profile&.configuration_json }
  end

  def update
    attributes = %i[mode shopping_unit package_quantity package_unit].index_with { |key| params[key] }
    profile = IngredientShoppingProfileSaveService.new.call(ingredient: @ingredient, attributes: attributes)
    render json: { data: profile.configuration_json }
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors }, status: :unprocessable_entity
  end

  def destroy
    @ingredient.shopping_profile&.destroy!
    render json: { data: true }
  end

  private

  def find_ingredient
    @ingredient = Ingredient.find_by(id: params[:ingredient_id])
    render json: { errors: I18n.t("api.ingredient_not_found") }, status: :not_found unless @ingredient
  end
end
