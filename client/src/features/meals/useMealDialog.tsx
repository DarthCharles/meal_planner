import { useCallback } from "react";
import type { Meal } from "../../types";
import { useDialog } from "../../components/dialog/useDialog";
import { MealDialogContent } from "./MealDialogContent";
import { MealDetails } from "./MealDetails";
import { MealDetailsContent } from "./MealDetailsContent";

export function useMealDialog() {
  const { openDialog } = useDialog();
  const openCreateMeal = useCallback(
    () =>
      openDialog({
        title: "A new favorite",
        eyebrow: "Add to your library",
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
        title: "Edit meal",
        hideTitle: true,
        eyebrow: "Update your library",
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
        eyebrow: "On your table",
        content: () => (
          <MealDetails meal={meal} onEdit={() => openEditMeal(meal)} />
        ),
      }),
    [openDialog, openEditMeal],
  );
  const openMealById = useCallback(
    (id: number, name: string) => openDialog({
      title: name,
      eyebrow: "In your library",
      content: () => <MealDetailsContent id={id} onEdit={openEditMeal} />,
    }),
    [openDialog, openEditMeal],
  );
  return { openCreateMeal, openEditMeal, openMeal, openMealById };
}
