export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type MealTypeName = "breakfast" | "lunch" | "dinner";

export type Meal = {
  id: number;
  name: string;
  description: string;
  recipe_url?: string;
  meal_types: string[];
  preferred_days: Weekday[];
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
  generation_notices: string[];
  from: string;
  to: string;
  days: Day[];
};

export type MealTypeOption = [string, number];

export type UnitOption = {
  code: string;
  name: string;
};

export type IngredientOption = { id: number; name: string };

export type MealForm = {
  name: string;
  description: string;
  recipe_url: string;
  meal_type_ids: number[];
  preferred_days: Weekday[];
  ingredients: IngredientForm[];
};

export type IngredientForm = {
  ingredient_id?: number;
  uncommitted?: boolean;
  name: string;
  quantity: string;
  unit: string;
  preparation_note: string;
};

export type MealPayload = Omit<MealForm, "ingredients"> & {
  ingredients: (Omit<IngredientForm, "ingredient_id" | "name" | "uncommitted"> &
    ({ ingredient_id: number; name?: never } | { name: string; ingredient_id?: never }))[];
};
