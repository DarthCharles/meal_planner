import type { Menu } from "../../types";

export function isCurrentMenu(menu: Menu, now: Date) {
  const date = localDateKey(now);
  // API boundaries represent calendar days; preserve them across local timezones.
  return menu.from.slice(0, 10) <= date && date <= menu.to.slice(0, 10);
}

export function localDateKey(now: Date) {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function formatMenuDateRange(menu: Menu) {
  const format = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00Z`)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${format(menu.from)} — ${format(menu.to)}`;
}
