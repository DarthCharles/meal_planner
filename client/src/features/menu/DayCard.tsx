import { Card } from "@darthcharles/greda";

import { useI18n } from "../../i18n";
import type { Menu } from "../../types";
import type { Meal } from "../../types";
import { MealRow } from "../meals/MealRow";
import { mealTypeOrder } from "../meals/mealTypes";
import { dayLabel } from "../meals/preferredDays";

export function DayCard({
  day,
  date,
  featured,
  onOpenMeal,
}: {
  day: Menu["days"][number];
  date: Date;
  featured: boolean;
  onOpenMeal: (meal: Meal) => void;
}) {
  const { t } = useI18n();
  const dayNumber = String(date.getUTCDate()).padStart(2, "0");
  return (
    <Card
      role="article"
      className={`rounded-[20px] bg-card p-[19px] shadow-sm tablet:p-[22px] ${featured ? "border border-action" : "border-0 max-[640px]:pt-[17px] max-[640px]:pb-[10px]"}`}
    >
      <div className="mb-[17px] flex items-start justify-between">
        <div>
          <p className="mb-[5px] text-[11px] font-bold tracking-[.13em] text-muted-foreground uppercase">
            {featured
              ? t("menu.day_card.today")
              : t("menu.day_card.day_number", { number: dayNumber })}
          </p>
          <h4 className="m-0 font-display text-[23px] font-semibold">{dayLabel(day.weekday)}</h4>
        </div>
        <time
          dateTime={date.toISOString().slice(0, 10)}
          className="font-display text-[27px] font-semibold text-muted-foreground"
        >
          {dayNumber}
        </time>
      </div>
      <div className="grid gap-0.5">
        {day.meals.map((meal, index) => (
          <MealRow
            key={`${meal.id}-${index}`}
            meal={meal}
            mealType={mealTypeOrder[index]}
            onOpen={onOpenMeal}
            className="min-h-[57px] tablet:min-h-[67px]"
          />
        ))}
      </div>
    </Card>
  );
}
