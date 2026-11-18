class AddShoppingCategoriesToIngredients < ActiveRecord::Migration[8.1]
  # Snapshot of the reviewed catalog, independent of future application models.
  ASSIGNMENTS = {
    "produce" => ["Aguacate", "Ajo", "Calabacita", "Cebolla", "Champiñón", "Chile poblano",
      "Chile serrano", "Chile verde", "Cilantro", "Espinaca", "Lechuga", "Limón", "Papa",
      "Pepino", "Pimiento", "Plátano", "Tomate", "Zanahoria", "Jitomate"],
    "meat" => ["Carne adobada", "Carne de res", "Carne molida", "Pechuga de pollo", "Bistec de res"],
    "deli" => ["Chorizo", "Jamón rebanado", "Salchicha"],
    "dairy_eggs" => ["Crema", "Huevo", "Leche", "Mantequilla", "Queso", "Queso fresco",
      "Queso panela", "Queso parmesano", "Yogurth", "Yogurt natural"],
    "bakery_tortillas" => ["Masa de maíz", "Masa para pizza", "Pan para hamburguesa",
      "Pan para hot dog", "Pan pita", "Pan rebanado", "Tortilla de maíz", "Tortilla de harina",
      "Tostada", "Bolillo", "Totopos"],
    "pantry" => ["Aceite", "Arroz", "Atún", "Avena", "Caldo de res", "Canela", "Catsup",
      "Chile chipotle adobado", "Chile Colorado", "Chile pasilla", "Comino", "Elote", "Espagueti",
      "Frijoles", "Garbanzo cocido", "Mayonesa", "Mole", "Mostaza", "Orégano", "Pan molido",
      "Pasta", "Pimienta negra", "Puré de tomate", "Sal", "Salsa Bandera", "Salsa BBQ",
      "Salsa de chile fresco", "Salsa de soya", "Salsa de tomate", "Salsa verde",
      "Frijoles refritos", "Ajonjolí", "Chile guajillo", "Pico de gallo"],
    "frozen" => ["Brócoli", "Pulled pork BBQ Kowi"]
  }.freeze

  def up
    add_column :ingredients, :shopping_category, :string, null: false, default: "uncategorized"
    add_check_constraint :ingredients,
      "shopping_category IN ('produce', 'meat', 'deli', 'dairy_eggs', 'bakery_tortillas', 'pantry', 'frozen', 'uncategorized')",
      name: "ingredients_valid_shopping_category"
    ASSIGNMENTS.each do |code, names|
      normalized = names.map { |name| connection.quote(name.downcase) }.join(", ")
      execute "UPDATE ingredients SET shopping_category = #{connection.quote(code)} WHERE normalized_name IN (#{normalized})"
    end
  end

  def down
    remove_check_constraint :ingredients, name: "ingredients_valid_shopping_category"
    remove_column :ingredients, :shopping_category
  end
end
