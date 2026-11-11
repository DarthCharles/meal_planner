import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { queryKeys } from "../../queryKeys";
import type { IngredientCatalogEntry, Meal, MealPayload, Menu } from "../../types";

export function useMeals() {
  return useQuery({
    queryKey: queryKeys.meals,
    queryFn: ({ signal }) => api.getMeals(signal),
  });
}

export function useMeal(id: number) {
  return useQuery({
    queryKey: queryKeys.meal(id),
    queryFn: ({ signal }) => api.getMeal(id, signal),
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

export function useIngredients() {
  return useQuery({
    queryKey: queryKeys.ingredients,
    queryFn: ({ signal }) => api.getIngredients(signal),
    staleTime: 5 * 60_000,
  });
}

function useSyncSavedMeal() {
  const client = useQueryClient();
  return async (meal: Meal) => {
    await Promise.all([
      client.cancelQueries({ queryKey: queryKeys.meals }),
      client.cancelQueries({ queryKey: queryKeys.mealDetails }),
      client.cancelQueries({ queryKey: queryKeys.menus }),
      client.cancelQueries({ queryKey: queryKeys.ingredients }),
    ]);
    client.setQueryData<IngredientCatalogEntry[]>(queryKeys.ingredients, (ingredients) => {
      if (!ingredients) return undefined;
      const catalog = new Map(ingredients.map((item) => [item.id, {
        ...item, meals: item.meals.filter((entry) => entry.id !== meal.id),
      }]));
      for (const ingredient of meal.ingredients) {
        if (ingredient.ingredient_id) {
          catalog.set(ingredient.ingredient_id, {
            id: ingredient.ingredient_id,
            name: ingredient.name,
            meals: [...(catalog.get(ingredient.ingredient_id)?.meals ?? []), { id: meal.id, name: meal.name }]
              .sort((left, right) => left.name.localeCompare(right.name)),
          });
        }
      }
      return [...catalog.values()].sort((a, b) => a.name.localeCompare(b.name));
    });
    client.setQueryData<Meal[]>(queryKeys.meals, (meals) => {
      if (!meals) return undefined;
      return meals.some((item) => item.id === meal.id)
        ? meals.map((item) => (item.id === meal.id ? meal : item))
        : [...meals, meal];
    });
    client.setQueriesData<Meal>({ queryKey: queryKeys.mealDetails }, (cached) =>
      cached?.id === meal.id ? meal : cached,
    );
    client.setQueriesData<Menu[]>({ queryKey: queryKeys.menus }, (menus) =>
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
    mutationFn: ({ id, form }: { id: number; form: MealPayload }) =>
      api.updateMeal(id, form),
    onSuccess: syncSavedMeal,
  });
}
