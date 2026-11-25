import { Button } from "@darthcharles/greda";
import { Link } from "react-router";

import { formatLocale, useI18n } from "../../i18n";
import type { Meal, Menu } from "../../types";
import { MealRow } from "../meals/MealRow";
import { mealTypeOrder } from "../meals/mealTypes";
import { formatMenuDateRange, localDateKey, localWeekday } from "./menuDates";

export function MenuHero({
  menu,
  nextMealDate,
  now,
  onOpenMeal,
}: {
  menu: Menu;
  nextMealDate: string | null;
  now: Date;
  onOpenMeal: (meal: Meal) => void;
}) {
  const { t } = useI18n();
  const todayDate = localDateKey(now);
  const today = menu.days.find((day) => day.weekday.toLowerCase() === localWeekday(now));
  const meals = today?.meals ?? [];
  const nextDay = !meals.length && nextMealDate ? new Date(`${nextMealDate}T00:00:00Z`) : null;
  const dateFormat: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "short",
    day: "numeric",
  };

  return (
    <section
      aria-labelledby="menu-hero-title"
      className="mt-xs grid gap-sm rounded-[30px] bg-card p-md tablet:grid-cols-[minmax(0,1fr)_auto] tablet:gap-lg tablet:p-lg"
    >
      <div className="min-w-0">
        <h2
          id="menu-hero-title"
          className="m-0 font-display text-[28px] leading-tight font-semibold tracking-[-.03em] text-balance tablet:text-[36px]"
        >
          {t(meals.length ? "menu.hero.today" : "menu.hero.no_today")}
        </h2>
        <time dateTime={todayDate} className="mt-2xs block text-caption text-muted-foreground">
          {now.toLocaleDateString(formatLocale(), dateFormat)}
        </time>
      </div>
      {meals.length > 0 && (
        <ul className="m-0 grid min-w-0 list-none divide-y divide-border/30 p-0 tablet:col-span-2 tablet:row-start-2 wide:grid-cols-3 wide:divide-x wide:divide-y-0">
          {meals.map((meal, index) => (
            <li
              key={`${meal.id}-${index}`}
              className="flex min-w-0 wide:px-sm wide:first:pl-0 wide:last:pr-0"
            >
              <MealRow
                meal={meal}
                mealType={mealTypeOrder[index]}
                onOpen={onOpenMeal}
                variant="hero"
              />
            </li>
          ))}
        </ul>
      )}
      {nextDay && (
        <p className="m-0 text-body text-secondary tablet:col-span-2 tablet:row-start-2">
          {t("menu.hero.next_day", {
            day: nextDay.toLocaleDateString(formatLocale(), { ...dateFormat, timeZone: "UTC" }),
          })}
        </p>
      )}
      <div className="grid min-w-0 justify-items-stretch gap-2xs text-center tablet:col-start-2 tablet:row-start-1 tablet:justify-self-end">
        <Button asChild variant="outline" className="h-auto min-h-11 whitespace-normal">
          <Link
            to={`/menus/${menu.id}/shopping-list`}
            state={{ from: "/" }}
            aria-describedby="shopping-week"
          >
            {t("shopping_list.title")}
          </Link>
        </Button>
        <p id="shopping-week" className="m-0 text-caption text-muted-foreground">
          {formatMenuDateRange(menu, false)}
        </p>
      </div>
    </section>
  );
}
