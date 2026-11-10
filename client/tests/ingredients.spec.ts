import { test, expect, navigateTo } from "./fixtures/app";

test("opens the ingredient catalog from navigation without fetching meals", { tag: "@responsive" }, async ({ page, api }) => {
  api.ingredients = [{ id: 2, name: "Tomato" }, { id: 1, name: "Egg" }];
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
  expect(api.reads["/ingredients"] ?? 0).toBe(0);
  await navigateTo(page, "My Ingredients");
  await expect(page).toHaveURL("/ingredients");
  await expect(page.getByRole("heading", { name: "My Ingredients" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Ingredient catalog" }).getByRole("listitem")).toContainText(["Egg", "Tomato"]);
  expect(api.reads["/meals"] ?? 0).toBe(0);
  expect(api.reads["/units"] ?? 0).toBe(0);
  expect(api.reads["/meal_types"] ?? 0).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (page.viewportSize()!.width < 760) {
    const link = page.getByRole("navigation").getByRole("link", { name: "My Ingredients" });
    await expect(link).toHaveAttribute("aria-current", "page");
    const box = await link.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});

test("filters ingredients locally and clears an unmatched search", async ({ page, api }) => {
  await page.goto("/ingredients");
  const search = page.getByRole("searchbox", { name: "Search ingredients" });
  await expect(page.getByText("2 of 2 ingredients")).toBeVisible();
  const initialCatalogReads = api.reads["/ingredients"];
  await search.fill(" eGG ");
  await expect(page.getByRole("listitem")).toContainText(["Egg"]);
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByText("1 of 2 ingredients")).toBeVisible();
  await search.fill("Potato");
  await expect(page.getByRole("heading", { name: "No ingredients found" })).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("listitem")).toHaveCount(2);
  expect(api.reads["/ingredients"]).toBe(initialCatalogReads);
});

test("shows a genuine empty catalog", async ({ page, api }) => {
  api.ingredients = [];
  await page.goto("/ingredients");
  await expect(page.getByRole("heading", { name: "No ingredients yet" })).toBeVisible();
  await expect(page.getByText("Add your first ingredient here or while creating a meal.")).toBeVisible();
});

test("shows loading and retries a failed catalog request", async ({ page, api }) => {
  let release!: () => void;
  api.readBarriers["/ingredients"] = new Promise<void>((resolve) => { release = resolve; });
  api.readErrors["/ingredients"] = "Catalog unavailable";
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ingredients");
  const loading = page.getByRole("status", { name: "Loading ingredients", exact: true });
  await expect(loading).toBeVisible();
  await expect(loading).toHaveAttribute("aria-busy", "true");
  await expect(loading.getByRole("button")).toHaveCount(0);
  expect(await loading.evaluate((element) => [...element.querySelectorAll("*")]
    .every((child) => getComputedStyle(child).animationName === "none"))).toBe(true);
  release();
  await expect(page.getByText(/Could not load ingredients/)).toBeVisible();
  await expect(loading).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No ingredients yet" })).toHaveCount(0);
  delete api.readErrors["/ingredients"];
  await page.getByRole("button", { name: "Retry ingredients" }).click();
  await expect(page.getByRole("listitem")).toContainText(["Egg", "Tomato"]);
});

test("creates an ingredient with validation and makes it available in a meal form", async ({ page, api }) => {
  await page.goto("/ingredients");
  const add = page.getByRole("button", { name: "+ Add ingredient", exact: true });
  await add.click();
  const dialog = page.getByRole("dialog", { name: "Add ingredient", exact: true });
  await expect(dialog.getByRole("button", { name: "Delete ingredient", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Save ingredient" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Enter an ingredient name.");
  expect(api.ingredientSaves).toHaveLength(0);
  await dialog.getByRole("textbox", { name: "Ingredient name" }).fill("  Potato  ");
  await dialog.getByRole("button", { name: "Save ingredient" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(add).toBeFocused();
  await expect(page.getByRole("listitem")).toContainText(["Egg", "Potato", "Tomato"]);
  expect(api.ingredientSaves).toEqual([{ method: "POST", path: "/ingredients", body: { name: "Potato" } }]);
  await navigateTo(page, "My meals");
  await page.getByRole("button", { name: "+ Add meal", exact: true }).click();
  const mealDialog = page.getByRole("dialog");
  await mealDialog.getByRole("button", { name: "+ Add ingredient", exact: true }).click();
  await mealDialog.getByRole("combobox", { name: "Ingredient name" }).fill("Potato");
  await expect(mealDialog.getByRole("option", { name: "Potato", exact: true })).toBeVisible();
});

test("renames ingredients in cached meals and menus", async ({ page, api }) => {
  await page.goto("/meals");
  await expect(page.getByPlaceholder("Search meals")).toBeVisible();
  await navigateTo(page, "My Ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit ingredient", exact: true });
  await expect(dialog.getByRole("textbox", { name: "Ingredient name" })).toHaveValue("Egg");
  await dialog.getByRole("textbox", { name: "Ingredient name" }).fill("Free range egg");
  await dialog.getByRole("button", { name: "Save ingredient" }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.ingredientSaves).toEqual([{ method: "PUT", path: "/ingredients/1", body: { name: "Free range egg" } }]);
  const mealReads = api.reads["/meals"];
  await navigateTo(page, "My meals");
  await page.getByRole("button", { name: "Edit Huevos a la mexicana", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Ingredient name" })).toHaveValue("Free range egg");
  await page.keyboard.press("Escape");
  expect(api.reads["/meals"]).toBe(mealReads);
  await navigateTo(page, "My menu");
  await page.getByRole("button", { name: /Huevos a la mexicana/ }).first().click();
  await expect(page.getByRole("dialog").getByText(/Free range egg/)).toBeVisible();
});

test("preserves failed edits, prevents duplicate saves, and cancels without saving", async ({ page, api }) => {
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit ingredient", exact: true });
  const name = dialog.getByRole("textbox", { name: "Ingredient name" });
  await name.fill("Tomato");
  api.ingredientSaveError = "name: has already been taken";
  let release!: () => void;
  api.ingredientSaveBarrier = new Promise<void>((resolve) => { release = resolve; });
  await dialog.getByRole("button", { name: "Save ingredient" }).click();
  await expect(dialog.getByRole("button", { name: "Saving…" })).toBeDisabled();
  release();
  await expect(dialog.getByRole("alert")).toHaveText("name: has already been taken");
  await expect(name).toHaveValue("Tomato");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: "Edit Egg", exact: true })).toBeVisible();
  expect(api.ingredientSaves).toHaveLength(1);
  await page.getByRole("button", { name: "+ Add ingredient", exact: true }).click();
  await page.getByRole("textbox", { name: "Ingredient name" }).fill("Unsaved onion");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(api.ingredientSaves).toHaveLength(1);
  await expect(page.getByText("Unsaved onion", { exact: true })).toHaveCount(0);
});

test("shows usage counts on cards and opens linked meals from the ingredient modal", { tag: "@responsive" }, async ({ page, api }) => {
  await page.goto("/ingredients");
  const egg = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: "Edit Egg", exact: true }) });
  await expect(egg.getByText("Used in 1 meal", { exact: true })).toBeVisible();
  await expect(egg.getByText("Huevos a la mexicana", { exact: true })).toHaveCount(0);
  const tomato = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: "Edit Tomato", exact: true }) });
  await expect(tomato.getByText("Not used in any meals yet")).toBeVisible();
  expect(api.reads["/meals"] ?? 0).toBe(0);
  await egg.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const ingredientDialog = page.getByRole("dialog", { name: "Edit ingredient", exact: true });
  await expect(ingredientDialog.getByRole("button", { name: "Delete ingredient", exact: true })).toHaveCount(0);
  const usage = ingredientDialog.getByRole("region", { name: "Meals using this ingredient" });
  await expect(usage.getByRole("heading", { name: "Used in 1 meal" })).toBeVisible();
  await usage.getByRole("button", { name: "Huevos a la mexicana", exact: true }).click();
  const mealDialog = page.getByRole("dialog", { name: "Huevos a la mexicana", exact: true });
  await expect(mealDialog.getByText("Eggs with tomato, onion, and chile.")).toBeVisible();
  const initialMealReads = api.reads["/meals/1"];
  expect(initialMealReads).toBeGreaterThan(0);
  expect(api.reads["/meals"] ?? 0).toBe(0);
  await page.keyboard.press("Escape");
  await expect(egg.getByRole("button", { name: "Edit Egg", exact: true })).toBeFocused();
  await egg.getByRole("button", { name: "Edit Egg", exact: true }).click();
  await page.getByRole("dialog", { name: "Edit ingredient", exact: true })
    .getByRole("button", { name: "Huevos a la mexicana", exact: true }).click();
  await expect(mealDialog.getByText("Eggs with tomato, onion, and chile.")).toBeVisible();
  expect(api.reads["/meals/1"]).toBe(initialMealReads);
});

test("retries a failed meal opened from ingredient usage", async ({ page, api }) => {
  api.readErrors["/meals/1"] = "Meal unavailable";
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Huevos a la mexicana", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Huevos a la mexicana", exact: true });
  await expect(dialog.getByText(/Could not load meal/)).toBeVisible();
  delete api.readErrors["/meals/1"];
  await dialog.getByRole("button", { name: "Retry meal" }).click();
  await expect(dialog.getByText("Eggs with tomato, onion, and chile.")).toBeVisible();
});

test("updates cached ingredient usage after changing a meal's ingredients", async ({ page, api }) => {
  await page.goto("/ingredients");
  await expect(page.getByRole("button", { name: "Edit Egg", exact: true })).toBeVisible();
  const initialCatalogReads = api.reads["/ingredients"];
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Huevos a la mexicana", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Edit meal", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Edit meal", exact: true });
  const ingredient = form.getByRole("combobox", { name: "Ingredient name" });
  await ingredient.fill("Tomato");
  await form.getByRole("option", { name: "Tomato", exact: true }).click();
  await form.getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(form).toHaveCount(0);
  const egg = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: "Edit Egg", exact: true }) });
  await expect(egg.getByText("Not used in any meals yet")).toBeVisible();
  await page.getByRole("button", { name: "Edit Tomato", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("region", { name: "Meals using this ingredient" })
    .getByRole("button", { name: "Huevos a la mexicana", exact: true })).toBeVisible();
  expect(api.reads["/ingredients"]).toBe(initialCatalogReads);
});

test("deletes an unused ingredient from its dialog and updates the shared catalog", async ({ page, api }) => {
  await page.goto("/ingredients");
  await expect(page.getByRole("button", { name: /Delete/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit Tomato", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit ingredient", exact: true });
  let release!: () => void;
  api.ingredientDeleteBarrier = new Promise<void>((resolve) => { release = resolve; });
  await dialog.getByRole("button", { name: "Delete ingredient", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Deleting…", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Save ingredient", exact: true })).toBeDisabled();
  release();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit Tomato", exact: true })).toHaveCount(0);
  await expect(page.getByText("1 of 1 ingredients")).toBeVisible();
  expect(api.ingredientDeletes).toEqual([2]);
  await navigateTo(page, "My meals");
  await page.getByRole("button", { name: "+ Add meal", exact: true }).click();
  const mealDialog = page.getByRole("dialog");
  await mealDialog.getByRole("button", { name: "+ Add ingredient", exact: true }).click();
  await mealDialog.getByRole("combobox", { name: "Ingredient name" }).fill("Tomato");
  await expect(mealDialog.getByRole("option", { name: "Tomato", exact: true })).toHaveCount(0);
  await expect(mealDialog.getByRole("option", { name: "Create ingredient “Tomato”", exact: true })).toBeVisible();
});

test("keeps the ingredient and draft after a failed deletion and allows retry", async ({ page, api }) => {
  api.ingredients = [{ id: 2, name: "Tomato" }];
  api.ingredientDeleteError = "Cannot delete an ingredient used by meals. Remove it from those meals first.";
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Tomato", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit ingredient", exact: true });
  await dialog.getByRole("textbox", { name: "Ingredient name" }).fill("Draft tomato");
  await dialog.getByRole("button", { name: "Delete ingredient", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText(api.ingredientDeleteError);
  await expect(dialog.getByRole("textbox", { name: "Ingredient name" })).toHaveValue("Draft tomato");
  expect(api.ingredients).toEqual([{ id: 2, name: "Tomato" }]);
  api.ingredientDeleteError = null;
  await dialog.getByRole("button", { name: "Delete ingredient", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No ingredients yet" })).toBeVisible();
  expect(api.ingredientDeletes).toEqual([2, 2]);
});
