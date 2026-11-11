class IngredientShoppingProfileSaveService
  def call(ingredient:, attributes:)
    profile = ingredient.shopping_profile || ingredient.build_shopping_profile
    attributes = attributes.deep_symbolize_keys
    IngredientShoppingProfile.transaction do
      profile.unit_equivalences.destroy_all if profile.persisted?
      profile.assign_attributes(
        base_unit: unit_for(attributes[:base_unit]),
        shopping_unit: unit_for(attributes[:shopping_unit]),
        round_up: boolean(attributes.fetch(:round_up, false))
      )
      rows = attributes.fetch(:equivalences, [])
      unless rows.is_a?(Array) && rows.all? { |row| row.is_a?(Hash) }
        profile.errors.add(:unit_equivalences, :invalid_array)
        raise ActiveRecord::RecordInvalid.new(profile)
      end
      rows.each do |row|
        profile.unit_equivalences.build(
          unit: unit_for(row[:unit]), quantity: scalar(row[:quantity]),
          source: text(row[:source]), description: text(row[:description]),
          approximate: boolean(row.fetch(:approximate, false))
        )
      end
      profile.save!
      profile
    end
  end

  private

  def unit_for(code)
    Unit.find_by(code: code) if code.is_a?(String)
  end

  def text(value)
    value if value.is_a?(String)
  end

  def boolean(value)
    value if value == true || value == false
  end

  def scalar(value)
    value if value.is_a?(String) || value.is_a?(Numeric)
  end
end
