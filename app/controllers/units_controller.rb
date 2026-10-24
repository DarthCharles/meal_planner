class UnitsController < ApplicationController
  def index
    render json: { data: Unit.for_select }, status: :ok
  end
end
