import { useI18n } from "../../i18n";
const shimmer = "animate-shimmer bg-skeleton bg-size-[200%_100%] motion-reduce:animate-none";

export function MealsSkeleton() {
  const { t } = useI18n();
  return (
    <div role="status" aria-label={t("meals.screen.loading_meals_label")} aria-busy="true">
      <span className="sr-only">{t("meals.screen.loading_meals")}</span>
      <div aria-hidden="true">
        <div className="mb-4 flex flex-col gap-3 desktop:flex-row desktop:items-center">
          <div className={`h-11 w-full rounded-xl desktop:flex-1 ${shimmer}`} />
          <div className="flex flex-wrap gap-2 desktop:max-w-[60%] desktop:shrink-0">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={`h-11 w-20 rounded-full ${shimmer}`} />
            ))}
          </div>
        </div>
        <div className={`mb-3 h-4 w-28 rounded ${shimmer}`} />
        <div className="grid grid-cols-1 gap-[14px] tablet:grid-cols-2 wide:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="min-h-[143px] rounded-[17px] border border-border bg-card pt-5 pr-[18px] pb-[18px] pl-[23px]"
            >
              <div className="flex items-center justify-between">
                <div className={`h-6 w-16 rounded-[5px] ${shimmer}`} />
                <div className={`h-8 w-10 rounded-md ${shimmer}`} />
              </div>
              <div className={`mt-3 mb-2 h-6 w-3/4 rounded ${shimmer}`} />
              <div className={`mb-1.5 h-4 w-full rounded ${shimmer}`} />
              <div className={`h-4 w-2/3 rounded ${shimmer}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
