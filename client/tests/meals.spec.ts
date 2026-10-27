import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures/app";

async function openLibrary(page: Page) {
  await page.goto("/");
  await page.getByRole("heading", { name: "Wednesday" }).waitFor();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /My meals/ })
    .click();
  await page.getByRole("article").first().waitFor();
}

async function addMeal(page: Page) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Add meal/ })
    .click();
  return page.getByRole("dialog", { name: "A new favorite" });
}

async function fillMeal(page: Page) {
  await page.getByLabel("Meal name", { exact: true }).fill("Tacos de papa");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Potato tacos with salsa.");
  await page.getByPlaceholder("https://...").fill("https://example.com/tacos");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "lunch", exact: true })
    .click();
}

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
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(
    dialog.getByText("Complete the quantity and unit for each ingredient."),
  ).toBeVisible();
  await page.getByLabel("Quantity").fill("2");
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(
    dialog.getByText("Complete the quantity and unit for each ingredient."),
  ).toBeVisible();
  await page.getByLabel("Unit", { exact: true }).selectOption("pieza");
  for (const quantity of ["0", "-1", "0.0001"]) {
    await page.getByLabel("Quantity").fill(quantity);
    await dialog
      .getByRole("button", { name: "Save meal", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Complete the quantity and unit for each ingredient.",
    );
    await expect(page.getByLabel("Quantity")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  }
  expect(api.saves).toEqual([]);
  await dialog
    .getByRole("button", { name: "Remove Potato", exact: true })
    .click();
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.ingredients).toEqual([]);
});

test("creates a meal with ingredients and updates the library", async ({
  page,
  api,
}) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  await fillMeal(page);
  await dialog.getByRole("button", { name: /Add ingredient/ }).click();
  await page.getByLabel("Ingredient name").fill("Potato");
  await page.getByLabel("Quantity").fill("2");
  await page.getByLabel("Unit", { exact: true }).selectOption("pieza");
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
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
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

test("prefills and updates a meal including removing an ingredient", async ({
  page,
  api,
}) => {
  await openLibrary(page);
  await page
    .getByRole("button", { name: "Edit Huevos a la mexicana", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Edit this favorite" });
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
  await expect(page.getByLabel("Unit", { exact: true })).toHaveValue("pieza");
  await expect(page.getByLabel("Preparation note")).toHaveValue("beaten");
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
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /My menu/ })
    .click();
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

test("closes without saving and resets the form when reopened", async ({
  page,
  api,
}) => {
  await openLibrary(page);
  const dialog = await addMeal(page);
  await fillMeal(page);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await addMeal(page);
  await expect(page.getByLabel("Meal name", { exact: true })).toHaveValue("");
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves).toEqual([]);
});

test("reuses cached meals when navigating between screens", async ({
  page,
  api,
}) => {
  await openLibrary(page);
  const initialReads = api.reads["/meals"];
  const nav = page.getByRole("navigation");
  await nav.getByRole("button", { name: /My menu/ }).click();
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  await nav.getByRole("button", { name: /My meals/ }).click();
  await expect(
    page.getByRole("heading", { name: "Huevos a la mexicana" }),
  ).toBeVisible();
  expect(api.reads["/meals"]).toBe(initialReads);
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

test("waits for form options before initializing an existing meal", async ({
  page,
  api,
}) => {
  let release!: () => void;
  const optionsBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  api.readBarriers["/meal_types"] = optionsBarrier;
  api.readBarriers["/units"] = optionsBarrier;
  await openLibrary(page);
  await page
    .getByRole("button", { name: "Edit Huevos a la mexicana", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Edit this favorite" });
  await expect(dialog.getByText("Loading meal options…")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Update meal", exact: true }),
  ).toHaveCount(0);
  release();
  await expect(page.getByLabel("Meal name", { exact: true })).toHaveValue(
    "Huevos a la mexicana",
  );
  await expect(page.getByLabel("Unit", { exact: true })).toHaveValue("pieza");
  await dialog
    .getByRole("button", { name: "Update meal", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.meal_type_ids).toEqual([1]);
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
    await page
      .getByLabel("Quantity", { exact: true })
      .nth(index)
      .fill(String(index + 1));
    await page
      .getByLabel("Unit", { exact: true })
      .nth(index)
      .selectOption("pieza");
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
    name: "breakfast",
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
  await dialog.getByRole("button", { name: "lunch", exact: true }).click();
  await dialog.getByRole("button", { name: "dinner", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Update meal", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(api.saves[0].body.meal_type_ids).toEqual([2, 3]);
});

test("submits a meal from the keyboard with registered design system inputs", async ({
  page,
  api,
}) => {
  await page.goto("/");
  const dialog = await addMeal(page);
  await fillMeal(page);
  expect(api.saves).toEqual([]);
  const name = page.getByLabel("Meal name", { exact: true });
  await name.focus();
  await expect(name).toBeFocused();
  await name.press("Enter");
  await expect(dialog).toHaveCount(0);
  expect(api.saves).toHaveLength(1);
  expect(api.saves[0].body).toMatchObject({
    name: "Tacos de papa",
    description: "Potato tacos with salsa.",
    meal_type_ids: [2],
  });
});

test("applies root theme overrides to the app shell and Greda form controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  await page.evaluate(() => {
    const theme = document.documentElement.style;
    theme.setProperty("--primary", "240 100% 50%");
    theme.setProperty("--background", "0 0% 0%");
  });
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(page.getByRole("button", { name: "Plan my week" })).toHaveCSS(
    "background-color",
    "rgb(0, 0, 255)",
  );
  const dialog = await addMeal(page);
  await expect(
    dialog.getByRole("button", { name: "Save meal", exact: true }),
  ).toHaveCSS(
    "background-color",
    "rgb(0, 0, 255)",
  );
  await expect(dialog.getByLabel("Meal name", { exact: true })).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
});
