import { useI18n } from "../../i18n";
import { Button, Input } from "@darthcharles/greda";
import { useForm } from "react-hook-form";
import type { IngredientCatalogEntry, IngredientPayload } from "../../types";
import { useDeleteIngredient, useSaveIngredient } from "./queries";
import { useMealDialog } from "../meals/useMealDialog";

export function IngredientForm({ ingredient, close }: { ingredient?: IngredientCatalogEntry; close: () => void }) {
  const { t } = useI18n();
  const { openMealById } = useMealDialog();
  const { register, handleSubmit, formState: { errors } } = useForm<IngredientPayload>({
    defaultValues: { name: ingredient?.name ?? "" },
  });
  const { mutate: saveIngredient, isPending: saving, error: saveError, reset: resetSave } = useSaveIngredient();
  const { mutate: deleteIngredient, isPending: deleting, error: deleteError, reset: resetDelete } = useDeleteIngredient();
  const busy = saving || deleting;
  const fieldError = errors.name?.message ?? saveError?.message;
  const message = deleteError?.message ?? fieldError;
  return (
    <form noValidate onSubmit={handleSubmit((values) => {
      if (busy) return;
      resetDelete();
      saveIngredient({ id: ingredient?.id, values: { name: values.name.trim() } }, { onSuccess: close });
    }, () => { resetSave(); resetDelete(); })}>
      <label className="mb-4 grid gap-2 text-xs font-bold">
        {t("ingredients.form.name")}
        <Input
          {...register("name", { validate: (value) => !!value.trim() || t("ingredients.form.ingredient_required") })}
          disabled={busy}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError && !deleteError ? "ingredient-form-error" : undefined}
          placeholder={t("ingredients.form.ingredient_example")}
        />
      </label>
      {ingredient && <p className="mb-4 text-sm text-muted-foreground">{t("ingredients.form.rename_ingredient_help")}</p>}
      {ingredient && (
        <section aria-label={t("ingredients.form.meals_using")} className="mb-4">
          <h3 className="mb-1 font-display text-xl font-semibold">{t("ingredients.usage", { count: ingredient.meals.length })}</h3>
          {ingredient.meals.length ? (
            <ul className="m-0 grid list-none gap-0 p-0">
              {ingredient.meals.map((meal) => (
                <li key={meal.id}>
                  <Button variant="link" className="h-auto max-w-full whitespace-normal break-words px-0 py-1 text-left" onClick={() => openMealById(meal.id, meal.name)}>{meal.name}</Button>
                </li>
              ))}
            </ul>
          ) : <p className="m-0 text-sm text-muted-foreground">{t("ingredients.form.unused_ingredient")}</p>}
        </section>
      )}
      {message && <p id="ingredient-form-error" role="alert" className="mb-4 text-sm text-destructive">{message}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {ingredient && ingredient.meals.length === 0 && (
          <Button variant="ghost" className="mr-auto text-destructive" disabled={busy} onClick={() => {
            if (busy) return;
            resetSave();
            deleteIngredient(ingredient.id, { onSuccess: close });
          }}>
            {deleting ? t("ingredients.form.deleting") : t("ingredients.form.delete_ingredient")}
          </Button>
        )}
        <Button variant="ghost" onClick={close}>{t("common.cancel")}</Button>
        <Button type="submit" disabled={busy}>{saving ? t("common.saving") : t("ingredients.form.save_ingredient")}</Button>
      </div>
    </form>
  );
}
