import { Badge, Button } from "@darthcharles/greda";

import { formatLocale, unitLabel, useI18n } from "../../i18n";
import type { Meal } from "../../types";
import { mealTypeColorClassName, mealTypeLabel } from "./mealTypes";
import { preferredDaysLabel } from "./preferredDays";

export function MealDetails({ meal, onEdit }: { meal: Meal; onEdit: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid min-w-0 gap-6 break-words">
      <div className="grid min-w-0 gap-3">
        <div className="flex flex-wrap gap-2">
          {meal.meal_types.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className={`border-0 text-secondary uppercase ${mealTypeColorClassName(type)}`}
            >
              {mealTypeLabel(type)}
            </Badge>
          ))}
        </div>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">{meal.description}</p>
        <p className="m-0 text-sm text-muted-foreground">
          <span className="font-semibold">{t("meals.details.preferred_days_prefix")}</span>
          {preferredDaysLabel(meal.preferred_days ?? [])}
        </p>
      </div>
      <section aria-label={t("common.ingredients")}>
        <h3 className="mb-3 font-display text-xl font-semibold">{t("common.ingredients")}</h3>
        {meal.ingredients.length ? (
          <ul className="m-0 grid list-none gap-3 p-0">
            {meal.ingredients.map((ingredient, index) => (
              <li
                key={ingredient.id ?? index}
                className="border-t border-border pt-3 text-sm leading-relaxed"
              >
                <span className="font-semibold">
                  {new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 3 }).format(
                    Number(ingredient.quantity),
                  )}{" "}
                  {unitLabel(ingredient.unit)} · {ingredient.name}
                </span>
                {ingredient.preparation_note && (
                  <p className="mt-1 mb-0 text-muted-foreground">{ingredient.preparation_note}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">
            {t("meals.details.no_meal_ingredients")}
          </p>
        )}
      </section>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        {meal.recipe_url && (
          <a
            href={meal.recipe_url}
            target="_blank"
            rel="noopener noreferrer"
            className="justify-self-start rounded text-sm font-semibold text-action underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {t("meals.details.open_recipe")}
          </a>
        )}
        <Button variant="outline" className="ml-auto" onClick={onEdit}>
          {t("meals.details.edit_meal")}
        </Button>
      </div>
    </div>
  );
}
