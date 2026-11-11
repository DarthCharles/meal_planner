import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures/app";

async function chooseLanguage(page: Page, language: "English" | "Español") {
  await page.getByRole("button", { name: /Open actions|Abrir acciones/ }).click();
  await page.getByRole("group", { name: /Language|Idioma/ }).getByRole("button", { name: language, exact: true }).click();
  await page.keyboard.press("Escape");
}

test("switches language, preserves the current route and filters, and persists on reload", { tag: "@responsive" }, async ({ page, api }) => {
  await page.goto("/meals");
  await page.getByRole("searchbox", { name: "Search meals" }).fill("Huevos");
  await chooseLanguage(page, "Español");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page).toHaveURL("/meals");
  await expect(page.getByRole("searchbox", { name: "Buscar comidas" })).toHaveValue("Huevos");
  await expect(page.getByRole("heading", { name: "Tu colección de comidas" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Huevos a la mexicana" })).toBeVisible();
  await expect(page).toHaveTitle("Comal — Planificador de comidas");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.es.webmanifest");
  const layout = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }));
  expect(layout.content).toBeLessThanOrEqual(layout.viewport);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Tu colección de comidas" })).toBeVisible();
  expect(api.requests.some(({ path, language }) => path === "/meals" && language === "es")).toBe(true);
  await chooseLanguage(page, "English");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Your meal library" })).toBeVisible();
});

test.describe("Spanish browser preference", () => {
  test.use({ locale: "es-MX", timezoneId: "America/Hermosillo" });

  test("keeps today lookup and calendar boundaries correct across years", async ({ page, api }) => {
    await page.clock.setFixedTime(new Date("2026-12-28T07:01:00Z"));
    const menu = api.menus[0];
    menu.from = "2026-12-28T00:00:00Z";
    menu.to = "2027-01-03T23:59:59Z";
    menu.days = [
      { ...menu.days[0], id: 99, weekday: "Sunday" },
      { ...menu.days[0], id: 22, weekday: "Monday" },
    ];
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("region", { name: "Menú de hoy" })).toBeVisible();
    const cards = page.getByRole("article");
    await expect(cards.first().getByRole("heading", { name: "Lunes", exact: true })).toBeVisible();
    await expect(cards.first().getByText("Hoy", { exact: true })).toBeVisible();
    await expect(cards.first().locator("time")).toHaveAttribute("datetime", "2026-12-28");
    await expect(cards.last().locator("time")).toHaveAttribute("datetime", "2027-01-03");
    const range = await page.evaluate(() => {
      const format = (date: string) => new Intl.DateTimeFormat("es-MX", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date));
      return `${format("2026-12-28T00:00:00Z")} — ${format("2027-01-03T00:00:00Z")}`;
    });
    await expect(page.getByRole("heading", { name: range, exact: true })).toBeVisible();
  });

  test("translates form validation and units while submitting stable identifiers", async ({ page, api }) => {
    await page.goto("/meals");
    await page.getByRole("button", { name: "+ Agregar comida", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Un nuevo favorito" });
    await dialog.getByRole("button", { name: "Guardar comida", exact: true }).click();
    await expect(dialog.getByRole("alert")).toHaveText("Agrega un nombre, una descripción y al menos un horario de comida.");
    await dialog.getByLabel("Nombre de la comida", { exact: true }).fill("My soup");
    await dialog.getByLabel("Descripción", { exact: true }).fill("Con verduras");
    await dialog.getByRole("button", { name: "Comida", exact: true }).click();
    await dialog.getByRole("button", { name: "Lunes", exact: true }).click();
    await dialog.getByRole("button", { name: "+ Agregar ingrediente", exact: true }).click();
    const name = dialog.getByRole("combobox", { name: "Nombre del ingrediente", exact: true });
    await name.fill("Tomato");
    await dialog.getByRole("option", { name: "Tomato", exact: true }).click();
    await dialog.getByLabel("Cantidad", { exact: true }).fill("2");
    await dialog.getByRole("combobox", { name: "Unidad", exact: true }).click();
    await dialog.getByRole("option", { name: "piezas", exact: true }).click();
    await dialog.getByRole("button", { name: "Guardar comida", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    expect(api.saves[0].body).toMatchObject({
      name: "My soup", description: "Con verduras", meal_type_ids: [2], preferred_days: ["monday"],
      ingredients: [{ ingredient_id: 2, quantity: "2", unit: "pieza", preparation_note: "" }],
    });
  });

  test("displays localized API field errors without losing the ingredient draft", async ({ page }) => {
    await page.route("http://127.0.0.1:4174/ingredients", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      expect(route.request().headers()["accept-language"]).toBe("es");
      await route.fulfill({ status: 422, headers: { "Access-Control-Allow-Origin": "*" }, json: { errors: { name: ["ya está en uso"] } } });
    });
    await page.goto("/ingredients");
    await expect(page.getByText("2 de 2 ingredientes", { exact: true })).toBeVisible();
    await expect(page.getByText("Se usa en 1 comida", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "+ Agregar ingrediente", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Agregar ingrediente" });
    await dialog.getByLabel("Nombre del ingrediente").fill("Tomato");
    await dialog.getByRole("button", { name: "Guardar ingrediente" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("nombre: ya está en uso");
    await expect(dialog.getByLabel("Nombre del ingrediente")).toHaveValue("Tomato");
  });
});

test("refetches saved notices for the selected language without mixing cached responses", async ({ page, api }) => {
  const english = "Pizza was scheduled on Monday to complete the menu; its preferred days are Friday, Saturday, Sunday.";
  const spanish = "Se programó Pizza el lunes para completar el menú; sus días preferidos son viernes, sábado, domingo.";
  api.localizedMenus.en = [{ ...structuredClone(api.menus[0]), generation_notices: [english] }];
  api.localizedMenus.es = [{ ...structuredClone(api.menus[0]), generation_notices: [spanish] }];
  await page.goto("/saved-menus");
  await expect(page.getByText(english)).toBeVisible();
  await chooseLanguage(page, "Español");
  await expect(page.getByText(spanish)).toBeVisible();
  await expect(page.getByText(english)).toHaveCount(0);
  await chooseLanguage(page, "English");
  await expect(page.getByText(english)).toBeVisible();
  await expect(page.getByText(spanish)).toHaveCount(0);
});

test("queued cross-tab language events apply the latest preference without echoing writes", async ({ page }) => {
  await page.goto("/meals");
  await expect(page.getByRole("heading", { name: "Your meal library" })).toBeVisible();
  const result = await page.evaluate(() => {
    const originalSetItem = Storage.prototype.setItem;
    const writes: string[] = [];
    const languages: string[] = [];
    // Another tab has already settled on English before these events arrive.
    originalSetItem.call(localStorage, "comal.locale", "en");
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "comal.locale") writes.push(value);
      originalSetItem.call(this, key, value);
    };
    const deliver = (value: string) => {
      window.dispatchEvent(new StorageEvent("storage", {
        key: "comal.locale", newValue: value, storageArea: localStorage,
      }));
      languages.push(document.documentElement.lang);
    };
    try {
      deliver("es");
      deliver("en");
      // A new remote choice still updates this tab, without another write.
      originalSetItem.call(localStorage, "comal.locale", "es");
      deliver("es");
      return { writes, languages, saved: localStorage.getItem("comal.locale") };
    } finally {
      Storage.prototype.setItem = originalSetItem;
    }
  });
  expect(result).toEqual({ writes: [], languages: ["en", "en", "es"], saved: "es" });
  await expect(page.getByRole("heading", { name: "Tu colección de comidas" })).toBeVisible();
});

for (const scenario of [
  {
    name: "new meal", path: "/meals", action: "+ Add meal", actionEs: "+ Agregar comida",
    title: "A new favorite", titleEs: "Un nuevo favorito", field: "Meal name", fieldEs: "Nombre de la comida",
    eyebrowEs: "Agrega a tu colección",
  },
  {
    name: "edit meal", path: "/meals", action: "Edit Huevos a la mexicana", actionEs: "Editar Huevos a la mexicana",
    title: "Edit meal", titleEs: "Editar comida", field: "Meal name", fieldEs: "Nombre de la comida",
    eyebrowEs: "Actualiza tu colección",
  },
  {
    name: "new ingredient", path: "/ingredients", action: "+ Add ingredient", actionEs: "+ Agregar ingrediente",
    title: "Add ingredient", titleEs: "Agregar ingrediente", field: "Ingredient name", fieldEs: "Nombre del ingrediente",
  },
  {
    name: "edit ingredient", path: "/ingredients", action: "Edit Egg", actionEs: "Editar Egg",
    title: "Edit ingredient", titleEs: "Editar ingrediente", field: "Ingredient name", fieldEs: "Nombre del ingrediente",
  },
]) {
  test(`updates the open ${scenario.name} dialog language while preserving its draft and focus`, async ({ page, api }) => {
    await page.goto(scenario.path);
    await page.getByRole("button", { name: scenario.action, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: scenario.title, exact: true });
    await dialog.getByLabel(scenario.field, { exact: true }).fill("Unsaved draft");
    await page.evaluate(() => {
      localStorage.setItem("comal.locale", "es");
      window.dispatchEvent(new StorageEvent("storage", {
        key: "comal.locale", newValue: "es", storageArea: localStorage,
      }));
    });
    const translatedDialog = page.getByRole("dialog", { name: scenario.titleEs, exact: true });
    await expect(translatedDialog).toBeVisible();
    await expect(translatedDialog.getByLabel(scenario.fieldEs, { exact: true })).toHaveValue("Unsaved draft");
    await expect(translatedDialog.getByLabel(scenario.fieldEs, { exact: true })).toBeFocused();
    if ("eyebrowEs" in scenario) {
      await expect(translatedDialog.getByText(scenario.eyebrowEs!, { exact: true })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: scenario.actionEs, exact: true })).toBeFocused();
    expect(api.saves).toEqual([]);
    expect(api.ingredientSaves).toEqual([]);
  });
}

test("Spanish plural categories missing from the catalog use the other form", async ({ page }) => {
  await page.goto("/ingredients");
  const result = await page.evaluate(async () => {
    const modulePath = "/src/i18n/index.ts";
    const { setLocale, t } = await import(modulePath);
    setLocale("es");
    return {
      message: t("ingredients.usage", { count: 1_000_000 }),
      formattedCount: new Intl.NumberFormat("es-MX").format(1_000_000),
    };
  });
  expect(result.message).toBe(`Se usa en ${result.formattedCount} comidas`);
});
