class PositiveQuantityValidator < ActiveModel::EachValidator
  MAXIMUM = 1_000_000_000

  def validate_each(record, attribute, value)
    return if value.nil? && options[:allow_nil]

    unless value.is_a?(Numeric) && value.finite? && value.positive? && value <= MAXIMUM
      record.errors.add(attribute, :invalid_quantity)
    end
  end
end
