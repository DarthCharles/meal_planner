class MenuShoppingListService
  def call(menu:)
    requirements = {}
    missing = {}
    occurrences = DailyMeal.joins(:day).where(days: { menu_id: menu.id })
      .includes(meal: { meal_ingredients: [:unit, :package_unit,
        { ingredient: [:measurement_references, { shopping_profile: [:shopping_unit, :package_unit] }] }] })

    occurrences.each do |occurrence|
      meal = occurrence.meal
      missing[meal.id] = { id: meal.id, name: meal.name } if meal.meal_ingredients.empty?
      meal.meal_ingredients.each do |row|
        quantity, unit = row.requirement
        quantity *= Rational(menu.people_count, meal.servings)
        entry = requirements[row.ingredient_id] ||= { ingredient: row.ingredient, totals: Hash.new(Rational(0)) }
        entry[:totals][unit] += quantity
      end
    end

    items = []
    warnings = []
    requirements.each_value do |entry|
      ingredient_items, warning = ingredient_requirements(entry[:ingredient], entry[:totals])
      items.concat(ingredient_items)
      warnings << warning if warning
    end
    items.sort_by! do |item|
      [ShoppingCategory::CODES.index(item[:shopping_category]), item[:name].downcase, item[:ingredient_id], item[:unit]]
    end
    {
      menu_id: menu.id, from: menu.from, to: menu.to, people_count: menu.people_count,
      categories: ShoppingCategory.catalog, items: items,
      meals_without_ingredients: missing.values.sort_by { |meal| [meal[:name].downcase, meal[:id]] },
      conversion_warnings: warnings.sort_by { |warning| [warning[:name].downcase, warning[:ingredient_id]] }
    }
  end

  private

  def ingredient_requirements(ingredient, totals)
    profile = ingredient.shopping_profile
    # Unconfigured ingredients use natural canonical units; no fictional container is inferred.
    target = profile&.requirement_unit&.canonical_code || %w[g ml piece].find { |code| totals.key?(code) }
    converter = IngredientMeasurementConverter.new(ingredient)
    converted = Rational(0)
    approximate = false
    unresolved = {}
    totals.each do |unit, quantity|
      result = converter.convert(quantity, from: unit, to: target)
      if result
        converted += result.first
        approximate ||= result.last
      else
        unresolved[unit] = quantity
      end
    end

    if unresolved.any?
      # Preserve all quantities, but do not round or label a partial result as a complete purchase.
      partials = unresolved.merge(converted.positive? ? { target => converted } : {})
      items = partials.map do |unit, quantity|
        item(ingredient, unit, quantity_string(quantity), "incomplete", unit, quantity,
          approximate: unit == target && approximate, profile: profile)
      end
      warning = { ingredient_id: ingredient.id, name: ingredient.name, units: unresolved.keys.sort,
        target_unit: target, reason: "measurement_reference_missing" }
      return [items, warning]
    end

    unit = target
    display_quantity = target == "piece" ? converted.ceil.to_s : quantity_string(converted)
    if profile&.mode == "package"
      size = Rational(profile.package_quantity.to_s) * profile.package_unit.canonical_factor
      if converted >= size
        unit = profile.shopping_unit.code
        display_quantity = (converted / size).ceil.to_s
      end
    end
    status = approximate ? "approximate" : "calculated"
    [[item(ingredient, unit, display_quantity, status, target, converted, approximate: approximate, profile: profile)], nil]
  end

  def item(ingredient, unit, quantity, status, required_unit, required_quantity, approximate:, profile:)
    result = { ingredient_id: ingredient.id, name: ingredient.name,
      shopping_category: ingredient.shopping_category, unit: unit, quantity: quantity,
      status: status, required_unit: required_unit, required_quantity: quantity_string(required_quantity) }
    result[:approximate] = true if approximate
    result[:presentation] = profile.configuration_json if profile
    result
  end

  def quantity_string(total)
    rounded = (BigDecimal(total.numerator.to_s) / BigDecimal(total.denominator.to_s)).round(3, :half_up)
    [rounded, BigDecimal("0.001")].max.to_s("F")
  end
end
