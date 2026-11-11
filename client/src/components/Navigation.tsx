import { useI18n } from "../i18n";
import { buttonVariants } from "@darthcharles/greda";
import { NavLink } from "react-router";

export function Navigation() {
  const { t } = useI18n();
  return (
    <nav
      className="fixed bottom-[18px] left-1/2 z-10 flex w-[calc(100%-28px)] -translate-x-1/2 items-center justify-around gap-1 rounded-[19px] border border-border/90 bg-card/95 p-[7px] shadow backdrop-blur-[15px] tablet:w-auto tablet:justify-normal desktop:hidden"
      aria-label={t("navigation.primary_navigation")}
    >
      {[
        {
          label: t("navigation.my_menu_mobile"),
          icon: "⌂",
          to: "/",
        },
        {
          label: t("navigation.saved_menus"),
          icon: "◷",
          to: "/saved-menus",
        },
        {
          label: t("navigation.my_meals_mobile"),
          icon: "◒",
          to: "/meals",
        },
        {
          label: t("navigation.my_ingredients"),
          icon: "❧",
          to: "/ingredients",
        },
      ].map(({ label, icon, to }) => (
        <NavLink
          key={label}
          to={to}
          end
          className={({ isActive }) => buttonVariants({
            variant: isActive ? "secondary" : "ghost",
            className: "h-auto min-w-0 flex-1 flex-col whitespace-normal text-center gap-[3px] px-1 py-2 text-[10px] tablet:min-w-[94px] tablet:flex-initial tablet:px-[13px]",
          })}
        >
          <span className="text-lg leading-[17px]">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
