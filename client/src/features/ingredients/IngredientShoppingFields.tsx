import { useEffect, useId, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@darthcharles/greda";
import { ChevronRight } from "@darthcharles/greda/icons";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { unitLabel, useI18n } from "../../i18n";
import type { UnitOption } from "../../types";
import { shoppingListResult } from "./shoppingPresentation";
import type { ShoppingDraft } from "./shoppingProfileForm";
import { shoppingUnitOptions, validShoppingAmount } from "./shoppingProfileForm";

type SelectOption = { value: string; label: string };
type SelectField = "bulkUnit" | "packageUnit" | "packageMeasure";

function unitOptions(units: UnitOption[]): SelectOption[] {
  return units.map((unit) => ({
    value: unit.code,
    label: unitLabel(unit.code),
  }));
}

function ShoppingSelect({
  name,
  label,
  options,
  disabled,
  validate,
}: {
  name: SelectField;
  label: string;
  options: SelectOption[];
  disabled: boolean;
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
          <Label htmlFor={triggerId}>{label}</Label>
          <Select value={field.value} disabled={disabled} onValueChange={field.onChange}>
            <SelectTrigger
              id={triggerId}
              type="button"
              ref={field.ref}
              onBlur={field.onBlur}
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
    setFocus,
    formState: { errors },
  } = useFormContext<ShoppingDraft>();
  const how = useWatch({ control, name: "how" });
  const bulkUnit = useWatch({ control, name: "bulkUnit" });
  const pieceCount = useWatch({ control, name: "pieceCount" });
  const [contentsOpen, setContentsOpen] = useState(() => !!getValues("packageSize"));
  const fieldId = useId();
  const options = shoppingUnitOptions(units);

  useEffect(() => {
    if (errors.packageSize) setContentsOpen(true);
  }, [errors.packageSize]);
  useEffect(() => {
    if (contentsOpen && errors.packageSize) setFocus("packageSize");
  }, [contentsOpen, errors.packageSize, setFocus]);

  return (
    <>
      <div className="min-w-0">
        <p id={`${fieldId}-how`} className="mt-0 mb-3 text-sm font-medium">
          {t("ingredients.shopping.how_buy", { name: ingredientName })}
        </p>
        <Controller
          name="how"
          control={control}
          render={({ field }) => (
            <RadioGroup
              name={field.name}
              value={field.value}
              disabled={busy}
              aria-labelledby={`${fieldId}-how`}
              className="tablet:grid-cols-3"
              onBlur={field.onBlur}
              onValueChange={(value) => {
                field.onChange(value);
                onModeChange();
              }}
            >
              {(
                [
                  ["piece", t("ingredients.shopping.by_piece")],
                  ["bulk", t("ingredients.shopping.by_weight")],
                  ["package", t("ingredients.shopping.by_package")],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  htmlFor={`${fieldId}-how-${value}`}
                  className={`flex min-h-12 min-w-0 items-center gap-3 rounded-lg border px-4 py-3 text-sm leading-snug ${busy ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-accent"} ${field.value === value ? "border-primary bg-accent text-accent-foreground" : "border-border"}`}
                >
                  <RadioGroupItem
                    id={`${fieldId}-how-${value}`}
                    value={value}
                    ref={field.value === value ? field.ref : undefined}
                  />
                  {label}
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </div>

      {how === "bulk" && (
        <div className="tablet:max-w-sm">
          <ShoppingSelect
            name="bulkUnit"
            label={t("ingredients.shopping.show_in")}
            options={[
              {
                value: ["g", "kg"].includes(bulkUnit) ? bulkUnit : "kg",
                label: t("ingredients.shopping.weight"),
              },
              {
                value: ["ml", "l"].includes(bulkUnit) ? bulkUnit : "l",
                label: t("ingredients.shopping.volume"),
              },
            ]}
            disabled={busy}
          />
        </div>
      )}

      <div className="grid gap-1 rounded-lg bg-muted p-4 text-sm leading-relaxed">
        <p className="m-0 font-medium">{t("ingredients.shopping.list_result")}</p>
        <p className="m-0 text-muted-foreground">{shoppingListResult(how, bulkUnit, t)}</p>
      </div>

      {how !== "package" && (
        <div className="grid gap-2 border-t border-border pt-5 text-sm">
          <Label htmlFor={`${fieldId}-weight`}>
            {Number(pieceCount) === 1
              ? t("ingredients.shopping.piece_weight")
              : t("ingredients.shopping.pieces_weight", { count: pieceCount })}
          </Label>
          <p id={`${fieldId}-weight-help`} className="m-0 text-muted-foreground">
            {t("ingredients.shopping.piece_weight_help")}
          </p>
          <Input
            id={`${fieldId}-weight`}
            className="h-11 tablet:max-w-sm"
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
            aria-describedby={`${fieldId}-weight-help${errors.pieceWeight ? ` ${fieldId}-weight-error` : ""}`}
          />
          {errors.pieceWeight && (
            <p id={`${fieldId}-weight-error`} role="alert" className="m-0 text-destructive">
              {errors.pieceWeight.message}
            </p>
          )}
        </div>
      )}

      {how === "package" && (
        <div className="grid gap-5">
          <div className="tablet:max-w-sm">
            <ShoppingSelect
              name="packageUnit"
              label={t("ingredients.shopping.package_type")}
              options={unitOptions(options.packages)}
              disabled={busy}
              validate={(value, draft) =>
                draft.how !== "package" || !!value || t("ingredients.shopping.choose_package")
              }
            />
          </div>
          <Collapsible
            open={contentsOpen}
            onOpenChange={setContentsOpen}
            className="border-t border-border pt-2"
          >
            <CollapsibleTrigger className="group flex min-h-11 cursor-pointer items-center gap-1 text-left text-sm font-medium text-primary">
              <ChevronRight
                aria-hidden="true"
                className="size-4 shrink-0 group-data-[state=open]:rotate-90"
              />
              {t("ingredients.shopping.package_contains")}
            </CollapsibleTrigger>
            <CollapsibleContent forceMount className="grid gap-3 pt-2 data-[state=closed]:hidden">
              <p id={`${fieldId}-contents-help`} className="m-0 text-sm text-muted-foreground">
                {t("ingredients.shopping.label_help")}
              </p>
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
                    className="h-11 min-w-0"
                    {...register("packageSize", {
                      validate: (value, draft) =>
                        draft.how !== "package" ||
                        !value.trim() ||
                        validShoppingAmount(value) ||
                        t("ingredients.shopping.enter_size"),
                    })}
                    aria-invalid={!!errors.packageSize}
                    aria-describedby={`${fieldId}-contents-help${errors.packageSize ? ` ${fieldId}-contents-error` : ""}`}
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
                <ShoppingSelect
                  name="packageMeasure"
                  label={t("ingredients.shopping.package_measure")}
                  options={unitOptions(options.measures)}
                  disabled={busy}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </>
  );
}
