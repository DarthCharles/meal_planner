import { Button } from "../../components/Button";
import { useState } from "react";
import type {
  IngredientForm,
  Meal,
  MealForm,
  MealTypeOption,
  UnitOption,
} from "../../types";
import { IngredientManager } from "./IngredientManager";

export function MealFormModal({
  types,
  units,
  initialMeal,
  onClose,
  onSave,
}: {
  types: MealTypeOption[];
  units: UnitOption[];
  initialMeal: Meal | null;
  onClose: () => void;
  onSave: (form: MealForm) => Promise<void>;
}) {
  const [form, setForm] = useState<MealForm>(() => ({
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ingredients = form.ingredients.filter((ingredient) =>
      ingredient.name.trim(),
    );
    if (!form.name || !form.description || form.meal_type_ids.length === 0) {
      setError("Add a name, description, and at least one meal time.");
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
      setError("Complete the quantity and unit for each ingredient.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, ingredients });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save this meal.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-20 grid items-end justify-items-center bg-[rgba(43,40,35,.34)] p-[15px] desktop:items-center"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="max-h-[calc(100vh-30px)] w-full max-w-[520px] overflow-y-auto rounded-[24px_24px_15px_15px] bg-paper p-[25px] shadow-[0_24px_70px_rgba(45,31,20,.25)] desktop:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-form-title"
      >
        <div className="mb-[22px] flex items-start justify-between">
          <div>
            <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted uppercase">
              {initialMeal ? "Update your library" : "Add to your library"}
            </p>
            <h3
              className="mb-0 font-display text-[27px] font-semibold tracking-[-.04em]"
              id="meal-form-title"
            >
              {initialMeal ? "Edit this favorite" : "A new favorite"}
            </h3>
          </div>
          <button
            className="size-[31px] rounded-full border-0 bg-[#f4efe7] text-[22px] leading-5 text-muted"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={submit}>
          <label className="mb-4 grid gap-[7px] text-xs font-bold text-[#5e594f]">
            Meal name
            <input
              className="w-full resize-y rounded-[10px] border border-line bg-white p-3 text-[13px] text-ink outline-none focus:border-terracotta focus:shadow-[0_0_0_3px_#f7e5de]"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
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
            Recipe URL{" "}
            <span className="font-normal text-muted">(optional)</span>
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
      </section>
    </div>
  );
}
