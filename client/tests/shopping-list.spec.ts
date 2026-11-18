import { expect, navigateTo, test } from "./fixtures/app";

test(
  "opens the full weekly list lazily from current and saved menus",
  { tag: "@responsive" },
  async ({ page, api }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Shopping list", exact: true })).toBeVisible();
    expect(api.reads["/menus/1/shopping_list"] ?? 0).toBe(0);
    await page.getByRole("link", { name: "Shopping list", exact: true }).click();
    await expect(page).toHaveURL("/menus/1/shopping-list");
    await expect(page.getByText("For 4 people", { exact: true })).toBeVisible();
    const produce = page.getByRole("region", { name: "Fruit & vegetables", exact: true });
    await expect(produce.getByText("Tomato", { exact: true })).toBeVisible();
    await expect(produce.getByText("300 grams", { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Dairy & eggs", exact: true })
        .getByText("Egg", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Frozen foods", exact: true })).toHaveCount(0);
    const headings = page.getByRole("heading", { level: 3 });
    await expect(headings).toHaveText(["Fruit & vegetables", "Dairy & eggs"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole("link", { name: "Back to menus" }).click();
    await page.getByRole("link", { name: "Shopping list", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Shopping list", exact: true })).toBeVisible();
  },
);

test("orders names within categories and shows rounding, approximations, and incomplete-list warnings", async ({
  page,
  api,
}) => {
  const list = api.shoppingLists[1];
  list.items = [
    {
      ingredient_id: 30,
      name: "Zucchini",
      shopping_category: "produce",
      quantity: "2",
      required_quantity: "1.25",
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
  await expect(produce.getByText("Recipe requirement: 1.25 pieces")).toBeVisible();
  await expect(produce.getByText("Approximate quantity")).toBeVisible();
  await expect(page.getByText("Recipe without ingredients", { exact: true })).toBeVisible();
  await expect(page.getByText(/Unknown grocery: Missing conversion to grams/)).toBeVisible();
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
  const dialog = page.getByRole("dialog", { name: "Edit ingredient", exact: true });
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
  await page.getByRole("button", { name: "Open actions" }).click();
  await page.getByRole("button", { name: "Español", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Lista de compras", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Frutas y verduras", exact: true })).toBeVisible();
  await expect(page.getByText("Tomato", { exact: true })).toBeVisible();
  await page.goto("/ingredients");
  await page.getByRole("button", { name: "Editar Egg", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar ingrediente", exact: true });
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
  const dialog = page.getByRole("dialog", { name: "Edit ingredient", exact: true });
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
