import type { Page } from "@playwright/test";

import {
  cancelEditor,
  editorScreen,
  expect,
  navigateTo,
  openEditorFromIndex,
  test,
} from "./fixtures/app";

async function chooseUnit(page: Page, label: string) {
  await editorScreen(page).getByRole("combobox", { name: "Unit", exact: true }).click();
  await page.getByRole("option", { name: label, exact: true }).click();
}
async function selectEgg(page: Page) {
  const input = editorScreen(page).getByRole("combobox", { name: "Ingredient name", exact: true });
  await input.fill("Egg");
  await page.getByRole("option", { name: "Egg", exact: true }).click();
}

async function editEgg(page: Page) {
  await editorScreen(page).getByRole("button", { name: "Edit Egg", exact: true }).click();
}

async function toggleIngredientDetails(page: Page) {
  await editorScreen(page).getByRole("button", { name: "Ingredient details", exact: true }).click();
}

test("requires explicit servings and retains fractional and decimal quantities in repeated ingredient rows", async ({
  page,
  api,
}) => {
  await page.goto("/ingredients");
  const egg = page.getByRole("button", { name: "Egg", exact: true });
  await expect(egg).toHaveAccessibleDescription("Used in 1 meal");
  await navigateTo(page, "My meals");
  await page.getByRole("button", { name: "+ Add meal", exact: true }).click();
  const form = editorScreen(page);
  await form.getByLabel("Meal name", { exact: true }).fill("Decimal recipe");
  await form
    .getByLabel("Instructions", { exact: true })
    .fill("Repeated rows for separate preparations");
  await form.getByRole("button", { name: "Lunch", exact: true }).click();
  await form.getByRole("button", { name: "Save meal", exact: true }).click();
  const servings = form.getByRole("spinbutton", { name: "Servings", exact: true });
  await expect(servings).toBeFocused();
  await expect(form.getByRole("alert")).toHaveText("Enter a positive whole number of servings.");
  await servings.fill("1.5");
  await form.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Enter a positive whole number of servings.");
  expect(api.saves).toEqual([]);
  await servings.fill("4");
  const quantities = ["1/2", "⅛", "1.5"];
  await form.getByRole("button", { name: "Add ingredient", exact: true }).click();
  for (const [index, quantity] of quantities.entries()) {
    await selectEgg(page);
    await form.getByRole("textbox", { name: "Quantity", exact: true }).fill(quantity);
    await chooseUnit(page, "pieces");
    await form.getByRole("button", { name: "Ingredient details", exact: true }).click();
    await form
      .getByRole("textbox", { name: "Preparation note", exact: true })
      .fill(`Preparation ${index}`);
    if (index < 2) {
      await form.getByRole("button", { name: "Add and continue", exact: true }).click();
    }
  }
  await form.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(form).toHaveCount(0);
  expect(api.saves[0].body.servings).toBe("4");
  expect(api.saves[0].body.ingredients.map(({ quantity }) => quantity)).toEqual(quantities);
  await openEditorFromIndex(page, "Decimal recipe", "Edit meal");
  const eggRows = editorScreen(page).getByRole("button", { name: "Edit Egg", exact: true });
  await expect(eggRows).toHaveCount(3);
  await expect(eggRows.nth(1)).toContainText("⅛");
  await eggRows.nth(1).click();
  await expect(
    editorScreen(page).getByRole("textbox", { name: "Quantity", exact: true }),
  ).toHaveValue("⅛");
  await cancelEditor(page);
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await navigateTo(page, "My Ingredients");
  await expect(egg).toHaveAccessibleDescription("Used in 2 meals");
});

test("saving a new recipe ingredient stores its package contents as a buying preference", async ({
  page,
  api,
}) => {
  await page.goto("/meals/1/edit");
  await editEgg(page);
  const form = editorScreen(page);
  await form.getByRole("combobox", { name: "Ingredient name", exact: true }).fill("Tuna");
  await form.getByRole("option", { name: "Add “Tuna” as a new ingredient", exact: true }).click();
  await form.getByRole("textbox", { name: "Quantity", exact: true }).fill("1");
  await chooseUnit(page, "cans");
  await form.getByLabel("Contents per container", { exact: true }).fill("140");
  await form.getByRole("combobox", { name: "Content unit", exact: true }).click();
  await page.getByRole("option", { name: "g", exact: true }).click();
  await form.getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(form).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0]).toMatchObject({
    name: "Tuna",
    unit: "can",
    ingredient_package: { quantity: "140", unit: "g" },
  });
  const tunaId = api.ingredients.find((ingredient) => ingredient.name === "Tuna")!.id;
  expect(api.ingredientProfiles[tunaId]).toMatchObject({
    shopping_unit: "can",
    package_quantity: "140",
    package_unit: "g",
  });

  await page.goto("/meals/1/edit");
  await editorScreen(page).getByRole("button", { name: "Edit Tuna", exact: true }).click();
  await toggleIngredientDetails(page);
  await expect(page.getByText("Saved size · 140 g")).toBeVisible();
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveCount(0);
  await chooseUnit(page, "bottles");
  await expect(page.getByText("Saved size · 140 g")).toBeVisible();
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveCount(0);
  await editorScreen(page).getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(editorScreen(page)).toHaveCount(0);
  expect(api.saves[1].body.ingredients[0]).toMatchObject({ ingredient_id: tunaId, unit: "bottle" });
  expect(api.saves[1].body.ingredients[0]).not.toHaveProperty("ingredient_package");
});

test("switching ingredients discards a late buying-size response", async ({ page, api }) => {
  api.meals[0].ingredients[0] = {
    ingredient_id: 1,
    name: "Egg",
    quantity: "1",
    unit: "package",
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
  await editEgg(page);
  await toggleIngredientDetails(page);
  await expect(page.getByText("Looking up your saved package size…")).toBeVisible();
  await expect(page.getByLabel("Contents per container", { exact: true })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Ingredient name" }).fill("Tomato");
  await page.getByRole("option", { name: "Tomato", exact: true }).click();
  release();
  await editorScreen(page).getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(editorScreen(page)).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0]).toMatchObject({ unit: "package" });
  expect(api.saves[0].body.ingredients[0]).not.toHaveProperty("ingredient_package");
});

test(
  "returning to a container clears optional contents for an unsaved ingredient",
  { tag: "@responsive" },
  async ({ page, api }) => {
    await page.goto("/meals/1/edit");
    await editEgg(page);
    await page.getByRole("combobox", { name: "Ingredient name" }).fill("Tuna");
    await chooseUnit(page, "cans");
    await page.getByLabel("Contents per container", { exact: true }).fill("140");
    await chooseUnit(page, "g");
    await chooseUnit(page, "cans");
    await expect(page.getByLabel("Contents per container", { exact: true })).toHaveValue("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await cancelEditor(page);
    expect(api.saves).toHaveLength(0);
  },
);

test("changing an existing ingredient to a container opens its shared buying setup", async ({
  page,
  api,
}) => {
  await page.goto("/meals/1/edit");
  await editEgg(page);
  const form = editorScreen(page);
  await form.getByRole("combobox", { name: "Unit", exact: true }).click();
  for (const label of ["jars", "bags", "cans", "bottles", "packages"]) {
    await expect(page.getByRole("option", { name: label, exact: true })).toBeVisible();
  }
  await page.getByRole("option", { name: "jars", exact: true }).click();
  await form.getByLabel("Contents per container", { exact: true }).fill("250");
  await form.getByRole("combobox", { name: "Content unit", exact: true }).click();
  await page.getByRole("option", { name: "ml", exact: true }).click();
  await form.getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(form).toHaveCount(0);
  expect(api.saves[0].body.ingredients[0]).toMatchObject({
    ingredient_id: 1,
    unit: "jar",
    ingredient_package: { quantity: "250", unit: "ml" },
  });
  expect(api.ingredientProfiles[1]).toMatchObject({
    shopping_unit: "jar",
    package_quantity: "250",
    package_unit: "ml",
  });
});
