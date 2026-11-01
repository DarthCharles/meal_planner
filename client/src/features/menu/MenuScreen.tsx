import { useMealDialog } from "../meals/useMealDialog";
import { Notice } from "../../components/Notice";
import { demoMenu } from "../../demoData";
import { MenuView } from "./MenuView";
import { MenuHero } from "./MenuHero";
import { isCurrentMenu } from "./menuDates";
import { useMenus } from "./queries";

export function MenuScreen() {
  const { openMeal } = useMealDialog();
  const {
    data: menus,
    isPending: loading,
    isError,
    error: menusError,
  } = useMenus();
  const menu = menus?.[0] ?? (isError && !menus ? demoMenu : null);
  const currentMenu = menus?.find((item) => isCurrentMenu(item, new Date()));
  const error =
    isError && !menus
      ? "Demo mode · connect the Rails API to use your own meals."
      : menusError?.message;
  return (
    <>
      {error && <Notice>{error}</Notice>}
      <MenuHero
        menu={currentMenu ?? menu}
        loading={loading}
        onOpenMeal={openMeal}
      />
      {menu && (
        <div className="mt-[31px] mb-[17px] flex flex-col items-start justify-between gap-[15px] tablet:mt-[39px] tablet:mb-5 tablet:flex-row tablet:items-end tablet:gap-0">
          <div>
            <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
              Weekly menu
            </p>
            <h3 className="mb-0 font-display text-[28px] font-semibold tracking-[-.04em]">
              {formatDateRange(menu.from, menu.to)}
            </h3>
          </div>
        </div>
      )}

      <MenuView menu={menu} loading={loading} onOpenMeal={openMeal} />
    </>
  );
}

function formatDateRange(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return `${start.toLocaleDateString("en-US", options)} — ${end.toLocaleDateString("en-US", options)}`;
}
