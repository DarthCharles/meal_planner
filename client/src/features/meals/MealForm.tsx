import { useState } from "react";
import { Button } from "../../components/Button";
import type {
  IngredientForm,
  Meal,
  MealForm as MealFormValues,
  MealTypeOption,
  UnitOption,
} from "../../types";
import { useCreateMeal, useUpdateMeal } from "./queries";
import { IngredientManager } from "./IngredientManager";

export function MealForm({
  types,
  units,
  initialMeal,
  onClose,
  onSaved,
}: {
  initialMeal: Meal | null;
  onClose: () => void;
  onSaved: () => void;
  types: MealTypeOption[];
  units: UnitOption[];
}) {
  const [form, setForm] = useState<MealFormValues>(() => ({
    name: initialMeal?.name ?? "",
    description: initialMeal?.description ?? "",
    recipe_url: initialMeal?.recipe_url ?? "",
    meal_type_ids: initialMeal
      ? types
          .filter(([name]) => initialMeal.meal_types.includes(name))
          .map(([, id]) => id)
      : [],
    ingredients:
      initialMeal?.ingredients?.map(
        ({ name, quantity, unit, preparation_note }) => ({
          name,
          quantity: String(quantity),
          unit,
          preparation_note: preparation_note ?? "",
        }),
      ) ?? [],
  }));
  const [validationError, setValidationError] = useState("");
  const {
    mutate: createMeal,
    isPending: creating,
    error: createError,
    reset: resetCreateMeal,
  } = useCreateMeal();
  const {
    mutate: updateMeal,
    isPending: updating,
    error: updateError,
    reset: resetUpdateMeal,
  } = useUpdateMeal();
  const saving = creating || updating;
  const error = validationError || createError?.message || updateError?.message;
  const toggleType = (id: number) =>
    setForm((current) => ({
      ...current,
      meal_type_ids: current.meal_type_ids.includes(id)
        ? current.meal_type_ids.filter((typeId) => typeId !== id)
        : [...current.meal_type_ids, id],
    }));
  const addIngredient = () =>
    setForm((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        { name: "", quantity: "", unit: "", preparation_note: "" },
      ],
    }));
  const updateIngredient = (index: number, changes: Partial<IngredientForm>) =>
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, itemIndex) =>
        itemIndex === index ? { ...ingredient, ...changes } : ingredient,
      ),
    }));
  const removeIngredient = (index: number) =>
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    resetCreateMeal();
    resetUpdateMeal();
    setValidationError("");
    const ingredients = form.ingredients.filter((ingredient) =>
      ingredient.name.trim(),
    );
    if (!form.name || !form.description || form.meal_type_ids.length === 0) {
      setValidationError(
        "Add a name, description, and at least one meal time.",
      );
      return;
    }
    if (
      ingredients.some(
        (ingredient) =>
          !ingredient.quantity ||
          Number(ingredient.quantity) <= 0 ||
          !ingredient.unit.trim(),
      )
    ) {
      setValidationError("Complete the quantity and unit for each ingredient.");
      return;
    }
    const values = { ...form, ingredients };
    if (initialMeal) {
      updateMeal({ id: initialMeal.id, form: values }, { onSuccess: onSaved });
    } else {
      createMeal(values, { onSuccess: onSaved });
    }
  };
  return (
    <form onSubmit={submit}>
      <label className="mb-4 grid gap-[7px] text-xs font-bold text-[#5e594f]">
        Meal name
        <input
          className="w-full resize-y rounded-[10px] border border-line bg-white p-3 text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de]"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="e.g. Tacos de papa"
        />
      </label>
      <label className="mb-4 grid gap-[7px] text-xs font-bold text-[#5e594f]">
        Description
        <textarea
          className="w-full resize-y rounded-[10px] border border-line bg-white p-3 text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de]"
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          placeholder="What makes it delicious?"
          rows={3}
        />
      </label>
      <label className="mb-4 grid gap-[7px] text-xs font-bold text-[#5e594f]">
        Recipe URL <span className="font-normal text-muted">(optional)</span>
        <input
          className="w-full resize-y rounded-[10px] border border-line bg-white p-3 text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de]"
          value={form.recipe_url}
          onChange={(event) =>
            setForm({ ...form, recipe_url: event.target.value })
          }
          placeholder="https://..."
        />
      </label>
      <fieldset className="mb-4 grid gap-[7px] text-xs font-bold text-[#5e594f]">
        <legend className="mb-[7px]">Meal time</legend>
        <div className="flex flex-wrap gap-2">
          {types.map(([name, id]) => (
            <button
              type="button"
              className={`rounded-[9px] border px-3 py-[9px] text-xs capitalize ${form.meal_type_ids.includes(id) ? "border-terracotta bg-[#fbece5] text-terracotta-dark" : "border-line bg-transparent text-muted"}`}
              key={id}
              onClick={() => toggleType(id)}
            >
              {name}
            </button>
          ))}
        </div>
      </fieldset>
      <IngredientManager
        ingredients={form.ingredients}
        units={units}
        onAdd={addIngredient}
        onChange={updateIngredient}
        onRemove={removeIngredient}
      />
      {error && <p className="text-xs text-[#b03d2f]">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={saving}>
          {saving ? "Saving…" : initialMeal ? "Update meal" : "Save meal"}
        </Button>
      </div>
    </form>
  );
}
