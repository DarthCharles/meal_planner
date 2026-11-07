require "test_helper"

class MealsControllerTest < ActionDispatch::IntegrationTest
  setup do
    Meal::WEEKDAY_NAMES.each { |name| Weekday.find_or_create_by!(name: name) }
  end

  test "creates preferences and returns them in weekday order" do
    post "/meals", params: { name: "Pizza", description: "Cheesy", preferred_days: %w[sunday friday saturday friday] }, as: :json
    assert_response :ok
    meal = Meal.find(response.parsed_body["data"]["id"])
    assert_equal %w[friday saturday sunday], meal.reload.preferred_days
    get "/meals/#{meal.id}", as: :json
    assert_equal %w[friday saturday sunday], response.parsed_body["data"]["preferred_days"]
  end

  test "omitted preferences default to any day and updates preserve or clear them" do
    post "/meals", params: { name: "Pizza", description: "Cheesy" }, as: :json
    assert_response :ok
    id = response.parsed_body["data"]["id"]
    assert_equal [], response.parsed_body["data"]["preferred_days"]
    patch "/meals/#{id}", params: { preferred_days: %w[monday thursday] }, as: :json
    assert_response :ok
    patch "/meals/#{id}", params: { name: "Custom pizza" }, as: :json
    assert_response :ok
    assert_equal %w[monday thursday], response.parsed_body["data"]["preferred_days"]
    patch "/meals/#{id}", params: { preferred_days: [] }, as: :json
    assert_response :ok
    assert_empty Meal.find(id).preferred_days
  end

  test "invalid preferences return 422 without changing the meal" do
    meal = Meal.create!(name: "Pizza", description: "Cheesy", preferred_days: %w[friday])
    [%w[funday], [1], "friday", nil, { friday: true }, [["friday"]]].each do |invalid|
      patch "/meals/#{meal.id}", params: { name: "Changed", preferred_days: invalid }, as: :json
      assert_response :unprocessable_entity
      assert response.parsed_body["errors"]["preferred_days"].present?
      assert_equal "Pizza", meal.reload.name
      assert_equal %w[friday], meal.preferred_days
    end
  end
end
