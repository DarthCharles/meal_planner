# Only ingredient-specific mass/volume and mass/piece bridges are configurable.
# Culinary volume relationships come exclusively from the standard Unit catalog.
class IngredientMeasurementConverter
  def initialize(ingredient)
    @edges = Hash.new { |hash, key| hash[key] = [] }
    ingredient.measurement_references.each do |reference|
      next unless reference.quantity&.finite? && reference.quantity.positive?

      source = reference.kind == "density" ? "ml" : "piece"
      factor = Rational(reference.quantity.to_s) / Rational(reference.reference_quantity.to_s)
      @edges[source] << ["g", factor, reference.approximate]
      @edges["g"] << [source, 1 / factor, reference.approximate]
    end
  end

  # Returns [converted quantity, approximate], or nil if a reference is missing.
  def convert(quantity, from:, to:)
    queue = [[from, quantity, false]]
    visited = []
    until queue.empty?
      unit, amount, approximate = queue.shift
      return [amount, approximate] if unit == to
      next if visited.include?(unit)

      visited << unit
      @edges[unit].each do |target, factor, estimated|
        queue << [target, amount * factor, approximate || estimated]
      end
    end
    nil
  end
end
