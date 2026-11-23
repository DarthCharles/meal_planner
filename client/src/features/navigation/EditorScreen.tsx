import { useCallback, useEffect, useRef } from "react";

import { Button } from "@darthcharles/greda";
import { ArrowLeft } from "@darthcharles/greda/icons";
import { useBlocker, useLocation, useNavigate, useParams } from "react-router";

import { Notice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import { IngredientForm } from "../ingredients/IngredientForm";
import { MealDialogContent } from "../meals/MealDialogContent";
import { useIngredients, useMeal } from "../meals/queries";
import { EditorDraftContext } from "./EditorDraftContext";
import { useWorkspaceNavigation } from "./useWorkspaceNavigation";

export function EditorScreen({
  kind,
  create = false,
}: {
  kind: "meal" | "ingredient";
  create?: boolean;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { finishEditor } = useWorkspaceNavigation();
  const heading = useRef<HTMLHeadingElement>(null);
  const focusHeadingOnMount = useRef(
    kind !== "ingredient" || new URLSearchParams(location.search).get("section") !== "measurements",
  );
  const drafts = useRef(new Set<string>());
  const registerDraft = useCallback((id: string, dirty: boolean) => {
    if (dirty) drafts.current.add(id);
    else drafts.current.delete(id);
  }, []);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      drafts.current.size > 0 && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm(t("editor.discard"))) blocker.proceed();
      else blocker.reset();
    }
  }, [blocker, t]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (drafts.current.size) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);
  const saved = () => {
    drafts.current.clear();
    finishEditor();
  };
  const numericId = Number(id);
  const valid = create || (Number.isSafeInteger(numericId) && numericId > 0);
  const {
    data: meal,
    isPending: loadingMeal,
    error: mealError,
    refetch: retryMeal,
  } = useMeal(numericId, { enabled: valid && !create && kind === "meal" });
  const {
    data: ingredients,
    isPending: loadingIngredients,
    error: ingredientsError,
    refetch: retryIngredients,
  } = useIngredients({ enabled: valid && !create && kind === "ingredient" });
  const ingredient = ingredients?.find((entry) => entry.id === numericId);
  const loading = valid && !create && (kind === "meal" ? loadingMeal : loadingIngredients);
  const error = create ? null : kind === "meal" ? mealError : ingredientsError;
  const blockingError = !!error && !(kind === "meal" ? meal : ingredient);
  const missing =
    !valid || (!create && !loading && !error && !(kind === "meal" ? meal : ingredient));
  const editingMeal = kind === "meal" && !create;
  const title =
    kind === "meal"
      ? t(create ? "meals.dialog.new_favorite" : "meals.details.edit_meal")
      : t(create ? "ingredients.form.add_ingredient_title" : "ingredients.form.edit_ingredient");
  useEffect(() => {
    if (focusHeadingOnMount.current) {
      heading.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, []);
  return (
    <section role="region" aria-labelledby="editor-title" className="pb-xl pt-sm">
      <Button variant="link" className="mb-sm min-h-11 px-0" onClick={finishEditor}>
        <ArrowLeft aria-hidden="true" className="mr-xs size-4" />
        {t("editor.back")}
      </Button>
      <h2
        ref={heading}
        id="editor-title"
        tabIndex={-1}
        className={`mb-sm font-display font-semibold outline-none ${
          editingMeal
            ? "text-[2rem] leading-tight tracking-[-.04em] text-balance"
            : "text-[32px] tracking-[-.03em]"
        }`}
      >
        {title}
      </h2>
      {!create && (
        <p
          className={`mb-lg text-muted-foreground ${
            editingMeal ? "max-w-prose text-body text-pretty" : "text-sm"
          }`}
        >
          {t(kind === "meal" ? "editor.recipe_scope" : "editor.ingredient_scope")}
        </p>
      )}
      {loading && (
        <p role="status" className={editingMeal ? "text-body text-muted-foreground" : undefined}>
          {t("editor.loading")}
        </p>
      )}
      {error && (
        <div className="mb-md space-y-sm">
          <Notice>{error.message}</Notice>
          <Button
            variant="outline"
            onClick={() => void (kind === "meal" ? retryMeal() : retryIngredients())}
          >
            {t("common.try_again")}
          </Button>
        </div>
      )}
      {missing && <Notice>{t("editor.missing")}</Notice>}
      <EditorDraftContext.Provider value={registerDraft}>
        {!loading &&
          !blockingError &&
          !missing &&
          (kind === "meal" ? (
            <MealDialogContent
              initialMeal={create ? null : meal!}
              onClose={finishEditor}
              onSaved={saved}
            />
          ) : (
            <IngredientForm
              key={ingredient?.id ?? "new"}
              onCreated={(entry) => {
                drafts.current.clear();
                navigate(`/ingredients/${entry.id}/edit`, { replace: true, state: location.state });
              }}
              ingredient={create ? undefined : ingredient}
              close={finishEditor}
              onSaved={saved}
            />
          ))}
      </EditorDraftContext.Provider>
      {(loading || blockingError || missing) && (
        <Button variant="ghost" className="mt-md" onClick={finishEditor}>
          {t("common.cancel")}
        </Button>
      )}
    </section>
  );
}
