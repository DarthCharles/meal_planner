import { getLocale, t } from "./i18n";
import type { Locale } from "./i18n";
import type { IngredientCatalogEntry, IngredientPayload, Meal, MealPayload, MealTypeOption, Menu, UnitOption } from "./types";

function errorFieldLabel(field: string) {
  switch (field) {
    case "name": return t("api.field_name");
    case "description": return t("api.field_description");
    case "ingredients": return t("api.field_ingredients");
    case "preferred_days": return t("api.field_preferred_days");
    case "quantity": return t("api.field_quantity");
    case "unit": return t("api.field_unit");
    default: return field;
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "Accept-Language": getLocale(), ...options?.headers },
  }).catch((error: unknown) => {
    if (options?.signal?.aborted) throw error;
    throw new Error(t("api.network_error"));
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body.errors === "string"
        ? body.errors
        : body.errors && typeof body.errors === "object"
          ? Object.entries(body.errors)
              .map(([field, messages]) => `${errorFieldLabel(field)}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
              .join(". ")
          : t("api.generic_error"),
    );
  }
  return body.data as T;
}

export const api = {
  getMenus: (signal?: AbortSignal, locale: Locale = getLocale()) =>
    request<Menu[]>("/menus", { signal, headers: { "Accept-Language": locale } }),
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
