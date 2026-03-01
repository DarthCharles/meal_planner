class MenusController < ApplicationController
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
