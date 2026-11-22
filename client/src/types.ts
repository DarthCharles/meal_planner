export type Weekday =
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type MealTypeName = "breakfast" | "lunch" | "dinner";

export type Meal = {
  id: number;
  name: string;
  description: string;
  servings: number;
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
  package_quantity?: string | null;
  package_unit?: string | null;
};

export type Day = {
  id: number;
  weekday: string;
  meals: Meal[];
};

export type Menu = {
  id: number;
  people_count: number;
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
  dimension: "mass" | "volume" | "count" | "package";
  canonical_unit: string | null;
  factor: string | null;
};

export type IngredientOption = {
  id: number;
  name: string;
  shopping_category?: ShoppingCategoryCode;
};
export type IngredientCatalogEntry = IngredientOption & {
  shopping_category: ShoppingCategoryCode;
  meals: { id: number; name: string }[];
};
export type ShoppingCategoryCode =
  | "produce"
  | "meat"
  | "deli"
  | "dairy_eggs"
  | "bakery_tortillas"
  | "pantry"
  | "frozen"
  | "uncategorized";

export type ShoppingCategory = { code: ShoppingCategoryCode; position: number };
export type IngredientPayload = { name: string; shopping_category?: ShoppingCategoryCode };

export type ShoppingListItem = {
  ingredient_id: number;
  name: string;
  shopping_category: ShoppingCategoryCode;
  quantity: string | null;
  unit: string | null;
  status: "calculated" | "approximate" | "unquantified";
  required_quantity: string | null;
  required_unit: string | null;
  presentation?: IngredientShoppingProfile;
  approximate?: boolean;
};

export type ShoppingList = {
  menu_id: number;
  from: string;
  to: string;
  people_count: number;
  categories: ShoppingCategory[];
  items: ShoppingListItem[];
  meals_without_ingredients: { id: number; name: string }[];
  conversion_warnings: {
    ingredient_id: number;
    name: string;
    units: string[];
    target_unit: string | null;
    reason: "measurement_reference_missing";
  }[];
};

export type IngredientShoppingProfile = {
  ingredient_id: number;
  mode: "bulk" | "piece" | "package";
  shopping_unit: string;
  package_quantity: string | null;
  package_unit: string | null;
  piece_weight?: { quantity: string; reference_quantity: string } | null;
};

export type IngredientShoppingProfilePayload = Omit<IngredientShoppingProfile, "ingredient_id">;

export type MeasurementReference = {
  kind: "density" | "piece_weight";
  quantity: string;
  reference_quantity: string;
  source: string;
  description: string;
  approximate: boolean;
};

export type MealForm = {
  servings: string;
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
  package_quantity?: string;
  package_unit?: string;
};

export type MealPayload = Omit<MealForm, "ingredients"> & {
  ingredients: (Omit<IngredientForm, "ingredient_id" | "name" | "uncommitted"> &
    ({ ingredient_id: number; name?: never } | { name: string; ingredient_id?: never }))[];
};
