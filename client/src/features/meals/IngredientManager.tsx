import { useState } from "react";

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
      className="grid min-w-0 gap-3 border-t border-border pt-6 text-xs font-bold text-foreground"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span id="meal-ingredients-label">
          {t("common.ingredients")}{" "}
          <span className="font-normal text-muted-foreground">{t("common.optional")}</span>
        </span>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="px-0 text-xs"
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
      {fields.length === 0 && (
        <p className="m-0 rounded-[10px] border border-dashed border-border p-3 text-xs font-normal text-muted-foreground">
          {t("meals.ingredient_manager.ingredient_help")}
        </p>
      )}
      {fields.length > 0 && (
        <p className="m-0 text-xs font-normal text-muted-foreground">
          {t("meals.ingredient_manager.choose_ingredient_help")}
        </p>
      )}
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
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2 border-t border-border pt-4 @min-[26rem]:grid-cols-[5rem_6rem_minmax(0,1fr)_2.75rem]">
      <div ref={setContainer} className="col-span-2 min-w-0 @min-[26rem]:col-span-3">
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
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={(event) =>
                  setValue(`ingredients.${index}.uncommitted`, !!event.target.value.trim())
                }
                className="h-auto min-w-0 rounded-[10px] bg-background px-2 py-[9px] text-[13px] md:text-[13px] font-normal shadow-none"
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
      <Input
        aria-label={t("meals.ingredient_manager.quantity")}
        className="h-auto min-w-0 rounded-[10px] bg-background px-2 py-[9px] text-[13px] md:text-[13px] font-normal shadow-none text-center"
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
      <Controller
        control={control}
        name={`ingredients.${index}.unit`}
        rules={{
          validate: (value, values) => !values.ingredients[index]?.name.trim() || !!value.trim(),
        }}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger
              ref={field.ref}
              onBlur={field.onBlur}
              type="button"
              aria-label={t("meals.ingredient_manager.unit")}
              className="h-auto min-w-0 w-full gap-1 rounded-[10px] bg-background px-2 py-[9px] text-[13px] font-normal shadow-none"
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
      <Input
        className="col-span-2 h-auto min-w-0 rounded-[10px] bg-background px-2 py-[9px] text-[13px] md:text-[13px] font-normal shadow-none @min-[26rem]:col-span-1"
        aria-label={t("meals.ingredient_manager.preparation_note")}
        {...register(`ingredients.${index}.preparation_note`)}
        placeholder={t("meals.ingredient_manager.note_optional")}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="col-start-3 row-start-1 size-11 rounded-full @min-[26rem]:col-start-4"
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
