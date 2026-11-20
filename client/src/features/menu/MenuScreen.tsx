import { Button } from "@darthcharles/greda";
import { Link } from "react-router";

import { Notice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import { useMeals } from "../meals/queries";
import { useMealDialog } from "../meals/useMealDialog";
import { formatMenuDateRange, isCurrentMenu } from "./menuDates";
import { MenuHero } from "./MenuHero";
import { MenuView } from "./MenuView";
import { useMenus } from "./queries";

export function MenuScreen() {
  const { t } = useI18n();
  const { openMeal, openCreateMeal } = useMealDialog();
  const { data: menus, isPending: loading, isError, isFetching, refetch } = useMenus();
  const { data: meals } = useMeals({ enabled: !loading && !isError && menus?.length === 0 });
  const currentMenu = menus?.find((item) => isCurrentMenu(item, new Date()));
  const menu = currentMenu ?? null;
  return (
    <>
      {isError && (
        <div className="my-3 space-y-3">
          <Notice>{t(menus ? "menu.screen.refresh_error" : "menu.screen.load_error")}</Notice>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {t(isFetching ? "menu.screen.retrying" : "common.try_again")}
          </Button>
        </div>
      )}
      {isError && !menus ? null : !menu && !loading && menus?.length ? (
        <section className="rounded-[30px] surface-tertiary px-6 py-7">
          <h2 className="mb-3 font-display text-[28px] font-semibold">
            {t("menu.screen.no_current_week")}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">{t("menu.screen.browse_plans_help")}</p>
          <Button variant="outline" className="min-h-11" asChild>
            <Link to="/saved-menus">{t("menu.screen.browse_saved")}</Link>
          </Button>
        </section>
      ) : (
        <MenuHero
          menu={menu}
          loading={loading}
          onOpenMeal={openMeal}
          onAddMeal={openCreateMeal}
          firstRecipe={meals?.length === 0}
        />
      )}
      {menu && (
        <div className="mt-[31px] mb-[17px] flex flex-col items-start justify-between gap-[15px] tablet:mt-[39px] tablet:mb-5 tablet:flex-row tablet:items-end tablet:gap-0">
          <div>
            <p className="mb-[5px] text-xs font-bold tracking-[.13em] text-muted-foreground uppercase">
              {t("menu.screen.weekly_menu")}
            </p>
            <h3 className="mb-0 font-display text-[28px] font-semibold tracking-[-.04em]">
              {formatMenuDateRange(menu, false)}
            </h3>
          </div>
          {currentMenu && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to={`/menus/${currentMenu.id}/shopping-list`} state={{ from: "/" }}>
                {t("shopping_list.title")}
              </Link>
            </Button>
          )}
        </div>
      )}

      {!!menu?.generation_notices?.length && (
        <Notice>
          <div className="min-w-0">
            <p className="m-0 font-semibold">{t("menu.notices.preference_fallback")}</p>
            <ul className="mt-2 mb-0 pl-5">
              {menu.generation_notices.map((notice, index) => (
                <li key={index}>{notice}</li>
              ))}
            </ul>
          </div>
        </Notice>
      )}
      <MenuView menu={menu} loading={loading} onOpenMeal={openMeal} />
    </>
  );
}
