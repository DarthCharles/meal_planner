import { useEffect, useRef } from "react";

import { Button } from "@darthcharles/greda";
import { ArrowLeft } from "@darthcharles/greda/icons";
import { useLocation, useNavigate } from "react-router";

import { useDialog } from "../../components/dialog/useDialog";
import { useI18n } from "../../i18n";
import { IngredientUsage } from "../ingredients/IngredientUsage";
import { MealDetailsContent } from "../meals/MealDetailsContent";
import { useIngredients, useMeal } from "../meals/queries";
import { IngredientMenuMeals } from "../menu/IngredientMenuMeals";
import { isEditorPath, useWorkspaceNavigation } from "./useWorkspaceNavigation";

function positiveId(value: string | null) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

export function PreviewController() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { openDialog, closeDialog } = useDialog();
  const { openEditor } = useWorkspaceNavigation();
  const opener = useRef<HTMLElement | null>(null);
  const previousMeal = useRef<number>();
  const params = new URLSearchParams(location.search);
  const mealId = positiveId(params.get("meal"));
  const ingredientId = positiveId(params.get("ingredient"));
  const menuId = positiveId(
    location.pathname.match(/^\/menus\/(\d+)\/shopping-list$/)?.[1] ?? null,
  );
  const editing = isEditorPath(location.pathname);
  const { data: meal } = useMeal(mealId ?? 0, { enabled: !!mealId && !editing });
  const { data: ingredients } = useIngredients({ enabled: false });
  const ingredient = ingredients?.find((entry) => entry.id === ingredientId);
  const catalogItemRemoved =
    location.pathname === "/ingredients" &&
    !!location.state?.previewParent &&
    !!ingredientId &&
    !!ingredients &&
    !ingredient;
  const name = mealId
    ? (meal?.name ?? params.get("previewName") ?? t("preview.meal"))
    : (ingredient?.name ??
      params.get("ingredientName") ??
      params.get("previewName") ??
      t("shopping_list.ingredient"));

  useEffect(() => {
    if (editing || (!mealId && !ingredientId)) {
      closeDialog();
      if (!editing) {
        opener.current = null;
        previousMeal.current = undefined;
      }
      return;
    }
    const dismiss = () => {
      const search = new URLSearchParams(location.search);
      for (const key of ["meal", "ingredient", "previewName", "ingredientName"]) search.delete(key);
      navigate(
        { pathname: location.pathname, search: search.toString() },
        { replace: true, state: location.state },
      );
    };
    if (catalogItemRemoved) {
      dismiss();
      return;
    }
    if (!opener.current?.isConnected)
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusMealId = previousMeal.current;
    openDialog({
      title: mealId ? name : () => t("shopping_list.menu_meals_title", { name }),
      onDismiss: dismiss,
      returnFocus: opener.current,
      content: () =>
        mealId ? (
          <>
            {ingredientId && (
              <Button
                variant="link"
                className="mb-md h-auto min-h-11 whitespace-normal px-0"
                onClick={() => {
                  if (location.state?.previewParent) navigate(-1);
                  else {
                    const search = new URLSearchParams(location.search);
                    search.delete("meal");
                    search.delete("previewName");
                    navigate(
                      { pathname: location.pathname, search: search.toString() },
                      { replace: true, state: location.state },
                    );
                  }
                }}
              >
                <ArrowLeft aria-hidden="true" className="mr-xs size-4 shrink-0" />
                {t("preview.back_to_meals")}
              </Button>
            )}
            <MealDetailsContent
              id={mealId}
              onEdit={(entry) => openEditor(`/meals/${entry.id}/edit`)}
            />
          </>
        ) : menuId ? (
          <IngredientMenuMeals
            menuId={menuId}
            ingredientId={ingredientId!}
            focusMealId={focusMealId}
          />
        ) : (
          <IngredientUsage ingredientId={ingredientId!} focusMealId={focusMealId} />
        ),
    });
    previousMeal.current = mealId;
  }, [
    editing,
    catalogItemRemoved,
    mealId,
    ingredientId,
    menuId,
    name,
    location,
    navigate,
    openEditor,
    openDialog,
    closeDialog,
    t,
  ]);
  useEffect(() => () => closeDialog(), [closeDialog]);
  return null;
}
