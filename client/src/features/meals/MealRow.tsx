import { Button } from "@darthcharles/greda";
import type { Meal, MealTypeName } from "../../types";
import { mealTypeLabels } from "./mealTypes";

export function MealRow({
  meal,
  mealType,
  onOpen,
  className = "",
}: {
  meal: Meal;
  mealType: MealTypeName;
  onOpen: (meal: Meal) => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={`View ${mealTypeLabels[mealType]}: ${meal.name}`}
      className={`flex h-auto min-h-[44px] w-full min-w-0 items-center justify-start gap-[11px] rounded-xl bg-card px-3 py-1.5 text-left whitespace-normal hover:bg-muted ${className}`}
      onClick={() => onOpen(meal)}
    >
      <span
        aria-hidden="true"
        className="size-[9px] shrink-0 rounded-full bg-primary"
      />
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="text-[10px] leading-tight font-bold tracking-[.08em] text-muted-foreground uppercase">
          {mealTypeLabels[mealType]}
        </span>
        <strong className="text-[13px] leading-[1.25] break-words">
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
