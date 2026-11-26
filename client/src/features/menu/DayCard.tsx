import { Card } from "@darthcharles/greda";
import { utc } from "@date-fns/utc";
import { formatISO, intlFormat } from "date-fns";

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
      className={`rounded-[20px] border bg-card p-md shadow-sm tablet:p-lg ${featured ? "border-action" : "border-border max-[640px]:pb-xs"}`}
    >
      <div className="mb-md flex flex-wrap items-baseline justify-between gap-x-sm gap-y-2xs">
        <h4 className="m-0 font-display text-[23px] font-semibold">{dayLabel(day.weekday)}</h4>
        <div className="flex flex-wrap items-baseline gap-x-xs text-caption text-muted-foreground">
          {featured && <span className="font-medium">{t("menu.day_card.today")}</span>}
          <time dateTime={formatISO(date, { representation: "date", in: utc })}>
            {intlFormat(
              date,
              { month: "short", day: "numeric", timeZone: "UTC" },
              { locale: formatLocale() },
            )}
          </time>
        </div>
      </div>
      <div className="grid gap-3xs">
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
