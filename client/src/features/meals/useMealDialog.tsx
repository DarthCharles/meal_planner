import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../queryKeys";
import type { Meal } from "../../types";
import { useWorkspaceNavigation } from "../navigation/useWorkspaceNavigation";

export function useMealDialog() {
  const { openEditor, preview } = useWorkspaceNavigation();
  const client = useQueryClient();
  const remember = (meal: Meal) => client.setQueryData(queryKeys.meal(meal.id), meal);
  return {
    openCreateMeal: () => openEditor("/meals/new"),
    openMeal: (meal: Meal) => {
      remember(meal);
      preview({ meal: meal.id, name: meal.name });
    },
    openMealById: (id: number, name: string) => preview({ meal: id, name }),
  };
}
