Rails.application.routes.draw do
  post "menus/generate", to: "menus#generate"
  resources :meals, :menus

  resources :days, only: :create
  resources :meal_types, only: :index
end
