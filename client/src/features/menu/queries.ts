import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getLocale, useI18n } from "../../i18n";
import { api } from "../../api";
import { queryKeys } from "../../queryKeys";
import type { Menu } from "../../types";

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
        ...menus.filter((item) => item.id !== menu.id && item.from.slice(0, 10) !== menu.from.slice(0, 10)),
      ]);
      await client.invalidateQueries({
        queryKey: queryKeys.menus,
        predicate: (query) => query.queryKey[1] !== locale,
      });
    },
  });
}
