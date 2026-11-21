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
    servings: 1,
    preferred_days: [],
    meal_types: ["breakfast"],
    ingredients: [
      { ingredient_id: 1, name: "Egg", quantity: 2, unit: "piece", preparation_note: "beaten" },
    ],
  },
  {
    id: 2,
    name: "Calabacitas con queso",
    description: "Tender squash with corn and queso fresco.",
    recipe_url: "",
    servings: 1,
    preferred_days: [],
    meal_types: ["lunch", "dinner"],
    ingredients: [],
  },
  {
    id: 3,
    name: "Avena cocida",
    description: "Warm oats with cinnamon.",
    recipe_url: "",
    servings: 1,
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
  { code: "g", name: "grams", dimension: "mass", canonical_unit: "g", factor: "1" },
  { code: "kg", name: "kilograms", dimension: "mass", canonical_unit: "g", factor: "1000" },
  { code: "l", name: "liters", dimension: "volume", canonical_unit: "ml", factor: "1000" },
  { code: "piece", name: "pieces", dimension: "count", canonical_unit: "piece", factor: "1" },
  { code: "ml", name: "milliliters", dimension: "volume", canonical_unit: "ml", factor: "1" },
  { code: "jar", name: "jars", dimension: "package", canonical_unit: null, factor: null },
  { code: "bag", name: "bags", dimension: "package", canonical_unit: null, factor: null },
  { code: "can", name: "cans", dimension: "package", canonical_unit: null, factor: null },
  { code: "bottle", name: "bottles", dimension: "package", canonical_unit: null, factor: null },
  { code: "package", name: "packages", dimension: "package", canonical_unit: null, factor: null },
  { code: "cup", name: "cups", dimension: "volume", canonical_unit: "ml", factor: "240" },
  {
    code: "tablespoon",
    name: "tablespoons",
    dimension: "volume",
    canonical_unit: "ml",
    factor: "15",
  },
  { code: "teaspoon", name: "teaspoons", dimension: "volume", canonical_unit: "ml", factor: "5" },
];
export const menu: Menu = {
  id: 1,
  people_count: 4,
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
      status: "calculated",
      required_quantity: "12",
      required_unit: "piece",
      unit: "piece",
    },
    {
      ingredient_id: 2,
      name: "Tomato",
      shopping_category: "produce",
      quantity: "300.0",
      status: "calculated",
      required_quantity: "300",
      required_unit: "g",
      unit: "g",
    },
  ],
  meals_without_ingredients: [],
  conversion_warnings: [],
};
