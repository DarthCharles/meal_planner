Rails.application.routes.draw do
  resources :meals, :menus

  resources :meal_types, only: :index
end
