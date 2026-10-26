import type { Meal, MealTypeOption, Menu, UnitOption } from "../../src/types";

export const meals: Meal[] = [
  {
    id: 1,
    name: "Huevos a la mexicana",
    description: "Eggs with tomato, onion, and chile.",
    recipe_url: "https://example.com/huevos",
    meal_types: ["breakfast"],
    ingredients: [
      { name: "Egg", quantity: 2, unit: "pieza", preparation_note: "beaten" },
    ],
  },
  {
    id: 2,
    name: "Calabacitas con queso",
    description: "Tender squash with corn and queso fresco.",
    recipe_url: "",
    meal_types: ["lunch", "dinner"],
    ingredients: [],
  },
  {
    id: 3,
    name: "Avena cocida",
    description: "Warm oats with cinnamon.",
    recipe_url: "",
    meal_types: ["breakfast", "dinner"],
    ingredients: [],
  },
];

export const mealTypes: MealTypeOption[] = [
  ["breakfast", 1],
  ["lunch", 2],
  ["dinner", 3],
];
export const units: UnitOption[] = [
  { code: "g", name: "grams" },
  { code: "pieza", name: "pieces" },
];
export const menu: Menu = {
  id: 1,
  from: "2026-10-19T12:00:00Z",
  to: "2026-10-25T12:00:00Z",
  days: ["Monday", "Tuesday", "Wednesday"].map((weekday, index) => ({
    id: index + 1,
    weekday,
    meals,
  })),
};
