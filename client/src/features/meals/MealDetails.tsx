import { Badge, Button } from "@darthcharles/greda";

import { unitLabel, useI18n } from "../../i18n";
import type { Meal } from "../../types";
import { mealTypeColorClassName, mealTypeLabel } from "./mealTypes";
import { preferredDaysLabel } from "./preferredDays";
import { formatRecipeQuantity, parseQuantity } from "./quantity";

export function MealDetails({ meal, onEdit }: { meal: Meal; onEdit: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid min-w-0 gap-lg break-words">
      <div className="grid min-w-0 gap-sm">
        <div className="flex flex-wrap gap-xs">
          {meal.meal_types.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className={`border-0 uppercase ${mealTypeColorClassName(type)}`}
            >
              {mealTypeLabel(type)}
            </Badge>
          ))}
        </div>
        <p className="m-0 text-sm leading-relaxed text-muted-foreground">{meal.description}</p>
        <p className="m-0 text-sm">{t("recipe.serves", { count: meal.servings })}</p>
        <p className="m-0 text-sm text-muted-foreground">
          <span className="font-semibold">{t("meals.details.preferred_days_prefix")}</span>
          {preferredDaysLabel(meal.preferred_days ?? [])}
        </p>
      </div>
      <section aria-label={t("common.ingredients")}>
        <h3 className="mb-sm font-display text-xl font-semibold">{t("common.ingredients")}</h3>
        {meal.ingredients.length ? (
          <ul className="m-0 grid list-none gap-sm p-0">
            {meal.ingredients.map((ingredient, index) => (
              <li
                key={ingredient.id ?? index}
                className="border-t border-border pt-sm text-sm leading-relaxed"
              >
                <span className="font-semibold">
                  {formatRecipeQuantity(ingredient.quantity, ingredient.unit)}{" "}
                  {unitLabel(ingredient.unit, parseQuantity(String(ingredient.quantity)))}
                  {ingredient.package_quantity && (
                    <>
                      {" "}
                      {t("recipe.of")}{" "}
                      {formatRecipeQuantity(
                        ingredient.package_quantity,
                        ingredient.package_unit ?? "",
                      )}{" "}
                      {unitLabel(
                        ingredient.package_unit ?? "",
                        parseQuantity(ingredient.package_quantity),
                      )}
                    </>
                  )}{" "}
                  · {ingredient.name}
                </span>
                {ingredient.preparation_note && (
                  <p className="mt-2xs mb-0 text-muted-foreground">{ingredient.preparation_note}</p>
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
      <div className="flex flex-wrap items-center justify-between gap-md border-t border-border pt-md">
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
