import { useLayoutEffect, useRef } from "react";

import { Button } from "@darthcharles/greda";
import { Link, Outlet, Route, Routes, useLocation } from "react-router";

import { AppHeader } from "./components/AppHeader";
import { Navigation } from "./components/Navigation";
import { IngredientsScreen } from "./features/ingredients/IngredientsScreen";
import { MealsScreen } from "./features/meals/MealsScreen";
import { MenuScreen } from "./features/menu/MenuScreen";
import { ShoppingListScreen } from "./features/menu/ShoppingListScreen";
import { SavedMenusScreen } from "./features/menu/SavedMenusScreen";
import { useI18n } from "./i18n";
import { EditorScreen } from "./features/navigation/EditorScreen";
import { PreviewController } from "./features/navigation/PreviewController";
import { editorBackground } from "./features/navigation/useWorkspaceNavigation";

function PageLayout() {
  return (
    <div className="pt-3">
      <Outlet />
    </div>
  );
}

function App() {
  const { t } = useI18n();
  const location = useLocation();
  const background = editorBackground(location);
  const previousEditor = useRef<{
    scrollY: number;
    opener: HTMLElement | null;
    originKey: string;
  }>();
  useLayoutEffect(() => {
    if (background) {
      if (!previousEditor.current)
        previousEditor.current = {
          scrollY: location.state?.scrollY ?? window.scrollY,
          originKey: background.key,
          opener: document.querySelector<HTMLElement>(
            `[data-editor-return="${location.state?.returnFocusKey}"]`,
          ),
        };
    } else if (previousEditor.current) {
      const { scrollY, opener, originKey } = previousEditor.current;
      previousEditor.current = undefined;
      window.scrollTo(0, location.key === originKey ? scrollY : 0);
      if (location.key === originKey && opener?.isConnected) opener.focus({ preventScroll: true });
    }
  }, [background, location]);
  return (
    <div className="mx-auto min-h-screen max-w-[1240px] px-[15px] pb-[105px] tablet:px-6 tablet:pb-[110px] desktop:pb-[50px]">
      <AppHeader />

      <main>
        <div hidden={!!background}>
          <Routes location={background ?? location}>
            <Route path="/" element={<MenuScreen />} />
            <Route element={<PageLayout />}>
              <Route path="/meals" element={<MealsScreen />} />
              <Route path="/ingredients" element={<IngredientsScreen />} />
              <Route path="/menus/:menuId/shopping-list" element={<ShoppingListScreen />} />
              <Route path="/saved-menus" element={<SavedMenusScreen />} />
              <Route
                path="/meals/new"
                element={<EditorScreen key="new-meal" kind="meal" create />}
              />
              <Route
                path="/meals/:id/edit"
                element={<EditorScreen key={location.pathname} kind="meal" />}
              />
              <Route
                path="/ingredients/new"
                element={<EditorScreen key="new-ingredient" kind="ingredient" create />}
              />
              <Route
                path="/ingredients/:id/edit"
                element={<EditorScreen key={location.pathname} kind="ingredient" />}
              />
              <Route
                path="*"
                element={
                  <section className="pb-8">
                    <h2 className="mb-3 font-display text-[32px] font-semibold">
                      {t("app.not_found.title")}
                    </h2>
                    <p className="mb-4 text-sm text-muted-foreground">{t("app.not_found.help")}</p>
                    <Button asChild>
                      <Link to="/">{t("app.not_found.go_to_menu")}</Link>
                    </Button>
                  </section>
                }
              />
            </Route>
          </Routes>
        </div>
        {background && (
          <Routes>
            <Route path="/meals/new" element={<EditorScreen key="new-meal" kind="meal" create />} />
            <Route
              path="/meals/:id/edit"
              element={<EditorScreen key={location.pathname} kind="meal" />}
            />
            <Route
              path="/ingredients/new"
              element={<EditorScreen key="new-ingredient" kind="ingredient" create />}
            />
            <Route
              path="/ingredients/:id/edit"
              element={<EditorScreen key={location.pathname} kind="ingredient" />}
            />
          </Routes>
        )}
      </main>

      <Navigation />
      <PreviewController />
    </div>
  );
}

export default App;
