import { Badge, Button } from "@darthcharles/greda";

import { formatLocale, unitLabel, useI18n } from "../../i18n";
import { IngredientShoppingEditor } from "./IngredientShoppingEditor";
import { useIngredientShoppingProfile } from "./queries";

export function IngredientShoppingSummary({
  ingredientId,
  ingredientName,
  disabled,
  editing,
  onEditingChange,
}: {
  ingredientId: number;
  ingredientName: string;
  disabled: boolean;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const { t } = useI18n();
  const {
    data: profile,
    isPending,
    isFetching,
    error,
    refetch,
  } = useIngredientShoppingProfile(ingredientId);
  const number = new Intl.NumberFormat(formatLocale(), { maximumFractionDigits: 6 });
  return (
    <section
      aria-label={t("ingredients.shopping.title")}
      className="mb-5 flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-background p-4"
    >
      <h3 className="m-0 font-display text-xl font-semibold">{t("ingredients.shopping.title")}</h3>
      {editing ? (
        <IngredientShoppingEditor
          ingredientId={ingredientId}
          ingredientName={ingredientName}
          profile={profile ?? null}
          onDone={() => onEditingChange(false)}
        />
      ) : (
        <>
          {isPending && (
            <p role="status" className="m-0 text-sm text-muted-foreground">
              {t("ingredients.shopping.loading")}
            </p>
          )}
          {isFetching && profile && (
            <p role="status" className="m-0 text-xs text-muted-foreground">
              {t("ingredients.shopping.refreshing")}
            </p>
          )}
          {error && (
            <div className="flex flex-col gap-2">
              <p role="alert" className="m-0 text-sm text-destructive">
                {t("ingredients.shopping.load_error")} {error.message}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                {t("ingredients.shopping.retry")}
              </Button>
            </div>
          )}
          {!isPending && !error && !profile && (
            <div className="flex flex-col gap-2">
              <p className="m-0 text-sm font-semibold">
                {t("ingredients.shopping.not_configured")}
              </p>
              <p className="m-0 text-sm leading-relaxed text-muted-foreground">
                {t("ingredients.shopping.not_configured_help")}
              </p>
            </div>
          )}
          {profile && (
            <div className="flex min-w-0 flex-col gap-3 text-sm leading-relaxed">
              <dl className="m-0 flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">{t("ingredients.shopping.buy_by")}</dt>
                <dd className="m-0 break-words font-semibold">
                  {unitLabel(profile.shopping_unit)}
                </dd>
              </dl>
              {profile.shopping_unit === "pieza" &&
                profile.base_unit === "pieza" &&
                !profile.equivalences.some((entry) => entry.unit === "g") && (
                  <p className="m-0 text-muted-foreground">
                    {t("ingredients.shopping.unknown_piece_weight")}
                  </p>
                )}
              {!!profile.equivalences.length && (
                <ul
                  aria-label={t("ingredients.shopping.amounts")}
                  className="m-0 flex list-none flex-col gap-3 p-0"
                >
                  {profile.equivalences.map((entry) => (
                    <li
                      key={entry.unit}
                      className="min-w-0 break-words border-t border-border pt-3"
                    >
                      <p className="m-0 font-semibold">
                        {t(
                          entry.unit === "pieza" && profile.base_unit === "g"
                            ? "ingredients.shopping.piece_amount"
                            : "ingredients.shopping.amount",
                          {
                            unit: unitLabel(entry.unit, 1),
                            quantity:
                              Number.isFinite(Number(entry.quantity)) && Number(entry.quantity) > 0
                                ? number.format(Number(entry.quantity))
                                : t("ingredients.shopping.unavailable_amount"),
                            base: unitLabel(profile.base_unit, Number(entry.quantity)),
                          },
                        )}
                      </p>
                      {entry.approximate && (
                        <Badge variant="secondary" className="mt-2">
                          {t("ingredients.shopping.estimated")}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {!isPending && !error && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="max-w-full self-start whitespace-normal"
              disabled={disabled || isFetching}
              onClick={() => onEditingChange(true)}
            >
              {profile ? t("ingredients.shopping.edit") : t("ingredients.shopping.set_up")}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
