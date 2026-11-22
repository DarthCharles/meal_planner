import { useEffect, useRef, useState } from "react";

import { Button } from "@darthcharles/greda";

import { formatLocale, unitLabel, useI18n } from "../../i18n";
import { IngredientShoppingEditor } from "./IngredientShoppingEditor";
import { useIngredientShoppingProfile } from "./queries";
import { shoppingListResult } from "./shoppingPresentation";

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
  const number = new Intl.NumberFormat(formatLocale(), {
    maximumFractionDigits: 6,
  });
  const [feedback, setFeedback] = useState<"saved" | "removed" | null>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(editing);
  const {
    data: profile,
    isPending,
    isFetching,
    error,
    refetch,
  } = useIngredientShoppingProfile(ingredientId);

  useEffect(() => {
    if (wasEditing.current && !editing) editButton.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  return (
    <section
      aria-label={t("ingredients.shopping.title")}
      className="mb-6 grid min-w-0 gap-5 border-t border-border pt-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="m-0 font-display text-xl font-semibold">
            {t("ingredients.shopping.title")}
          </h3>
          {editing && (
            <p className="m-0 text-sm text-muted-foreground">
              {t("ingredients.shopping.introduction")}
            </p>
          )}
        </div>
        {!editing && profile !== undefined && (
          <Button
            ref={editButton}
            type="button"
            variant="outline"
            className="h-auto min-h-11 whitespace-normal text-left"
            disabled={disabled}
            onClick={() => {
              setFeedback(null);
              onEditingChange(true);
            }}
          >
            {t(profile ? "ingredients.shopping.edit" : "ingredients.shopping.set_up")}
          </Button>
        )}
      </div>
      {isPending && (
        <p role="status" className="m-0 text-sm">
          {t("ingredients.shopping.loading")}
        </p>
      )}
      {error && (
        <div className="grid justify-items-start gap-2">
          <p role="alert" className="m-0 text-sm text-destructive">
            {error.message}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {t("ingredients.shopping.retry")}
          </Button>
        </div>
      )}
      {editing && profile !== undefined ? (
        <IngredientShoppingEditor
          ingredientId={ingredientId}
          ingredientName={ingredientName}
          profile={profile}
          onDone={() => onEditingChange(false)}
          onSaved={setFeedback}
        />
      ) : (
        <>
          {profile === null && (
            <div className="grid gap-1 text-sm">
              <p className="m-0 font-medium">{t("ingredients.shopping.not_configured")}</p>
              <p className="m-0 max-w-prose leading-relaxed text-muted-foreground">
                {t("ingredients.shopping.not_configured_help")}
              </p>
            </div>
          )}
          {profile && (
            <div className="grid gap-5 text-sm tablet:grid-cols-2">
              <div className="grid content-start gap-2">
                <p className="m-0 font-medium">
                  {profile.mode === "piece"
                    ? t("ingredients.shopping.piece_summary")
                    : profile.mode === "package"
                      ? t("ingredients.shopping.package_summary", {
                          unit: unitLabel(profile.shopping_unit),
                        })
                      : t("ingredients.shopping.bulk_summary", {
                          measure: t(
                            ["ml", "l"].includes(profile.shopping_unit)
                              ? "ingredients.shopping.volume"
                              : "ingredients.shopping.weight",
                          ).toLocaleLowerCase(formatLocale()),
                        })}
                </p>
                {profile.mode === "package" && profile.package_quantity && profile.package_unit && (
                  <p className="m-0 text-muted-foreground">
                    {t("ingredients.shopping.amount", {
                      unit: unitLabel(profile.shopping_unit, 1),
                      quantity: number.format(Number(profile.package_quantity)),
                      base: unitLabel(profile.package_unit, Number(profile.package_quantity)),
                    })}
                  </p>
                )}
                {profile.mode !== "package" && profile.piece_weight && (
                  <p className="m-0 text-muted-foreground">
                    {t("ingredients.shopping.piece_weight_summary", {
                      count: number.format(Number(profile.piece_weight.reference_quantity)),
                      unit: unitLabel("piece", Number(profile.piece_weight.reference_quantity)),
                      grams: number.format(Number(profile.piece_weight.quantity)),
                    })}
                  </p>
                )}
              </div>
              <div className="grid content-start gap-1 leading-relaxed">
                <p className="m-0 font-medium">{t("ingredients.shopping.list_result")}</p>
                <p className="m-0 text-muted-foreground">
                  {shoppingListResult(profile.mode, profile.shopping_unit, t)}
                </p>
              </div>
            </div>
          )}
        </>
      )}
      {feedback && (
        <p role="status" className="m-0 text-sm">
          {t(
            feedback === "removed"
              ? "ingredients.shopping.removed"
              : "configuration.presentation_saved",
          )}
        </p>
      )}
    </section>
  );
}
