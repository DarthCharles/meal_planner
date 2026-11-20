import { Button } from "@darthcharles/greda";
import { ChevronRight } from "@darthcharles/greda/icons";

import { useI18n } from "../../i18n";
import type { Meal, MealTypeName } from "../../types";
import { mealTypeColorClassName, mealTypeLabel } from "./mealTypes";

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
  const { t } = useI18n();
  const hero = variant === "hero";
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={t("meals.row.view_meal", { type: mealTypeLabel(mealType), name: meal.name })}
      className={`flex h-auto min-h-[44px] w-full min-w-0 items-center justify-start gap-[11px] rounded-xl text-left whitespace-normal hover:bg-accent ${hero ? "bg-transparent px-2 py-3 wide:min-h-[88px]" : "bg-card px-3 py-1.5"} ${className}`}
      onClick={() => onOpen(meal)}
    >
      <span className={`grid min-w-0 flex-1 ${hero ? "gap-2" : "gap-1"}`}>
        <span
          className={`leading-tight uppercase ${hero ? `${mealTypeColorClassName(mealType)} w-fit max-w-full rounded-[5px] px-1.5 py-1 text-[11px] font-medium tracking-[.08em]` : "text-[11px] font-bold tracking-[.08em] text-muted-foreground"}`}
        >
          {mealTypeLabel(mealType)}
        </span>
        <strong
          className={`break-words font-sans ${hero ? "text-[20px] leading-[1.15] font-semibold tracking-[-.02em] text-foreground tablet:text-[23px]" : "text-[13px] leading-[1.25]"}`}
        >
          {meal.name}
        </strong>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </Button>
  );
}
