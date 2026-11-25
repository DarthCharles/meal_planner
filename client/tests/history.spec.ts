import { editorScreen, expect, navigateTo, test } from "./fixtures/app";
import { menu } from "./fixtures/data";

function savedMenu(id: number, from: string, to: string, name: string) {
  const saved = structuredClone(menu);
  saved.id = id;
  saved.from = `${from}T00:00:00Z`;
  saved.to = `${to}T23:59:59Z`;
  saved.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
    (weekday, index) => ({
      id: id * 10 + index,
      weekday,
      meals: saved.days[0].meals.map((meal, slot) => (slot === 0 ? { ...meal, name } : meal)),
    }),
  );
  return saved;
}

test(
  "browses upcoming, current, and past weeks newest first and opens their meals",
  { tag: "@responsive" },
  async ({ page, api }) => {
    const older = savedMenu(2, "2025-12-29", "2026-01-04", "New year breakfast");
    const recent = savedMenu(3, "2026-10-12", "2026-10-18", "Last week's breakfast");
    recent.generation_notices = ["A preference needed a fallback in this saved week."];
    const upcoming = savedMenu(4, "2026-10-26", "2026-11-01", "Future breakfast");
    // A week ending today must still be labeled Current.
    const endingToday = savedMenu(5, "2026-10-15", "2026-10-21", "Today breakfast");
    api.menus = [older, upcoming, api.menus[0], recent, endingToday];
    await page.goto("/saved-menus");
    await expect(page.getByRole("heading", { name: "Saved Menus", exact: true })).toBeVisible();
    const weeks = page.getByRole("navigation", { name: "Saved weeks" }).getByRole("button");
    await expect(weeks).toHaveText([
      "Oct 26, 2026 — Nov 1, 2026Upcoming",
      "Oct 19, 2026 — Oct 25, 2026Current",
      "Oct 15, 2026 — Oct 21, 2026Current",
      "Oct 12, 2026 — Oct 18, 2026Past",
      "Dec 29, 2025 — Jan 4, 2026Past",
    ]);
    await expect(weeks.first()).toHaveAttribute("aria-current", "true");
    await expect(page.getByRole("article").getByRole("heading")).toHaveText([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    await expect(page.getByRole("article").getByText("Today", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("article").first().getByText("Future breakfast")).toBeVisible();
    expect(Object.keys(api.reads).sort()).toEqual(["/menus/4", "/menus/summaries"]);
    await weeks.nth(3).click();
    await expect(page.getByText(recent.generation_notices[0])).toBeVisible();
    await weeks.nth(4).focus();
    await page.keyboard.press("Enter");
    await expect(weeks.nth(4)).toHaveAttribute("aria-current", "true");
    await expect(page.getByText(recent.generation_notices[0])).toHaveCount(0);
    const row = page
      .getByRole("article")
      .first()
      .getByRole("button", { name: "View Breakfast: New year breakfast" });
    await row.click();
    const dialog = page.getByRole("dialog", { name: "New year breakfast" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("2 pieces · Eggbeaten")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(row).toBeFocused();
    expect(Object.keys(api.reads).sort()).toEqual([
      "/menus/2",
      "/menus/3",
      "/menus/4",
      "/menus/summaries",
    ]);
    expect(api.generationRequests).toBe(0);
    expect(api.saves).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await navigateTo(page, "My menu");
    await expect(page.getByRole("heading", { name: "Saved Menus", exact: true })).toHaveCount(0);
  },
);

test("shows an empty state when no saved menus exist", async ({ page, api }) => {
  api.menus = [];
  await page.goto("/");
  await navigateTo(page, "Saved Menus");
  await expect(page.getByRole("heading", { name: "No saved menus yet" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("shows loading before displaying past weeks", async ({ page, api }) => {
  api.menus = [savedMenu(2, "2026-10-12", "2026-10-18", "Saved breakfast")];
  let release!: () => void;
  api.initialBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/");
  await navigateTo(page, "Saved Menus");
  await expect(page.getByText("Loading saved menus…")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No saved menus yet" })).toHaveCount(0);
  release();
  await expect(page.getByRole("navigation", { name: "Saved weeks" })).toBeVisible();
  await expect(page.getByText("Loading saved menus…")).toHaveCount(0);
});

test("retries the history list and selected week independently", async ({ page, api }) => {
  api.readErrors["/menus/summaries"] = "Could not load saved menus.";
  api.menus = [savedMenu(2, "2026-10-12", "2026-10-18", "Saved breakfast")];
  await page.goto("/saved-menus");
  await expect(page.getByText("Could not load saved menus.")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No saved menus yet" })).toHaveCount(0);
  const failedListReads = api.reads["/menus/summaries"];
  delete api.readErrors["/menus/summaries"];
  api.readErrors["/menus/2"] = "Could not load this week.";
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Saved weeks" })).toBeVisible();
  await expect(page.getByText("Could not load saved menus.")).toHaveCount(0);
  await expect(page.getByText("Could not load this week.")).toBeVisible();
  expect(api.reads["/menus/summaries"]).toBe(failedListReads + 1);
  delete api.readErrors["/menus/2"];
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("article").first().getByText("Saved breakfast")).toBeVisible();
  expect(api.reads["/menus/summaries"]).toBe(failedListReads + 1);
});

test("resumes loading a saved week when a recipe is saved during its first read", async ({
  page,
  api,
}) => {
  let release!: () => void;
  api.readBarriers["/menus/1"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/saved-menus");
  await expect(page.getByText("Finding your menu…")).toBeVisible();
  await expect.poll(() => api.reads["/menus/1"] ?? 0).toBeGreaterThan(0);
  const initialReads = api.reads["/menus/1"];

  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  const editor = editorScreen(page);
  await editor.getByLabel("Meal name", { exact: true }).fill("New breakfast");
  await editor.getByLabel("Servings", { exact: true }).fill("2");
  await editor.getByLabel("Instructions", { exact: true }).fill("Fresh from the kitchen.");
  await editor.getByRole("button", { name: "Breakfast", exact: true }).click();
  await editor.getByRole("button", { name: "Save meal", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect.poll(() => api.reads["/menus/1"]).toBeGreaterThan(initialReads);

  release();
  await expect(page.getByRole("article").first()).toContainText("Huevos a la mexicana");
});

test("opens the regenerated week while the cached history list refreshes", async ({
  page,
  api,
}) => {
  const previous = savedMenu(2, "2026-10-26", "2026-11-01", "Previous breakfast");
  api.menus.unshift(previous);
  api.generationNotices = ["Notice from the regenerated week."];
  await page.goto("/saved-menus");
  await expect(page.getByRole("article").first()).toContainText("Previous breakfast");
  await navigateTo(page, "My menu");
  const regenerate = page.getByRole("button", { name: "Regenerate menu" });
  await regenerate.click();
  await page.getByRole("button", { name: "Replace menu" }).click();
  await expect.poll(() => api.menus[0].id).not.toBe(previous.id);
  await expect(regenerate).toBeEnabled();

  let release!: () => void;
  api.readBarriers["/menus/summaries"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  const summaryReads = api.reads["/menus/summaries"];
  await page.getByRole("link", { name: "View next week’s menu" }).click();
  await expect.poll(() => api.reads["/menus/summaries"]).toBeGreaterThan(summaryReads);
  await expect(page.getByText(api.generationNotices[0], { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Shopping list" })).toHaveAttribute(
    "href",
    `/menus/${api.menus[0].id}/shopping-list`,
  );
  release();
});

test.describe("history in a timezone west of UTC", () => {
  test.use({ timezoneId: "America/Hermosillo" });

  test("preserves calendar date labels and includes a week as soon as it ends locally", async ({
    page,
    api,
  }) => {
    await page.clock.setFixedTime(new Date("2026-10-19T07:00:00Z"));
    api.menus = [savedMenu(2, "2026-10-12", "2026-10-18", "Saved breakfast")];
    await page.goto("/");
    await navigateTo(page, "Saved Menus");
    await expect(
      page.getByRole("navigation", { name: "Saved weeks" }).getByRole("button"),
    ).toHaveText("Oct 12, 2026 — Oct 18, 2026Past");
  });
});

test("moves an upcoming menu into My Menu when its week starts", async ({ page, api }) => {
  const current = savedMenu(1, "2026-10-19", "2026-10-25", "This week's breakfast");
  const upcoming = savedMenu(2, "2026-10-26", "2026-11-01", "Next week's breakfast");
  api.menus = [upcoming, current];
  await page.clock.setFixedTime(new Date("2026-10-25T23:59:00Z"));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Shopping list" })).toHaveAccessibleDescription(
    "Oct 19 — Oct 25",
  );
  await navigateTo(page, "Saved Menus");
  const weeks = page.getByRole("navigation", { name: "Saved weeks" }).getByRole("button");
  await expect(weeks.first()).toContainText("Upcoming");
  await expect(weeks.nth(1)).toContainText("Current");

  await page.clock.setFixedTime(new Date("2026-10-26T00:01:00Z"));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Shopping list" })).toHaveAccessibleDescription(
    "Oct 26 — Nov 1",
  );
  await expect(
    page.getByRole("region", { name: "Today’s menu" }).getByText("Next week's breakfast"),
  ).toBeVisible();
  await navigateTo(page, "Saved Menus");
  await expect(weeks.first()).toContainText("Current");
  await expect(weeks.nth(1)).toContainText("Past");
  expect(api.generationRequests).toBe(0);
});

test("links from an empty current week to the upcoming saved plan", async ({ page, api }) => {
  api.menus = [
    savedMenu(3, "2026-11-02", "2026-11-08", "Later breakfast"),
    savedMenu(2, "2026-10-26", "2026-11-01", "Upcoming breakfast"),
  ];
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nothing planned for this week." })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await page.getByRole("link", { name: "View next week’s menu" }).click();
  await expect(page.getByRole("heading", { name: "Saved Menus", exact: true })).toBeVisible();
  const weeks = page.getByRole("navigation", { name: "Saved weeks" });
  await expect(weeks.getByRole("button", { name: /Oct 26/ })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByRole("article").first().getByText("Upcoming breakfast")).toBeVisible();
});
