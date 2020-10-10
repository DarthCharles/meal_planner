class CreateMeals < ActiveRecord::Migration[6.0]
  def change
    create_table :meals do |t|
      t.belongs_to :day
      t.string :name
      t.string :recipe_url, default: ""
      t.string :food
      t.timestamps
    end
  end
end
