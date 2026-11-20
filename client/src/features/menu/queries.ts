import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../api";
import { getLocale, useI18n } from "../../i18n";
import { queryKeys } from "../../queryKeys";
import type { Menu } from "../../types";

export function useShoppingList(id: number) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: [...queryKeys.shoppingLists, id, locale],
    queryFn: ({ signal }) => api.getShoppingList(id, signal),
    // Keep this menu's receipt mounted when the display language changes.
    placeholderData: (previous, query) => (query?.queryKey[1] === id ? previous : undefined),
    enabled: Number.isSafeInteger(id) && id > 0,
    staleTime: 0,
  });
}

export function useMenus() {
  const { locale } = useI18n();
  return useQuery({
    queryKey: [...queryKeys.menus, locale],
    queryFn: ({ signal }) => api.getMenus(signal, locale),
  });
}

export function useGenerateMenu() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const locale = getLocale();
      return { menu: await api.generateMenu(), locale };
    },
    onSuccess: async ({ menu, locale }) => {
      // An older GET response must not overwrite the generated menu.
      await client.cancelQueries({ queryKey: queryKeys.menus });
      client.setQueryData<Menu[]>([...queryKeys.menus, locale], (menus = []) => [
        menu,
        ...menus.filter(
          (item) => item.id !== menu.id && item.from.slice(0, 10) !== menu.from.slice(0, 10),
        ),
      ]);
      await client.invalidateQueries({ queryKey: queryKeys.shoppingLists });
      await client.invalidateQueries({
        queryKey: queryKeys.menus,
        predicate: (query) => query.queryKey[1] !== locale,
      });
    },
  });
}

export function useUpdateMenuPeople(menuId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (people: number) => api.updateMenuPeople(menuId, people),
    onSuccess: async (menu) => {
      await Promise.all([
        client.cancelQueries({ queryKey: queryKeys.menus }),
        client.cancelQueries({ queryKey: [...queryKeys.shoppingLists, menuId] }),
      ]);
      // Copy only the count: each cached language keeps its own notices.
      client.setQueriesData<Menu[]>({ queryKey: queryKeys.menus }, (menus) =>
        menus?.map((item) =>
          item.id === menu.id ? { ...item, people_count: menu.people_count } : item,
        ),
      );
      await client.invalidateQueries({ queryKey: [...queryKeys.shoppingLists, menuId] });
    },
  });
}
