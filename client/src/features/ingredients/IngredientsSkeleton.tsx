import { CollectionRowsSkeleton } from "../../components/CollectionRowsSkeleton";
import { useI18n } from "../../i18n";

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
        <CollectionRowsSkeleton />
      </div>
    </div>
  );
}
