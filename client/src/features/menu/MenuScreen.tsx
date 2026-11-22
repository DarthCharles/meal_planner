import { Button } from "@darthcharles/greda";
import { Link } from "react-router";

import { Notice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import { useMeals } from "../meals/queries";
import { useMealDialog } from "../meals/useMealDialog";
import { isCurrentMenu, nextGenerationWeek, startsWithinWeek } from "./menuDates";
import { MenuHero } from "./MenuHero";
import { MenuView } from "./MenuView";
import { NextWeekPlan } from "./NextWeekPlan";
import { useMenus } from "./queries";

export function MenuScreen() {
  const { t } = useI18n();
  const { openMeal, openCreateMeal } = useMealDialog();
  const { data: menus, isPending: loading, isError, isFetching, refetch } = useMenus();
  const now = new Date();
  const currentMenu = menus?.find((menu) => isCurrentMenu(menu, now));
  const nextWeek = nextGenerationWeek(now);
  const savedNextWeek = menus?.find((menu) => startsWithinWeek(menu, nextWeek));
  const checkLibrary = !!menus && !currentMenu && !savedNextWeek;
  const { data: meals, isLoading: checkingLibrary } = useMeals({ enabled: checkLibrary });
  const firstRecipe = checkLibrary && meals?.length === 0;
  const canAddRecipe = checkLibrary && !checkingLibrary;

  return (
    <div className="space-y-6 tablet:space-y-8">
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
      {loading && (
        <>
          <section className="mt-2 rounded-[30px] bg-card p-4 tablet:p-6">
            <p className="m-0 text-body text-secondary" role="status">
              {t("menu.hero.finding_menu")}
            </p>
          </section>
          <MenuView menu={null} loading onOpenMeal={openMeal} />
        </>
      )}
      {currentMenu && menus && (
        <>
          <MenuHero menu={currentMenu} menus={menus} now={now} onOpenMeal={openMeal} />
          <section aria-labelledby="current-week-title" className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2
                id="current-week-title"
                className="m-0 font-display text-[28px] font-semibold tracking-[-.03em]"
              >
                {t("menu.screen.this_week")}
              </h2>
              <Button asChild variant="link" className="h-auto min-h-11 px-0 underline">
                <Link to="/saved-menus" state={{ selectedMenuId: currentMenu.id }}>
                  {t("navigation.saved_menus")}
                </Link>
              </Button>
            </div>
            {!!currentMenu.generation_notices?.length && (
              <Notice>
                <div className="min-w-0">
                  <p className="m-0 font-semibold">{t("menu.notices.preference_fallback")}</p>
                  <ul className="mt-2 mb-0 pl-5">
                    {currentMenu.generation_notices.map((notice, index) => (
                      <li key={index}>{notice}</li>
                    ))}
                  </ul>
                </div>
              </Notice>
            )}
            <MenuView menu={currentMenu} loading={false} onOpenMeal={openMeal} />
          </section>
        </>
      )}
      {menus && !currentMenu && (
        <section className="mt-2 rounded-[30px] bg-card p-4 tablet:p-6">
          <h2 className="m-0 font-display text-[28px] font-semibold">
            {t("menu.screen.no_current_week")}
          </h2>
          {firstRecipe && (
            <p className="mt-2 mb-0 max-w-prose text-body text-secondary">
              {t("menu.hero.recipe_help")}
            </p>
          )}
          {(canAddRecipe || menus.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {canAddRecipe && (
                <Button
                  variant={firstRecipe ? "default" : "outline"}
                  className="min-h-11"
                  onClick={openCreateMeal}
                >
                  {t(firstRecipe ? "menu.hero.add_first_recipe" : "menu.hero.add_recipe")}
                </Button>
              )}
              {menus.length > 0 && (
                <Button asChild variant="outline" className="min-h-11">
                  <Link to="/saved-menus">{t("menu.screen.browse_saved")}</Link>
                </Button>
              )}
            </div>
          )}
        </section>
      )}
      {menus && !firstRecipe && (
        <NextWeekPlan
          week={nextWeek}
          savedMenu={savedNextWeek}
          disabled={checkingLibrary || isFetching || isError}
        />
      )}
    </div>
  );
}
