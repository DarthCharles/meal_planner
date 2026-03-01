# frozen_string_literal: true

class MealsManyMealTypesAndMexicanTerms < ActiveRecord::Migration[6.0]
  def up
    # Join table: a meal can be eaten at multiple times (e.g. avena at desayuno or cena)
    create_table :meal_meal_types do |t|
      t.references :meal, null: false, foreign_key: true
      t.references :meal_type, null: false, foreign_key: true
      t.timestamps
    end
    add_index :meal_meal_types, %i[meal_id meal_type_id], unique: true

    # Migrate existing: each meal's current meal_type_id becomes one row in the join table
    execute <<-SQL.squish
      INSERT INTO meal_meal_types (meal_id, meal_type_id, created_at, updated_at)
      SELECT id, meal_type_id, created_at, updated_at FROM meals WHERE meal_type_id IS NOT NULL
    SQL

    remove_foreign_key :meals, :meal_types if foreign_key_exists?(:meals, :meal_types)
    remove_column :meals, :meal_type_id
  end

  def down
    add_column :meals, :meal_type_id, :integer
    add_foreign_key :meals, :meal_types

    # Restore first meal_type per meal (arbitrary if multiple)
    execute <<-SQL.squish
      UPDATE meals SET meal_type_id = (
        SELECT meal_type_id FROM meal_meal_types WHERE meal_meal_types.meal_id = meals.id LIMIT 1
      )
    SQL

    drop_table :meal_meal_types
  end
end
