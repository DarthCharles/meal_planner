import { Card } from "@darthcharles/greda";
import type { Menu } from "../../types";
import {
  mealTypeOrder,
  mealTypeLabels,
} from "../meals/mealTypes";

export function DayCard({
  day,
  featured,
}: {
  day: Menu["days"][number];
  featured: boolean;
}) {
  return (
    <Card
      role="article"
      className={`rounded-[20px] border p-[19px] tablet:p-[22px] ${featured ? "border-primary bg-accent shadow" : "border-border bg-card shadow-sm max-[640px]:pt-[17px] max-[640px]:pb-[10px]"}`}
    >
      <div className="mb-[17px] flex items-start justify-between">
        <div>
          <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
            {featured ? "Today" : `Day ${String(day.id).padStart(2, "0")}`}
          </p>
          <h4 className="m-0 font-display text-[23px] font-semibold">
            {day.weekday}
          </h4>
        </div>
        <span className="font-display text-[27px] font-semibold text-muted-foreground">
          {String(day.id).padStart(2, "0")}
        </span>
      </div>
      <div className="grid gap-0.5">
        {day.meals.map((meal, index) => (
          <div
            className={`flex items-center gap-[11px] border-t border-border ${featured ? "min-h-[67px]" : "min-h-[57px] tablet:min-h-[67px]"}`}
            key={`${meal.id}-${index}`}
          >
            <span
              className="size-[9px] basis-[9px] shrink-0 grow-0 rounded-full bg-primary"
            ></span>
            <div className="grid min-w-0 flex-1 gap-1">
              <span className="text-[10px] font-bold tracking-[.08em] text-muted-foreground uppercase">
                {mealTypeLabels[mealTypeOrder[index]]}
              </span>
              <strong className="truncate text-[13px] leading-[1.25]">
                {meal.name}
              </strong>
            </div>
            <span className="text-[22px] text-muted-foreground">›</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
