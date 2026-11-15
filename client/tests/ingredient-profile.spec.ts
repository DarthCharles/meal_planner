import { test, expect } from "./fixtures/app";

test("loads shopping setup only for a saved ingredient and shows unknown setup honestly", async ({ page, api }) => {
  let completedProfileReads = 0;
  page.on("requestfinished", (request) => {
    if (request.method() === "GET" && new URL(request.url()).pathname === "/ingredients/1/shopping_profile") {
      completedProfileReads += 1;
    }
  });
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "+ Add ingredient", exact: true }).click();
  await expect(page.getByRole("region", { name: "Shopping setup", exact: true })).toHaveCount(0);
  expect(Object.keys(api.reads).some((path) => path.endsWith("/shopping_profile"))).toBe(false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
  await expect(setup.getByText("Not set up yet", { exact: true })).toBeVisible();
  await expect(setup.getByText("Shopping amounts have not been set up for this ingredient.", { exact: true })).toBeVisible();
  // Strict Mode can cancel its first fetch; count completed reads rather than attempts.
  await expect.poll(() => completedProfileReads).toBe(1);
  expect(api.profileSaves).toEqual([]);
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await expect(setup.getByRole("combobox", { name: "How do you buy Egg?", exact: true })).toHaveText("Individual pieces");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Enter the approximate weight of one piece.");
  expect(api.profileSaves).toEqual([]);
  await setup.getByRole("spinbutton", { name: "Approximate weight of one piece (g)", exact: true }).fill("60");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("button", { name: "Edit shopping setup" })).toBeVisible();
  expect(api.profileSaves).toEqual([{ id: 1, body: { base_unit: "g", shopping_unit: "pieza", round_up: true,
    equivalences: [{ unit: "pieza", quantity: "60", source: "User-entered approximate piece weight",
      description: "Approximate weight of one piece", approximate: true }] } }]);
  expect(api.ingredientSaves).toEqual([]);
});

test("shows known amounts and lets users edit a jar size without saving a name draft", async ({ page, api }) => {
  api.ingredientProfiles[1] = { ingredient_id: 1, base_unit: "g", shopping_unit: "frasco", round_up: true,
    equivalences: [{ unit: "frasco", quantity: "390.0", source: "Package label", description: "The jar normally purchased", approximate: false }] };
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit ingredient", exact: true });
  const setup = dialog.getByRole("region", { name: "Shopping setup", exact: true });
  await expect(setup.getByText("Each jar contains 390 g", { exact: true })).toBeVisible();
  await expect(setup.getByText("Where these amounts come from", { exact: true })).toHaveCount(0);
  await expect(setup.getByText("Package label", { exact: true })).toHaveCount(0);
  await dialog.getByLabel("Ingredient name", { exact: true }).fill("Unsaved name");
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await expect(dialog.getByRole("button", { name: "Save ingredient", exact: true })).toHaveCount(0);
  await setup.getByRole("spinbutton", { name: "Package contents", exact: true }).fill("450");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText("Each jar contains 450 g", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Ingredient name", { exact: true })).toHaveValue("Unsaved name");
  expect(api.ingredientSaves).toEqual([]);
  expect(api.profileSaves[0].body.equivalences[0]).toEqual({ unit: "frasco", quantity: "450",
    source: "User-entered package size", description: "The jar normally purchased", approximate: false });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  await expect(setup.getByText("Each jar contains 450 g", { exact: true })).toBeVisible();
});

test("validates known amounts and preserves drafts after a failed profile save", async ({ page, api }) => {
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Enter the approximate weight of one piece.");
  expect(api.profileSaves).toEqual([]);
  await setup.getByRole("spinbutton", { name: "Approximate weight of one piece (g)", exact: true }).fill("150");
  api.profileSaveError = "Could not save shopping amounts.";
  let release!: () => void;
  api.profileSaveBarrier = new Promise<void>((resolve) => { release = resolve; });
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
  release();
  await expect(setup.getByRole("alert")).toHaveText(api.profileSaveError);
  await expect(setup.getByRole("spinbutton", { name: "Approximate weight of one piece (g)", exact: true })).toHaveValue("150");
  await setup.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(setup.getByText("Not set up yet", { exact: true })).toBeVisible();
  expect(api.profileSaves).toHaveLength(1);
});

test("clears a saved profile without deleting the ingredient", async ({ page, api }) => {
  api.ingredientProfiles[1] = { ingredient_id: 1, base_unit: "pieza", shopping_unit: "pieza", round_up: true, equivalences: [] };
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Enter the approximate weight of one piece.");
  expect(api.profileSaves).toEqual([]);
  await setup.getByRole("button", { name: "Remove shopping setup", exact: true }).click();
  await expect(setup.getByText("Not set up yet", { exact: true })).toBeVisible();
  expect(api.profileDeletes).toEqual([1]);
  expect(api.ingredientDeletes).toEqual([]);
});

test("configures a jar using only the size printed on its label", async ({ page, api }) => {
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("combobox", { name: "How do you buy Egg?", exact: true }).click();
  await page.getByRole("option", { name: "In a package", exact: true }).click();
  await expect(setup.getByText("How much does the package contain?", { exact: true })).toBeVisible();
  await expect(setup.getByRole("combobox", { name: "Package type", exact: true })).toHaveText("Choose a package type");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Choose a package type");
  expect(api.profileSaves).toEqual([]);
  await setup.getByRole("combobox", { name: "Package type", exact: true }).click();
  await page.getByRole("option", { name: "jars", exact: true }).click();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("Enter the contents printed on the package label.");
  expect(api.profileSaves).toEqual([]);
  await setup.getByRole("spinbutton", { name: "Package contents", exact: true }).fill("390");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText("Each jar contains 390 g", { exact: true })).toBeVisible();
  expect(api.profileSaves[0].body).toEqual({ base_unit: "g", shopping_unit: "frasco", round_up: true,
    equivalences: [{ unit: "frasco", quantity: "390", source: "User-entered package size",
      description: "Contents of the package normally purchased", approximate: false }] });
});

for (const [code, label, single] of [["bag", "bags", "bag"], ["can", "cans", "can"]] as const) {
  test(`uses ${label} in the saved profile`, async ({ page, api }) => {
    await page.goto("/ingredients");
    await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
    const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
    await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
    await setup.getByRole("combobox", { name: "How do you buy Egg?", exact: true }).click();
    await page.getByRole("option", { name: "In a package", exact: true }).click();
    await setup.getByRole("combobox", { name: "Package type", exact: true }).click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await setup.getByRole("spinbutton", { name: "Package contents", exact: true }).fill("500");
    await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
    await expect(setup.getByText(`Each ${single} contains 500 g`, { exact: true })).toBeVisible();
    expect(api.profileSaves[0].body.shopping_unit).toBe(code);
    expect(api.profileSaves[0].body.equivalences[0].unit).toBe(code);
  });
}

test("configures purchase by weight without requesting a conversion", async ({ page, api }) => {
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
  await setup.getByRole("button", { name: "Set up shopping amounts" }).click();
  await setup.getByRole("combobox", { name: "How do you buy Egg?", exact: true }).click();
  await page.getByRole("option", { name: "By weight or volume", exact: true }).click();
  await expect(setup.getByRole("spinbutton")).toHaveCount(0);
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("button", { name: "Edit shopping setup" })).toBeVisible();
  expect(api.profileSaves[0].body).toEqual({ base_unit: "g", shopping_unit: "kg", round_up: false, equivalences: [] });
});

test("editing a package size preserves additional saved measurements", async ({ page, api }) => {
  const density = { unit: "ml", quantity: "0.95", source: "Existing measured reference",
    description: "Density of this product", approximate: true };
  api.ingredientProfiles[1] = { ingredient_id: 1, base_unit: "g", shopping_unit: "frasco", round_up: true,
    equivalences: [density, { unit: "frasco", quantity: "390", source: "Package label", description: "Usual jar", approximate: false }] };
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByRole("spinbutton", { name: "Package contents", exact: true }).fill("450");
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByText("Each jar contains 450 g", { exact: true })).toBeVisible();
  expect(api.profileSaves[0].body.equivalences).toContainEqual(density);
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await setup.getByRole("combobox", { name: "How do you buy Egg?", exact: true }).click();
  await page.getByRole("option", { name: "By weight or volume", exact: true }).click();
  await setup.getByRole("combobox", { name: "Show the shopping quantity in", exact: true }).click();
  await page.getByRole("option", { name: "l", exact: true }).click();
  await setup.getByRole("button", { name: "Save shopping setup", exact: true }).click();
  await expect(setup.getByRole("alert")).toHaveText("This change would affect other saved measurements. Keep the existing measurement unit, or remove the setup before choosing a new one.");
  expect(api.profileSaves).toHaveLength(1);
});

test("retries profile loading without losing an ingredient name draft", async ({ page, api }) => {
  let release!: () => void;
  api.readBarriers["/ingredients/1/shopping_profile"] = new Promise<void>((resolve) => { release = resolve; });
  api.readErrors["/ingredients/1/shopping_profile"] = "Profile unavailable.";
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
  await expect(setup.getByRole("status")).toHaveText("Loading shopping setup…");
  await page.getByLabel("Ingredient name", { exact: true }).fill("Draft name");
  release();
  await expect(setup.getByRole("alert")).toContainText("Profile unavailable.");
  delete api.readErrors["/ingredients/1/shopping_profile"];
  await setup.getByRole("button", { name: "Retry shopping setup" }).click();
  await expect(setup.getByText("Not set up yet", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Ingredient name", { exact: true })).toHaveValue("Draft name");
  expect(api.ingredientSaves).toEqual([]);
});

test("keeps shopping setup readable and restores focus", { tag: "@responsive" }, async ({ page, api }) => {
  api.ingredientProfiles[1] = { ingredient_id: 1, base_unit: "g", shopping_unit: "pieza", round_up: true,
    equivalences: [{ unit: "pieza", quantity: "148", source: `https://example.com/${"long-reference-".repeat(15)}`,
      description: "A documented example of the piece size normally purchased", approximate: true }] };
  await page.goto("/ingredients");
  const open = page.getByRole("button", { name: "Edit Egg", exact: true });
  await open.click();
  const setup = page.getByRole("region", { name: "Shopping setup", exact: true });
  await expect(setup.getByText("Estimated", { exact: true })).toBeVisible();
  expect(await setup.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await setup.getByRole("button", { name: "Edit shopping setup" }).click();
  await expect(setup.getByRole("combobox", { name: "How do you buy Egg?", exact: true })).toHaveText("Individual pieces");
  await expect(setup.getByRole("spinbutton", { name: "Approximate weight of one piece (g)", exact: true })).toHaveValue("148");
  expect(await setup.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await setup.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(open).toBeFocused();
});

test.describe("Spanish shopping setup", () => {
  test.use({ locale: "es-MX" });
  test("translates jar labels without displaying source details", async ({ page, api }) => {
    api.ingredientProfiles[1] = { ingredient_id: 1, base_unit: "g", shopping_unit: "frasco", round_up: true,
      equivalences: [{ unit: "frasco", quantity: "390", source: "My package label", description: "My usual jar", approximate: false }] };
    await page.goto("/ingredients");
    await page.getByRole("button", { name: "Editar Egg", exact: true }).click();
    const setup = page.getByRole("region", { name: "Compra en el súper", exact: true });
    await expect(setup.getByText("Cada frasco contiene 390 g", { exact: true })).toBeVisible();
    await expect(setup.getByText("De dónde salen estas cantidades", { exact: true })).toHaveCount(0);
    await expect(setup.getByText("My package label", { exact: true })).toHaveCount(0);
    expect(api.requests.some(({ path, language }) => path.endsWith("/shopping_profile") && language === "es")).toBe(true);
  });
});
