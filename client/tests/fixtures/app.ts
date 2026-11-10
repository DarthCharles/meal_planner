import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { IngredientOption, IngredientPayload, Meal, MealPayload, Menu } from "../../src/types";
import { meals, mealTypes, menu, units } from "./data";

type SaveRequest = { method: string; path: string; body: MealPayload };
type MockApi = {
  menus: Menu[];
  meals: Meal[];
  ingredients: IngredientOption[];
  ingredientSaves: { method: string; path: string; body: IngredientPayload }[];
  ingredientSaveError: string | null;
  ingredientSaveBarrier?: Promise<void>;
  ingredientDeletes: number[];
  ingredientDeleteError: string | null;
  ingredientDeleteBarrier?: Promise<void>;
  readErrors: Record<string, string>;
  reads: Record<string, number>;
  unavailable: boolean;
  generationError: string | null;
  generationNotices: string[];
  saveError: string | null;
  initialBarrier?: Promise<void>;
  readBarriers: Record<string, Promise<void>>;
  generationBarrier?: Promise<void>;
  saveBarrier?: Promise<void>;
  generationRequests: number;
  saves: SaveRequest[];
};

export const test = base.extend<{ api: MockApi; runtimeErrors: void }>({
  api: [
    async ({ page }, use) => {
      const api: MockApi = {
        menus: structuredClone([menu]),
        meals: structuredClone(meals),
        ingredients: [{ id: 1, name: "Egg" }, { id: 2, name: "Tomato" }],
        ingredientSaves: [],
        ingredientSaveError: null,
        ingredientDeletes: [],
        ingredientDeleteError: null,
        readErrors: {},
        readBarriers: {},
        reads: {},
        unavailable: false,
        generationError: null,
        generationNotices: [],
        saveError: null,
        generationRequests: 0,
        saves: [],
      };
      // Keep weekday ordering and date labels independent of the machine's clock.
      await page.clock.setFixedTime(new Date("2026-10-21T12:00:00Z"));
      // Browser tests must also work without access to Google Fonts.
      await page.route(
        /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
        (route) => route.abort(),
      );
      await page.route("http://127.0.0.1:4174/**", async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        const headers = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        };
        if (request.method() === "OPTIONS") {
          await route.fulfill({ status: 204, headers });
          return;
        }
        if (api.unavailable) {
          await route.abort();
          return;
        }
        const respond = (data: unknown) =>
          route.fulfill({ json: { data }, headers });
        const fail = (errors: string) =>
          route.fulfill({ status: 422, json: { errors }, headers });
        if (request.method() === "GET") {
          api.reads[path] = (api.reads[path] ?? 0) + 1;
          await api.initialBarrier;
          await api.readBarriers[path];
          if (api.readErrors[path])
            return void (await fail(api.readErrors[path]));
          if (path === "/menus") return void (await respond(api.menus));
          if (path === "/meals") return void (await respond(api.meals));
          if (/^\/meals\/\d+$/.test(path)) return void (await respond(api.meals.find((meal) => meal.id === Number(path.split("/").pop()))));
          if (path === "/meal_types") return void (await respond(mealTypes));
          if (path === "/units") return void (await respond(units));
          if (path === "/ingredients") return void (await respond(api.ingredients.map((ingredient) => ({
            ...ingredient,
            meals: api.meals.filter((meal) => meal.ingredients.some((row) => row.ingredient_id === ingredient.id))
              .map(({ id, name }) => ({ id, name })),
          }))));
        }
        if (path === "/menus/generate" && request.method() === "POST") {
          api.generationRequests++;
          await api.generationBarrier;
          if (api.generationError)
            return void (await fail(api.generationError));
          const generated = { ...structuredClone(menu), generation_notices: api.generationNotices };
          api.menus = [generated];
          return void (await respond(generated));
        }
        if (/^\/ingredients\/\d+$/.test(path) && request.method() === "DELETE") {
          const id = Number(path.split("/").pop());
          api.ingredientDeletes.push(id);
          await api.ingredientDeleteBarrier;
          if (api.ingredientDeleteError) return void (await fail(api.ingredientDeleteError));
          if (api.meals.some((meal) => meal.ingredients.some((row) => row.ingredient_id === id))) {
            return void (await fail("Cannot delete an ingredient used by meals. Remove it from those meals first."));
          }
          api.ingredients = api.ingredients.filter((ingredient) => ingredient.id !== id);
          return void (await respond(true));
        }
        if ((path === "/ingredients" && request.method() === "POST") ||
          (/^\/ingredients\/\d+$/.test(path) && request.method() === "PUT")) {
          const body = request.postDataJSON() as IngredientPayload;
          api.ingredientSaves.push({ method: request.method(), path, body });
          await api.ingredientSaveBarrier;
          if (api.ingredientSaveError) return void (await fail(api.ingredientSaveError));
          const id = request.method() === "POST"
            ? Math.max(0, ...api.ingredients.map((item) => item.id)) + 1
            : Number(path.split("/").pop());
          const ingredient = { id, name: body.name.trim() };
          api.ingredients = [...api.ingredients.filter((item) => item.id !== id), ingredient];
          const rename = (meal: Meal): Meal => ({ ...meal, ingredients: meal.ingredients.map((row) =>
            row.ingredient_id === id ? { ...row, name: ingredient.name } : row) });
          api.meals = api.meals.map(rename);
          api.menus = api.menus.map((menu) => ({ ...menu, days: menu.days.map((day) => ({ ...day, meals: day.meals.map(rename) })) }));
          return void (await respond({ ...ingredient, meals: api.meals
            .filter((meal) => meal.ingredients.some((row) => row.ingredient_id === id))
            .map(({ id, name }) => ({ id, name })) }));
        }
        if (
          (path === "/meals" && request.method() === "POST") ||
          (path === "/meals/1" && request.method() === "PUT")
        ) {
          const body = request.postDataJSON() as MealPayload;
          api.saves.push({ method: request.method(), path, body });
          await api.saveBarrier;
          if (api.saveError) return void (await fail(api.saveError));
          const savedMeal: Meal = {
            ...body,
            ingredients: body.ingredients.map((row) => {
              let ingredient = row.ingredient_id
                ? api.ingredients.find((item) => item.id === row.ingredient_id)
                : api.ingredients.find((item) => item.name.toLowerCase() === row.name?.trim().toLowerCase());
              if (!ingredient) {
                if (!row.name) throw new Error("Unknown ingredient ID in mocked save");
                ingredient = { id: Math.max(0, ...api.ingredients.map((item) => item.id)) + 1, name: row.name.trim() };
                api.ingredients.push(ingredient);
              }
              return { ...row, name: ingredient.name, ingredient_id: ingredient.id };
            }),
            id: request.method() === "POST" ? 4 : 1,
            meal_types: mealTypes
              .filter(([, id]) => body.meal_type_ids.includes(id))
              .map(([name]) => name),
          };
          api.meals = api.meals.some((meal) => meal.id === savedMeal.id)
            ? api.meals.map((meal) =>
                meal.id === savedMeal.id ? savedMeal : meal,
              )
            : [...api.meals, savedMeal];
          api.menus = api.menus.map((menu) => ({
            ...menu,
            days: menu.days.map((day) => ({
              ...day,
              meals: day.meals.map((meal) =>
                meal.id === savedMeal.id ? savedMeal : meal,
              ),
            })),
          }));
          return void (await respond(savedMeal));
        }
        throw new Error(`Unexpected API request: ${request.method()} ${path}`);
      });
      await use(api);
    },
    { auto: true },
  ],
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors, "Uncaught browser errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function navigateTo(page: Page, name: "My menu" | "My meals" | "My Ingredients" | "Saved Menus") {
  if (page.viewportSize()!.width >= 760) {
    await page.getByRole("button", { name: "Open actions" }).click();
  }
  await page.getByRole("navigation").getByRole("link", { name: new RegExp(name, "i") }).click();
}
