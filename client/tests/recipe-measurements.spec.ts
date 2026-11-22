import type { Page } from "@playwright/test";

import { cancelEditor, editorScreen, expect, navigateTo, test } from "./fixtures/app";

async function chooseUnit(page: Page, label: string, index = 0) {
  await editorScreen(page).getByRole("combobox", { name: "Unit", exact: true }).nth(index).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}
async function addEgg(page: Page) {
  await editorScreen(page).getByRole("button", { name: "+ Add ingredient", exact: true }).click();
  const input = editorScreen(page)
    .getByRole("combobox", { name: "Ingredient name", exact: true })
    .last();
  await input.fill("Egg");
  await page.getByRole("option", { name: "Egg", exact: true }).click();
}

test("requires explicit servings and retains decimal quantities and repeated ingredient rows", async ({
  page,
  api,
}) => {
  await page.goto("/ingredients");
  await expect(page.getByRole("button", { name: "Used in 1 meal" })).toBeVisible();
  await navigateTo(page, "My meals");
  await page.getByRole("button", { name: "+ Add meal", exact: true }).click();
  const form = editorScreen(page);
  await form.getByLabel("Meal name", { exact: true }).fill("Decimal recipe");
  await form
    .getByLabel("Description", { exact: true })
    .fill("Repeated rows for separate preparations");
  await form.getByRole("button", { name: "Lunch", exact: true }).click();
  await form.getByRole("button", { name: "Save meal", exact: true }).click();
  const servings = form.getByRole("spinbutton", { name: "Recipe servings", exact: true });
  await expect(servings).toBeFocused();
  await expect(form.getByRole("alert")).toHaveText("Enter a positive whole number of servings.");
  await servings.fill("1.5");
  await form.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Enter a positive whole number of servings.");
  expect(api.saves).toEqual([]);
  await servings.fill("4");
  const quantities = ["0.5", "0.125", "1.5"];
  for (const [index, quantity] of quantities.entries()) {
    await addEgg(page);
    await form.getByRole("spinbutton", { name: "Quantity", exact: true }).nth(index).fill(quantity);
    await chooseUnit(page, "pieces", index);
    await form
      .getByLabel("Preparation note", { exact: true })
      .nth(index)
      .fill(`Preparation ${index}`);
  }
  await form.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(form).toHaveCount(0);
  expect(api.saves[0].body.servings).toBe("4");
  expect(api.saves[0].body.ingredients.map(({ quantity }) => quantity)).toEqual(quantities);
  await navigateTo(page, "My Ingredients");
  await expect(page.getByRole("button", { name: "Used in 2 meals", exact: true })).toBeVisible();
});

test("recipe container contents survive editing and a habitual package change", async ({
  page,
  api,
}) => {
  api.meals[0].servings = 2;
  api.meals[0].ingredients[0] = {
    ingredient_id: 1,
    name: "Egg",
    quantity: "1",
    unit: "can",
    package_quantity: "140",
    package_unit: "g",
  };
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "package",
    shopping_unit: "can",
    package_quantity: "100",
    package_unit: "g",
  };
  await page.goto("/meals/1/edit");
  await expect(
    editorScreen(page).getByRole("spinbutton", { name: "Recipe servings", exact: true }),
  ).toHaveValue("2");
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("140");
  expect(api.reads["/ingredients/1/shopping_profile"] ?? 0).toBe(0);
  await editorScreen(page).getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(editorScreen(page)).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0]).toMatchObject({
    package_quantity: "140",
    package_unit: "g",
  });
  api.ingredientProfiles[1].package_quantity = "850";
  await page.goto("/meals/1/edit");
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("140");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Fill from habitual presentation" }).click();
  // The confirmation is shown after the profile response; wait for the saved text.
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("850");
});

test("ingredient and container changes clear snapshots, errors, and late suggestions", async ({
  page,
  api,
}) => {
  api.meals[0].ingredients[0] = {
    ingredient_id: 1,
    name: "Egg",
    quantity: "1",
    unit: "can",
    package_quantity: "140",
    package_unit: "g",
  };
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "package",
    shopping_unit: "can",
    package_quantity: "850",
    package_unit: "g",
  };
  let release!: () => void;
  api.readBarriers["/ingredients/1/shopping_profile"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/meals/1/edit");
  await page.getByRole("button", { name: "Fill from habitual presentation" }).click();
  await expect(
    page.getByRole("button", { name: "Fill from habitual presentation" }),
  ).toBeDisabled();
  const ingredient = page.getByRole("combobox", { name: "Ingredient name" });
  await ingredient.fill("Tomato");
  await page.getByRole("option", { name: "Tomato", exact: true }).click();
  release();
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("");
  await chooseUnit(page, "jars");
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("");
  await chooseUnit(page, "g");
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveCount(0);
  await editorScreen(page).getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(editorScreen(page)).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0]).not.toHaveProperty("package_quantity");
  expect(api.saves[0].body.ingredients[0]).not.toHaveProperty("package_unit");
});

test(
  "returning to a container clears optional contents for an unsaved ingredient",
  { tag: "@responsive" },
  async ({ page }) => {
    await page.goto("/meals/1/edit");
    const ingredient = page.getByRole("combobox", { name: "Ingredient name" });
    await ingredient.fill("Tuna");
    await page.getByRole("option", { name: "Create ingredient “Tuna”", exact: true }).click();
    await chooseUnit(page, "cans");
    await page
      .getByRole("button", { name: "Add container contents (optional)", exact: true })
      .click();
    await page.getByLabel("Contents per container", { exact: true }).fill("140");
    await expect(page.getByRole("button", { name: "Fill from habitual presentation" })).toHaveCount(
      0,
    );
    await chooseUnit(page, "g");
    await chooseUnit(page, "cans");
    await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await cancelEditor(page);
  },
);

test("a late presentation response cannot populate a removed row or replace contents without confirmation", async ({
  page,
  api,
}) => {
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "package",
    shopping_unit: "can",
    package_quantity: "850",
    package_unit: "g",
  };
  api.meals[0].ingredients[0] = {
    ingredient_id: 1,
    name: "Egg",
    quantity: "1",
    unit: "can",
    package_quantity: "140",
    package_unit: "g",
  };
  await page.goto("/meals/1/edit");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Fill from habitual presentation" }).click();
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("140");
  let release!: () => void;
  api.readBarriers["/ingredients/1/shopping_profile"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Fill from habitual presentation" }).click();
  await expect(
    page.getByRole("button", { name: "Fill from habitual presentation" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Remove Egg", exact: true }).click();
  await addEgg(page);
  await chooseUnit(page, "cans");
  release();
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("");
  await editorScreen(page).getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(editorScreen(page)).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0]).not.toHaveProperty("package_quantity");
});

test("saves a recipe container without asking for its contents", async ({ page, api }) => {
  await page.goto("/meals/1/edit");
  await chooseUnit(page, "cans");
  await expect(page.getByLabel("Contents per container", { exact: true })).toBeHidden();
  await editorScreen(page).getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(editorScreen(page)).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0]).toMatchObject({ unit: "can" });
  expect(api.saves[0].body.ingredients[0]).not.toHaveProperty("package_quantity");
  expect(api.saves[0].body.ingredients[0]).not.toHaveProperty("package_unit");
});
