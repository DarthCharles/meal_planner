import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { queryKeys } from "../../queryKeys";
import type { IngredientCatalogEntry, IngredientPayload, Meal, Menu } from "../../types";

export function useDeleteIngredient() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.deleteIngredient,
    onSuccess: async (_, id) => {
      await client.cancelQueries({ queryKey: queryKeys.ingredients });
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
        client.cancelQueries({ queryKey: queryKeys.menus }),
      ]);
      client.setQueryData<IngredientCatalogEntry[]>(queryKeys.ingredients, (catalog) =>
        catalog && [...catalog.filter((item) => item.id !== ingredient.id), ingredient]
          .sort((left, right) => left.name.localeCompare(right.name)),
      );
      const updateMeal = (meal: Meal): Meal => ({
        ...meal,
        ingredients: meal.ingredients.map((row) => row.ingredient_id === ingredient.id
          ? { ...row, name: ingredient.name } : row),
      });
      client.setQueryData<Meal[]>(queryKeys.meals, (meals) => meals?.map(updateMeal));
      client.setQueriesData<Meal>({ queryKey: queryKeys.mealDetails }, (meal) => meal && updateMeal(meal));
      client.setQueryData<Menu[]>(queryKeys.menus, (menus) => menus?.map((menu) => ({
        ...menu,
        days: menu.days.map((day) => ({ ...day, meals: day.meals.map(updateMeal) })),
      })));
      await client.invalidateQueries({ queryKey: queryKeys.ingredients });
    },
  });
}
