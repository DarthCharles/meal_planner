import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@darthcharles/greda";
import { ArrowLeft, CalendarDays, ShoppingBasket } from "@darthcharles/greda/icons";
import { Link, useLocation } from "react-router";

import { Notice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import { useMealDialog } from "../meals/useMealDialog";
import { formatCompactMenuDateRange, formatMenuDateRange, menuPeriod } from "./menuDates";
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
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const changeWeek = useRef<HTMLButtonElement>(null);
  const backToMenu = useRef<HTMLButtonElement>(null);
  const restoreWeekPickerFocus = useRef(false);
  const now = new Date();
  const selected = savedMenus.find((menu) => menu.id === selectedId) ?? savedMenus[0];
  const {
    data: menu,
    isPending: loadingMenu,
    error: menuError,
    refetch: refetchMenu,
    isFetching: fetchingMenu,
  } = useMenu(selected?.id ?? 0);

  useLayoutEffect(() => {
    if (showWeekPicker) {
      backToMenu.current?.focus();
    } else if (restoreWeekPickerFocus.current) {
      changeWeek.current?.focus();
      restoreWeekPickerFocus.current = false;
    }
  }, [showWeekPicker]);

  function closeWeekPicker() {
    restoreWeekPickerFocus.current = true;
    setShowWeekPicker(false);
  }

  return (
    <section aria-labelledby="saved-menus-title" className="pb-lg tablet:pb-xl">
      <header className={showWeekPicker && selected ? "hidden desktop:block" : undefined}>
        <p className="mb-xs hidden text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase desktop:block">
          {t("common.weekly_table")}
        </p>
        <h2
          id="saved-menus-title"
          className="mb-sm font-display text-[32px] font-semibold tracking-[-.04em]"
        >
          {t("navigation.saved_menus")}
        </h2>
        <p className="mb-lg hidden text-sm text-muted-foreground desktop:block">
          {t("menu.saved.saved_intro")}
        </p>
      </header>
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
          <div
            id="saved-week-picker"
            className={`min-w-0 desktop:block ${showWeekPicker ? "" : "hidden"}`}
          >
            {showWeekPicker && (
              <div className="mb-sm desktop:hidden">
                <Button
                  ref={backToMenu}
                  variant="link"
                  className="mb-xs min-h-11 px-0"
                  onClick={closeWeekPicker}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  {t("menu.saved.back_to_menu")}
                </Button>
                <h2 className="m-0 font-display text-[32px] font-semibold tracking-[-.04em]">
                  {t("menu.saved.change_week")}
                </h2>
              </div>
            )}
            <nav aria-label={t("menu.saved.saved_weeks")} className="flex flex-col gap-xs">
              {savedMenus.map((menu) => (
                <Button
                  key={menu.id}
                  variant={selected?.id === menu.id ? "secondary" : "outline"}
                  aria-current={selected?.id === menu.id ? "true" : undefined}
                  onClick={() => {
                    setSelectedId(menu.id);
                    if (showWeekPicker) closeWeekPicker();
                  }}
                  className="h-auto min-h-11 flex-col items-start gap-2xs whitespace-normal px-md py-sm text-left"
                >
                  <span>{formatMenuDateRange(menu)}</span>
                  <span className="text-xs text-muted-foreground">{menuPeriod(menu, now)}</span>
                </Button>
              ))}
            </nav>
          </div>
          {selected && (
            <section
              aria-labelledby="saved-menu-title"
              className={`min-w-0 ${showWeekPicker ? "hidden desktop:block" : ""}`}
            >
              <div className="@container mb-sm grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-xs desktop:mb-md desktop:block">
                <div className="min-w-0 space-y-3xs">
                  <p className="m-0 text-caption text-muted-foreground">
                    {menuPeriod(selected, now, "header")}
                  </p>
                  <h3
                    id="saved-menu-title"
                    className="m-0 font-display text-xl leading-tight font-semibold tracking-[-.03em] desktop:text-2xl"
                  >
                    {formatCompactMenuDateRange(selected)}
                  </h3>
                </div>
                <Button
                  ref={changeWeek}
                  variant="outline"
                  aria-label={t("menu.saved.change_week")}
                  aria-controls="saved-week-picker"
                  aria-expanded={showWeekPicker}
                  aria-describedby="saved-menu-title"
                  className="h-auto min-h-11 min-w-11 px-sm desktop:hidden"
                  onClick={() => setShowWeekPicker(true)}
                >
                  <CalendarDays aria-hidden="true" />
                  <span className="hidden @min-[350px]:inline">{t("menu.saved.change_week")}</span>
                </Button>
              </div>
              <Button asChild className="mb-md w-full max-desktop:min-h-11 desktop:w-auto">
                <Link to={`/menus/${selected.id}/shopping-list`} state={{ from: "/saved-menus" }}>
                  <ShoppingBasket aria-hidden="true" />
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
