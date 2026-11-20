import { Button } from "@darthcharles/greda";

import { formatLocale, useI18n } from "../../i18n";
import { useMealDialog } from "../meals/useMealDialog";
import { useMenus } from "./queries";

export function IngredientMenuMeals({
  menuId,
  ingredientId,
}: {
  menuId: number;
  ingredientId: number;
}) {
  const { t } = useI18n();
  const { openMealById } = useMealDialog({ preserveParent: true });
  const { data: menus, isPending, error, refetch, isFetching } = useMenus();
  if (isPending) return <p role="status">{t("shopping_list.loading")}</p>;
  if (error)
    return (
      <div>
        <p role="alert">{error.message}</p>
        <Button disabled={isFetching} onClick={() => void refetch()}>
          {t("common.try_again")}
        </Button>
      </div>
    );
  const menu = menus?.find((item) => item.id === menuId);
  if (!menu) return <p role="alert">{t("shopping_list.menu_missing")}</p>;
  const meals = [
    ...new Map(
      menu.days
        .flatMap((day) => day.meals)
        .filter((meal) => meal.ingredients.some((row) => row.ingredient_id === ingredientId))
        .map((meal) => [meal.id, meal]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, formatLocale()));
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">{t("shopping_list.menu_meals_help")}</p>
      {meals.length ? (
        <ul className="m-0 list-none p-0">
          {meals.map((meal) => (
            <li key={meal.id}>
              <Button
                variant="link"
                className="h-auto min-h-11 max-w-full whitespace-normal break-words px-0 text-left"
                onClick={() => openMealById(meal.id, meal.name)}
              >
                {meal.name}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("shopping_list.unused_in_menu")}</p>
      )}
    </div>
  );
}
