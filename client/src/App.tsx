import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { Navigation } from "./components/Navigation";
import { MenuScreen } from "./features/menu/MenuScreen";
import { MealsScreen } from "./features/meals/MealsScreen";

type View = "menu" | "meals";

function App() {
  const [view, setView] = useState<View>("menu");

  return (
    <div className="mx-auto min-h-screen max-w-[1240px] px-[15px] pb-[105px] tablet:px-6 tablet:pb-[110px] desktop:pb-[50px]">
      <AppHeader view={view} onNavigate={setView} />

      <main>{view === "menu" ? <MenuScreen /> : <MealsScreen />}</main>

      <Navigation view={view} onNavigate={setView} />
    </div>
  );
}

export default App;
