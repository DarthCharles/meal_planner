import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures/app";

async function openLibrary(page: Page) {
  await page.goto("/");
  await page.getByRole("heading", { name: "Wednesday" }).waitFor();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /My meals/ })
    .click();
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
  expect(api.saves).toEqual([]);
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
  await expect(page.getByRole("textbox", { name: "Description", exact: true })).toHaveValue(
    "Eggs with tomato, onion, and chile.",
  );
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
