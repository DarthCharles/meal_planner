import { test, expect, navigateTo } from "./fixtures/app";

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
  await expect(
    dialog.getByText("Eggs with tomato, onion, and chile."),
  ).toBeVisible();
  await expect(
    dialog.getByRole("region", { name: "Ingredients" }).getByRole("listitem"),
  ).toHaveText("2 pieces · Eggbeaten");
  await expect(
    dialog.getByRole("link", { name: "Open recipe" }),
  ).toHaveAttribute("href", "https://example.com/huevos");
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
  expect(Object.keys(api.reads)).toEqual(["/menus"]);
  await dialog.getByRole("button", { name: "Edit meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const editor = page.getByRole("dialog", { name: "Edit meal", exact: true });
  await expect(editor.getByLabel("Meal name", { exact: true })).toHaveValue("Huevos a la mexicana");
  await expect(editor.getByRole("textbox", { name: "Description", exact: true }))
    .toHaveValue("Eggs with tomato, onion, and chile.");
  await editor.getByRole("button", { name: "Close", exact: true }).click();
  await expect(editor).toHaveCount(0);
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

test("summarizes today's actual meals and leaves the library focused on meals", { tag: "@responsive" }, async ({
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
  const cards = hero.getByRole("button", { name: /^View / });
  await expect(cards).toHaveCount(3);
  const boxes = await cards.evaluateAll((elements) => elements.map((element) => {
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  }));
  for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44);
  if (page.viewportSize()!.width >= 641) {
    expect(boxes.map((box) => box.y)).toEqual(Array(3).fill(boxes[0].y));
    expect(boxes.map((box) => box.height)).toEqual(Array(3).fill(boxes[0].height));
    expect(boxes[1].x).toBeGreaterThanOrEqual(boxes[0].x + boxes[0].width);
    expect(boxes[2].x).toBeGreaterThanOrEqual(boxes[1].x + boxes[1].width);
  } else {
    expect(boxes[1].y).toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height);
    expect(boxes[2].y).toBeGreaterThanOrEqual(boxes[1].y + boxes[1].height);
  }
  // The overview should leave the weekly plan visible below it.
  await expect(page.getByRole("article").first()).toBeInViewport();
  const initialMenuReads = api.reads["/menus"];
  await navigateTo(page, "My meals");
  await expect(
    page.getByRole("heading", { name: "Your meal library" }),
  ).toBeVisible();
  await expect(hero).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("button", { name: "Plan my week" })).toBeEnabled();
  await navigateTo(page, "My menu");
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
      page.getByRole("heading", { name: "Nothing planned for this week." }),
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

test("keeps the current week visible when an upcoming plan exists", async ({
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
    page.getByRole("heading", { name: "Oct 19 — Oct 25" }),
  ).toBeVisible();
});

test("keeps long meal names readable without horizontal overflow", { tag: "@responsive" }, async ({
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

test("shows today's menu first and adapts the grid and navigation", { tag: "@responsive" }, async ({
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
  const width = page.viewportSize()!.width;
  if (width < 760) {
    await expect(navigation).toHaveCount(1);
    const navBox = await navigation.boundingBox();
    expect(navBox!.y).toBeGreaterThan(700);
  } else {
    await expect(navigation).toHaveCount(0);
    await page.getByRole("button", { name: "Open actions" }).click();
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link", { name: "My Menu" })).toHaveAttribute("aria-current", "page");
    await expect(navigation.getByRole("link", { name: "My Meals" })).toBeVisible();
    await page.keyboard.press("Escape");
  }

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

test("retries failed empty-state planning and shows pending feedback before the menu", async ({
  page,
  api,
}) => {
  api.menus = [];
  api.generationError = "Could not plan this week. Try again.";
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Make this week delicious." });
  await expect(hero).toBeVisible();
  await expect(page.getByRole("button", { name: "Plan my week" })).toHaveCount(
    1,
  );
  await page.getByRole("button", { name: "Plan my week" }).click();
  await expect(page.getByText(api.generationError)).toBeVisible();
  await expect(hero).toBeVisible();
  await expect(page.getByRole("button", { name: "Plan my week" })).toBeEnabled();
  api.generationError = null;
  let release!: () => void;
  api.generationBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.getByRole("banner").getByRole("button", { name: "Plan my week" }).click();
  await expect(page.getByRole("button", { name: "Planning" })).toBeDisabled();
  release();
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Make this week delicious." }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Today’s menu" }),
  ).toBeVisible();
  expect(api.generationRequests).toBe(2);
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
  await navigateTo(page, "My meals");
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
  await page.getByRole("button", { name: "Open actions" }).click();
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText(
      "Demo mode · connect the Rails API to use your own meals.",
    ),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thursday" })).toBeVisible();
  await navigateTo(page, "My meals");
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
  await navigateTo(page, "My meals");
  await expect(
    page.getByRole("heading", { name: "Your meal library" }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(3);
  expect(Object.keys(api.reads).sort()).toEqual(["/meals", "/menus"]);
  await page.getByRole("button", { name: "Open actions" }).click();
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Breakfast", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Save meal", exact: true }),
  ).toBeEnabled();
  expect(Object.keys(api.reads).sort()).toEqual([
    "/ingredients",
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
  await page.getByRole("button", { name: "Open actions" }).click();
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await page.getByLabel("Meal name", { exact: true }).fill("New breakfast");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Fresh from the kitchen.");
  await dialog.getByRole("button", { name: "Breakfast", exact: true }).click();
  await dialog.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.reads["/meals"]).toBeUndefined();
  await navigateTo(page, "My meals");
  await expect(
    page.getByRole("heading", { name: "New breakfast" }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(4);
});

test("keeps the planning action beside MC on both screens without overflow", { tag: "@responsive" }, async ({ page, api }) => {
  await page.goto("/");
  await page.getByRole("heading", { name: "Wednesday" }).waitFor();
  for (const view of ["My menu", "My meals"] as const) {
    if (view === "My meals") await navigateTo(page, view);
    const header = page.getByRole("banner");
    const plan = header.getByRole("button", { name: "Plan my week" });
    const avatar = header.getByRole("button", { name: "Open actions" });
    await expect(plan).toBeEnabled();
    await expect(page.getByRole("main").getByRole("button", { name: "Plan my week" })).toHaveCount(0);
    const planBox = (await plan.boundingBox())!;
    const avatarBox = (await avatar.boundingBox())!;
    expect(planBox.x + planBox.width).toBeLessThanOrEqual(avatarBox.x);
    expect(Math.abs(planBox.y + planBox.height / 2 - avatarBox.y - avatarBox.height / 2)).toBeLessThan(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("banner").getByRole("button", { name: "Plan my week" }).click();
  await expect.poll(() => api.generationRequests).toBe(1);
  await expect(page.getByRole("banner").getByRole("button", { name: "Plan my week" })).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Your meal library" })).toBeVisible();
  await navigateTo(page, "My menu");
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
});

test("shows preference fallbacks after generation and on reload", async ({ page, api }) => {
  const notice = "Pizza was scheduled on Monday to complete the menu; its preferred days are Friday, Saturday, Sunday.";
  api.generationNotices = [notice];
  await page.goto("/");
  await page.getByRole("button", { name: "Plan my week" }).click();
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload();
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
});
