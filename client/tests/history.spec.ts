import { test, expect, navigateTo } from "./fixtures/app";
import { menu } from "./fixtures/data";

function pastMenu(id: number, from: string, to: string, name: string) {
  const saved = structuredClone(menu);
  saved.id = id;
  saved.from = `${from}T00:00:00Z`;
  saved.to = `${to}T23:59:59Z`;
  saved.days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    .map((weekday, index) => ({
      id: id * 10 + index,
      weekday,
      meals: saved.days[0].meals.map((meal, slot) => slot === 0 ? { ...meal, name } : meal),
    }));
  return saved;
}

test("browses completed weeks newest first and opens their meals", async ({ page, api }) => {
  const older = pastMenu(2, "2025-12-29", "2026-01-04", "New year breakfast");
  const recent = pastMenu(3, "2026-10-12", "2026-10-18", "Last week's breakfast");
  recent.generation_notices = ["A preference needed a fallback in this saved week."];
  const upcoming = pastMenu(4, "2026-10-26", "2026-11-01", "Future breakfast");
  // Include a week ending today: it is still current, not history.
  const endingToday = pastMenu(5, "2026-10-15", "2026-10-21", "Today breakfast");
  api.menus = [older, upcoming, api.menus[0], recent, endingToday];
  await page.goto("/");
  await navigateTo(page, "History");
  await expect(page.getByRole("heading", { name: "Menu history", exact: true })).toBeVisible();
  const weeks = page.getByRole("navigation", { name: "Past menus" }).getByRole("button");
  await expect(weeks).toHaveText([
    "Oct 12, 2026 — Oct 18, 2026",
    "Dec 29, 2025 — Jan 4, 2026",
  ]);
  await expect(weeks.first()).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("article").getByRole("heading")).toHaveText([
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  ]);
  await expect(page.getByRole("article").getByText("Today", { exact: true })).toHaveCount(0);
  await expect(page.getByText(recent.generation_notices[0])).toBeVisible();
  await weeks.nth(1).focus();
  await page.keyboard.press("Enter");
  await expect(weeks.nth(1)).toHaveAttribute("aria-current", "true");
  await expect(page.getByText(recent.generation_notices[0])).toHaveCount(0);
  const row = page.getByRole("article").first().getByRole("button", { name: "View Breakfast: New year breakfast" });
  await row.click();
  const dialog = page.getByRole("dialog", { name: "New year breakfast" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("2 pieza · Eggbeaten")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(row).toBeFocused();
  expect(Object.keys(api.reads)).toEqual(["/menus"]);
  expect(api.generationRequests).toBe(0);
  expect(api.saves).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await navigateTo(page, "My menu");
  await expect(page.getByRole("heading", { name: "Menu history", exact: true })).toHaveCount(0);
});

test("shows an empty history while the saved week is still current", async ({ page }) => {
  await page.goto("/");
  await navigateTo(page, "History");
  await expect(page.getByRole("heading", { name: "No past menus yet" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("shows loading before displaying past weeks", async ({ page, api }) => {
  api.menus = [pastMenu(2, "2026-10-12", "2026-10-18", "Saved breakfast")];
  let release!: () => void;
  api.initialBarrier = new Promise<void>((resolve) => { release = resolve; });
  await page.goto("/");
  await navigateTo(page, "History");
  await expect(page.getByText("Loading menu history…")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No past menus yet" })).toHaveCount(0);
  release();
  await expect(page.getByRole("navigation", { name: "Past menus" })).toBeVisible();
  await expect(page.getByText("Loading menu history…")).toHaveCount(0);
});

test("retries history errors without showing demo menus", async ({ page, api }) => {
  api.readErrors["/menus"] = "Could not load saved menus.";
  api.menus = [pastMenu(2, "2026-10-12", "2026-10-18", "Saved breakfast")];
  await page.goto("/");
  await page.getByText("Demo mode · connect the Rails API to use your own meals.").waitFor();
  await navigateTo(page, "History");
  await expect(page.getByText("Could not load saved menus.")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No past menus yet" })).toHaveCount(0);
  delete api.readErrors["/menus"];
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Past menus" })).toBeVisible();
  await expect(page.getByText("Could not load saved menus.")).toHaveCount(0);
});

test.describe("history in a timezone west of UTC", () => {
  test.use({ timezoneId: "America/Hermosillo" });

  test("preserves calendar date labels and includes a week as soon as it ends locally", async ({ page, api }) => {
    await page.clock.setFixedTime(new Date("2026-10-19T07:00:00Z"));
    api.menus = [pastMenu(2, "2026-10-12", "2026-10-18", "Saved breakfast")];
    await page.goto("/");
    await navigateTo(page, "History");
    await expect(page.getByRole("navigation", { name: "Past menus" }).getByRole("button"))
      .toHaveText("Oct 12, 2026 — Oct 18, 2026");
  });
});
