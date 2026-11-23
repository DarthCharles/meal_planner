import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@darthcharles/greda";
import { ChevronDown, Plus } from "@darthcharles/greda/icons";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { formatLocale, unitLabel, useI18n } from "../../i18n";
import type { IngredientForm, MealForm, UnitOption } from "../../types";
import { validQuantity } from "./quantity";
import { useIngredients } from "./queries";
import { RecipePackageFields } from "./RecipePackageFields";

const editableFields = ["name", "quantity", "unit", "package_quantity", "package_unit"] as const;
type IngredientField = (typeof editableFields)[number];

export function IngredientManager({ units }: { units: UnitOption[] }) {
  const { t } = useI18n();
  const {
    control,
    getValues,
    getFieldState,
    setFocus,
    trigger,
    formState: { errors, submitCount },
  } = useFormContext<MealForm>();
  const { data: ingredients, isPending: loading, error, refetch } = useIngredients();
  const { fields, append, insert, remove } = useFieldArray({ control, name: "ingredients" });
  const options = (ingredients ?? []).map(({ id, name }) => ({ value: String(id), label: name }));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [focusRequest, setFocusRequest] = useState<{
    index: number;
    field: IngredientField;
  } | null>(null);
  const [removed, setRemoved] = useState<{ index: number; ingredient: IngredientForm } | null>(
    null,
  );
  const [listFocus, setListFocus] = useState<number | null>(null);
  const lastSubmit = useRef(0);
  const addButton = useRef<HTMLButtonElement>(null);
  const summaryButtons = useRef(new Map<string, HTMLButtonElement>());

  function openRow(index: number, field: IngredientField) {
    setActiveIndex(index);
    setFocusRequest({ index, field });
  }

  useEffect(() => {
    if (lastSubmit.current === submitCount) return;
    lastSubmit.current = submitCount;
    if (errors.name || errors.servings || errors.description || errors.meal_type_ids) return;
    const index = errors.ingredients?.findIndex?.((row) => !!row) ?? -1;
    const row = errors.ingredients?.[index];
    const field = editableFields.find((key) => row?.[key]);
    if (field) openRow(index, field);
  }, [errors, submitCount]);

  useLayoutEffect(() => {
    if (focusRequest) setFocus(`ingredients.${focusRequest.index}.${focusRequest.field}`);
  }, [focusRequest, setFocus]);

  useLayoutEffect(() => {
    if (listFocus === null) return;
    const row = fields[listFocus];
    const button = row ? summaryButtons.current.get(row.id) : addButton.current;
    button?.focus();
    setListFocus(null);
  }, [fields, listFocus]);

  function addIngredient() {
    append(
      { name: "", quantity: "", unit: "", preparation_note: "", uncommitted: false },
      { shouldFocus: false },
    );
    openRow(fields.length, "name");
  }

  const addingAnother = activeIndex !== null && activeIndex === fields.length - 1;

  async function handleAdd() {
    if (activeIndex !== null) {
      const path = `ingredients.${activeIndex}` as const;
      const rowFields = editableFields.map((field) => `${path}.${field}` as const);
      if (!(await trigger(rowFields))) {
        const invalidField = editableFields.find(
          (field) => getFieldState(`${path}.${field}`).invalid,
        );
        if (invalidField) openRow(activeIndex, invalidField);
        return;
      }
    }
    addIngredient();
  }

  function closeRow(index: number) {
    const row = getValues(`ingredients.${index}`);
    if (!row.name && !row.quantity && !row.unit && !row.preparation_note && !row.uncommitted) {
      removeRow(index);
      return;
    }
    setActiveIndex(null);
    setListFocus(index);
  }

  function removeRow(index: number) {
    const ingredient = getValues(`ingredients.${index}`);
    if (ingredient.name) setRemoved({ index, ingredient: { ...ingredient, uncommitted: false } });
    setActiveIndex(null);
    setListFocus(Math.min(index, fields.length - 2));
    remove(index);
  }

  return (
    <fieldset
      aria-labelledby="meal-ingredients-label"
      className="grid min-w-0 gap-2 text-foreground"
    >
      <h3
        id="meal-ingredients-label"
        className="m-0 font-display text-[1.4375rem] leading-tight font-semibold text-balance"
      >
        {t("common.ingredients")}
      </h3>
      {error && (
        <p role="alert" className="m-0 text-caption text-destructive">
          {t("meals.ingredient_manager.load_ingredients_error")}{" "}
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-label"
            onClick={() => void refetch()}
          >
            {t("meals.ingredient_manager.retry_ingredients")}
          </Button>
        </p>
      )}
      {fields.length > 0 && (
        <ul className="m-0 min-w-0 list-none divide-y divide-border p-0">
          {fields.map((field, index) => (
            <IngredientRow
              key={field.id}
              index={index}
              units={units}
              options={options}
              loading={loading}
              catalogError={ingredients ? undefined : error?.message}
              active={activeIndex === index}
              onOpen={(firstField) => openRow(index, firstField)}
              onClose={() => closeRow(index)}
              onRemove={() => removeRow(index)}
              summaryRef={(button) => {
                if (button) summaryButtons.current.set(field.id, button);
                else summaryButtons.current.delete(field.id);
              }}
            />
          ))}
        </ul>
      )}
      {removed && (
        <div className="flex flex-wrap items-center gap-x-3">
          <p
            role="status"
            className="m-0 min-w-0 text-caption wrap-anywhere text-pretty text-muted-foreground"
          >
            {t("meals.ingredient_manager.removed_ingredient", { name: removed.ingredient.name })}
          </p>
          <Button
            type="button"
            variant="link"
            className="min-h-11 px-0"
            onClick={() => {
              insert(removed.index, removed.ingredient, { shouldFocus: false });
              if (activeIndex !== null && activeIndex >= removed.index)
                setActiveIndex(activeIndex + 1);
              setListFocus(removed.index);
              setRemoved(null);
            }}
          >
            {t("meals.ingredient_manager.undo")}
          </Button>
        </div>
      )}
      <Button
        ref={addButton}
        type="button"
        variant="link"
        className="min-h-11 justify-self-end gap-1.5 px-1"
        onClick={() => void handleAdd()}
      >
        <Plus aria-hidden="true" className="size-4 shrink-0" />
        {t(
          addingAnother
            ? "meals.ingredient_manager.add_another"
            : "meals.ingredient_manager.add_ingredient",
        )}
      </Button>
    </fieldset>
  );
}

function IngredientRow({
  index,
  units,
  options,
  loading,
  catalogError,
  active,
  onOpen,
  onClose,
  onRemove,
  summaryRef,
}: {
  index: number;
  units: UnitOption[];
  options: { value: string; label: string }[];
  loading: boolean;
  catalogError?: string;
  active: boolean;
  onOpen: (field: IngredientField) => void;
  onClose: () => void;
  onRemove: () => void;
  summaryRef: (button: HTMLButtonElement | null) => void;
}) {
  const { t } = useI18n();
  const {
    register,
    control,
    getValues,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<MealForm>();
  const path = `ingredients.${index}` as const;
  useWatch({ control, name: path });
  const row = getValues(path);
  const { name, ingredient_id: ingredientId, quantity, unit, preparation_note: note } = row;
  const rowErrors = errors.ingredients?.[index];
  const number = new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 6 });
  const amount =
    quantity && unit
      ? `${number.format(Number(quantity))} ${unitLabel(unit, Number(quantity))}`
      : "";
  const packageSize =
    row.package_quantity && row.package_unit
      ? `${t("recipe.of")} ${number.format(Number(row.package_quantity))} ${unitLabel(row.package_unit, Number(row.package_quantity))}`
      : "";
  const clearContents = () => {
    setValue(`ingredients.${index}.package_quantity`, "", { shouldDirty: true });
    setValue(`ingredients.${index}.package_unit`, "", { shouldDirty: true });
    clearErrors([`ingredients.${index}.package_quantity`, `ingredients.${index}.package_unit`]);
  };
  const fieldId = useId();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const detailsOpen = detailsExpanded || !!(rowErrors?.package_quantity || rowErrors?.package_unit);
  return (
    <li className="min-w-0">
      <button
        ref={summaryRef}
        type="button"
        aria-label={t(
          active
            ? "meals.ingredient_manager.collapse_ingredient"
            : "meals.ingredient_manager.edit_ingredient",
          { name: name || t("meals.ingredient_manager.ingredient") },
        )}
        aria-describedby={`${fieldId}-summary`}
        aria-expanded={active}
        aria-controls={`${fieldId}-editor`}
        className="group grid min-h-11 w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,45%)_1rem] items-baseline gap-x-3 rounded-sm px-3 py-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        onClick={() => {
          if (active) {
            onClose();
            return;
          }
          setDetailsExpanded(false);
          onOpen(name ? "quantity" : "name");
        }}
      >
        <span className="text-body font-medium wrap-anywhere text-pretty text-action">
          {name || t("meals.ingredient_manager.new_ingredient")}
        </span>
        <span id={`${fieldId}-summary`} className="contents">
          {amount && (
            <span className="wrap-anywhere text-label text-right tabular-nums text-muted-foreground">
              {amount} {packageSize}
            </span>
          )}
          {note && (
            <span className="col-span-full text-caption wrap-anywhere text-pretty text-muted-foreground">
              {note}
            </span>
          )}
          {!active && rowErrors && (
            <span className="col-span-full text-caption text-destructive">
              {t("meals.ingredient_manager.check_ingredient")}
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="col-start-3 row-start-1 size-4 self-center text-muted-foreground group-aria-expanded:rotate-180"
        />
      </button>
      <div id={`${fieldId}-editor`} className="px-3" hidden={!active}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-2 pb-1 pt-2 @min-[40rem]:grid-cols-[minmax(0,1fr)_7rem_10rem]">
          <div ref={setContainer} className="col-span-2 grid min-w-0 gap-2 @min-[40rem]:col-span-1">
            <Label htmlFor={`${fieldId}-name`} className="text-label">
              {t("meals.ingredient_manager.ingredient_name")}
            </Label>
            <Controller
              control={control}
              name={`ingredients.${index}.name`}
              rules={{
                validate: (value, values) =>
                  !!value.trim() && !values.ingredients[index]?.uncommitted,
                deps: [`ingredients.${index}.quantity`, `ingredients.${index}.unit`],
              }}
              render={({ field }) => (
                <Combobox
                  options={options}
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
                    const selectedId =
                      option && !option.value.startsWith("new:") ? Number(option.value) : undefined;
                    if ((option?.label ?? "") !== name || selectedId !== ingredientId)
                      clearContents();
                    setValue(`ingredients.${index}.ingredient_id`, selectedId, {
                      shouldDirty: true,
                    });
                    setValue(`ingredients.${index}.uncommitted`, false, { shouldDirty: true });
                    field.onChange(option?.label ?? "");
                  }}
                >
                  <ComboboxInput
                    id={`${fieldId}-name`}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={(event) =>
                      setValue(
                        `ingredients.${index}.uncommitted`,
                        event.target.value.trim() !== (name ?? ""),
                        {
                          shouldDirty: true,
                        },
                      )
                    }
                    className="text-body h-11 min-w-0 rounded-[10px] px-3 shadow-none md:text-body"
                    aria-label={t("meals.ingredient_manager.ingredient_name")}
                    aria-invalid={!!errors.ingredients?.[index]?.name}
                    aria-describedby={rowErrors?.name ? `${fieldId}-name-error` : undefined}
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
            {rowErrors?.name && (
              <p
                id={`${fieldId}-name-error`}
                role="alert"
                className="m-0 text-caption text-destructive"
              >
                {t(
                  row.uncommitted
                    ? "meals.ingredient_manager.choose_name"
                    : "meals.ingredient_manager.empty_name",
                )}
              </p>
            )}
          </div>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor={`${fieldId}-quantity`} className="text-label">
              {t("meals.ingredient_manager.quantity")}
            </Label>
            <Input
              id={`${fieldId}-quantity`}
              aria-label={t("meals.ingredient_manager.quantity")}
              className="text-body h-11 min-w-0 rounded-[10px] px-3 shadow-none tabular-nums md:text-body"
              type="number"
              inputMode="decimal"
              step="any"
              {...register(`ingredients.${index}.quantity`, {
                validate: (value, values) =>
                  !values.ingredients[index]?.name.trim() || validQuantity(value),
              })}
              aria-invalid={!!errors.ingredients?.[index]?.quantity}
              aria-describedby={rowErrors?.quantity ? `${fieldId}-quantity-error` : undefined}
              placeholder={t("meals.ingredient_manager.quantity_short")}
            />
            {rowErrors?.quantity && (
              <p
                id={`${fieldId}-quantity-error`}
                role="alert"
                className="m-0 text-caption wrap-anywhere text-pretty text-destructive"
              >
                {t("meals.ingredient_manager.enter_quantity", { name })}
              </p>
            )}
          </div>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor={`${fieldId}-unit`} className="text-label">
              {t("meals.ingredient_manager.unit")}
            </Label>
            <Controller
              control={control}
              name={`ingredients.${index}.unit`}
              rules={{
                validate: (value, values) =>
                  !values.ingredients[index]?.name.trim() || !!value.trim(),
              }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value !== field.value) clearContents();
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-unit`}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    type="button"
                    aria-label={t("meals.ingredient_manager.unit")}
                    className="text-body h-11 min-w-0 w-full gap-2 rounded-[10px] px-3 shadow-none"
                    aria-invalid={!!errors.ingredients?.[index]?.unit}
                    aria-describedby={rowErrors?.unit ? `${fieldId}-unit-error` : undefined}
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
            {rowErrors?.unit && (
              <p
                id={`${fieldId}-unit-error`}
                role="alert"
                className="m-0 text-caption wrap-anywhere text-pretty text-destructive"
              >
                {t("meals.ingredient_manager.choose_unit", { name })}
              </p>
            )}
          </div>
          <Collapsible
            open={detailsOpen}
            onOpenChange={setDetailsExpanded}
            className="col-span-full min-w-0"
          >
            <CollapsibleTrigger className="group inline-flex min-h-11 items-center gap-1 text-label text-muted-foreground">
              {t("meals.ingredient_manager.ingredient_details")}
              <ChevronDown
                aria-hidden="true"
                className="size-4 group-data-[state=open]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent
              forceMount
              className="grid min-w-0 gap-3 pb-2 data-[state=closed]:hidden"
            >
              <Label className="text-label grid min-w-0 gap-2">
                {t("meals.ingredient_manager.preparation_note")}
                <Input
                  className="text-body h-11 md:text-body"
                  {...register(`ingredients.${index}.preparation_note`)}
                  placeholder={t("meals.ingredient_manager.note_optional")}
                />
              </Label>
              {units.find((option) => option.code === unit)?.dimension === "package" && (
                <RecipePackageFields
                  key={`${ingredientId ?? name}:${unit}`}
                  index={index}
                  ingredientId={ingredientId}
                  units={units}
                  visible={active && detailsOpen}
                  packageUnit={unit}
                />
              )}
              <Button
                type="button"
                variant="link"
                className="min-h-11 justify-self-start px-0 text-destructive"
                onClick={onRemove}
                aria-label={t("meals.ingredient_manager.remove_ingredient", {
                  name: name || t("meals.ingredient_manager.ingredient"),
                })}
              >
                {t("meals.ingredient_manager.remove")}
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </li>
  );
}
