class MenuShoppingListService
  def call(menu:)
    totals = {}
    missing = {}
    warnings = {}
    occurrences = DailyMeal.joins(:day).where(days: { menu_id: menu.id })
      .includes(meal: { meal_ingredients: [:unit, { ingredient: { shopping_profile: [:base_unit, :shopping_unit, { unit_equivalences: :unit }] } }] })

    occurrences.each do |occurrence|
      meal = occurrence.meal
      missing[meal.id] = { id: meal.id, name: meal.name } if meal.meal_ingredients.empty?
      meal.meal_ingredients.each do |row|
        quantity = Rational(row.quantity.to_s) * menu.people_count / meal.servings
        code, multiplier = Unit.canonical(row.unit.code)
        quantity *= multiplier
        profile = row.ingredient.shopping_profile
        approximate = false
        round_up = false
        if profile
          target = profile.shopping_unit.code
          source_factor = profile.factor_for(code)
          target_factor = profile.factor_for(target)
          target_base, target_multiplier = Unit.canonical(target)
          if code == target_base
            quantity /= target_multiplier
            code = target
            round_up = profile.round_up
          elsif source_factor && target_factor
            quantity = quantity * source_factor.first / target_factor.first
            approximate = source_factor.last || target_factor.last
            code = target
            round_up = profile.round_up
          else
            warning = warnings[row.ingredient_id] ||= {
              ingredient_id: row.ingredient_id, name: row.ingredient.name,
              units: [], target_unit: target, reason: "equivalence_missing"
            }
            warning[:units] |= [code]
          end
        end
        key = [row.ingredient_id, code]
        item = totals[key] ||= {
          ingredient_id: row.ingredient_id, name: row.ingredient.name,
          shopping_category: row.ingredient.shopping_category,
          unit: code, quantity: Rational(0), round_up: round_up
        }
        item[:quantity] += quantity
        item[:approximate] = true if approximate
      end
    end

    items = totals.values.sort_by do |item|
      [ShoppingCategory::CODES.index(item[:shopping_category]), item[:name].downcase, item[:ingredient_id], item[:unit]]
    end
    items.group_by { |item| item[:ingredient_id] }.each do |ingredient_id, entries|
      if entries.size > 1 && !warnings.key?(ingredient_id)
        warnings[ingredient_id] = {
          ingredient_id: ingredient_id, name: entries.first[:name],
          units: entries.map { |item| item[:unit] }, target_unit: nil, reason: "shopping_profile_missing"
        }
      end
    end
    items.each do |item|
      quantity = item[:quantity]
      if item.delete(:round_up)
        item[:required_quantity] = quantity_string(quantity)
        item[:quantity] = quantity.ceil.to_s
      else
        item[:quantity] = quantity_string(quantity)
      end
    end
    {
      menu_id: menu.id, from: menu.from, to: menu.to, people_count: menu.people_count,
      categories: ShoppingCategory.catalog, items: items,
      meals_without_ingredients: missing.values.sort_by { |meal| [meal[:name].downcase, meal[:id]] },
      conversion_warnings: warnings.values.sort_by { |warning| [warning[:name].downcase, warning[:ingredient_id]] }
    }
  end

  private

  def quantity_string(total)
    rounded = (BigDecimal(total.numerator.to_s) / BigDecimal(total.denominator.to_s)).round(3, :half_up)
    # Keep a positive requirement visible even when it is smaller than display precision.
    [rounded, BigDecimal("0.001")].max.to_s("F")
  end
end
