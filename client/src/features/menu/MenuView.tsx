import type { Meal, Menu } from "../../types";
import { DayCard } from "./DayCard";
import { isCurrentMenu } from "./menuDates";

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
      <div className="grid grid-cols-3 gap-4">
        <div className="h-[410px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
      </div>
    );
  if (!menu) return null;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" })
    .format(new Date())
    .toLowerCase();
  const orderedDays = orderDaysFromToday(menu.days, today);
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
      {orderedDays.map((day) => (
        <DayCard
          day={day}
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
