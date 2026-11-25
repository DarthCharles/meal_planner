import { useEffect, useRef } from "react";

import { Button } from "@darthcharles/greda";

import { formatLocale, useI18n } from "../../i18n";
import { dayLabel } from "../meals/preferredDays";
import { useWorkspaceNavigation } from "../navigation/useWorkspaceNavigation";
import { useMenu } from "./queries";

export function IngredientMenuMeals({
  menuId,
  ingredientId,
  focusMealId,
}: {
  menuId: number;
  ingredientId: number;
  focusMealId?: number;
}) {
  const { t } = useI18n();
  const { preview, openEditor } = useWorkspaceNavigation();
  const { data: menu, isPending, error, refetch, isFetching } = useMenu(menuId);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (focusMealId)
      list.current
        ?.querySelector<HTMLButtonElement>(`[data-meal-id="${focusMealId}"]`)
        ?.focus({ preventScroll: true });
  }, [focusMealId, menu]);
  if (isPending) return <p role="status">{t("shopping_list.loading")}</p>;
  if (error)
    return (
      <div>
        <p role="alert">{error.message}</p>
        <Button disabled={isFetching} onClick={() => void refetch()}>
          {t("common.try_again")}
        </Button>
      </div>
    );
  if (!menu) return <p role="alert">{t("shopping_list.menu_missing")}</p>;
  const meals = [
    ...new Map(
      menu.days
        .flatMap((day) => day.meals)
        .filter((meal) => meal.ingredients.some((row) => row.ingredient_id === ingredientId))
        .map((meal) => [meal.id, meal]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, formatLocale()));
  return (
    <div>
      <p className="mb-md text-sm text-muted-foreground">{t("shopping_list.menu_meals_help")}</p>
      {meals.length ? (
        <ul ref={list} className="m-0 list-none p-0">
          {meals.map((meal) => (
            <li key={meal.id}>
              <Button
                variant="link"
                className="h-auto min-h-11 max-w-full flex-col items-start whitespace-normal break-words px-0 text-left"
                data-meal-id={meal.id}
                aria-label={meal.name}
                onClick={() =>
                  preview({ ingredient: ingredientId, meal: meal.id, name: meal.name })
                }
              >
                {meal.name}
                <span className="block text-xs text-muted-foreground">
                  {menu.days
                    .filter((day) => day.meals.some((entry) => entry.id === meal.id))
                    .map((day) => dayLabel(day.weekday))
                    .join(", ")}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("shopping_list.unused_in_menu")}</p>
      )}
      <div className="mt-lg border-t border-border pt-sm">
        <Button
          variant="link"
          className="min-h-11 px-0"
          onClick={() => openEditor(`/ingredients/${ingredientId}/edit`)}
        >
          {t("ingredients.form.edit_ingredient")}
        </Button>
      </div>
    </div>
  );
}
