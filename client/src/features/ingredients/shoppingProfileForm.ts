import type {
  IngredientShoppingProfile,
  IngredientShoppingProfilePayload,
  UnitOption,
} from "../../types";
import { validQuantity } from "../meals/quantity";

export const shoppingChoices = ["recipe", "piece", "weight", "volume", "package"] as const;
type ShoppingChoice = (typeof shoppingChoices)[number];

export type ShoppingDraft = {
  how: ShoppingChoice;
  bulkUnit: string;
  packageUnit: string;
  packageSize: string;
  packageMeasure: string;
  pieceWeight: string;
  pieceCount: string;
  hadPieceWeight: boolean;
};

export function shoppingChoice(profile: IngredientShoppingProfile | null): ShoppingChoice {
  if (!profile) return "recipe";
  if (profile.mode !== "bulk") return profile.mode;
  return ["ml", "l"].includes(profile.shopping_unit) ? "volume" : "weight";
}

export function shoppingProfileToDraft(profile: IngredientShoppingProfile | null): ShoppingDraft {
  return {
    how: shoppingChoice(profile),
    bulkUnit: profile?.mode === "bulk" ? profile.shopping_unit : "",
    packageUnit: profile?.mode === "package" ? profile.shopping_unit : "package",
    packageSize: profile?.package_quantity ?? "",
    packageMeasure: profile?.package_unit ?? "g",
    pieceWeight: profile?.piece_weight?.quantity ?? "",
    pieceCount: profile?.piece_weight?.reference_quantity ?? "1",
    hadPieceWeight: !!profile?.piece_weight,
  };
}
export const validShoppingAmount = validQuantity;
export function shoppingUnitOptions(units: UnitOption[]) {
  return {
    packages: units.filter((unit) => unit.dimension === "package"),
    measures: units.filter((unit) => ["g", "kg", "ml", "l", "piece"].includes(unit.code)),
  };
}
export function shoppingDraftToProfile(
  draft: ShoppingDraft,
): IngredientShoppingProfilePayload | null {
  if (draft.how === "recipe") return null;
  const mode = draft.how === "weight" || draft.how === "volume" ? "bulk" : draft.how;
  const units = draft.how === "volume" ? ["ml", "l"] : ["g", "kg"];
  const bulkUnit = units.includes(draft.bulkUnit) ? draft.bulkUnit : units[1];

  return {
    mode,
    shopping_unit: mode === "piece" ? "piece" : mode === "bulk" ? bulkUnit : draft.packageUnit,
    package_quantity:
      draft.how === "package" && draft.packageSize.trim() ? draft.packageSize : null,
    package_unit: draft.how === "package" && draft.packageSize.trim() ? draft.packageMeasure : null,
    ...(draft.how !== "package" && (draft.pieceWeight.trim() || draft.hadPieceWeight)
      ? {
          piece_weight: draft.pieceWeight.trim()
            ? { quantity: draft.pieceWeight, reference_quantity: draft.pieceCount }
            : null,
        }
      : {}),
  };
}
