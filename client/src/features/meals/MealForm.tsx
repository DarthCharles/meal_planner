import { useI18n } from "../../i18n";
import { Button, Input, Textarea } from "@darthcharles/greda";
import { Controller, FormProvider, useForm } from "react-hook-form";
import type {
  Meal,
  MealForm as MealFormValues,
  MealTypeOption,
  MealPayload,
  UnitOption,
} from "../../types";
import { useCreateMeal, useUpdateMeal } from "./queries";
import { PreferredDaysField } from "./PreferredDaysField";
import { mealTypeLabel } from "./mealTypes";
import { IngredientManager } from "./IngredientManager";

export function MealForm({
  types,
  units,
  initialMeal,
  onClose,
  onSaved,
}: {
  initialMeal: Meal | null;
  onClose: () => void;
  onSaved: () => void;
  types: MealTypeOption[];
  units: UnitOption[];
}) {
  const { t } = useI18n();
  const methods = useForm<MealFormValues>({
    defaultValues: {
      name: initialMeal?.name ?? "",
      description: initialMeal?.description ?? "",
      recipe_url: initialMeal?.recipe_url ?? "",
      meal_type_ids: initialMeal
        ? types
            .filter(([name]) => initialMeal.meal_types.includes(name))
            .map(([, id]) => id)
        : [],
      preferred_days: initialMeal?.preferred_days ?? [],
      ingredients:
        initialMeal?.ingredients?.map(
          ({ ingredient_id, name, quantity, unit, preparation_note }) => ({
            ingredient_id,
            name,
            quantity: String(quantity),
            unit,
            preparation_note: preparation_note ?? "",
          }),
        ) ?? [],
    },
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = methods;
  const {
    mutate: createMeal,
    isPending: creating,
    error: createError,
    reset: resetCreateMeal,
  } = useCreateMeal();
  const {
    mutate: updateMeal,
    isPending: updating,
    error: updateError,
    reset: resetUpdateMeal,
  } = useUpdateMeal();
  const saving = creating || updating;
  const validationError =
    errors.name || errors.description || errors.meal_type_ids
      ? t("meals.form.meal_required")
      : errors.ingredients
        ? errors.ingredients.some?.((row) => row?.name)
          ? t("meals.form.ingredient_selection_required")
          : t("meals.form.ingredient_amount_required")
        : undefined;
  const error = validationError || createError?.message || updateError?.message;
  const clearSaveErrors = () => {
    resetCreateMeal();
    resetUpdateMeal();
  };
  const submit = (form: MealFormValues) => {
    if (saving) return;
    clearSaveErrors();
    const ingredients: MealPayload["ingredients"] = form.ingredients
      .filter((ingredient) => ingredient.name.trim())
      .map(({ ingredient_id, name, quantity, unit, preparation_note }) => ({
        ...(ingredient_id ? { ingredient_id } : { name: name.trim() }),
        quantity,
        unit,
        preparation_note,
      }));
    const values = { ...form, ingredients };
    if (initialMeal) {
      updateMeal({ id: initialMeal.id, form: values }, { onSuccess: onSaved });
    } else {
      createMeal(values, { onSuccess: onSaved });
    }
  };
  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(submit, clearSaveErrors)}>
        <label className="mb-4 grid gap-[7px] text-xs font-bold text-foreground">
          {t("meals.form.name")}
          <Input
            className="h-auto rounded-[10px] bg-background p-3 text-[13px] md:text-[13px] font-normal shadow-none"
            {...register("name", { validate: (value) => !!value.trim() })}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "meal-form-error" : undefined}
            placeholder={t("meals.form.meal_example")}
          />
        </label>
        <label className="mb-4 grid gap-[7px] text-xs font-bold text-foreground">
          {t("meals.form.description")}
          <Textarea
            className="h-auto resize-y rounded-[10px] bg-background p-3 text-[13px] md:text-[13px] font-normal shadow-none"
            {...register("description", {
              validate: (value) => !!value.trim(),
            })}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? "meal-form-error" : undefined
            }
            placeholder={t("meals.form.description_help")}
            rows={3}
          />
        </label>
        <label className="mb-4 grid gap-[7px] text-xs font-bold text-foreground">
          {t("meals.form.recipe_url")}{" "}
          <span className="font-normal text-muted-foreground">{t("common.optional")}</span>
          <Input
            className="h-auto rounded-[10px] bg-background p-3 text-[13px] md:text-[13px] font-normal shadow-none"
            {...register("recipe_url")}
            placeholder="https://..."
          />
        </label>
        <fieldset className="mb-4 grid gap-[7px] text-xs font-bold text-foreground">
          <legend className="mb-[7px]">{t("meals.form.meal_time")}</legend>
          <Controller
            name="meal_type_ids"
            control={control}
            rules={{ validate: (ids) => ids.length > 0 }}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {types.map(([name, id], index) => {
                  const selected = field.value.includes(id);
                  return (
                    <Button
                      type="button"
                      variant={selected ? "secondary" : "outline"}
                      size="sm"
                      className="capitalize"
                      key={id}
                      ref={index === 0 ? field.ref : undefined}
                      onBlur={field.onBlur}
                      aria-pressed={selected}
                      aria-invalid={!!errors.meal_type_ids}
                      aria-describedby={
                        errors.meal_type_ids ? "meal-form-error" : undefined
                      }
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((typeId) => typeId !== id)
                            : [...field.value, id],
                        )
                      }
                    >
                      {mealTypeLabel(name)}
                    </Button>
                  );
                })}
              </div>
            )}
          />
        </fieldset>
        <PreferredDaysField />
        <IngredientManager units={units} />
        {error && (
          <p
            id="meal-form-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="default" loading={saving}>
            {saving ? t("common.saving") : initialMeal ? t("meals.form.update_meal") : t("meals.form.save_meal")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
