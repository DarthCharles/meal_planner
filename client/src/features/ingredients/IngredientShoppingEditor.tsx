import { useEffect, useId, useState } from "react";

import { Button } from "@darthcharles/greda";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { useI18n } from "../../i18n";
import type { IngredientShoppingProfile } from "../../types";
import { useEditorDraft } from "../navigation/EditorDraftContext";
import { IngredientShoppingFields } from "./IngredientShoppingFields";
import {
  useClearIngredientShoppingProfile,
  useIngredientShoppingProfile,
  useSaveIngredientShoppingProfile,
} from "./queries";
import type { ShoppingDraft } from "./shoppingProfileForm";
import { shoppingDraftToProfile, shoppingProfileToDraft } from "./shoppingProfileForm";

type Props = {
  ingredientId: number;
  disabled: boolean;
  onSavingChange: (saving: boolean) => void;
};

export function IngredientShoppingEditor({ ingredientId, disabled, onSavingChange }: Props) {
  const { t } = useI18n();
  const headingId = useId();
  const {
    data: profile,
    isFetching,
    isPending,
    error,
    refetch,
  } = useIngredientShoppingProfile(ingredientId);

  return (
    <section
      aria-labelledby={headingId}
      className="mb-6 grid min-w-0 gap-4 rounded-lg border border-border bg-muted/50 p-4 tablet:p-5"
    >
      <h3 id={headingId} className="m-0 font-display text-xl font-semibold">
        {t("ingredients.shopping.title")}
      </h3>
      {isPending && (
        <p role="status" className="m-0 text-sm">
          {t("ingredients.shopping.loading")}
        </p>
      )}
      {error && (
        <div className="grid justify-items-start gap-2 text-sm">
          <p role="alert" className="m-0 text-destructive">
            {error.message}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || isFetching}
            onClick={() => void refetch()}
          >
            {t("ingredients.shopping.retry")}
          </Button>
        </div>
      )}
      {profile !== undefined && (
        <ShoppingForm
          ingredientId={ingredientId}
          headingId={headingId}
          profile={profile}
          disabled={disabled}
          onSavingChange={onSavingChange}
        />
      )}
    </section>
  );
}

function ShoppingForm({
  ingredientId,
  headingId,
  profile,
  disabled,
  onSavingChange,
}: Props & { headingId: string; profile: IngredientShoppingProfile | null }) {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<"saved" | "removed" | null>(null);
  const methods = useForm<ShoppingDraft>({
    defaultValues: shoppingProfileToDraft(profile),
  });
  const {
    handleSubmit,
    clearErrors,
    control,
    reset,
    formState: { dirtyFields },
  } = methods;
  const how = useWatch({ control, name: "how" });
  const packageSize = useWatch({ control, name: "packageSize" });
  const hasChanges = !!(
    dirtyFields.how ||
    (how === "package" &&
      (dirtyFields.packageUnit ||
        dirtyFields.packageSize ||
        (packageSize.trim() && dirtyFields.packageMeasure))) ||
    (how !== "package" && how !== "recipe" && dirtyFields.pieceWeight)
  );

  const {
    mutate: save,
    isPending: saving,
    error: saveError,
    reset: resetSave,
  } = useSaveIngredientShoppingProfile(ingredientId);
  const {
    mutate: clear,
    isPending: clearing,
    error: clearError,
    reset: resetClear,
  } = useClearIngredientShoppingProfile(ingredientId);
  const busy = saving || clearing;
  const message = saveError?.message ?? clearError?.message;
  useEditorDraft(hasChanges);
  useEffect(() => {
    onSavingChange(busy);
    return () => onSavingChange(false);
  }, [busy, onSavingChange]);

  const resetMutationErrors = () => {
    resetSave();
    resetClear();
  };

  const submit = (draft: ShoppingDraft) => {
    if (busy || disabled || !hasChanges) return;
    const payload = shoppingDraftToProfile(draft);
    if (!payload && !profile) return;
    resetMutationErrors();

    const finish = (savedProfile: IngredientShoppingProfile | null) => {
      reset(shoppingProfileToDraft(savedProfile));
      setFeedback(savedProfile ? "saved" : "removed");
    };
    if (!payload) {
      clear(undefined, { onSuccess: () => finish(null) });
      return;
    }
    save(payload, { onSuccess: finish });
  };

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        className="grid min-w-0 gap-3"
        onSubmit={handleSubmit(submit, resetMutationErrors)}
        onChange={() => setFeedback(null)}
      >
        <IngredientShoppingFields
          headingId={headingId}
          busy={disabled || busy}
          onModeChange={() => {
            setFeedback(null);
            clearErrors();
            resetMutationErrors();
          }}
        />
        {message && (
          <p role="alert" className="m-0 text-sm text-destructive">
            {message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div role="status" className={feedback && !hasChanges ? "mr-auto text-sm" : "sr-only"}>
            {feedback &&
              !hasChanges &&
              t(
                feedback === "removed"
                  ? "ingredients.shopping.removed"
                  : "ingredients.shopping.saved",
              )}
          </div>
          <Button
            type="submit"
            variant="outline"
            className="h-auto min-h-11 whitespace-normal"
            disabled={disabled || busy || !hasChanges}
          >
            {busy ? t("common.saving") : t("ingredients.shopping.save")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
