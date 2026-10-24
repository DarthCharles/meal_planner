export type MealTypeName = "breakfast" | "lunch" | "dinner";

export type Meal = {
  id: number;
  name: string;
  description: string;
  recipe_url?: string;
  meal_types: string[];
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

export type MealForm = {
  name: string;
  description: string;
  recipe_url: string;
  meal_type_ids: number[];
};
