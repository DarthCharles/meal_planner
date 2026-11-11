class IngredientShoppingProfilesController < ApplicationController
  before_action :find_ingredient

  def show
    render json: { data: @ingredient.shopping_profile&.configuration_json }
  end

  def update
    profile = IngredientShoppingProfileSaveService.new.call(ingredient: @ingredient, attributes: profile_params.to_h)
    render json: { data: profile.configuration_json }
  rescue ActiveRecord::RecordInvalid => error
    errors = error.record.errors.to_hash.transform_keys do |key|
      key.to_s.sub(/\Aunit_equivalences/, "equivalences")
    end
    render json: { errors: errors }, status: :unprocessable_entity
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

  def profile_params
    permitted = params.permit(:base_unit, :shopping_unit, :round_up,
      equivalences: %i[unit quantity source description approximate])
    %i[base_unit shopping_unit round_up].each do |key|
      permitted[key] = nil if params.key?(key) && !permitted.key?(key)
    end
    if params.key?(:equivalences)
      rows = params[:equivalences]
      permitted[:equivalences] = if rows.is_a?(Array) && rows.all? { |row| row.is_a?(ActionController::Parameters) }
        rows.map do |row|
          fields = row.permit(:unit, :quantity, :source, :description, :approximate)
          %i[unit quantity source description approximate].each do |key|
            fields[key] = nil if row.key?(key) && !fields.key?(key)
          end
          fields
        end
      end
    end
    permitted
  end
end
