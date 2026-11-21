class RebuildIngredientMeasurements < ActiveRecord::Migration[8.1]
  # This prototype's ingredient quantities and shopping settings are disposable.
  # Clear ambiguous legacy measures rather than silently reinterpret them.
  def up
    execute "DELETE FROM meal_ingredients"
    drop_table :ingredient_unit_equivalences
    drop_table :ingredient_shopping_profiles
    execute "DELETE FROM units"

    add_column :units, :dimension, :string, null: false
    add_column :units, :factor, :decimal, precision: 18, scale: 6
    add_check_constraint :units, "dimension IN ('mass', 'volume', 'count', 'package')", name: "units_valid_dimension"
    add_check_constraint :units, "(dimension = 'package' AND factor IS NULL) OR (dimension <> 'package' AND factor IS NOT NULL AND factor > 0)", name: "units_valid_factor"

    catalog = {
      "g" => ["grams", "mass", 1], "kg" => ["kilograms", "mass", 1000],
      "ml" => ["milliliters", "volume", 1], "l" => ["liters", "volume", 1000],
      "cucharadita" => ["teaspoons", "volume", 5], "cucharada" => ["tablespoons", "volume", 15],
      "taza" => ["cups", "volume", 240], "pieza" => ["pieces", "count", 1],
      "frasco" => ["jars", "package", nil], "bag" => ["bags", "package", nil],
      "can" => ["cans", "package", nil], "bottle" => ["bottles", "package", nil],
      "package" => ["packages", "package", nil]
    }
    catalog.each do |code, (name, dimension, factor)|
      execute <<~SQL
        INSERT INTO units (code, name, dimension, factor, created_at, updated_at)
        VALUES (#{connection.quote(code)}, #{connection.quote(name)}, #{connection.quote(dimension)}, #{connection.quote(factor)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      SQL
    end

    create_table :ingredient_measurement_references do |t|
      t.references :ingredient, null: false, foreign_key: true
      t.string :kind, null: false
      t.decimal :quantity, precision: 18, scale: 6, null: false
      t.string :source, null: false
      t.string :description, null: false
      t.boolean :approximate, null: false, default: true
      t.timestamps
      t.index [:ingredient_id, :kind], unique: true, name: "index_measurement_references_on_ingredient_and_kind"
      t.check_constraint "kind IN ('density', 'piece_weight')", name: "measurement_references_valid_kind"
      t.check_constraint "quantity > 0 AND quantity <= 1000000000", name: "measurement_references_positive_quantity"
    end

    create_table :ingredient_shopping_profiles do |t|
      t.references :ingredient, null: false, foreign_key: true, index: { unique: true }
      t.string :mode, null: false
      t.references :shopping_unit, null: false, foreign_key: { to_table: :units }
      t.decimal :package_quantity, precision: 18, scale: 6
      t.references :package_unit, foreign_key: { to_table: :units }
      t.timestamps
      t.check_constraint "mode IN ('bulk', 'piece', 'package')", name: "shopping_profiles_valid_mode"
      t.check_constraint "(mode = 'package' AND package_quantity IS NOT NULL AND package_quantity > 0 AND package_quantity <= 1000000000 AND package_unit_id IS NOT NULL) OR (mode <> 'package' AND package_quantity IS NULL AND package_unit_id IS NULL)", name: "shopping_profiles_valid_contents"
    end

    remove_index :meal_ingredients, [:meal_id, :ingredient_id]
    add_index :meal_ingredients, [:meal_id, :ingredient_id]
    change_column :meal_ingredients, :quantity, :decimal, precision: 18, scale: 6, null: false
    add_column :meal_ingredients, :package_quantity, :decimal, precision: 18, scale: 6
    add_reference :meal_ingredients, :package_unit, foreign_key: { to_table: :units }
    add_check_constraint :meal_ingredients, "quantity > 0 AND quantity <= 1000000000", name: "meal_ingredients_positive_quantity"
    add_check_constraint :meal_ingredients, "(package_quantity IS NULL AND package_unit_id IS NULL) OR (package_quantity IS NOT NULL AND package_quantity > 0 AND package_quantity <= 1000000000 AND package_unit_id IS NOT NULL)", name: "meal_ingredients_valid_contents"
    change_column_default :meals, :servings, from: 1, to: nil
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Rebuild disposable data from seeds instead of restoring ambiguous measures"
  end
end
