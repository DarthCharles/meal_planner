class IngredientShoppingProfileSaveService
  def call(ingredient:, attributes:)
    attributes = attributes.symbolize_keys
    profile = ingredient.shopping_profile || ingredient.build_shopping_profile
    profile.assign_attributes(
      mode: attributes[:mode].is_a?(String) ? attributes[:mode] : nil,
      shopping_unit: unit_for(attributes[:shopping_unit]),
      package_quantity: attributes[:package_quantity].nil? ? nil : MeasurementQuantity.parse(attributes[:package_quantity]),
      package_unit: unit_for(attributes[:package_unit])
    )
    # Do not silently discard malformed or unknown contents on non-package profiles.
    if (!attributes[:package_quantity].nil? && profile.package_quantity.nil?) || (!attributes[:package_unit].nil? && profile.package_unit.nil?)
      profile.errors.add(:package_quantity, :invalid_quantity)
      raise ActiveRecord::RecordInvalid.new(profile)
    end
    profile.save!
    profile
  end

  private

  def unit_for(code)
    Unit.find_by(code: code) if code.is_a?(String)
  end
end
