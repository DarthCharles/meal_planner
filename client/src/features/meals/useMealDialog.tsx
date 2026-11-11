import { useI18n } from "../../i18n";
import { useCallback } from "react";
import type { Meal } from "../../types";
import { useDialog } from "../../components/dialog/useDialog";
import { MealDialogContent } from "./MealDialogContent";
import { MealDetails } from "./MealDetails";
import { MealDetailsContent } from "./MealDetailsContent";

export function useMealDialog() {
  const { t } = useI18n();
  const { openDialog } = useDialog();
  const openCreateMeal = useCallback(
    () =>
      openDialog({
        title: () => t("meals.dialog.new_favorite"),
        eyebrow: () => t("meals.dialog.add_to_library"),
        content: ({ close }) => (
          <MealDialogContent
            initialMeal={null}
            onClose={close}
            onSaved={close}
          />
        ),
      }),
    [openDialog],
  );
  const openEditMeal = useCallback(
    (meal: Meal) =>
      openDialog({
        title: () => t("meals.details.edit_meal"),
        hideTitle: true,
        eyebrow: () => t("meals.dialog.update_library"),
        content: ({ close }) => (
          <MealDialogContent
            initialMeal={meal}
            onClose={close}
            onSaved={close}
          />
        ),
      }),
    [openDialog],
  );
  const openMeal = useCallback(
    (meal: Meal) =>
      openDialog({
        title: meal.name,
        eyebrow: () => t("meals.dialog.on_table"),
        content: () => (
          <MealDetails meal={meal} onEdit={() => openEditMeal(meal)} />
        ),
      }),
    [openDialog, openEditMeal],
  );
  const openMealById = useCallback(
    (id: number, name: string) => openDialog({
      title: name,
      eyebrow: () => t("meals.dialog.in_library"),
      content: () => <MealDetailsContent id={id} onEdit={openEditMeal} />,
    }),
    [openDialog, openEditMeal],
  );
  return { openCreateMeal, openEditMeal, openMeal, openMealById };
}
