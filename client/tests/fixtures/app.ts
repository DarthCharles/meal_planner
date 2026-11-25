import { utc } from "@date-fns/utc";
import type { Page } from "@playwright/test";
import { expect, test as base } from "@playwright/test";
import {
  addDays,
  compareAsc,
  compareDesc,
  type Day,
  endOfDay,
  formatISO,
  formatRFC3339,
  getDay,
  isAfter,
  isSameDay,
  isWithinInterval,
  nextDay,
  nextMonday,
  parseISO,
  startOfDay,
} from "date-fns";

import type {
  IngredientOption,
  IngredientPayload,
  IngredientShoppingProfile,
  IngredientShoppingProfilePayload,
  Meal,
  MealPayload,
  MeasurementReference,
  Menu,
  MenuHome,
  ShoppingList,
} from "../../src/types";
import { meals, mealTypes, menu, shoppingCategories, shoppingList, units } from "./data";

function nextWeekBounds(now: number) {
  const start = startOfDay(nextMonday(now, { in: utc }));
  return { start, end: endOfDay(addDays(start, 6)) };
}

function calendarDate(value: string) {
  return parseISO(value.slice(0, 10), { in: utc });
}

function scheduledDates(menu: Menu) {
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const start = calendarDate(menu.from);
  const startWeekday = getDay(start);
  return menu.days
    .filter((day) => day.meals.length)
    .map((day) => {
      const weekday = weekdays.indexOf(day.weekday.toLowerCase()) as Day;
      return weekday === startWeekday ? start : nextDay(start, weekday);
    });
}

type SaveRequest = { method: string; path: string; body: MealPayload };
type MockApi = {
  menus: Menu[];
  shoppingLists: Record<number, ShoppingList>;
  menuSaves: { id: number; people_count: number }[];
  menuSaveError: string | null;
  menuSaveBarrier?: Promise<void>;
  localizedMenus: Partial<Record<"en" | "es", Menu[]>>;
  requests: { path: string; language: string | undefined }[];
  meals: Meal[];
  ingredients: IngredientOption[];
  ingredientReferences: Record<number, MeasurementReference[]>;
  referenceSaves: { id: number; body: { references: MeasurementReference[] } }[];
  referenceSaveError: string | null;
  referenceSaveBarrier?: Promise<void>;
  ingredientProfiles: Record<number, IngredientShoppingProfile | null>;
  profileSaves: { id: number; body: IngredientShoppingProfilePayload }[];
  profileDeletes: number[];
  profileSaveError: string | null;
  profileSaveBarrier?: Promise<void>;
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
        shoppingLists: { [menu.id]: structuredClone(shoppingList) },
        localizedMenus: {},
        menuSaves: [],
        menuSaveError: null,
        requests: [],
        meals: structuredClone(meals),
        ingredients: [
          { id: 1, name: "Egg" },
          { id: 2, name: "Tomato" },
        ],
        ingredientReferences: {},
        referenceSaves: [],
        referenceSaveError: null,
        ingredientProfiles: {},
        profileSaves: [],
        profileDeletes: [],
        profileSaveError: null,
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
      await page.addInitScript(() => {
        const ClockDate = window.Date;
        const NativeDate = ClockDate.prototype.constructor as DateConstructor;
        if (ClockDate === NativeDate) return;

        // Playwright's clock returns a plain Date from super(), losing date-fns' UTC subclass.
        const subclassableDate: DateConstructor = new Proxy(ClockDate, {
          construct(target, args, newTarget) {
            if (newTarget === subclassableDate) return Reflect.construct(target, args);
            return Reflect.construct(NativeDate, args.length ? args : [target.now()], newTarget);
          },
        });
        window.Date = subclassableDate;
      });
      // Browser tests must also work without access to Google Fonts.
      await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
      await page.route("http://127.0.0.1:4174/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname;
        const headers = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        };
        if (request.method() === "OPTIONS") {
          await route.fulfill({ status: 204, headers });
          return;
        }
        const language = request.headers()["accept-language"];
        api.requests.push({ path, language });
        if (api.unavailable) {
          await route.abort();
          return;
        }
        const respond = (data: unknown) => route.fulfill({ json: { data }, headers });
        const fail = (errors: string) => route.fulfill({ status: 422, json: { errors }, headers });
        if (request.method() === "GET") {
          api.reads[path] = (api.reads[path] ?? 0) + 1;
          await api.initialBarrier;
          await api.readBarriers[path];
          if (api.readErrors[path]) return void (await fail(api.readErrors[path]));
          if (/^\/ingredients\/\d+\/measurement_references$/.test(path)) {
            return void (await respond(api.ingredientReferences[Number(path.split("/")[2])] ?? []));
          }
          if (/^\/ingredients\/\d+\/shopping_profile$/.test(path)) {
            const id = Number(path.split("/")[2]);
            const profile = api.ingredientProfiles[id];
            const weight = api.ingredientReferences[id]?.find(
              (reference) => reference.kind === "piece_weight",
            );
            return void (await respond(
              profile && weight
                ? {
                    ...profile,
                    piece_weight: {
                      quantity: weight.quantity,
                      reference_quantity: weight.reference_quantity,
                    },
                  }
                : (profile ?? null),
            ));
          }
          const menus = api.localizedMenus[language === "es" ? "es" : "en"] ?? api.menus;
          if (path === "/menus/home" || path === "/menus/summaries") {
            const ordered = [...menus].sort(
              (left, right) =>
                compareDesc(parseISO(left.from), parseISO(right.from)) || right.id - left.id,
            );
            if (path === "/menus/summaries")
              return void (await respond(ordered.map(({ id, from, to }) => ({ id, from, to }))));
            const date = calendarDate(url.searchParams.get("date")!);
            const week = nextWeekBounds(await page.evaluate(() => Date.now()));
            const currentMenu =
              ordered.find((menu) =>
                isWithinInterval(date, {
                  start: calendarDate(menu.from),
                  end: calendarDate(menu.to),
                }),
              ) ?? null;
            const nextMealDate =
              currentMenu && !scheduledDates(currentMenu).some((day) => isSameDay(day, date))
                ? ordered
                    .flatMap((menu) => {
                      const end = calendarDate(menu.to);
                      return scheduledDates(menu).filter(
                        (day) => isAfter(day, date) && !isAfter(day, end),
                      );
                    })
                    .sort(compareAsc)[0]
                : null;
            return void (await respond({
              current_menu: currentMenu,
              next_week: {
                from: formatISO(week.start, { representation: "date" }),
                to: formatISO(week.end, { representation: "date" }),
              },
              next_week_menu_id:
                ordered.find((menu) => isWithinInterval(calendarDate(menu.from), week))?.id ?? null,
              next_meal_date: nextMealDate
                ? formatISO(nextMealDate, { representation: "date" })
                : null,
              has_saved_menus: menus.length > 0,
              has_meals: api.meals.length > 0,
            } satisfies MenuHome));
          }
          if (/^\/menus\/\d+$/.test(path)) {
            const id = Number(path.split("/")[2]);
            const selected = menus.find((menu) => menu.id === id);
            if (selected) return void (await respond(selected));
            return void (await route.fulfill({
              status: 404,
              json: { errors: `Menu with id ${id} not found` },
              headers,
            }));
          }
          if (path === "/meals") return void (await respond(api.meals));
          if (/^\/meals\/\d+$/.test(path))
            return void (await respond(
              api.meals.find((meal) => meal.id === Number(path.split("/").pop())),
            ));
          if (path === "/shopping_categories") return void (await respond(shoppingCategories));
          if (/^\/menus\/\d+\/shopping_list$/.test(path)) {
            const id = Number(path.split("/")[2]);
            const list = api.shoppingLists[id];
            if (!list)
              return void (await route.fulfill({
                status: 404,
                json: { errors: `Menu with id ${id} not found` },
                headers,
              }));
            return void (await respond({
              ...list,
              items: list.items.map((item) => {
                const ingredient = api.ingredients.find((entry) => entry.id === item.ingredient_id);
                return {
                  ...item,
                  name: ingredient?.name ?? item.name,
                  shopping_category: ingredient?.shopping_category ?? item.shopping_category,
                };
              }),
            }));
          }
          if (path === "/meal_types") return void (await respond(mealTypes));
          if (path === "/units") return void (await respond(units));
          if (path === "/ingredients")
            return void (await respond(
              api.ingredients.map((ingredient) => ({
                ...ingredient,
                shopping_category: ingredient.shopping_category ?? "uncategorized",
                meals: api.meals
                  .filter((meal) =>
                    meal.ingredients.some((row) => row.ingredient_id === ingredient.id),
                  )
                  .map(({ id, name }) => ({ id, name })),
              })),
            ));
        }
        if (/^\/menus\/\d+$/.test(path) && request.method() === "PATCH") {
          const id = Number(path.split("/")[2]);
          const { people_count } = request.postDataJSON() as { people_count: number };
          api.menuSaves.push({ id, people_count });
          await api.menuSaveBarrier;
          if (api.menuSaveError) return void (await fail(api.menuSaveError));
          const menu = api.menus.find((item) => item.id === id);
          if (!menu) return void (await fail("Menu not found"));
          menu.people_count = people_count;
          for (const menus of Object.values(api.localizedMenus)) {
            const localized = menus?.find((item) => item.id === id);
            if (localized) localized.people_count = people_count;
          }
          return void (await respond(menu));
        }
        if (path === "/menus/generate" && request.method() === "POST") {
          api.generationRequests++;
          const requestTime = await page.evaluate(() => Date.now());
          await api.generationBarrier;
          if (api.generationError) return void (await fail(api.generationError));
          const week = nextWeekBounds(requestTime);
          const startsInWeek = (item: Menu) =>
            isWithinInterval(parseISO(item.from, { in: utc }), week);
          const existing = api.menus.find(startsInWeek);
          const generated = {
            ...structuredClone(menu),
            id: Math.max(menu.id, ...api.menus.map((item) => item.id)) + 1,
            from: formatRFC3339(week.start, { fractionDigits: 3 }),
            to: formatRFC3339(week.end, { fractionDigits: 3 }),
            people_count: existing?.people_count ?? 1,
            generation_notices: api.generationNotices,
          };
          api.menus = [generated, ...api.menus.filter((item) => !startsInWeek(item))];
          return void (await respond(generated));
        }
        if (
          /^\/ingredients\/\d+\/measurement_references$/.test(path) &&
          request.method() === "PUT"
        ) {
          const id = Number(path.split("/")[2]);
          const body = request.postDataJSON() as { references: MeasurementReference[] };
          api.referenceSaves.push({ id, body });
          await api.referenceSaveBarrier;
          if (api.referenceSaveError) return void (await fail(api.referenceSaveError));
          api.ingredientReferences[id] = body.references;
          return void (await respond(body.references));
        }
        if (/^\/ingredients\/\d+\/shopping_profile$/.test(path) && request.method() === "PUT") {
          const id = Number(path.split("/")[2]);
          const body = request.postDataJSON() as IngredientShoppingProfilePayload;
          api.profileSaves.push({ id, body });
          await api.profileSaveBarrier;
          if (api.profileSaveError) return void (await fail(api.profileSaveError));
          if (body.piece_weight !== undefined) {
            const previous = api.ingredientReferences[id]?.find(
              (reference) => reference.kind === "piece_weight",
            );
            const references = (api.ingredientReferences[id] ?? []).filter(
              (reference) => reference.kind !== "piece_weight",
            );
            if (body.piece_weight) {
              references.push(
                previous &&
                  previous.quantity === body.piece_weight.quantity &&
                  previous.reference_quantity === body.piece_weight.reference_quantity
                  ? previous
                  : {
                      kind: "piece_weight",
                      ...body.piece_weight,
                      source: "User-provided buying weight",
                      description: "Weight entered in buying setup",
                      approximate: true,
                    },
              );
            }
            api.ingredientReferences[id] = references;
          }
          const profile = { ...api.ingredientProfiles[id], ...body, ingredient_id: id };
          const weight = api.ingredientReferences[id]?.find(
            (reference) => reference.kind === "piece_weight",
          );
          if (weight)
            profile.piece_weight = {
              quantity: weight.quantity,
              reference_quantity: weight.reference_quantity,
            };
          api.ingredientProfiles[id] = profile;
          return void (await respond(profile));
        }
        if (/^\/ingredients\/\d+\/shopping_profile$/.test(path) && request.method() === "DELETE") {
          const id = Number(path.split("/")[2]);
          api.profileDeletes.push(id);
          if (api.profileSaveError) return void (await fail(api.profileSaveError));
          api.ingredientProfiles[id] = null;
          return void (await respond(true));
        }
        if (/^\/ingredients\/\d+$/.test(path) && request.method() === "DELETE") {
          const id = Number(path.split("/").pop());
          api.ingredientDeletes.push(id);
          await api.ingredientDeleteBarrier;
          if (api.ingredientDeleteError) return void (await fail(api.ingredientDeleteError));
          if (api.meals.some((meal) => meal.ingredients.some((row) => row.ingredient_id === id))) {
            return void (await fail(
              "Cannot delete an ingredient used by meals. Remove it from those meals first.",
            ));
          }
          api.ingredients = api.ingredients.filter((ingredient) => ingredient.id !== id);
          return void (await respond(true));
        }
        if (
          (path === "/ingredients" && request.method() === "POST") ||
          (/^\/ingredients\/\d+$/.test(path) && request.method() === "PUT")
        ) {
          const body = request.postDataJSON() as IngredientPayload;
          api.ingredientSaves.push({ method: request.method(), path, body });
          await api.ingredientSaveBarrier;
          if (api.ingredientSaveError) return void (await fail(api.ingredientSaveError));
          const id =
            request.method() === "POST"
              ? Math.max(0, ...api.ingredients.map((item) => item.id)) + 1
              : Number(path.split("/").pop());
          const ingredient = {
            id,
            name: body.name.trim(),
            shopping_category: body.shopping_category ?? ("uncategorized" as const),
          };
          api.ingredients = [...api.ingredients.filter((item) => item.id !== id), ingredient];
          const rename = (meal: Meal): Meal => ({
            ...meal,
            ingredients: meal.ingredients.map((row) =>
              row.ingredient_id === id ? { ...row, name: ingredient.name } : row,
            ),
          });
          api.meals = api.meals.map(rename);
          api.menus = api.menus.map((menu) => ({
            ...menu,
            days: menu.days.map((day) => ({ ...day, meals: day.meals.map(rename) })),
          }));
          return void (await respond({
            ...ingredient,
            meals: api.meals
              .filter((meal) => meal.ingredients.some((row) => row.ingredient_id === id))
              .map(({ id, name }) => ({ id, name })),
          }));
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
            servings: Number(body.servings),
            ingredients: body.ingredients.map((row) => {
              let ingredient = row.ingredient_id
                ? api.ingredients.find((item) => item.id === row.ingredient_id)
                : api.ingredients.find(
                    (item) => item.name.toLowerCase() === row.name?.trim().toLowerCase(),
                  );
              if (!ingredient) {
                if (!row.name) throw new Error("Unknown ingredient ID in mocked save");
                ingredient = {
                  id: Math.max(0, ...api.ingredients.map((item) => item.id)) + 1,
                  name: row.name.trim(),
                };
                api.ingredients.push(ingredient);
              }
              const quantity =
                ({ "1/2": "0.5", "½": "0.5", "1 ½": "1.5" } as Record<string, string>)[
                  row.quantity
                ] ?? row.quantity;
              return {
                ...row,
                quantity,
                package_quantity: row.package_quantity ?? null,
                package_unit: row.package_unit ?? null,
                name: ingredient.name,
                ingredient_id: ingredient.id,
              };
            }),
            id: request.method() === "POST" ? 4 : 1,
            meal_types: mealTypes
              .filter(([, id]) => body.meal_type_ids.includes(id))
              .map(([name]) => name),
          };
          api.meals = api.meals.some((meal) => meal.id === savedMeal.id)
            ? api.meals.map((meal) => (meal.id === savedMeal.id ? savedMeal : meal))
            : [...api.meals, savedMeal];
          api.menus = api.menus.map((menu) => ({
            ...menu,
            days: menu.days.map((day) => ({
              ...day,
              meals: day.meals.map((meal) => (meal.id === savedMeal.id ? savedMeal : meal)),
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

export async function navigateTo(
  page: Page,
  name: "My menu" | "My meals" | "My Ingredients" | "Saved Menus",
) {
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const destination = {
    "My menu": "/",
    "My meals": "/meals",
    "My Ingredients": "/ingredients",
    "Saved Menus": "/saved-menus",
  }[name];
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: new RegExp(name, "i") })
    .click();
  await expect(page).toHaveURL(destination);
}

export function editorScreen(page: Page) {
  return page.getByRole("region", {
    name: /^(A new favorite|Edit meal|Add ingredient|Edit ingredient|Un nuevo favorito|Editar comida|Agregar ingrediente|Editar ingrediente)$/,
  });
}

export async function cancelEditor(page: Page) {
  const accept = (dialog: import("@playwright/test").Dialog) => dialog.accept();
  page.on("dialog", accept);
  try {
    await editorScreen(page)
      .getByRole("button", { name: /^(Back|Volver|Cancel|Cancelar)$/ })
      .last()
      .click();
    await expect(editorScreen(page)).toHaveCount(0);
  } finally {
    page.off("dialog", accept);
  }
}

export async function finishIngredientSave(page: Page) {
  await expect(
    editorScreen(page).getByRole("button", { name: /^(Save ingredient|Guardar ingrediente)$/ }),
  ).toBeEnabled();
  await editorScreen(page)
    .getByRole("button", { name: /^(Back|Volver)$/ })
    .click();
}
