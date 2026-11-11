class AddServingsAndPeopleCount < ActiveRecord::Migration[8.1]
  def change
    add_column :meals, :servings, :integer, default: 1, null: false
    add_column :menus, :people_count, :integer, default: 1, null: false
    add_check_constraint :meals, "servings > 0 AND typeof(servings) = 'integer'", name: "meals_positive_servings"
    add_check_constraint :menus, "people_count > 0 AND typeof(people_count) = 'integer'", name: "menus_positive_people_count"
  end
end
