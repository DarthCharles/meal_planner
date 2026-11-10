import type { IngredientCatalogEntry, IngredientPayload, Meal, MealPayload, MealTypeOption, Menu, UnitOption } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body.errors === "string"
        ? body.errors
        : body.errors && typeof body.errors === "object"
          ? Object.entries(body.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
              .join(". ")
          : "Something went wrong.",
    );
  }
  return body.data as T;
}

export const api = {
  getMenus: (signal?: AbortSignal) => request<Menu[]>("/menus", { signal }),
  getMeals: (signal?: AbortSignal) => request<Meal[]>("/meals", { signal }),
  getMeal: (id: number, signal?: AbortSignal) => request<Meal>(`/meals/${id}`, { signal }),
  getMealTypes: (signal?: AbortSignal) =>
    request<MealTypeOption[]>("/meal_types", { signal }),
  getUnits: (signal?: AbortSignal) =>
    request<UnitOption[]>("/units", { signal }),
  getIngredients: (signal?: AbortSignal) =>
    request<IngredientCatalogEntry[]>("/ingredients", { signal }),
  createIngredient: (ingredient: IngredientPayload) =>
    request<IngredientCatalogEntry>("/ingredients", { method: "POST", body: JSON.stringify(ingredient) }),
  updateIngredient: (id: number, ingredient: IngredientPayload) =>
    request<IngredientCatalogEntry>(`/ingredients/${id}`, { method: "PUT", body: JSON.stringify(ingredient) }),
  deleteIngredient: (id: number) => request<boolean>(`/ingredients/${id}`, { method: "DELETE" }),
  generateMenu: () =>
    request<Menu>("/menus/generate", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  createMeal: (meal: MealPayload) =>
    request<Meal>("/meals", { method: "POST", body: JSON.stringify(meal) }),
  updateMeal: (id: number, meal: MealPayload) =>
    request<Meal>(`/meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(meal),
    }),
};
