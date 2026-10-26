import type { Meal, MealForm, MealTypeOption, Menu, UnitOption } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof body.errors === "string" ? body.errors : "Something went wrong.",
    );
  }
  return body.data as T;
}

export const api = {
  getMenus: (signal?: AbortSignal) => request<Menu[]>("/menus", { signal }),
  getMeals: (signal?: AbortSignal) => request<Meal[]>("/meals", { signal }),
  getMealTypes: (signal?: AbortSignal) =>
    request<MealTypeOption[]>("/meal_types", { signal }),
  getUnits: (signal?: AbortSignal) =>
    request<UnitOption[]>("/units", { signal }),
  generateMenu: () =>
    request<Menu>("/menus/generate", {
      method: "POST",
      body: JSON.stringify({}),
    }),
  createMeal: (meal: MealForm) =>
    request<Meal>("/meals", { method: "POST", body: JSON.stringify(meal) }),
  updateMeal: (id: number, meal: MealForm) =>
    request<Meal>(`/meals/${id}`, {
      method: "PUT",
      body: JSON.stringify(meal),
    }),
};
