import { Button } from "./components/Button";
import { useEffect, useState } from "react";
import { api } from "./api";
import type { Meal, MealForm, MealTypeOption, Menu, UnitOption } from "./types";
import { demoMeals, demoMenu } from "./demoData";
import { AppHeader } from "./components/AppHeader";
import { Navigation } from "./components/Navigation";
import { HeroBowlArt } from "./components/HeroBowlArt";
import { MenuView } from "./features/menu/MenuView";
import { MealsView } from "./features/meals/MealsView";
import { MealFormModal } from "./features/meals/MealFormModal";

type View = "menu" | "meals";

function App() {
  const [view, setView] = useState<View>("menu");
  const [menu, setMenu] = useState<Menu | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealTypes, setMealTypes] = useState<MealTypeOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getMenus(),
      api.getMeals(),
      api.getMealTypes(),
      api.getUnits(),
    ])
      .then(([menus, loadedMeals, loadedMealTypes, loadedUnits]) => {
        setMenu(menus[0] ?? null);
        setMeals(loadedMeals);
        setMealTypes(loadedMealTypes);
        setUnits(loadedUnits);
      })
      .catch(() => {
        // Keep the shell useful while the Rails API is not running locally.
        setMenu(demoMenu);
        setMeals(demoMeals);
        setMealTypes([
          ["breakfast", 1],
          ["lunch", 2],
          ["dinner", 3],
        ]);
        setUnits([
          { code: "g", name: "grams" },
          { code: "ml", name: "milliliters" },
          { code: "pieza", name: "pieces" },
          { code: "taza", name: "cups" },
          { code: "cucharada", name: "tablespoons" },
          { code: "cucharadita", name: "teaspoons" },
        ]);
        setError("Demo mode · connect the Rails API to use your own meals.");
      })
      .finally(() => setLoading(false));
  }, []);

  const generateMenu = async () => {
    setGenerating(true);
    setError("");
    try {
      setMenu(await api.generateMenu());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate a menu.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const saveMeal = async (form: MealForm) => {
    const meal = editingMeal
      ? await api.updateMeal(editingMeal.id, form)
      : await api.createMeal(form);
    setMeals((current) =>
      editingMeal
        ? current.map((item) => (item.id === meal.id ? meal : item))
        : [...current, meal],
    );
    setShowMealForm(false);
    setEditingMeal(null);
  };

  const editMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setShowMealForm(true);
  };

  const closeMealForm = () => {
    setShowMealForm(false);
    setEditingMeal(null);
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1240px] px-[15px] pb-[105px] tablet:px-6 tablet:pb-[110px] desktop:pb-[50px]">
      <AppHeader
        view={view}
        onNavigate={setView}
        onAdd={() => setShowMealForm(true)}
      />

      <main>
        {error && (
          <div className="flex items-center gap-[9px] rounded-[10px] bg-[#f7eed1] px-[13px] py-[11px] text-xs text-[#806638]">
            <span className="grid size-[17px] place-items-center rounded-full border border-current text-[11px]">
              i
            </span>
            {error}
          </div>
        )}

        <section className="relative flex min-h-[274px] items-start justify-between overflow-hidden rounded-[30px] bg-[#e8eee0] px-6 py-[31px] tablet:min-h-[240px] tablet:items-center tablet:px-12 tablet:py-[42px]">
          <div>
            <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted uppercase">
              Good morning, Carlos
            </p>
            <h2 className="mb-[13px] font-display text-[clamp(37px,5vw,62px)] leading-[.98] font-semibold tracking-[-.055em]">
              Make this week
              <br />
              <em className="text-terracotta not-italic">delicious.</em>
            </h2>
            <p className="mb-[1em] max-w-[350px] text-sm leading-[1.6] text-[#6c7563]">
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

        <div className="mt-[31px] mb-[17px] flex flex-col items-start justify-between gap-[15px] tablet:mt-[39px] tablet:mb-5 tablet:flex-row tablet:items-end tablet:gap-0">
          <div>
            <p className="mb-[5px] text-[10px] font-bold tracking-[.13em] text-muted uppercase">
              This week
            </p>
            <h3 className="mb-0 font-display text-[28px] font-semibold tracking-[-.04em]">
              {menu ? formatDateRange(menu.from, menu.to) : "Your next menu"}
            </h3>
          </div>
          <Button
            variant="primary"
            className="w-full tablet:w-auto"
            onClick={generateMenu}
            disabled={generating || loading}
          >
            <span className="text-xl leading-[12px] font-normal">
              {generating ? "…" : "+"}
            </span>
            {generating ? "Planning" : "Plan my week"}
          </Button>
        </div>

        {view === "menu" ? (
          <MenuView menu={menu} loading={loading} onGenerate={generateMenu} />
        ) : (
          <MealsView
            meals={meals}
            onAdd={() => {
              setEditingMeal(null);
              setShowMealForm(true);
            }}
            onEdit={editMeal}
          />
        )}
      </main>

      <Navigation
        view={view}
        onNavigate={setView}
        onAdd={() => setShowMealForm(true)}
      />

      {showMealForm && (
        <MealFormModal
          types={mealTypes}
          units={units}
          initialMeal={editingMeal}
          onClose={closeMealForm}
          onSave={saveMeal}
        />
      )}
    </div>
  );
}

function formatDateRange(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return `${start.toLocaleDateString("en-US", options)} — ${end.toLocaleDateString("en-US", options)}`;
}

export default App;
