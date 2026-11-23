import { useMemo, useState } from "react";

import { Badge, Button, Card, Input } from "@darthcharles/greda";

import { useI18n } from "../../i18n";
import type { Meal } from "../../types";
import { mealTypeColorClassName, mealTypeLabel, mealTypeOrder } from "./mealTypes";

export function MealsView({
  meals,
  showCount,
  onEdit,
  onOpen,
}: {
  meals: Meal[];
  showCount: boolean;
  onEdit: (meal: Meal) => void;
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
      <div className="mb-4 flex flex-col gap-3 desktop:flex-row desktop:items-center">
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
          className="flex flex-wrap gap-2 desktop:max-w-[60%] desktop:shrink-0"
        >
          {["all", ...mealTypeOrder].map((item) => (
            <Button
              key={item}
              variant="outline"
              size="sm"
              aria-pressed={filter === item}
              className="h-auto min-h-11 max-w-full rounded-full text-label whitespace-normal aria-pressed:surface-tertiary aria-pressed:text-foreground aria-pressed:hover:surface-tertiary aria-pressed:hover:text-foreground"
              onClick={() => setFilter(item)}
            >
              {item === "all" ? t("meals.screen.all_meals") : mealTypeLabel(item)}
            </Button>
          ))}
        </div>
      </div>
      {showCount && (
        <p role="status" className="text-caption mb-3 text-muted-foreground">
          {t("meals.screen.count", { shown: filtered.length, count: meals.length })}
        </p>
      )}
      <div className="grid grid-cols-1 gap-[14px] tablet:grid-cols-2 wide:grid-cols-3">
        {filtered.map((meal) => (
          <Card
            role="article"
            className="min-h-[143px] overflow-hidden rounded-[17px] border border-border bg-card shadow-none pt-5 pr-[18px] pb-[18px] pl-[23px]"
            key={meal.id}
          >
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap gap-[5px]">
                {meal.meal_types.map((type) => (
                  <Badge
                    variant="secondary"
                    className={`max-w-full rounded-[5px] border-0 px-1.5 py-1 text-caption wrap-anywhere whitespace-normal ${mealTypeColorClassName(type)}`}
                    key={type}
                  >
                    {mealTypeLabel(type)}
                  </Badge>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 self-start text-label"
                onClick={() => onEdit(meal)}
                aria-label={t("common.edit_name", { name: meal.name })}
              >
                {t("common.edit")}
              </Button>
            </div>
            <h3 className="mt-2 mb-1">
              <Button
                variant="link"
                className="h-auto max-w-full px-0 py-1 text-left text-body font-medium whitespace-normal text-foreground"
                onClick={() => onOpen(meal)}
              >
                <span className="min-w-0 wrap-anywhere text-pretty">{meal.name}</span>
              </Button>
            </h3>
            <p className="m-0 text-sm leading-relaxed wrap-anywhere text-pretty text-muted-foreground">
              {meal.description}
            </p>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="grid min-h-[180px] content-center justify-items-center rounded-[20px] border border-dashed border-border px-5 py-[42px] text-center col-span-full">
            <h3 className="m-0 font-display text-2xl leading-tight font-semibold tracking-[-.03em] text-balance">
              {t("meals.screen.no_meals")}
            </h3>
            <p className="mt-2 mb-0 max-w-[40ch] text-body text-pretty text-muted-foreground">
              {t("meals.screen.try_meals")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
