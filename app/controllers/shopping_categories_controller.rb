class ShoppingCategoriesController < ApplicationController
  def index
    render json: { data: ShoppingCategory.catalog }
  end
end
