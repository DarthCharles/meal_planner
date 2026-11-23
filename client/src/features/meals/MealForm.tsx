import { Button, Input, Label, Textarea } from "@darthcharles/greda";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { useI18n } from "../../i18n";
import type {
  Meal,
  MealForm as MealFormValues,
  MealPayload,
  MealTypeOption,
  UnitOption,
} from "../../types";
import { useEditorDraft } from "../navigation/EditorDraftContext";
import { isEmptyIngredient } from "./ingredientDraft";
import { IngredientManager } from "./IngredientManager";
import { mealTypeLabel } from "./mealTypes";
import { PreferredDaysField } from "./PreferredDaysField";
import { useCreateMeal, useUpdateMeal } from "./queries";

export function MealForm({
  types,
  units,
  initialMeal,
  onSaved,
}: {
  initialMeal: Meal | null;
  onSaved: () => void;
  types: MealTypeOption[];
  units: UnitOption[];
}) {
  const { t } = useI18n();
  const methods = useForm<MealFormValues>({
    defaultValues: {
      name: initialMeal?.name ?? "",
      servings: initialMeal ? String(initialMeal.servings) : "",
      description: initialMeal?.description ?? "",
      recipe_url: initialMeal?.recipe_url ?? "",
      meal_type_ids: initialMeal
        ? types.filter(([name]) => initialMeal.meal_types.includes(name)).map(([, id]) => id)
        : [],
      preferred_days: initialMeal?.preferred_days ?? [],
      ingredients:
        initialMeal?.ingredients?.map(
          ({
            ingredient_id,
            name,
            quantity,
            unit,
            preparation_note,
            package_quantity,
            package_unit,
          }) => ({
            package_quantity: package_quantity ?? "",
            package_unit: package_unit ?? "",
            ingredient_id,
            uncommitted: false,
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
    formState: { errors, isDirty },
  } = methods;
  useEditorDraft(isDirty);
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
  const validationError = errors.servings
    ? t("recipe.servings_error")
    : errors.name || errors.description || errors.meal_type_ids
      ? t("meals.form.meal_required")
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
      .filter((ingredient) => !isEmptyIngredient(ingredient))
      .map(
        ({
          ingredient_id,
          name,
          quantity,
          unit,
          preparation_note,
          package_quantity,
          package_unit,
        }) => ({
          ...(ingredient_id ? { ingredient_id } : { name: name.trim() }),
          quantity,
          unit,
          preparation_note,
          ...(units.find((option) => option.code === unit)?.dimension === "package" &&
          package_quantity?.trim()
            ? { package_quantity, package_unit }
            : {}),
        }),
      );
    const values = { ...form, ingredients };
    if (initialMeal) {
      updateMeal({ id: initialMeal.id, form: values }, { onSuccess: onSaved });
    } else {
      createMeal(values, { onSuccess: onSaved });
    }
  };
  return (
    <FormProvider {...methods}>
      <form
        className="@container grid min-w-0 gap-md max-desktop:[&_:is(input,textarea,button)]:scroll-mb-[9rem]"
        noValidate
        onSubmit={handleSubmit(submit, clearSaveErrors)}
      >
        <div className="grid min-w-0 gap-md">
          <Label className="text-label grid min-w-0 gap-xs">
            {t("meals.form.name")}
            <Input
              className="h-auto rounded-[10px] p-sm text-body shadow-none md:text-body"
              {...register("name", { validate: (value) => !!value.trim() })}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "meal-form-error" : undefined}
              placeholder={t("meals.form.meal_example")}
            />
          </Label>
          <Label className="text-label grid min-w-0 gap-xs">
            {t("recipe.servings_label")}
            <Input
              className="text-body tabular-nums md:text-body"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              {...register("servings", {
                validate: (value) =>
                  /^\d+$/.test(value) &&
                  BigInt(value) > 0n &&
                  BigInt(value) <= 9223372036854775807n,
              })}
              aria-invalid={!!errors.servings}
              aria-describedby={errors.servings ? "meal-form-error" : undefined}
            />
          </Label>
          <Label className="text-label grid min-w-0 gap-xs">
            {t("meals.form.instructions")}
            <Textarea
              className="h-auto resize-y rounded-[10px] p-sm text-body shadow-none md:text-body"
              {...register("description", {
                validate: (value) => !!value.trim(),
              })}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "meal-form-error" : undefined}
              rows={3}
            />
          </Label>
          <Label className="text-label grid min-w-0 gap-xs">
            <span>
              {t("meals.form.recipe_url")}{" "}
              <span className="text-caption text-muted-foreground">{t("common.optional")}</span>
            </span>
            <Input
              className="h-auto rounded-[10px] p-sm text-body shadow-none md:text-body"
              {...register("recipe_url")}
              placeholder="https://..."
            />
          </Label>
        </div>
        <IngredientManager units={units} />
        <div className="grid min-w-0 gap-md">
          <fieldset className="text-label grid min-w-0 gap-xs text-foreground">
            <legend className="mb-xs">{t("meals.form.meal_time")}</legend>
            <Controller
              name="meal_type_ids"
              control={control}
              rules={{ validate: (ids) => ids.length > 0 }}
              render={({ field }) => (
                <div className="flex flex-wrap gap-xs">
                  {types.map(([name, id], index) => {
                    const selected = field.value.includes(id);
                    return (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="aria-pressed:surface-tertiary aria-pressed:text-foreground aria-pressed:hover:surface-tertiary aria-pressed:hover:text-foreground"
                        key={id}
                        ref={index === 0 ? field.ref : undefined}
                        onBlur={field.onBlur}
                        aria-pressed={selected}
                        aria-invalid={!!errors.meal_type_ids}
                        aria-describedby={errors.meal_type_ids ? "meal-form-error" : undefined}
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
        </div>
        <div className="sticky bottom-0 z-[5] flex flex-wrap items-center justify-end gap-x-md gap-y-xs bg-background py-xs [@media(max-height:420px)]:static">
          {error && (
            <p
              id="meal-form-error"
              role="alert"
              className="m-0 mr-auto max-w-prose text-caption wrap-anywhere text-pretty text-destructive"
            >
              {error}
            </p>
          )}
          <Button type="submit" variant="default" className="min-h-11" loading={saving}>
            {saving
              ? t("common.saving")
              : initialMeal
                ? t("meals.form.update_meal")
                : t("meals.form.save_meal")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
