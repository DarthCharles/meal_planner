import type {
  Meal,
  MealTypeOption,
  Menu,
  ShoppingCategory,
  ShoppingList,
  UnitOption,
} from "../../src/types";

export const meals: Meal[] = [
  {
    id: 1,
    name: "Huevos a la mexicana",
    description: "Eggs with tomato, onion, and chile.",
    recipe_url: "https://example.com/huevos",
    preferred_days: [],
    meal_types: ["breakfast"],
    ingredients: [
      { ingredient_id: 1, name: "Egg", quantity: 2, unit: "pieza", preparation_note: "beaten" },
    ],
  },
  {
    id: 2,
    name: "Calabacitas con queso",
    description: "Tender squash with corn and queso fresco.",
    recipe_url: "",
    preferred_days: [],
    meal_types: ["lunch", "dinner"],
    ingredients: [],
  },
  {
    id: 3,
    name: "Avena cocida",
    description: "Warm oats with cinnamon.",
    recipe_url: "",
    preferred_days: [],
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
  { code: "kg", name: "kilograms" },
  { code: "l", name: "liters" },
  { code: "pieza", name: "pieces" },
  { code: "ml", name: "milliliters" },
  { code: "frasco", name: "jars" },
  { code: "bag", name: "bags" },
  { code: "can", name: "cans" },
  { code: "bottle", name: "bottles" },
  { code: "package", name: "packages" },
];
export const menu: Menu = {
  id: 1,
  generation_notices: [],
  from: "2026-10-19T12:00:00Z",
  to: "2026-10-25T12:00:00Z",
  days: ["Monday", "Tuesday", "Wednesday"].map((weekday, index) => ({
    id: index + 1,
    weekday,
    meals,
  })),
};

export const shoppingCategories: ShoppingCategory[] = [
  "produce",
  "meat",
  "deli",
  "dairy_eggs",
  "bakery_tortillas",
  "pantry",
  "frozen",
  "uncategorized",
].map((code, position) => ({ code: code as ShoppingCategory["code"], position }));

export const shoppingList: ShoppingList = {
  menu_id: menu.id,
  from: menu.from,
  to: menu.to,
  people_count: 4,
  categories: shoppingCategories,
  items: [
    {
      ingredient_id: 1,
      name: "Egg",
      shopping_category: "dairy_eggs",
      quantity: "12.0",
      unit: "pieza",
    },
    {
      ingredient_id: 2,
      name: "Tomato",
      shopping_category: "produce",
      quantity: "300.0",
      unit: "g",
    },
  ],
  meals_without_ingredients: [],
  conversion_warnings: [],
};
