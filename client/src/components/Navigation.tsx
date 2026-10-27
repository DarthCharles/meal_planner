import { Button } from "@darthcharles/greda";
import { useMealDialog } from "../features/meals/useMealDialog";
export type NavigationProps = {
  view: "menu" | "meals";
  onNavigate: (view: "menu" | "meals") => void;
};

export function Navigation({ view, onNavigate }: NavigationProps) {
  const { openCreateMeal } = useMealDialog();
  return (
    <nav
      className="fixed bottom-[18px] left-1/2 z-10 flex w-[calc(100%-28px)] -translate-x-1/2 items-center justify-around gap-1 rounded-[19px] border border-border/90 bg-card/95 p-[7px] shadow backdrop-blur-[15px] tablet:w-auto tablet:justify-normal desktop:hidden"
      aria-label="Primary navigation"
    >
      {[
        {
          label: "My menu",
          icon: "⌂",
          active: view === "menu",
          onClick: () => onNavigate("menu"),
        },
        {
          label: "My meals",
          icon: "◒",
          active: view === "meals",
          onClick: () => onNavigate("meals"),
        },
        {
          label: "Add meal",
          icon: "+",
          active: false,
          onClick: openCreateMeal,
        },
      ].map(({ label, icon, active, onClick }) => (
        <Button
          key={label}
          variant={active ? "secondary" : label === "Add meal" ? "default" : "ghost"}
          className="h-auto min-w-0 flex-1 flex-col gap-[3px] px-[13px] py-2 text-[10px] tablet:min-w-[94px] tablet:flex-initial"
          onClick={onClick}
        >
          <span className="text-lg leading-[17px]">{icon}</span>
          <span>{label}</span>
        </Button>
      ))}
    </nav>
  );
}
