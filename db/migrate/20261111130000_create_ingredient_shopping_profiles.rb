class CreateIngredientShoppingProfiles < ActiveRecord::Migration[8.1]
  def change
    reversible do |direction|
      direction.up do
        execute <<~SQL
          INSERT INTO units (code, name, created_at, updated_at)
          SELECT 'frasco', 'jars', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          WHERE NOT EXISTS (SELECT 1 FROM units WHERE code = 'frasco')
        SQL
      end
    end
    create_table :ingredient_shopping_profiles do |t|
      t.references :ingredient, null: false, foreign_key: true, index: { unique: true }
      t.references :base_unit, null: false, foreign_key: { to_table: :units }
      t.references :shopping_unit, null: false, foreign_key: { to_table: :units }
      t.boolean :round_up, null: false, default: false
      t.timestamps
    end

    create_table :ingredient_unit_equivalences do |t|
      t.references :ingredient_shopping_profile, null: false, foreign_key: true,
        index: { name: "index_equivalences_on_shopping_profile" }
      t.references :unit, null: false, foreign_key: true
      t.decimal :quantity, precision: 18, scale: 6, null: false
      t.string :source, null: false
      t.string :description, null: false
      t.boolean :approximate, null: false, default: false
      t.timestamps
      t.index %i[ingredient_shopping_profile_id unit_id], unique: true, name: "index_equivalences_on_profile_and_unit"
      t.check_constraint "quantity > 0", name: "equivalence_positive_quantity"
    end
  end
end
