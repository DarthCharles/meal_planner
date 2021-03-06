class CreateMealTypes < ActiveRecord::Migration[6.0]
  def change
    create_table :meal_types do |t|
      t.string :description, null: false
      t.timestamps
    end
  end
end
