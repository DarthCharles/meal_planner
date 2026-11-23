import { expect, navigateTo, test } from "./fixtures/app";

test.use({ timezoneId: "America/Hermosillo" });

for (const week of [
  {
    from: "2026-11-09",
    to: "2026-11-15",
    hero: "Monday, Nov 9",
    range: "Nov 9 — Nov 15",
    sunday: "Nov 15",
    legacySunday: "Day 15",
  },
  {
    from: "2026-12-28",
    to: "2027-01-03",
    hero: "Monday, Dec 28",
    range: "Dec 28 — Jan 3",
    sunday: "Jan 3",
    legacySunday: "Day 03",
  },
]) {
  test(`keeps hero, weekly range, and card dates consistent for ${week.from}`, async ({
    page,
    api,
  }) => {
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
    await expect(
      page.getByRole("region", { name: "Today’s menu" }).getByText(week.hero),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Shopping list" })).toHaveAccessibleDescription(
      week.range,
    );
    const monday = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Monday", exact: true }) });
    const sunday = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Sunday", exact: true }) });
    await expect(monday.getByText("Today", { exact: true })).toBeVisible();
    await expect(monday.locator("time")).toHaveAttribute("datetime", week.from);
    await expect(sunday.locator("time")).toHaveText(week.sunday);
    await expect(sunday.locator("time")).toHaveAttribute("datetime", week.to);
    await expect(sunday.getByText(week.legacySunday, { exact: true })).toHaveCount(0);

    await navigateTo(page, "Saved Menus");
    await expect(monday.locator("time")).toHaveAttribute("datetime", week.from);
    await expect(sunday.locator("time")).toHaveText(week.sunday);
    await expect(sunday.locator("time")).toHaveAttribute("datetime", week.to);
  });
}

test("requires a new planning action if the UTC week changes during confirmation", async ({
  page,
  api,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-25T23:59:00Z"));
  const currentMenu = api.menus[0];
  currentMenu.days.push({ ...currentMenu.days[0], id: 7, weekday: "Sunday" });
  api.menus.unshift({
    ...structuredClone(currentMenu),
    id: 2,
    from: "2026-10-26T00:00:00Z",
    to: "2026-11-01T23:59:59Z",
  });
  await page.goto("/");
  const nextWeek = page.getByRole("region", { name: "Next week" });
  await nextWeek.getByRole("button", { name: "Regenerate menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Replace next week’s menu?" });
  await page.clock.setFixedTime(new Date("2026-10-26T00:01:00Z"));
  await dialog.getByRole("button", { name: "Replace menu" }).click();

  const hero = page.getByRole("region", { name: "Today’s menu" });
  await expect(hero.locator("time")).toHaveAttribute("datetime", "2026-10-25");
  const currentWeek = page.getByRole("region", { name: "This week" });
  await expect(currentWeek.getByRole("article").first().getByRole("heading")).toHaveText("Monday");
  await expect(
    currentWeek.getByRole("article").last().getByText("Today", { exact: true }),
  ).toBeVisible();
  await expect(nextWeek.getByRole("status")).toContainText("The planning dates changed.");
  await expect(nextWeek.getByText("Nov 2 — Nov 8", { exact: true })).toBeVisible();
  await expect(nextWeek.getByRole("button", { name: "Plan next week" })).toBeEnabled();
  expect(api.generationRequests).toBe(0);
});
