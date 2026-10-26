import { useMealDialog } from "../features/meals/useMealDialog";
export type NavigationProps = {
  view: "menu" | "meals";
  onNavigate: (view: "menu" | "meals") => void;
};

export function Navigation({ view, onNavigate }: NavigationProps) {
  const { openCreateMeal } = useMealDialog();
  return (
    <nav
      className="fixed bottom-[18px] left-1/2 z-10 flex w-[calc(100%-28px)] -translate-x-1/2 items-center justify-around gap-1 rounded-[19px] border border-[rgba(232,225,214,.9)] bg-[rgba(255,253,248,.93)] p-[7px] shadow-[0_12px_35px_rgba(50,35,24,.13)] backdrop-blur-[15px] tablet:w-auto tablet:justify-normal desktop:hidden"
      aria-label="Primary navigation"
    >
      <NavButton
        active={view === "menu"}
        onClick={() => onNavigate("menu")}
        icon="⌂"
        label="My menu"
      />
      <NavButton
        active={view === "meals"}
        onClick={() => onNavigate("meals")}
        icon="◒"
        label="My meals"
      />
      <NavButton
        active={false}
        onClick={openCreateMeal}
        icon="+"
        label="Add meal"
        accent
      />
    </nav>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  accent = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      className={`flex min-w-0 flex-1 flex-col items-center gap-[3px] rounded-[13px] border-0 px-[13px] py-2 text-[10px] font-bold tablet:min-w-[94px] tablet:flex-initial ${active ? "bg-[#f8eee8] text-terracotta" : accent ? "bg-terracotta text-white" : "bg-transparent text-[#a19a8d]"}`}
      onClick={onClick}
    >
      <span className="text-lg leading-[17px]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
