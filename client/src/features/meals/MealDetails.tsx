import { Badge, Button } from "@darthcharles/greda";
import type { Meal } from "../../types";
import { preferredDaysLabel } from "./preferredDays";
import { mealTypeColorClassName } from "./mealTypes";

export function MealDetails({ meal, onEdit }: { meal: Meal; onEdit: () => void }) {
  return (
    <div className="grid min-w-0 gap-5 break-words">
      <div className="flex flex-wrap gap-2">
        {meal.meal_types.map((type) => (
          <Badge
            key={type}
            variant="secondary"
            className={`border-0 text-secondary uppercase ${mealTypeColorClassName(type)}`}
          >
            {type}
          </Badge>
        ))}
      </div>
      <p className="m-0 text-sm leading-relaxed text-muted-foreground">
        {meal.description}
      </p>
      <p className="m-0 text-sm text-muted-foreground">
        <span className="font-semibold">Preferred days: </span>
        {preferredDaysLabel(meal.preferred_days ?? [])}
      </p>
      <section aria-label="Ingredients">
        <h3 className="mb-3 font-display text-xl font-semibold">Ingredients</h3>
        {meal.ingredients.length ? (
          <ul className="m-0 grid list-none gap-3 p-0">
            {meal.ingredients.map((ingredient, index) => (
              <li
                key={ingredient.id ?? index}
                className="border-t border-border pt-3 text-sm leading-relaxed"
              >
                <span className="font-semibold">
                  {ingredient.quantity} {ingredient.unit} · {ingredient.name}
                </span>
                {ingredient.preparation_note && (
                  <p className="mt-1 mb-0 text-muted-foreground">
                    {ingredient.preparation_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">
            No ingredients added yet.
          </p>
        )}
      </section>
      {meal.recipe_url && (
        <a
          href={meal.recipe_url}
          target="_blank"
          rel="noopener noreferrer"
          className="justify-self-start rounded text-sm font-semibold text-action underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Open recipe
        </a>
      )}
      <Button variant="link" className="justify-self-start px-0" onClick={onEdit}>
        Edit meal
      </Button>
    </div>
  );
}
