import { Card } from "@darthcharles/greda";

import { formatLocale, useI18n } from "../../i18n";
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
  return (
    <Card
      role="article"
      className={`rounded-[20px] bg-card p-[19px] shadow-sm tablet:p-[22px] ${featured ? "border border-action" : "border-0 max-[640px]:pt-[17px] max-[640px]:pb-[10px]"}`}
    >
      <div className="mb-[17px] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="m-0 font-display text-[23px] font-semibold">{dayLabel(day.weekday)}</h4>
        <div className="flex flex-wrap items-baseline gap-x-2 text-caption text-muted-foreground">
          {featured && <span className="font-medium">{t("menu.day_card.today")}</span>}
          <time dateTime={date.toISOString().slice(0, 10)}>
            {date.toLocaleDateString(formatLocale(), {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </time>
        </div>
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
