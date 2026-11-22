import { useId } from "react";

import { Button, Input, Label } from "@darthcharles/greda";
import { Controller, useFormContext } from "react-hook-form";

import { UnitSelect } from "../../components/UnitSelect";
import { formatLocale, unitLabel, useI18n } from "../../i18n";
import type { MealForm, UnitOption } from "../../types";
import { useIngredientShoppingProfile } from "../ingredients/queries";
import { validQuantity } from "./quantity";

export function RecipePackageFields({
  index,
  ingredientId,
  units,
  visible,
  packageUnit,
}: {
  index: number;
  ingredientId?: number;
  units: UnitOption[];
  visible: boolean;
  packageUnit: string;
}) {
  const { t } = useI18n();
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<MealForm>();
  const errorId = useId();
  const rowErrors = errors.ingredients?.[index];
  const contentsError = !!(rowErrors?.package_quantity || rowErrors?.package_unit);
  const {
    data: profile,
    refetch,
    isFetching,
    error,
  } = useIngredientShoppingProfile(ingredientId ?? 0, {
    enabled: !!ingredientId && visible,
  });
  const contentUnits = units.filter((unit) => ["g", "kg", "ml", "l", "piece"].includes(unit.code));
  const savedSize =
    profile?.mode === "package" && profile.package_quantity && profile.package_unit
      ? { quantity: profile.package_quantity, unit: profile.package_unit }
      : null;
  function applySize() {
    if (!savedSize || isFetching) return;
    const row = getValues(`ingredients.${index}`);
    if (row.ingredient_id !== ingredientId || row.uncommitted) return;
    if (row.package_quantity === savedSize.quantity && row.package_unit === savedSize.unit) return;
    if ((row.package_quantity || row.package_unit) && !window.confirm(t("recipe.replace_contents")))
      return;
    const validate = { shouldDirty: true, shouldValidate: true };
    setValue(`ingredients.${index}.package_unit`, savedSize.unit, validate);
    setValue(`ingredients.${index}.package_quantity`, savedSize.quantity, validate);
  }

  return (
    <fieldset className="grid min-w-0 gap-2">
      <legend className="text-label mb-1">{t("recipe.optional_contents")}</legend>
      <p className="m-0 text-caption text-muted-foreground">
        {t("recipe.package_size_help", { unit: unitLabel(packageUnit, 1) })}
      </p>
      <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
        <Label className="text-label grid min-w-0 gap-2">
          {t("recipe.contents")}
          <Input
            className="text-body h-11 md:text-base"
            inputMode="decimal"
            {...register(`ingredients.${index}.package_quantity`, {
              validate: (value, values) =>
                !values.ingredients[index]?.name.trim() ||
                units.find((unit) => unit.code === values.ingredients[index]?.unit)?.dimension !==
                  "package" ||
                !(value ?? "").trim() ||
                validQuantity(value ?? ""),
            })}
            aria-invalid={!!rowErrors?.package_quantity}
            aria-describedby={rowErrors?.package_quantity ? errorId : undefined}
          />
        </Label>
        <Controller
          control={control}
          name={`ingredients.${index}.package_unit`}
          rules={{
            validate: (value, values) =>
              !values.ingredients[index]?.name.trim() ||
              units.find((unit) => unit.code === values.ingredients[index]?.unit)?.dimension !==
                "package" ||
              !values.ingredients[index]?.package_quantity?.trim() ||
              !!value,
          }}
          render={({ field, fieldState }) => (
            <UnitSelect
              label={t("recipe.contents_unit")}
              value={field.value ?? ""}
              onChange={field.onChange}
              inputRef={field.ref}
              onBlur={field.onBlur}
              units={contentUnits}
              invalid={fieldState.invalid}
              describedBy={fieldState.invalid ? errorId : undefined}
            />
          )}
        />
      </div>
      {contentsError && (
        <p id={errorId} role="alert" className="m-0 text-caption text-destructive">
          {t("recipe.contents_required")}
        </p>
      )}
      {savedSize && !error && (
        <Button
          type="button"
          variant="outline"
          disabled={isFetching}
          className="h-auto min-h-11 whitespace-normal justify-self-start"
          onClick={applySize}
        >
          {t("recipe.use_saved_size", {
            size: `${new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 6 }).format(Number(savedSize.quantity))} ${unitLabel(savedSize.unit, Number(savedSize.quantity))}`,
          })}
        </Button>
      )}
      {isFetching && !savedSize && (
        <p role="status" className="text-caption m-0 text-muted-foreground">
          {t("recipe.loading_saved_size")}
        </p>
      )}
      {error && (
        <p role="alert" className="m-0 text-caption text-destructive">
          {t("recipe.saved_size_error")}{" "}
          <Button type="button" variant="link" onClick={() => void refetch()}>
            {t("common.try_again")}
          </Button>
        </p>
      )}
    </fieldset>
  );
}
