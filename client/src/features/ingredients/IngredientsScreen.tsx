import { Badge, Button, Input } from "@darthcharles/greda";
import { useState } from "react";
import { Notice } from "../../components/Notice";
import { useIngredients } from "../meals/queries";
import { useDialog } from "../../components/dialog/useDialog";
import type { IngredientCatalogEntry } from "../../types";
import { IngredientForm } from "./IngredientForm";
import { IngredientsSkeleton } from "./IngredientsSkeleton";

export function IngredientsScreen() {
  const { data: ingredients, isPending: loading, error, refetch, isFetching } = useIngredients();
  const [search, setSearch] = useState("");
  const { openDialog } = useDialog();
  const openForm = (ingredient?: IngredientCatalogEntry) => openDialog({
    title: ingredient ? "Edit ingredient" : "Add ingredient",
    content: ({ close }) => <IngredientForm ingredient={ingredient} close={close} />,
  });
  const filtered = [...(ingredients ?? [])]
    .filter((ingredient) => ingredient.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <section aria-labelledby="ingredients-title" className="pb-5 tablet:pb-8">
      <p className="mb-2 text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">Your collection</p>
      <h2 id="ingredients-title" className="mb-3 font-display text-[32px] font-semibold tracking-[-.04em]">My Ingredients</h2>
      <p className="mb-4 text-sm text-muted-foreground">Browse and manage the ingredients for your meals.</p>
      <div className="mb-4 flex min-w-0 items-center gap-2 tablet:gap-3">
        <Input
          type="search"
          aria-label="Search ingredients"
          placeholder="Search ingredients"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={!ingredients}
          className="min-w-0 flex-1 bg-card"
        />
        <Button className="shrink-0" variant="secondary" onClick={() => openForm()}>+ Add ingredient</Button>
      </div>

      {error && (
        <div className="mb-5 space-y-3">
          <Notice>Could not load ingredients. {error.message}</Notice>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Retry ingredients</Button>
        </div>
      )}
      {loading && <IngredientsSkeleton />}
      {ingredients && (
        <>
          <p role="status" className="mb-3 text-xs text-muted-foreground">
            {filtered.length} of {ingredients.length} ingredients
          </p>
          {filtered.length > 0 ? (
            <ul aria-label="Ingredient catalog" className="m-0 grid list-none grid-cols-1 gap-3 p-0 tablet:grid-cols-2 wide:grid-cols-3">
              {filtered.map((ingredient) => (
                <li key={ingredient.id} className="min-w-0 rounded-xl border border-border bg-card px-4 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 break-words font-display text-lg leading-tight font-semibold tracking-[-.03em]">{ingredient.name}</span>
                    <Button variant="ghost" size="sm" className="shrink-0" aria-label={`Edit ${ingredient.name}`} onClick={() => openForm(ingredient)}>Edit</Button>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`mt-2 max-w-full whitespace-normal rounded-full border-0 px-3 py-1.5 text-[11px] leading-normal font-medium ${ingredient.meals.length ? "bg-accent text-secondary" : "bg-muted text-muted-foreground"}`}
                  >
                    {ingredient.meals.length ? `Used in ${ingredient.meals.length} ${ingredient.meals.length === 1 ? "meal" : "meals"}` : "Not used in any meals yet"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[20px] border border-dashed border-border p-6">
              <h3 className="mb-2 font-display text-xl font-semibold">{ingredients.length ? "No ingredients found" : "No ingredients yet"}</h3>
              <p className="m-0 text-sm text-muted-foreground">
                {ingredients.length ? "Try another search." : "Add your first ingredient here or while creating a meal."}
              </p>
              {search && <Button variant="link" className="mt-3 px-0" onClick={() => setSearch("")}>Clear search</Button>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
