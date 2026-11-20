import { t } from "../../i18n";
import type { MealTypeName } from "../../types";
export const mealTypeOrder: MealTypeName[] = ["breakfast", "lunch", "dinner"];
export function mealTypeLabel(type: string): string {
  return mealTypeOrder.includes(type as MealTypeName)
    ? t(`reference.meal_types.${type as MealTypeName}`)
    : type;
}

export function mealTypeColorClassName(type: string): string {
  switch (type) {
    case "breakfast":
      return "surface-tertiary text-secondary";
    case "lunch":
      return "surface-secondary text-secondary";
    case "dinner":
      return "bg-foreground text-background";
    default:
      return "surface-primary text-secondary";
  }
}
