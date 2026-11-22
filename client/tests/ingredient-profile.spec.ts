import type { Locator } from "@playwright/test";

import { cancelEditor, editorScreen, expect, test } from "./fixtures/app";

async function openEgg(page: import("@playwright/test").Page) {
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  return page.getByRole("region", { name: "How do you buy this ingredient?", exact: true });
}

function formatControl(setup: Locator) {
  return setup.getByRole("combobox", {
    name: /^(How do you buy this ingredient\?|¿Cómo compras este producto\?)$/,
  });
}

async function chooseFormat(setup: Locator, name: string) {
  const format = formatControl(setup);
  await format.click();
  await setup.page().getByRole("option", { name, exact: true }).click();
  await expect(format).toHaveText(name);
}

test("loads buying setup only in saved editors and never asks for measurement references", async ({
  page,
  api,
}) => {
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "+ Add ingredient", exact: true }).click();
  expect(
    api.requests.some(({ path }) => /shopping_profile|measurement_references/.test(path)),
  ).toBe(false);
  await cancelEditor(page);
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const setup = page.getByRole("region", { name: "How do you buy this ingredient?", exact: true });
  expect(api.reads["/units"] ?? 0).toBe(0);
  await expect(formatControl(setup)).toHaveText("Use recipe measurements");
  await expect(setup.getByRole("button", { name: "Save buying preference" })).toBeDisabled();
  await chooseFormat(setup, "By the piece");
  await expect(
    setup.getByLabel("Weight of one piece (g, optional)", { exact: true }),
  ).toBeVisible();
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[0].body).toEqual({
    mode: "piece",
    shopping_unit: "piece",
    package_quantity: null,
    package_unit: null,
  });
  await expect(page.getByRole("region", { name: "Measurements used in recipes" })).toHaveCount(0);
  expect(api.requests.some(({ path }) => path.endsWith("/measurement_references"))).toBe(false);
  expect(api.referenceSaves).toEqual([]);
});

test("saves packages without contents and preserves independent name drafts and existing references", async ({
  page,
  api,
}) => {
  const reference = {
    kind: "piece_weight" as const,
    quantity: "60",
    reference_quantity: "1",
    source: "Existing reference",
    description: "Existing measurement",
    approximate: true,
  };
  api.ingredientReferences[1] = [reference];
  const setup = await openEgg(page);
  await editorScreen(page).getByLabel("Ingredient name", { exact: true }).fill("Unsaved name");
  await chooseFormat(setup, "In a package");
  await expect(setup.getByLabel("Contents per package (optional)", { exact: true })).toHaveValue(
    "",
  );
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[0].body).toEqual({
    mode: "package",
    shopping_unit: "package",
    package_quantity: null,
    package_unit: null,
  });
  await expect(editorScreen(page).getByLabel("Ingredient name", { exact: true })).toHaveValue(
    "Unsaved name",
  );
  await chooseFormat(setup, "Use recipe measurements");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByRole("status")).toHaveText("Using recipe measurements again.");
  await expect(formatControl(setup)).toHaveText("Use recipe measurements");
  expect(api.ingredientReferences[1]).toEqual([reference]);
  expect(api.ingredientSaves).toEqual([]);
  await cancelEditor(page);
});

test("keeps known package contents editable and validates optional values without losing drafts", async ({
  page,
  api,
}) => {
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "package",
    shopping_unit: "jar",
    package_quantity: "390",
    package_unit: "g",
  };
  const setup = await openEgg(page);
  await expect(setup.getByLabel("Contents per package (optional)", { exact: true })).toHaveValue(
    "390",
  );
  await setup.getByLabel("Contents per package (optional)", { exact: true }).fill("0");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByRole("alert")).toBeVisible();
  await expect(setup.getByLabel("Contents per package (optional)", { exact: true })).toBeFocused();
  expect(api.profileSaves).toEqual([]);
  await setup.getByLabel("Contents per package (optional)", { exact: true }).fill("850");
  api.profileSaveError = "Cannot save buying setup";
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Cannot save buying setup");
  await expect(setup.getByLabel("Contents per package (optional)", { exact: true })).toHaveValue(
    "850",
  );
  api.profileSaveError = null;
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  await expect(formatControl(setup)).toHaveText("In a package");
  await setup.getByLabel("Contents per package (optional)", { exact: true }).fill("");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[api.profileSaves.length - 1].body.package_quantity).toBeNull();
  expect(api.profileSaves[api.profileSaves.length - 1].body.package_unit).toBeNull();
  await chooseFormat(setup, "By weight");
  await chooseFormat(setup, "In a package");
  await expect(setup.getByRole("button", { name: "Save buying preference" })).toBeDisabled();
  await expect(setup.getByRole("combobox", { name: "Package type" })).toHaveText("jars");
});

test("buying setup retry preserves the ingredient name draft", async ({ page, api }) => {
  api.readErrors["/ingredients/1/shopping_profile"] = "Profile unavailable";
  const setup = await openEgg(page);
  await editorScreen(page).getByLabel("Ingredient name", { exact: true }).fill("Keep my name");
  await expect(setup.getByRole("alert")).toHaveText("Profile unavailable");
  delete api.readErrors["/ingredients/1/shopping_profile"];
  await setup.getByRole("button", { name: "Retry loading buying preference" }).click();
  await chooseFormat(setup, "By the piece");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  await expect(editorScreen(page).getByLabel("Ingredient name", { exact: true })).toHaveValue(
    "Keep my name",
  );
  await cancelEditor(page);
});

test("bulk buying keeps its own unit without creating measurement references", async ({
  page,
  api,
}) => {
  const setup = await openEgg(page);
  await chooseFormat(setup, "By weight");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[0].body).toEqual({
    mode: "bulk",
    shopping_unit: "kg",
    package_quantity: null,
    package_unit: null,
  });
  expect(api.referenceSaves).toEqual([]);
});

test("weight and volume choices preserve existing units", async ({ page, api }) => {
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "bulk",
    shopping_unit: "ml",
    package_quantity: null,
    package_unit: null,
  };
  const setup = await openEgg(page);
  await expect(formatControl(setup)).toHaveText("By volume");
  await setup.getByLabel("Weight of one piece (g, optional)", { exact: true }).fill("25");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[0].body.shopping_unit).toBe("ml");

  await chooseFormat(setup, "By weight");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  expect(api.profileSaves[1].body.shopping_unit).toBe("kg");
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  await expect(formatControl(setup)).toHaveText("By weight");
});

test("each buying choice shows its fields inline and saves independently", async ({
  page,
  api,
}) => {
  const setup = await openEgg(page);
  const editor = editorScreen(page);
  await expect(editor.getByRole("button", { name: "Save ingredient" })).toBeVisible();
  await expect(editor.getByRole("button", { name: "Done", exact: true })).toHaveCount(0);
  const nameInput = editor.getByLabel("Ingredient name", { exact: true });
  await nameInput.fill("Unsaved name");
  const save = setup.getByRole("button", { name: "Save buying preference", exact: true });
  const pieceWeight = setup.getByLabel("Weight of one piece (g, optional)", { exact: true });
  const packageType = setup.getByRole("combobox", { name: "Package type" });
  const contents = setup.getByLabel("Contents per package (optional)", { exact: true });

  await expect(save).toBeDisabled();
  await chooseFormat(setup, "By the piece");
  await pieceWeight.fill("60");
  for (const name of ["By weight", "By volume"]) {
    await chooseFormat(setup, name);
    await expect(pieceWeight).toBeVisible();
    await expect(pieceWeight).toHaveValue("60");
    await expect(packageType).toBeHidden();
    await expect(save).toBeEnabled();
  }
  expect(api.reads["/units"] ?? 0).toBe(0);

  await chooseFormat(setup, "In a package");
  await expect(packageType).toBeVisible();
  await expect(pieceWeight).toBeHidden();
  await contents.fill("250");
  await chooseFormat(setup, "Use recipe measurements");
  await expect(contents).toBeHidden();
  await expect(save).toBeDisabled();

  await chooseFormat(setup, "In a package");
  await expect(contents).toHaveValue("250");
  await chooseFormat(setup, "By the piece");
  await expect(pieceWeight).toHaveValue("60");
  let releaseSave!: () => void;
  api.profileSaveBarrier = new Promise<void>((resolve) => {
    releaseSave = resolve;
  });
  const saveIngredient = editor.getByRole("button", { name: "Save ingredient", exact: true });
  try {
    await save.click();
    await expect(saveIngredient).toBeDisabled();
  } finally {
    releaseSave();
  }
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  await expect(save).toBeDisabled();
  await expect(saveIngredient).toBeEnabled();
  await expect(nameInput).toHaveValue("Unsaved name");
  expect(api.profileSaves[0].body.piece_weight).toEqual({
    quantity: "60",
    reference_quantity: "1",
  });
});

test("Back protects unsaved buying and ingredient changes", async ({ page, api }) => {
  const setup = await openEgg(page);
  await editorScreen(page).getByLabel("Ingredient name", { exact: true }).fill("Unsaved name");
  await chooseFormat(setup, "In a package");
  page.once("dialog", (dialog) => dialog.dismiss());
  await editorScreen(page).getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL("/ingredients/1/edit");
  await expect(formatControl(setup)).toHaveText("In a package");
  expect(api.profileSaves).toEqual([]);
  page.once("dialog", (dialog) => dialog.accept());
  await editorScreen(page).getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL("/ingredients");
});

test("optional package fields fit supported widths", { tag: "@responsive" }, async ({ page }) => {
  const setup = await openEgg(page);
  await chooseFormat(setup, "In a package");
  await setup.getByLabel("Contents per package (optional)", { exact: true }).fill("250");
  await expect(setup.getByRole("combobox", { name: "Label unit" })).toBeVisible();
  const section = await setup.boundingBox();
  const ingredientName = await editorScreen(page).getByLabel("Ingredient name").boundingBox();
  expect(section?.width).toBe(ingredientName?.width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test.describe("Spanish buying setup", () => {
  test.use({ locale: "es-MX" });
  test("shows buying choices without measurement setup", async ({ page, api }) => {
    api.ingredientProfiles[1] = {
      ingredient_id: 1,
      mode: "package",
      shopping_unit: "jar",
      package_quantity: null,
      package_unit: null,
    };
    await page.goto("/ingredients/1/edit");
    await expect(
      page.getByRole("heading", { name: "¿Cómo compras este producto?", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Medidas usadas en recetas" })).toHaveCount(0);
    const setup = page.getByRole("region", {
      name: "¿Cómo compras este producto?",
      exact: true,
    });
    await chooseFormat(setup, "Por pieza");
    await expect(
      setup.getByLabel("Peso de una pieza (g, opcional)", { exact: true }),
    ).toBeVisible();
    expect(api.requests.some(({ path }) => path.endsWith("/measurement_references"))).toBe(false);
  });
});

test("captures an optional piece weight in buying setup without source or description forms", async ({
  page,
  api,
}) => {
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "bulk",
    shopping_unit: "g",
    package_quantity: null,
    package_unit: null,
  };
  const setup = await openEgg(page);
  const weight = setup.getByRole("textbox", {
    name: "Weight of one piece (g, optional)",
    exact: true,
  });
  await weight.fill("0");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Enter a positive weight or leave it blank.");
  expect(api.profileSaves).toEqual([]);
  await weight.fill("272");
  api.profileSaveError = "Cannot save weight";
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Cannot save weight");
  await expect(weight).toHaveValue("272");
  api.profileSaveError = null;
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[1].body.piece_weight).toEqual({
    quantity: "272",
    reference_quantity: "1",
  });
  await expect(weight).toHaveValue("272");
  await weight.fill("");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[2].body.piece_weight).toBeNull();
  expect(api.requests.some(({ path }) => path.endsWith("/measurement_references"))).toBe(false);
});

test("preserves the measured basis of existing weights and hides the field for packaged groceries", async ({
  page,
  api,
}) => {
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "piece",
    shopping_unit: "piece",
    package_quantity: null,
    package_unit: null,
    piece_weight: { quantity: "150.123456", reference_quantity: "2.000001" },
  };
  const setup = await openEgg(page);
  await expect(
    setup.getByLabel("Weight of 2.000001 pieces (g, optional)", {
      exact: true,
    }),
  ).toHaveValue("150.123456");
  await setup.getByLabel("Weight of 2.000001 pieces (g, optional)", { exact: true }).fill("151");
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[0].body.piece_weight).toEqual({
    quantity: "151",
    reference_quantity: "2.000001",
  });
  await chooseFormat(setup, "In a package");
  await expect(setup.getByRole("textbox", { name: /Weight of/ })).toHaveCount(0);
  await setup.getByRole("button", { name: "Save buying preference", exact: true }).click();
  await expect(setup.getByText(/Buying preference saved/)).toBeVisible();
  expect(api.profileSaves[1].body).not.toHaveProperty("piece_weight");
});
