import { useCallback } from "react";
import type { Meal } from "../../types";
import { useDialog } from "../../components/dialog/useDialog";
import { MealDialogContent } from "./MealDialogContent";
import { MealDetails } from "./MealDetails";

export function useMealDialog() {
  const { openDialog } = useDialog();
  const openMeal = useCallback(
    (meal: Meal) =>
      openDialog({
        title: meal.name,
        eyebrow: "On your table",
        content: () => <MealDetails meal={meal} />,
      }),
    [openDialog],
  );
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
        title: "Edit this favorite",
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
  return { openCreateMeal, openEditMeal, openMeal };
}
