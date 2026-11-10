import { buttonVariants } from "@darthcharles/greda";
import { NavLink } from "react-router";

export function Navigation() {
  return (
    <nav
      className="fixed bottom-[18px] left-1/2 z-10 flex w-[calc(100%-28px)] -translate-x-1/2 items-center justify-around gap-1 rounded-[19px] border border-border/90 bg-card/95 p-[7px] shadow backdrop-blur-[15px] tablet:w-auto tablet:justify-normal desktop:hidden"
      aria-label="Primary navigation"
    >
      {[
        {
          label: "My menu",
          icon: "⌂",
          to: "/",
        },
        {
          label: "Saved Menus",
          icon: "◷",
          to: "/saved-menus",
        },
        {
          label: "My meals",
          icon: "◒",
          to: "/meals",
        },
      ].map(({ label, icon, to }) => (
        <NavLink
          key={label}
          to={to}
          end
          className={({ isActive }) => buttonVariants({
            variant: isActive ? "secondary" : "ghost",
            className: "h-auto min-w-0 flex-1 flex-col gap-[3px] px-[13px] py-2 text-[10px] tablet:min-w-[94px] tablet:flex-initial",
          })}
        >
          <span className="text-lg leading-[17px]">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
