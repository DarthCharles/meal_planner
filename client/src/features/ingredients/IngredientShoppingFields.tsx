import { useId, useState } from "react";

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@darthcharles/greda";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { unitLabel, useI18n } from "../../i18n";
import type { UnitOption } from "../../types";
import type { ShoppingDraft } from "./shoppingProfileForm";
import { shoppingUnitOptions, validShoppingAmount } from "./shoppingProfileForm";

type SelectOption = { value: string; label: string };
type SelectField = "how" | "bulkUnit" | "packageUnit" | "packageMeasure";

function unitOptions(units: UnitOption[]): SelectOption[] {
  return units.map((unit) => ({ value: unit.code, label: unitLabel(unit.code) }));
}

function ShoppingSelect({
  name,
  label,
  options,
  disabled,
  hideLabel,
  placeholder,
  validate,
  onChange,
}: {
  name: SelectField;
  label: string;
  options: SelectOption[];
  disabled: boolean;
  hideLabel?: boolean;
  placeholder?: string;
  validate?: (value: string, draft: ShoppingDraft) => boolean | string;
  onChange?: () => void;
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
          <Label htmlFor={triggerId} className={hideLabel ? "sr-only" : undefined}>
            {label}
          </Label>
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
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? "shopping-setup-error" : undefined}
              className="h-11 w-full min-w-0"
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent container={container}>
              {options.map((option) => (
                <SelectItem value={option.value} key={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
}

export function IngredientShoppingFields({
  ingredientName,
  units,
  busy,
  onModeChange,
}: {
  ingredientName: string;
  units: UnitOption[];
  busy: boolean;
  onModeChange: () => void;
}) {
  const { t } = useI18n();
  const {
    control,
    register,
    getValues,
    formState: { errors },
  } = useFormContext<ShoppingDraft>();
  const how = useWatch({ control, name: "how" });
  const pieceCount = useWatch({ control, name: "pieceCount" });
  const [initialContentsOpen] = useState(() => !!getValues("packageSize"));
  const options = shoppingUnitOptions(units);

  return (
    <>
      <ShoppingSelect
        name="how"
        label={t("ingredients.shopping.how_buy", { name: ingredientName })}
        disabled={busy}
        onChange={onModeChange}
        options={[
          { value: "piece", label: t("ingredients.shopping.by_piece") },
          { value: "bulk", label: t("ingredients.shopping.by_weight") },
          { value: "package", label: t("ingredients.shopping.by_package") },
        ]}
      />

      {how === "piece" && (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-muted-foreground">
            {t("ingredients.shopping.piece_help")}
          </p>
        </div>
      )}

      {how === "bulk" && (
        <div className="flex flex-col gap-2">
          <ShoppingSelect
            name="bulkUnit"
            label={t("ingredients.shopping.show_in")}
            options={unitOptions(options.bulk)}
            disabled={busy}
          />
          <p className="m-0 text-sm text-muted-foreground">{t("ingredients.shopping.bulk_help")}</p>
        </div>
      )}

      {how !== "package" && (
        <div className="grid gap-2 text-sm">
          <label className="grid gap-2">
            {Number(pieceCount) === 1
              ? t("ingredients.shopping.piece_weight")
              : t("ingredients.shopping.pieces_weight", { count: pieceCount })}
            <Input
              className="h-11"
              inputMode="decimal"
              disabled={busy}
              {...register("pieceWeight", {
                validate: (value, draft) =>
                  draft.how === "package" ||
                  !value.trim() ||
                  validShoppingAmount(value) ||
                  t("ingredients.shopping.piece_weight_error"),
              })}
              aria-invalid={!!errors.pieceWeight}
              aria-describedby={errors.pieceWeight ? "shopping-setup-error" : "piece-weight-help"}
            />
          </label>
          <p id="piece-weight-help" className="m-0 text-sm text-muted-foreground">
            {t("ingredients.shopping.piece_weight_help")}
          </p>
        </div>
      )}

      {how === "package" && (
        <div className="flex flex-col gap-3">
          <ShoppingSelect
            name="packageUnit"
            label={t("ingredients.shopping.package_type")}
            options={unitOptions(options.packages)}
            disabled={busy}
            placeholder={t("ingredients.shopping.choose_package")}
            validate={(value, draft) =>
              draft.how !== "package" || !!value || t("ingredients.shopping.choose_package")
            }
          />
          <details open={initialContentsOpen}>
            <summary className="min-h-11 cursor-pointer content-center text-sm text-primary">
              {t("ingredients.shopping.package_contains")}
            </summary>
            <div className="grid min-w-0 gap-3 tablet:grid-cols-2">
              <Input
                type="text"
                disabled={busy}
                className="h-11 min-w-0 flex-1"
                aria-label={t("ingredients.shopping.package_size")}
                {...register("packageSize", {
                  validate: (value, draft) =>
                    draft.how !== "package" ||
                    !value.trim() ||
                    validShoppingAmount(value) ||
                    t("ingredients.shopping.enter_size"),
                })}
                aria-invalid={!!errors.packageSize}
                aria-describedby={errors.packageSize ? "shopping-setup-error" : undefined}
              />
              <div className="min-w-0">
                <ShoppingSelect
                  name="packageMeasure"
                  label={t("ingredients.shopping.package_measure")}
                  options={unitOptions(options.measures)}
                  disabled={busy}
                />
              </div>
            </div>
            <p className="m-0 text-sm text-muted-foreground">
              {t("ingredients.shopping.label_help")}
            </p>
          </details>
        </div>
      )}
    </>
  );
}
