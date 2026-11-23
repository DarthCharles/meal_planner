import { Button } from "@darthcharles/greda";

import { Notice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import type { Meal } from "../../types";
import { MealDetails } from "./MealDetails";
import { useMeal } from "./queries";

export function MealDetailsContent({ id, onEdit }: { id: number; onEdit: (meal: Meal) => void }) {
  const { t } = useI18n();
  const { data: meal, isPending: loading, error, refetch, isFetching } = useMeal(id);
  return (
    <>
      {loading && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("meals.details.loading_meal")}
        </p>
      )}
      {error && (
        <div className="mb-md space-y-sm">
          <Notice>
            {t("meals.details.load_meal_error")} {error.message}
          </Notice>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            {t("meals.details.retry_meal")}
          </Button>
        </div>
      )}
      {meal && <MealDetails meal={meal} onEdit={() => onEdit(meal)} />}
    </>
  );
}
