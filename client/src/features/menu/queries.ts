import type { QueryClient } from "@tanstack/react-query";
import { useIsMutating, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../api";
import { t, useI18n } from "../../i18n";
import { queryKeys } from "../../queryKeys";
import type { Menu, MenuHome, MenuSummary } from "../../types";
import { localDateKey, nextGenerationWeek, startsWithinWeek } from "./menuDates";

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

export function useMenuHome(now: Date) {
  const { locale } = useI18n();
  const date = localDateKey(now);
  return useQuery({
    queryKey: [...queryKeys.menuHome, date, nextGenerationWeek(now).from, locale],
    queryFn: ({ signal }) => api.getMenuHome(date, locale, signal),
  });
}

export function useMenuSummaries() {
  return useQuery({
    queryKey: queryKeys.menuSummaries,
    queryFn: ({ signal }) => api.getMenuSummaries(signal),
  });
}

export function useMenu(id: number) {
  const { locale } = useI18n();
  return useQuery({
    queryKey: [...queryKeys.menu(id), locale],
    queryFn: ({ signal }) => api.getMenu(id, locale, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
  });
}

export async function updateCachedMenus(client: QueryClient, updateMenu: (menu: Menu) => Menu) {
  const filters = [queryKeys.menuDetails, queryKeys.menuHome].map((queryKey) => ({ queryKey }));
  await Promise.all(filters.map((filter) => client.cancelQueries(filter)));

  client.setQueriesData<Menu>(
    { queryKey: queryKeys.menuDetails },
    (menu) => menu && updateMenu(menu),
  );
  client.setQueriesData<MenuHome>({ queryKey: queryKeys.menuHome }, (home) =>
    home?.current_menu ? { ...home, current_menu: updateMenu(home.current_menu) } : home,
  );

  // A cancelled initial load has no cached menu to patch.
  for (const filter of filters) {
    void client.refetchQueries({
      ...filter,
      type: "active",
      predicate: (query) => query.state.status === "pending",
    });
  }
}

export function useGenerateMenu() {
  const client = useQueryClient();
  const mutationKey = [...queryKeys.menus, "generate"];
  const isPending = useIsMutating({ mutationKey }) > 0;
  const { mutate, error } = useMutation({
    mutationKey,
    mutationFn: async (weekStart: string) => {
      if (nextGenerationWeek(new Date()).from !== weekStart) {
        // A confirmation opened before the UTC week changed cannot authorize the new range.
        void client.invalidateQueries({ queryKey: queryKeys.menus });
        throw new Error(t("menu.next_week.date_changed"));
      }
      return api.generateMenu();
    },
    onSuccess: async (menu) => {
      // An older GET response must not overwrite the generated menu.
      await client.cancelQueries({ queryKey: queryKeys.menus });
      client.setQueriesData<MenuHome>({ queryKey: queryKeys.menuHome }, (home) =>
        home && startsWithinWeek(menu, home.next_week)
          ? { ...home, next_week_menu_id: menu.id, has_saved_menus: true }
          : home,
      );
      client.setQueryData<MenuSummary[]>(
        queryKeys.menuSummaries,
        (summaries) =>
          summaries &&
          [
            { id: menu.id, from: menu.from, to: menu.to },
            ...summaries.filter((item) => item.id !== menu.id && !startsWithinWeek(item, menu)),
          ].sort((left, right) => right.from.localeCompare(left.from) || right.id - left.id),
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.menus }),
        client.invalidateQueries({ queryKey: queryKeys.shoppingLists }),
      ]);
    },
  });
  return { mutate, error, isPending };
}

export function useUpdateMenuPeople(menuId: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (people: number) => api.updateMenuPeople(menuId, people),
    onSuccess: async (menu) => {
      await client.cancelQueries({ queryKey: [...queryKeys.shoppingLists, menuId] });
      // Copy only the count: each cached language keeps its own notices.
      await updateCachedMenus(client, (item) =>
        item.id === menu.id ? { ...item, people_count: menu.people_count } : item,
      );
      await client.invalidateQueries({ queryKey: [...queryKeys.shoppingLists, menuId] });
    },
  });
}
