import { useI18n } from "./i18n";
import { Link, Outlet, Route, Routes } from "react-router";
import { Button } from "@darthcharles/greda";
import { AppHeader } from "./components/AppHeader";
import { Navigation } from "./components/Navigation";
import { MenuScreen } from "./features/menu/MenuScreen";
import { MealsScreen } from "./features/meals/MealsScreen";
import { SavedMenusScreen } from "./features/menu/SavedMenusScreen";
import { IngredientsScreen } from "./features/ingredients/IngredientsScreen";

function PageLayout() {
  return <div className="pt-3"><Outlet /></div>;
}

function App() {
  const { t } = useI18n();
  return (
    <div className="mx-auto min-h-screen max-w-[1240px] px-[15px] pb-[105px] tablet:px-6 tablet:pb-[110px] desktop:pb-[50px]">
      <AppHeader />

      <main>
        <Routes>
          <Route path="/" element={<MenuScreen />} />
          <Route element={<PageLayout />}>
            <Route path="/meals" element={<MealsScreen />} />
            <Route path="/ingredients" element={<IngredientsScreen />} />
            <Route path="/saved-menus" element={<SavedMenusScreen />} />
            <Route path="*" element={
              <section className="pb-8">
                <h2 className="mb-3 font-display text-[32px] font-semibold">{t("app.not_found.title")}</h2>
                <p className="mb-4 text-sm text-muted-foreground">{t("app.not_found.help")}</p>
                <Button asChild><Link to="/">{t("app.not_found.go_to_menu")}</Link></Button>
              </section>
            } />
          </Route>
        </Routes>
      </main>

      <Navigation />
    </div>
  );
}

export default App;
