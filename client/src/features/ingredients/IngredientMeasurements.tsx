import { useEffect, useRef, useState } from "react";

import { Button, Checkbox, Input } from "@darthcharles/greda";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router";

import { UnitSelect } from "../../components/UnitSelect";
import { formatLocale, unitLabel, useI18n } from "../../i18n";
import type { MeasurementReference, UnitOption } from "../../types";
import { useUnits } from "../meals/queries";
import { useEditorDraft } from "../navigation/EditorDraftContext";
import {
  useIngredientMeasurementReferences,
  useSaveIngredientMeasurementReferences,
} from "./queries";

type ReferenceDraft = MeasurementReference & { enabled: boolean; measuredUnit: string };
type Draft = { references: ReferenceDraft[] };
const kinds = ["density", "piece_weight"] as const;
function toDraft(references: MeasurementReference[]): Draft {
  return {
    references: kinds.map((kind) => ({
      kind,
      quantity: "",
      reference_quantity: "",
      source: "",
      description: "",
      approximate: true,
      ...references.find((reference) => reference.kind === kind),
      enabled: references.some((reference) => reference.kind === kind),
      measuredUnit: kind === "density" ? "ml" : "piece",
    })),
  };
}
const validDecimal = (value: string) =>
  /^\d+(?:\.\d+)?$/.test(value) && Number(value) > 0 && Number(value) <= 1e9;
// Multiply finite decimal strings exactly. Preserve the measured numerator/denominator;
// never reduce a measured ratio to a rounded density.
function multiplyDecimals(left: string, right: string) {
  const [a, af = ""] = left.split(".");
  const [b, bf = ""] = right.split(".");
  const scale = af.length + bf.length;
  const digits = (BigInt(a + af) * BigInt(b + bf)).toString().padStart(scale + 1, "0");
  return scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits;
}
function toReferences(draft: Draft, units: UnitOption[]): MeasurementReference[] {
  return draft.references
    .filter((reference) => reference.enabled)
    .map(({ enabled: _enabled, measuredUnit, ...reference }) => ({
      ...reference,
      reference_quantity:
        measuredUnit === "ml" || measuredUnit === "piece"
          ? reference.reference_quantity
          : multiplyDecimals(
              reference.reference_quantity,
              units.find((unit) => unit.code === measuredUnit)!.factor!,
            ),
    }));
}

export function IngredientMeasurements({ ingredientId }: { ingredientId: number }) {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const correction = params.get("section") === "measurements";
  const heading = useRef<HTMLHeadingElement>(null);
  const [editing, setEditing] = useState(correction);
  const {
    data: references,
    isPending,
    error,
    refetch,
    isFetching,
  } = useIngredientMeasurementReferences(ingredientId);
  const {
    data: units,
    error: unitsError,
    refetch: retryUnits,
    isFetching: fetchingUnits,
  } = useUnits();
  useEffect(() => {
    if (correction) {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "start" });
    }
  }, [correction]);
  return (
    <section
      aria-label={t("measurements.title")}
      className="mb-6 grid min-w-0 gap-4 border-t border-border pt-6"
    >
      <h3
        ref={heading}
        tabIndex={-1}
        className="m-0 font-display text-xl font-semibold focus-visible:outline-2 focus-visible:outline-ring"
      >
        {t("measurements.title")}
      </h3>
      <p className="m-0 text-sm text-muted-foreground">{t("measurements.help")}</p>
      {params.get("fromUnits") && (
        <p className="m-0 text-sm">
          {t("shopping_details.missing", {
            from: (params.get("fromUnits") ?? "")
              .split(",")
              .map((unit) => unitLabel(unit))
              .join(", "),
            to: unitLabel(params.get("targetUnit") ?? ""),
          })}
        </p>
      )}
      {(isPending || (!units && !unitsError)) && <p role="status">{t("measurements.loading")}</p>}
      {error && (
        <div>
          <p role="alert">{error.message}</p>
          <Button
            type="button"
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {t("measurements.retry")}
          </Button>
        </div>
      )}
      {unitsError && (
        <div>
          <p role="alert">{unitsError.message}</p>
          <Button
            type="button"
            variant="outline"
            disabled={fetchingUnits}
            onClick={() => void retryUnits()}
          >
            {t("common.try_again")}
          </Button>
        </div>
      )}
      {references !== undefined && units && (
        <>
          {editing ? (
            <ReferenceForm
              ingredientId={ingredientId}
              references={references}
              units={units}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {!references.length && <p className="m-0 text-sm">{t("measurements.empty")}</p>}
              {references.map((reference) => (
                <p key={reference.kind} className="m-0 text-sm">
                  {t("measurements.relationship", {
                    quantity: reference.quantity,
                    amount: reference.reference_quantity,
                    unit: unitLabel(
                      reference.kind === "density" ? "ml" : "piece",
                      Number(reference.reference_quantity),
                    ),
                  })}
                  {reference.approximate && <> · {t("measurements.approximate")}</>}
                </p>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-11 whitespace-normal justify-self-start"
                onClick={() => setEditing(true)}
              >
                {t("measurements.edit")}
              </Button>
            </>
          )}
        </>
      )}
    </section>
  );
}

function ReferenceForm({
  ingredientId,
  references,
  units,
  onCancel,
}: {
  ingredientId: number;
  references: MeasurementReference[];
  units: UnitOption[];
  onCancel: () => void;
}) {
  const { t } = useI18n();
  // Initialize once from a complete successful collection. Refreshes do not reset drafts.
  const methods = useForm<Draft>({ defaultValues: toDraft(references) });
  const {
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = methods;
  useEditorDraft(isDirty);
  const {
    mutate: save,
    isPending: saving,
    error,
    isSuccess,
    reset: resetSave,
  } = useSaveIngredientMeasurementReferences(ingredientId);
  return (
    <FormProvider {...methods}>
      <form
        noValidate
        className="grid min-w-0 gap-5"
        onSubmit={handleSubmit(
          (draft) => {
            if (!saving)
              save(toReferences(draft, units), { onSuccess: (saved) => reset(toDraft(saved)) });
          },
          () => resetSave(),
        )}
      >
        {kinds.map((kind, index) => (
          <ReferenceFields key={kind} index={index} units={units} disabled={saving} />
        ))}
        {errors.references && (
          <p role="alert" id="measurement-form-error" className="m-0 text-sm text-destructive">
            {t("measurements.required")}
          </p>
        )}
        {error && (
          <p role="alert" className="m-0 text-sm text-destructive">
            {error.message}
          </p>
        )}
        {isSuccess && !isDirty && (
          <p role="status" className="m-0 text-sm">
            {t("measurements.saved")}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => {
              if (!isDirty || window.confirm(t("measurements.confirm_cancel"))) {
                reset();
                onCancel();
              }
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {t(saving ? "common.saving" : "measurements.save")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

function ReferenceFields({
  index,
  units,
  disabled,
}: {
  index: number;
  units: UnitOption[];
  disabled: boolean;
}) {
  const { t } = useI18n();
  const {
    control,
    register,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<Draft>();
  const draft = useWatch({ control, name: `references.${index}` });
  const kind = draft.kind;
  const enabled = draft.enabled;
  const rowErrors = errors.references?.[index];
  const describe = rowErrors ? "measurement-form-error" : undefined;
  const validate = (value: string, values: Draft) =>
    !values.references[index].enabled || validDecimal(value);
  const textRequired = (value: string, values: Draft) =>
    !values.references[index].enabled || !!value.trim();
  const volumeUnits = units.filter((unit) => unit.dimension === "volume");
  const number = new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 6 });
  return (
    <fieldset className="grid min-w-0 gap-3 border-t border-border pt-4">
      <legend className="font-semibold">{t(`measurements.${kind}`)}</legend>
      <Controller
        control={control}
        name={`references.${index}.enabled`}
        render={({ field }) => (
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <Checkbox
              checked={field.value}
              disabled={disabled}
              onCheckedChange={(checked) => {
                field.onChange(checked === true);
                clearErrors(`references.${index}`);
              }}
            />
            {t("measurements.enabled")}
          </label>
        )}
      />
      {enabled && (
        <>
          <p className="m-0 text-sm text-muted-foreground">{t("measurements.stored")}</p>
          <div className="grid min-w-0 gap-3 tablet:grid-cols-3">
            <label className="grid min-w-0 gap-2 text-sm">
              {t("measurements.amount")}
              <Input
                className="h-11"
                disabled={disabled}
                {...register(`references.${index}.reference_quantity`, { validate })}
                aria-invalid={!!rowErrors?.reference_quantity}
                aria-describedby={describe}
              />
            </label>
            <Controller
              control={control}
              name={`references.${index}.measuredUnit`}
              render={({ field }) => (
                <UnitSelect
                  label={t("measurements.unit")}
                  value={field.value}
                  onChange={field.onChange}
                  inputRef={field.ref}
                  onBlur={field.onBlur}
                  units={
                    kind === "density" ? volumeUnits : units.filter((unit) => unit.code === "piece")
                  }
                  disabled={disabled}
                />
              )}
            />
            <label className="grid min-w-0 gap-2 text-sm">
              {t("measurements.grams")}
              <Input
                className="h-11"
                disabled={disabled}
                {...register(`references.${index}.quantity`, { validate })}
                aria-invalid={!!rowErrors?.quantity}
                aria-describedby={describe}
              />
            </label>
          </div>
          <div className="grid gap-2 text-sm">
            <span>{t("measurements.source_choice")}</span>
            <div className="flex flex-wrap gap-2">
              {(["Product label", "Personal measurement"] as const).map((source, sourceIndex) => (
                <Button
                  key={source}
                  type="button"
                  size="sm"
                  className="min-h-11 whitespace-normal"
                  variant={draft.source === source ? "secondary" : "outline"}
                  disabled={disabled}
                  aria-pressed={draft.source === source}
                  onClick={() =>
                    setValue(`references.${index}.source`, source, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  {t(sourceIndex === 0 ? "measurements.label" : "measurements.measurement")}
                </Button>
              ))}
            </div>
          </div>
          <details
            open={!["Product label", "Personal measurement"].includes(draft.source) || undefined}
          >
            <summary className="min-h-11 cursor-pointer content-center text-sm text-primary">
              {t("measurements.source_details")}
            </summary>
            <label className="grid gap-2 text-sm">
              {t("measurements.source")}
              <Input
                className="h-11"
                disabled={disabled}
                {...register(`references.${index}.source`, { validate: textRequired })}
                aria-invalid={!!rowErrors?.source}
                aria-describedby={describe}
              />
            </label>
          </details>
          <label className="grid gap-2 text-sm">
            {t("measurements.description")}
            <Input
              className="h-11"
              disabled={disabled}
              {...register(`references.${index}.description`, { validate: textRequired })}
              aria-invalid={!!rowErrors?.description}
              aria-describedby={describe}
            />
          </label>
          <Controller
            control={control}
            name={`references.${index}.approximate`}
            render={({ field }) => (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Checkbox
                  checked={field.value}
                  disabled={disabled}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                {t("measurements.approximate")}
              </label>
            )}
          />
          {kind === "density" &&
            validDecimal(draft.quantity) &&
            validDecimal(draft.reference_quantity) && (
              <div className="text-sm text-muted-foreground">
                <p className="m-0 font-semibold">{t("measurements.derived")}</p>
                <ul className="mt-2 mb-0 pl-5">
                  {volumeUnits
                    .filter((unit) => ["cup", "tablespoon", "teaspoon"].includes(unit.code))
                    .map((unit) => (
                      <li key={unit.code}>
                        {t("measurements.equivalent", {
                          unit: unitLabel(unit.code, 1),
                          quantity: number.format(
                            (Number(draft.quantity) * Number(unit.factor)) /
                              (Number(draft.reference_quantity) *
                                Number(
                                  units.find((option) => option.code === draft.measuredUnit)
                                    ?.factor,
                                )),
                          ),
                        })}
                      </li>
                    ))}
                </ul>
              </div>
            )}
        </>
      )}
    </fieldset>
  );
}
