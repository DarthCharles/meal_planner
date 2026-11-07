import type { Weekday } from "../../types";

export const weekdays = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

export const workweek: Weekday[] = weekdays.slice(0, 4);
export const weekend: Weekday[] = weekdays.slice(4);
export const dayLabel = (day: string) => day[0].toUpperCase() + day.slice(1);
export function preferredDaysLabel(days: Weekday[]) {
  if (!days.length || days.length === 7) return "Any day";
  if (sameDays(days, workweek)) return "Weekdays (Monday–Thursday)";
  if (sameDays(days, weekend)) return "Weekend (Friday–Sunday)";
  return weekdays.filter((day) => days.includes(day)).map(dayLabel).join(", ");
}
export function sameDays(left: Weekday[], right: Weekday[]) {
  return left.length === right.length && left.every((day) => right.includes(day));
}
