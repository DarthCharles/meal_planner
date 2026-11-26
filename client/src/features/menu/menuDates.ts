import { utc } from "@date-fns/utc";
import {
  addDays,
  type Day,
  formatISO,
  getDay,
  intlFormat,
  isAfter,
  isBefore,
  isWithinInterval,
  nextMonday,
  parseISO,
  setDay,
} from "date-fns";

import { formatLocale, t } from "../../i18n";
import type { MenuSummary } from "../../types";

const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function isCurrentMenu(menu: MenuSummary, now: Date) {
  return isWithinInterval(calendarDate(localDateKey(now)), {
    start: calendarDate(menu.from),
    end: calendarDate(menu.to),
  });
}

export function localDateKey(now: Date) {
  return formatISO(now, { representation: "date" });
}

export function nextGenerationWeek(now: Date) {
  // Match the API's strictly following Monday on the UTC calendar.
  const start = nextMonday(now, { in: utc });
  const end = addDays(start, 6);
  return {
    from: formatISO(start, { representation: "date" }),
    to: formatISO(end, { representation: "date" }),
  };
}

export function startsWithinWeek(menu: MenuSummary, week: Pick<MenuSummary, "from" | "to">) {
  return isWithinInterval(calendarDate(menu.from), {
    start: calendarDate(week.from),
    end: calendarDate(week.to),
  });
}

export function menuPeriod(menu: MenuSummary, now: Date, label: "archive" | "header" = "archive") {
  const today = calendarDate(localDateKey(now));
  if (isAfter(calendarDate(menu.from), today)) {
    if (label === "header" && startsWithinWeek(menu, nextGenerationWeek(today))) {
      return t("menu.next_week.title");
    }
    return t("menu.saved.upcoming");
  }
  if (isBefore(calendarDate(menu.to), today)) {
    return t(label === "header" ? "menu.saved.past_week" : "menu.saved.past");
  }
  return t(label === "header" ? "menu.screen.this_week" : "menu.saved.current");
}

export function localWeekday(now: Date) {
  return weekdays[getDay(now)];
}

export function calendarDate(value: string) {
  // Preserve the calendar day encoded by the API boundary.
  return parseISO(value.slice(0, 10), { in: utc });
}

export function menuDayDate(menu: MenuSummary, weekday: string) {
  const date = calendarDate(menu.from);
  // Starting the week here selects the first occurrence on or after the menu's start.
  return setDay(date, weekdays.indexOf(weekday.toLowerCase()), {
    weekStartsOn: getDay(date) as Day,
  });
}

export function formatMenuDateRange(menu: Pick<MenuSummary, "from" | "to">, includeYear = true) {
  const format = (value: string) =>
    intlFormat(
      calendarDate(value),
      {
        month: "short",
        day: "numeric",
        year: includeYear ? "numeric" : undefined,
        timeZone: "UTC",
      },
      { locale: formatLocale() },
    );
  return `${format(menu.from)} — ${format(menu.to)}`;
}

export function formatCompactMenuDateRange(menu: Pick<MenuSummary, "from" | "to">) {
  return new Intl.DateTimeFormat(formatLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).formatRange(calendarDate(menu.from), calendarDate(menu.to));
}
