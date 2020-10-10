class CreateDays < ActiveRecord::Migration[6.0]
  def change
    create_table :days do |t|
      t.belongs_to :menu
      t.string :weekday
      t.timestamps
    end
  end
end
