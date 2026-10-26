import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { queryKeys } from "../../queryKeys";
import type { Menu } from "../../types";

export function useMenus() {
  return useQuery({
    queryKey: queryKeys.menus,
    queryFn: ({ signal }) => api.getMenus(signal),
  });
}

export function useGenerateMenu() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: api.generateMenu,
    onSuccess: async (menu) => {
      // An older GET response must not overwrite the generated menu.
      await client.cancelQueries({ queryKey: queryKeys.menus });
      client.setQueryData<Menu[]>(queryKeys.menus, (menus = []) => [
        menu,
        ...menus.filter((item) => item.id !== menu.id),
      ]);
    },
  });
}
