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
        Ingredient.find_by(normalized_name: name.downcase) || Ingredient.create!(name: name)
      end
      invalid_ingredient(:invalid_quantity) if !row[:package_quantity].nil? && MeasurementQuantity.parse(row[:package_quantity]).nil?
      unit = Unit.find_by(code: row[:unit].to_s.strip.downcase)
      invalid_ingredient(:unknown_unit) unless unit
      @meal.meal_ingredients.create!(
        ingredient: ingredient, unit: unit, quantity: MeasurementQuantity.parse(row[:quantity]),
        package_quantity: row[:package_quantity].nil? ? nil : MeasurementQuantity.parse(row[:package_quantity]),
        package_unit: package_unit_for(row),
        preparation_note: row[:preparation_note], position: row[:position].presence || index
      )
    end
  end

  def package_unit_for(row)
    return if row[:package_unit].nil?

    unit = Unit.find_by(code: row[:package_unit]) if row[:package_unit].is_a?(String)
    invalid_ingredient(:unknown_unit) unless unit
    unit
  end

  def invalid_ingredient(message)
    @meal.errors.add(:ingredients, message)
    raise ActiveRecord::RecordInvalid.new(@meal)
  end
end
