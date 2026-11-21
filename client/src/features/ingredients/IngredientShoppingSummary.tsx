import { useState } from "react";

import { Button } from "@darthcharles/greda";

import { unitLabel, useI18n } from "../../i18n";
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
  const [saved, setSaved] = useState(false);
  const {
    data: profile,
    isPending,
    isFetching,
    error,
    refetch,
  } = useIngredientShoppingProfile(ingredientId);
  return (
    <section
      aria-label={t("ingredients.shopping.title")}
      className="mb-6 grid min-w-0 gap-4 border-t border-border pt-6"
    >
      <h3 className="m-0 font-display text-xl font-semibold">{t("ingredients.shopping.title")}</h3>
      {isPending && <p role="status">{t("ingredients.shopping.loading")}</p>}
      {error && (
        <div>
          <p role="alert">{error.message}</p>
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
          onDone={() => {
            onEditingChange(false);
          }}
          onSaved={() => setSaved(true)}
        />
      ) : (
        <>
          {profile === null && (
            <p className="m-0 text-sm text-muted-foreground">
              {t("ingredients.shopping.not_configured")}
            </p>
          )}
          {profile && (
            <p className="m-0 text-sm">
              {unitLabel(profile.shopping_unit)}
              {profile.mode === "package" && (
                <>
                  {" "}
                  ·{" "}
                  {t("ingredients.shopping.amount", {
                    unit: unitLabel(profile.shopping_unit, 1),
                    quantity: profile.package_quantity ?? "",
                    base: unitLabel(profile.package_unit ?? "", Number(profile.package_quantity)),
                  })}
                </>
              )}
            </p>
          )}
          {profile !== undefined && (
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 justify-self-start whitespace-normal"
              disabled={disabled}
              onClick={() => {
                setSaved(false);
                onEditingChange(true);
              }}
            >
              {t(profile ? "ingredients.shopping.edit" : "ingredients.shopping.set_up")}
            </Button>
          )}
        </>
      )}
      {saved && (
        <p role="status" className="m-0 text-sm">
          {t("configuration.presentation_saved")}
        </p>
      )}
    </section>
  );
}
