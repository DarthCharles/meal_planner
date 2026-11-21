import type {
  IngredientShoppingProfile,
  IngredientShoppingProfilePayload,
  UnitOption,
} from "../../types";
import { validQuantity } from "../meals/quantity";

export type ShoppingDraft = {
  how: "piece" | "bulk" | "package";
  bulkUnit: string;
  packageUnit: string;
  packageSize: string;
  packageMeasure: string;
};
export function shoppingProfileToDraft(profile: IngredientShoppingProfile | null): ShoppingDraft {
  return {
    how: profile?.mode ?? "piece",
    bulkUnit: profile?.mode === "bulk" ? profile.shopping_unit : "kg",
    packageUnit: profile?.mode === "package" ? profile.shopping_unit : "",
    packageSize: profile?.package_quantity ?? "",
    packageMeasure: profile?.package_unit ?? "g",
  };
}
export const validShoppingAmount = validQuantity;
export function shoppingUnitOptions(units: UnitOption[]) {
  return {
    packages: units.filter((unit) => unit.dimension === "package"),
    bulk: units.filter((unit) => ["g", "kg", "ml", "l"].includes(unit.code)),
    measures: units.filter((unit) => ["g", "kg", "ml", "l", "piece"].includes(unit.code)),
  };
}
export function shoppingDraftToProfile(draft: ShoppingDraft): IngredientShoppingProfilePayload {
  return {
    mode: draft.how,
    shopping_unit:
      draft.how === "piece" ? "piece" : draft.how === "bulk" ? draft.bulkUnit : draft.packageUnit,
    package_quantity: draft.how === "package" ? draft.packageSize : null,
    package_unit: draft.how === "package" ? draft.packageMeasure : null,
  };
}
