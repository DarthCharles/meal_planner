class MenuShoppingListService
  def call(menu:)
    requirements = {}
    missing = {}
    occurrences = DailyMeal.joins(:day).where(days: { menu_id: menu.id })
      .includes(meal: { meal_ingredients: [:unit, { ingredient: { shopping_profile: [:base_unit, :shopping_unit, { unit_equivalences: :unit }] } }] })

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
    # Aggregate exact requirements in the ingredient's base unit before choosing
    # whether a complete configured piece/container has been reached.
    totals.each do |unit, quantity|
      factor = profile&.factor_for(unit)
      if factor
        unit = profile.base_unit.code
        quantity *= factor.first
        approximate[unit] = true if factor.last
      elsif profile
        unresolved << unit
      end
      combined[unit] += quantity
    end

    items = combined.map do |unit, quantity|
      estimated = approximate[unit]
      display_quantity = quantity_string(quantity)
      if profile && combined.size == 1 && unit == profile.base_unit.code
        target = profile.shopping_unit.code
        factor = profile.factor_for(target)
        if !%w[g kg ml l].include?(target) && factor && quantity >= factor.first
          display_quantity = (quantity / factor.first).ceil.to_s
          unit = target
          # A recipe already expressed in the displayed count needs no estimated
          # weight conversion; the base-unit factors cancel in that case.
          estimated = totals.keys == [target] ? false : estimated || factor.last
        end
      end
      item = {
        ingredient_id: ingredient.id, name: ingredient.name,
        shopping_category: ingredient.shopping_category, unit: unit, quantity: display_quantity
      }
      item[:approximate] = true if estimated
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
