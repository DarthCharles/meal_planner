import { test, expect, navigateTo } from "./fixtures/app";

test.use({ timezoneId: "America/Hermosillo" });

for (const week of [
  { from: "2026-11-09", to: "2026-11-15", hero: "Monday, Nov 9", range: "Nov 9 — Nov 15", monday: "09", sunday: "15" },
  { from: "2026-12-28", to: "2027-01-03", hero: "Monday, Dec 28", range: "Dec 28 — Jan 3", monday: "28", sunday: "03" },
]) {
  test(`keeps hero, weekly range, and card dates consistent for ${week.from}`, async ({ page, api }) => {
    await page.clock.setFixedTime(new Date(`${week.from}T07:01:00Z`));
    const menu = api.menus[0];
    menu.from = `${week.from}T00:00:00Z`;
    menu.to = `${week.to}T23:59:59Z`;
    // IDs are reference data, not dates; response ordering must not affect dates.
    menu.days = [
      { ...menu.days[0], id: 99, weekday: "Sunday" },
      { ...menu.days[0], id: 22, weekday: "Monday" },
    ];
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Today’s menu" }).getByText(week.hero)).toBeVisible();
    await expect(page.getByRole("heading", { name: week.range, exact: true })).toBeVisible();
    const monday = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Monday", exact: true }) });
    const sunday = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Sunday", exact: true }) });
    await expect(monday.getByText("Today", { exact: true })).toBeVisible();
    await expect(monday.locator("time")).toHaveText(week.monday);
    await expect(monday.locator("time")).toHaveAttribute("datetime", week.from);
    await expect(sunday.locator("time")).toHaveText(week.sunday);
    await expect(sunday.locator("time")).toHaveAttribute("datetime", week.to);
    await expect(sunday.getByText(`Day ${week.sunday}`, { exact: true })).toBeVisible();

    await navigateTo(page, "Saved Menus");
    await expect(monday.locator("time")).toHaveAttribute("datetime", week.from);
    await expect(sunday.locator("time")).toHaveAttribute("datetime", week.to);
  });
}
