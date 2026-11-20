import { useEffect, useRef } from "react";

import { Button } from "@darthcharles/greda";

import { useI18n } from "../../i18n";
import { useIngredients } from "../meals/queries";
import { useWorkspaceNavigation } from "../navigation/useWorkspaceNavigation";

export function IngredientUsage({
  ingredientId,
  focusMealId,
}: {
  ingredientId: number;
  focusMealId?: number;
}) {
  const { t } = useI18n();
  const { data: ingredients, isPending, error, refetch, isFetching } = useIngredients();
  const { preview, openEditor } = useWorkspaceNavigation();
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (focusMealId)
      list.current
        ?.querySelector<HTMLButtonElement>(`[data-meal-id="${focusMealId}"]`)
        ?.focus({ preventScroll: true });
  }, [focusMealId, ingredients]);
  if (isPending) return <p role="status">{t("editor.loading")}</p>;
  if (error && !ingredients)
    return (
      <div className="space-y-3">
        <p role="alert">{error.message}</p>
        <Button disabled={isFetching} onClick={() => void refetch()}>
          {t("common.try_again")}
        </Button>
      </div>
    );
  const ingredient = ingredients?.find((entry) => entry.id === ingredientId);
  if (!ingredient) return <p role="alert">{t("editor.missing")}</p>;
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">{t("ingredients.form.meals_using")}</p>
      {ingredient.meals.length ? (
        <ul ref={list} className="m-0 list-none p-0">
          {ingredient.meals.map((meal) => (
            <li key={meal.id}>
              <Button
                data-meal-id={meal.id}
                variant="link"
                className="h-auto min-h-11 max-w-full whitespace-normal break-words px-0 text-left"
                onClick={() =>
                  preview({ ingredient: ingredientId, meal: meal.id, name: meal.name })
                }
              >
                {meal.name}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("ingredients.form.unused_ingredient")}</p>
      )}
      <div className="mt-5 border-t border-border pt-3">
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
