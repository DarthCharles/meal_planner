import { useCallback } from "react";

import { useDialog } from "../../components/dialog/useDialog";
import { useI18n } from "../../i18n";
import type { Meal } from "../../types";
import { MealDetails } from "./MealDetails";
import { MealDetailsContent } from "./MealDetailsContent";
import { MealDialogContent } from "./MealDialogContent";

export function useMealDialog() {
  const { t } = useI18n();
  const { openDialog } = useDialog();
  const openCreateMeal = useCallback(
    () =>
      openDialog({
        title: () => t("meals.dialog.new_favorite"),
        eyebrow: () => t("meals.dialog.add_to_library"),
        content: ({ close }) => (
          <MealDialogContent initialMeal={null} onClose={close} onSaved={close} />
        ),
      }),
    [openDialog, t],
  );
  const openEditMeal = useCallback(
    (meal: Meal) =>
      openDialog({
        title: () => t("meals.details.edit_meal"),
        hideTitle: true,
        eyebrow: () => t("meals.dialog.update_library"),
        content: ({ close }) => (
          <MealDialogContent initialMeal={meal} onClose={close} onSaved={close} />
        ),
      }),
    [openDialog, t],
  );
  const openMeal = useCallback(
    (meal: Meal) =>
      openDialog({
        title: meal.name,
        eyebrow: () => t("meals.dialog.on_table"),
        content: () => <MealDetails meal={meal} onEdit={() => openEditMeal(meal)} />,
      }),
    [openDialog, openEditMeal, t],
  );
  const openMealById = useCallback(
    (id: number, name: string) =>
      openDialog({
        title: name,
        eyebrow: () => t("meals.dialog.in_library"),
        content: () => <MealDetailsContent id={id} onEdit={openEditMeal} />,
      }),
    [openDialog, openEditMeal, t],
  );
  return { openCreateMeal, openEditMeal, openMeal, openMealById };
}
