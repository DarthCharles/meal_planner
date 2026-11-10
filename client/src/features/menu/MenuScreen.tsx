import { Button } from "@darthcharles/greda";
import { Link } from "react-router";
import { useMealDialog } from "../meals/useMealDialog";
import { Notice } from "../../components/Notice";
import { demoMenu } from "../../demoData";
import { MenuView } from "./MenuView";
import { MenuHero } from "./MenuHero";
import { formatMenuDateRange, isCurrentMenu } from "./menuDates";
import { useMenus } from "./queries";

export function MenuScreen() {
  const { openMeal } = useMealDialog();
  const {
    data: menus,
    isPending: loading,
    isError,
    error: menusError,
  } = useMenus();
  const currentMenu = menus?.find((item) => isCurrentMenu(item, new Date()));
  const menu = currentMenu ?? (isError && !menus ? demoMenu : null);
  const error =
    isError && !menus
      ? "Demo mode · connect the Rails API to use your own meals."
      : menusError?.message;
  return (
    <>
      {error && <Notice>{error}</Notice>}
      {!menu && !loading && menus?.length ? (
        <section className="rounded-[30px] bg-accent px-6 py-7">
          <h2 className="mb-3 font-display text-[28px] font-semibold">Nothing planned for this week.</h2>
          <p className="mb-4 text-sm text-muted-foreground">Browse your upcoming and past plans in Saved Menus.</p>
          <Button variant="outline" asChild><Link to="/saved-menus">Browse saved menus</Link></Button>
        </section>
      ) : <MenuHero
        menu={menu}
        loading={loading}
        onOpenMeal={openMeal}
      />}
      {menu && (
        <div className="mt-[31px] mb-[17px] flex flex-col items-start justify-between gap-[15px] tablet:mt-[39px] tablet:mb-5 tablet:flex-row tablet:items-end tablet:gap-0">
          <div>
            <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
              Weekly menu
            </p>
            <h3 className="mb-0 font-display text-[28px] font-semibold tracking-[-.04em]">
              {formatMenuDateRange(menu, false)}
            </h3>
          </div>
        </div>
      )}

      {!!menu?.generation_notices?.length && (
        <Notice>
          <div className="min-w-0">
            <p className="m-0 font-semibold">Some day preferences needed a fallback.</p>
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
