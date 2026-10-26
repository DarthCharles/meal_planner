import type { MealTypeName } from "../../types";
export const mealTypeOrder: MealTypeName[] = ["breakfast", "lunch", "dinner"];
export const mealTypeLabels: Record<MealTypeName, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};
export const mealDotColors: Record<MealTypeName, string> = {
  breakfast: "bg-gold",
  lunch: "bg-terracotta",
  dinner: "bg-sage",
};
export const mealTagColors: Record<MealTypeName, string> = {
  breakfast: "bg-[#fbf0cd] text-[#8d6a21]",
  lunch: "bg-[#f8e4db] text-[#a84b37]",
  dinner: "bg-[#e3eddf] text-[#567053]",
};
