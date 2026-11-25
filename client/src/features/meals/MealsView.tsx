import { useMemo, useState } from "react";

import { Button, Input } from "@darthcharles/greda";

import { CollectionRow } from "../../components/CollectionRow";
import { useI18n } from "../../i18n";
import type { Meal } from "../../types";
import { mealTypeLabel, mealTypeOrder } from "./mealTypes";

export function MealsView({
  meals,
  showCount,
  onOpen,
}: {
  meals: Meal[];
  showCount: boolean;
  onOpen: (meal: Meal) => void;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      meals.filter(
        (meal) =>
          (filter === "all" || meal.meal_types.includes(filter)) &&
          meal.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [meals, filter, search],
  );
  return (
    <section aria-labelledby="meals-title">
      <div className="mb-md flex flex-col gap-sm desktop:flex-row desktop:items-center">
        <Input
          type="search"
          aria-label={t("meals.screen.search_meals")}
          className="min-h-11 w-full min-w-0 bg-card text-body md:text-body desktop:flex-1"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("meals.screen.search_meals")}
        />
        <div
          role="group"
          aria-label={t("meals.form.meal_time")}
          className="flex flex-wrap gap-xs desktop:max-w-[60%] desktop:shrink-0"
        >
          {["all", ...mealTypeOrder].map((item) => (
            <Button
              key={item}
              variant="outline"
              size="sm"
              aria-pressed={filter === item}
              className="h-auto min-h-11 max-w-full text-label whitespace-normal aria-pressed:surface-tertiary aria-pressed:text-foreground aria-pressed:hover:surface-tertiary aria-pressed:hover:text-foreground"
              onClick={() => setFilter(item)}
            >
              {item === "all" ? t("meals.screen.all_meals") : mealTypeLabel(item)}
            </Button>
          ))}
        </div>
      </div>
      {showCount && (
        <p role="status" className="text-caption mb-sm text-muted-foreground">
          {t("meals.screen.count", { shown: filtered.length, count: meals.length })}
        </p>
      )}
      {filtered.length > 0 ? (
        <ul
          role="list"
          aria-label={t("meals.screen.meal_library")}
          className="m-0 list-none rounded-xl border border-border p-0"
        >
          {filtered.map((meal) => (
            <CollectionRow
              key={meal.id}
              name={meal.name}
              description={meal.meal_types.map(mealTypeLabel).join(" · ")}
              onOpen={() => onOpen(meal)}
            />
          ))}
        </ul>
      ) : (
        <div className="border-t border-border py-lg">
          <h3 className="m-0 font-display text-2xl leading-tight font-semibold tracking-[-.03em] text-balance">
            {t("meals.screen.no_meals")}
          </h3>
          <p className="mt-xs mb-0 max-w-[40ch] text-body text-pretty text-muted-foreground">
            {t("meals.screen.try_meals")}
          </p>
        </div>
      )}
    </section>
  );
}
