Rails.application.routes.draw do
  resources :meals, :menus

  resources :days, only: :create
  resources :meal_types, only: :index
end
