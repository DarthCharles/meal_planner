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
        entry = requirements[row.ingredient_id] ||= {
          ingredient: row.ingredient, totals: Hash.new(Rational(0)), packaged: false, unknown: false
        }
        entry[:packaged] ||= row.unit.package?
        requirement = row.requirement
        unless requirement
          entry[:unknown] = true
          next
        end
        quantity, unit = requirement
        entry[:totals][unit] += quantity * Rational(menu.people_count, meal.servings)
      end
    end

    items = requirements.each_value.map { |entry| ingredient_purchase(entry) }
    items.sort_by! do |item|
      [ShoppingCategory::CODES.index(item[:shopping_category]), item[:name].downcase, item[:ingredient_id]]
    end
    {
      menu_id: menu.id, from: menu.from, to: menu.to, people_count: menu.people_count,
      categories: ShoppingCategory.catalog, items: items,
      meals_without_ingredients: missing.values.sort_by { |meal| [meal[:name].downcase, meal[:id]] },
      # Kept empty for existing API consumers. Missing conversions no longer require correction.
      conversion_warnings: []
    }
  end

  private

  def ingredient_purchase(entry)
    ingredient = entry[:ingredient]
    profile = ingredient.shopping_profile
    totals = entry[:totals]
    if profile&.mode == "package" || (!profile && entry[:packaged]) || entry[:unknown]
      return item(ingredient, nil, nil)
    end

    target = profile&.requirement_unit&.canonical_code || %w[g ml piece].find { |code| totals.key?(code) }
    converter = IngredientMeasurementConverter.new(ingredient)
    total = Rational(0)
    approximate = false
    totals.each do |unit, quantity|
      result = converter.convert(quantity, from: unit, to: target)
      # Retain one useful checklist entry instead of exposing partial quantities.
      return item(ingredient, nil, nil) unless result

      total += result.first
      approximate ||= result.last
    end

    quantity = target == "piece" ? total.ceil.to_s : quantity_string(total)
    item(ingredient, quantity, target, required_quantity: quantity_string(total), approximate: approximate)
  end

  def item(ingredient, quantity, unit, required_quantity: nil, approximate: false)
    result = {
      ingredient_id: ingredient.id, name: ingredient.name,
      shopping_category: ingredient.shopping_category, quantity: quantity, unit: unit,
      status: quantity ? (approximate ? "approximate" : "calculated") : "unquantified",
      required_quantity: required_quantity, required_unit: unit
    }
    result[:approximate] = true if approximate
    result[:presentation] = ingredient.shopping_profile.configuration_json if ingredient.shopping_profile
    result
  end

  def quantity_string(total)
    rounded = (BigDecimal(total.numerator.to_s) / BigDecimal(total.denominator.to_s)).round(3, :half_up)
    [rounded, BigDecimal("0.001")].max.to_s("F")
  end
end
