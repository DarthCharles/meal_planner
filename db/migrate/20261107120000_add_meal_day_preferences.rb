class AddMealDayPreferences < ActiveRecord::Migration[8.1]
  def change
    create_table :meal_preferred_days do |t|
      t.references :meal, null: false, foreign_key: true
      t.references :weekday, null: false, foreign_key: true
      t.index [:meal_id, :weekday_id], unique: true
    end
    add_column :menus, :generation_notices, :json, default: [], null: false
  end
end
