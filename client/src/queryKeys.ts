export const queryKeys = {
  menus: ["menus"] as const,
  meals: ["meals"] as const,
  mealDetails: ["meal"] as const,
  meal: (id: number) => ["meal", id] as const,
  mealTypes: ["meal-types"] as const,
  units: ["units"] as const,
  ingredients: ["ingredients"] as const,
  ingredientProfiles: ["ingredient-shopping-profile"] as const,
  shoppingLists: ["shopping-lists"] as const,
  ingredientProfile: (id: number) => ["ingredient-shopping-profile", id] as const,
};
