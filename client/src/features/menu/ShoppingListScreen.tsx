import { Button } from "@darthcharles/greda";
import { Link, useParams } from "react-router";

import { Notice } from "../../components/Notice";
import { formatLocale, unitLabel, useI18n } from "../../i18n";
import { formatMenuDateRange } from "./menuDates";
import { useShoppingList } from "./queries";

export function ShoppingListScreen() {
  const { menuId } = useParams();
  const id = Number(menuId);
  const { t } = useI18n();
  const { data: list, isPending, error, refetch, isFetching } = useShoppingList(id);
  const validId = Number.isSafeInteger(id) && id > 0;
  const collator = new Intl.Collator(formatLocale(), { sensitivity: "base" });
  const number = (value: string) =>
    new Intl.NumberFormat(formatLocale(), {
      maximumFractionDigits: 3,
    }).format(Number(value));

  return (
    <section aria-labelledby="shopping-list-title" className="pb-8">
      <Button asChild variant="link" className="mb-3 px-0">
        <Link to="/saved-menus">{t("shopping_list.back")}</Link>
      </Button>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="shopping-list-title" className="m-0 font-display text-[32px] font-semibold">
          {t("shopping_list.title")}
        </h2>
        {validId && (
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            {t("shopping_list.refresh")}
          </Button>
        )}
      </div>
      {!validId && <p role="alert">{t("shopping_list.invalid")}</p>}
      {validId && isPending && <p role="status">{t("shopping_list.loading")}</p>}
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
          <p className="mb-1 font-semibold">{formatMenuDateRange(list)}</p>
          <p className="mb-2">{t("shopping_list.people", { count: list.people_count })}</p>
          <p className="mb-5 text-sm text-muted-foreground">{t("shopping_list.live")}</p>
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
          {!list.items.length && <p>{t("shopping_list.empty")}</p>}
          <div className="grid min-w-0 gap-4 tablet:grid-cols-2">
            {[...list.categories]
              .sort((a, b) => a.position - b.position)
              .map(({ code }) => {
                const items = list.items
                  .filter((item) => item.shopping_category === code)
                  .sort(
                    (a, b) =>
                      collator.compare(a.name, b.name) ||
                      a.ingredient_id - b.ingredient_id ||
                      collator.compare(a.unit, b.unit),
                  );
                if (!items.length) return null;
                return (
                  <section
                    key={code}
                    aria-labelledby={`category-${code}`}
                    className="min-w-0 rounded-[20px] border border-border bg-card p-5"
                  >
                    <h3 id={`category-${code}`} className="mb-3 font-display text-xl font-semibold">
                      {t(`reference.shopping_categories.${code}`)}
                    </h3>
                    <ul className="m-0 list-none divide-y divide-border p-0">
                      {items.map((item) => (
                        <li key={`${item.ingredient_id}-${item.unit}`} className="py-3">
                          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                            <span className="min-w-0 break-words font-semibold">{item.name}</span>
                            <span>
                              {number(item.quantity)} {unitLabel(item.unit, Number(item.quantity))}
                            </span>
                          </div>
                          {item.required_quantity && (
                            <p className="mt-1 mb-0 text-sm text-muted-foreground">
                              {t("shopping_list.required", {
                                quantity: number(item.required_quantity),
                                unit: unitLabel(item.unit, Number(item.required_quantity)),
                              })}
                            </p>
                          )}
                          {item.approximate && (
                            <p className="mt-1 mb-0 text-sm text-muted-foreground">
                              {t("shopping_list.approximate")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
          </div>
        </>
      )}
    </section>
  );
}
