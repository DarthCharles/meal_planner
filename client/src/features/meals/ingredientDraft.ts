import type { IngredientForm } from "../../types";

export function isEmptyIngredient({
  ingredient_id,
  name,
  quantity,
  unit,
  preparation_note,
  package_quantity,
  package_unit,
}: IngredientForm) {
  return (
    !ingredient_id &&
    !name &&
    !quantity &&
    !unit &&
    !preparation_note &&
    !package_quantity &&
    !package_unit
  );
}
