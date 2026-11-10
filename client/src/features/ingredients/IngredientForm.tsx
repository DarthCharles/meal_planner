import { Button, Input } from "@darthcharles/greda";
import { useForm } from "react-hook-form";
import type { IngredientCatalogEntry, IngredientPayload } from "../../types";
import { useDeleteIngredient, useSaveIngredient } from "./queries";
import { useMealDialog } from "../meals/useMealDialog";

export function IngredientForm({ ingredient, close }: { ingredient?: IngredientCatalogEntry; close: () => void }) {
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
        Ingredient name
        <Input
          {...register("name", { validate: (value) => !!value.trim() || "Enter an ingredient name." })}
          disabled={busy}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError && !deleteError ? "ingredient-form-error" : undefined}
          placeholder="e.g. Tomato"
        />
      </label>
      {ingredient && <p className="mb-4 text-sm text-muted-foreground">Renaming this ingredient updates its name in every meal that uses it.</p>}
      {ingredient && (
        <section aria-label="Meals using this ingredient" className="mb-4">
          <h3 className="mb-1 font-display text-xl font-semibold">Used in {ingredient.meals.length} {ingredient.meals.length === 1 ? "meal" : "meals"}</h3>
          {ingredient.meals.length ? (
            <ul className="m-0 grid list-none gap-0 p-0">
              {ingredient.meals.map((meal) => (
                <li key={meal.id}>
                  <Button variant="link" className="h-auto max-w-full whitespace-normal break-words px-0 py-1 text-left" onClick={() => openMealById(meal.id, meal.name)}>{meal.name}</Button>
                </li>
              ))}
            </ul>
          ) : <p className="m-0 text-sm text-muted-foreground">Not used in any meals yet.</p>}
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
            {deleting ? "Deleting…" : "Delete ingredient"}
          </Button>
        )}
        <Button variant="ghost" onClick={close}>Cancel</Button>
        <Button type="submit" disabled={busy}>{saving ? "Saving…" : "Save ingredient"}</Button>
      </div>
    </form>
  );
}
