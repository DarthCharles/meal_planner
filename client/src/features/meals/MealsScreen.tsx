import { Button } from "@darthcharles/greda";

import { CollectionHeader } from "../../components/CollectionHeader";
import { Notice } from "../../components/Notice";
import { demoMeals } from "../../demoData";
import { useI18n } from "../../i18n";
import { MealsSkeleton } from "./MealsSkeleton";
import { MealsView } from "./MealsView";
import { useMeals } from "./queries";
import { useMealDialog } from "./useMealDialog";

export function MealsScreen() {
  const { t } = useI18n();
  const { openCreateMeal, openEditMeal, openMeal } = useMealDialog();
  const {
    data: meals,
    isPending: loading,
    isError,
    error: mealsError,
    isFetching,
    refetch,
  } = useMeals();
  const error = isError && !meals ? t("common.demo_mode") : mealsError?.message;
  return (
    <>
      {error && (
        <div className="my-3 space-y-3">
          <Notice>{error}</Notice>
          <Button
            variant="outline"
            className="min-h-11"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {t("common.try_again")}
          </Button>
        </div>
      )}
      <CollectionHeader
        titleId="meals-title"
        title={t("meals.screen.meal_library")}
        actionLabel={t("meals.screen.add_meal")}
        onAdd={openCreateMeal}
      />
      {loading ? (
        <MealsSkeleton />
      ) : (
        <MealsView
          meals={meals ?? demoMeals}
          showCount={meals !== undefined}
          onEdit={openEditMeal}
          onOpen={openMeal}
        />
      )}
    </>
  );
}
