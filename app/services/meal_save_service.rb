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
      has_id = row[:ingredient_id].present?
      has_name = row[:name].present?
      invalid_ingredient(:invalid_identity) if has_id == has_name
      ingredient = if has_id
        Ingredient.find_by(id: row[:ingredient_id]) || invalid_ingredient(:unknown_ingredient)
      else
        name = row[:name].to_s.strip
        Ingredient.find_by(normalized_name: name.downcase) || Ingredient.create!(name: name)
      end
      unit = Unit.find_by(code: row[:unit].to_s.strip.downcase)
      invalid_ingredient(:unknown_unit) unless unit
      @meal.meal_ingredients.create!(
        ingredient: ingredient, unit: unit, quantity: row[:quantity],
        preparation_note: row[:preparation_note], position: row[:position].presence || index
      )
    end
  end

  def invalid_ingredient(message)
    @meal.errors.add(:ingredients, message)
    raise ActiveRecord::RecordInvalid.new(@meal)
  end
end
