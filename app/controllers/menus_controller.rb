class MenusController < ApplicationController
    def index
        @menus = Menu.all
        render json: { data: @menus }, status: :ok
    end
end
