# frozen_string_literal: true

# Ensure lookup data exists. English labels, Mexican meaning: lunch = main meal, dinner = lighter evening
Date::DAYNAMES.map(&:downcase).each { |name| Weekday.find_or_create_by!(name: name) }
%w[breakfast lunch dinner].each { |desc| MealType.find_or_create_by!(description: desc) }

# Meals to seed: [name, meal_type_descriptions]. Classified Mexican-style (lunch = heavy/main, dinner = lighter).
# A meal can have multiple types (e.g. avena at breakfast or dinner).
MEALS_TO_SEED = [
  # Breakfast (morning)
  ["Huevos a la mexicana", %w[breakfast]],
  ["Chilaquiles verdes con huevo", %w[breakfast]],
  ["Hot cakes de avena con plátano", %w[breakfast]],
  ["Avena cocida", %w[breakfast dinner]],
  ["Molletes con frijoles y panela", %w[breakfast]],
  ["Yogurt con avena y plátano", %w[breakfast]],
  ["Omelette de huevo y espinaca", %w[breakfast]],
  # Pollo — lunch = main meal, dinner = lighter
  ["Brochetas de pollo", %w[lunch]],
  ["Estofado de pollo", %w[lunch]],
  ["Milanesa de pollo", %w[lunch]],
  ["Pollo a la plancha con arroz blanco", %w[lunch]],
  ["Pollo con crema de champiñones", %w[lunch]],
  ["Pollo con pimiento", %w[lunch]],
  ["Pollo con rajas y chile", %w[lunch]],
  ["Pollo en crema de cilantro", %w[lunch]],
  ["Pollo en crema de chipotle", %w[lunch]],
  ["Pollo en mole", %w[lunch]],
  ["Wrap de pollo", %w[lunch dinner]],
  ["Yakimeshi con pollo", %w[lunch]],
  ["Ensalada de pollo", %w[lunch dinner]],
  ["Enchiladas entomatadas", %w[lunch]],
  ["Mole", %w[lunch]],
  ["Pasta Alfredo", %w[lunch]],
  ["Sopa de tortilla", %w[lunch dinner]],
  ["Taquitos dorados", %w[lunch]],
  ["Tostadas de pollo", %w[lunch dinner]],
  ["Chop suey de pollo", %w[lunch]],
  ["Chow mein de pollo", %w[lunch]],
  # Res
  ["Barbacoa", %w[lunch]],
  ["Bistec ranchero", %w[lunch]],
  ["Carne con chile", %w[lunch]],
  ["Hamburguesa", %w[lunch]],
  ["Picadillo", %w[lunch]],
  ["Tostadas carne con papa", %w[lunch]],
  ["Caldo de Albóndigas", %w[lunch]],
  ["Albóndigas entomatadas", %w[lunch]],
  ["Gorditas", %w[lunch]],
  ["Ropa vieja", %w[lunch]],
  # Cerdo
  ["Pulled pork", %w[lunch]],
  ["Tacos de adobada", %w[lunch]],
  # Pescado / Atún
  ["Tacos de atún con queso", %w[lunch dinner]],
  ["Ensalada de atun", %w[lunch dinner]],
  # Vegetariano
  ["Calabacitas con queso", %w[lunch dinner]],
  ["Caldo de queso", %w[lunch dinner]],
  ["Ensalada de garbanzo", %w[lunch dinner]],
  ["Espagueti con queso", %w[lunch dinner]],
].freeze

MEALS_TO_SEED.each do |name, type_descriptions|
  meal = Meal.find_or_create_by!(name: name) do |m|
    m.description = name
    m.recipe_url = ""
  end
  type_descriptions.each do |desc|
    type = MealType.find_by!(description: desc)
    meal.meal_types << type unless meal.meal_types.include?(type)
  end
end

# One full sample menu: 7 days, 3 meals per day (breakfast, lunch, dinner)
from = Time.zone.parse("2025-03-01 00:00:00")
to = Time.zone.parse("2025-03-21 00:00:00")
menu = Menu.find_or_create_by!(from: from, to: to)

# [weekday_name, [breakfast_name, lunch_name, dinner_name]]
FULL_MENU_MEALS = [
  ["monday",    "Huevos a la mexicana",      "Brochetas de pollo",       "Wrap de pollo"],
  ["tuesday",   "Chilaquiles verdes con huevo", "Sopa de tortilla",       "Ensalada de garbanzo"],
  ["wednesday", "Hot cakes de avena con plátano", "Pollo en mole",        "Calabacitas con queso"],
  ["thursday",  "Avena cocida",              "Bistec ranchero",          "Tostadas de pollo"],
  ["friday",    "Molletes con frijoles y panela", "Ropa vieja",           "Sopa de tortilla"],
  ["saturday",  "Yogurt con avena y plátano", "Barbacoa",                "Ensalada de pollo"],
  ["sunday",    "Omelette de huevo y espinaca", "Carne con chile",        "Caldo de queso"],
].freeze

FULL_MENU_MEALS.each do |weekday_name, breakfast_name, lunch_name, dinner_name|
  weekday = Weekday.find_by!(name: weekday_name)
  day = Day.find_or_create_by!(menu: menu, weekday: weekday)

  [[0, breakfast_name], [1, lunch_name], [2, dinner_name]].each do |position, meal_name|
    meal = Meal.find_by!(name: meal_name)
    DailyMeal.find_or_create_by!(day: day, meal: meal) do |dm|
      dm.position = position
    end
  end
end
