import { Button } from "@darthcharles/greda";

import { formatLocale, useI18n } from "../../i18n";
import type { Meal, Menu } from "../../types";
import { MealRow } from "../meals/MealRow";
import { mealTypeOrder } from "../meals/mealTypes";
import { isCurrentMenu, localWeekday } from "./menuDates";

export function MenuHero({
  menu,
  loading,
  onOpenMeal,
  onAddMeal,
  firstRecipe,
}: {
  menu: Menu | null;
  loading: boolean;
  onOpenMeal: (meal: Meal) => void;
  onAddMeal: () => void;
  firstRecipe: boolean;
}) {
  const { t } = useI18n();
  const now = new Date();
  const weekday = localWeekday(now);
  const isCurrent = menu && isCurrentMenu(menu, now);
  const today = isCurrent
    ? menu.days.find((day) => day.weekday.toLowerCase() === weekday.toLowerCase())
    : undefined;

  if (!menu) {
    return (
      <section
        aria-labelledby="menu-hero-title"
        className="mt-2 rounded-[30px] bg-card px-6 py-7 tablet:px-12 tablet:py-10"
      >
        <div>
          <h2
            id="menu-hero-title"
            className="mb-4 font-display text-[clamp(37px,5vw,62px)] leading-[.98] font-semibold tracking-[-.04em]"
          >
            {loading ? (
              t("menu.hero.next_menu")
            ) : (
              <>
                {t("menu.hero.make_week")}
                <br />
                <em className="text-action not-italic">{t("menu.hero.delicious")}</em>
              </>
            )}
          </h2>
          <p
            className="mb-0 max-w-[350px] text-sm leading-relaxed text-muted-foreground"
            role={loading ? "status" : undefined}
          >
            {loading ? t("menu.hero.finding_menu") : t("menu.hero.recipe_help")}
          </p>
          {!loading && (
            <div className="mt-6">
              <Button className="h-auto min-h-11 whitespace-normal" onClick={onAddMeal}>
                {t(firstRecipe ? "menu.hero.add_first_recipe" : "menu.hero.add_recipe")}
              </Button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="menu-hero-title"
      className={`mt-2 grid gap-4 rounded-[30px] bg-card p-4 tablet:gap-6 tablet:p-6 ${today?.meals.length ? "min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]" : ""}`}
    >
      <div className="flex min-w-0 flex-col gap-2 px-2 pt-2">
        <h2
          id="menu-hero-title"
          className="m-0 min-w-0 font-display text-[32px] leading-[1.1] font-semibold tracking-[-.03em] text-balance tablet:text-[36px]"
        >
          {today?.meals.length
            ? t("menu.hero.today")
            : isCurrent
              ? t("menu.hero.no_today")
              : t("menu.hero.week_planned")}
        </h2>
        <p className="m-0 text-xs leading-relaxed text-secondary">
          {now.toLocaleDateString(formatLocale(), {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
      {today?.meals.length ? (
        <ul className="m-0 grid min-w-0 list-none divide-y divide-border/30 border-t border-border/30 p-0 pt-2 wide:grid-cols-3 wide:divide-x wide:divide-y-0 wide:pt-4 min-[1100px]:border-t-0 min-[1100px]:pt-0">
          {today.meals.map((meal, index) => (
            <li
              key={`${meal.id}-${index}`}
              className="flex min-w-0 wide:px-3 wide:first:pl-0 wide:last:pr-0"
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
      ) : (
        <p className="m-0 max-w-[500px] px-2 pb-2 text-sm leading-relaxed text-muted-foreground">
          {isCurrent ? t("menu.hero.fresh_week") : t("menu.hero.browse_or_plan")}
        </p>
      )}
    </section>
  );
}
