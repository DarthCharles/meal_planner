class MenuShoppingListService
  def call(menu:)
    totals = {}
    missing = {}
    occurrences = DailyMeal.joins(:day).where(days: { menu_id: menu.id })
      .includes(meal: { meal_ingredients: %i[ingredient unit] })

    occurrences.each do |occurrence|
      meal = occurrence.meal
      missing[meal.id] = { id: meal.id, name: meal.name } if meal.meal_ingredients.empty?
      meal.meal_ingredients.each do |row|
        key = [row.ingredient_id, row.unit.code]
        item = totals[key] ||= {
          ingredient_id: row.ingredient_id, name: row.ingredient.name,
          unit: row.unit.code, quantity: Rational(0)
        }
        item[:quantity] += Rational(row.quantity.to_s) * menu.people_count / meal.servings
      end
    end

    items = totals.values.sort_by { |item| [item[:name].downcase, item[:ingredient_id], item[:unit]] }
    items.each { |item| item[:quantity] = quantity_string(item[:quantity]) }
    {
      menu_id: menu.id, people_count: menu.people_count, items: items,
      meals_without_ingredients: missing.values.sort_by { |meal| [meal[:name].downcase, meal[:id]] }
    }
  end

  private

  def quantity_string(total)
    rounded = (BigDecimal(total.numerator.to_s) / BigDecimal(total.denominator.to_s)).round(3, :half_up)
    # Keep a positive requirement visible even when it is smaller than display precision.
    [rounded, BigDecimal("0.001")].max.to_s("F")
  end
end
