import { Button } from "@darthcharles/greda";
import { Link } from "react-router";

import { useDialog } from "../../components/dialog/useDialog";
import { Notice } from "../../components/Notice";
import { useI18n } from "../../i18n";
import type { Menu } from "../../types";
import { formatMenuDateRange } from "./menuDates";
import { useGenerateMenu } from "./queries";

export function NextWeekPlan({
  week,
  savedMenu,
  disabled,
}: {
  week: Pick<Menu, "from" | "to">;
  savedMenu: Menu | undefined;
  disabled: boolean;
}) {
  const { t } = useI18n();
  const { openDialog } = useDialog();
  const { mutate: generateMenu, isPending: generating, error } = useGenerateMenu();
  const planLabel = savedMenu ? "menu.next_week.regenerate" : "menu.next_week.plan";

  function confirmReplacement(button: HTMLButtonElement) {
    openDialog({
      title: () => t("menu.next_week.replace_title"),
      returnFocus: button,
      content: ({ close }) => (
        <>
          <p className="mt-0 text-body">
            {t("menu.next_week.replace_help", { dates: formatMenuDateRange(week) })}
          </p>
          <div className="mt-lg flex flex-wrap justify-end gap-xs">
            <Button variant="outline" className="min-h-11" onClick={close}>
              {t("common.cancel")}
            </Button>
            <Button
              className="min-h-11"
              onClick={() => {
                close();
                generateMenu(week.from);
              }}
            >
              {t("menu.next_week.replace")}
            </Button>
          </div>
        </>
      ),
    });
  }

  return (
    <section
      aria-labelledby="next-week-title"
      className="grid gap-sm rounded-[20px] bg-card p-md tablet:grid-cols-[minmax(0,1fr)_auto] tablet:items-center tablet:p-lg"
    >
      <div>
        <h2 id="next-week-title" className="m-0 font-display text-[26px] font-semibold">
          {t("menu.next_week.title")}
        </h2>
        <p className="mt-2xs mb-0 text-caption text-muted-foreground">
          {formatMenuDateRange(week, false)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-xs">
        {savedMenu && (
          <Button asChild className="h-auto min-h-11 grow whitespace-normal">
            <Link to="/saved-menus" state={{ selectedMenuId: savedMenu.id }}>
              {t("menu.next_week.view")}
            </Link>
          </Button>
        )}
        <Button
          variant={savedMenu ? "outline" : "default"}
          className="h-auto min-h-11 grow whitespace-normal"
          disabled={disabled || generating}
          onClick={(event) => {
            if (savedMenu) confirmReplacement(event.currentTarget);
            else generateMenu(week.from);
          }}
        >
          {t(generating ? "menu.next_week.planning" : planLabel)}
        </Button>
      </div>
      {error && (
        <div className="tablet:col-span-2">
          <Notice>{error.message}</Notice>
        </div>
      )}
    </section>
  );
}
