# frozen_string_literal: true

# Ensure lookup data exists. English labels, Mexican meaning: lunch = main meal, dinner = lighter evening
Date::DAYNAMES.map(&:downcase).each { |name| Weekday.find_or_create_by!(name: name) }
%w[breakfast lunch dinner].each { |desc| MealType.find_or_create_by!(description: desc) }

# Meals to seed: [name, meal_type_descriptions, recipe]. Classified by meal time.
# A meal can have multiple types (e.g. avena at breakfast or dinner).
MEALS_TO_SEED = [
  # Breakfast (morning)
  ["Huevos a la mexicana", %w[breakfast], "Revuelve huevos con jitomate, cebolla y chile serrano. Sirve calientes con tortillas de maíz y frijoles."],
  ["Chilaquiles verdes con huevo", %w[breakfast], "Baña totopos de maíz con salsa verde caliente y acompaña con huevo, crema, queso fresco y cebolla."],
  ["Hot cakes de avena con plátano", %w[breakfast], "Licúa avena, plátano, huevo, leche y canela. Cocina porciones en un sartén y sirve con fruta."],
  ["Avena cocida", %w[breakfast dinner], "Cuece avena con leche o agua y canela. Endulza al gusto y agrega plátano, manzana o nueces."],
  ["Molletes con frijoles y panela", %w[breakfast], "Unta frijoles refritos sobre mitades de bolillo, agrega queso panela y gratina. Sirve con pico de gallo."],
  ["Yogurt con avena y plátano", %w[breakfast dinner], "Combina yogurt natural con avena, plátano en rebanadas y canela. Refrigera unos minutos antes de servir."],
  ["Omelette de huevo y espinaca", %w[breakfast], "Cocina espinaca salteada, agrega huevo batido y dobla el omelette con queso al centro."],
  ["Huevo con tortilla", %w[breakfast], "Cocina huevos revueltos y sírvelos con tortillas de maíz calientes, frijoles y salsa al gusto."],
  ["Huevo con chorizo", %w[breakfast], "Fríe chorizo desmenuzado, agrega huevo batido y cocina hasta que esté bien integrado. Sirve con tortillas."],
  ["Huevo con salchicha", %w[breakfast], "Dora salchicha en rebanadas, agrega huevo batido y cocina hasta que cuaje. Acompaña con tortillas y salsa."],
  ["Avocado toast", %w[breakfast], "Tuesta una rebanada de pan, unta aguacate machacado con limón y sal, y agrega huevo o semillas al gusto."],
  # Dinner: lighter and casual meals
  ["Quesadilla", %w[dinner], "Rellena una tortilla de maíz con queso, dóblala y cocínala en un comal hasta que el queso se derrita. Sirve con salsa."],
  ["Quesadilla pita", %w[dinner], "Rellena pan pita con queso, champiñones o verduras salteadas. Calienta en sartén hasta dorar y derretir el queso."],
  ["Sándwich", %w[dinner], "Arma el sándwich con pan, jamón o pollo, queso, lechuga, jitomate y mayonesa. Tuéstalo si lo deseas."],
  ["Pizza casera", %w[dinner], "Cubre una base de masa con salsa de jitomate, queso y tus ingredientes favoritos. Hornea hasta que la masa esté dorada."],
  ["Hot dog casero", %w[dinner], "Calienta la salchicha y colócala en un pan con jitomate, cebolla, mostaza, catsup y mayonesa."],
  ["Papas con chorizo", %w[dinner], "Cocina papas en cubos hasta dorar, agrega chorizo desmenuzado y cebolla, y mezcla hasta que todo esté bien cocido."],
  # Lunch: main or more substantial meals
  ["Brochetas de pollo", %w[lunch], "Marina cubos de pollo con limón, ajo y especias. Ensarta con pimiento y cebolla y cocina a la parrilla."],
  ["Estofado de pollo", %w[lunch], "Dora el pollo y cocina a fuego lento con papa, zanahoria, jitomate, cebolla y caldo hasta que esté suave."],
  ["Milanesa de pollo", %w[lunch], "Aplana pechugas de pollo, pásalas por huevo y pan molido y fríelas u hornéalas hasta dorar."],
  ["Pollo a la plancha con arroz blanco", %w[lunch], "Sazona y cocina la pechuga de pollo a la plancha. Sirve con arroz blanco y verduras al vapor."],
  ["Pollo con crema de champiñones", %w[lunch], "Saltea champiñones y cebolla, agrega crema y cocina el pollo en la salsa hasta que esté bien cocido."],
  ["Pollo con pimiento", %w[lunch], "Saltea tiras de pollo con pimientos de colores, cebolla, ajo y un poco de salsa de soya."],
  ["Pollo con rajas y chile", %w[lunch], "Cocina tiras de pollo con rajas de chile poblano, cebolla, elote y crema."],
  ["Pollo en crema de cilantro", %w[lunch], "Licúa cilantro, crema, ajo y caldo. Cocina la salsa y agrega pechugas de pollo doradas."],
  ["Pollo en crema de chipotle", %w[lunch], "Licúa crema con chipotle y jitomate. Cocina el pollo dorado en la salsa hasta que espese."],
  ["Pollo en mole", %w[lunch], "Cocina el pollo en mole preparado con caldo hasta que la salsa espese. Sirve con arroz y ajonjolí."],
  ["Wrap de pollo", %w[lunch dinner], "Rellena una tortilla de harina con pollo, lechuga, jitomate, aguacate y aderezo. Enrolla y corta por la mitad."],
  ["Yakimeshi con pollo", %w[lunch], "Saltea arroz cocido con pollo, huevo, zanahoria, cebollín y salsa de soya."],
  ["Ensalada de pollo", %w[lunch dinner], "Mezcla pollo cocido deshebrado con lechuga, pepino, jitomate, zanahoria y vinagreta."],
  ["Enchiladas entomatadas", %w[lunch], "Rellena tortillas con pollo o queso, báñalas con salsa de jitomate y sirve con crema, cebolla y queso."],
  ["Mole", %w[lunch], "Calienta mole con caldo hasta obtener una salsa tersa. Sirve sobre pollo cocido y acompaña con arroz."],
  ["Pasta Alfredo", %w[lunch], "Cuece la pasta y mezcla con una salsa de mantequilla, ajo, crema y queso parmesano."],
  ["Sopa de tortilla", %w[lunch dinner], "Fríe tiras de tortilla y sirve en un caldo de jitomate con chile pasilla. Agrega aguacate, queso y crema."],
  ["Taquitos dorados", %w[lunch], "Rellena tortillas con pollo o papa, enrolla y dora en sartén. Sirve con lechuga, crema, queso y salsa."],
  ["Tostadas de pollo", %w[lunch dinner], "Coloca pollo deshebrado sobre tostadas con frijoles, lechuga, crema, queso y salsa."],
  ["Chop suey de pollo", %w[lunch], "Saltea pollo con zanahoria, brócoli, col y pimiento. Agrega salsa de soya y cocina hasta integrar."],
  ["Chow mein de pollo", %w[lunch], "Cocina fideos y saltéalos con pollo, col, zanahoria, cebolla y salsa de soya."],
  # Res
  ["Barbacoa", %w[lunch], "Cocina la carne de res lentamente con ajo, cebolla, laurel y especias hasta que se deshebre. Sirve en tacos."],
  ["Bistec ranchero", %w[lunch], "Cocina bistec en una salsa de jitomate, cebolla, chile serrano y ajo."],
  ["Carne con chile", %w[lunch], "Dora cubos de res y cocínalos con chile guajillo, jitomate, ajo y cebolla hasta suavizar."],
  ["Hamburguesa", %w[lunch], "Forma una carne sazonada y cocínala a la plancha. Sirve en pan con lechuga, jitomate, cebolla y queso."],
  ["Picadillo", %w[lunch], "Cocina carne molida con papa, zanahoria, chícharos, jitomate, cebolla y especias."],
  ["Tostadas carne con papa", %w[lunch dinner], "Mezcla carne molida guisada con papa y sírvela sobre tostadas con lechuga, crema, queso y salsa."],
  ["Caldo de Albóndigas", %w[lunch dinner], "Forma albóndigas de carne con arroz y hierbabuena. Cuécelas en caldo de jitomate con papa y zanahoria."],
  ["Albóndigas entomatadas", %w[lunch], "Cocina albóndigas de carne en una salsa de jitomate, cebolla, ajo y chipotle."],
  ["Gorditas", %w[lunch], "Forma gorditas de masa, cocínalas en comal y rellénalas con frijoles, guisado, lechuga y queso."],
  ["Ropa vieja", %w[lunch], "Deshebra la carne de res cocida y guísala con jitomate, cebolla, pimiento y especias."],
  # Cerdo
  ["Pulled pork", %w[lunch], "Cocina lentamente la carne de cerdo con especias y salsa hasta que esté suave. Deshebra y sirve en pan o tortillas."],
  ["Tacos de adobada", %w[lunch], "Marina carne de cerdo con chile, achiote, ajo y especias. Cocínala y sírvela en tortillas con cebolla y cilantro."],
  # Pescado / Atún
  ["Tacos de atún con queso", %w[lunch dinner], "Mezcla atún con cebolla y jitomate, caliéntalo en tortillas y agrega queso hasta que se derrita."],
  ["Ensalada de atun", %w[lunch dinner], "Combina atún con pepino, jitomate, cebolla y limón. Sirve sobre lechuga o con galletas saladas."],
  # Vegetariano
  ["Calabacitas con queso", %w[lunch dinner], "Saltea calabacita, elote, jitomate y cebolla. Agrega queso y cocina hasta que se derrita."],
  ["Caldo de queso", %w[lunch dinner], "Hierve papa, jitomate, cebolla y chile verde en caldo. Agrega queso panela justo antes de servir."],
  ["Ensalada de garbanzo", %w[lunch dinner], "Mezcla garbanzos cocidos con pepino, jitomate, cebolla, cilantro y limón."],
  ["Espagueti con queso", %w[lunch dinner], "Cuece el espagueti y mézclalo con jitomate, ajo, crema o salsa y queso rallado."],
].freeze

MEALS_TO_SEED.each do |name, type_descriptions, recipe|
  meal = Meal.find_or_initialize_by(name: name)
  meal.description = recipe
  meal.recipe_url ||= ""
  meal.save!
  meal.meal_types = type_descriptions.map { |desc| MealType.find_by!(description: desc) }
end

# One full sample menu: 7 days, 3 meals per day (breakfast, lunch, dinner)
from = Time.zone.parse("2025-03-01 00:00:00")
to = from + 6.days
menu = Menu.find_or_create_by!(from: from, to: to)

# [weekday_name, [breakfast_name, lunch_name, dinner_name]]
FULL_MENU_MEALS = [
  ["monday",    "Huevos a la mexicana",      "Brochetas de pollo",       "Wrap de pollo"],
  ["tuesday",   "Chilaquiles verdes con huevo", "Sopa de tortilla",       "Ensalada de garbanzo"],
  ["wednesday", "Hot cakes de avena con plátano", "Pollo en mole",        "Calabacitas con queso"],
  ["thursday",  "Avena cocida",              "Bistec ranchero",          "Tostadas de pollo"],
  ["friday",    "Molletes con frijoles y panela", "Ropa vieja",           "Sopa de tortilla"],
  ["saturday",  "Yogurt con avena y plátano", "Barbacoa",                "Ensalada de pollo"],
  ["sunday",    "Omelette de huevo y espinaca", "Carne con chile",        "Caldo de queso"],
].freeze

FULL_MENU_MEALS.each do |weekday_name, breakfast_name, lunch_name, dinner_name|
  weekday = Weekday.find_by!(name: weekday_name)
  day = Day.find_or_create_by!(menu: menu, weekday: weekday)

  [[0, breakfast_name], [1, lunch_name], [2, dinner_name]].each do |position, meal_name|
    meal = Meal.find_by!(name: meal_name)
    DailyMeal.find_or_create_by!(day: day, meal: meal) do |dm|
      dm.position = position
    end
  end
end
