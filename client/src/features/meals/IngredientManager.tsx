import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { MealForm, UnitOption } from "../../types";

export function IngredientManager({ units }: { units: UnitOption[] }) {
  const { control } = useFormContext<MealForm>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });
  return (
    <fieldset className="mb-4 grid gap-[7px] text-xs font-bold text-[#5e594f]">
      <div className="flex items-center justify-between gap-3">
        <legend className="m-0">
          Ingredients <span className="font-normal text-muted">(optional)</span>
        </legend>
        <button
          type="button"
          className="border-0 bg-transparent text-[11px] font-bold text-terracotta-dark"
          onClick={() =>
            append({ name: "", quantity: "", unit: "", preparation_note: "" })
          }
        >
          + Add ingredient
        </button>
      </div>
      {fields.length === 0 && (
        <p className="m-0 rounded-[10px] border border-dashed border-[#dfd5c7] p-3 text-xs font-normal text-muted">
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
    <div className="mt-2 grid grid-cols-[minmax(0,1.4fr)_66px_78px_minmax(0,1.1fr)_25px] items-center gap-[6px]">
      <input
        className="min-w-0 w-full resize-y rounded-[10px] border border-line bg-white px-2 py-[9px] text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de]"
        aria-label="Ingredient name"
        {...register(`ingredients.${index}.name`, {
          deps: [`ingredients.${index}.quantity`, `ingredients.${index}.unit`],
        })}
        placeholder="Ingredient"
      />
      <input
        aria-label="Quantity"
        className="min-w-0 w-full resize-y rounded-[10px] border border-line bg-white px-2 py-[9px] text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de] text-center"
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
        className="min-w-0 w-full resize-y rounded-[10px] border border-line bg-white px-2 py-[9px] text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de] text-center"
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
      <input
        className="min-w-0 w-full resize-y rounded-[10px] border border-line bg-white px-2 py-[9px] text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de]"
        aria-label="Preparation note"
        {...register(`ingredients.${index}.preparation_note`)}
        placeholder="Note (optional)"
      />
      <button
        type="button"
        className="size-[25px] rounded-full border-0 bg-[#f4efe7] text-[17px] leading-5 text-muted hover:bg-[#f8e4db] hover:text-[#b03d2f]"
        onClick={onRemove}
        aria-label={`Remove ${name || "ingredient"}`}
      >
        ×
      </button>
    </div>
  );
}
