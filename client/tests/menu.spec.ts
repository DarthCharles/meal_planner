import { test, expect } from "./fixtures/app";

test("opens the selected hero meal with its ingredients and recipe", async ({
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
  await expect(
    dialog.getByText("Eggs with tomato, onion, and chile."),
  ).toBeVisible();
  await expect(
    dialog.getByRole("region", { name: "Ingredients" }).getByRole("listitem"),
  ).toHaveText("2 pieza · Eggbeaten");
  await expect(
    dialog.getByRole("link", { name: "Open recipe" }),
  ).toHaveAttribute("href", "https://example.com/huevos");
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  expect(Object.keys(api.reads)).toEqual(["/menus"]);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
  expect(api.saves).toEqual([]);
});

test("opens weekly meal rows with the keyboard and handles missing recipe details", async ({
  page,
  api,
}) => {
  await page.goto("/");
  const day = page
    .getByRole("article")
    .filter({
      has: page.getByRole("heading", { name: "Monday", exact: true }),
    });
  const row = day.getByRole("button", {
    name: "View Lunch: Calabacitas con queso",
  });
  await row.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Calabacitas con queso" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Tender squash with corn and queso fresco."),
  ).toBeVisible();
  await expect(dialog.getByText("No ingredients added yet.")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Open recipe" })).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(row).toBeFocused();
  await page.keyboard.press("Space");
  await expect(dialog).toBeVisible();
  expect(Object.keys(api.reads)).toEqual(["/menus"]);
  expect(api.saves).toEqual([]);
});

test("summarizes today's actual meals and leaves the library focused on meals", async ({
  page,
  api,
}) => {
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
  const heroBox = await hero.boundingBox();
  expect(heroBox!.height).toBeLessThan(274);
  const initialMenuReads = api.reads["/menus"];
  const nav = page.getByRole("navigation");
  await nav.getByRole("button", { name: /My meals/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your meal library" }),
  ).toBeVisible();
  await expect(hero).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Plan my week" })).toHaveCount(
    0,
  );
  await nav.getByRole("button", { name: /My menu/ }).click();
  await expect(hero).toBeVisible();
  expect(api.reads["/menus"]).toBe(initialMenuReads);
});

for (const [label, from, to] of [
  ["past", "2026-10-12", "2026-10-18"],
  ["future", "2026-10-26", "2026-11-01"],
]) {
  test(`does not present a ${label} menu as today's meals`, async ({
    page,
    api,
  }) => {
    api.menus[0].from = `${from}T00:00:00Z`;
    api.menus[0].to = `${to}T23:59:59Z`;
    await page.goto("/");
    await expect(
      page.getByRole("region", { name: "Your week, planned." }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Today’s menu" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("article").getByText("Today", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Plan my week" }),
    ).toBeEnabled();
  });
}

test("handles a current menu without meals for today", async ({
  page,
  api,
}) => {
  api.menus[0].days[2].meals = [];
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Nothing planned for today." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Plan my week" }),
  ).toBeEnabled();
});

test("keeps today's overview available when the latest plan is for next week", async ({
  page,
  api,
}) => {
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
  await expect(
    page.getByRole("heading", { name: "Oct 26 — Nov 1" }),
  ).toBeVisible();
});

test("keeps long meal names readable without horizontal overflow", async ({
  page,
  api,
}) => {
  const name =
    "Roasted vegetables with rice, beans, salsa, and freshly made tortillas";
  api.menus[0].days[2].meals[0].name = name;
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Today’s menu" });
  await expect(hero.getByText(name)).toBeVisible();
  expect(
    await hero
      .getByText(name)
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("allows retrying planning from the hero after an empty-state error", async ({
  page,
  api,
}) => {
  api.menus = [];
  api.generationError = "Could not plan this week. Try again.";
  await page.goto("/");
  const plan = page.getByRole("button", { name: "Plan my week" });
  await plan.click();
  await expect(page.getByText(api.generationError)).toBeVisible();
  await expect(plan).toBeEnabled();
  await expect(
    page.getByRole("region", { name: "Make this week delicious." }),
  ).toBeVisible();
  api.generationError = null;
  await plan.click();
  await expect(
    page.getByRole("region", { name: "Today’s menu" }),
  ).toBeVisible();
  expect(api.generationRequests).toBe(2);
});

test("shows today's menu first and adapts the grid and navigation", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(3);
  await expect(cards.first().getByRole("heading")).toHaveText("Wednesday");
  await expect(cards.first().getByText("Today", { exact: true })).toBeVisible();
  await expect(cards.nth(1).getByRole("heading")).toHaveText("Monday");
  await expect(
    cards.first().getByText("Huevos a la mexicana", { exact: true }),
  ).toBeVisible();

  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(navigation).toHaveCount(1);
  const width = page.viewportSize()!.width;
  const navBox = await navigation.boundingBox();
  expect(navBox).not.toBeNull();
  if (width < 760) expect(navBox!.y).toBeGreaterThan(700);
  else expect(navBox!.y).toBeLessThan(100);

  const boxes = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const { x, y } = element.getBoundingClientRect();
      return { x, y };
    }),
  );
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
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("disables planning while the initial menu is loading", async ({
  page,
  api,
}) => {
  let release!: () => void;
  api.initialBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Plan my week" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Your next menu" }),
  ).toBeVisible();
  release();
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Plan my week" }),
  ).toBeEnabled();
});

test("generates a menu from the empty state with planning feedback", async ({
  page,
  api,
}) => {
  api.menus = [];
  let release!: () => void;
  api.generationBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Make this week delicious." });
  await expect(hero).toBeVisible();
  await expect(page.getByRole("button", { name: "Plan my week" })).toHaveCount(
    1,
  );
  await hero.getByRole("button", { name: "Plan my week" }).click();
  await expect(page.getByRole("button", { name: "Planning" })).toBeDisabled();
  release();
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Make this week delicious." }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Today’s menu" }),
  ).toBeVisible();
  expect(api.generationRequests).toBe(1);
});

test("keeps the current menu when generation fails and allows retrying", async ({
  page,
  api,
}) => {
  api.generationError = "Could not plan this week. Try again.";
  await page.goto("/");
  await page.getByRole("button", { name: "Plan my week" }).click();
  await expect(page.getByText(api.generationError)).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(3);
  api.generationError = null;
  await page.getByRole("button", { name: "Plan my week" }).click();
  await expect(
    page.getByText("Could not plan this week. Try again."),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Plan my week" }),
  ).toBeEnabled();
  expect(api.generationRequests).toBe(2);
});

test("falls back to demo data when the API is unavailable", async ({
  page,
  api,
}) => {
  api.unavailable = true;
  await page.goto("/");
  await expect(
    page.getByText("Demo mode · connect the Rails API to use your own meals."),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(3);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /My meals/ })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit Avena cocida", exact: true }),
  ).toBeVisible();
});

test("keeps reference query failures inside the modal", async ({
  page,
  api,
}) => {
  api.readErrors["/units"] = "Units are unavailable.";
  api.menus[0].days[0].weekday = "Thursday";
  api.meals[0].name = "Breakfast from the API";
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Thursday" })).toBeVisible();
  await expect(
    page.getByText("Demo mode · connect the Rails API to use your own meals."),
  ).toHaveCount(0);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Add meal/ })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText(
      "Demo mode · connect the Rails API to use your own meals.",
    ),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thursday" })).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /My meals/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Breakfast from the API" }),
  ).toBeVisible();
});

test("loads each resource only when its screen or form needs it", async ({
  page,
  api,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  expect(Object.keys(api.reads)).toEqual(["/menus"]);
  const nav = page.getByRole("navigation");
  await nav.getByRole("button", { name: /My meals/ }).click();
  await expect(
    page.getByRole("heading", { name: "Your meal library" }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(3);
  expect(Object.keys(api.reads).sort()).toEqual(["/meals", "/menus"]);
  await nav.getByRole("button", { name: /Add meal/ }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "breakfast", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Save meal", exact: true }),
  ).toBeEnabled();
  expect(Object.keys(api.reads).sort()).toEqual([
    "/meal_types",
    "/meals",
    "/menus",
    "/units",
  ]);
});

test("creating a meal from the menu does not eagerly load the library", async ({
  page,
  api,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  const nav = page.getByRole("navigation");
  await nav.getByRole("button", { name: /Add meal/ }).click();
  const dialog = page.getByRole("dialog");
  await page.getByLabel("Meal name", { exact: true }).fill("New breakfast");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Fresh from the kitchen.");
  await dialog.getByRole("button", { name: "breakfast", exact: true }).click();
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.reads["/meals"]).toBeUndefined();
  await nav.getByRole("button", { name: /My meals/ }).click();
  await expect(
    page.getByRole("heading", { name: "New breakfast" }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(4);
});
