import { Button } from "@darthcharles/greda";
import type { Meal } from "../../types";
import { Notice } from "../../components/Notice";
import { useMeal } from "./queries";
import { MealDetails } from "./MealDetails";

export function MealDetailsContent({ id, onEdit }: { id: number; onEdit: (meal: Meal) => void }) {
  const { data: meal, isPending: loading, error, refetch, isFetching } = useMeal(id);
  return (
    <>
      {loading && <p role="status" className="text-sm text-muted-foreground">Loading meal…</p>}
      {error && (
        <div className="mb-4 space-y-3">
          <Notice>Could not load meal. {error.message}</Notice>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>Retry meal</Button>
        </div>
      )}
      {meal && <MealDetails meal={meal} onEdit={() => onEdit(meal)} />}
    </>
  );
}
