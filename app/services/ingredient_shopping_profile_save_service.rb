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
    Ingredient.transaction do
      profile.save!
      save_piece_weight(ingredient, profile, attributes[:piece_weight]) if attributes.key?(:piece_weight)
    end
    ingredient.measurement_references.reset
    profile.ingredient.measurement_references.reset
    profile
  end

  private

  def save_piece_weight(ingredient, profile, attributes)
    reference = ingredient.measurement_references.find_by(kind: "piece_weight")
    if attributes.nil?
      reference&.destroy!
      return
    end
    unless attributes.is_a?(Hash)
      profile.errors.add(:piece_weight, I18n.t("errors.messages.invalid"))
      raise ActiveRecord::RecordInvalid.new(profile)
    end

    attributes = attributes.with_indifferent_access
    quantity = MeasurementQuantity.parse(attributes[:quantity])
    basis = MeasurementQuantity.parse(attributes.fetch(:reference_quantity, 1))
    # Preserve the exact ratio, source, and approximation flag on unrelated saves.
    return if reference && reference.quantity == quantity && reference.reference_quantity == basis

    reference ||= ingredient.measurement_references.build(kind: "piece_weight")
    reference.assign_attributes(
      quantity: quantity, reference_quantity: basis, approximate: true,
      source: "User-provided buying weight",
      description: "Weight of #{basis} pieces entered in buying setup"
    )
    unless reference.valid?
      profile.errors.add(:piece_weight, reference.errors.full_messages.to_sentence)
      raise ActiveRecord::RecordInvalid.new(profile)
    end
    reference.save!
  end

  def unit_for(code)
    Unit.find_by(code: code) if code.is_a?(String)
  end
end
