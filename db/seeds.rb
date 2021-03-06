# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

meal_types = %w{breakfast lunch dinner collation}.freeze
day_names = Date::DAYNAMES

day_names.each do |day_name|
  Weekday.create(name: day_name)
end

meal_types.each do |meal_type|
  MealType.create(description: meal_type)
end

Meal.create({
  name: "Huevitos",
  description: "2 huevos revueltos",
  meal_type: MealType.all.sample,
})

Meal.create({ name: "Pollito",
              description: "Chicken Stirr Fry",
              meal_type: MealType.all.sample,
              recipe_url: "www.google.com" })

Meal.create({
  name: "Lunch",
  description: "Club Sandwich",
  meal_type: MealType.all.sample,
})

menu = Menu.create({ from: Time.now, to: Time.now + 3.weeks })

Day.create({ weekday: "Monday", menu_id: menu.id, meals: Meal.first(2) })
Day.create({ weekday: "Tuesday", menu_id: menu.id, meals: [Meal.last] })
