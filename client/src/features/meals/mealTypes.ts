import { t } from "../../i18n";
import type { MealTypeName } from "../../types";
export const mealTypeOrder: MealTypeName[] = ["breakfast", "lunch", "dinner"];
export function mealTypeLabel(type: string): string {
  return mealTypeOrder.includes(type as MealTypeName) ? t(`reference.meal_types.${type as MealTypeName}`) : type;
}

export function mealTypeColorClassName(type: string): string {
  switch (type) {
    case "breakfast":
      return "bg-accent";
    case "lunch":
      return "bg-secondary";
    case "dinner":
      return "bg-muted";
    default:
      return "bg-background";
  }
}
