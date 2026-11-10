import { Button } from "@darthcharles/greda";
import type { Meal, MealTypeName } from "../../types";
import { mealTypeLabels } from "./mealTypes";

export function MealRow({
  meal,
  mealType,
  onOpen,
  className = "",
  variant = "default",
}: {
  meal: Meal;
  mealType: MealTypeName;
  onOpen: (meal: Meal) => void;
  className?: string;
  variant?: "default" | "hero";
}) {
  const hero = variant === "hero";
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={`View ${mealTypeLabels[mealType]}: ${meal.name}`}
      className={`flex h-auto min-h-[44px] w-full min-w-0 items-center justify-start gap-[11px] rounded-xl bg-card text-left whitespace-normal hover:bg-muted ${hero ? "px-3 py-2 tablet:min-h-[68px]" : "px-3 py-1.5"} ${className}`}
      onClick={() => onOpen(meal)}
    >
      <span className="grid min-w-0 flex-1 gap-1">
        <span className={`leading-tight text-muted-foreground uppercase ${hero ? "text-[9px] font-medium tracking-[.12em]" : "text-[10px] font-bold tracking-[.08em]"}`}>
          {mealTypeLabels[mealType]}
        </span>
        <strong className={`break-words ${hero ? "text-[13px] leading-snug font-medium text-secondary" : "text-[13px] leading-[1.25]"}`}>
          {meal.name}
        </strong>
      </span>
      <span
        aria-hidden="true"
        className="shrink-0 text-[22px] leading-none text-muted-foreground"
      >
        ›
      </span>
    </Button>
  );
}
