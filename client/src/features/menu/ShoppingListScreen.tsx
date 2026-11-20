import { Button } from "@darthcharles/greda";
import { Link, useLocation, useParams } from "react-router";

import { useI18n } from "../../i18n";
import { ShoppingListContent } from "./ShoppingListContent";

export function ShoppingListScreen() {
  const { menuId } = useParams();
  const location = useLocation();
  const returnTo = location.state?.from === "/" ? "/" : "/saved-menus";
  const id = Number(menuId);
  const { t } = useI18n();
  return (
    <section aria-labelledby="shopping-list-title" className="pb-8">
      <Button asChild variant="link" className="mb-3 px-0">
        <Link to={returnTo} state={{ selectedMenuId: Number(menuId) }}>
          {t("shopping_list.back")}
        </Link>
      </Button>
      <h2 id="shopping-list-title" className="mb-4 font-display text-[32px] font-semibold">
        {t("shopping_list.title")}
      </h2>
      {Number.isSafeInteger(id) && id > 0 ? (
        <ShoppingListContent key={id} menuId={id} />
      ) : (
        <p role="alert">{t("shopping_list.invalid")}</p>
      )}
    </section>
  );
}
