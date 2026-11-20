import { useCallback } from "react";

import { useDialog } from "../../components/dialog/useDialog";
import { useI18n } from "../../i18n";
import type { Meal } from "../../types";
import { MealDetails } from "./MealDetails";
import { MealDetailsContent } from "./MealDetailsContent";
import { MealDialogContent } from "./MealDialogContent";

export function useMealDialog({ preserveParent = false } = {}) {
  const { t } = useI18n();
  const { openDialog, pushDialog } = useDialog();
  const showDialog = preserveParent ? pushDialog : openDialog;
  const openCreateMeal = useCallback(
    () =>
      showDialog({
        title: () => t("meals.dialog.new_favorite"),
        content: ({ close }) => (
          <MealDialogContent initialMeal={null} onClose={close} onSaved={close} />
        ),
      }),
    [showDialog, t],
  );
  const openEditMeal = useCallback(
    (meal: Meal) =>
      showDialog({
        title: () => t("meals.details.edit_meal"),
        content: ({ close }) => (
          <MealDialogContent initialMeal={meal} onClose={close} onSaved={close} />
        ),
      }),
    [showDialog, t],
  );
  const openMeal = useCallback(
    (meal: Meal) =>
      showDialog({
        title: meal.name,
        content: () => <MealDetails meal={meal} onEdit={() => openEditMeal(meal)} />,
      }),
    [showDialog, openEditMeal, t],
  );
  const openMealById = useCallback(
    (id: number, name: string) =>
      showDialog({
        title: name,
        content: () => <MealDetailsContent id={id} onEdit={openEditMeal} />,
      }),
    [showDialog, openEditMeal, t],
  );
  return { openCreateMeal, openEditMeal, openMeal, openMealById };
}
