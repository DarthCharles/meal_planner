class UseEnglishUnitCodes < ActiveRecord::Migration[8.1]
  CODES = {
    "frasco" => "jar", "pieza" => "piece", "taza" => "cup",
    "cucharada" => "tablespoon", "cucharadita" => "teaspoon"
  }.freeze

  def up
    rename_codes(CODES)
  end

  def down
    rename_codes(CODES.invert)
  end

  private

  def rename_codes(codes)
    codes.each do |previous, current|
      execute <<~SQL
        UPDATE units SET code = #{connection.quote(current)}, updated_at = CURRENT_TIMESTAMP
        WHERE code = #{connection.quote(previous)}
      SQL
    end
  end
end
