import { Button } from "@darthcharles/greda";
import { HeroBowlArt } from "../../components/HeroBowlArt";
import type { Meal, Menu } from "../../types";
import { mealTypeOrder } from "../meals/mealTypes";
import { MealRow } from "../meals/MealRow";
import { isCurrentMenu } from "./menuDates";

export function MenuHero({
  menu,
  loading,
  generating,
  onGenerate,
  onOpenMeal,
}: {
  menu: Menu | null;
  loading: boolean;
  generating: boolean;
  onGenerate: () => void;
  onOpenMeal: (meal: Meal) => void;
}) {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
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
            Your weekly table
          </p>
          <h2
            id="menu-hero-title"
            className="mb-4 font-display text-[clamp(37px,5vw,62px)] leading-[.98] font-semibold tracking-[-.055em]"
          >
            {loading ? (
              "Your next menu"
            ) : (
              <>
                Make this week
                <br />
                <em className="text-action not-italic">delicious.</em>
              </>
            )}
          </h2>
          <p
            className="mb-5 max-w-[350px] text-sm leading-relaxed text-muted-foreground"
            role={loading ? "status" : undefined}
          >
            {loading
              ? "Finding your menu…"
              : "A little structure, plenty of sabor. Plan a week of breakfasts, lunches, and dinners from your meals."}
          </p>
          <Button
            onClick={onGenerate}
            disabled={loading || generating}
            className="w-full tablet:w-auto"
          >
            {generating ? "Planning" : "Plan my week"}
          </Button>
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
            {now.toLocaleDateString("en-US", {
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
              ? "Today’s menu"
              : isCurrent
                ? "Nothing planned for today."
                : "Your week, planned."}
          </h2>
        </div>
        <div aria-hidden="true" className="w-[64px] shrink-0 tablet:w-[110px]">
          <HeroBowlArt />
        </div>
      </div>
      {today?.meals.length ? (
        <div className="mt-3 grid gap-2 border-t border-border pt-2 tablet:grid-cols-3 tablet:gap-6 tablet:pt-4">
          {today.meals.map((meal, index) => (
            <MealRow
              key={`${meal.id}-${index}`}
              meal={meal}
              mealType={mealTypeOrder[index]}
              onOpen={onOpenMeal}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 mb-0 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
          {isCurrent
            ? "Plan a fresh week to put something delicious on the table."
            : "Browse your saved menu below, or plan a fresh week."}
        </p>
      )}
    </section>
  );
}
