import { useId, useState } from "react";

import { Button, Input } from "@darthcharles/greda";
import { useForm } from "react-hook-form";

import { useI18n } from "../../i18n";
import type { IngredientCatalogEntry, IngredientPayload } from "../../types";
import { useMealDialog } from "../meals/useMealDialog";
import { IngredientShoppingSummary } from "./IngredientShoppingSummary";
import { useDeleteIngredient, useSaveIngredient } from "./queries";

export function IngredientForm({
  ingredient,
  close,
}: {
  ingredient?: IngredientCatalogEntry;
  close: () => void;
}) {
  const { t } = useI18n();
  const { openMealById } = useMealDialog();
  const formId = useId();
  const [editingShopping, setEditingShopping] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IngredientPayload>({
    defaultValues: { name: ingredient?.name ?? "" },
  });
  const {
    mutate: saveIngredient,
    isPending: saving,
    error: saveError,
    reset: resetSave,
  } = useSaveIngredient();
  const {
    mutate: deleteIngredient,
    isPending: deleting,
    error: deleteError,
    reset: resetDelete,
  } = useDeleteIngredient();
  const busy = saving || deleting;
  const fieldError = errors.name?.message ?? saveError?.message;
  const message = deleteError?.message ?? fieldError;
  return (
    <div>
      <form
        id={formId}
        className={editingShopping ? "hidden" : undefined}
        noValidate
        onSubmit={handleSubmit(
          (values) => {
            if (busy || editingShopping) return;
            resetDelete();
            saveIngredient(
              { id: ingredient?.id, values: { name: values.name.trim() } },
              { onSuccess: close },
            );
          },
          () => {
            resetSave();
            resetDelete();
          },
        )}
      >
        <label className="mb-4 grid gap-2 text-xs font-bold">
          {t("ingredients.form.name")}
          <Input
            {...register("name", {
              validate: (value) => !!value.trim() || t("ingredients.form.ingredient_required"),
            })}
            disabled={busy || editingShopping}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError && !deleteError ? "ingredient-form-error" : undefined}
            placeholder={t("ingredients.form.ingredient_example")}
          />
        </label>
        {ingredient && (
          <p className="mb-4 text-sm text-muted-foreground">
            {t("ingredients.form.rename_ingredient_help")}
          </p>
        )}
      </form>
      {ingredient && !editingShopping && (
        <section aria-label={t("ingredients.form.meals_using")} className="mb-4">
          <h3 className="mb-1 font-display text-xl font-semibold">
            {t("ingredients.usage", { count: ingredient.meals.length })}
          </h3>
          {ingredient.meals.length ? (
            <ul className="m-0 grid list-none gap-0 p-0">
              {ingredient.meals.map((meal) => (
                <li key={meal.id}>
                  <Button
                    variant="link"
                    disabled={editingShopping || busy}
                    className="h-auto max-w-full whitespace-normal break-words px-0 py-1 text-left"
                    onClick={() => openMealById(meal.id, meal.name)}
                  >
                    {meal.name}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">
              {t("ingredients.form.unused_ingredient")}
            </p>
          )}
        </section>
      )}
      {ingredient && (
        <IngredientShoppingSummary
          ingredientId={ingredient.id}
          ingredientName={ingredient.name}
          disabled={busy}
          editing={editingShopping}
          onEditingChange={setEditingShopping}
        />
      )}
      {message && (
        <p id="ingredient-form-error" role="alert" className="mb-4 text-sm text-destructive">
          {message}
        </p>
      )}
      {!editingShopping && (
        <div className="flex flex-wrap justify-end gap-2">
          {ingredient && ingredient.meals.length === 0 && (
            <Button
              variant="ghost"
              className="mr-auto text-destructive"
              disabled={busy || editingShopping}
              onClick={() => {
                if (busy) return;
                resetSave();
                deleteIngredient(ingredient.id, { onSuccess: close });
              }}
            >
              {deleting ? t("ingredients.form.deleting") : t("ingredients.form.delete_ingredient")}
            </Button>
          )}
          <Button variant="ghost" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={busy || editingShopping}>
            {saving ? t("common.saving") : t("ingredients.form.save_ingredient")}
          </Button>
        </div>
      )}
    </div>
  );
}
