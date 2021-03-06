class MealTypesController < ApplicationController
  def index
    render json: { data: MealType.for_select }, status: :ok
  end
end
