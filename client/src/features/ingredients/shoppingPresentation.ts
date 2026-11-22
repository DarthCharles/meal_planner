import type { Translate } from "../../i18n";
import type { ShoppingDraft } from "./shoppingProfileForm";

export function shoppingListResult(mode: ShoppingDraft["how"], unit: string, t: Translate) {
  if (mode === "piece") return t("ingredients.shopping.piece_result");
  if (mode === "package") return t("ingredients.shopping.package_result");
  return t(
    ["ml", "l"].includes(unit)
      ? "ingredients.shopping.volume_result"
      : "ingredients.shopping.weight_result",
  );
}
