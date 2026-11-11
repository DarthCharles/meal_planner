class MenusController < ApplicationController
  before_action :find_menu, only: %i[update shopping_list]

  def generate
    week_start = MenuGenerationService.next_monday(from: Time.current.utc)
    menu = MenuGenerationService.new.call(week_start: week_start, **menu_params)
    render json: { data: menu }, status: :created
  rescue MenuGenerationService::InsufficientMealsError => e
    render json: { errors: e.message }, status: :unprocessable_entity
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors }, status: :unprocessable_entity
  end

  def update
    if @menu.update(menu_params)
      render json: { data: @menu }
    else
      render json: { errors: @menu.errors }, status: :unprocessable_entity
    end
  end

  def shopping_list
    render json: { data: MenuShoppingListService.new.call(menu: @menu) }
  end

  def index
    @menus = Menu.order(from: :desc, id: :desc)
    render json: { data: @menus }, status: :ok
  end

  def show
    @menu = Menu.find_by(id: params[:id])

    if @menu.present?
      render json: { data: @menu }, status: :ok
    else
      render json: { errors: I18n.t("api.menu_not_found", id: params[:id]) }, status: 404
    end
  end

  private

  def find_menu
    @menu = Menu.find_by(id: params[:id])
    render json: { errors: I18n.t("api.menu_not_found", id: params[:id]) }, status: :not_found unless @menu
  end

  def menu_params
    return {} unless params.key?(:people_count)

    value = params[:people_count]
    { people_count: value.is_a?(Integer) || value.is_a?(String) ? value : nil }
  end
end
