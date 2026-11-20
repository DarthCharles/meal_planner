import { useState } from "react";

import { Button, Input } from "@darthcharles/greda";

import { CollectionHeader } from "../../components/CollectionHeader";
import { Notice } from "../../components/Notice";
import { formatLocale, useI18n } from "../../i18n";
import type { IngredientCatalogEntry } from "../../types";
import { useIngredients } from "../meals/queries";
import { useWorkspaceNavigation } from "../navigation/useWorkspaceNavigation";
import { IngredientsSkeleton } from "./IngredientsSkeleton";

export function IngredientsScreen() {
  const { t } = useI18n();
  const { data: ingredients, isPending: loading, error, refetch, isFetching } = useIngredients();
  const [search, setSearch] = useState("");
  const { openEditor, preview } = useWorkspaceNavigation();
  const openForm = (ingredient?: IngredientCatalogEntry) =>
    openEditor(ingredient ? `/ingredients/${ingredient.id}/edit` : "/ingredients/new");
  const filtered = [...(ingredients ?? [])]
    .filter((ingredient) => ingredient.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name, formatLocale()));

  return (
    <section aria-labelledby="ingredients-title" className="pb-5 tablet:pb-8">
      <CollectionHeader
        titleId="ingredients-title"
        title={t("navigation.my_ingredients")}
        description={t("ingredients.screen.ingredients_intro")}
        actionLabel={t("ingredients.screen.add_ingredient")}
        onAdd={() => openForm()}
      />
      <div className="mb-4">
        <Input
          type="search"
          aria-label={t("ingredients.screen.search_ingredients")}
          placeholder={t("ingredients.screen.search_ingredients")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={!ingredients}
          className="min-h-11 w-full min-w-0 bg-card"
        />
      </div>

      {error && (
        <div className="mb-5 space-y-3">
          <Notice>
            {t("ingredients.screen.load_error")} {error.message}
          </Notice>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            {t("ingredients.screen.retry")}
          </Button>
        </div>
      )}
      {loading && <IngredientsSkeleton />}
      {ingredients && (
        <>
          <p role="status" className="mb-3 text-xs text-muted-foreground">
            {t("ingredients.screen.count", { shown: filtered.length, count: ingredients.length })}
          </p>
          {filtered.length > 0 ? (
            <ul
              aria-label={t("ingredients.screen.ingredient_catalog")}
              className="m-0 grid list-none grid-cols-1 gap-3 p-0 tablet:grid-cols-2 wide:grid-cols-3"
            >
              {filtered.map((ingredient) => (
                <li
                  key={ingredient.id}
                  className="min-w-0 rounded-xl border border-border bg-card px-4 py-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 break-words font-display text-lg leading-tight font-semibold tracking-[-.03em]">
                      {ingredient.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      aria-label={t("common.edit_name", { name: ingredient.name })}
                      onClick={() => openForm(ingredient)}
                    >
                      {t("common.edit")}
                    </Button>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto max-w-full whitespace-normal break-words px-0 py-1 text-left"
                    onClick={() => preview({ ingredient: ingredient.id, name: ingredient.name })}
                  >
                    {ingredient.meals.length
                      ? t("ingredients.usage", { count: ingredient.meals.length })
                      : t("ingredients.screen.unused_badge")}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[20px] border border-dashed border-border p-6">
              <h3 className="mb-2 font-display text-xl font-semibold">
                {ingredients.length
                  ? t("ingredients.screen.no_ingredients_found")
                  : t("ingredients.screen.no_ingredients")}
              </h3>
              <p className="m-0 text-sm text-muted-foreground">
                {ingredients.length
                  ? t("ingredients.screen.try_search")
                  : t("ingredients.screen.first_ingredient")}
              </p>
              {search && (
                <Button variant="link" className="mt-3 px-0" onClick={() => setSearch("")}>
                  {t("ingredients.screen.clear_search")}
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
