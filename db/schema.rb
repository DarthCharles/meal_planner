# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_24_170000) do
  create_table "daily_meals", force: :cascade do |t|
    t.integer "day_id", null: false
    t.integer "meal_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "position", default: 0, null: false
    t.index ["day_id", "meal_id"], name: "index_daily_meals_on_day_id_and_meal_id", unique: true
    t.index ["day_id"], name: "index_daily_meals_on_day_id"
    t.index ["meal_id"], name: "index_daily_meals_on_meal_id"
  end

  create_table "days", force: :cascade do |t|
    t.integer "menu_id", null: false
    t.integer "weekday_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["menu_id", "weekday_id"], name: "index_days_on_menu_id_and_weekday_id", unique: true
    t.index ["menu_id"], name: "index_days_on_menu_id"
    t.index ["weekday_id"], name: "index_days_on_weekday_id"
  end

  create_table "ingredients", force: :cascade do |t|
    t.string "name", null: false
    t.string "normalized_name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["normalized_name"], name: "index_ingredients_on_normalized_name", unique: true
  end

  create_table "meal_ingredients", force: :cascade do |t|
    t.integer "meal_id", null: false
    t.integer "ingredient_id", null: false
    t.decimal "quantity", precision: 12, scale: 3, null: false
    t.string "preparation_note"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "unit_id", null: false
    t.index ["ingredient_id"], name: "index_meal_ingredients_on_ingredient_id"
    t.index ["meal_id", "ingredient_id"], name: "index_meal_ingredients_on_meal_id_and_ingredient_id", unique: true
    t.index ["meal_id", "position"], name: "index_meal_ingredients_on_meal_id_and_position"
    t.index ["meal_id"], name: "index_meal_ingredients_on_meal_id"
    t.index ["unit_id"], name: "index_meal_ingredients_on_unit_id"
  end

  create_table "meal_meal_types", force: :cascade do |t|
    t.integer "meal_id", null: false
    t.integer "meal_type_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["meal_id", "meal_type_id"], name: "index_meal_meal_types_on_meal_id_and_meal_type_id", unique: true
    t.index ["meal_id"], name: "index_meal_meal_types_on_meal_id"
    t.index ["meal_type_id"], name: "index_meal_meal_types_on_meal_type_id"
  end

  create_table "meal_types", force: :cascade do |t|
    t.string "description", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["description"], name: "index_meal_types_on_description", unique: true
  end

  create_table "meals", force: :cascade do |t|
    t.string "name", null: false
    t.string "recipe_url", default: ""
    t.string "description", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "menus", force: :cascade do |t|
    t.datetime "from", precision: nil, null: false
    t.datetime "to", precision: nil, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "units", force: :cascade do |t|
    t.string "code", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_units_on_code", unique: true
  end

  create_table "weekdays", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_weekdays_on_name", unique: true
  end

  add_foreign_key "daily_meals", "days"
  add_foreign_key "daily_meals", "meals"
  add_foreign_key "days", "menus"
  add_foreign_key "days", "weekdays"
  add_foreign_key "meal_ingredients", "ingredients"
  add_foreign_key "meal_ingredients", "meals"
  add_foreign_key "meal_ingredients", "units"
  add_foreign_key "meal_meal_types", "meal_types"
  add_foreign_key "meal_meal_types", "meals"
end
