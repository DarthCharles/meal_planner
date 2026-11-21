import { useId, useState } from "react";

import {
  Button,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@darthcharles/greda";
import { X } from "@darthcharles/greda/icons";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { unitLabel, useI18n } from "../../i18n";
import type { IngredientOption, MealForm, UnitOption } from "../../types";
import { useIngredients } from "./queries";

export function IngredientManager({ units }: { units: UnitOption[] }) {
  const { t } = useI18n();
  const { control } = useFormContext<MealForm>();
  const { data: ingredients, isPending: loading, error, refetch } = useIngredients();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });
  return (
    <fieldset
      aria-labelledby="meal-ingredients-label"
      className="grid min-w-0 gap-4 border-t border-border pt-6 text-xs text-foreground"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 basis-48 gap-1">
          <span id="meal-ingredients-label" className="font-bold">
            {t("common.ingredients")}{" "}
            <span className="font-normal text-muted-foreground">{t("common.optional")}</span>
          </span>
          <p className="m-0 text-xs font-normal text-muted-foreground">
            {t(
              fields.length === 0
                ? "meals.ingredient_manager.ingredient_help"
                : "meals.ingredient_manager.choose_ingredient_help",
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="min-h-11 whitespace-normal px-0 text-left text-xs"
          onClick={() =>
            append(
              { name: "", quantity: "", unit: "", preparation_note: "" },
              { focusName: `ingredients.${fields.length}.name` },
            )
          }
        >
          {t("meals.ingredient_manager.add_ingredient")}
        </Button>
      </div>
      {error && (
        <p role="alert" className="m-0 text-xs font-normal text-destructive">
          {t("meals.ingredient_manager.load_ingredients_error")}{" "}
          <Button type="button" variant="link" size="sm" onClick={() => void refetch()}>
            {t("meals.ingredient_manager.retry_ingredients")}
          </Button>
        </p>
      )}
      {fields.map((field, index) => (
        <IngredientRow
          key={field.id}
          index={index}
          units={units}
          ingredients={ingredients ?? []}
          loading={loading}
          catalogError={ingredients ? undefined : error?.message}
          onRemove={() => remove(index)}
        />
      ))}
    </fieldset>
  );
}

function IngredientRow({
  index,
  units,
  ingredients,
  loading,
  catalogError,
  onRemove,
}: {
  index: number;
  units: UnitOption[];
  ingredients: IngredientOption[];
  loading: boolean;
  catalogError?: string;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<MealForm>();
  const name = useWatch({ control, name: `ingredients.${index}.name` });
  const ingredientId = useWatch({
    control,
    name: `ingredients.${index}.ingredient_id`,
  });
  const fieldId = useId();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div
      className={`grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-end gap-3 @min-[40rem]:grid-cols-[minmax(0,1fr)_6rem_8rem_2.75rem] ${index > 0 ? "pt-4" : ""}`}
    >
      <div ref={setContainer} className="col-span-2 grid min-w-0 gap-2 @min-[40rem]:col-span-1">
        <label htmlFor={`${fieldId}-name`} className="font-medium">
          {t("meals.ingredient_manager.ingredient_name")}
        </label>
        <Controller
          control={control}
          name={`ingredients.${index}.name`}
          rules={{
            validate: (_, values) => !values.ingredients[index]?.uncommitted,
            deps: [`ingredients.${index}.quantity`, `ingredients.${index}.unit`],
          }}
          render={({ field }) => (
            <Combobox
              options={ingredients.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
              value={
                field.value
                  ? {
                      value: ingredientId
                        ? String(ingredientId)
                        : `new:${field.value.toLowerCase()}`,
                      label: field.value,
                    }
                  : null
              }
              loading={loading}
              error={catalogError}
              onCreate={(label) => ({ value: `new:${label.toLowerCase()}`, label })}
              onValueChange={(option) => {
                setValue(
                  `ingredients.${index}.ingredient_id`,
                  option && !option.value.startsWith("new:") ? Number(option.value) : undefined,
                );
                setValue(`ingredients.${index}.uncommitted`, false);
                field.onChange(option?.label ?? "");
              }}
            >
              <ComboboxInput
                id={`${fieldId}-name`}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={(event) =>
                  setValue(`ingredients.${index}.uncommitted`, !!event.target.value.trim())
                }
                className="h-11 min-w-0 rounded-[10px] bg-background px-3 text-sm md:text-sm font-normal shadow-none"
                aria-label={t("meals.ingredient_manager.ingredient_name")}
                aria-invalid={!!errors.ingredients?.[index]?.name}
                aria-describedby={errors.ingredients?.[index]?.name ? "meal-form-error" : undefined}
                placeholder={t("meals.ingredient_manager.choose_or_create")}
              />
              <ComboboxContent
                container={container}
                aria-label={t("common.ingredients")}
                className="max-h-[220px] overflow-y-auto"
                emptyText={t("meals.ingredient_manager.empty_options")}
                loadingText={t("meals.ingredient_manager.loading_options_list")}
                creatingText={t("meals.ingredient_manager.creating_option")}
                createErrorText={t("meals.ingredient_manager.create_option_error")}
                getStatusText={(count, canCreate) =>
                  `${t("meals.ingredient_manager.options_available", { count })}${canCreate ? ` ${t("meals.ingredient_manager.can_create_option")}` : ""}`
                }
                renderCreateLabel={(query) =>
                  t("meals.ingredient_manager.create_ingredient", { name: query })
                }
              />
            </Combobox>
          )}
        />
      </div>
      <div className="grid min-w-0 gap-2">
        <label htmlFor={`${fieldId}-quantity`} className="font-medium">
          {t("meals.ingredient_manager.quantity")}
        </label>
        <Input
          id={`${fieldId}-quantity`}
          aria-label={t("meals.ingredient_manager.quantity")}
          className="h-11 min-w-0 rounded-[10px] bg-background px-3 text-sm md:text-sm font-normal shadow-none tabular-nums"
          type="number"
          min="0.001"
          step="any"
          {...register(`ingredients.${index}.quantity`, {
            validate: (value, values) =>
              !values.ingredients[index]?.name.trim() ||
              (Number.isFinite(Number(value)) && Number(value) >= 0.001),
          })}
          aria-invalid={!!errors.ingredients?.[index]?.quantity}
          aria-describedby={errors.ingredients?.[index]?.quantity ? "meal-form-error" : undefined}
          placeholder={t("meals.ingredient_manager.quantity_short")}
        />
      </div>
      <div className="col-span-2 grid min-w-0 gap-2 @min-[40rem]:col-span-1">
        <label htmlFor={`${fieldId}-unit`} className="font-medium">
          {t("meals.ingredient_manager.unit")}
        </label>
        <Controller
          control={control}
          name={`ingredients.${index}.unit`}
          rules={{
            validate: (value, values) => !values.ingredients[index]?.name.trim() || !!value.trim(),
          }}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id={`${fieldId}-unit`}
                ref={field.ref}
                onBlur={field.onBlur}
                type="button"
                aria-label={t("meals.ingredient_manager.unit")}
                className="h-11 min-w-0 w-full gap-2 rounded-[10px] bg-background px-3 text-sm font-normal shadow-none"
                aria-invalid={!!errors.ingredients?.[index]?.unit}
                aria-describedby={errors.ingredients?.[index]?.unit ? "meal-form-error" : undefined}
              >
                <SelectValue placeholder={t("meals.ingredient_manager.unit")} />
              </SelectTrigger>
              <SelectContent container={container}>
                {units.map((unit) => (
                  <SelectItem key={unit.code} value={unit.code}>
                    {unitLabel(unit.code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="col-span-3 grid min-w-0 gap-2">
        <label htmlFor={`${fieldId}-note`} className="font-normal text-muted-foreground">
          {t("meals.ingredient_manager.preparation_note")} {t("common.optional")}
        </label>
        <Input
          id={`${fieldId}-note`}
          className="h-11 min-w-0 rounded-[10px] bg-background px-3 text-sm md:text-sm font-normal shadow-none"
          aria-label={t("meals.ingredient_manager.preparation_note")}
          {...register(`ingredients.${index}.preparation_note`)}
          placeholder={t("meals.ingredient_manager.note_optional")}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="col-start-3 row-start-1 size-11 rounded-full text-muted-foreground hover:text-foreground @min-[40rem]:col-start-4"
        onClick={onRemove}
        aria-label={t("meals.ingredient_manager.remove_ingredient", {
          name: name || t("meals.ingredient_manager.ingredient"),
        })}
      >
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}
