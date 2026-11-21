class IngredientMeasurementReferencesController < ApplicationController
  before_action :find_ingredient

  def show
    render json: { data: @ingredient.measurement_references.order(:kind).map(&:configuration_json) }
  end

  def update
    references = IngredientMeasurementReferencesSaveService.new.call(ingredient: @ingredient, references: reference_params)
    render json: { data: references.sort_by(&:kind).map(&:configuration_json) }
  rescue ActiveRecord::RecordInvalid => error
    render json: { errors: error.record.errors }, status: :unprocessable_entity
  end

  private

  def reference_params
    rows = params[:references]
    return rows unless rows.is_a?(Array)

    rows.map do |row|
      next row unless row.is_a?(ActionController::Parameters)

      %i[kind quantity reference_quantity source description approximate].each_with_object({}) do |key, values|
        values[key] = row[key] if row.key?(key)
      end
    end
  end

  def find_ingredient
    @ingredient = Ingredient.find_by(id: params[:ingredient_id])
    render json: { errors: I18n.t("api.ingredient_not_found") }, status: :not_found unless @ingredient
  end
end
