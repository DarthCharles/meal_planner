import { useLayoutEffect, useRef, useState } from "react";

import { Button, Input } from "@darthcharles/greda";
import { Controller, useFormContext } from "react-hook-form";

import { UnitSelect } from "../../components/UnitSelect";
import { useI18n } from "../../i18n";
import type { MealForm, UnitOption } from "../../types";
import { useIngredientShoppingProfile } from "../ingredients/queries";
import { validQuantity } from "./quantity";

// The parent keys this component by ingredient and unit. Requests cannot write into
// a replacement selection or a removed field-array row.
export function RecipePackageFields({
  index,
  ingredientId,
  units,
}: {
  index: number;
  ingredientId?: number;
  units: UnitOption[];
}) {
  const { t } = useI18n();
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<MealForm>();
  const { refetch, isFetching, error } = useIngredientShoppingProfile(ingredientId ?? 0, {
    enabled: false,
  });
  const active = useRef(true);
  const rowIndex = useRef(index);
  rowIndex.current = index;
  useLayoutEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [unavailable, setUnavailable] = useState(false);
  const contentUnits = units.filter((unit) => ["g", "kg", "ml", "l", "piece"].includes(unit.code));
  const rowErrors = errors.ingredients?.[index];
  const applyPresentation = async () => {
    setUnavailable(false);
    const result = await refetch();
    if (!active.current || result.error) return;
    const profile = result.data;
    if (!profile || profile.mode !== "package") {
      setUnavailable(true);
      return;
    }
    const currentIndex = rowIndex.current;
    const row = getValues(`ingredients.${currentIndex}`);
    if (!row || row.ingredient_id !== ingredientId || row.uncommitted) return;
    if ((row.package_quantity || row.package_unit) && !window.confirm(t("recipe.replace_contents")))
      return;
    setValue(`ingredients.${currentIndex}.package_quantity`, profile.package_quantity ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`ingredients.${currentIndex}.package_unit`, profile.package_unit ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  return (
    <div className="col-span-full grid min-w-0 gap-3 border-t border-border pt-3">
      <p className="m-0 text-xs text-muted-foreground">{t("recipe.snapshot_help")}</p>
      <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
        <label className="grid min-w-0 gap-2 font-medium">
          {t("recipe.contents")}
          <Input
            className="h-11"
            {...register(`ingredients.${index}.package_quantity`, {
              validate: (value, values) =>
                !values.ingredients[index]?.name.trim() ||
                units.find((unit) => unit.code === values.ingredients[index]?.unit)?.dimension !==
                  "package" ||
                validQuantity(value ?? ""),
            })}
            aria-invalid={!!rowErrors?.package_quantity}
            aria-describedby={rowErrors?.package_quantity ? "meal-form-error" : undefined}
          />
        </label>
        <Controller
          control={control}
          name={`ingredients.${index}.package_unit`}
          rules={{
            validate: (value, values) =>
              !values.ingredients[index]?.name.trim() ||
              units.find((unit) => unit.code === values.ingredients[index]?.unit)?.dimension !==
                "package" ||
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
              describedBy={fieldState.invalid ? "meal-form-error" : undefined}
            />
          )}
        />
      </div>
      {ingredientId && (
        <Button
          type="button"
          variant="outline"
          disabled={isFetching}
          className="h-auto min-h-11 whitespace-normal justify-self-start"
          onClick={() => void applyPresentation()}
        >
          {t("recipe.use_presentation")}
        </Button>
      )}
      {error && <p role="alert">{error.message}</p>}
      {unavailable && <p role="status">{t("recipe.no_presentation")}</p>}
    </div>
  );
}
