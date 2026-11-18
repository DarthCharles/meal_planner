Rails.application.routes.draw do
  post "menus/generate", to: "menus#generate"
  resources :meals
  resources :menus do
    get :shopping_list, on: :member
  end

  resources :days, only: :create
  resources :meal_types, only: :index
  resources :shopping_categories, only: :index
  resources :units, only: :index
  resources :ingredients, only: %i[index create update destroy] do
    resource :shopping_profile, only: %i[show update destroy], controller: :ingredient_shopping_profiles
  end
end
