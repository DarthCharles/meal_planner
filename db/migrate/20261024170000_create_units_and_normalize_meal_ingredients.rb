class CreateUnitsAndNormalizeMealIngredients < ActiveRecord::Migration[6.0]
  DEFAULT_UNITS = {
    "g" => "grams",
    "kg" => "kilograms",
    "ml" => "milliliters",
    "l" => "liters",
    "pieza" => "pieces",
    "taza" => "cups",
    "cucharada" => "tablespoons",
    "cucharadita" => "teaspoons",
    "diente" => "cloves"
  }.freeze

  def up
    create_table :units do |t|
      t.string :code, null: false
      t.string :name, null: false

      t.timestamps
    end
    add_index :units, :code, unique: true

    DEFAULT_UNITS.each { |code, name| insert_unit(code, name) }

    add_reference :meal_ingredients, :unit, foreign_key: true
    existing_units.each { |code| insert_unit(code, code) unless unit_exists?(code) }

    execute <<~SQL
      UPDATE meal_ingredients
      SET unit_id = (
        SELECT id FROM units
        WHERE units.code = lower(trim(meal_ingredients.unit))
      )
    SQL

    change_column_null :meal_ingredients, :unit_id, false
    remove_column :meal_ingredients, :unit
  end

  def down
    add_column :meal_ingredients, :unit, :string
    execute <<~SQL
      UPDATE meal_ingredients
      SET unit = (SELECT code FROM units WHERE units.id = meal_ingredients.unit_id)
    SQL
    change_column_null :meal_ingredients, :unit, false
    remove_reference :meal_ingredients, :unit, foreign_key: true
    drop_table :units
  end

  private

  def existing_units
    select_values("SELECT DISTINCT lower(trim(unit)) FROM meal_ingredients WHERE unit IS NOT NULL")
  end

  def unit_exists?(code)
    select_value("SELECT 1 FROM units WHERE code = #{quote(code)} LIMIT 1").present?
  end

  def insert_unit(code, name)
    execute <<~SQL
      INSERT INTO units (code, name, created_at, updated_at)
      VALUES (#{quote(code)}, #{quote(name)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    SQL
  end
end
