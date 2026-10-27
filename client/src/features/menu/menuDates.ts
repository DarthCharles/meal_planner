import type { Menu } from "../../types";

export function isCurrentMenu(menu: Menu, now: Date) {
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  // API boundaries represent calendar days; preserve them across local timezones.
  return menu.from.slice(0, 10) <= date && date <= menu.to.slice(0, 10);
}
