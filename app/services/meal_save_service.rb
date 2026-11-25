class MealSaveService
  def initialize(meal, attributes)
    @meal = meal
    @attributes = attributes
  end

  def call
    Meal.transaction do
      @meal.update!(@attributes.except(:meal_type_ids, :ingredients))
      ids = Array(@attributes[:meal_type_ids]).reject(&:blank?)
      @meal.meal_type_ids = ids if ids.any?
      replace_ingredients if @attributes.key?(:ingredients)
    end
    @meal
  rescue ActiveRecord::RecordInvalid => error
    unless error.record == @meal
      @meal.errors.add(:ingredients, error.record.errors.full_messages.to_sentence)
    end
    raise ActiveRecord::RecordInvalid.new(@meal)
  end

  private

  def replace_ingredients
    rows = @attributes[:ingredients]
    invalid_ingredient(:invalid_array) unless rows.is_a?(Array)
    @meal.meal_ingredients.destroy_all
    created_ingredients = {}
    rows.each_with_index do |row, index|
      invalid_ingredient(:invalid_identity) unless row[:name].nil? || row[:name].is_a?(String)
      if row[:ingredient_id].present?
        id = row[:ingredient_id]
        invalid_ingredient(:invalid_identity) unless id.is_a?(Integer) || (id.is_a?(String) && id.match?(/\A\d+\z/))
      end
      invalid_ingredient(:unknown_unit) unless row[:unit].is_a?(String)
      invalid_ingredient(:invalid) unless row[:preparation_note].nil? || row[:preparation_note].is_a?(String)
      position = row[:position]
      invalid_ingredient(:invalid) unless position.nil? || position.is_a?(Integer) || (position.is_a?(String) && position.match?(/\A\d+\z/))
      has_id = row[:ingredient_id].present?
      has_name = row[:name].present?
      invalid_ingredient(:invalid_identity) if has_id == has_name
      ingredient = if has_id
        Ingredient.find_by(id: row[:ingredient_id]) || invalid_ingredient(:unknown_ingredient)
      else
        name = row[:name].to_s.strip
        match = Ingredient.find_by(normalized_name: name.downcase)
        match || Ingredient.create!(name: name).tap { |record| created_ingredients[record.id] = true }
      end
      invalid_ingredient(:legacy_package_contents) unless row[:package_quantity].nil? && row[:package_unit].nil?

      unit = Unit.find_by(code: row[:unit].strip.downcase)
      invalid_ingredient(:unknown_unit) unless unit
      if row.key?(:ingredient_package)
        invalid_ingredient(:invalid_package_contents) unless has_id || created_ingredients.key?(ingredient.id)
        save_package(ingredient, unit, row[:ingredient_package])
      end

      @meal.meal_ingredients.create!(
        ingredient: ingredient,
        unit: unit,
        quantity: MeasurementQuantity.parse(row[:quantity]),
        preparation_note: row[:preparation_note], position: row[:position].presence || index
      )
    end
  end

  def save_package(ingredient, unit, contents)
    invalid_ingredient(:invalid_package_contents) unless unit.package? && contents.is_a?(Hash) &&
      contents[:quantity].present? && contents[:unit].present?

    profile = ingredient.shopping_profile
    if profile&.mode == "package" && profile.package_quantity && profile.package_unit_id
      return if profile.shopping_unit == unit &&
        profile.package_quantity == MeasurementQuantity.parse(contents[:quantity]) &&
        profile.package_unit&.code == contents[:unit]

      invalid_ingredient(:package_already_configured)
    end

    IngredientShoppingProfileSaveService.new.call(ingredient: ingredient, attributes: {
      mode: "package", shopping_unit: unit.code, package_quantity: contents[:quantity], package_unit: contents[:unit]
    })
  end

  def invalid_ingredient(message)
    @meal.errors.add(:ingredients, message)
    raise ActiveRecord::RecordInvalid.new(@meal)
  end
end
