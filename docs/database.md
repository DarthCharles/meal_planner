# Database model

The current prototype models menus, days, meals, and meal classifications. It does not yet include users or ownership. The planned multi-user model should add ownership to user-managed records before authentication is introduced.

## Relationships

```mermaid
erDiagram
  MENUS ||--o{ DAYS : "has many"
  WEEKDAYS ||--o{ DAYS : "belongs to"
  DAYS ||--o{ DAILY_MEALS : "has many"
  MEALS ||--o{ DAILY_MEALS : "has many"
  MEALS }o--o{ MEAL_TYPES : "many-to-many via meal_meal_types"
  MEALS ||--o{ MEAL_INGREDIENTS : contains
  INGREDIENTS ||--o{ MEAL_INGREDIENTS : used_in
  UNITS ||--o{ MEAL_INGREDIENTS : measures

  MENUS {
    int id PK
    datetime from "not null"
    datetime to "not null"
    datetime created_at
    datetime updated_at
  }

  DAYS {
    int id PK
    int menu_id FK "not null, unique with weekday_id"
    int weekday_id FK "not null"
    datetime created_at
    datetime updated_at
  }

  WEEKDAYS {
    int id PK
    string name "not null, unique"
    datetime created_at
    datetime updated_at
  }

  DAILY_MEALS {
    int id PK
    int day_id FK "not null"
    int meal_id FK "not null"
    int position "default 0, for ordering"
    datetime created_at
    datetime updated_at
  }

  MEALS {
    int id PK
    string name "not null"
    string description "not null"
    string recipe_url
    datetime created_at
    datetime updated_at
  }

  MEAL_TYPES {
    int id PK
    string description "not null, unique"
    datetime created_at
    datetime updated_at
  }

  INGREDIENTS {
    int id PK
    string name "not null"
    string normalized_name "not null, unique"
    datetime created_at
    datetime updated_at
  }

  MEAL_INGREDIENTS {
    int id PK
    int meal_id FK "not null"
    int ingredient_id FK "not null"
    decimal quantity "not null"
    int unit_id FK "not null"
    string preparation_note
    int position "default 0"
    datetime created_at
    datetime updated_at
  }

  UNITS {
    int id PK
    string code "not null, unique"
    string name "not null"
    datetime created_at
    datetime updated_at
  }
```

## Summary

- `Menu` has many `Day` records, one for each weekday.
- `Day` belongs to a `Menu` and a `Weekday`.
- `Day` has many `Meal` records through `DailyMeal`.
- `DailyMeal.position` orders meals within a day: `0` breakfast, `1` lunch, `2` dinner.
- `Meal` has many `MealType` records through `MealMealType`.
- A meal can belong to more than one type, such as breakfast and dinner.
- Seeded meal types are `breakfast`, `lunch`, and `dinner`.
- `Meal` has many `Ingredient` records through `MealIngredient`.
- `MealIngredient` stores the quantity, unit, preparation note, and display order.
- Units are selected from the structured `Unit` catalog instead of free text.

## Constraints

The schema enforces required foreign keys and prevents duplicate relationships:

- One weekday can appear only once within a menu.
- A meal cannot be added twice to the same day.
- An ingredient name is unique after trimming and lowercasing.
- An ingredient cannot be added twice to the same meal.
- Meal ingredient units must reference the unit catalog.
- Weekday names and meal type descriptions are unique.
