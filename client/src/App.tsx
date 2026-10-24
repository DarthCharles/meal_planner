import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { Meal, MealForm, MealTypeName, MealTypeOption, Menu } from "./types";

type View = "menu" | "meals";

const mealTypeOrder: MealTypeName[] = ["breakfast", "lunch", "dinner"];
const mealTypeLabels: Record<MealTypeName, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner"
};

const demoMeals: Meal[] = [
  { id: 1, name: "Huevos a la mexicana", description: "Eggs with tomato, onion, and chile.", recipe_url: "", meal_types: ["breakfast"] },
  { id: 2, name: "Calabacitas con queso", description: "Tender squash with corn and queso fresco.", recipe_url: "", meal_types: ["lunch", "dinner"] },
  { id: 3, name: "Avena cocida", description: "Warm oats with cinnamon and seasonal fruit.", recipe_url: "", meal_types: ["breakfast", "dinner"] }
];

const demoMenu: Menu = {
  id: 1,
  from: "2025-03-03T00:00:00.000Z",
  to: "2025-03-09T23:59:59.000Z",
  days: [
    ["Monday", [demoMeals[0], demoMeals[1], demoMeals[2]]],
    ["Tuesday", [demoMeals[2], demoMeals[1], demoMeals[0]]],
    ["Wednesday", [demoMeals[0], demoMeals[1], demoMeals[2]]]
  ].map(([weekday, meals], index) => ({ id: index + 1, weekday: weekday as string, meals: meals as Meal[] }))
};

function App() {
  const [view, setView] = useState<View>("menu");
  const [menu, setMenu] = useState<Menu | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealTypes, setMealTypes] = useState<MealTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getMenus(), api.getMeals(), api.getMealTypes()])
      .then(([menus, loadedMeals, loadedMealTypes]) => {
        setMenu(menus[0] ?? null);
        setMeals(loadedMeals);
        setMealTypes(loadedMealTypes);
      })
      .catch(() => {
        // Keep the shell useful while the Rails API is not running locally.
        setMenu(demoMenu);
        setMeals(demoMeals);
        setMealTypes([["breakfast", 1], ["lunch", 2], ["dinner", 3]]);
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
      setError(err instanceof Error ? err.message : "Could not generate a menu.");
    } finally {
      setGenerating(false);
    }
  };

  const saveMeal = async (form: MealForm) => {
    const meal = editingMeal ? await api.updateMeal(editingMeal.id, form) : await api.createMeal(form);
    setMeals((current) => editingMeal ? current.map((item) => item.id === meal.id ? meal : item) : [...current, meal]);
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
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><BowlLogo /></div>
          <div>
            <p className="eyebrow">Your weekly table</p>
            <h1>comal</h1>
          </div>
        </div>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <button className={`desktop-nav-button ${view === "menu" ? "active" : ""}`} onClick={() => setView("menu")}>My menu</button>
          <button className={`desktop-nav-button ${view === "meals" ? "active" : ""}`} onClick={() => setView("meals")}>My meals</button>
          <button className="desktop-nav-button add" onClick={() => setShowMealForm(true)}>+ Add meal</button>
        </nav>
        <button className="avatar-button" aria-label="Open profile">MC</button>
      </header>

      <main className="page-content">
        {error && <div className="notice"><span>i</span>{error}</div>}

        <section className="hero">
          <div>
            <p className="eyebrow">Good morning, Carlos</p>
            <h2>Make this week<br /><em>delicious.</em></h2>
            <p className="hero-copy">A little structure, plenty of sabor. Your meals, your rhythm.</p>
          </div>
          <div className="hero-art" aria-hidden="true"><HeroBowlArt /></div>
        </section>

        <div className="content-heading">
          <div>
            <p className="eyebrow">This week</p>
            <h3>{menu ? formatDateRange(menu.from, menu.to) : "Your next menu"}</h3>
          </div>
          <button className="button button-primary" onClick={generateMenu} disabled={generating || loading}>
            <span className="button-icon">{generating ? "…" : "+"}</span>
            {generating ? "Planning" : "Plan my week"}
          </button>
        </div>

        {view === "menu" ? (
          <MenuView menu={menu} loading={loading} onGenerate={generateMenu} />
        ) : (
          <MealsView meals={meals} onAdd={() => { setEditingMeal(null); setShowMealForm(true); }} onEdit={editMeal} />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <NavButton active={view === "menu"} onClick={() => setView("menu")} icon="⌂" label="My menu" />
        <NavButton active={view === "meals"} onClick={() => setView("meals")} icon="◒" label="My meals" />
        <NavButton active={false} onClick={() => setShowMealForm(true)} icon="+" label="Add meal" accent />
      </nav>

      {showMealForm && <MealFormModal types={mealTypes} initialMeal={editingMeal} onClose={closeMealForm} onSave={saveMeal} />}
    </div>
  );
}

function MenuView({ menu, loading, onGenerate }: { menu: Menu | null; loading: boolean; onGenerate: () => void }) {
  if (loading) return <div className="loading-grid"><div className="skeleton large"></div><div className="skeleton"></div><div className="skeleton"></div></div>;
  if (!menu) {
    return <div className="empty-state"><div className="empty-icon">✦</div><h3>Your week is a blank page.</h3><p>Generate a menu and we’ll fill it with breakfast, lunch, and dinner.</p><button className="button button-primary" onClick={onGenerate}>Create my first menu</button></div>;
  }
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date()).toLowerCase();
  const orderedDays = orderDaysFromToday(menu.days, today);
  return <div className="day-grid">{orderedDays.map((day) => <DayCard day={day} featured={day.weekday.toLowerCase() === today} key={day.id} />)}</div>;
}

function DayCard({ day, featured }: { day: Menu["days"][number]; featured: boolean }) {
  return <article className={`day-card ${featured ? "featured" : ""}`}>
    <div className="day-card-header"><div><p className="eyebrow">{featured ? "Today" : `Day ${String(day.id).padStart(2, "0")}`}</p><h4>{day.weekday}</h4></div><span className="day-number">{String(day.id).padStart(2, "0")}</span></div>
    <div className="meal-list">{day.meals.map((meal, index) => <div className="meal-row" key={`${meal.id}-${index}`}><span className={`meal-dot ${mealTypeOrder[index]}`}></span><div className="meal-copy"><span className="meal-type">{mealTypeLabels[mealTypeOrder[index]]}</span><strong>{meal.name}</strong></div><span className="chevron">›</span></div>)}</div>
  </article>;
}

function orderDaysFromToday(days: Menu["days"], today: string) {
  const weekdayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const todayIndex = weekdayOrder.indexOf(today);
  return [...days].sort((left, right) => {
    const leftIndex = weekdayOrder.indexOf(left.weekday.toLowerCase());
    const rightIndex = weekdayOrder.indexOf(right.weekday.toLowerCase());
    const leftOffset = (leftIndex - todayIndex + 7) % 7;
    const rightOffset = (rightIndex - todayIndex + 7) % 7;
    return leftOffset - rightOffset;
  });
}

function MealsView({ meals, onAdd, onEdit }: { meals: Meal[]; onAdd: () => void; onEdit: (meal: Meal) => void }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => meals.filter((meal) => (filter === "all" || meal.meal_types.includes(filter)) && meal.name.toLowerCase().includes(search.toLowerCase())), [meals, filter, search]);
  return <section className="meals-section">
    <div className="meals-toolbar"><label className="search-field"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meals" /></label><button className="button button-secondary" onClick={onAdd}>+ Add meal</button></div>
    <div className="filter-row">{["all", ...mealTypeOrder].map((item) => <button key={item} className={`filter-chip ${filter === item ? "selected" : ""}`} onClick={() => setFilter(item)}>{item === "all" ? "All meals" : mealTypeLabels[item as MealTypeName]}</button>)}</div>
    <div className="meal-library">{filtered.map((meal) => <article className="library-card" key={meal.id}><div className="library-accent"></div><div><div className="tag-row">{meal.meal_types.map((type) => <span className={`tag ${type}`} key={type}>{type}</span>)}</div><h4>{meal.name}</h4><p>{meal.description}</p></div><button className="more-button" onClick={() => onEdit(meal)} aria-label={`Edit ${meal.name}`}>Edit</button></article>)}{filtered.length === 0 && <div className="empty-state compact"><h3>No meals found.</h3><p>Try another search or add something new.</p></div>}</div>
  </section>;
}

function MealFormModal({ types, initialMeal, onClose, onSave }: { types: MealTypeOption[]; initialMeal: Meal | null; onClose: () => void; onSave: (form: MealForm) => Promise<void> }) {
  const [form, setForm] = useState<MealForm>(() => ({
    name: initialMeal?.name ?? "",
    description: initialMeal?.description ?? "",
    recipe_url: initialMeal?.recipe_url ?? "",
    meal_type_ids: initialMeal ? types.filter(([name]) => initialMeal.meal_types.includes(name)).map(([, id]) => id) : []
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toggleType = (id: number) => setForm((current) => ({ ...current, meal_type_ids: current.meal_type_ids.includes(id) ? current.meal_type_ids.filter((typeId) => typeId !== id) : [...current.meal_type_ids, id] }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!form.name || !form.description || form.meal_type_ids.length === 0) { setError("Add a name, description, and at least one meal time."); return; } setSaving(true); setError(""); try { await onSave(form); } catch (err) { setError(err instanceof Error ? err.message : "Could not save this meal."); } finally { setSaving(false); } };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="meal-form-title"><div className="modal-header"><div><p className="eyebrow">{initialMeal ? "Update your library" : "Add to your library"}</p><h3 id="meal-form-title">{initialMeal ? "Edit this favorite" : "A new favorite"}</h3></div><button className="close-button" onClick={onClose} aria-label="Close">×</button></div><form onSubmit={submit}><label className="form-label">Meal name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Tacos de papa" /></label><label className="form-label">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What makes it delicious?" rows={3} /></label><label className="form-label">Recipe URL <span className="muted">(optional)</span><input value={form.recipe_url} onChange={(event) => setForm({ ...form, recipe_url: event.target.value })} placeholder="https://..." /></label><fieldset className="form-label"><legend>Meal time</legend><div className="type-select">{types.map(([name, id]) => <button type="button" className={`type-option ${form.meal_type_ids.includes(id) ? "selected" : ""}`} key={id} onClick={() => toggleType(id)}>{name}</button>)}</div></fieldset>{error && <p className="form-error">{error}</p>}<div className="form-actions"><button type="button" className="button button-ghost" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving…" : initialMeal ? "Update meal" : "Save meal"}</button></div></form></section></div>;
}

function NavButton({ active, onClick, icon, label, accent = false }: { active: boolean; onClick: () => void; icon: string; label: string; accent?: boolean }) { return <button className={`nav-button ${active ? "active" : ""} ${accent ? "nav-accent" : ""}`} onClick={onClick}><span className="nav-icon">{icon}</span><span>{label}</span></button>; }

function BowlLogo() {
  return <svg className="bowl-logo" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M22 14c-7-5 7-9 1-14M32 14c-6-5 7-9 2-14M42 14c-5-5 6-8 2-13" fill="none" stroke="#fff9f3" strokeLinecap="round" strokeWidth="3.5" />
    <path d="M12 31h40c-1 15-9 23-20 23S13 46 12 31Z" fill="#fff9f3" />
    <path d="M9 29c0-5 10-9 23-9s23 4 23 9-10 9-23 9S9 34 9 29Z" fill="#e9b258" stroke="#fff9f3" strokeWidth="3" />
    <path d="M19 28c3-3 7-4 11-1M37 27c2-2 5-2 8 0" fill="none" stroke="#708d69" strokeLinecap="round" strokeWidth="3" />
  </svg>;
}

function HeroBowlArt() {
  return <svg className="hero-bowl-art" viewBox="0 0 280 210">
    <path d="M104 47c-10-8 10-13 1-23M139 44c-9-8 10-13 2-23M176 48c-8-8 9-13 3-22" fill="none" stroke="#fff9f3" strokeLinecap="round" strokeWidth="5" opacity=".72" />
    <path d="M48 94c4 55 40 82 91 82s87-27 91-82H48Z" fill="#d5674e" />
    <path d="M57 93h164c0 29-37 48-82 48S57 122 57 93Z" fill="#fff9f3" />
    <ellipse cx="139" cy="91" rx="91" ry="34" fill="#e9b258" stroke="#fff9f3" strokeWidth="8" />
    <path d="M94 87c12-14 27-15 40-5M157 82c12-11 26-9 38 2M123 105c8-5 17-5 26 0" fill="none" stroke="#708d69" strokeLinecap="round" strokeWidth="8" />
    <circle cx="79" cy="76" r="6" fill="#c8583e" opacity=".8" />
    <circle cx="201" cy="99" r="5" fill="#c8583e" opacity=".8" />
  </svg>;
}

function formatDateRange(from: string, to: string) { const start = new Date(from); const end = new Date(to); const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }; return `${start.toLocaleDateString("en-US", options)} — ${end.toLocaleDateString("en-US", options)}`; }

export default App;
