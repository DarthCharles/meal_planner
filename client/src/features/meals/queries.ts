import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { queryKeys } from "../../queryKeys";
import type { Meal, MealForm, Menu } from "../../types";

export function useMeals() {
  return useQuery({
    queryKey: queryKeys.meals,
    queryFn: ({ signal }) => api.getMeals(signal),
  });
}

export function useMealTypes() {
  return useQuery({
    queryKey: queryKeys.mealTypes,
    queryFn: ({ signal }) => api.getMealTypes(signal),
    staleTime: 5 * 60_000,
  });
}

export function useUnits() {
  return useQuery({
    queryKey: queryKeys.units,
    queryFn: ({ signal }) => api.getUnits(signal),
    staleTime: 5 * 60_000,
  });
}

function useSyncSavedMeal() {
  const client = useQueryClient();
  return async (meal: Meal) => {
    await Promise.all([
      client.cancelQueries({ queryKey: queryKeys.meals }),
      client.cancelQueries({ queryKey: queryKeys.menus }),
    ]);
    client.setQueryData<Meal[]>(queryKeys.meals, (meals) => {
      if (!meals) return undefined;
      return meals.some((item) => item.id === meal.id)
        ? meals.map((item) => (item.id === meal.id ? meal : item))
        : [...meals, meal];
    });
    client.setQueryData<Menu[]>(queryKeys.menus, (menus) =>
      menus?.map((menu) => ({
        ...menu,
        days: menu.days.map((day) => ({
          ...day,
          meals: day.meals.map((item) => (item.id === meal.id ? meal : item)),
        })),
      })),
    );
    // A mutation response cannot reconstruct a list that has never loaded.
    if (!client.getQueryData(queryKeys.meals)) {
      await client.invalidateQueries({ queryKey: queryKeys.meals });
    }
  };
}

export function useCreateMeal() {
  const syncSavedMeal = useSyncSavedMeal();
  return useMutation({ mutationFn: api.createMeal, onSuccess: syncSavedMeal });
}

export function useUpdateMeal() {
  const syncSavedMeal = useSyncSavedMeal();
  return useMutation({
    mutationFn: ({ id, form }: { id: number; form: MealForm }) =>
      api.updateMeal(id, form),
    onSuccess: syncSavedMeal,
  });
}
