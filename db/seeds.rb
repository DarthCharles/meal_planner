# frozen_string_literal: true

# Ensure lookup data exists. English labels, Mexican meaning: lunch = main meal, dinner = lighter evening
Date::DAYNAMES.map(&:downcase).each { |name| Weekday.find_or_create_by!(name: name) }
%w[breakfast lunch dinner].each { |desc| MealType.find_or_create_by!(description: desc) }
Unit::DEFAULTS.each { |code, name| Unit.find_or_create_by!(code: code) { |unit| unit.name = name } }

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
  meal.servings = 1
  meal.description = recipe
  meal.recipe_url ||= ""
  meal.save!
  meal.meal_types = type_descriptions.map { |desc| MealType.find_by!(description: desc) }
end

# Ingredients for meals used by the sample weekly menu.
# Rows are [ingredient_name, quantity, unit, preparation_note].
MEAL_INGREDIENTS_TO_SEED = {
  "Sándwich" => [["Pan de caja", 2, "piece", nil], ["Mayonesa", 1, "tablespoon", nil]],
  "Ensalada de atun" => [["Atún", 1, "can", "contenido escurrido", 140, "g"], ["Mayonesa", "1/2", "cup", nil], ["Cebolla", 40, "g", "picada"]],
  "Ensalada de pollo" => [["Pechuga de pollo", 150, "g", "cocida"], ["Mayonesa", 2, "teaspoon", nil], ["Lechuga", 40, "g", nil]],
  "Huevos a la mexicana" => [["Huevo", 2, "piece", nil], ["Jitomate", 1, "piece", "picado"], ["Cebolla", 0.25, "piece", "picada"], ["Chile serrano", 1, "piece", "picado"], ["Tortilla de maíz", 4, "piece", nil]],
  "Chilaquiles verdes con huevo" => [["Totopos", 150, "g", nil], ["Salsa verde", 200, "ml", nil], ["Huevo", 2, "piece", nil], ["Crema", 30, "ml", nil], ["Queso fresco", 30, "g", nil]],
  "Hot cakes de avena con plátano" => [["Avena", 80, "g", nil], ["Plátano", 1, "piece", nil], ["Huevo", 1, "piece", nil], ["Leche", 120, "ml", nil], ["Canela", 1, "teaspoon", nil]],
  "Avena cocida" => [["Avena", 80, "g", nil], ["Leche", 250, "ml", "o agua"], ["Canela", 1, "teaspoon", nil]],
  "Molletes con frijoles y panela" => [["Bolillo", 1, "piece", "partido por la mitad"], ["Frijoles refritos", 120, "g", nil], ["Queso panela", 60, "g", nil], ["Pico de gallo", 80, "g", nil]],
  "Yogurt con avena y plátano" => [["Yogurt natural", 200, "g", nil], ["Avena", 40, "g", nil], ["Plátano", 1, "piece", nil], ["Canela", 1, "teaspoon", nil]],
  "Omelette de huevo y espinaca" => [["Huevo", 2, "piece", nil], ["Espinaca", 60, "g", nil], ["Queso", 30, "g", nil]],
  "Brochetas de pollo" => [["Pechuga de pollo", 500, "g", "en cubos"], ["Pimiento", 1, "piece", nil], ["Cebolla", 0.5, "piece", nil], ["Limón", 1, "piece", nil]],
  "Wrap de pollo" => [["Pechuga de pollo", 150, "g", "cocida y rebanada"], ["Tortilla de harina", 1, "piece", nil], ["Lechuga", 40, "g", nil], ["Jitomate", 0.5, "piece", nil], ["Aguacate", 0.5, "piece", nil]],
  "Sopa de tortilla" => [["Tortilla de maíz", 4, "piece", "en tiras"], ["Jitomate", 2, "piece", nil], ["Chile pasilla", 1, "piece", nil], ["Aguacate", 0.5, "piece", nil], ["Queso", 30, "g", nil]],
  "Ensalada de garbanzo" => [["Garbanzo cocido", 200, "g", nil], ["Pepino", 0.5, "piece", nil], ["Jitomate", 1, "piece", nil], ["Cebolla", 0.25, "piece", nil], ["Limón", 1, "piece", nil]],
  "Pollo en mole" => [["Pechuga de pollo", 200, "g", nil], ["Mole", 150, "g", nil], ["Arroz", 80, "g", nil], ["Ajonjolí", 1, "tablespoon", nil]],
  "Calabacitas con queso" => [["Calabacita", 2, "piece", nil], ["Elote", 100, "g", nil], ["Jitomate", 1, "piece", nil], ["Cebolla", 0.25, "piece", nil], ["Queso", 50, "g", nil]],
  "Tostadas de pollo" => [["Pechuga de pollo", 150, "g", "deshebrada"], ["Tostada", 3, "piece", nil], ["Frijoles refritos", 90, "g", nil], ["Lechuga", 40, "g", nil], ["Crema", 30, "ml", nil]],
  "Bistec ranchero" => [["Bistec de res", 200, "g", nil], ["Jitomate", 2, "piece", nil], ["Cebolla", 0.5, "piece", nil], ["Chile serrano", 1, "piece", nil]],
  "Ropa vieja" => [["Carne de res", 250, "g", "cocida y deshebrada"], ["Jitomate", 2, "piece", nil], ["Cebolla", 0.5, "piece", nil], ["Pimiento", 1, "piece", nil]],
  "Barbacoa" => [["Carne de res", 250, "g", nil], ["Diente de ajo", 1, "piece", nil], ["Cebolla", 0.5, "piece", nil], ["Tortilla de maíz", 4, "piece", nil]],
  "Carne con chile" => [["Carne de res", 250, "g", "en cubos"], ["Chile guajillo", 2, "piece", nil], ["Jitomate", 2, "piece", nil], ["Diente de ajo", 1, "piece", nil], ["Cebolla", 0.5, "piece", nil]],
  "Caldo de queso" => [["Papa", 2, "piece", "en cubos"], ["Jitomate", 2, "piece", nil], ["Cebolla", 0.25, "piece", nil], ["Chile verde", 1, "piece", nil], ["Queso panela", 100, "g", nil]]
}.freeze

MEAL_INGREDIENTS_TO_SEED.each do |meal_name, ingredient_rows|
  meal = Meal.find_by!(name: meal_name)
  meal.meal_ingredients.destroy_all
  ingredient_rows.each_with_index do |(name, quantity, unit, preparation_note, package_quantity, package_unit), position|
    ingredient = Ingredient.find_or_create_by!(name: name)
    unit_record = Unit.find_by!(code: unit)
    meal.meal_ingredients.build(ingredient: ingredient).tap do |meal_ingredient|
      meal_ingredient.assign_attributes(quantity: MeasurementQuantity.parse(quantity), unit: unit_record,
        package_quantity: package_quantity, package_unit: package_unit && Unit.find_by!(code: package_unit),
        preparation_note: preparation_note, position: position)
      meal_ingredient.save!
    end
  end
end

# Natural buying units need no ingredient-specific factors. Packages below are
# selected demonstration sizes, not claims that every brand has the same size.
Ingredient.includes(meal_ingredients: :unit).find_each do |ingredient|
  next if ingredient.shopping_profile || ingredient.meal_ingredients.empty?

  row = ingredient.meal_ingredients.first
  attributes = if row.unit.package?
    { mode: "package", shopping_unit: row.unit.code, package_quantity: row.package_quantity, package_unit: row.package_unit.code }
  elsif row.unit.dimension == "count"
    { mode: "piece", shopping_unit: "piece" }
  else
    { mode: "bulk", shopping_unit: row.unit.canonical_code }
  end
  IngredientShoppingProfileSaveService.new.call(ingredient: ingredient, attributes: attributes)
end

mayonnaise = Ingredient.find_by!(normalized_name: "mayonesa")
mayonnaise.update!(shopping_category: "pantry")
IngredientShoppingProfileSaveService.new.call(ingredient: mayonnaise, attributes: {
  mode: "package", shopping_unit: "jar", package_quantity: 390, package_unit: "g"
})
IngredientMeasurementReferencesSaveService.new.call(ingredient: mayonnaise, references: [{
  kind: "density", quantity: 13, reference_quantity: 15,
  source: "https://www.hellmanns.com/us/en/p/real-mayonnaise.html/00048001213487",
  description: "Product label: 1 tablespoon weighs 13 g; interpreted using Comal's 15 ml tablespoon. Approximate reference for this product, not every mayonnaise.",
  approximate: true
}])
onion = Ingredient.find_by!(normalized_name: "cebolla")
onion.update!(shopping_category: "produce")
IngredientShoppingProfileSaveService.new.call(ingredient: onion, attributes: { mode: "piece", shopping_unit: "piece" })
IngredientMeasurementReferencesSaveService.new.call(ingredient: onion, references: [{
  kind: "piece_weight", quantity: 148, reference_quantity: 1,
  source: "https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables",
  description: "One medium raw onion, edible portion. Approximate shopping reference; whole sizes and peel losses vary.",
  approximate: true
}])
Ingredient.find_by!(normalized_name: "atún").update!(shopping_category: "pantry")
Ingredient.find_by!(normalized_name: "pechuga de pollo").update!(shopping_category: "meat")

# One full sample menu: 7 days, 3 meals per day (breakfast, lunch, dinner)
from = Date.current.beginning_of_week.in_time_zone
to = (from + 6.days).end_of_day
menu = Menu.find_or_create_by!(from: from, to: to)

# [weekday_name, [breakfast_name, lunch_name, dinner_name]]
FULL_MENU_MEALS = [
  ["monday",    "Huevos a la mexicana",      "Brochetas de pollo",       "Wrap de pollo"],
  ["tuesday",   "Chilaquiles verdes con huevo", "Sopa de tortilla",       "Ensalada de atun"],
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
