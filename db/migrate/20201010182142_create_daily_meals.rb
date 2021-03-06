class CreateDailyMeals < ActiveRecord::Migration[6.0]
  def change
    create_table :daily_meals do |t|
      t.belongs_to :day
      t.belongs_to :meal
      t.timestamps
    end
  end
end
