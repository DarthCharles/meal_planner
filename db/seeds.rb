# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

Date::DAYNAMES.map(&:downcase).each do |day_name|
  Weekday.create(name: day_name)
end

%w{breakfast lunch dinner collation}.each do |meal_type|
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

Menu.create({ from: Time.now, to: Time.now + 3.weeks })

Day.create({ weekday: Weekday.monday, menu: Menu.first, meals: Meal.first(2) })
Day.create({ weekday: Weekday.tuesday, menu: Menu.first, meals: Meal.first(3) })
Day.create({ weekday: Weekday.wednesday, menu: Menu.first, meals: Meal.first(2) })
