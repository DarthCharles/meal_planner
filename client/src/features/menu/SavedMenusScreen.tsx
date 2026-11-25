import { useState } from "react";

import { Button } from "@darthcharles/greda";
import { Link, useLocation } from "react-router";

import { Notice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import { useMealDialog } from "../meals/useMealDialog";
import { formatMenuDateRange, menuPeriod } from "./menuDates";
import { MenuView } from "./MenuView";
import { useMenu, useMenuSummaries } from "./queries";

export function SavedMenusScreen() {
  const { t } = useI18n();
  const {
    data: savedMenus = [],
    isPending: loading,
    error,
    refetch,
    isFetching,
  } = useMenuSummaries();
  const { openMeal } = useMealDialog();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(
    location.state?.selectedMenuId ?? null,
  );
  const now = new Date();
  const selected = savedMenus.find((menu) => menu.id === selectedId) ?? savedMenus[0];
  const {
    data: menu,
    isPending: loadingMenu,
    error: menuError,
    refetch: refetchMenu,
    isFetching: fetchingMenu,
  } = useMenu(selected?.id ?? 0);

  return (
    <section aria-labelledby="saved-menus-title" className="pb-lg tablet:pb-xl">
      <p className="mb-xs text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
        {t("common.weekly_table")}
      </p>
      <h2
        id="saved-menus-title"
        className="mb-sm font-display text-[32px] font-semibold tracking-[-.04em]"
      >
        {t("navigation.saved_menus")}
      </h2>
      <p className="mb-lg text-sm text-muted-foreground">{t("menu.saved.saved_intro")}</p>
      {error && (
        <div className="mb-lg space-y-sm">
          <Notice>{error.message}</Notice>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            {t("common.try_again")}
          </Button>
        </div>
      )}
      {loading && <p role="status">{t("menu.saved.loading_saved")}</p>}
      {!loading && !error && !savedMenus.length && (
        <div className="rounded-[20px] border border-border bg-card p-lg">
          <h3 className="mb-xs font-display text-xl font-semibold">{t("menu.saved.no_saved")}</h3>
          <p className="m-0 text-sm text-muted-foreground">{t("menu.saved.saved_help")}</p>
        </div>
      )}
      {!!savedMenus.length && (
        <div className="grid min-w-0 gap-lg desktop:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label={t("menu.saved.saved_weeks")} className="flex min-w-0 flex-col gap-xs">
            {savedMenus.map((menu) => (
              <Button
                key={menu.id}
                variant={selected?.id === menu.id ? "secondary" : "outline"}
                aria-current={selected?.id === menu.id ? "true" : undefined}
                onClick={() => setSelectedId(menu.id)}
                className="h-auto min-h-11 flex-col items-start gap-2xs whitespace-normal px-md py-sm text-left"
              >
                <span>{formatMenuDateRange(menu)}</span>
                <span className="text-xs text-muted-foreground">{menuPeriod(menu, now)}</span>
              </Button>
            ))}
          </nav>
          {selected && (
            <section aria-labelledby="saved-menu-title" className="min-w-0">
              <p className="mb-xs text-sm text-muted-foreground">{menuPeriod(selected, now)}</p>
              <h3
                id="saved-menu-title"
                className="mb-md font-display text-2xl font-semibold tracking-[-.04em]"
              >
                {formatMenuDateRange(selected)}
              </h3>
              <Button asChild variant="outline" className="mb-md">
                <Link to={`/menus/${selected.id}/shopping-list`} state={{ from: "/saved-menus" }}>
                  {t("shopping_list.title")}
                </Link>
              </Button>
              {loadingMenu && <p role="status">{t("menu.hero.finding_menu")}</p>}
              {menuError && (
                <div className="mb-lg space-y-sm">
                  <Notice>{menuError.message}</Notice>
                  <Button
                    variant="outline"
                    disabled={fetchingMenu}
                    onClick={() => void refetchMenu()}
                  >
                    {t("common.try_again")}
                  </Button>
                </div>
              )}
              {!!menu?.generation_notices?.length && (
                <Notice>
                  <div>
                    <p className="m-0 font-semibold">{t("menu.notices.preference_fallback")}</p>
                    <ul className="mt-xs mb-0 pl-lg">
                      {menu.generation_notices.map((notice, index) => (
                        <li key={index}>{notice}</li>
                      ))}
                    </ul>
                  </div>
                </Notice>
              )}
              {menu && <MenuView menu={menu} loading={false} onOpenMeal={openMeal} />}
            </section>
          )}
        </div>
      )}
    </section>
  );
}
