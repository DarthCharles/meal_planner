import { Button } from "@darthcharles/greda";
import { FormProvider, useForm } from "react-hook-form";

import { useI18n } from "../../i18n";
import type { IngredientShoppingProfile, UnitOption } from "../../types";
import { useUnits } from "../meals/queries";
import { useEditorDraft } from "../navigation/EditorDraftContext";
import { IngredientShoppingFields } from "./IngredientShoppingFields";
import { useClearIngredientShoppingProfile, useSaveIngredientShoppingProfile } from "./queries";
import type { ShoppingDraft } from "./shoppingProfileForm";
import { shoppingDraftToProfile, shoppingProfileToDraft } from "./shoppingProfileForm";

type Props = {
  ingredientId: number;
  ingredientName: string;
  profile: IngredientShoppingProfile | null;
  onDone: () => void;
  onSaved: () => void;
};

export function IngredientShoppingEditor(props: Props) {
  const { t } = useI18n();
  const { data: units, isPending, error, refetch, isFetching } = useUnits();
  if (isPending)
    return (
      <p role="status" className="m-0 text-sm">
        {t("ingredients.shopping.loading")}
      </p>
    );
  if (!units)
    return (
      <div className="flex flex-col gap-3">
        <p role="alert" className="m-0 text-sm">
          {error?.message}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {t("ingredients.shopping.retry")}
        </Button>
        <Button type="button" variant="ghost" onClick={props.onDone}>
          {t("ingredients.shopping.cancel")}
        </Button>
      </div>
    );
  return (
    <>
      {error && (
        <div>
          <p role="alert">{error.message}</p>
          <Button
            type="button"
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {t("common.try_again")}
          </Button>
        </div>
      )}
      <ShoppingForm {...props} units={units} />
    </>
  );
}

function ShoppingForm({
  ingredientId,
  ingredientName,
  profile,
  onDone,
  onSaved,
  units,
}: Props & { units: UnitOption[] }) {
  const { t } = useI18n();
  const methods = useForm<ShoppingDraft>({ defaultValues: shoppingProfileToDraft(profile) });
  useEditorDraft(methods.formState.isDirty);
  const {
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = methods;
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
  const message =
    errors.root?.message ??
    errors.packageUnit?.message ??
    errors.packageSize?.message ??
    saveError?.message ??
    clearError?.message;

  const resetMutationErrors = () => {
    resetSave();
    resetClear();
  };
  const submit = (draft: ShoppingDraft) => {
    if (busy) return;
    resetClear();
    save(shoppingDraftToProfile(draft), {
      onSuccess: () => {
        methods.reset(draft);
        onSaved();
        onDone();
      },
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={handleSubmit(submit, resetMutationErrors)}
      >
        <IngredientShoppingFields
          ingredientName={ingredientName}
          units={units}
          busy={busy}
          onModeChange={() => {
            clearErrors();
            resetMutationErrors();
          }}
        />
        {message && (
          <p role="alert" id="shopping-setup-error" className="m-0 text-sm text-destructive">
            {message}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {profile && (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-destructive"
              disabled={busy}
              onClick={() => {
                resetSave();
                clear(undefined, {
                  onSuccess: () => {
                    methods.reset(shoppingProfileToDraft(null));
                    onSaved();
                    onDone();
                  },
                });
              }}
            >
              {clearing ? t("ingredients.shopping.clearing") : t("ingredients.shopping.clear")}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (!methods.formState.isDirty || window.confirm(t("measurements.confirm_cancel")))
                onDone();
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={busy}>
            {saving ? t("common.saving") : t("ingredients.shopping.save")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
