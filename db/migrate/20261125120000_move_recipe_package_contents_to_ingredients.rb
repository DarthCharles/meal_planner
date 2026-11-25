class MoveRecipePackageContentsToIngredients < ActiveRecord::Migration[8.1]
  def up
    units = select_all("SELECT id, code, dimension, factor FROM units").index_by { |unit| unit.fetch("code") }
    units_by_id = units.values.index_by { |unit| unit.fetch("id") }
    profiles = select_all("SELECT * FROM ingredient_shopping_profiles").index_by { |profile| profile.fetch("ingredient_id") }
    rows_by_ingredient = select_all("SELECT * FROM meal_ingredients").group_by { |row| row.fetch("ingredient_id") }

    rows_by_ingredient.each do |ingredient_id, rows|
      packages = rows.select { |row| units_by_id.fetch(row.fetch("unit_id")).fetch("dimension") == "package" }
      next if packages.empty?

      profile = profiles[ingredient_id] || infer_profile(ingredient_id, rows, packages, units_by_id)
      shared_size = profile&.fetch("mode") == "package" ? content_size(profile, units_by_id) : nil
      packages.each do |row|
        size = content_size(row, units_by_id)
        next unless size && size != shared_size

        preserve_quantity(row, size, units_by_id.fetch(row.fetch("package_unit_id")), units)
      end
    end

    remove_check_constraint :meal_ingredients, name: "meal_ingredients_valid_contents"
    remove_reference :meal_ingredients, :package_unit, foreign_key: { to_table: :units }
    remove_column :meal_ingredients, :package_quantity, :decimal
  end

  def down
    raise ActiveRecord::IrreversibleMigration, "Recipe package sizes now belong to ingredient buying preferences"
  end

  private

  def content_size(record, units_by_id)
    return unless record && record["package_quantity"] && record["package_unit_id"]

    unit = units_by_id.fetch(record.fetch("package_unit_id"))
    [unit.fetch("dimension"), Rational(record.fetch("package_quantity").to_s) * Rational(unit.fetch("factor").to_s)]
  end

  def infer_profile(ingredient_id, rows, packages, units_by_id)
    return unless rows.size == packages.size

    sizes = packages.map { |row| [row.fetch("unit_id"), content_size(row, units_by_id)] }.uniq
    return unless sizes.one? && sizes.first.last

    row = packages.first
    profile = { "mode" => "package", "package_quantity" => row.fetch("package_quantity"), "package_unit_id" => row.fetch("package_unit_id") }
    execute <<~SQL
      INSERT INTO ingredient_shopping_profiles (ingredient_id, mode, shopping_unit_id, package_quantity, package_unit_id, created_at, updated_at)
      VALUES (#{ingredient_id}, 'package', #{row.fetch("unit_id")}, #{connection.quote(profile.fetch("package_quantity"))},
        #{profile.fetch("package_unit_id")}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    SQL
    profile
  end

  def preserve_quantity(row, size, original_unit, units)
    dimension, canonical_size = size
    total = Rational(row.fetch("quantity").to_s) * canonical_size
    alternatives = case dimension
    when "mass" then %w[g kg]
    when "volume" then %w[ml l]
    when "count" then %w[piece]
    end
    candidates = [original_unit, *alternatives.map { |code| units.fetch(code) }].uniq
    candidates.each do |unit|
      quantity = total / Rational(unit.fetch("factor").to_s)
      scaled = quantity * 1_000_000
      next unless scaled.denominator == 1 && quantity.positive? && quantity <= 1_000_000_000

      decimal = (BigDecimal(scaled.numerator) / 1_000_000).to_s("F")
      execute "UPDATE meal_ingredients SET quantity = #{decimal}, unit_id = #{unit.fetch('id')} WHERE id = #{row.fetch('id')}"
      return
    end

    raise "Cannot migrate meal ingredient #{row.fetch('id')} without changing its quantity"
  end
end
