import type { Meal, Menu } from "./types";

export const demoMeals: Meal[] = [
  {
    id: 1,
    name: "Huevos a la mexicana",
    description: "Eggs with tomato, onion, and chile.",
    recipe_url: "",
    meal_types: ["breakfast"],
    ingredients: [],
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
    description: "Warm oats with cinnamon and seasonal fruit.",
    recipe_url: "",
    meal_types: ["breakfast", "dinner"],
    ingredients: [],
  },
];

export const demoMenu: Menu = {
  id: 1,
  from: "2025-03-03T00:00:00.000Z",
  to: "2025-03-09T23:59:59.000Z",
  days: [
    ["Monday", [demoMeals[0], demoMeals[1], demoMeals[2]]],
    ["Tuesday", [demoMeals[2], demoMeals[1], demoMeals[0]]],
    ["Wednesday", [demoMeals[0], demoMeals[1], demoMeals[2]]],
  ].map(([weekday, meals], index) => ({
    id: index + 1,
    weekday: weekday as string,
    meals: meals as Meal[],
  })),
};
