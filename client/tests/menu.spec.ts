import { test, expect } from "./fixtures/app";

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
  await page.getByRole("button", { name: "Create my first menu" }).click();
  await expect(page.getByRole("button", { name: "Planning" })).toBeDisabled();
  release();
  await expect(page.getByRole("heading", { name: "Wednesday" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your week is a blank page." }),
  ).toHaveCount(0);
  expect(api.generationRequests).toBe(1);
});

test("keeps the current menu when generation fails and allows retrying", async ({
  page,
  api,
}) => {
  api.generationError = "Could not plan this week. Try again.";
  await page.goto("/");
  await page.getByRole("button", { name: "Plan my week" }).click();
  await expect(
    page.getByText(api.generationError),
  ).toBeVisible();
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
