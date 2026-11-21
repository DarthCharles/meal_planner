class IngredientMeasurementReferencesSaveService
  def call(ingredient:, references:)
    unless references.is_a?(Array) && references.all? { |row| row.is_a?(Hash) }
      invalid!(ingredient, :invalid_array)
    end
    kinds = references.map { |row| row.with_indifferent_access[:kind] }
    invalid!(ingredient, :duplicate_references) unless kinds.uniq.size == kinds.size

    Ingredient.transaction do
      ingredient.measurement_references.destroy_all
      references.each do |attributes|
        row = attributes.with_indifferent_access
        reference = ingredient.measurement_references.build(
          kind: row[:kind].is_a?(String) ? row[:kind] : nil,
          quantity: MeasurementQuantity.parse(row[:quantity]),
          reference_quantity: MeasurementQuantity.parse(row.fetch(:reference_quantity, 1)),
          source: row[:source].is_a?(String) ? row[:source] : nil,
          description: row[:description].is_a?(String) ? row[:description] : nil,
          approximate: row.fetch(:approximate, true)
        )
        unless row.fetch(:approximate, true).in?([true, false])
          reference.errors.add(:approximate, :inclusion)
          raise ActiveRecord::RecordInvalid.new(reference)
        end
        reference.save!
      end
    end
    ingredient.measurement_references.reload
  end

  private

  def invalid!(ingredient, message)
    ingredient.errors.add(:measurement_references, message)
    raise ActiveRecord::RecordInvalid.new(ingredient)
  end
end
