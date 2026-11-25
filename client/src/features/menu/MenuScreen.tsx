import { Button } from "@darthcharles/greda";
import { Link } from "react-router";

import { Notice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import { useMealDialog } from "../meals/useMealDialog";
import { MenuHero } from "./MenuHero";
import { MenuView } from "./MenuView";
import { NextWeekPlan } from "./NextWeekPlan";
import { useGenerateMenu, useMenuHome } from "./queries";

export function MenuScreen() {
  const { t } = useI18n();
  const { openMeal, openCreateMeal } = useMealDialog();
  const now = new Date();
  const { data: home, isPending: loading, isError, isFetching, refetch } = useMenuHome(now);
  const { mutate: generateMenu, isPending: generating, error: generationError } = useGenerateMenu();
  const currentMenu = home?.current_menu;
  const canAddRecipe = !!home && !currentMenu && home.next_week_menu_id === null;
  const firstRecipe = canAddRecipe && home?.has_meals === false;

  return (
    <div className="space-y-lg tablet:space-y-xl">
      {isError && (
        <div className="my-sm space-y-sm">
          <Notice>{t(home ? "menu.screen.refresh_error" : "menu.screen.load_error")}</Notice>
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
          <section className="mt-xs rounded-[30px] bg-card p-md tablet:p-lg">
            <p className="m-0 text-body text-secondary" role="status">
              {t("menu.hero.finding_menu")}
            </p>
          </section>
          <MenuView menu={null} loading onOpenMeal={openMeal} />
        </>
      )}
      {home && currentMenu && (
        <>
          <MenuHero
            menu={currentMenu}
            nextMealDate={home.next_meal_date}
            now={now}
            onOpenMeal={openMeal}
          />
          <section aria-labelledby="current-week-title" className="space-y-md">
            <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-2xs">
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
                  <ul className="mt-xs mb-0 pl-lg">
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
      {home && !currentMenu && (
        <section className="mt-xs rounded-[30px] bg-card p-md tablet:p-lg">
          <h2 className="m-0 font-display text-[28px] font-semibold">
            {t("menu.screen.no_current_week")}
          </h2>
          {firstRecipe && (
            <p className="mt-xs mb-0 max-w-prose text-body text-secondary">
              {t("menu.hero.recipe_help")}
            </p>
          )}
          {(canAddRecipe || home.has_saved_menus) && (
            <div className="mt-md flex flex-wrap gap-xs">
              {canAddRecipe && (
                <Button
                  variant={firstRecipe ? "default" : "outline"}
                  className="min-h-11"
                  onClick={openCreateMeal}
                >
                  {t(firstRecipe ? "menu.hero.add_first_recipe" : "menu.hero.add_recipe")}
                </Button>
              )}
              {home.has_saved_menus && (
                <Button asChild variant="outline" className="min-h-11">
                  <Link to="/saved-menus">{t("menu.screen.browse_saved")}</Link>
                </Button>
              )}
            </div>
          )}
        </section>
      )}
      {home && !firstRecipe && (
        <NextWeekPlan
          week={home.next_week}
          savedMenuId={home.next_week_menu_id}
          disabled={isFetching || isError}
          generateMenu={generateMenu}
          generating={generating}
          error={generationError}
        />
      )}
    </div>
  );
}
