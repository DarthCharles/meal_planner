class IngredientsController < ApplicationController
  def index
    render json: { data: Ingredient.order(:normalized_name, :id).select(:id, :name) }
  end
end
