import { useMealDialog } from "../features/meals/useMealDialog";
import { BowlLogo } from "./BowlLogo";
import type { NavigationProps } from "./Navigation";

export function AppHeader({ view, onNavigate }: NavigationProps) {
  const { openCreateMeal } = useMealDialog();
  return (
    <header className="flex h-[70px] items-center justify-between tablet:h-[86px]">
      <div className="flex items-center gap-[11px]">
        <div className="grid size-[39px] -rotate-6 place-items-center rounded-[12px_12px_12px_4px] bg-terracotta text-white">
          <BowlLogo />
        </div>
        <div>
          <p className="hidden">Your weekly table</p>
          <h1 className="m-0 font-display text-[27px] font-bold tracking-[-.06em]">
            comal
          </h1>
        </div>
      </div>
      <nav
        className="mr-7 ml-auto hidden items-center gap-[5px] desktop:flex"
        aria-label="Primary navigation"
      >
        <button
          className={`rounded-[9px] border-0 px-3 py-[9px] text-xs font-bold hover:bg-[#f8eee8] hover:text-terracotta-dark ${view === "menu" ? "bg-[#f8eee8] text-terracotta-dark" : "bg-transparent text-muted"}`}
          onClick={() => onNavigate("menu")}
        >
          My menu
        </button>
        <button
          className={`rounded-[9px] border-0 px-3 py-[9px] text-xs font-bold hover:bg-[#f8eee8] hover:text-terracotta-dark ${view === "meals" ? "bg-[#f8eee8] text-terracotta-dark" : "bg-transparent text-muted"}`}
          onClick={() => onNavigate("meals")}
        >
          My meals
        </button>
        <button
          className="rounded-[9px] border-0 bg-terracotta px-3 py-[9px] text-xs font-bold text-white hover:bg-terracotta-dark"
          onClick={openCreateMeal}
        >
          + Add meal
        </button>
      </nav>
      <button
        className="size-[38px] rounded-full border border-[#e1dbd0] bg-transparent text-[11px] font-bold text-terracotta-dark"
        aria-label="Open profile"
      >
        MC
      </button>
    </header>
  );
}
