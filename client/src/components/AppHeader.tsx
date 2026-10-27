import { Button } from "@darthcharles/greda";
import { useMealDialog } from "../features/meals/useMealDialog";
import { BowlLogo } from "./BowlLogo";
import type { NavigationProps } from "./Navigation";

export function AppHeader({ view, onNavigate }: NavigationProps) {
  const { openCreateMeal } = useMealDialog();
  return (
    <header className="flex h-[70px] items-center justify-between tablet:h-[86px]">
      <div className="flex items-center gap-[11px]">
        <div className="grid size-[39px] -rotate-6 place-items-center rounded-[12px_12px_12px_4px] bg-primary text-primary-foreground">
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
        <Button
          size="sm"
          variant={view === "menu" ? "secondary" : "ghost"}
          onClick={() => onNavigate("menu")}
        >
          My menu
        </Button>
        <Button
          size="sm"
          variant={view === "meals" ? "secondary" : "ghost"}
          onClick={() => onNavigate("meals")}
        >
          My meals
        </Button>
        <Button
          size="sm"
          onClick={openCreateMeal}
        >
          + Add meal
        </Button>
      </nav>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full text-[11px]"
        aria-label="Open profile"
      >
        MC
      </Button>
    </header>
  );
}
