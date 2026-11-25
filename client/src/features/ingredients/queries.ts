import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../api";
import { queryKeys } from "../../queryKeys";
import type {
  IngredientCatalogEntry,
  IngredientPayload,
  IngredientShoppingProfile,
  IngredientShoppingProfilePayload,
  Meal,
  MeasurementReference,
} from "../../types";
import { updateCachedMenus } from "../menu/queries";

export function useShoppingCategories() {
  return useQuery({
    queryKey: queryKeys.shoppingCategories,
    queryFn: ({ signal }) => api.getShoppingCategories(signal),
    staleTime: Infinity,
  });
}

export function useIngredientShoppingProfile(id: number, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.ingredientProfile(id),
    queryFn: ({ signal }) => api.getIngredientShoppingProfile(id, signal),
    staleTime: 0,
    enabled,
  });
}

function useSyncShoppingProfile(id: number) {
  const client = useQueryClient();
  return async (profile: IngredientShoppingProfile | null) => {
    await client.cancelQueries({ queryKey: queryKeys.ingredientProfile(id) });
    client.setQueriesData<IngredientShoppingProfile | null>(
      { queryKey: queryKeys.ingredientProfile(id) },
      () => profile,
    );
    await client.invalidateQueries({ queryKey: queryKeys.ingredientReferences(id) });
    await client.invalidateQueries({ queryKey: queryKeys.shoppingLists });
  };
}

export function useSaveIngredientShoppingProfile(id: number) {
  const sync = useSyncShoppingProfile(id);
  return useMutation({
    mutationFn: (profile: IngredientShoppingProfilePayload) =>
      api.saveIngredientShoppingProfile(id, profile),
    onSuccess: sync,
  });
}

export function useClearIngredientShoppingProfile(id: number) {
  const sync = useSyncShoppingProfile(id);
  return useMutation({
    mutationFn: () => api.clearIngredientShoppingProfile(id),
    onSuccess: () => sync(null),
  });
}

export function useDeleteIngredient(onDeleted?: () => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.deleteIngredient,
    onSuccess: async (_, id) => {
      // Leave a live editor before removing the catalog entry that supplies its draft.
      onDeleted?.();
      await client.cancelQueries({ queryKey: queryKeys.ingredients });
      await client.cancelQueries({ queryKey: queryKeys.ingredientProfile(id) });
      client.removeQueries({ queryKey: queryKeys.ingredientProfile(id) });
      await client.cancelQueries({ queryKey: queryKeys.ingredientReferences(id) });
      client.removeQueries({ queryKey: queryKeys.ingredientReferences(id) });
      client.setQueryData<IngredientCatalogEntry[]>(queryKeys.ingredients, (catalog) =>
        catalog?.filter((ingredient) => ingredient.id !== id),
      );
    },
  });
}

export function useSaveIngredient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id?: number; values: IngredientPayload }) =>
      id === undefined ? api.createIngredient(values) : api.updateIngredient(id, values),
    onSuccess: async (ingredient) => {
      await Promise.all([
        client.cancelQueries({ queryKey: queryKeys.ingredients }),
        client.cancelQueries({ queryKey: queryKeys.meals }),
        client.cancelQueries({ queryKey: queryKeys.mealDetails }),
      ]);
      client.setQueryData<IngredientCatalogEntry[]>(
        queryKeys.ingredients,
        (catalog) =>
          catalog &&
          [...catalog.filter((item) => item.id !== ingredient.id), ingredient].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
      );
      const updateMeal = (meal: Meal): Meal => ({
        ...meal,
        ingredients: meal.ingredients.map((row) =>
          row.ingredient_id === ingredient.id ? { ...row, name: ingredient.name } : row,
        ),
      });
      client.setQueryData<Meal[]>(queryKeys.meals, (meals) => meals?.map(updateMeal));
      client.setQueriesData<Meal>(
        { queryKey: queryKeys.mealDetails },
        (meal) => meal && updateMeal(meal),
      );
      await updateCachedMenus(client, (menu) => ({
        ...menu,
        days: menu.days.map((day) => ({ ...day, meals: day.meals.map(updateMeal) })),
      }));
      await client.invalidateQueries({ queryKey: queryKeys.ingredients });
      await client.invalidateQueries({ queryKey: queryKeys.shoppingLists });
    },
  });
}

export function useIngredientMeasurementReferences(id: number) {
  return useQuery({
    queryKey: queryKeys.ingredientReferences(id),
    queryFn: ({ signal }) => api.getIngredientMeasurementReferences(id, signal),
    staleTime: 0,
  });
}

export function useSaveIngredientMeasurementReferences(id: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (references: MeasurementReference[]) =>
      api.saveIngredientMeasurementReferences(id, references),
    onSuccess: async (references) => {
      await client.cancelQueries({ queryKey: queryKeys.ingredientReferences(id) });
      client.setQueryData(queryKeys.ingredientReferences(id), references);
      // A failed recalculation belongs to the shopping query, not this successful save.
      await client.invalidateQueries({ queryKey: queryKeys.shoppingLists });
    },
  });
}
