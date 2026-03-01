# frozen_string_literal: true

class HardenSchemaAndAddOrdering < ActiveRecord::Migration[6.0]
  def change
    # --- Require links so rows always point to real records ---
    change_column_null :days, :menu_id, false
    change_column_null :days, :weekday_id, false
    change_column_null :daily_meals, :day_id, false
    change_column_null :daily_meals, :meal_id, false
    change_column_null :menus, :from, false
    change_column_null :menus, :to, false

    # --- Enforce links at DB level (no orphan rows) ---
    add_foreign_key :days, :menus
    add_foreign_key :days, :weekdays
    add_foreign_key :daily_meals, :days
    add_foreign_key :daily_meals, :meals

    # --- One day per weekday per menu; no duplicate meal on same day ---
    add_index :days, %i[menu_id weekday_id], unique: true
    add_index :daily_meals, %i[day_id meal_id], unique: true

    # --- Lookup names must be unique ---
    add_index :meal_types, :description, unique: true
    add_index :weekdays, :name, unique: true

    # --- Order of meals within a day ---
    add_column :daily_meals, :position, :integer, default: 0, null: false
  end
end
