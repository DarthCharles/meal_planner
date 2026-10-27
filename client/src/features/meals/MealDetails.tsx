import { Badge } from "@darthcharles/greda";
import type { Meal } from "../../types";

export function MealDetails({ meal }: { meal: Meal }) {
  return (
    <div className="grid min-w-0 gap-5 break-words">
      <div className="flex flex-wrap gap-2">
        {meal.meal_types.map((type) => (
          <Badge key={type} variant="secondary" className="uppercase">
            {type}
          </Badge>
        ))}
      </div>
      <p className="m-0 text-sm leading-relaxed text-muted-foreground">
        {meal.description}
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
          className="justify-self-start rounded text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Open recipe
        </a>
      )}
    </div>
  );
}
