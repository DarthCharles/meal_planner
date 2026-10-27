import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { Navigation } from "./components/Navigation";
import { HeroBowlArt } from "./components/HeroBowlArt";
import { MenuScreen } from "./features/menu/MenuScreen";
import { MealsScreen } from "./features/meals/MealsScreen";

type View = "menu" | "meals";

function App() {
  const [view, setView] = useState<View>("menu");

  return (
    <div className="mx-auto min-h-screen max-w-[1240px] px-[15px] pb-[105px] tablet:px-6 tablet:pb-[110px] desktop:pb-[50px]">
      <AppHeader view={view} onNavigate={setView} />

      <main>
        <section className="relative flex min-h-[274px] items-start justify-between overflow-hidden rounded-[30px] bg-accent px-6 py-[31px] tablet:min-h-[240px] tablet:items-center tablet:px-12 tablet:py-[42px]">
          <div>
            <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted-foreground uppercase">
              Good morning, Carlos
            </p>
            <h2 className="mb-[13px] font-display text-[clamp(37px,5vw,62px)] leading-[.98] font-semibold tracking-[-.055em]">
              Make this week
              <br />
              <em className="text-primary not-italic">delicious.</em>
            </h2>
            <p className="mb-[1em] max-w-[350px] text-sm leading-[1.6] text-muted-foreground">
              A little structure, plenty of sabor. Your meals, your rhythm.
            </p>
          </div>
          <div
            className="absolute right-[-4px] bottom-[-8px] grid h-[210px] w-[280px] origin-bottom-right scale-[.83] place-items-center self-stretch opacity-[.72] tablet:relative tablet:right-auto tablet:bottom-auto tablet:scale-100 tablet:opacity-80 wide:opacity-100"
            aria-hidden="true"
          >
            <HeroBowlArt />
          </div>
        </section>

        {view === "menu" ? <MenuScreen /> : <MealsScreen />}
      </main>

      <Navigation view={view} onNavigate={setView} />
    </div>
  );
}

export default App;
