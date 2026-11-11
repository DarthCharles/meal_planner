import { useI18n } from "../../i18n";
import { useMealDialog } from "./useMealDialog";
import { Notice } from "../../components/Notice";
import { demoMeals } from "../../demoData";
import { MealsSkeleton } from "./MealsSkeleton";
import { MealsView } from "./MealsView";
import { useMeals } from "./queries";

export function MealsScreen() {
  const { t } = useI18n();
  const { openCreateMeal, openEditMeal } = useMealDialog();
  const {
    data: meals,
    isPending: loading,
    isError,
    error: mealsError,
  } = useMeals();
  const error =
    isError && !meals
      ? t("common.demo_mode")
      : mealsError?.message;
  return (
    <>
      {error && <Notice>{error}</Notice>}
      <div className="mb-[17px] tablet:mb-5">
        <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
          {t("common.collection")}
        </p>
        <h3 className="mb-0 font-display text-[28px] font-semibold tracking-[-.04em]">
          {t("meals.screen.meal_library")}
        </h3>
      </div>
      {loading ? (
        <MealsSkeleton />
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
