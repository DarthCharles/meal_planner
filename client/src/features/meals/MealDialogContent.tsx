import type { Meal } from "../../types";
import { Notice } from "../../components/Notice";
import { demoMealTypes, demoUnits } from "../../demoData";
import { useMealTypes, useUnits } from "./queries";
import { MealForm } from "./MealForm";

type MealDialogContentProps = {
  initialMeal: Meal | null;
  onClose: () => void;
  onSaved: () => void;
};

export function MealDialogContent({
  initialMeal,
  onClose,
  onSaved,
}: MealDialogContentProps) {
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
    <>
      {optionsError && <Notice>{optionsError}</Notice>}
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
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
    </>
  );
}
