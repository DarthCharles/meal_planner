import { useI18n } from "../i18n";
import { Fragment, useRef, useState } from "react";
import { Button, buttonVariants, Popover, PopoverContent, PopoverTrigger } from "@darthcharles/greda";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useMealDialog } from "../features/meals/useMealDialog";
import { useGenerateMenu, useMenus } from "../features/menu/queries";
import { Notice } from "./Notice";
import { BowlLogo } from "./BowlLogo";

export function AppHeader() {
  const { t, locale, setLocale } = useI18n();
  const { openCreateMeal } = useMealDialog();
  const { isPending: loadingMenus } = useMenus();
  const {
    mutate: generateMenu,
    isPending: generating,
    error: generationError,
  } = useGenerateMenu();
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsTrigger = useRef<HTMLButtonElement>(null);
  const menuLink = useRef<HTMLAnchorElement>(null);
  const addingMeal = useRef(false);
  const pendingDestination = useRef<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <header className="flex h-[70px] items-center justify-between gap-2 tablet:h-[86px]">
        <Link
          to="/"
          aria-label={t("app_header.home")}
          className="flex items-center gap-[11px] rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <div className="grid size-[39px] -rotate-6 place-items-center rounded-[12px_12px_12px_4px] bg-primary text-primary-foreground">
            <BowlLogo />
          </div>
          <div>
            <p className="hidden">{t("common.weekly_table")}</p>
            <h1 className="m-0 font-display text-[27px] font-bold tracking-[-.06em]">
              comal
            </h1>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1 px-2 text-xs tablet:gap-2 tablet:px-3"
            disabled={loadingMenus || generating}
            onClick={() => generateMenu()}
          >
            <span aria-hidden="true" className="text-xl leading-none font-normal">
              {generating ? "…" : "+"}
            </span>
            {generating ? t("app_header.planning") : t("app_header.plan_week")}
          </Button>
          <Popover open={actionsOpen} onOpenChange={setActionsOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={actionsTrigger}
                variant="outline"
                size="icon"
                className="rounded-full text-[11px]"
                aria-label={t("app_header.open_actions")}
              >
                MC
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="flex w-64 max-w-[calc(100vw-30px)] flex-col gap-1 p-1.5"
              aria-label={t("app_header.actions")}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                menuLink.current?.focus();
              }}
              onCloseAutoFocus={(event) => {
                const destination = pendingDestination.current;
                pendingDestination.current = null;
                if (destination !== null) {
                  event.preventDefault();
                  actionsTrigger.current?.focus();
                  // Leave the exiting popover's keyboard layer before showing the new screen.
                  navigate(destination, { replace: destination === location.pathname });
                } else if (addingMeal.current) {
                  event.preventDefault();
                  addingMeal.current = false;
                  // Open after the popover closes so the dialog restores focus to MC.
                  actionsTrigger.current?.focus();
                  openCreateMeal();
                }
              }}
            >
              <nav className="flex flex-col gap-1" aria-label={t("navigation.primary_navigation")}>
                {([
                  ["/", t("navigation.my_menu")],
                  ["/meals", t("navigation.my_meals")],
                  ["/ingredients", t("navigation.my_ingredients")],
                  ["/saved-menus", t("navigation.saved_menus")],
                ] as const).map(([destination, label]) => (
                  <Fragment key={destination}>
                    {destination === "/saved-menus" && <hr className="my-1 border-border" />}
                    <NavLink
                      ref={destination === "/" ? menuLink : undefined}
                      to={destination}
                      end
                      className={({ isActive }) => buttonVariants({
                        variant: isActive ? "secondary" : "ghost",
                        className: "w-full justify-start",
                      })}
                      onClick={(event) => {
                        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                        event.preventDefault();
                        pendingDestination.current = destination;
                        setActionsOpen(false);
                      }}
                    >
                      {label}
                    </NavLink>
                  </Fragment>
                ))}
              </nav>
              <hr className="my-1 border-border" />
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  addingMeal.current = true;
                  setActionsOpen(false);
                }}
              >
                {t("app_header.add_meal_action")}
              </Button>
              <hr className="my-1 border-border" />
              <div role="group" aria-label={t("app_header.language")} className="flex gap-1">
                {([["en", "English"], ["es", "Español"]] as const).map(([code, label]) => (
                  <Button
                    key={code}
                    lang={code}
                    variant={locale === code ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1"
                    aria-pressed={locale === code}
                    onClick={() => setLocale(code)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      {generationError && <Notice>{generationError.message}</Notice>}
    </>
  );
}
