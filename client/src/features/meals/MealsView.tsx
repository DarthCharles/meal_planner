import { Button } from "../../components/Button";
import { useMemo, useState } from "react";
import type { Meal, MealTypeName } from "../../types";
import { mealTypeOrder, mealTypeLabels, mealTagColors } from "./mealTypes";

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
      <div className="flex flex-col gap-[10px] tablet:flex-row">
        <label className="flex min-h-[43px] flex-1 items-center gap-[9px] rounded-xl border border-line bg-paper px-[13px]">
          <span className="-rotate-15 text-[21px] text-muted">⌕</span>
          <input
            className="w-full border-0 bg-transparent text-[13px] text-ink outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search meals"
          />
        </label>
        <Button variant="secondary" onClick={onAdd}>
          + Add meal
        </Button>
      </div>
      <div className="my-[18px] flex gap-2 overflow-x-auto">
        {["all", ...mealTypeOrder].map((item) => (
          <button
            key={item}
            className={`shrink-0 grow-0 basis-auto rounded-[20px] border px-[13px] py-2 text-[11px] font-bold ${filter === item ? "border-terracotta bg-terracotta text-white" : "border-line bg-transparent text-muted"}`}
            onClick={() => setFilter(item)}
          >
            {item === "all"
              ? "All meals"
              : mealTypeLabels[item as MealTypeName]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-[14px] tablet:grid-cols-2 wide:grid-cols-3">
        {filtered.map((meal) => (
          <article
            className="relative flex min-h-[143px] gap-[15px] overflow-hidden rounded-[17px] border border-line bg-paper pt-5 pr-[18px] pb-[18px] pl-[23px]"
            key={meal.id}
          >
            <div className="absolute top-0 left-0 h-full w-[5px] bg-terracotta"></div>
            <div>
              <div className="flex gap-[5px]">
                {meal.meal_types.map((type) => (
                  <span
                    className={`rounded-[5px] px-[6px] py-1 text-[9px] font-bold uppercase ${mealTagColors[type as MealTypeName] ?? mealTagColors.breakfast}`}
                    key={type}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <h4 className="mt-[10px] mb-[6px] font-display text-lg leading-[normal] font-semibold">
                {meal.name}
              </h4>
              <p className="m-0 text-xs leading-[1.45] text-muted">
                {meal.description}
              </p>
            </div>
            <button
              className="ml-auto self-start border-0 bg-transparent tracking-[2px] text-[#c0b7a9]"
              onClick={() => onEdit(meal)}
              aria-label={`Edit ${meal.name}`}
            >
              Edit
            </button>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="grid min-h-[180px] content-center justify-items-center rounded-[20px] border border-dashed border-[#dfd5c7] px-5 py-[42px] text-center col-span-full">
            <h3 className="font-display text-[28px] mb-[9px] font-semibold tracking-[-.04em]">
              No meals found.
            </h3>
            <p className="mb-[1em] max-w-[300px] text-sm leading-normal text-muted">
              Try another search or add something new.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
