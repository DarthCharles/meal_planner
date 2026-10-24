class MenusController < ApplicationController
  def generate
    week_start = MenuGenerationService.next_monday(from: Time.current.utc)
    menu = MenuGenerationService.new.call(week_start: week_start)
    render json: { data: menu }, status: :created
  rescue MenuGenerationService::InsufficientMealsError => e
    render json: { errors: e.message }, status: :unprocessable_entity
  end

  def index
    @menus = Menu.all
    render json: { data: @menus }, status: :ok
  end

  def show
    @menu = Menu.find_by(id: params[:id])

    if @menu.present?
      render json: { data: @menu }, status: :ok
    else
      render json: { errors: "Menu with id #{params[:id]} not found" }, status: 404
    end
  end
end
