import type { MealTypeName } from "../../types";
export const mealTypeOrder: MealTypeName[] = ["breakfast", "lunch", "dinner"];
export const mealTypeLabels: Record<MealTypeName, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};
