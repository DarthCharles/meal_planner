import { useEffect, useId, useRef, useState } from "react";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@darthcharles/greda";
import { Controller, useForm } from "react-hook-form";

import { useI18n } from "../../i18n";
import type { IngredientCatalogEntry, IngredientPayload, ShoppingCategory } from "../../types";
import { useEditorDraft } from "../navigation/EditorDraftContext";
import { IngredientShoppingSummary } from "./IngredientShoppingSummary";
import { useDeleteIngredient, useSaveIngredient, useShoppingCategories } from "./queries";

export function IngredientForm(props: {
  ingredient?: IngredientCatalogEntry;
  close: () => void;
  onSaved?: () => void;
}) {
  const { t } = useI18n();
  const { data: categories, isPending, error, refetch, isFetching } = useShoppingCategories();
  if (isPending) return <p role="status">{t("shopping_list.loading_categories")}</p>;
  if (!categories || error)
    return (
      <div>
        <p role="alert">{error?.message}</p>
        <Button disabled={isFetching} onClick={() => void refetch()}>
          {t("common.try_again")}
        </Button>
      </div>
    );
  return <IngredientFormContent {...props} categories={categories} />;
}

function IngredientFormContent({
  ingredient,
  close,
  onSaved = close,
  categories,
}: {
  ingredient?: IngredientCatalogEntry;
  close: () => void;
  onSaved?: () => void;
  categories: ShoppingCategory[];
}) {
  const { t } = useI18n();
  const formId = useId();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const categoryId = useId();
  const [categoryContainer, setCategoryContainer] = useState<HTMLDivElement | null>(null);
  const [editingShopping, setEditingShopping] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<IngredientPayload>({
    defaultValues: {
      name: ingredient?.name ?? "",
      shopping_category: ingredient?.shopping_category ?? "uncategorized",
    },
  });
  useEditorDraft(isDirty);
  const {
    mutate: saveIngredient,
    isPending: saving,
    error: saveError,
    reset: resetSave,
  } = useSaveIngredient();
  const {
    mutate: deleteIngredient,
    isPending: deleting,
    error: deleteError,
    reset: resetDelete,
  } = useDeleteIngredient(() => {
    if (mounted.current) onSaved();
  });
  const busy = saving || deleting;
  const fieldError = errors.name?.message ?? saveError?.message;
  const message = deleteError?.message ?? fieldError;
  return (
    <div>
      <form
        id={formId}
        className={editingShopping ? "hidden" : undefined}
        noValidate
        onSubmit={handleSubmit(
          (values) => {
            if (busy || editingShopping) return;
            resetDelete();
            saveIngredient(
              {
                id: ingredient?.id,
                values: { name: values.name.trim(), shopping_category: values.shopping_category },
              },
              { onSuccess: onSaved },
            );
          },
          () => {
            resetSave();
            resetDelete();
          },
        )}
      >
        <label className="mb-4 grid gap-2 text-xs font-bold">
          {t("ingredients.form.name")}
          <Input
            {...register("name", {
              validate: (value) => !!value.trim() || t("ingredients.form.ingredient_required"),
            })}
            disabled={busy || editingShopping}
            aria-invalid={!!fieldError}
            aria-describedby={fieldError && !deleteError ? "ingredient-form-error" : undefined}
            placeholder={t("ingredients.form.ingredient_example")}
          />
        </label>
        <div ref={setCategoryContainer} className="mb-4 grid gap-2">
          <Label htmlFor={categoryId}>{t("ingredients.form.shopping_category")}</Label>
          <Controller
            name="shopping_category"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={busy || editingShopping}
              >
                <SelectTrigger
                  type="button"
                  id={categoryId}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={categoryContainer}>
                  {[...categories]
                    .sort((a, b) => a.position - b.position)
                    .map(({ code }) => (
                      <SelectItem key={code} value={code}>
                        {t(`reference.shopping_categories.${code}`)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {ingredient && (
          <p className="mb-4 text-sm text-muted-foreground">
            {t("ingredients.form.rename_ingredient_help")}
          </p>
        )}
      </form>
      {ingredient && (
        <IngredientShoppingSummary
          ingredientId={ingredient.id}
          ingredientName={ingredient.name}
          disabled={busy}
          editing={editingShopping}
          onEditingChange={setEditingShopping}
        />
      )}
      {message && (
        <p id="ingredient-form-error" role="alert" className="mb-4 text-sm text-destructive">
          {message}
        </p>
      )}
      {!editingShopping && (
        <div className="flex flex-wrap justify-end gap-2">
          {ingredient && ingredient.meals.length === 0 && (
            <Button
              variant="ghost"
              className="mr-auto text-destructive"
              disabled={busy || editingShopping}
              onClick={() => {
                if (busy) return;
                resetSave();
                deleteIngredient(ingredient.id);
              }}
            >
              {deleting ? t("ingredients.form.deleting") : t("ingredients.form.delete_ingredient")}
            </Button>
          )}
          <Button variant="ghost" onClick={close}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId} disabled={busy || editingShopping}>
            {saving ? t("common.saving") : t("ingredients.form.save_ingredient")}
          </Button>
        </div>
      )}
    </div>
  );
}
