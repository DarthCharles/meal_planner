import type { Meal, Menu } from "../../types";
import { DayCard } from "./DayCard";
import { isCurrentMenu, menuDayDate } from "./menuDates";

export function MenuView({
  menu,
  loading,
  onOpenMeal,
  startFromToday = true,
}: {
  menu: Menu | null;
  loading: boolean;
  onOpenMeal: (meal: Meal) => void;
  startFromToday?: boolean;
}) {
  if (loading)
    return (
      <div className="mt-6 grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
      </div>
    );
  if (!menu) return null;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" })
    .format(new Date())
    .toLowerCase();
  const orderedDays = orderDaysFromToday(menu.days, startFromToday ? today : "monday");
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
      {orderedDays.map((day) => (
        <DayCard
          day={day}
          date={menuDayDate(menu, day.weekday)}
          onOpenMeal={onOpenMeal}
          featured={
            isCurrentMenu(menu, new Date()) &&
            day.weekday.toLowerCase() === today
          }
          key={day.id}
        />
      ))}
    </div>
  );
}

function orderDaysFromToday(days: Menu["days"], today: string) {
  const weekdayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const todayIndex = weekdayOrder.indexOf(today);
  return [...days].sort((left, right) => {
    const leftIndex = weekdayOrder.indexOf(left.weekday.toLowerCase());
    const rightIndex = weekdayOrder.indexOf(right.weekday.toLowerCase());
    const leftOffset = (leftIndex - todayIndex + 7) % 7;
    const rightOffset = (rightIndex - todayIndex + 7) % 7;
    return leftOffset - rightOffset;
  });
}
