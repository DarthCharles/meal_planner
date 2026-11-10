import { Badge, Button, Card, Input } from "@darthcharles/greda";
import { useMemo, useState } from "react";
import type { Meal, MealTypeName } from "../../types";
import { mealTypeOrder, mealTypeLabels, mealTypeColorClassName } from "./mealTypes";

export function MealsView({
  meals,
  onAdd,
  onEdit,
}: {
  meals: Meal[];
  onAdd: () => void;
  onEdit: (meal: Meal) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      meals.filter(
        (meal) =>
          (filter === "all" || meal.meal_types.includes(filter)) &&
          meal.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [meals, filter, search],
  );
  return (
    <section>
      <div className="mb-4 flex min-w-0 items-center gap-2 tablet:gap-3">
        <Input
          type="search"
          aria-label="Search meals"
          className="min-w-0 flex-1 bg-card"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search meals"
        />
        <Button className="shrink-0" variant="secondary" onClick={onAdd}>
          + Add meal
        </Button>
      </div>
      <div className="my-[18px] flex gap-2 overflow-x-auto">
        {["all", ...mealTypeOrder].map((item) => (
          <Button
            key={item}
            variant={filter === item ? "default" : "outline"}
            size="sm"
            aria-pressed={filter === item}
            className="shrink-0 rounded-full"
            onClick={() => setFilter(item)}
          >
            {item === "all"
              ? "All meals"
              : mealTypeLabels[item as MealTypeName]}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-[14px] tablet:grid-cols-2 wide:grid-cols-3">
        {filtered.map((meal) => (
          <Card
            role="article"
            className="relative flex min-h-[143px] gap-[15px] overflow-hidden rounded-[17px] border border-border bg-card shadow-none pt-5 pr-[18px] pb-[18px] pl-[23px]"
            key={meal.id}
          >
            <div>
              <div className="flex flex-wrap gap-[5px]">
                {meal.meal_types.map((type) => (
                  <Badge
                    variant="secondary"
                    className={`rounded-[5px] border-0 px-[6px] py-1 text-[9px] font-bold text-secondary uppercase ${mealTypeColorClassName(type)}`}
                    key={type}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              <h4 className="mt-[10px] mb-[6px] font-display text-lg leading-[normal] font-semibold">
                {meal.name}
              </h4>
              <p className="m-0 text-xs leading-[1.45] text-muted-foreground">
                {meal.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto self-start"
              onClick={() => onEdit(meal)}
              aria-label={`Edit ${meal.name}`}
            >
              Edit
            </Button>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="grid min-h-[180px] content-center justify-items-center rounded-[20px] border border-dashed border-border px-5 py-[42px] text-center col-span-full">
            <h3 className="font-display text-[28px] mb-[9px] font-semibold tracking-[-.04em]">
              No meals found.
            </h3>
            <p className="mb-[1em] max-w-[300px] text-sm leading-normal text-muted-foreground">
              Try another search or add something new.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
