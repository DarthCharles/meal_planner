import { useId, useState } from "react";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@darthcharles/greda";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { formatLocale, unitLabel, useI18n } from "../../i18n";
import type { UnitOption } from "../../types";
import { useUnits } from "../meals/queries";
import type { ShoppingDraft } from "./shoppingProfileForm";
import { shoppingChoices, shoppingUnitOptions, validShoppingAmount } from "./shoppingProfileForm";

type SelectOption = { value: string; label: string };
type SelectField = "how" | "packageUnit" | "packageMeasure";

function unitOptions(units: UnitOption[]): SelectOption[] {
  return units.map((unit) => ({
    value: unit.code,
    label: unitLabel(unit.code),
  }));
}

function ShoppingSelect({
  name,
  label,
  labelledBy,
  options,
  disabled,
  validate,
  onChange,
}: {
  name: SelectField;
  label?: string;
  labelledBy?: string;
  options: SelectOption[];
  disabled: boolean;
  onChange?: () => void;
  validate?: (value: string, draft: ShoppingDraft) => boolean | string;
}) {
  const { control } = useFormContext<ShoppingDraft>();
  const triggerId = useId();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <Controller
      name={name}
      control={control}
      rules={{ validate }}
      render={({ field, fieldState }) => (
        <div ref={setContainer} className="flex min-w-0 flex-col gap-2">
          {label && <Label htmlFor={triggerId}>{label}</Label>}
          <Select
            value={field.value}
            disabled={disabled}
            onValueChange={(value) => {
              field.onChange(value);
              onChange?.();
            }}
          >
            <SelectTrigger
              id={triggerId}
              type="button"
              ref={field.ref}
              onBlur={field.onBlur}
              aria-labelledby={labelledBy}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? `${triggerId}-error` : undefined}
              className="h-auto min-h-11 w-full min-w-0 whitespace-normal text-left"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent container={container}>
              {options.map((option) => (
                <SelectItem value={option.value} key={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && (
            <p id={`${triggerId}-error`} role="alert" className="m-0 text-sm text-destructive">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

export function IngredientShoppingFields({
  headingId,
  busy,
  onModeChange,
}: {
  headingId: string;
  busy: boolean;
  onModeChange: () => void;
}) {
  const { t } = useI18n();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ShoppingDraft>();
  const how = useWatch({ control, name: "how" });
  const pieceCount = useWatch({ control, name: "pieceCount" });
  const fieldId = useId();
  const {
    data: units,
    error: unitsError,
    isFetching: loadingUnits,
    refetch: retryUnits,
  } = useUnits({ enabled: how === "package" });
  const options = units && shoppingUnitOptions(units);
  const pieceCountLabel = new Intl.NumberFormat(formatLocale(), {
    maximumFractionDigits: 6,
  }).format(Number(pieceCount));

  return (
    <>
      <ShoppingSelect
        name="how"
        labelledBy={headingId}
        options={shoppingChoices.map((value) => ({
          value,
          label: t(`ingredients.shopping.choice_${value}`),
        }))}
        disabled={busy}
        onChange={onModeChange}
      />

      {how !== "package" && how !== "recipe" && (
        <div className="grid gap-2">
          <Label htmlFor={`${fieldId}-weight`}>
            {Number(pieceCount) === 1
              ? t("ingredients.shopping.piece_weight")
              : t("ingredients.shopping.pieces_weight", { count: pieceCountLabel })}
          </Label>
          <Input
            id={`${fieldId}-weight`}
            className="h-11 w-full"
            inputMode="decimal"
            disabled={busy}
            {...register("pieceWeight", {
              validate: (value, draft) =>
                draft.how === "package" ||
                draft.how === "recipe" ||
                !value.trim() ||
                validShoppingAmount(value) ||
                t("ingredients.shopping.piece_weight_error"),
            })}
            aria-invalid={!!errors.pieceWeight}
            aria-describedby={errors.pieceWeight ? `${fieldId}-weight-error` : undefined}
          />
          {errors.pieceWeight && (
            <p id={`${fieldId}-weight-error`} role="alert" className="m-0 text-destructive">
              {errors.pieceWeight.message}
            </p>
          )}
        </div>
      )}

      {how === "package" && (
        <div className="grid min-w-0 gap-3">
          {options && (
            <ShoppingSelect
              name="packageUnit"
              label={t("ingredients.shopping.package_type")}
              options={unitOptions(options.packages)}
              disabled={busy}
              validate={(value, draft) =>
                draft.how !== "package" || !!value || t("ingredients.shopping.choose_package")
              }
            />
          )}
          {unitsError && (
            <div className="grid justify-items-start gap-2 text-sm">
              <p role="alert" className="m-0 text-destructive">
                {unitsError.message}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={loadingUnits || busy}
                onClick={() => void retryUnits()}
              >
                {t("common.try_again")}
              </Button>
            </div>
          )}
          {loadingUnits && !options && (
            <p role="status" className="m-0 text-sm text-muted-foreground">
              {t("ingredients.shopping.loading_units")}
            </p>
          )}
          <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
            <div className="grid content-start gap-2">
              <Label htmlFor={`${fieldId}-contents`}>
                {t("ingredients.shopping.package_size")}
              </Label>
              <Input
                id={`${fieldId}-contents`}
                type="text"
                inputMode="decimal"
                disabled={busy}
                readOnly={!options}
                className="h-11 min-w-0"
                {...register("packageSize", {
                  validate: (value, draft) =>
                    draft.how !== "package" ||
                    !value.trim() ||
                    validShoppingAmount(value) ||
                    t("ingredients.shopping.enter_size"),
                })}
                aria-invalid={!!errors.packageSize}
                aria-describedby={errors.packageSize ? `${fieldId}-contents-error` : undefined}
              />
              {errors.packageSize && (
                <p
                  id={`${fieldId}-contents-error`}
                  role="alert"
                  className="m-0 text-sm text-destructive"
                >
                  {errors.packageSize.message}
                </p>
              )}
            </div>
            {options && (
              <ShoppingSelect
                name="packageMeasure"
                label={t("ingredients.shopping.package_measure")}
                options={unitOptions(options.measures)}
                disabled={busy}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
