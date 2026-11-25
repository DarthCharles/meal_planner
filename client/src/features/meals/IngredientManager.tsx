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
import { ChevronDown, ChevronRight, Plus } from "@darthcharles/greda/icons";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Link } from "react-router";

import { unitLabel, useI18n } from "../../i18n";
import type { IngredientForm, MealForm, UnitOption } from "../../types";
import { isEmptyIngredient } from "./ingredientDraft";
import { formatRecipeQuantity, parseQuantity, validQuantity } from "./quantity";
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
    setValue,
    clearErrors,
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
  const [original, setOriginal] = useState<IngredientForm | null>(null);
  const pendingValidation = useRef<symbol | null>(null);
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
    if (field) {
      if (activeIndex !== index) setOriginal({ ...getValues(`ingredients.${index}`) });
      openRow(index, field);
    }
  }, [activeIndex, errors, getValues, submitCount]);

  useLayoutEffect(() => {
    if (!focusRequest) return;
    setFocus(`ingredients.${focusRequest.index}.${focusRequest.field}`);
  }, [focusRequest, setFocus]);

  useLayoutEffect(() => {
    if (listFocus === null) return;
    const row = fields[listFocus];
    const button = row ? summaryButtons.current.get(row.id) : addButton.current;
    button?.focus();
    setListFocus(null);
  }, [fields, listFocus]);

  function addIngredient() {
    setOriginal(null);
    append(
      {
        name: "",
        quantity: "",
        unit: "",
        preparation_note: "",
        package_quantity: "",
        package_unit: "",
      },
      { shouldFocus: false },
    );
    openRow(fields.length, "name");
  }

  async function finishRow(index: number) {
    if (pendingValidation.current) return;
    const path = `ingredients.${index}` as const;
    if (isEmptyIngredient(getValues(path))) {
      setFocus(`${path}.name`);
      return;
    }
    const rowFields = editableFields.map((field) => `${path}.${field}` as const);
    const validation = Symbol();
    pendingValidation.current = validation;
    const valid = await trigger(rowFields);
    if (pendingValidation.current !== validation) return;
    pendingValidation.current = null;
    if (!valid) {
      const invalidField = editableFields.find(
        (field) => getFieldState(`${path}.${field}`).invalid,
      );
      if (invalidField) openRow(index, invalidField);
      return;
    }
    if (!original) {
      addIngredient();
      return;
    }
    collapseRow(index);
  }

  function cancelRow(index: number) {
    const path = `ingredients.${index}` as const;
    if (original) {
      setValue(path, original, { shouldDirty: true });
      clearErrors(path);
    } else {
      remove(index);
    }
    collapseRow(index);
  }

  function collapseRow(index: number) {
    pendingValidation.current = null;
    setOriginal(null);
    setActiveIndex(null);
    setListFocus(index);
  }

  function toggleRow(index: number) {
    pendingValidation.current = null;
    if (activeIndex === index) {
      collapseRow(index);
      return;
    }

    setOriginal({ ...getValues(`ingredients.${index}`) });
    let target = index;
    if (activeIndex !== null && isEmptyIngredient(getValues(`ingredients.${activeIndex}`))) {
      remove(activeIndex);
      if (index > activeIndex) target -= 1;
    }
    setActiveIndex(target);
    setListFocus(target);
  }

  function removeRow(index: number) {
    const ingredient = getValues(`ingredients.${index}`);
    if (ingredient.name.trim()) setRemoved({ index, ingredient: { ...ingredient } });
    remove(index);
    collapseRow(Math.min(index, fields.length - 2));
  }

  return (
    <fieldset
      aria-labelledby="meal-ingredients-label"
      className="grid min-w-0 gap-xs text-foreground"
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
              adding={activeIndex === index && original === null}
              onToggle={() => toggleRow(index)}
              onFinish={() => void finishRow(index)}
              onCancel={() => cancelRow(index)}
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
        <div className="flex flex-wrap items-center gap-x-sm">
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
              pendingValidation.current = null;
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
      {activeIndex === null && (
        <Button
          ref={addButton}
          type="button"
          variant="link"
          className="text-label min-h-11 justify-self-start px-0"
          onClick={addIngredient}
        >
          <Plus aria-hidden="true" className="size-4 shrink-0" />
          {t("meals.ingredient_manager.add_ingredient")}
        </Button>
      )}
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
  adding,
  onToggle,
  onFinish,
  onCancel,
  onRemove,
  summaryRef,
}: {
  index: number;
  units: UnitOption[];
  options: { value: string; label: string }[];
  loading: boolean;
  catalogError?: string;
  active: boolean;
  adding: boolean;
  onToggle: () => void;
  onFinish: () => void;
  onCancel: () => void;
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
  const amount =
    quantity && unit && validQuantity(quantity)
      ? `${formatRecipeQuantity(quantity, unit)} ${unitLabel(unit, parseQuantity(quantity))}`
      : "";
  const selectedPackage = units.find((option) => option.code === unit)?.dimension === "package";
  const packageSize =
    row.package_quantity && row.package_unit && validQuantity(row.package_quantity)
      ? `${t("recipe.of")} ${formatRecipeQuantity(row.package_quantity, row.package_unit)} ${unitLabel(row.package_unit, parseQuantity(row.package_quantity))}`
      : "";
  const clearContents = () => {
    setValue(`ingredients.${index}.package_quantity`, "", { shouldDirty: true });
    setValue(`ingredients.${index}.package_unit`, "", { shouldDirty: true });
    clearErrors([`ingredients.${index}.package_quantity`, `ingredients.${index}.package_unit`]);
  };
  const fieldId = useId();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const isPickerOpen = active && pickerOpen;
  const detailsOpen = detailsExpanded || !!(rowErrors?.package_quantity || rowErrors?.package_unit);
  const RowChevron = active ? ChevronDown : ChevronRight;
  return (
    <li className="min-w-0">
      {!adding && (
        <div className="grid">
          <button
            ref={summaryRef}
            type="button"
            aria-label={t("meals.ingredient_manager.edit_ingredient", {
              name: name || t("meals.ingredient_manager.ingredient"),
            })}
            aria-describedby={`${fieldId}-summary`}
            aria-expanded={active}
            aria-controls={`${fieldId}-editor`}
            className="grid min-h-11 min-w-0 grid-cols-[1rem_minmax(0,1fr)_minmax(0,45%)] items-baseline gap-x-xs rounded-sm px-sm py-xs text-left focus-visible:outline-2 focus-visible:outline-ring aria-[expanded=false]:hover:bg-muted"
            onClick={() => {
              setPickerOpen(false);
              setDetailsExpanded(false);
              onToggle();
            }}
          >
            <RowChevron
              aria-hidden="true"
              className="mt-2xs size-4 self-start text-muted-foreground"
            />
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
                <span className="col-span-2 col-start-2 text-caption wrap-anywhere text-pretty text-muted-foreground">
                  {note}
                </span>
              )}
              {rowErrors && (
                <span className="col-span-2 col-start-2 text-caption text-destructive">
                  {t("meals.ingredient_manager.check_ingredient")}
                </span>
              )}
            </span>
          </button>
        </div>
      )}
      <div
        id={`${fieldId}-editor`}
        role="group"
        aria-label={
          adding
            ? t("meals.ingredient_manager.add_ingredient")
            : t("meals.ingredient_manager.edit_ingredient", {
                name: name || t("meals.ingredient_manager.ingredient"),
              })
        }
        className="my-xs rounded-md bg-muted px-sm"
        hidden={!active}
      >
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-xs py-sm">
          <div ref={setContainer} className="col-span-2 grid min-w-0 gap-xs">
            <Label htmlFor={`${fieldId}-name`} className="text-label">
              {t("meals.ingredient_manager.ingredient_name")}
            </Label>
            <Controller
              control={control}
              name={`ingredients.${index}.name`}
              rules={{
                validate: (value, values) =>
                  isEmptyIngredient(values.ingredients[index]) || !!value.trim(),
                deps: [`ingredients.${index}.quantity`, `ingredients.${index}.unit`],
              }}
              render={({ field }) => (
                <Combobox
                  options={options}
                  open={isPickerOpen}
                  onOpenChange={setPickerOpen}
                  value={
                    field.value && (ingredientId || !isPickerOpen)
                      ? {
                          value: ingredientId
                            ? String(ingredientId)
                            : `new:${field.value.toLowerCase()}`,
                          label: field.value,
                        }
                      : null
                  }
                  inputValue={field.value}
                  loading={loading}
                  error={catalogError}
                  onCreate={(label) => ({ value: `new:${label.toLowerCase()}`, label })}
                  onValueChange={(option) => {
                    const selectedId =
                      option && !option.value.startsWith("new:") ? Number(option.value) : undefined;
                    if (
                      (option?.label ?? "").trim().toLowerCase() !== name.trim().toLowerCase() ||
                      selectedId !== ingredientId
                    ) {
                      clearContents();
                    }
                    setValue(`ingredients.${index}.ingredient_id`, selectedId, {
                      shouldDirty: true,
                    });
                    field.onChange(option?.label ?? "");
                  }}
                >
                  <ComboboxInput
                    id={`${fieldId}-name`}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      const value = event.target.value;
                      const normalized = value.trim().toLowerCase();
                      const match = options.find(
                        (option) => option.label.toLowerCase() === normalized,
                      );
                      const nextId = match ? Number(match.value) : undefined;
                      if (normalized !== name.trim().toLowerCase() || nextId !== ingredientId) {
                        clearContents();
                      }
                      setValue(`ingredients.${index}.ingredient_id`, nextId, { shouldDirty: true });
                      field.onChange(value);
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key !== "Enter" ||
                        event.nativeEvent.isComposing ||
                        event.keyCode === 229 ||
                        event.currentTarget.hasAttribute("aria-activedescendant")
                      ) {
                        return;
                      }
                      event.preventDefault();
                    }}
                    className="text-body h-11 min-w-0 rounded-[10px] shadow-none md:text-body"
                    aria-invalid={!!errors.ingredients?.[index]?.name}
                    aria-describedby={rowErrors?.name ? `${fieldId}-name-error` : undefined}
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
                {t("meals.ingredient_manager.empty_name")}
              </p>
            )}
          </div>
          <div className="grid min-w-0 gap-xs">
            <Label htmlFor={`${fieldId}-quantity`} className="text-label">
              {t("meals.ingredient_manager.quantity")}
            </Label>
            <Input
              id={`${fieldId}-quantity`}
              className="text-body h-11 min-w-0 rounded-[10px] px-sm shadow-none tabular-nums md:text-body"
              placeholder="1/2"
              autoComplete="off"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  event.preventDefault();
                  onFinish();
                }
              }}
              {...register(`ingredients.${index}.quantity`, {
                validate: (value, values) =>
                  !values.ingredients[index]?.name.trim() || validQuantity(value),
              })}
              aria-invalid={!!errors.ingredients?.[index]?.quantity}
              aria-describedby={rowErrors?.quantity ? `${fieldId}-quantity-error` : undefined}
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
          <div className="grid min-w-0 gap-xs">
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
                    if (
                      units.some(
                        (option) => option.code === value && option.dimension === "package",
                      )
                    ) {
                      setDetailsExpanded(true);
                    }
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-unit`}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    type="button"
                    className="text-body h-11 min-w-0 w-full gap-xs rounded-[10px] px-sm shadow-none"
                    aria-invalid={!!errors.ingredients?.[index]?.unit}
                    aria-describedby={rowErrors?.unit ? `${fieldId}-unit-error` : undefined}
                  >
                    <SelectValue placeholder={t("meals.ingredient_manager.unit_placeholder")} />
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
            <CollapsibleTrigger className="group inline-flex min-h-11 items-center gap-2xs text-label text-muted-foreground">
              {t("meals.ingredient_manager.ingredient_details")}
              <ChevronDown
                aria-hidden="true"
                className="size-4 group-data-[state=open]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent
              forceMount
              className="grid min-w-0 gap-sm pb-xs data-[state=closed]:hidden"
            >
              <Label className="text-label grid min-w-0 gap-xs">
                {t("meals.ingredient_manager.preparation_note")}
                <Input
                  className="text-body h-11 md:text-body"
                  {...register(`ingredients.${index}.preparation_note`)}
                  placeholder={t("meals.ingredient_manager.note_optional")}
                />
              </Label>
              {(selectedPackage || (active && !!ingredientId)) && (
                <div className="flex min-w-0 flex-row flex-wrap items-center justify-between gap-x-sm gap-y-xs">
                  {selectedPackage && (
                    <RecipePackageFields
                      key={`${ingredientId ?? name}:${unit}`}
                      index={index}
                      ingredientId={ingredientId}
                      units={units}
                      visible={active && detailsOpen}
                      packageUnit={unit}
                    />
                  )}
                  {active && ingredientId && (
                    <Button asChild variant="link" className="text-label min-h-11 px-0">
                      <Link to={`/ingredients/${ingredientId}/edit`} target="_blank" rel="noopener">
                        {t("ingredients.form.edit_ingredient")}
                        <span className="sr-only">
                          {" "}
                          {t("meals.ingredient_manager.opens_in_new_tab")}
                        </span>
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
          <div className="col-span-full flex flex-wrap items-center justify-end gap-xs">
            {!adding && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-label mr-auto min-h-11 min-w-11 px-xs text-destructive"
                aria-label={t("meals.ingredient_manager.remove_ingredient", {
                  name: name || t("meals.ingredient_manager.ingredient"),
                })}
                onClick={onRemove}
              >
                {t("meals.ingredient_manager.remove")}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              aria-label={t("meals.ingredient_manager.cancel_edit")}
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="default" className="min-h-11" onClick={onFinish}>
              {t(
                adding
                  ? "meals.ingredient_manager.add_and_continue"
                  : "meals.ingredient_manager.done",
              )}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
