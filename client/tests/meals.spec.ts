import type { Page } from "@playwright/test";
import { test, expect, navigateTo } from "./fixtures/app";

async function openLibrary(page: Page) {
  await page.goto("/");
  await page.getByRole("heading", { name: "Wednesday" }).waitFor();
  await navigateTo(page, "My meals");
  await page.getByRole("article").first().waitFor();
}

async function addMeal(page: Page) {
  await page.getByRole("button", { name: "Open actions" }).click();
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  return page.getByRole("dialog", { name: "A new favorite" });
}

async function selectUnit(page: Page, code: string, index = 0) {
  await page.getByRole("combobox", { name: "Unit", exact: true }).nth(index).click();
  await page.getByRole("option", { name: code === "pieza" ? "pieces" : code, exact: true }).click();
}

async function fillMeal(page: Page) {
  await page.getByLabel("Meal name", { exact: true }).fill("Tacos de papa");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Potato tacos with salsa.");
  await page.getByPlaceholder("https://...").fill("https://example.com/tacos");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Lunch", exact: true })
    .click();
}

test("selecting meal times and preferred days keeps the form layout stable", { tag: "@responsive" }, async ({ page }) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  for (const [groupName, actions] of [
    ["Meal time", [["Lunch", true], ["Lunch", false]]],
    ["Preferred days", [["Monday", true], ["Monday", false], ["Friday", true], ["Friday", false]]],
  ] as const) {
    const group = dialog.getByRole("group", { name: groupName, exact: true });
    const buttons = group.getByRole("button");
    const toggles = buttons.and(group.locator("[aria-pressed]"));
    await expect(buttons.first()).toBeVisible();
    const geometry = () => buttons.evaluateAll((elements) => elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      const parent = element.closest("fieldset")!.getBoundingClientRect();
      return {
        x: bounds.x - parent.x,
        y: bounds.y - parent.y,
        width: bounds.width,
        height: bounds.height,
      };
    }));
    const before = await geometry();
    for (const [label, selected] of actions) {
      const button = group.getByRole("button", { name: label, exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", String(selected));
      expect(await geometry()).toEqual(before);
      // Action buttons may fade when disabled; selection toggles must not animate.
      expect(await toggles.evaluateAll((elements) => elements.flatMap((element) =>
        element.getAnimations().map((animation) => ({
          label: element.textContent?.trim(),
          frames: (animation.effect as KeyframeEffect).getKeyframes(),
        })),
      ))).toEqual([]);
    }
  }
});

test("combines case-insensitive search and meal time filters", async ({
  page,
}) => {
  await openLibrary(page);
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.getByRole("button", { name: "Dinner", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByPlaceholder("Search meals").fill("AVENA");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Avena cocida" }),
  ).toBeVisible();
  await page.getByPlaceholder("Search meals").fill("huevos");
  await expect(
    page.getByRole("heading", { name: "No meals found." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "All meals", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Huevos a la mexicana" }),
  ).toBeVisible();
});

test("validates required fields and ingredient quantity/unit before saving", async ({
  page,
  api,
}) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(
    dialog.getByText("Add a name, description, and at least one meal time."),
  ).toBeVisible();
  await fillMeal(page);
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  await page.getByLabel("Ingredient name").fill("Potato");
  await page.getByRole("option", { name: "Create ingredient “Potato”", exact: true }).click();
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(
    dialog.getByText("Complete the quantity and unit for each ingredient."),
  ).toBeVisible();
  await page.getByLabel("Quantity").fill("2");
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(
    dialog.getByText("Complete the quantity and unit for each ingredient."),
  ).toBeVisible();
  await selectUnit(page, "pieza");
  await page.getByLabel("Quantity").fill("0.0001");
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Complete the quantity and unit for each ingredient.",
  );
  await expect(page.getByLabel("Quantity")).toHaveAttribute("aria-invalid", "true");
  expect(api.saves).toEqual([]);
  await dialog
    .getByRole("button", { name: "Remove Potato", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.ingredients).toEqual([]);
});

test("creates a meal with ingredients from the keyboard and updates the library", { tag: "@responsive" }, async ({
  page,
  api,
}) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  await fillMeal(page);
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  await page.getByLabel("Ingredient name").fill("Potato");
  await page.getByRole("option", { name: "Create ingredient “Potato”", exact: true }).click();
  await page.getByLabel("Quantity").fill("2");
  await selectUnit(page, "pieza");
  await page.getByLabel("Preparation note").fill("diced");
  for (const label of [
    "Ingredient name",
    "Quantity",
    "Unit",
    "Preparation note",
  ]) {
    const field = page.getByLabel(label, { exact: true });
    await expect(field).toBeVisible();
    const bounds = await field.boundingBox();
    expect(
      bounds!.width,
      `${label} should have room for its value`,
    ).toBeGreaterThanOrEqual(60);
  }
  // Empty ingredient rows are intentionally excluded from the submitted recipe.
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  let release!: () => void;
  api.saveBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await dialog.getByLabel("Meal name", { exact: true }).press("Enter");
  await expect(
    dialog.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  release();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Tacos de papa" }),
  ).toBeVisible();
  expect(api.saves).toEqual([
    {
      method: "POST",
      path: "/meals",
      body: {
        name: "Tacos de papa",
        description: "Potato tacos with salsa.",
        recipe_url: "https://example.com/tacos",
        meal_type_ids: [2],
        preferred_days: [],
        ingredients: [
          {
            name: "Potato",
            quantity: "2",
            unit: "pieza",
            preparation_note: "diced",
          },
        ],
      },
    },
  ]);
});

test("searches and selects an existing ingredient with the keyboard", { tag: "@responsive" }, async ({ page, api }) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  await fillMeal(page);
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  const ingredient = dialog.getByRole("combobox", { name: "Ingredient name" });
  await ingredient.fill("eGG");
  await expect(dialog.getByRole("option", { name: "Egg", exact: true })).toBeVisible();
  const suggestions = await dialog.getByRole("listbox", { name: "Ingredients" }).boundingBox();
  expect(suggestions!.x).toBeGreaterThanOrEqual(0);
  expect(suggestions!.x + suggestions!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect(dialog.getByRole("option", { name: /Create ingredient/ })).toHaveCount(0);
  await ingredient.press("ArrowDown");
  await ingredient.press("Enter");
  await expect(ingredient).toHaveValue("Egg");
  expect(api.saves).toEqual([]);
  await dialog.getByLabel("Quantity").fill("2");
  await selectUnit(page, "pieza");
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.ingredients).toEqual([
    { ingredient_id: 1, quantity: "2", unit: "pieza", preparation_note: "" },
  ]);
});

test("selects units with the keyboard and dismisses the unit list without closing the meal", { tag: "@responsive" }, async ({ page, api }) => {
  await openLibrary(page);
  await page.getByRole("button", { name: "Edit Huevos a la mexicana", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const unit = dialog.getByRole("combobox", { name: "Unit", exact: true });
  await expect(unit).toHaveText("pieces");
  await unit.focus();
  await unit.press("ArrowDown");
  await expect(dialog.getByRole("listbox")).toBeVisible();
  await expect(dialog.getByRole("option", { name: "pieces", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(dialog.getByRole("option", { name: "g", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(unit).toHaveText("g");
  await expect(unit).toBeFocused();
  expect(api.saves).toEqual([]);
  await unit.press("ArrowDown");
  await expect(dialog.getByRole("listbox")).toBeVisible();
  const popup = await dialog.getByRole("listbox").boundingBox();
  expect(popup!.x).toBeGreaterThanOrEqual(0);
  expect(popup!.x + popup!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("listbox")).toHaveCount(0);
  await expect(unit).toBeFocused();
  await expect(unit).toHaveText("g");
  await dialog.getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0].unit).toBe("g");
});

test("requires explicit selection when replacing an ingredient and closes suggestions before the dialog", async ({ page, api }) => {
  await openLibrary(page);
  await page.getByRole("button", { name: "Edit Huevos a la mexicana", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const ingredient = dialog.getByRole("combobox", { name: "Ingredient name" });
  await ingredient.fill("Tom");
  await expect(dialog.getByRole("option", { name: "Tomato", exact: true })).toBeVisible();
  await ingredient.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(ingredient).toBeFocused();
  await expect(dialog.getByRole("listbox")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Choose an ingredient or select Create for each typed name.");
  expect(api.saves).toEqual([]);
  await ingredient.fill("Tom");
  await dialog.getByRole("option", { name: "Tomato", exact: true }).click();
  await dialog.getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0]).toMatchObject({ ingredient_id: 2 });
});

test("keeps created ingredients as drafts until save and reuses the saved catalog", async ({ page, api }) => {
  await openLibrary(page);
  let dialog = await addMeal(page);
  await fillMeal(page);
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  await dialog.getByRole("combobox", { name: "Ingredient name" }).fill("Potato");
  await dialog.getByRole("option", { name: "Create ingredient “Potato”", exact: true }).click();
  // StrictMode may abort and restart the initial request; reopening must reuse it.
  const initialReads = api.reads["/ingredients"];
  expect(api.ingredients.some((item) => item.name === "Potato")).toBe(false);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(api.saves).toEqual([]);
  dialog = await addMeal(page);
  await expect(dialog.getByLabel("Meal name", { exact: true })).toHaveValue("");
  await expect(dialog.getByRole("combobox", { name: "Ingredient name" })).toHaveCount(0);
  await fillMeal(page);
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  await dialog.getByRole("combobox", { name: "Ingredient name" }).fill("Potato");
  await dialog.getByRole("option", { name: "Create ingredient “Potato”", exact: true }).click();
  await dialog.getByLabel("Quantity").fill("1");
  await selectUnit(page, "pieza");
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  dialog = await addMeal(page);
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  await dialog.getByRole("combobox", { name: "Ingredient name" }).fill("potato");
  await expect(dialog.getByRole("option", { name: "Potato", exact: true })).toBeVisible();
  await expect(dialog.getByRole("option", { name: /Create ingredient/ })).toHaveCount(0);
  expect(api.reads["/ingredients"]).toBe(initialReads);
});

test("shows ingredient catalog loading and supports retry after failure", async ({ page, api }) => {
  let release!: () => void;
  api.readBarriers["/ingredients"] = new Promise<void>((resolve) => { release = resolve; });
  api.readErrors["/ingredients"] = "Ingredients unavailable";
  await openLibrary(page);
  const dialog = await addMeal(page);
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  const ingredient = dialog.getByRole("combobox", { name: "Ingredient name" });
  await ingredient.fill("Egg");
  await expect(dialog.getByText("Loading options…")).toBeVisible();
  release();
  await expect(dialog.getByRole("button", { name: "Retry ingredients" })).toBeVisible();
  delete api.readErrors["/ingredients"];
  await dialog.getByRole("button", { name: "Retry ingredients" }).click();
  await ingredient.click();
  await ingredient.fill("Egg");
  await expect(dialog.getByRole("option", { name: "Egg", exact: true })).toBeVisible();
});

test("waits for edit options, prefills the meal, and saves ingredient removal", async ({
  page,
  api,
}) => {
  let release!: () => void;
  const optionsBarrier = new Promise<void>((resolve) => { release = resolve; });
  api.readBarriers["/meal_types"] = optionsBarrier;
  api.readBarriers["/units"] = optionsBarrier;
  await openLibrary(page);
  await page
    .getByRole("button", { name: "Edit Huevos a la mexicana", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Edit meal", exact: true });
  await expect(dialog.getByText("Loading meal options…")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Update meal", exact: true })).toHaveCount(0);
  release();
  await expect(page.getByLabel("Meal name", { exact: true })).toHaveValue(
    "Huevos a la mexicana",
  );
  await expect(
    page.getByRole("textbox", { name: "Description", exact: true }),
  ).toHaveValue("Eggs with tomato, onion, and chile.");
  await expect(page.getByPlaceholder("https://...")).toHaveValue(
    "https://example.com/huevos",
  );
  await expect(page.getByLabel("Ingredient name")).toHaveValue("Egg");
  await expect(page.getByLabel("Quantity")).toHaveValue("2");
  await expect(page.getByRole("combobox", { name: "Unit", exact: true })).toHaveText("pieces");
  await expect(page.getByLabel("Preparation note")).toHaveValue("beaten");
  for (let index = 0; index < 2; index++) {
    await dialog.getByRole("button", { name: "+ Add ingredient", exact: true }).click();
    await expect(dialog.getByRole("combobox", { name: "Ingredient name", exact: true }).last()).toBeFocused();
  }
  for (let index = 0; index < 2; index++) {
    await dialog.getByRole("button", { name: "Remove ingredient", exact: true }).first().click();
  }
  await page.getByLabel("Meal name", { exact: true }).fill("Huevos con salsa");
  await dialog.getByRole("button", { name: "Remove Egg", exact: true }).click();
  await expect(
    dialog.getByText("Add what you need to cook this meal."),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Update meal", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Edit Huevos con salsa", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Edit Huevos a la mexicana",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(api.saves).toHaveLength(1);
  expect(api.saves[0]).toMatchObject({
    method: "PUT",
    path: "/meals/1",
    body: { name: "Huevos con salsa", meal_type_ids: [1], ingredients: [] },
  });
  await navigateTo(page, "My menu");
  await expect(
    page
      .getByRole("article")
      .first()
      .getByText("Huevos con salsa", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Huevos a la mexicana", { exact: true }),
  ).toHaveCount(0);
});

test("preserves form values after a save error and supports retrying", async ({
  page,
  api,
}) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  await fillMeal(page);
  api.saveError = "This meal could not be saved.";
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog.getByText(api.saveError, { exact: true })).toBeVisible();
  await expect(page.getByLabel("Meal name", { exact: true })).toHaveValue(
    "Tacos de papa",
  );
  await expect(
    dialog.getByRole("button", { name: "Save meal", exact: true }),
  ).toBeEnabled();
  api.saveError = null;
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Tacos de papa" }),
  ).toBeVisible();
  expect(api.saves).toHaveLength(2);
});

test("retains cached meals when a background refresh fails", async ({
  page,
  api,
}) => {
  api.meals[0].name = "Breakfast from the API";
  await openLibrary(page);
  await expect(
    page.getByRole("heading", { name: "Breakfast from the API" }),
  ).toBeVisible();
  api.readErrors["/meals"] = "Could not refresh meals.";
  await page.clock.setFixedTime(new Date("2026-10-21T12:01:00Z"));
  await page.evaluate(() =>
    window.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page.getByText("Could not refresh meals.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Breakfast from the API" }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo mode · connect the Rails API to use your own meals."),
  ).toHaveCount(0);
});

test("preserves ingredient values after removing a middle row", async ({
  page,
  api,
}) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  await fillMeal(page);
  for (const [index, name] of ["Potato", "Onion", "Garlic"].entries()) {
    await dialog.getByRole("button", { name: /Add ingredient/ }).click();
    await page
      .getByLabel("Ingredient name", { exact: true })
      .nth(index)
      .fill(name);
    await page.getByRole("option", { name: `Create ingredient “${name}”`, exact: true }).click();
    await page
      .getByLabel("Quantity", { exact: true })
      .nth(index)
      .fill(String(index + 1));
    await selectUnit(page, "pieza", index);
    await page
      .getByLabel("Preparation note", { exact: true })
      .nth(index)
      .fill(`${name} note`);
  }
  await dialog
    .getByRole("button", { name: "Remove Onion", exact: true })
    .click();
  await expect(page.getByLabel("Ingredient name", { exact: true })).toHaveCount(
    2,
  );
  await expect(
    page.getByLabel("Ingredient name", { exact: true }).nth(1),
  ).toHaveValue("Garlic");
  await expect(page.getByLabel("Quantity", { exact: true }).nth(1)).toHaveValue(
    "3",
  );
  await expect(
    page.getByLabel("Preparation note", { exact: true }).nth(1),
  ).toHaveValue("Garlic note");
  await page.getByLabel("Quantity", { exact: true }).nth(1).fill("4");
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.ingredients).toEqual([
    {
      name: "Potato",
      quantity: "1",
      unit: "pieza",
      preparation_note: "Potato note",
    },
    {
      name: "Garlic",
      quantity: "4",
      unit: "pieza",
      preparation_note: "Garlic note",
    },
  ]);
});

test("validates deselecting all meal times and submits numeric type IDs", async ({
  page,
  api,
}) => {
  await openLibrary(page);
  await page
    .getByRole("button", { name: "Edit Huevos a la mexicana", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const breakfast = dialog.getByRole("button", {
    name: "Breakfast",
    exact: true,
  });
  await expect(breakfast).toHaveAttribute("aria-pressed", "true");
  await breakfast.click();
  await expect(breakfast).toHaveAttribute("aria-pressed", "false");
  await dialog
    .getByRole("button", { name: "Update meal", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Add a name, description, and at least one meal time.",
  );
  expect(api.saves).toEqual([]);
  await dialog.getByRole("button", { name: "Lunch", exact: true }).click();
  await dialog.getByRole("button", { name: "Dinner", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Update meal", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.meal_type_ids).toEqual([2, 3]);
});

test("creates weekend preferences including Friday", async ({ page, api }) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  await fillMeal(page);
  const days = dialog.getByRole("group", { name: "Preferred days" });
  for (const day of ["Friday", "Saturday", "Sunday"]) {
    await days.getByRole("button", { name: day, exact: true }).click();
    await expect(days.getByRole("button", { name: day, exact: true })).toHaveAttribute("aria-pressed", "true");
  }
  await expect(days.getByRole("button", { name: "Monday", exact: true })).toHaveAttribute("aria-pressed", "false");
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.preferred_days).toEqual(["friday", "saturday", "sunday"]);
});

test("prefills custom preferences, updates nested menu details, and clears to Any day", async ({ page, api }) => {
  api.meals[0].preferred_days = ["monday", "thursday"];
  await openLibrary(page);
  const edit = page.getByRole("button", { name: "Edit Huevos a la mexicana", exact: true });
  await edit.click();
  const dialog = page.getByRole("dialog");
  const days = dialog.getByRole("group", { name: "Preferred days" });
  await expect(days.getByRole("button", { name: "Monday", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(days.getByRole("button", { name: "Thursday", exact: true })).toHaveAttribute("aria-pressed", "true");
  await days.getByRole("button", { name: "Monday", exact: true }).click();
  await days.getByRole("button", { name: "Tuesday", exact: true }).click();
  await dialog.getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.preferred_days).toEqual(["thursday", "tuesday"]);
  await navigateTo(page, "My menu");
  await page.getByRole("button", { name: "View Breakfast: Huevos a la mexicana", exact: true }).first().click();
  await expect(dialog.getByText("Preferred days: Tuesday, Thursday", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await navigateTo(page, "My meals");
  await edit.click();
  await days.getByRole("button", { name: "Select all", exact: true }).click();
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
    await expect(days.getByRole("button", { name: day, exact: true })).toHaveAttribute("aria-pressed", "true");
  }
  await expect(days.getByRole("button", { name: "Select all", exact: true })).toBeDisabled();
  await days.getByRole("button", { name: "Clear all", exact: true }).click();
  await expect(days.getByRole("button", { name: "Clear all", exact: true })).toBeDisabled();
  await expect(days.getByRole("button", { name: "Select all", exact: true })).toBeEnabled();
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
    await expect(days.getByRole("button", { name: day, exact: true })).toHaveAttribute("aria-pressed", "false");
  }
  await dialog.getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[1].body.preferred_days).toEqual([]);
});

test("shows the meal library skeleton until meals load and respects reduced motion", { tag: "@responsive" }, async ({ page, api }) => {
  let release!: () => void;
  api.readBarriers["/meals"] = new Promise<void>((resolve) => { release = resolve; });
  await page.goto("/");
  await page.getByRole("heading", { name: "Wednesday" }).waitFor();
  await navigateTo(page, "My meals");
  const loading = page.getByRole("status", { name: "Loading meals", exact: true });
  try {
    await expect(loading).toBeVisible();
    await expect(loading).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("article")).toHaveCount(0);
    await expect(page.getByText("No meals found.", { exact: true })).toHaveCount(0);
    expect(await loading.evaluate((element) =>
      element.getAnimations({ subtree: true }).length,
    )).toBeGreaterThan(0);
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= innerWidth,
    )).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => loading.evaluate((element) =>
      element.getAnimations({ subtree: true }).length,
    )).toBe(0);
  } finally {
    release();
  }
  await expect(loading).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(api.meals.length);
  await expect(page.getByRole("button", { name: "Edit Huevos a la mexicana", exact: true })).toBeEnabled();
});
