import type { ReactNode } from "react";
import { useEffect, useId } from "react";

import { Button, Input } from "@darthcharles/greda";
import { RefreshCw } from "@darthcharles/greda/icons";
import { useForm } from "react-hook-form";

import { useI18n } from "../../i18n";
import { useUpdateMenuPeople } from "./queries";

export function ShoppingListPeopleForm({
  menuId,
  initialPeople,
  currentPeople,
  refreshing,
  children,
}: {
  menuId: number;
  initialPeople: number;
  currentPeople?: number;
  refreshing: boolean;
  children: (controls: ReactNode, updateAction: ReactNode) => ReactNode;
}) {
  const { t } = useI18n();
  const formId = useId();
  const inputId = useId();
  const errorId = useId();
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { people: initialPeople },
  });
  const {
    mutate: save,
    isPending,
    error,
    isSuccess,
    reset: resetMutation,
  } = useUpdateMenuPeople(menuId);
  useEffect(() => {
    if (currentPeople !== undefined && !isDirty) resetForm({ people: currentPeople });
  }, [currentPeople, isDirty, resetForm]);
  return children(
    <form
      id={formId}
      className="mt-md text-center font-sans"
      noValidate
      onSubmit={handleSubmit(({ people }) => {
        if (!isPending && !refreshing)
          save(people, { onSuccess: (menu) => resetForm({ people: menu.people_count }) });
      })}
    >
      <div className="flex flex-wrap items-end justify-center gap-sm">
        <label htmlFor={inputId} className="grid gap-xs text-sm font-semibold">
          {t("shopping_list.people_label")}
          <Input
            id={inputId}
            type="number"
            min="1"
            max={Number.MAX_SAFE_INTEGER}
            step="1"
            className="w-28 text-center"
            disabled={isPending || refreshing}
            {...register("people", {
              valueAsNumber: true,
              validate: (value) => Number.isSafeInteger(value) && value > 0,
              onChange: resetMutation,
            })}
            aria-invalid={!!errors.people || !!error}
            aria-describedby={errors.people || error ? errorId : undefined}
          />
        </label>
      </div>
      {(errors.people || error) && (
        <p id={errorId} role="alert" className="mt-xs text-sm text-destructive">
          {errors.people ? t("shopping_list.people_invalid") : error?.message}
        </p>
      )}
      {isSuccess && (
        <p aria-live="polite" className="mt-xs text-sm text-muted-foreground">
          {t("shopping_list.people_saved")}
        </p>
      )}
    </form>,
    <Button
      type="submit"
      form={formId}
      variant="secondary"
      disabled={isPending || refreshing}
      aria-label={isPending ? t("shopping_list.updating") : t("shopping_list.refresh")}
      title={t("shopping_list.refresh")}
    >
      <RefreshCw
        aria-hidden="true"
        className={`size-4 ${isPending || refreshing ? "motion-safe:animate-spin" : ""}`}
      />
      {isPending ? t("shopping_list.updating") : t("shopping_list.refresh")}
    </Button>,
  );
}
