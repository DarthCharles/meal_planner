import { Button } from "@darthcharles/greda";

import { Notice } from "../../components/Notice";
import { unitLabel, useI18n } from "../../i18n";
import { useShoppingList } from "./queries";
import { ShoppingListPeopleForm } from "./ShoppingListPeopleForm";
import { ShoppingReceipt } from "./ShoppingReceipt";

export function ShoppingListContent({ menuId }: { menuId: number }) {
  const { t } = useI18n();
  const { data: list, isPending, error, refetch, isFetching } = useShoppingList(menuId);
  return (
    <div className="min-w-0">
      {isPending && <p role="status">{t("shopping_list.loading")}</p>}
      {error && (
        <div className="mb-4">
          <p role="alert">{error.message}</p>
          <Button disabled={isFetching} onClick={() => void refetch()}>
            {t("common.try_again")}
          </Button>
        </div>
      )}
      {list && (
        <>
          {error && (
            <p className="mb-4 text-sm text-muted-foreground">
              {t("shopping_list.previous_calculation")}
            </p>
          )}
          <ShoppingListPeopleForm
            menuId={menuId}
            initialPeople={list.people_count}
            currentPeople={!isFetching && !error ? list.people_count : undefined}
            refreshing={isFetching}
          >
            {(controls, updateAction) => (
              <ShoppingReceipt
                key={JSON.stringify([
                  list.menu_id,
                  list.people_count,
                  list.items.map((item) => [item.ingredient_id, item.unit, item.quantity]).sort(),
                ])}
                list={list}
                controls={controls}
                updateAction={updateAction}
              />
            )}
          </ShoppingListPeopleForm>
          {!!list.meals_without_ingredients.length && (
            <Notice>
              <div>
                <p className="m-0 font-semibold">{t("shopping_list.missing")}</p>
                <ul className="mt-2 mb-0 pl-5">
                  {list.meals_without_ingredients.map((meal) => (
                    <li key={meal.id}>{meal.name}</li>
                  ))}
                </ul>
              </div>
            </Notice>
          )}
          {!!list.conversion_warnings.length && (
            <Notice>
              <div>
                <p className="m-0 font-semibold">{t("shopping_list.conversions")}</p>
                <ul className="mt-2 mb-0 pl-5">
                  {list.conversion_warnings.map((warning) => (
                    <li key={warning.ingredient_id}>
                      {warning.name}:{" "}
                      {warning.reason === "equivalence_missing"
                        ? t("shopping_list.equivalence_missing", {
                            unit: unitLabel(warning.target_unit ?? ""),
                          })
                        : t("shopping_list.shopping_profile_missing")}{" "}
                      ({warning.units.map((unit) => unitLabel(unit)).join(", ")})
                    </li>
                  ))}
                </ul>
              </div>
            </Notice>
          )}
        </>
      )}
    </div>
  );
}
