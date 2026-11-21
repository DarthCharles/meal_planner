class AddMeasurementReferenceBasis < ActiveRecord::Migration[8.1]
  def change
    add_column :ingredient_measurement_references, :reference_quantity, :decimal, precision: 18, scale: 6, null: false, default: 1
    add_check_constraint :ingredient_measurement_references, "reference_quantity > 0 AND reference_quantity <= 1000000000", name: "measurement_references_positive_basis"
  end
end
