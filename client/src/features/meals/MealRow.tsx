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
      className={`flex h-auto min-h-[44px] w-full min-w-0 items-center justify-start gap-sm rounded-xl text-left whitespace-normal hover:bg-accent ${hero ? "bg-transparent px-xs py-sm wide:min-h-[88px]" : "bg-card px-sm py-xs"} ${className}`}
      onClick={() => onOpen(meal)}
    >
      <span
        className={`min-w-0 flex-1 ${hero ? "flex items-center gap-xs tablet:grid" : "grid gap-2xs"}`}
      >
        <span
          className={`text-caption ${hero ? `${mealTypeColorClassName(mealType)} w-fit max-w-full shrink-0 rounded-[5px] px-2xs py-2xs` : "text-muted-foreground"}`}
        >
          {mealTypeLabel(mealType)}
        </span>
        <span className="min-w-0 text-body break-words text-pretty text-foreground">
          {meal.name}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </Button>
  );
}
