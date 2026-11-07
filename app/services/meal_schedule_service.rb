# Finds a minimum-cost assignment for all 21 slots. One preference exception
# costs more than every possible weekly repeat combined. Residual edges allow
# later assignments to revise earlier choices instead of getting stuck greedily.
class MealScheduleService
  Edge = Struct.new(:to, :reverse, :capacity, :cost)
  TYPES = %w[breakfast lunch dinner].freeze
  EXCEPTION_COST = 22

  def call
    @graph = []
    source = node
    sink = node
    meals = Meal.includes(:meal_types, :preferred_weekdays).to_a.shuffle
    meal_nodes = meals.to_h { |meal| [meal.id, node] }
    meals.each do |meal|
      edge(meal_nodes.fetch(meal.id), sink, 1, 0)
      edge(meal_nodes.fetch(meal.id), sink, 6, 1)
    end

    choices = []
    Meal::WEEKDAY_NAMES.each do |weekday|
      day_nodes = meals.to_h do |meal|
        day_node = node
        edge(day_node, meal_nodes.fetch(meal.id), 1, 0)
        [meal.id, day_node]
      end
      TYPES.each_with_index do |type, position|
        slot = node
        edge(source, slot, 1, 0)
        meals.each do |meal|
          next unless meal.meal_types.any? { |meal_type| meal_type.description == type }

          exception = meal.preferred_days.any? && !meal.preferred_days.include?(weekday)
          assignment = edge(slot, day_nodes.fetch(meal.id), 1, exception ? EXCEPTION_COST : 0)
          choices << [assignment, weekday, position, meal, exception]
        end
      end
    end

    21.times do
      distances = Array.new(@graph.length, Float::INFINITY)
      previous = Array.new(@graph.length)
      distances[source] = 0
      loop do
        changed = false
        @graph.each_with_index do |edges, from|
          next unless distances[from].finite?

          edges.each do |candidate|
            next unless candidate.capacity.positive?
            next unless distances[from] + candidate.cost < distances[candidate.to]

            distances[candidate.to] = distances[from] + candidate.cost
            previous[candidate.to] = [from, candidate]
            changed = true
          end
        end
        break unless changed
      end
      unless previous[sink]
        raise MenuGenerationService::InsufficientMealsError,
              "Cannot complete the menu. Add meals for each meal time; each day needs three different meals."
      end

      current = sink
      until current == source
        from, candidate = previous.fetch(current)
        candidate.capacity -= 1
        @graph[current][candidate.reverse].capacity += 1
        current = from
      end
    end

    choices.filter_map do |assignment, weekday, position, meal, exception|
      { weekday: weekday, position: position, meal: meal, exception: exception } if assignment.capacity.zero?
    end
  end

  private

  def node
    @graph << []
    @graph.length - 1
  end

  def edge(from, to, capacity, cost)
    forward = Edge.new(to, @graph[to].length, capacity, cost)
    backward = Edge.new(from, @graph[from].length, 0, -cost)
    @graph[from] << forward
    @graph[to] << backward
    forward
  end
end
