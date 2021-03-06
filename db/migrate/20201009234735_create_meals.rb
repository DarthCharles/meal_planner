class CreateMeals < ActiveRecord::Migration[6.0]
  def change
    create_table :meals do |t|
      t.belongs_to :meal_type, foreign_key: true
      t.string :name, null: false
      t.string :recipe_url, default: ""
      t.string :description, null: false
      t.timestamps
    end
  end
end
