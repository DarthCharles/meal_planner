import type { IngredientForm } from "../../types";

export function isEmptyIngredient({
  ingredient_id,
  uncommitted,
  name,
  quantity,
  unit,
  preparation_note,
  package_quantity,
  package_unit,
}: IngredientForm) {
  return (
    !ingredient_id &&
    !uncommitted &&
    !name &&
    !quantity &&
    !unit &&
    !preparation_note &&
    !package_quantity &&
    !package_unit
  );
}
