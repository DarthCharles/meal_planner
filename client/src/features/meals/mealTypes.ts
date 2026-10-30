import type { MealTypeName } from "../../types";
export const mealTypeOrder: MealTypeName[] = ["breakfast", "lunch", "dinner"];
export const mealTypeLabels: Record<MealTypeName, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export function mealTypeBadgeClassName(type: string): string {
  switch (type) {
    case "breakfast":
      return "bg-secondary";
    case "lunch":
      return "bg-accent";
    case "dinner":
      return "bg-muted";
    default:
      return "bg-background";
  }
}
