import { t } from "../../i18n";
import type { Weekday } from "../../types";

export const weekdays = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

export const workweek: Weekday[] = weekdays.slice(0, 4);
export const weekend: Weekday[] = weekdays.slice(4);
export const dayLabel = (day: string) => {
  const name = day.toLowerCase() as Weekday;
  return weekdays.includes(name) ? t(`reference.weekdays.${name}`) : day;
};
export function preferredDaysLabel(days: Weekday[]) {
  if (!days.length || days.length === 7) return t("meals.preferred_days.any_day");
  if (sameDays(days, workweek)) return t("meals.preferred_days.workweek");
  if (sameDays(days, weekend)) return t("meals.preferred_days.weekend");
  return weekdays.filter((day) => days.includes(day)).map(dayLabel).join(", ");
}
export function sameDays(left: Weekday[], right: Weekday[]) {
  return left.length === right.length && left.every((day) => right.includes(day));
}
