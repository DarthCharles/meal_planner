import type { IngredientForm, UnitOption } from "../../types";

export function IngredientManager({
  ingredients,
  units,
  onAdd,
  onChange,
  onRemove,
}: {
  ingredients: IngredientForm[];
  units: UnitOption[];
  onAdd: () => void;
  onChange: (index: number, changes: Partial<IngredientForm>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <fieldset className="mb-4 grid gap-[7px] text-xs font-bold text-[#5e594f]">
      <div className="flex items-center justify-between gap-3">
        <legend className="m-0">
          Ingredients <span className="font-normal text-muted">(optional)</span>
        </legend>
        <button
          type="button"
          className="border-0 bg-transparent text-[11px] font-bold text-terracotta-dark"
          onClick={onAdd}
        >
          + Add ingredient
        </button>
      </div>
      {ingredients.length === 0 && (
        <p className="m-0 rounded-[10px] border border-dashed border-[#dfd5c7] p-3 text-xs font-normal text-muted">
          Add what you need to cook this meal.
        </p>
      )}
      {ingredients.map((ingredient, index) => (
        <div
          className="mt-2 grid grid-cols-[minmax(0,1.4fr)_66px_78px_minmax(0,1.1fr)_25px] items-center gap-[6px]"
          key={index}
        >
          <input
            className="min-w-0 w-full resize-y rounded-[10px] border border-line bg-white px-2 py-[9px] text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de]"
            aria-label="Ingredient name"
            value={ingredient.name}
            onChange={(event) => onChange(index, { name: event.target.value })}
            placeholder="Ingredient"
          />
          <input
            aria-label="Quantity"
            className="min-w-0 w-full resize-y rounded-[10px] border border-line bg-white px-2 py-[9px] text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de] text-center"
            type="number"
            min="0.001"
            step="any"
            value={ingredient.quantity}
            onChange={(event) =>
              onChange(index, { quantity: event.target.value })
            }
            placeholder="Qty"
          />
          <select
            aria-label="Unit"
            className="min-w-0 w-full resize-y rounded-[10px] border border-line bg-white px-2 py-[9px] text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de] text-center"
            value={ingredient.unit}
            onChange={(event) => onChange(index, { unit: event.target.value })}
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
            value={ingredient.preparation_note}
            onChange={(event) =>
              onChange(index, { preparation_note: event.target.value })
            }
            placeholder="Note (optional)"
          />
          <button
            type="button"
            className="size-[25px] rounded-full border-0 bg-[#f4efe7] text-[17px] leading-5 text-muted hover:bg-[#f8e4db] hover:text-[#b03d2f]"
            onClick={() => onRemove(index)}
            aria-label={`Remove ${ingredient.name || "ingredient"}`}
          >
            ×
          </button>
        </div>
      ))}
    </fieldset>
  );
}
