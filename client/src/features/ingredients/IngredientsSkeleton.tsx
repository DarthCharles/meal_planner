import { useI18n } from "../../i18n";
const shimmer = "animate-shimmer bg-skeleton bg-size-[200%_100%] motion-reduce:animate-none";

export function IngredientsSkeleton() {
  const { t } = useI18n();
  return (
    <div
      role="status"
      aria-label={t("ingredients.screen.loading_ingredients_label")}
      aria-busy="true"
    >
      <span className="sr-only">{t("ingredients.screen.loading_ingredients")}</span>
      <div aria-hidden="true">
        <div className={`mb-sm h-4 w-28 rounded ${shimmer}`} />
        <div className="grid grid-cols-1 gap-sm tablet:grid-cols-2 wide:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="min-w-0 rounded-xl border border-border bg-card px-md py-md">
              <div className="flex items-center justify-between gap-sm">
                <div className={`h-6 w-3/4 min-w-0 rounded ${shimmer}`} />
                <div className={`h-8 w-12 shrink-0 rounded-md ${shimmer}`} />
              </div>
              <div className={`mt-xs h-6 w-28 max-w-full rounded ${shimmer}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
