import { Button } from "@darthcharles/greda";
import type { Menu } from "../../types";
import { DayCard } from "./DayCard";

export function MenuView({
  menu,
  loading,
  generating,
  onGenerate,
}: {
  menu: Menu | null;
  loading: boolean;
  generating: boolean;
  onGenerate: () => void;
}) {
  if (loading)
    return (
      <div className="grid grid-cols-3 gap-4">
        <div className="h-[410px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
        <div className="h-[330px] animate-shimmer rounded-[20px] bg-skeleton bg-size-[200%_100%]"></div>
      </div>
    );
  if (!menu) {
    return (
      <div className="grid min-h-[280px] content-center justify-items-center rounded-[20px] border border-dashed border-border px-5 py-[42px] text-center">
        <div className="mb-[15px] grid size-[49px] place-items-center rounded-2xl bg-secondary text-[22px] text-primary">
          ✦
        </div>
        <h3 className="font-display text-[28px] mb-[9px] font-semibold tracking-[-.04em]">
          Your week is a blank page.
        </h3>
        <p className="mb-[1em] max-w-[300px] text-sm leading-normal text-muted-foreground">
          Generate a menu and we’ll fill it with breakfast, lunch, and dinner.
        </p>
        <Button variant="default" onClick={onGenerate} disabled={generating}>
          Create my first menu
        </Button>
      </div>
    );
  }
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" })
    .format(new Date())
    .toLowerCase();
  const orderedDays = orderDaysFromToday(menu.days, today);
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 wide:grid-cols-3">
      {orderedDays.map((day) => (
        <DayCard
          day={day}
          featured={day.weekday.toLowerCase() === today}
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
