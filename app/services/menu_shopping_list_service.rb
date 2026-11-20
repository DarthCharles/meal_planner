class MenuShoppingListService
  def call(menu:)
    requirements = {}
    missing = {}
    occurrences = DailyMeal.joins(:day).where(days: { menu_id: menu.id })
      .includes(meal: { meal_ingredients: [:unit, { ingredient: { shopping_profile: [:base_unit, { unit_equivalences: :unit }] } }] })

    occurrences.each do |occurrence|
      meal = occurrence.meal
      missing[meal.id] = { id: meal.id, name: meal.name } if meal.meal_ingredients.empty?
      meal.meal_ingredients.each do |row|
        code, multiplier = Unit.canonical(row.unit.code)
        quantity = Rational(row.quantity.to_s) * menu.people_count / meal.servings * multiplier
        entry = requirements[row.ingredient_id] ||= { ingredient: row.ingredient, totals: Hash.new(Rational(0)) }
        entry[:totals][code] += quantity
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
    combined = Hash.new(Rational(0))
    approximate = {}
    unresolved = []
    # Preserve an already common weight, volume or physical count. Other measures
    # can use a documented base-unit factor; purchase preferences never set totals.
    convert = profile && (totals.size > 1 || !%w[g ml pieza diente].include?(totals.keys.first))
    totals.each do |unit, quantity|
      factor = convert ? profile.factor_for(unit) : nil
      if factor
        unit = profile.base_unit.code
        quantity *= factor.first
        approximate[unit] = true if factor.last
      elsif convert
        unresolved << unit
      end
      combined[unit] += quantity
    end

    items = combined.map do |unit, quantity|
      item = {
        ingredient_id: ingredient.id, name: ingredient.name,
        shopping_category: ingredient.shopping_category, unit: unit, quantity: quantity_string(quantity)
      }
      item[:approximate] = true if approximate[unit]
      item
    end
    warning = if combined.size > 1
      {
        ingredient_id: ingredient.id, name: ingredient.name,
        units: profile ? unresolved.sort : combined.keys.sort,
        target_unit: profile&.base_unit&.code,
        reason: profile ? "equivalence_missing" : "shopping_profile_missing"
      }
    end
    [items, warning]
  end

  def quantity_string(total)
    rounded = (BigDecimal(total.numerator.to_s) / BigDecimal(total.denominator.to_s)).round(3, :half_up)
    # Keep a positive requirement visible even when it is smaller than display precision.
    [rounded, BigDecimal("0.001")].max.to_s("F")
  end
end
