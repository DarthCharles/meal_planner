export type MealTypeName = "breakfast" | "lunch" | "dinner";

export type Meal = {
  id: number;
  name: string;
  description: string;
  recipe_url?: string;
  meal_types: string[];
  ingredients: Ingredient[];
};

export type Ingredient = {
  id?: number;
  ingredient_id?: number;
  name: string;
  quantity: number | string;
  unit: string;
  preparation_note?: string | null;
  position?: number;
};

export type Day = {
  id: number;
  weekday: string;
  meals: Meal[];
};

export type Menu = {
  id: number;
  created_at?: string;
  from: string;
  to: string;
  days: Day[];
};

export type MealTypeOption = [string, number];

export type UnitOption = {
  code: string;
  name: string;
};

export type MealForm = {
  name: string;
  description: string;
  recipe_url: string;
  meal_type_ids: number[];
  ingredients: IngredientForm[];
};

export type IngredientForm = {
  name: string;
  quantity: string;
  unit: string;
  preparation_note: string;
};
