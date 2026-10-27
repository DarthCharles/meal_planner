import { Button, Input } from "@darthcharles/greda";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { MealForm, UnitOption } from "../../types";

export function IngredientManager({ units }: { units: UnitOption[] }) {
  const { control } = useFormContext<MealForm>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });
  return (
    <fieldset className="mb-4 grid gap-[7px] text-xs font-bold text-foreground">
      <div className="flex items-center justify-between gap-3">
        <legend className="m-0">
          Ingredients{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-[11px]"
          onClick={() =>
            append({ name: "", quantity: "", unit: "", preparation_note: "" })
          }
        >
          + Add ingredient
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="m-0 rounded-[10px] border border-dashed border-border p-3 text-xs font-normal text-muted-foreground">
          Add what you need to cook this meal.
        </p>
      )}
      {fields.map((field, index) => (
        <IngredientRow
          key={field.id}
          index={index}
          units={units}
          onRemove={() => remove(index)}
        />
      ))}
    </fieldset>
  );
}

function IngredientRow({
  index,
  units,
  onRemove,
}: {
  index: number;
  units: UnitOption[];
  onRemove: () => void;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<MealForm>();
  const name = useWatch({ control, name: `ingredients.${index}.name` });
  return (
    <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_25px] tablet:grid-cols-[minmax(0,1.4fr)_66px_78px_minmax(0,1.1fr)_25px] items-center gap-[6px]">
      <Input
        className="col-span-2 tablet:col-span-1 h-auto min-w-0 rounded-[10px] bg-background px-2 py-[9px] text-[13px] md:text-[13px] font-normal shadow-none"
        aria-label="Ingredient name"
        {...register(`ingredients.${index}.name`, {
          deps: [`ingredients.${index}.quantity`, `ingredients.${index}.unit`],
        })}
        placeholder="Ingredient"
      />
      <Input
        aria-label="Quantity"
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
        aria-describedby={
          errors.ingredients?.[index]?.quantity ? "meal-form-error" : undefined
        }
        placeholder="Qty"
      />
      <select
        aria-label="Unit"
        className="h-auto min-w-0 w-full rounded-[10px] border border-input bg-background px-2 py-[9px] text-[13px] font-normal text-center text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive"
        {...register(`ingredients.${index}.unit`, {
          validate: (value, values) =>
            !values.ingredients[index]?.name.trim() || !!value.trim(),
        })}
        aria-invalid={!!errors.ingredients?.[index]?.unit}
        aria-describedby={
          errors.ingredients?.[index]?.unit ? "meal-form-error" : undefined
        }
      >
        <option value="">Unit</option>
        {units.map((unit) => (
          <option key={unit.code} value={unit.code}>
            {unit.code}
          </option>
        ))}
      </select>
      <Input
        className="col-span-2 tablet:col-span-1 h-auto min-w-0 rounded-[10px] bg-background px-2 py-[9px] text-[13px] md:text-[13px] font-normal shadow-none"
        aria-label="Preparation note"
        {...register(`ingredients.${index}.preparation_note`)}
        placeholder="Note (optional)"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="col-start-3 row-start-1 tablet:col-start-auto tablet:row-start-auto size-[25px] rounded-full text-[17px]"
        onClick={onRemove}
        aria-label={`Remove ${name || "ingredient"}`}
      >
        ×
      </Button>
    </div>
  );
}
