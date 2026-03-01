# frozen_string_literal: true

class DropCollationMealType < ActiveRecord::Migration[6.0]
  def up
    collation_id = select_value("SELECT id FROM meal_types WHERE description = 'collation' LIMIT 1")
    return unless collation_id

    if table_exists?(:meal_meal_types)
      execute("DELETE FROM meal_meal_types WHERE meal_type_id = #{collation_id.to_i}")
    end
    execute("DELETE FROM meal_types WHERE id = #{collation_id.to_i}")
  end

  def down
    execute("INSERT INTO meal_types (description, created_at, updated_at) VALUES ('collation', datetime('now'), datetime('now'))")
  end
end
