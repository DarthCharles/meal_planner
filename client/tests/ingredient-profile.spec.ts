import { cancelEditor, editorScreen, expect, test } from "./fixtures/app";

async function openEgg(page: import("@playwright/test").Page) {
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  return page.getByRole("region", { name: "How I buy it", exact: true });
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
  const setup = page.getByRole("region", { name: "How I buy it", exact: true });
  await expect(setup.getByRole("button", { name: "Set up shopping amounts" })).toBeVisible();
  expect(api.reads["/units"] ?? 0).toBe(0);
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await expect(setup.getByRole("radio", { name: "Individual pieces", exact: true })).toBeFocused();
  await expect(setup.getByRole("group", { name: "How do you buy Egg?" })).toBeVisible();
  await expect(
    setup.getByRole("textbox", {
      name: "Weight of one piece (g, optional)",
      exact: true,
    }),
  ).toHaveValue("");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/Buying setup saved/)).toBeVisible();
  await expect(setup.getByRole("button", { name: "Edit shopping setup" })).toBeFocused();
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
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("radio", { name: "In a package", exact: true }).click();
  await expect(setup.getByLabel("Package contents", { exact: true })).toBeHidden();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/Buying setup saved/)).toBeVisible();
  expect(api.profileSaves[0].body).toEqual({
    mode: "package",
    shopping_unit: "package",
    package_quantity: null,
    package_unit: null,
  });
  await expect(editorScreen(page).getByLabel("Ingredient name", { exact: true })).toHaveValue(
    "Unsaved name",
  );
  await expect(setup.getByText(/Each .* contains/)).toHaveCount(0);
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByRole("button", { name: "Reset buying choice", exact: true }).click();
  await setup.getByRole("button", { name: "Remove shopping setup" }).click();
  await expect(setup.getByRole("status")).toHaveText(
    "Buying setup removed. Recipe measurements and saved piece weights are kept.",
  );
  await expect(setup.getByRole("button", { name: "Set up shopping amounts" })).toBeFocused();
  await expect(setup.getByText("Not set up yet", { exact: true })).toBeVisible();
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
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await expect(setup.getByLabel("Package contents", { exact: true })).toHaveValue("390");
  await setup.getByLabel("Package contents", { exact: true }).fill("0");
  const contents = setup.getByRole("button", { name: "Package contents (optional)", exact: true });
  await contents.click();
  await expect(contents).toHaveAttribute("aria-expanded", "false");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toBeVisible();
  await expect(contents).toHaveAttribute("aria-expanded", "true");
  await expect(setup.getByLabel("Package contents", { exact: true })).toBeVisible();
  await expect(setup.getByLabel("Package contents", { exact: true })).toBeFocused();
  expect(api.profileSaves).toEqual([]);
  await setup.getByLabel("Package contents", { exact: true }).fill("850");
  api.profileSaveError = "Cannot save buying setup";
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Cannot save buying setup");
  await expect(setup.getByLabel("Package contents", { exact: true })).toHaveValue("850");
  api.profileSaveError = null;
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/Each jar contains 850 g/)).toBeVisible();
  await expect(setup.getByText("I buy jars", { exact: true })).toBeVisible();
  await expect(
    setup.getByText(
      "Recipe quantities, with package counts rounded to the nearest whole number. Small amounts keep their measure.",
    ),
  ).toBeVisible();
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByLabel("Package contents", { exact: true }).fill("");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/Each jar contains/)).toHaveCount(0);
  expect(api.profileSaves[api.profileSaves.length - 1].body.package_quantity).toBeNull();
  expect(api.profileSaves[api.profileSaves.length - 1].body.package_unit).toBeNull();
});

test("buying setup retry preserves the ingredient name draft", async ({ page, api }) => {
  api.readErrors["/ingredients/1/shopping_profile"] = "Profile unavailable";
  const setup = await openEgg(page);
  await editorScreen(page).getByLabel("Ingredient name", { exact: true }).fill("Keep my name");
  await expect(setup.getByRole("alert")).toHaveText("Profile unavailable");
  delete api.readErrors["/ingredients/1/shopping_profile"];
  await setup.getByRole("button", { name: "Retry shopping setup" }).click();
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/Buying setup saved/)).toBeVisible();
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
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("radio", { name: "By weight or volume", exact: true }).click();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/Buying setup saved/)).toBeVisible();
  expect(api.profileSaves[0].body).toEqual({
    mode: "bulk",
    shopping_unit: "kg",
    package_quantity: null,
    package_unit: null,
  });
  expect(api.referenceSaves).toEqual([]);
});

test("weight and volume choices explain the receipt and preserve existing units", async ({
  page,
  api,
}) => {
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "bulk",
    shopping_unit: "ml",
    package_quantity: null,
    package_unit: null,
  };
  const setup = await openEgg(page);
  await expect(setup.getByText("I buy by volume", { exact: true })).toBeVisible();
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await expect(setup.getByRole("combobox", { name: "Measure by" })).toHaveText("Volume");
  await expect(
    setup.getByText("A total in milliliters, when recipe amounts can be combined."),
  ).toBeVisible();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  expect(api.profileSaves[0].body.shopping_unit).toBe("ml");

  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByRole("combobox", { name: "Measure by" }).click();
  await page.getByRole("option", { name: "Weight", exact: true }).click();
  await expect(
    setup.getByText("A total in grams, when recipe amounts can be combined."),
  ).toBeVisible();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  expect(api.profileSaves[1].body.shopping_unit).toBe("kg");
  await expect(setup.getByText("I buy by weight", { exact: true })).toBeVisible();
});

test("buying choices support arrow keys and retain values when switching modes", async ({
  page,
  api,
}) => {
  const setup = await openEgg(page);
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  const piece = setup.getByRole("radio", {
    name: "Individual pieces",
    exact: true,
  });
  await setup.getByLabel("Weight of one piece (g, optional)", { exact: true }).fill("60");
  await piece.focus();
  const bulk = setup.getByRole("radio", {
    name: "By weight or volume",
    exact: true,
  });
  const packageOption = setup.getByRole("radio", { name: "In a package", exact: true });
  for (const option of [bulk, packageOption]) {
    // Radix moves focus asynchronously while the arrow key is down.
    await page.keyboard.down("ArrowRight");
    try {
      await expect(option).toBeFocused();
      await expect(option).toBeChecked();
    } finally {
      await page.keyboard.up("ArrowRight");
    }
  }
  await expect(setup.getByLabel("Weight of one piece (g, optional)", { exact: true })).toHaveCount(
    0,
  );
  await piece.click();
  await expect(setup.getByLabel("Weight of one piece (g, optional)", { exact: true })).toHaveValue(
    "60",
  );
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("button", { name: "Edit shopping setup" })).toBeVisible();
  expect(api.profileSaves[0].body.piece_weight).toEqual({
    quantity: "60",
    reference_quantity: "1",
  });
});

test("protects unsaved buying choices when leaving the editor", async ({ page, api }) => {
  const setup = await openEgg(page);
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("radio", { name: "In a package", exact: true }).click();
  page.once("dialog", (dialog) => dialog.dismiss());
  await editorScreen(page).getByRole("button", { name: "Done", exact: true }).click();
  await expect(page).toHaveURL("/ingredients/1/edit");
  await expect(setup.getByRole("radio", { name: "In a package", exact: true })).toBeChecked();
  expect(api.profileSaves).toEqual([]);
  page.once("dialog", (dialog) => dialog.accept());
  await setup.getByRole("button", { name: "Cancel", exact: true }).click();
  await editorScreen(page).getByRole("button", { name: "Done", exact: true }).click();
  await expect(page).toHaveURL("/ingredients");
});

test("optional package fields fit supported widths", { tag: "@responsive" }, async ({ page }) => {
  const setup = await openEgg(page);
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("radio", { name: "In a package", exact: true }).click();
  await setup.getByRole("button", { name: "Package contents (optional)", exact: true }).click();
  await setup.getByLabel("Package contents", { exact: true }).fill("250");
  await expect(setup.getByRole("combobox", { name: "Label unit" })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Cómo lo compro", exact: true })).toBeVisible();
    await expect(page.getByText("Lo compro en frascos", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Medidas usadas en recetas" })).toHaveCount(0);
    const setup = page.getByRole("region", {
      name: "Cómo lo compro",
      exact: true,
    });
    await setup.getByRole("button", { name: "Editar datos de compra" }).click();
    await setup.getByRole("radio", { name: "Por pieza", exact: true }).click();
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
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  const weight = setup.getByRole("textbox", {
    name: "Weight of one piece (g, optional)",
    exact: true,
  });
  await weight.fill("0");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Enter a positive weight or leave it blank.");
  expect(api.profileSaves).toEqual([]);
  await weight.fill("272");
  api.profileSaveError = "Cannot save weight";
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Cannot save weight");
  await expect(weight).toHaveValue("272");
  api.profileSaveError = null;
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText("1 piece ≈ 272 g", { exact: true })).toBeVisible();
  expect(api.profileSaves[1].body.piece_weight).toEqual({
    quantity: "272",
    reference_quantity: "1",
  });
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await expect(weight).toHaveValue("272");
  await weight.fill("");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/≈/)).toHaveCount(0);
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
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await expect(
    setup.getByLabel("Weight of 2.000001 pieces (g, optional)", {
      exact: true,
    }),
  ).toHaveValue("150.123456");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("button", { name: "Edit shopping setup" })).toBeVisible();
  expect(api.profileSaves[0].body.piece_weight).toEqual({
    quantity: "150.123456",
    reference_quantity: "2.000001",
  });
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByRole("radio", { name: "In a package", exact: true }).click();
  await expect(setup.getByRole("textbox", { name: /Weight of/ })).toHaveCount(0);
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("button", { name: "Edit shopping setup" })).toBeVisible();
  expect(api.profileSaves[1].body).not.toHaveProperty("piece_weight");
});
