import { CollectionRowsSkeleton } from "../../components/CollectionRowsSkeleton";
import { useI18n } from "../../i18n";

const shimmer = "animate-shimmer bg-skeleton bg-size-[200%_100%] motion-reduce:animate-none";

export function MealsSkeleton() {
  const { t } = useI18n();
  return (
    <div role="status" aria-label={t("meals.screen.loading_meals_label")} aria-busy="true">
      <span className="sr-only">{t("meals.screen.loading_meals")}</span>
      <div aria-hidden="true">
        <div className="mb-md flex flex-col gap-sm desktop:flex-row desktop:items-center">
          <div className={`h-11 w-full rounded-xl desktop:flex-1 ${shimmer}`} />
          <div className="flex flex-wrap gap-xs desktop:max-w-[60%] desktop:shrink-0">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={`h-11 w-20 rounded-md ${shimmer}`} />
            ))}
          </div>
        </div>
        <CollectionRowsSkeleton />
      </div>
    </div>
  );
}
