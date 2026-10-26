import type { Meal } from "../../types";
import { Notice } from "../../components/Notice";
import { demoMealTypes, demoUnits } from "../../demoData";
import { useMealTypes, useUnits } from "./queries";
import { MealForm } from "./MealForm";

type MealFormModalProps = {
  initialMeal: Meal | null;
  onClose: () => void;
  onSaved: () => void;
};

export function MealFormModal({
  initialMeal,
  onClose,
  onSaved,
}: MealFormModalProps) {
  const {
    data: types,
    isPending: loadingTypes,
    isError: typesFailed,
    error: typesError,
  } = useMealTypes();
  const {
    data: units,
    isPending: loadingUnits,
    isError: unitsFailed,
    error: unitsError,
  } = useUnits();
  const loading = loadingTypes || loadingUnits;
  const optionsError =
    (typesFailed && !types) || (unitsFailed && !units)
      ? "Demo mode · connect the Rails API to use your own meals."
      : (typesError?.message ?? unitsError?.message);
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
        {optionsError && <Notice>{optionsError}</Notice>}
        {loading ? (
          <p role="status" className="text-sm text-muted">
            Loading meal options…
          </p>
        ) : (
          <MealForm
            types={types ?? demoMealTypes}
            units={units ?? demoUnits}
            initialMeal={initialMeal}
            onClose={onClose}
            onSaved={onSaved}
          />
        )}
      </section>
    </div>
  );
}
