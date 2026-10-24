class CreateIngredientsAndMealIngredients < ActiveRecord::Migration[6.0]
  def change
    create_table :ingredients do |t|
      t.string :name, null: false
      t.string :normalized_name, null: false

      t.timestamps
    end

    add_index :ingredients, :normalized_name, unique: true

    create_table :meal_ingredients do |t|
      t.references :meal, null: false, foreign_key: true
      t.references :ingredient, null: false, foreign_key: true
      t.decimal :quantity, precision: 12, scale: 3, null: false
      t.string :unit, null: false
      t.string :preparation_note
      t.integer :position, null: false, default: 0

      t.timestamps
    end

    add_index :meal_ingredients, %i[meal_id ingredient_id], unique: true
    add_index :meal_ingredients, %i[meal_id position]
  end
end
