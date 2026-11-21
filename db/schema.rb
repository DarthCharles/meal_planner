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

ActiveRecord::Schema[8.1].define(version: 2026_11_21_122000) do
  create_table "daily_meals", id: :integer, default: nil, force: :cascade do |t|
    t.integer "day_id", null: false
    t.integer "meal_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "position", default: 0, null: false
    t.index ["day_id", "meal_id"], name: "index_daily_meals_on_day_id_and_meal_id", unique: true
    t.index ["day_id"], name: "index_daily_meals_on_day_id"
    t.index ["meal_id"], name: "index_daily_meals_on_meal_id"
  end

  create_table "days", id: :integer, default: nil, force: :cascade do |t|
    t.integer "menu_id", null: false
    t.integer "weekday_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["menu_id", "weekday_id"], name: "index_days_on_menu_id_and_weekday_id", unique: true
    t.index ["menu_id"], name: "index_days_on_menu_id"
    t.index ["weekday_id"], name: "index_days_on_weekday_id"
  end

  create_table "ingredient_measurement_references", force: :cascade do |t|
    t.integer "ingredient_id", null: false
    t.string "kind", null: false
    t.decimal "quantity", precision: 18, scale: 6, null: false
    t.string "source", null: false
    t.string "description", null: false
    t.boolean "approximate", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "reference_quantity", precision: 18, scale: 6, default: "1.0", null: false
    t.index ["ingredient_id", "kind"], name: "index_measurement_references_on_ingredient_and_kind", unique: true
    t.index ["ingredient_id"], name: "index_ingredient_measurement_references_on_ingredient_id"
    t.check_constraint "kind IN ('density', 'piece_weight')", name: "measurement_references_valid_kind"
    t.check_constraint "quantity > 0 AND quantity <= 1000000000", name: "measurement_references_positive_quantity"
    t.check_constraint "reference_quantity > 0 AND reference_quantity <= 1000000000", name: "measurement_references_positive_basis"
  end

  create_table "ingredient_shopping_profiles", force: :cascade do |t|
    t.integer "ingredient_id", null: false
    t.string "mode", null: false
    t.integer "shopping_unit_id", null: false
    t.decimal "package_quantity", precision: 18, scale: 6
    t.integer "package_unit_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ingredient_id"], name: "index_ingredient_shopping_profiles_on_ingredient_id", unique: true
    t.index ["package_unit_id"], name: "index_ingredient_shopping_profiles_on_package_unit_id"
    t.index ["shopping_unit_id"], name: "index_ingredient_shopping_profiles_on_shopping_unit_id"
    t.check_constraint "(mode = 'package' AND package_quantity IS NOT NULL AND package_quantity > 0 AND package_quantity <= 1000000000 AND package_unit_id IS NOT NULL) OR (mode <> 'package' AND package_quantity IS NULL AND package_unit_id IS NULL)", name: "shopping_profiles_valid_contents"
    t.check_constraint "mode IN ('bulk', 'piece', 'package')", name: "shopping_profiles_valid_mode"
  end

  create_table "ingredients", force: :cascade do |t|
    t.string "name", null: false
    t.string "normalized_name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "shopping_category", default: "uncategorized", null: false
    t.index ["normalized_name"], name: "index_ingredients_on_normalized_name", unique: true
    t.check_constraint "shopping_category IN ('produce', 'meat', 'deli', 'dairy_eggs', 'bakery_tortillas', 'pantry', 'frozen', 'uncategorized')", name: "ingredients_valid_shopping_category"
  end

  create_table "meal_ingredients", force: :cascade do |t|
    t.integer "meal_id", null: false
    t.integer "ingredient_id", null: false
    t.decimal "quantity", precision: 18, scale: 6, null: false
    t.string "preparation_note"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "unit_id", null: false
    t.decimal "package_quantity", precision: 18, scale: 6
    t.integer "package_unit_id"
    t.index ["ingredient_id"], name: "index_meal_ingredients_on_ingredient_id"
    t.index ["meal_id", "ingredient_id"], name: "index_meal_ingredients_on_meal_id_and_ingredient_id"
    t.index ["meal_id", "position"], name: "index_meal_ingredients_on_meal_id_and_position"
    t.index ["meal_id"], name: "index_meal_ingredients_on_meal_id"
    t.index ["package_unit_id"], name: "index_meal_ingredients_on_package_unit_id"
    t.index ["unit_id"], name: "index_meal_ingredients_on_unit_id"
    t.check_constraint "(package_quantity IS NULL AND package_unit_id IS NULL) OR (package_quantity IS NOT NULL AND package_quantity > 0 AND package_quantity <= 1000000000 AND package_unit_id IS NOT NULL)", name: "meal_ingredients_valid_contents"
    t.check_constraint "quantity > 0 AND quantity <= 1000000000", name: "meal_ingredients_positive_quantity"
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

  create_table "meal_preferred_days", force: :cascade do |t|
    t.integer "meal_id", null: false
    t.integer "weekday_id", null: false
    t.index ["meal_id", "weekday_id"], name: "index_meal_preferred_days_on_meal_id_and_weekday_id", unique: true
    t.index ["meal_id"], name: "index_meal_preferred_days_on_meal_id"
    t.index ["weekday_id"], name: "index_meal_preferred_days_on_weekday_id"
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
    t.integer "servings", null: false
    t.check_constraint "servings > 0 AND typeof(servings) = 'integer'", name: "meals_positive_servings"
  end

  create_table "menus", force: :cascade do |t|
    t.datetime "from", precision: nil, null: false
    t.datetime "to", precision: nil, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.json "generation_notices", default: [], null: false
    t.integer "people_count", default: 1, null: false
    t.check_constraint "people_count > 0 AND typeof(people_count) = 'integer'", name: "menus_positive_people_count"
  end

  create_table "units", force: :cascade do |t|
    t.string "code", null: false
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "dimension", null: false
    t.decimal "factor", precision: 18, scale: 6
    t.index ["code"], name: "index_units_on_code", unique: true
    t.check_constraint "(dimension = 'package' AND factor IS NULL) OR (dimension <> 'package' AND factor IS NOT NULL AND factor > 0)", name: "units_valid_factor"
    t.check_constraint "dimension IN ('mass', 'volume', 'count', 'package')", name: "units_valid_dimension"
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
  add_foreign_key "ingredient_measurement_references", "ingredients"
  add_foreign_key "ingredient_shopping_profiles", "ingredients"
  add_foreign_key "ingredient_shopping_profiles", "units", column: "package_unit_id"
  add_foreign_key "ingredient_shopping_profiles", "units", column: "shopping_unit_id"
  add_foreign_key "meal_ingredients", "ingredients"
  add_foreign_key "meal_ingredients", "meals"
  add_foreign_key "meal_ingredients", "units"
  add_foreign_key "meal_ingredients", "units", column: "package_unit_id"
  add_foreign_key "meal_meal_types", "meal_types"
  add_foreign_key "meal_meal_types", "meals"
  add_foreign_key "meal_preferred_days", "meals"
  add_foreign_key "meal_preferred_days", "weekdays"
end
