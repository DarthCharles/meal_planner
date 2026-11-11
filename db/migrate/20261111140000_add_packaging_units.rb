class AddPackagingUnits < ActiveRecord::Migration[8.1]
  def up
    { "bag" => "bags", "can" => "cans", "bottle" => "bottles", "package" => "packages" }.each do |code, name|
      execute <<~SQL
        INSERT INTO units (code, name, created_at, updated_at)
        SELECT #{connection.quote(code)}, #{connection.quote(name)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM units WHERE code = #{connection.quote(code)})
      SQL
    end
  end

  def down
    # Keep catalog units that recipes or shopping profiles may already reference.
  end
end
