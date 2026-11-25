import { formatLocale, t } from "../../i18n";
import type { MenuSummary } from "../../types";

export function isCurrentMenu(menu: MenuSummary, now: Date) {
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

export function nextGenerationWeek(now: Date) {
  // Match the API's strictly following Monday on the UTC calendar.
  const start = new Date(now);
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() + 7 - daysSinceMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export function startsWithinWeek(menu: MenuSummary, week: Pick<MenuSummary, "from" | "to">) {
  const start = menu.from.slice(0, 10);
  return week.from.slice(0, 10) <= start && start <= week.to.slice(0, 10);
}

export function menuPeriod(menu: MenuSummary, now: Date) {
  const today = localDateKey(now);
  if (menu.from.slice(0, 10) > today) return t("menu.saved.upcoming");
  if (menu.to.slice(0, 10) < today) return t("menu.saved.past");
  return t("menu.saved.current");
}

export function localWeekday(now: Date) {
  return ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    now.getDay()
  ];
}

function calendarDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`);
}

export function menuDayDate(menu: MenuSummary, weekday: string) {
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const date = calendarDate(menu.from);
  const offset = (weekdays.indexOf(weekday.toLowerCase()) - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

export function formatMenuDateRange(menu: Pick<MenuSummary, "from" | "to">, includeYear = true) {
  const format = (value: string) =>
    calendarDate(value).toLocaleDateString(formatLocale(), {
      month: "short",
      day: "numeric",
      year: includeYear ? "numeric" : undefined,
      timeZone: "UTC",
    });
  return `${format(menu.from)} — ${format(menu.to)}`;
}
