class AllowUnknownShoppingPackageContents < ActiveRecord::Migration[8.1]
  def up
    remove_check_constraint :ingredient_shopping_profiles, name: "shopping_profiles_valid_contents"
    add_check_constraint :ingredient_shopping_profiles,
      "(package_quantity IS NULL AND package_unit_id IS NULL) OR " \
      "(mode = 'package' AND package_quantity IS NOT NULL AND package_quantity > 0 " \
      "AND package_quantity <= 1000000000 AND package_unit_id IS NOT NULL)",
      name: "shopping_profiles_valid_contents"
  end

  def down
    if select_value("SELECT COUNT(*) FROM ingredient_shopping_profiles WHERE mode = 'package' AND package_quantity IS NULL").to_i.positive?
      raise ActiveRecord::IrreversibleMigration, "Unknown package contents cannot satisfy the previous constraint"
    end

    remove_check_constraint :ingredient_shopping_profiles, name: "shopping_profiles_valid_contents"
    add_check_constraint :ingredient_shopping_profiles,
      "(mode = 'package' AND package_quantity IS NOT NULL AND package_quantity > 0 " \
      "AND package_quantity <= 1000000000 AND package_unit_id IS NOT NULL) OR " \
      "(mode <> 'package' AND package_quantity IS NULL AND package_unit_id IS NULL)",
      name: "shopping_profiles_valid_contents"
  end
end
