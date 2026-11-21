import type { MeasurementReference } from "../src/types";
import { cancelEditor, editorScreen, expect, test } from "./fixtures/app";

const density: MeasurementReference = {
  kind: "density",
  quantity: "13",
  reference_quantity: "15",
  source: "My product label",
  description: "13 g per measured 15 ml",
  approximate: true,
};
const pieceWeight: MeasurementReference = {
  kind: "piece_weight",
  quantity: "150.123456",
  reference_quantity: "2.000001",
  source: "Personal measurement",
  description: "Two measured pieces",
  approximate: false,
};

async function openEgg(page: import("@playwright/test").Page) {
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  return page.getByRole("region", { name: "How I buy it", exact: true });
}

test("loads configuration only in a saved editor and saves pieces without a weight", async ({
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
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await expect(setup.getByRole("textbox")).toHaveCount(0);
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/Buying setup saved/)).toBeVisible();
  expect(api.profileSaves[0].body).toEqual({
    mode: "piece",
    shopping_unit: "piece",
    package_quantity: null,
    package_unit: null,
  });
  expect(api.referenceSaves).toEqual([]);
  await expect(editorScreen(page)).toBeVisible();
});

test("package saves and removals preserve references and independent dirty drafts", async ({
  page,
  api,
}) => {
  api.ingredientReferences[1] = [density];
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "package",
    shopping_unit: "jar",
    package_quantity: "390",
    package_unit: "g",
  };
  const setup = await openEgg(page);
  const references = page.getByRole("region", { name: "Measurements used in recipes" });
  await references.getByRole("button", { name: "Edit measurement references" }).click();
  await references.getByLabel("Describe what you measured").fill("Unsaved description");
  await editorScreen(page).getByLabel("Ingredient name", { exact: true }).fill("Unsaved name");
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByLabel("Package contents", { exact: true }).fill("850");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText(/Each jar contains 850 g/)).toBeVisible();
  await expect(references.getByLabel("Describe what you measured")).toHaveValue(
    "Unsaved description",
  );
  await expect(editorScreen(page).getByLabel("Ingredient name", { exact: true })).toHaveValue(
    "Unsaved name",
  );
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByRole("button", { name: "Remove shopping setup" }).click();
  await expect(setup.getByText("Not set up yet", { exact: true })).toBeVisible();
  expect(api.ingredientReferences[1]).toEqual([density]);
  expect(api.referenceSaves).toEqual([]);
  expect(api.ingredientSaves).toEqual([]);
  await cancelEditor(page);
});

test("captures a culinary measured ratio using unit metadata and preserves it on reopening", async ({
  page,
  api,
}) => {
  await openEgg(page);
  const section = page.getByRole("region", { name: "Measurements used in recipes" });
  await section.getByRole("button", { name: "Edit measurement references" }).click();
  const volume = section.getByRole("group", { name: "Weight and volume", exact: true });
  await volume.getByRole("checkbox", { name: "Use this reference" }).check();
  await volume.getByLabel("Measured quantity", { exact: true }).fill("1");
  await volume.getByRole("combobox", { name: "Measured unit" }).click();
  await page.getByRole("option", { name: "tablespoons", exact: true }).click();
  await volume.getByLabel("Weighs (g)", { exact: true }).fill("13");
  await volume.getByRole("button", { name: "Product label", exact: true }).click();
  await volume.getByLabel("Describe what you measured").fill("One tablespoon of my mayonnaise");
  await section.getByRole("button", { name: "Save measurement references" }).click();
  await expect(section.getByText(/Measurement references saved/)).toBeVisible();
  expect(api.referenceSaves[0].body.references).toEqual([
    {
      kind: "density",
      quantity: "13",
      reference_quantity: "15",
      source: "Product label",
      description: "One tablespoon of my mayonnaise",
      approximate: true,
    },
  ]);
  await expect(volume.getByRole("combobox", { name: "Measured unit" })).toHaveText("ml");
  await expect(volume.getByLabel("Measured quantity", { exact: true })).toHaveValue("15");
  await section.getByRole("button", { name: "Save measurement references" }).click();
  await expect.poll(() => api.referenceSaves.length).toBe(2);
  expect(api.referenceSaves[1].body).toEqual(api.referenceSaves[0].body);
});

test("removing one reference retains the exact other measured relationship and can clear all", async ({
  page,
  api,
}) => {
  api.ingredientReferences[1] = [density, pieceWeight];
  await openEgg(page);
  const section = page.getByRole("region", { name: "Measurements used in recipes" });
  await section.getByRole("button", { name: "Edit measurement references" }).click();
  await section
    .getByRole("group", { name: "Weight and volume", exact: true })
    .getByRole("checkbox", { name: "Use this reference" })
    .uncheck();
  await section.getByRole("button", { name: "Save measurement references" }).click();
  await expect(section.getByText(/Measurement references saved/)).toBeVisible();
  expect(api.referenceSaves[0].body.references).toEqual([pieceWeight]);
  await section
    .getByRole("group", { name: "Weight and pieces", exact: true })
    .getByRole("checkbox", { name: "Use this reference" })
    .uncheck();
  await section.getByRole("button", { name: "Save measurement references" }).click();
  await expect.poll(() => api.referenceSaves.length).toBe(2);
  expect(api.referenceSaves[1].body.references).toEqual([]);
});

test("failed reference loads never initialize an empty replacement and retry preserves the name draft", async ({
  page,
  api,
}) => {
  api.ingredientReferences[1] = [pieceWeight];
  api.readErrors["/ingredients/1/measurement_references"] = "References unavailable";
  await openEgg(page);
  const section = page.getByRole("region", { name: "Measurements used in recipes" });
  await expect(section.getByRole("alert")).toHaveText("References unavailable");
  await expect(section.getByRole("button", { name: "Edit measurement references" })).toHaveCount(0);
  await editorScreen(page).getByLabel("Ingredient name", { exact: true }).fill("Keep this name");
  delete api.readErrors["/ingredients/1/measurement_references"];
  await section.getByRole("button", { name: "Retry measurement references" }).click();
  await section.getByRole("button", { name: "Edit measurement references" }).click();
  await expect(section.getByLabel("Weighs (g)")).toHaveValue(pieceWeight.quantity);
  await expect(editorScreen(page).getByLabel("Ingredient name", { exact: true })).toHaveValue(
    "Keep this name",
  );
  expect(api.referenceSaves).toEqual([]);
});

test("background refresh errors preserve the complete dirty reference draft", async ({
  page,
  api,
}) => {
  api.ingredientReferences[1] = [density, pieceWeight];
  await openEgg(page);
  const section = page.getByRole("region", { name: "Measurements used in recipes" });
  await section.getByRole("button", { name: "Edit measurement references" }).click();
  const description = section.getByLabel("Describe what you measured").first();
  await description.fill("Keep this measured description");
  api.readErrors["/ingredients/1/measurement_references"] = "Refresh unavailable";
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(section.getByRole("alert")).toHaveText("Refresh unavailable");
  await expect(description).toHaveValue("Keep this measured description");
  delete api.readErrors["/ingredients/1/measurement_references"];
  await section.getByRole("button", { name: "Retry measurement references" }).click();
  await expect(description).toHaveValue("Keep this measured description");
  await section.getByRole("button", { name: "Save measurement references" }).click();
  await expect(section.getByText(/Measurement references saved/)).toBeVisible();
  expect(api.referenceSaves[0].body.references).toContainEqual(pieceWeight);
});

test("reference save failures retain inputs and do not save another section", async ({
  page,
  api,
}) => {
  api.ingredientReferences[1] = [density];
  await openEgg(page);
  const section = page.getByRole("region", { name: "Measurements used in recipes" });
  await section.getByRole("button", { name: "Edit measurement references" }).click();
  await section.getByLabel("Weighs (g)").fill("14");
  api.referenceSaveError = "Measurement save unavailable";
  await section.getByRole("button", { name: "Save measurement references" }).click();
  await expect(section.getByRole("alert")).toHaveText("Measurement save unavailable");
  await expect(section.getByLabel("Weighs (g)")).toHaveValue("14");
  expect(api.profileSaves).toEqual([]);
  api.referenceSaveError = null;
  await section.getByRole("button", { name: "Save measurement references" }).click();
  await expect(section.getByText(/Measurement references saved/)).toBeVisible();
  await expect(editorScreen(page)).toBeVisible();
});

test("profile load and save retries preserve unrelated drafts", async ({ page, api }) => {
  api.readErrors["/ingredients/1/shopping_profile"] = "Profile unavailable";
  const setup = await openEgg(page);
  await editorScreen(page).getByLabel("Ingredient name", { exact: true }).fill("Keep my name");
  await expect(setup.getByRole("alert")).toHaveText("Profile unavailable");
  delete api.readErrors["/ingredients/1/shopping_profile"];
  await setup.getByRole("button", { name: "Retry shopping setup" }).click();
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  api.profileSaveError = "Profile save unavailable";
  await setup.getByRole("button", { name: "Save shopping setup" }).click();
  await expect(setup.getByRole("alert")).toHaveText("Profile save unavailable");
  api.profileSaveError = null;
  await setup.getByRole("button", { name: "Save shopping setup" }).click();
  await expect(setup.getByText(/Buying setup saved/)).toBeVisible();
  await expect(editorScreen(page).getByLabel("Ingredient name", { exact: true })).toHaveValue(
    "Keep my name",
  );
});

for (const [code, label] of [
  ["jar", "jars"],
  ["bag", "bags"],
  ["can", "cans"],
  ["package", "packages"],
]) {
  test(`captures ${label} containing pieces without a weight reference`, async ({ page, api }) => {
    const setup = await openEgg(page);
    await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
    await setup.getByRole("combobox", { name: "How do you buy Egg?" }).click();
    await page.getByRole("option", { name: "In a package", exact: true }).click();
    await setup.getByRole("combobox", { name: "Package type", exact: true }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await setup.getByLabel("Package contents", { exact: true }).fill("6");
    await setup.getByRole("combobox", { name: "Label unit", exact: true }).click();
    await page.getByRole("option", { name: "pieces", exact: true }).click();
    await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
    await expect(setup.getByText(/Buying setup saved/)).toBeVisible();
    expect(api.profileSaves[0].body).toEqual({
      mode: "package",
      shopping_unit: code,
      package_quantity: "6",
      package_unit: "piece",
    });
    expect(api.referenceSaves).toEqual([]);
  });
}

test(
  "retains form usability and reference focus at supported widths",
  { tag: "@responsive" },
  async ({ page, api }) => {
    api.ingredientReferences[1] = [density, pieceWeight];
    await page.goto("/ingredients/1/edit?section=measurements");
    const section = page.getByRole("region", { name: "Measurements used in recipes" });
    await expect(section.getByRole("heading")).toBeFocused();
    await expect(section.getByLabel("Weighs (g)").first()).toHaveValue("13");
    await section.getByLabel("Weighs (g)").first().fill("");
    await section.getByRole("button", { name: "Save measurement references" }).click();
    await expect(section.getByLabel("Weighs (g)").first()).toBeFocused();
    await expect(section.getByLabel("Weighs (g)").first()).toHaveAttribute(
      "aria-describedby",
      "measurement-form-error",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  },
);

test.describe("Spanish buying setup", () => {
  test.use({ locale: "es-MX" });
  test("translates English unit codes and measurement references", async ({ page, api }) => {
    api.ingredientProfiles[1] = {
      ingredient_id: 1,
      mode: "package",
      shopping_unit: "jar",
      package_quantity: "390",
      package_unit: "g",
    };
    api.ingredientReferences[1] = [density];
    await page.goto("/ingredients/1/edit");
    await expect(page.getByText(/Cada frasco contiene 390 g/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Medidas usadas en recetas" })).toBeVisible();
    expect(
      api.requests.some(
        ({ path, language }) => path.endsWith("/shopping_profile") && language === "es",
      ),
    ).toBe(true);
  });
});

test("reference saves leave a presentation draft dirty and Done and Back protect it", async ({
  page,
  api,
}) => {
  api.ingredientReferences[1] = [density];
  api.ingredientProfiles[1] = {
    ingredient_id: 1,
    mode: "package",
    shopping_unit: "jar",
    package_quantity: "390",
    package_unit: "g",
  };
  const setup = await openEgg(page);
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByLabel("Package contents", { exact: true }).fill("450");
  const references = page.getByRole("region", { name: "Measurements used in recipes" });
  await references.getByRole("button", { name: "Edit measurement references" }).click();
  await references.getByLabel("Weighs (g)").fill("14");
  await references.getByRole("button", { name: "Save measurement references" }).click();
  await expect(references.getByText(/Measurement references saved/)).toBeVisible();
  await expect(setup.getByLabel("Package contents", { exact: true })).toHaveValue("450");
  expect(api.profileSaves).toEqual([]);
  page.once("dialog", (dialog) => dialog.dismiss());
  await editorScreen(page).getByRole("button", { name: "Done", exact: true }).click();
  await expect(page).toHaveURL("/ingredients/1/edit");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.goBack();
  await expect(setup.getByLabel("Package contents", { exact: true })).toHaveValue("450");
  page.once("dialog", (dialog) => dialog.accept());
  await setup.getByRole("button", { name: "Cancel", exact: true }).click();
  await editorScreen(page).getByRole("button", { name: "Done", exact: true }).click();
  await expect(page).toHaveURL("/ingredients");
  await page.goForward();
  await expect(page).toHaveURL("/ingredients/1/edit");
  await expect(setup.getByText(/Each jar contains 390 g/)).toBeVisible();
});

test("bulk buying uses its own contract without creating a measurement reference", async ({
  page,
  api,
}) => {
  const setup = await openEgg(page);
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("combobox", { name: "How do you buy Egg?" }).click();
  await page.getByRole("option", { name: "By weight or volume", exact: true }).click();
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
