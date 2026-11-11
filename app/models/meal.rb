class Meal < ApplicationRecord
  has_many :meal_meal_types, dependent: :destroy
  has_many :meal_types, through: :meal_meal_types
  has_many :daily_meals, dependent: :destroy
  has_many :days, through: :daily_meals
  has_many :meal_ingredients, -> { ordered }, dependent: :destroy
  has_many :ingredients, through: :meal_ingredients

  WEEKDAY_NAMES = %w[monday tuesday wednesday thursday friday saturday sunday].freeze

  has_many :meal_preferred_days, dependent: :destroy
  has_many :preferred_weekdays, through: :meal_preferred_days, source: :weekday

  validate :valid_preferred_days
  after_save :save_preferred_days

  def preferred_days
    return @preferred_days if defined?(@preferred_days)

    WEEKDAY_NAMES & preferred_weekdays.map(&:name)
  end

  def preferred_days=(names)
    @preferred_days = names
  end

  # Scopes by meal time (a meal can appear in more than one, e.g. avena at breakfast or dinner)
  # Classified Mexican-style: lunch = main/heavy meal, dinner = lighter evening
  scope :breakfast, -> { joins(:meal_types).where(meal_types: { description: "breakfast" }).distinct }
  scope :lunch,     -> { joins(:meal_types).where(meal_types: { description: "lunch" }).distinct }
  scope :dinner,    -> { joins(:meal_types).where(meal_types: { description: "dinner" }).distinct }

  validates :name, :description, presence: true

  def as_json(options = {})
    {}.tap do |h|
      h[:id] = id
      h[:description] = description
      h[:name] = name
      h[:recipe_url] = recipe_url
      h[:meal_types] = meal_types.pluck(:description)
      h[:preferred_days] = preferred_days
      h[:ingredients] = meal_ingredients
    end
  end

  private

  def valid_preferred_days
    names = preferred_days
    unless names.is_a?(Array) && names.all? { |name| WEEKDAY_NAMES.include?(name) }
      errors.add(:preferred_days, :invalid_weekdays)
    end
  end

  def save_preferred_days
    return unless defined?(@preferred_days)

    self.preferred_weekdays = Weekday.where(name: @preferred_days.uniq)
    remove_instance_variable(:@preferred_days)
  end
end
