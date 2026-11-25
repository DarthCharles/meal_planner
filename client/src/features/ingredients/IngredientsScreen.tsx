import { useState } from "react";

import { Button, Input } from "@darthcharles/greda";

import { CollectionHeader } from "../../components/CollectionHeader";
import { CollectionRow } from "../../components/CollectionRow";
import { Notice } from "../../components/Notice";
import { formatLocale, useI18n } from "../../i18n";
import { useIngredients } from "../meals/queries";
import { useWorkspaceNavigation } from "../navigation/useWorkspaceNavigation";
import { IngredientsSkeleton } from "./IngredientsSkeleton";

export function IngredientsScreen() {
  const { t } = useI18n();
  const { data: ingredients, isPending: loading, error, refetch, isFetching } = useIngredients();
  const [search, setSearch] = useState("");
  const { openEditor, preview } = useWorkspaceNavigation();
  const filtered = [...(ingredients ?? [])]
    .filter((ingredient) => ingredient.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name, formatLocale()));

  return (
    <section aria-labelledby="ingredients-title" className="pb-lg tablet:pb-xl">
      <CollectionHeader
        titleId="ingredients-title"
        title={t("navigation.my_ingredients")}
        actionLabel={t("ingredients.screen.add_ingredient")}
        actionVariant="default"
        onAdd={() => openEditor("/ingredients/new")}
      />
      <div className="mb-md">
        <Input
          type="search"
          aria-label={t("ingredients.screen.search_ingredients")}
          placeholder={t("ingredients.screen.search_ingredients")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={!ingredients}
          className="min-h-11 w-full min-w-0 bg-card text-body md:text-body"
        />
      </div>

      {error && (
        <div className="mb-lg space-y-sm">
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
          <p role="status" className="text-caption mb-sm text-muted-foreground">
            {t("ingredients.screen.count", { shown: filtered.length, count: ingredients.length })}
          </p>
          {filtered.length > 0 ? (
            <ul
              role="list"
              aria-label={t("ingredients.screen.ingredient_catalog")}
              className="m-0 list-none rounded-xl border border-border p-0"
            >
              {filtered.map((ingredient) => (
                <CollectionRow
                  key={ingredient.id}
                  name={ingredient.name}
                  description={
                    ingredient.meals.length
                      ? t("ingredients.usage", { count: ingredient.meals.length })
                      : t("ingredients.screen.unused")
                  }
                  onOpen={() => preview({ ingredient: ingredient.id, name: ingredient.name })}
                />
              ))}
            </ul>
          ) : (
            <div className="border-t border-border py-lg">
              <h3 className="m-0 font-display text-2xl leading-tight font-semibold tracking-[-.03em] text-balance">
                {ingredients.length
                  ? t("ingredients.screen.no_ingredients_found")
                  : t("ingredients.screen.no_ingredients")}
              </h3>
              <p className="mt-xs mb-0 text-body text-pretty text-muted-foreground">
                {ingredients.length
                  ? t("ingredients.screen.try_search")
                  : t("ingredients.screen.first_ingredient")}
              </p>
              {search && (
                <Button variant="link" className="mt-sm px-0" onClick={() => setSearch("")}>
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
