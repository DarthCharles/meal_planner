import { cancelEditor, editorScreen, expect, navigateTo, test } from "./fixtures/app";

test("opens a dedicated receipt page and returns to the originating menu", async ({
  page,
  api,
}) => {
  await page.goto("/");
  const open = page.getByRole("link", { name: "Shopping list", exact: true });
  await expect(open).toBeVisible();
  expect(api.reads["/menus/1/shopping_list"] ?? 0).toBe(0);
  await open.click();
  await expect(page).toHaveURL("/menus/1/shopping-list");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const receipt = page.getByRole("region", { name: "Shopping receipt", exact: true });
  await expect(receipt.getByRole("spinbutton", { name: "People", exact: true })).toHaveValue("4");
  await page.getByRole("link", { name: "Back to menus", exact: true }).click();
  await expect(page).toHaveURL("/");
  api.menus.push({
    ...api.menus[0],
    id: 2,
    from: "2026-10-12T00:00:00Z",
    to: "2026-10-18T23:59:59Z",
  });
  api.shoppingLists[2] = { ...api.shoppingLists[1], menu_id: 2 };
  await page.goto("/saved-menus");
  const selected = page
    .getByRole("navigation", { name: "Saved weeks" })
    .getByRole("button", { name: /Oct 12/ });
  await selected.click();
  await open.click();
  await expect(page).toHaveURL("/menus/2/shopping-list");
  await expect(receipt).toBeVisible();
  await page.getByRole("link", { name: "Back to menus", exact: true }).click();
  await expect(page).toHaveURL("/saved-menus");
  await expect(selected).toHaveAttribute("aria-current", "true");
});

test("orders names within categories and shows fractional requirements, approximations, and incomplete-list warnings", async ({
  page,
  api,
}) => {
  const list = api.shoppingLists[1];
  list.items = [
    {
      ingredient_id: 30,
      name: "Zucchini",
      shopping_category: "produce",
      quantity: "1.25",
      unit: "pieza",
      approximate: true,
    },
    {
      ingredient_id: 31,
      name: "Apple",
      shopping_category: "produce",
      quantity: "250.5",
      unit: "g",
    },
    {
      ingredient_id: 32,
      name: "Unknown grocery",
      shopping_category: "uncategorized",
      quantity: "1.0",
      unit: "taza",
    },
  ];
  list.meals_without_ingredients = [{ id: 2, name: "Recipe without ingredients" }];
  list.conversion_warnings = [
    {
      ingredient_id: 32,
      name: "Unknown grocery",
      units: ["taza"],
      target_unit: "g",
      reason: "equivalence_missing",
    },
  ];
  await page.goto("/menus/1/shopping-list");
  const produce = page.getByRole("region", { name: "Fruit & vegetables", exact: true });
  await expect(produce.getByRole("listitem")).toContainText(["Apple", "Zucchini"]);
  await expect(produce.getByText("1.25 pieces", { exact: true })).toBeVisible();
  await expect(produce.getByText("Approximate quantity")).toBeVisible();
  await expect(page.getByText("Recipe without ingredients", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Unknown grocery: Missing conversion to g (cups)", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Uncategorized", exact: true })).toBeVisible();
});

test("shows loading, retry, and a genuine empty list", async ({ page, api }) => {
  let release!: () => void;
  api.readBarriers["/menus/1/shopping_list"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  api.readErrors["/menus/1/shopping_list"] = "Shopping list unavailable";
  await page.goto("/menus/1/shopping-list");
  await expect(page.getByRole("status")).toHaveText("Loading shopping list…");
  await expect(page.getByText("There are no ingredients in this menu yet.")).toHaveCount(0);
  release();
  await expect(page.getByRole("alert")).toHaveText("Shopping list unavailable");
  delete api.readErrors["/menus/1/shopping_list"];
  api.shoppingLists[1].items = [];
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("There are no ingredients in this menu yet.")).toBeVisible();
  await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0);
});

test("uses the selected saved menu and handles a missing menu", async ({ page, api }) => {
  api.menus = [{ ...api.menus[0], id: 22 }];
  await page.goto("/saved-menus");
  await page.getByRole("link", { name: "Shopping list", exact: true }).click();
  await expect(page).toHaveURL("/menus/22/shopping-list");
  await expect(page.getByRole("alert")).toHaveText("Menu with id 22 not found");
  expect(api.reads["/menus/1/shopping_list"] ?? 0).toBe(0);
});

test("edits category codes and refreshes the list after returning", async ({ page, api }) => {
  api.ingredients[0].shopping_category = "dairy_eggs";
  await page.goto("/menus/1/shopping-list");
  await expect(page.getByRole("region", { name: "Dairy & eggs", exact: true })).toBeVisible();
  await navigateTo(page, "My Ingredients");
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const dialog = page.getByRole("region", { name: "Edit ingredient", exact: true });
  await dialog.getByRole("combobox", { name: "Shopping category", exact: true }).click();
  await dialog.getByRole("option", { name: "Frozen foods", exact: true }).click();
  await dialog.getByRole("button", { name: "Save ingredient", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.ingredientSaves[0].body).toEqual({ name: "Egg", shopping_category: "frozen" });
  await navigateTo(page, "My menu");
  await page.getByRole("link", { name: "Shopping list", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Frozen foods", exact: true })
      .getByText("Egg", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Dairy & eggs", exact: true })).toHaveCount(0);
});

test("translates category headings and editing labels without changing codes or ingredient names", async ({
  page,
  api,
}) => {
  await page.goto("/menus/1/shopping-list");
  await expect(
    page.getByRole("heading", { name: "Fruit & vegetables", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Lista de compras", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Frutas y verduras", exact: true })).toBeVisible();
  await expect(page.getByText("Tomato", { exact: true })).toBeVisible();
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Editar Egg", exact: true }).click();
  const dialog = page.getByRole("region", { name: "Editar ingrediente", exact: true });
  await dialog.getByRole("combobox", { name: "Categoría de compra", exact: true }).click();
  await dialog.getByRole("option", { name: "Carnes", exact: true }).click();
  await dialog.getByRole("button", { name: "Guardar ingrediente", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.ingredientSaves[0].body.shopping_category).toBe("meat");
});

test("waits for category reference data and retries without exposing an editable draft", async ({
  page,
  api,
}) => {
  let release!: () => void;
  api.readBarriers["/shopping_categories"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  api.readErrors["/shopping_categories"] = "Categories unavailable";
  await page.goto("/ingredients");
  expect(api.reads["/shopping_categories"] ?? 0).toBe(0);
  await page.getByRole("button", { name: "Edit Egg", exact: true }).click();
  const dialog = page.getByRole("region", { name: "Edit ingredient", exact: true });
  await expect(dialog.getByRole("status")).toHaveText("Loading shopping categories…");
  await expect(dialog.getByRole("textbox", { name: "Ingredient name" })).toHaveCount(0);
  release();
  await expect(dialog.getByRole("alert")).toHaveText("Categories unavailable");
  delete api.readErrors["/shopping_categories"];
  await dialog.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Ingredient name" })).toHaveValue("Egg");
  await expect(dialog.getByRole("combobox", { name: "Shopping category" })).toContainText(
    "Uncategorized",
  );
});

test("checks entries independently, supports keyboard toggling, and resets changed quantities", async ({
  page,
  api,
}) => {
  api.shoppingLists[1].items = [
    { ingredient_id: 30, name: "Rice", shopping_category: "pantry", quantity: "200", unit: "g" },
    { ingredient_id: 30, name: "Rice", shopping_category: "pantry", quantity: "1", unit: "taza" },
  ];
  await page.goto("/menus/1/shopping-list");
  const receipt = page.getByRole("region", { name: /^(Shopping receipt|Ticket de compra)$/ });
  const grams = receipt.getByRole("checkbox", { name: /Rice.*200/ });
  const cups = receipt.getByRole("checkbox", { name: /Rice.*1/ });
  await grams.check();
  await expect(grams).toBeChecked();
  await expect(cups).not.toBeChecked();
  await expect(receipt.getByRole("status")).toHaveText("1 of 2 checked");
  await grams.focus();
  await page.keyboard.press("Space");
  await expect(grams).not.toBeChecked();
  await cups.check();
  await page.getByRole("button", { name: "Refresh list", exact: true }).click();
  await expect(cups).toBeChecked();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "Ticket de compra", exact: true }).getByRole("status"),
  ).toHaveText("1 de 2 marcados");
  await expect(
    page
      .getByRole("region", { name: "Ticket de compra", exact: true })
      .getByRole("checkbox", { name: /Rice.*1/ }),
  ).toBeChecked();
  api.shoppingLists[1].items[0].quantity = "400";
  await page.getByRole("button", { name: "Actualizar lista", exact: true }).click();
  await expect(page.getByText("400 g", { exact: true })).toBeVisible();
  await expect(grams).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: /Rice.*400/ })).not.toBeChecked();
  await expect(cups).toBeChecked();
  expect(api.ingredientSaves).toEqual([]);
  expect(api.saves).toEqual([]);
  await page.reload();
  await expect(page.getByRole("checkbox")).toHaveCount(2);
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(0);
});

test("edits a recipe from a single preview and restores shopping progress", async ({
  page,
  api,
}) => {
  await page.goto("/menus/1/shopping-list");
  const ticket = page.getByRole("region", { name: "Shopping receipt", exact: true });
  const checked = ticket.getByRole("checkbox", { name: /Egg/ });
  await checked.check();
  await ticket.getByRole("spinbutton", { name: "People", exact: true }).fill("6");
  await ticket.getByRole("button", { name: "Egg", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Huevos a la mexicana", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.getByRole("dialog").getByRole("button", { name: "Edit meal", exact: true }).click();
  await expect(page).toHaveURL("/meals/1/edit");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await editorScreen(page).getByLabel("Meal name", { exact: true }).fill("Updated breakfast");
  await editorScreen(page).getByRole("button", { name: "Update meal", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Updated breakfast", exact: true });
  await expect(detail).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await detail.getByRole("button", { name: "Back to meals", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Updated breakfast", exact: true }),
  ).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await expect(checked).toBeChecked();
  await expect(ticket.getByRole("spinbutton", { name: "People", exact: true })).toHaveValue("6");
  expect(api.saves[0].path).toBe("/meals/1");
  expect(api.menuSaves).toEqual([]);
});

test("opens the ingredient editor directly from shopping and returns after save or cancel", async ({
  page,
  api,
}) => {
  await page.goto("/menus/1/shopping-list");
  const ticket = page.getByRole("region", { name: "Shopping receipt", exact: true });
  await ticket.getByRole("checkbox", { name: /Egg/ }).check();
  await ticket.getByRole("button", { name: "Egg", exact: true }).click();
  const usage = page.getByRole("dialog");
  await usage.getByRole("button", { name: "Edit ingredient", exact: true }).click();
  await expect(page).toHaveURL("/ingredients/1/edit");
  await expect(editorScreen(page).getByLabel("Ingredient name", { exact: true })).toHaveValue(
    "Egg",
  );
  await cancelEditor(page);
  await expect(page.getByRole("dialog", { name: "Meals with Egg", exact: true })).toBeVisible();
  await usage.getByRole("button", { name: "Edit ingredient", exact: true }).click();
  await editorScreen(page).getByLabel("Ingredient name", { exact: true }).fill("Free range egg");
  await editorScreen(page).getByRole("button", { name: "Save ingredient", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Meals with Free range egg", exact: true }),
  ).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await expect(ticket.getByRole("checkbox", { name: /Free range egg/ })).toBeChecked();
  expect(api.ingredientSaves[0].path).toBe("/ingredients/1");
});

test("browser Back and Forward retrace usage, meal preview, and editor", async ({ page }) => {
  await page.goto("/menus/1/shopping-list");
  await page.getByRole("button", { name: "Egg", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Huevos a la mexicana", exact: true })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "Edit meal", exact: true }).click();
  await expect(editorScreen(page)).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("dialog", { name: "Huevos a la mexicana", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog", { name: "Meals with Egg", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole("dialog", { name: "Meals with Egg", exact: true })).toBeVisible();
});

test("validates people, retains failed drafts, and refreshes backend quantities after saving", async ({
  page,
  api,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Shopping list", exact: true }).click();
  const dialog = page.getByRole("region", { name: "Shopping receipt", exact: true });
  const people = dialog.getByRole("spinbutton", { name: "People", exact: true });
  const save = dialog.getByRole("button", { name: "Refresh list", exact: true });
  const receipt = dialog;
  for (const value of ["", "0", "1.5"]) {
    await people.fill(value);
    await save.click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Enter a positive whole number within the supported range.",
    );
  }
  expect(api.menuSaves).toEqual([]);
  api.menuSaveError = "Cannot save people";
  await people.fill("6");
  await save.click();
  await expect(dialog.getByRole("alert")).toHaveText("Cannot save people");
  await expect(people).toHaveValue("6");
  await expect(receipt.getByText("For 4 people", { exact: true })).toBeVisible();
  api.menuSaveError = null;
  let release!: () => void;
  api.menuSaveBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await save.click();
  await expect(dialog.getByRole("button", { name: "Updating…", exact: true })).toBeDisabled();
  await expect(people).toBeDisabled();
  api.shoppingLists[1].people_count = 6;
  api.shoppingLists[1].items[0].quantity = "18";
  release();
  await expect(dialog.getByText("People count saved.", { exact: true })).toBeVisible();
  await expect(receipt.getByText("For 6 people", { exact: true })).toBeVisible();
  await expect(receipt.getByText("18 pieces", { exact: true })).toBeVisible();
  expect(api.menuSaves).toEqual([
    { id: 1, people_count: 6 },
    { id: 1, people_count: 6 },
  ]);
  await page.getByRole("link", { name: "Back to menus", exact: true }).click();
  await page.getByRole("link", { name: "Shopping list", exact: true }).click();
  await expect(people).toHaveValue("6");
});

test("preserves the original receipt calculation when refreshing a saved count fails", async ({
  page,
  api,
}) => {
  await page.goto("/menus/1/shopping-list");
  const people = page.getByRole("spinbutton", { name: "People", exact: true });
  await people.fill("2");
  api.readErrors["/menus/1/shopping_list"] = "Refresh unavailable";
  await page.getByRole("button", { name: "Refresh list", exact: true }).click();
  await expect(page.getByText("People count saved.", { exact: true })).toBeVisible();
  await expect(people).toHaveValue("2");
  await expect(page.getByText(/The ticket shows the previous calculation/)).toBeVisible();
  const receipt = page.getByRole("region", { name: "Shopping receipt", exact: true });
  await expect(receipt.getByText("For 4 people", { exact: true })).toBeVisible();
  delete api.readErrors["/menus/1/shopping_list"];
  api.shoppingLists[1].people_count = 2;
  api.shoppingLists[1].items[0].quantity = "6";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(receipt.getByText("For 2 people", { exact: true })).toBeVisible();
  await expect(receipt.getByText("6 pieces", { exact: true })).toBeVisible();
});

test("saving people preserves notices in each cached language", async ({ page, api }) => {
  api.localizedMenus.en = [{ ...api.menus[0], generation_notices: ["English notice"] }];
  api.localizedMenus.es = [{ ...api.menus[0], generation_notices: ["Aviso en español"] }];
  await page.goto("/saved-menus");
  await expect(page.getByText("English notice", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Aviso en español", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Lista de compras", exact: true }).click();
  const dialog = page.getByRole("region", { name: "Ticket de compra", exact: true });
  await dialog.getByRole("spinbutton", { name: "Personas", exact: true }).fill("3");
  api.shoppingLists[1].people_count = 3;
  await dialog.getByRole("button", { name: "Actualizar lista", exact: true }).click();
  await expect(dialog.getByText("Número de personas guardado.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Volver a los menús", exact: true }).click();
  await expect(page.getByText("Aviso en español", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Menú" }).click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("English notice", { exact: true })).toBeVisible();
  await expect(page.getByText("Aviso en español", { exact: true })).toHaveCount(0);
});

test(
  "opens recipes from an ingredient without changing the checklist or people draft",
  { tag: "@responsive" },
  async ({ page, api }) => {
    await page.goto("/");
    const open = page.getByRole("link", { name: "Shopping list", exact: true });
    await open.click();
    const ticket = page.getByRole("region", { name: "Shopping receipt", exact: true });
    const checked = ticket.getByRole("checkbox", { name: /Egg/ });
    await checked.check();
    await ticket.getByRole("spinbutton", { name: "People", exact: true }).fill("6");
    expect(api.reads["/ingredients"] ?? 0).toBe(0);
    const ingredient = ticket.getByRole("button", { name: "Egg", exact: true });
    await ingredient.click();
    const recipes = page.getByRole("dialog", { name: "Meals with Egg", exact: true });
    const recipe = recipes.getByRole("button", { name: /^Huevos a la mexicana/ });
    await expect(recipe).toBeVisible();
    expect(api.reads["/meals"] ?? 0).toBe(0);
    expect(api.reads["/meals/1"] ?? 0).toBe(0);
    await recipe.click();
    const detail = page.getByRole("dialog", { name: "Huevos a la mexicana", exact: true });
    await expect(
      detail.getByText("Eggs with tomato, onion, and chile.", { exact: true }),
    ).toBeVisible();
    await expect(detail.getByText(/2 pieces · Egg/)).toBeVisible();
    await expect(detail.getByRole("button", { name: "Edit meal", exact: true })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await detail.getByRole("button", { name: "Back to meals", exact: true }).click();
    await expect(recipe).toBeFocused();
    await recipes.getByRole("button", { name: "Close", exact: true }).click();
    await expect(ingredient).toBeFocused();
    await expect(checked).toBeChecked();
    await expect(ticket.getByRole("spinbutton", { name: "People", exact: true })).toHaveValue("6");
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    await page.getByRole("link", { name: "Back to menus", exact: true }).click();
    await expect(page).toHaveURL("/");
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
    expect(api.menuSaves).toEqual([]);
  },
);

test("retries menu lookup and explains an ingredient not used in that menu", async ({
  page,
  api,
}) => {
  api.readErrors["/menus"] = "Menus unavailable";
  await page.goto("/menus/1/shopping-list");
  await page.getByRole("button", { name: "Tomato", exact: true }).click();
  const recipes = page.getByRole("dialog", { name: "Meals with Tomato", exact: true });
  await expect(recipes.getByRole("alert")).toHaveText("Menus unavailable");
  delete api.readErrors["/menus"];
  await recipes.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    recipes.getByText("No meals in this menu use this ingredient.", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Tomato", exact: true })).toBeFocused();
});

test(
  "packs complete categories into responsive columns without losing checklist state",
  { tag: "@responsive" },
  async ({ page, api }) => {
    const categories = ["produce", "pantry", "frozen"] as const;
    api.shoppingLists[1].items = Array.from({ length: 36 }, (_, index) => ({
      ingredient_id: 100 + index,
      name: `Very long ingredient name with preparation variety ${String(index + 1).padStart(2, "0")}`,
      shopping_category: categories[Math.floor(index / 12)],
      quantity: "1",
      unit: "g",
    }));
    await page.goto("/menus/1/shopping-list");
    const receipt = page.getByRole("region", { name: "Shopping receipt", exact: true });
    await expect(receipt.getByRole("checkbox")).toHaveCount(36);
    const first = receipt.getByRole("checkbox").first();
    await expect(receipt.getByRole("heading", { level: 3 })).toHaveText([
      "Fruit & vegetables",
      "Pantry",
      "Frozen foods",
    ]);
    const last = receipt.getByRole("checkbox").last();
    const firstBox = (await first.boundingBox())!;
    const lastBox = (await last.boundingBox())!;
    if (page.viewportSize()!.width < 760) {
      expect(Math.abs(firstBox.x - lastBox.x)).toBeLessThan(2);
      expect(lastBox.y).toBeGreaterThan(firstBox.y);
    } else {
      expect(lastBox.x).toBeGreaterThan(firstBox.x + 100);
    }
    await first.check();
    await receipt.getByRole("spinbutton", { name: "People", exact: true }).fill("6");
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(receipt.getByRole("checkbox")).toHaveCount(36);
    await expect(first).toBeChecked();
    await expect(receipt.getByRole("spinbutton", { name: "People", exact: true })).toHaveValue("6");
    expect(await receipt.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
  },
);

test("ingredient usage lists only distinct meals from the selected menu", async ({ page, api }) => {
  const outsideMeal = {
    ...structuredClone(api.meals[0]),
    id: 40,
    name: "Egg meal outside this menu",
  };
  api.meals.push(outsideMeal);
  api.menus.push({
    ...structuredClone(api.menus[0]),
    id: 2,
    days: [{ id: 50, weekday: "Monday", meals: [outsideMeal] }],
  });
  api.shoppingLists[2] = { ...structuredClone(api.shoppingLists[1]), menu_id: 2 };
  await page.goto("/menus/1/shopping-list");
  await page.getByRole("button", { name: "Egg", exact: true }).click();
  const usage = page.getByRole("dialog", { name: "Meals with Egg", exact: true });
  await expect(
    usage.getByRole("button", { name: "Huevos a la mexicana", exact: true }),
  ).toHaveCount(1);
  await expect(usage.getByRole("button", { name: outsideMeal.name, exact: true })).toHaveCount(0);
  await expect(usage.getByRole("textbox", { name: "Ingredient name", exact: true })).toHaveCount(0);
  await expect(usage.getByRole("button", { name: "Save ingredient", exact: true })).toHaveCount(0);
  expect(api.reads["/ingredients"] ?? 0).toBe(0);
  expect(api.reads["/meals"] ?? 0).toBe(0);
  await page.keyboard.press("Escape");
  await page.goto("/menus/2/shopping-list");
  await page.getByRole("button", { name: "Egg", exact: true }).click();
  await expect(usage.getByRole("button", { name: outsideMeal.name, exact: true })).toBeVisible();
  await expect(
    usage.getByRole("button", { name: "Huevos a la mexicana", exact: true }),
  ).toHaveCount(0);
});
