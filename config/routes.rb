Rails.application.routes.draw do
  post "menus/generate", to: "menus#generate"
  resources :meals
  resources :menus do
    get :shopping_list, on: :member
  end

  resources :days, only: :create
  resources :meal_types, only: :index
  resources :units, only: :index
  resources :ingredients, only: %i[index create update destroy]
end
