import { useMealDialog } from "./useMealDialog";
import { Notice } from "../../components/Notice";
import { demoMeals } from "../../demoData";
import { MealsView } from "./MealsView";
import { useMeals } from "./queries";

export function MealsScreen() {
  const { openCreateMeal, openEditMeal } = useMealDialog();
  const {
    data: meals,
    isPending: loading,
    isError,
    error: mealsError,
  } = useMeals();
  const error =
    isError && !meals
      ? "Demo mode · connect the Rails API to use your own meals."
      : mealsError?.message;
  return (
    <>
      {error && <Notice>{error}</Notice>}
      <div className="mt-[31px] mb-[17px] tablet:mt-[39px] tablet:mb-5">
        <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
          Your collection
        </p>
        <h3 className="mb-0 font-display text-[28px] font-semibold tracking-[-.04em]">
          Your meal library
        </h3>
      </div>
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading meals…
        </p>
      ) : (
        <MealsView
          meals={meals ?? demoMeals}
          onAdd={openCreateMeal}
          onEdit={openEditMeal}
        />
      )}
    </>
  );
}
