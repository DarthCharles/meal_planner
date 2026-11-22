import { cancelEditor, editorScreen, expect, navigateTo, test } from "./fixtures/app";

test.beforeEach(({ api }) => {
  const menu = api.menus[0];
  for (const [index, weekday] of ["Thursday", "Friday", "Saturday", "Sunday"].entries()) {
    menu.days.push({ ...structuredClone(menu.days[0]), weekday, id: index + 4 });
  }
});

test("returns to the menu through the Comal logo and name", async ({ page }) => {
  await page.goto("/");
  for (const target of ["logo", "name", "keyboard"]) {
    await navigateTo(page, "My meals");
    const home = page.getByRole("link", { name: "Comal home" });
    await expect(home).toHaveAttribute("href", "/");
    if (target === "logo") {
      await home.locator("svg").click();
    } else if (target === "name") {
      await home.getByRole("heading", { name: "comal", exact: true }).click();
    } else {
      await home.focus();
      await page.keyboard.press("Enter");
    }
    await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
  }
});

test("opens hero meal details, replaces them with editing, and restores focus", async ({
  page,
  api,
}) => {
  await page.goto("/");
  const row = page
    .getByRole("region", { name: "Today’s menu" })
    .getByRole("button", { name: "View Breakfast: Huevos a la mexicana" });
  await row.click();
  const dialog = page.getByRole("dialog", { name: "Huevos a la mexicana" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Eggs with tomato, onion, and chile.")).toBeVisible();
  await expect(
    dialog.getByRole("region", { name: "Ingredients" }).getByRole("listitem"),
  ).toHaveText("2 pieces · Eggbeaten");
  await expect(dialog.getByRole("link", { name: "Open recipe" })).toHaveAttribute(
    "href",
    "https://example.com/huevos",
  );
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  expect(Object.keys(api.reads)).toEqual(["/menus"]);
  await dialog.getByRole("button", { name: "Edit meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const editor = page.getByRole("region", { name: "Edit meal", exact: true });
  await expect(editor.getByLabel("Meal name", { exact: true })).toHaveValue("Huevos a la mexicana");
  await expect(editor.getByRole("textbox", { name: "Description", exact: true })).toHaveValue(
    "Eggs with tomato, onion, and chile.",
  );
  await cancelEditor(page);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(row).toBeFocused();
  expect(api.saves).toEqual([]);
});

test("hero and weekly meal rows highlight on hover", async ({ page }) => {
  await page.goto("/");
  const heroRow = page
    .getByRole("region", { name: "Today’s menu" })
    .getByRole("button", { name: "View Breakfast: Huevos a la mexicana" });
  const weeklyRow = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Thursday", exact: true }) })
    .getByRole("button", { name: "View Lunch: Calabacitas con queso" });

  for (const row of [heroRow, weeklyRow]) {
    await row.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const background = await row.evaluate((element) => getComputedStyle(element).backgroundColor);
    await row.hover();
    await expect
      .poll(() => row.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(background);
    await page.mouse.move(0, 0);
    await expect
      .poll(() => row.evaluate((element) => getComputedStyle(element).backgroundColor))
      .toBe(background);
  }
});

test("opens weekly meal rows with the keyboard and handles missing recipe details", async ({
  page,
  api,
}) => {
  await page.goto("/");
  const day = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Thursday", exact: true }),
  });
  const row = day.getByRole("button", {
    name: "View Lunch: Calabacitas con queso",
  });
  await row.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Calabacitas con queso" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Tender squash with corn and queso fresco.")).toBeVisible();
  await expect(dialog.getByText("No ingredients added yet.")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Open recipe" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
  await page.keyboard.press("Space");
  await expect(dialog).toBeVisible();
  expect(Object.keys(api.reads)).toEqual(["/menus"]);
  expect(api.saves).toEqual([]);
});

test(
  "summarizes today's actual meals and leaves the library focused on meals",
  { tag: "@responsive" },
  async ({ page, api }) => {
    api.menus[0].days[2].meals = api.menus[0].days[2].meals.map((meal, index) =>
      index === 0 ? { ...meal, name: "Wednesday breakfast" } : meal,
    );
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Today’s menu" });
    await expect(hero.getByText("Wednesday, Oct 21")).toBeVisible();
    await expect(hero.getByText("Breakfast", { exact: true })).toBeVisible();
    await expect(hero.getByText("Wednesday breakfast")).toBeVisible();
    await expect(hero.getByText("Lunch", { exact: true })).toBeVisible();
    await expect(hero.getByText("Calabacitas con queso")).toBeVisible();
    await expect(hero.getByText("Dinner", { exact: true })).toBeVisible();
    await expect(hero.getByText("Avena cocida")).toBeVisible();
    await expect(hero.getByText("Huevos a la mexicana")).toHaveCount(0);
    const cards = hero.getByRole("button", { name: /^View / });
    await expect(cards).toHaveCount(3);
    const boxes = await cards.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
    for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44);
    if (page.viewportSize()!.width >= 901) {
      expect(boxes.map((box) => box.y)).toEqual(Array(3).fill(boxes[0].y));
      expect(boxes.map((box) => box.height)).toEqual(Array(3).fill(boxes[0].height));
      expect(boxes[1].x).toBeGreaterThanOrEqual(boxes[0].x + boxes[0].width);
      expect(boxes[2].x).toBeGreaterThanOrEqual(boxes[1].x + boxes[1].width);
      if (page.viewportSize()!.width >= 1100) {
        const headingBox = await hero.getByRole("heading", { name: "Today’s menu" }).boundingBox();
        expect(headingBox).not.toBeNull();
        const shoppingBox = await hero.getByRole("link", { name: "Shopping list" }).boundingBox();
        expect(shoppingBox!.x).toBeGreaterThan(headingBox!.x);
        expect(shoppingBox!.y).toBeLessThan(boxes[0].y);
      }
    } else {
      expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height);
      expect(boxes[2].y).toBeGreaterThanOrEqual(boxes[1].y + boxes[1].height);
    }
    // The overview should leave the weekly plan visible below it.
    await expect(page.getByRole("article").first()).toBeInViewport();
    const initialMenuReads = api.reads["/menus"];
    await navigateTo(page, "My meals");
    await expect(page.getByRole("heading", { name: "Your meal library" })).toBeVisible();
    await expect(hero).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Plan next week" })).toHaveCount(0);
    await navigateTo(page, "My menu");
    await expect(hero).toBeVisible();
    expect(api.reads["/menus"]).toBe(initialMenuReads);
  },
);

for (const [label, from, to] of [
  ["past", "2026-10-12", "2026-10-18"],
  ["future", "2026-10-26", "2026-11-01"],
]) {
  test(`does not present a ${label} menu as today's meals`, async ({ page, api }) => {
    api.menus[0].from = `${from}T00:00:00Z`;
    api.menus[0].to = `${to}T23:59:59Z`;
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Nothing planned for this week." }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Today’s menu" })).toHaveCount(0);
    await expect(page.getByRole("article").getByText("Today", { exact: true })).toHaveCount(0);
    if (label === "future") {
      await expect(page.getByRole("link", { name: "View next week’s menu" })).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "Plan next week" })).toBeEnabled();
    }
  });
}

test("handles a current menu without meals for today", async ({ page, api }) => {
  api.menus[0].days[2].meals = [];
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Nothing planned for today." });
  await expect(hero.getByText("Next on the menu: Thursday, Oct 22.")).toBeVisible();
  await expect(hero.getByRole("link", { name: "Shopping list" })).toBeVisible();
});

test("keeps the current week visible when an upcoming plan exists", async ({ page, api }) => {
  const futureMenu = structuredClone(api.menus[0]);
  futureMenu.id = 2;
  futureMenu.from = "2026-10-26T00:00:00Z";
  futureMenu.to = "2026-11-01T23:59:59Z";
  futureMenu.days[2].meals[0].name = "Next week's breakfast";
  api.menus.unshift(futureMenu);
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Today’s menu" });
  await expect(hero.getByText("Huevos a la mexicana")).toBeVisible();
  await expect(hero.getByText("Next week's breakfast")).toHaveCount(0);
  await expect(hero.getByRole("link", { name: "Shopping list" })).toHaveAccessibleDescription(
    "Oct 19 — Oct 25",
  );
  await expect(page.getByRole("link", { name: "View next week’s menu" })).toBeVisible();
});

test(
  "keeps long meal names readable without horizontal overflow",
  { tag: "@responsive" },
  async ({ page, api }) => {
    const name = "Roasted vegetables with rice, beans, salsa, and freshly made tortillas";
    api.menus[0].days[2].meals[0].name = name;
    await page.goto("/");
    const hero = page.getByRole("region", { name: "Today’s menu" });
    await expect(hero.getByText(name)).toBeVisible();
    expect(
      await hero.getByText(name).evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  },
);

test(
  "shows the full current week in order and keeps navigation in the header menu",
  { tag: "@responsive" },
  async ({ page }) => {
    await page.goto("/");
    const cards = page.getByRole("region", { name: "This week" }).getByRole("article");
    await expect(cards.getByRole("heading")).toHaveText([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    const wednesday = cards.filter({
      has: page.getByRole("heading", { name: "Wednesday", exact: true }),
    });
    await expect(wednesday.getByText("Today", { exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();

    const navigation = page.getByRole("navigation", {
      name: "Primary navigation",
    });
    const menuButton = page.getByRole("button", { name: "Menu", exact: true });
    await expect(navigation).toHaveCount(0);
    await menuButton.click();
    await expect(navigation.getByRole("link")).toHaveText([
      "My Menu",
      "My Meals",
      "My Ingredients",
      "Saved Menus",
    ]);
    await expect(navigation.getByRole("link", { name: "My Menu", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.keyboard.press("Escape");
    await expect(navigation).toHaveCount(0);
    await expect(menuButton).toBeFocused();

    const boxes = await cards.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y } = element.getBoundingClientRect();
        return { x, y };
      }),
    );
    const width = page.viewportSize()!.width;
    if (width <= 640) {
      expect(boxes[1].x).toBe(boxes[0].x);
      expect(boxes[1].y).toBeGreaterThan(boxes[0].y);
    } else if (width <= 900) {
      expect(boxes[1].y).toBe(boxes[0].y);
      expect(boxes[2].y).toBeGreaterThan(boxes[0].y);
    } else {
      expect(boxes[2].y).toBe(boxes[0].y);
      expect(boxes[2].x).toBeGreaterThan(boxes[1].x);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  },
);

test("waits for the initial menu before offering planning", async ({ page, api }) => {
  let release!: () => void;
  api.initialBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/");
  await expect(page.getByText("Finding your menu…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Plan next week" })).toHaveCount(0);
  release();
  await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Plan next week" })).toBeEnabled();
});

test("retries failed empty-state planning and offers the generated upcoming plan", async ({
  page,
  api,
}) => {
  api.menus = [];
  api.generationError = "Could not plan this week. Try again.";
  await page.goto("/");
  const empty = page.getByRole("heading", { name: "Nothing planned for this week." });
  const plan = page.getByRole("button", { name: "Plan next week" });
  await expect(empty).toBeVisible();
  await plan.click();
  await expect(page.getByText(api.generationError)).toBeVisible();
  await expect(plan).toBeEnabled();
  api.generationError = null;
  let release!: () => void;
  api.generationBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await plan.click();
  await expect(page.getByRole("button", { name: "Planning…" })).toBeDisabled();
  release();
  await expect(page.getByRole("link", { name: "View next week’s menu" })).toBeVisible();
  await expect(empty).toBeVisible();
  await expect(page.getByRole("region", { name: "Today’s menu" })).toHaveCount(0);
  expect(api.generationRequests).toBe(2);
});

test("keeps the current menu when generation fails and allows retrying", async ({ page, api }) => {
  api.generationError = "Could not plan this week. Try again.";
  await page.goto("/");
  const plan = page.getByRole("button", { name: "Plan next week" });
  await plan.click();
  await expect(page.getByText(api.generationError)).toBeVisible();
  await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
  api.generationError = null;
  await plan.click();
  await expect(page.getByRole("link", { name: "View next week’s menu" })).toBeVisible();
  await expect(page.getByText("Could not plan this week. Try again.")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
  expect(api.generationRequests).toBe(2);
});

test("recovers the menu after a load failure without showing example meals", async ({
  page,
  api,
}) => {
  api.readErrors["/menus"] = "Internal connection details";
  await page.goto("/");
  await expect(page.getByText("We couldn’t load your menu. Please try again.")).toBeVisible();
  await expect(page.getByText("Internal connection details")).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Add (your first |a )recipe/ })).toHaveCount(0);
  delete api.readErrors["/menus"];
  let release!: () => void;
  api.readBarriers["/menus"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Finding your menu…" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Plan next week" })).toHaveCount(0);
  release();
  await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
  await expect(page.getByText("We couldn’t load your menu. Please try again.")).toHaveCount(0);
  await expect(page.getByRole("article")).toHaveCount(7);
});

test("keeps reference query failures inside the modal", async ({ page, api }) => {
  api.readErrors["/units"] = "Units are unavailable.";
  api.meals[0].name = "Breakfast from the API";
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Thursday" })).toBeVisible();
  await expect(
    page.getByText("We couldn’t load your saved data. Showing examples for now."),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  const dialog = editorScreen(page);
  await expect(
    dialog.getByText("We couldn’t load your saved data. Showing examples for now."),
  ).toBeVisible();
  await cancelEditor(page);
  await expect(page.getByRole("heading", { name: "Thursday" })).toBeVisible();
  await navigateTo(page, "My meals");
  await expect(page.getByRole("heading", { name: "Breakfast from the API" })).toBeVisible();
});

test("loads each resource only when its screen or form needs it", async ({ page, api }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
  expect(Object.keys(api.reads)).toEqual(["/menus"]);
  await navigateTo(page, "My meals");
  await expect(page.getByRole("heading", { name: "Your meal library" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(3);
  expect(Object.keys(api.reads).sort()).toEqual(["/meals", "/menus"]);
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  await expect(
    editorScreen(page).getByRole("button", { name: "Breakfast", exact: true }),
  ).toBeVisible();
  await expect(
    editorScreen(page).getByRole("button", { name: "Save meal", exact: true }),
  ).toBeEnabled();
  expect(Object.keys(api.reads).sort()).toEqual([
    "/ingredients",
    "/meal_types",
    "/meals",
    "/menus",
    "/units",
  ]);
});

test("creating a meal from the menu does not eagerly load the library", async ({ page, api }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  const dialog = editorScreen(page);
  await page.getByLabel("Meal name", { exact: true }).fill("New breakfast");
  await page.getByLabel("Recipe servings", { exact: true }).fill("2");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Fresh from the kitchen.");
  await dialog.getByRole("button", { name: "Breakfast", exact: true }).click();
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.reads["/meals"]).toBeUndefined();
  await navigateTo(page, "My meals");
  await expect(page.getByRole("heading", { name: "New breakfast" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(4);
});

test("keeps a pending plan from being submitted again after navigating home", async ({
  page,
  api,
}) => {
  let release!: () => void;
  api.generationBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/");
  const planning = page.getByRole("region", { name: "Next week" });
  await planning.getByRole("button", { name: "Plan next week" }).click();
  await expect.poll(() => api.generationRequests).toBe(1);
  await navigateTo(page, "My meals");
  await expect(planning).toHaveCount(0);
  await navigateTo(page, "My menu");
  await expect(planning.getByRole("button", { name: "Planning…" })).toBeDisabled();
  release();
  await expect(planning.getByRole("link", { name: "View next week’s menu" })).toBeVisible();
  expect(api.generationRequests).toBe(1);
});

test("confirms the replacement week and shows the new plan’s notices after reload", async ({
  page,
  api,
}) => {
  const notice =
    "Pizza was scheduled on Monday to complete the menu; its preferred days are Friday, Saturday, Sunday.";
  api.generationNotices = [notice];
  await page.goto("/");
  await page.getByRole("button", { name: "Plan next week" }).click();
  const regenerate = page.getByRole("button", { name: "Regenerate menu" });
  const confirm = page.getByRole("dialog", { name: "Replace next week’s menu?" });
  await regenerate.click();
  await expect(
    confirm.getByText("This will replace the meals planned for Oct 26, 2026 — Nov 1, 2026."),
  ).toBeVisible();
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(regenerate).toBeFocused();
  expect(api.generationRequests).toBe(1);
  await regenerate.click();
  await confirm.getByRole("button", { name: "Replace menu" }).click();
  await expect(regenerate).toBeEnabled();
  expect(api.generationRequests).toBe(2);
  await page.getByRole("link", { name: "View next week’s menu" }).click();
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
});
