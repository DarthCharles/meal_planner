require "test_helper"

class LocalizationTest < ActionDispatch::IntegrationTest
  test "negotiates regional tags and quality weights with an English fallback" do
    {
      "es-MX, en;q=0.5" => ["es", "Ingrediente no encontrado"],
      "es;q=0.3, en-US;q=0.9" => ["en", "Ingredient not found"],
      "fr, es;q=0" => ["en", "Ingredient not found"],
      "es;q=invalid" => ["en", "Ingredient not found"]
    }.each do |header, (locale, message)|
      delete "/ingredients/0", headers: { "Accept-Language" => header }, as: :json
      assert_response :not_found
      assert_equal message, response.parsed_body.fetch("errors")
      assert_equal locale, response.headers["Content-Language"]
      assert_includes response.headers["Vary"], "Accept-Language"
    end

    delete "/ingredients/0", as: :json
    assert_equal "Ingredient not found", response.parsed_body.fetch("errors")
    assert_equal :en, I18n.locale
  end

  test "Spanish validation preserves field keys and rolls back invalid ingredients" do
    headers = { "Accept-Language" => "es" }
    post "/meals", params: { name: "", description: "" }, headers: headers, as: :json
    assert_response :unprocessable_entity
    assert_equal ["no puede estar en blanco"], response.parsed_body.dig("errors", "name")
    assert_equal ["no puede estar en blanco"], response.parsed_body.dig("errors", "description")

    post "/meals", params: { name: "Sopa", description: "Caliente", preferred_days: ["lunes"] }, headers: headers, as: :json
    assert_response :unprocessable_entity
    assert_equal ["debe ser una lista de nombres de días de la semana"], response.parsed_body.dig("errors", "preferred_days")

    unit = Unit.find_or_create_by!(code: "pieza") { |record| record.name = "pieces" }
    ingredient = Ingredient.create!(name: "Localized test ingredient")
    assert_no_difference ["Meal.count", "MealIngredient.count"] do
      post "/meals", params: {
        name: "Sopa", description: "Caliente", ingredients: [
          { ingredient_id: ingredient.id, quantity: 0, unit: unit.code }
        ]
      }, headers: headers, as: :json
    end
    assert_response :unprocessable_entity
    assert_equal ["Cantidad debe ser mayor que 0"], response.parsed_body.dig("errors", "ingredients")
  end

  test "Spanish requests preserve user content and reference identifiers" do
    Weekday.find_or_create_by!(name: "monday")
    type = MealType.find_or_create_by!(description: "breakfast")
    post "/meals", params: {
      name: "My oats", description: "Con canela", meal_type_ids: [type.id], preferred_days: ["monday"]
    }, headers: { "Accept-Language" => "es" }, as: :json
    assert_response :ok
    meal = response.parsed_body.fetch("data")
    assert_equal "My oats", meal.fetch("name")
    assert_equal "Con canela", meal.fetch("description")
    assert_equal ["monday"], meal.fetch("preferred_days")
    assert_equal ["breakfast"], meal.fetch("meal_types")

    get "/meal_types", headers: { "Accept-Language" => "es" }, as: :json
    assert_includes response.parsed_body.fetch("data"), ["breakfast", type.id]
  end

  test "menu reads localize structured and legacy notices without rewriting snapshots" do
    snapshot = { "meal_name" => "Pizza", "weekday" => "monday", "preferred_days" => %w[friday saturday sunday] }
    legacy = "Tacos was scheduled on Tuesday to complete the menu; its preferred days are Friday, Saturday, Sunday."
    menu = Menu.create!(from: Time.utc(2026, 11, 9), to: Time.utc(2026, 11, 15), generation_notices: [snapshot, legacy, "Custom historical note"])
    get "/menus/#{menu.id}", headers: { "Accept-Language" => "es" }, as: :json
    assert_response :ok
    notices = response.parsed_body.dig("data", "generation_notices")
    assert_equal [
      "Se programó Pizza el lunes para completar el menú; sus días preferidos son viernes, sábado, domingo.",
      "Se programó Tacos el martes para completar el menú; sus días preferidos son viernes, sábado, domingo.",
      "Custom historical note"
    ], notices
    get "/menus/#{menu.id}", as: :json
    assert_equal legacy, response.parsed_body.dig("data", "generation_notices", 1)
    assert_equal [snapshot, legacy, "Custom historical note"], menu.reload.generation_notices
  end

  test "generation failures are translated and preserve saved menus" do
    Meal.destroy_all
    menu = Menu.create!(from: Time.utc(2026, 11, 9), to: Time.utc(2026, 11, 15))
    post "/menus/generate", headers: { "Accept-Language" => "es" }, as: :json
    assert_response :unprocessable_entity
    assert_equal "No se puede completar el menú. Agrega comidas para cada horario; cada día necesita tres comidas diferentes.", response.parsed_body.fetch("errors")
    assert Menu.exists?(menu.id)
  end
end
