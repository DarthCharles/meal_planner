class PositiveIntegerValidator < ActiveModel::EachValidator
  MAXIMUM = (2**63) - 1

  def validate_each(record, attribute, _value)
    value = record.public_send("#{attribute}_before_type_cast")
    valid = value.is_a?(Integer) || (value.is_a?(String) && value.match?(/\A\d+\z/))
    unless valid && value.to_i.positive?
      record.errors.add(attribute, :positive_integer)
      return
    end
    if value.to_i > MAXIMUM
      record.errors.add(attribute, :less_than_or_equal_to, count: MAXIMUM)
    end
  end
end
