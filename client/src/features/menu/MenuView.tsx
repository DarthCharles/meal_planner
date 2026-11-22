import type { Meal, Menu } from "../../types";
import { weekdays } from "../meals/preferredDays";
import { DayCard } from "./DayCard";
import { isCurrentMenu, localWeekday, menuDayDate } from "./menuDates";

export function MenuView({
  menu,
  loading,
  onOpenMeal,
}: {
  menu: Menu | null;
  loading: boolean;
  onOpenMeal: (meal: Meal) => void;
}) {
  if (loading)
    return (
      <div className="mt-6 grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
      </div>
    );
  if (!menu?.days.length) return null;
  const now = new Date();
  const today = isCurrentMenu(menu, now) ? localWeekday(now) : undefined;
  const orderedDays = [...menu.days].sort(
    (left, right) => weekdayIndex(left) - weekdayIndex(right),
  );
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
      {orderedDays.map((day) => (
        <DayCard
          day={day}
          date={menuDayDate(menu, day.weekday)}
          onOpenMeal={onOpenMeal}
          featured={day.weekday.toLowerCase() === today}
          key={day.id}
        />
      ))}
    </div>
  );
}

function weekdayIndex(day: Menu["days"][number]) {
  return weekdays.findIndex((weekday) => weekday === day.weekday.toLowerCase());
}
