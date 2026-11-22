import { expect, navigateTo, test } from "./fixtures/app";

test(
  "keeps navigation in the URL and supports back and forward without reloading",
  { tag: "@responsive" },
  async ({ page, api }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
    const initialMenuReads = api.reads["/menus"];
    await navigateTo(page, "My meals");
    await expect(page).toHaveURL("/meals");
    await expect(page.getByPlaceholder("Search meals")).toBeVisible();
    const initialMealReads = api.reads["/meals"];
    await navigateTo(page, "Saved Menus");
    await expect(page).toHaveURL("/saved-menus");
    await expect(page.getByRole("heading", { name: "Saved Menus", exact: true })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL("/meals");
    await expect(page.getByPlaceholder("Search meals")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL("/meals");
    await expect(page.getByPlaceholder("Search meals")).toBeVisible();
    expect(api.reads).toEqual({ "/menus": initialMenuReads, "/meals": initialMealReads });
  },
);

for (const path of ["/meals", "/saved-menus", "/ingredients"]) {
  test(`opens and reloads ${path} directly`, async ({ page, api }) => {
    await page.goto(path);
    const screen =
      path === "/meals"
        ? page.getByPlaceholder("Search meals")
        : page.getByRole("heading", {
            name: path === "/ingredients" ? "My Ingredients" : "Saved Menus",
            exact: true,
          });
    await expect(screen).toBeVisible();
    const initialMealReads = api.reads["/meals"] ?? 0;
    await page.reload();
    await expect(page).toHaveURL(path);
    await expect(screen).toBeVisible();
    if (page.viewportSize()!.width >= 760) {
      await page.getByRole("button", { name: "Menu" }).click();
    }
    const navigation = page.getByRole("navigation", { name: "Primary navigation" });
    const current = navigation.getByRole("link").and(page.locator('[aria-current="page"]'));
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", path);
    if (path === "/meals") {
      expect(api.reads["/meals"]).toBeGreaterThan(initialMealReads);
    } else {
      expect(api.reads["/meals"] ?? 0).toBe(0);
    }
    expect(api.reads["/meal_types"] ?? 0).toBe(0);
    expect(api.reads["/units"] ?? 0).toBe(0);
  });
}

test("shows unknown URLs and returns home through a link", async ({ page }) => {
  await page.goto("/does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page).toHaveURL("/does-not-exist");
  await page.getByRole("link", { name: "Go to my menu" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
});

for (const scenario of [
  {
    path: "/meals/1/edit",
    title: "Edit meal",
    field: "Meal name",
    value: "Huevos a la mexicana",
    back: "/meals",
  },
  {
    path: "/ingredients/1/edit",
    title: "Edit ingredient",
    field: "Ingredient name",
    value: "Egg",
    back: "/ingredients",
  },
]) {
  test(`opens and reloads the editor at ${scenario.path}`, async ({ page }) => {
    await page.goto(scenario.path);
    const editor = page.getByRole("region", { name: scenario.title, exact: true });
    await expect(editor.getByLabel(scenario.field, { exact: true })).toHaveValue(scenario.value);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.reload();
    await expect(editor.getByLabel(scenario.field, { exact: true })).toHaveValue(scenario.value);
    await editor.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(scenario.back);
  });
}

test("retries a direct editor load without creating a blank edit draft", async ({ page, api }) => {
  api.readErrors["/meals/1"] = "Meal unavailable";
  await page.goto("/meals/1/edit");
  const editor = page.getByRole("region", { name: "Edit meal", exact: true });
  await expect(editor.getByText("Meal unavailable", { exact: true })).toBeVisible();
  await expect(editor.getByLabel("Meal name", { exact: true })).toHaveCount(0);
  delete api.readErrors["/meals/1"];
  await editor.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(editor.getByLabel("Meal name", { exact: true })).toHaveValue("Huevos a la mexicana");
});
