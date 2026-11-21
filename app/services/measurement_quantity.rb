# Accept decimal quantities and familiar fractions at the API boundary.
class MeasurementQuantity
  FRACTIONS = { "¼" => "1/4", "½" => "1/2", "¾" => "3/4", "⅓" => "1/3", "⅔" => "2/3" }.freeze

  def self.parse(value)
    return unless value.is_a?(String) || value.is_a?(Numeric)
    return if value.is_a?(Float) && !value.finite?

    text = value.is_a?(BigDecimal) ? value.to_s("F") : value.to_s.strip
    text = BigDecimal(text).to_s("F") if value.is_a?(Float)
    return if text.length > 128

    FRACTIONS.each { |symbol, fraction| text = text.gsub(symbol, " #{fraction}").strip }
    quantity = if text.match?(/\A\d+\s+\d+\/\d+\z/)
      whole, fraction = text.split
      Rational(whole) + Rational(fraction)
    elsif text.match?(/\A\d+\/\d+\z/) || text.match?(/\A[+]?(?:\d+(?:\.\d*)?|\.\d+)\z/)
      Rational(text)
    end
    return unless quantity && quantity.positive? && quantity <= PositiveQuantityValidator::MAXIMUM

    rounded = (BigDecimal(quantity.numerator.to_s) / BigDecimal(quantity.denominator.to_s)).round(6)
    rounded if rounded.positive?
  rescue ArgumentError, ZeroDivisionError
    nil
  end
end
