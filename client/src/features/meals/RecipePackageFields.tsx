import { useEffect, useId } from "react";

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
    resetField,
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
  const savedQuantity = profile?.mode === "package" ? profile.package_quantity : null;
  const savedUnit = profile?.mode === "package" ? profile.package_unit : null;
  const configured = !!(savedQuantity && savedUnit);

  useEffect(() => {
    if (!configured) return;
    resetField(`ingredients.${index}.package_quantity`);
    resetField(`ingredients.${index}.package_unit`);
  }, [configured, index, resetField]);

  if (savedQuantity && savedUnit) {
    const quantity = Number(savedQuantity);
    const size = new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 6 }).format(
      quantity,
    );
    return (
      <p className="text-caption m-0 text-muted-foreground">
        {t("recipe.saved_package_size", { size: `${size} ${unitLabel(savedUnit, quantity)}` })}
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-caption m-0 w-full text-destructive">
        {t("recipe.saved_size_error")}{" "}
        <Button type="button" variant="link" onClick={() => void refetch()}>
          {t("common.try_again")}
        </Button>
      </p>
    );
  }

  if (ingredientId && (isFetching || profile === undefined)) {
    return isFetching ? (
      <p role="status" className="text-caption m-0 w-full text-muted-foreground">
        {t("recipe.loading_saved_size")}
      </p>
    ) : null;
  }

  return (
    <fieldset className="grid w-full min-w-0 gap-xs">
      <legend className="text-label mb-2xs">{t("recipe.optional_contents")}</legend>
      <p className="m-0 max-w-prose text-caption text-muted-foreground tablet:text-pretty">
        {t("recipe.package_size_help", { unit: unitLabel(packageUnit, 1) })}
      </p>
      <div className="grid min-w-0 gap-sm tablet:grid-cols-2">
        <Label className="text-label grid min-w-0 gap-xs">
          {t("recipe.contents")}
          <Input
            className="text-body h-11 tabular-nums md:text-body"
            inputMode="decimal"
            {...register(`ingredients.${index}.package_quantity`, {
              validate: (value, values) =>
                !values.ingredients[index]?.name.trim() ||
                units.find((unit) => unit.code === values.ingredients[index]?.unit)?.dimension !==
                  "package" ||
                (!(value ?? "").trim()
                  ? !values.ingredients[index]?.package_unit
                  : validQuantity(value ?? "")),
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
    </fieldset>
  );
}
