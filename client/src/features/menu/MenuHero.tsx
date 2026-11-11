import { formatLocale, useI18n } from "../../i18n";
import { HeroBowlArt } from "../../components/HeroBowlArt";
import type { Meal, Menu } from "../../types";
import { mealTypeOrder } from "../meals/mealTypes";
import { MealRow } from "../meals/MealRow";
import { isCurrentMenu, localWeekday } from "./menuDates";

export function MenuHero({
  menu,
  loading,
  onOpenMeal,
}: {
  menu: Menu | null;
  loading: boolean;
  onOpenMeal: (meal: Meal) => void;
}) {
  const { t } = useI18n();
  const now = new Date();
  const weekday = localWeekday(now);
  const isCurrent = menu && isCurrentMenu(menu, now);
  const today = isCurrent
    ? menu.days.find(
        (day) => day.weekday.toLowerCase() === weekday.toLowerCase(),
      )
    : undefined;

  if (!menu) {
    return (
      <section
        aria-labelledby="menu-hero-title"
        className="relative overflow-hidden rounded-[30px] bg-accent px-6 py-7 tablet:flex tablet:min-h-[260px] tablet:items-center tablet:justify-between tablet:gap-8 tablet:px-12 tablet:py-10"
      >
        <div className="relative z-10 tablet:max-w-[400px]">
          <p className="mb-2 text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
            {t("common.weekly_table")}
          </p>
          <h2
            id="menu-hero-title"
            className="mb-4 font-display text-[clamp(37px,5vw,62px)] leading-[.98] font-semibold tracking-[-.055em]"
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
            className="mb-5 max-w-[350px] text-sm leading-relaxed text-muted-foreground"
            role={loading ? "status" : undefined}
          >
            {loading
              ? t("menu.hero.finding_menu")
              : t("menu.hero.menu_intro")}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="mx-auto -mb-6 h-[140px] w-[190px] shrink-0 tablet:m-0 tablet:h-[210px] tablet:w-[280px]"
        >
          <HeroBowlArt />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="menu-hero-title"
      className="rounded-[30px] bg-accent px-5 py-5 tablet:px-9 tablet:py-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
            {now.toLocaleDateString(formatLocale(), {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <h2
            id="menu-hero-title"
            className="m-0 font-display text-[26px] leading-tight font-semibold tracking-[-.04em] tablet:text-[36px]"
          >
            {today?.meals.length
              ? t("menu.hero.today")
              : isCurrent
                ? t("menu.hero.no_today")
                : t("menu.hero.week_planned")}
          </h2>
        </div>
        <div aria-hidden="true" className="w-[64px] shrink-0 tablet:w-[110px]">
          <HeroBowlArt />
        </div>
      </div>
      {today?.meals.length ? (
        <div className="mt-3 grid gap-2 pt-2 tablet:grid-cols-3 tablet:gap-6 tablet:pt-4">
          {today.meals.map((meal, index) => (
            <MealRow
              key={`${meal.id}-${index}`}
              meal={meal}
              mealType={mealTypeOrder[index]}
              onOpen={onOpenMeal}
              variant="hero"
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 mb-0 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
          {isCurrent
            ? t("menu.hero.fresh_week")
            : t("menu.hero.browse_or_plan")}
        </p>
      )}
    </section>
  );
}
