# API reference

The Rails API runs on `http://127.0.0.1:3000` by default.

All responses use a top-level `data` or `errors` key.

## Meals

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/meals` | List meals |
| `GET` | `/meals/:id` | Show one meal |
| `POST` | `/meals` | Create a meal |
| `PUT` | `/meals/:id` | Update a meal |
| `PATCH` | `/meals/:id` | Update a meal |
| `DELETE` | `/meals/:id` | Delete a meal |
| `GET` | `/units` | List available ingredient units |
| `GET` | `/ingredients` | List the shared ingredient catalog |

Meal create and update requests may include an `ingredients` array. Each item
uses exactly one of `ingredient_id` (an existing catalog ID) or `name` (a new
ingredient), plus `quantity`, `unit`, and optional `preparation_note` and
`position`. Existing clients may continue submitting names. Names are trimmed
and matched case-insensitively to reuse an existing ingredient; otherwise a new
catalog entry is created as part of the meal save.
When `ingredients` is included in an update, it replaces the meal's current
ingredient list. Meal responses include the normalized `ingredients` array.
The `unit` value must be one of the codes returned by `GET /units`.
Omitting `ingredients` preserves the list on update; `[]` clears it. Each
ingredient may occur only once in a meal. Invalid identities, duplicate rows,
nonpositive quantities, and unknown units return `422` with
`{"errors":{"ingredients":["…"]}}`. Meal fields, preferences, meal types,
recipe rows, and new catalog entries save in one transaction; a failure rolls
back all changes.

`GET /ingredients` returns all ingredients sorted by normalized name, with no
ownership filtering:

```json
{"data":[{"id":12,"name":"Egg"},{"id":19,"name":"Potato"}]}
```

For example, a meal can select an existing ingredient and create another:

```json
{
  "ingredients": [
    {"ingredient_id":12,"quantity":"2","unit":"pieza"},
    {"name":"Onion","quantity":"100","unit":"g","preparation_note":"diced"}
  ]
}
```

Meal responses retain `ingredient_id`, display `name`, quantity, unit, note,
position, and the meal-ingredient row `id`. New ingredients are persisted only
when a meal saves; there is no standalone creation request from the form.

Create and update payload:

```json
{
  "name": "Avena cocida",
  "description": "Warm oats with cinnamon and fruit.",
  "recipe_url": "https://example.com/recipe",
  "meal_type_ids": [1, 3],
  "preferred_days": ["friday", "saturday", "sunday"]
}
```

Meal responses include meal type descriptions:

```json
{
  "data": {
    "id": 1,
    "name": "Avena cocida",
    "description": "Warm oats with cinnamon and fruit.",
    "recipe_url": "https://example.com/recipe",
    "meal_types": ["breakfast", "dinner"],
    "preferred_days": ["friday", "saturday", "sunday"]
  }
}
```

`preferred_days` is an array of lowercase English weekday names, returned in
Monday–Sunday order with duplicates removed. An empty array means **Any day**.
Omitting it on create defaults to Any day; omitting it on update preserves the
saved preference. Sending `[]` clears the preference. Invalid names, null, or a
non-array value return `422` with a `preferred_days` field error. The client
weekend preset means Friday–Sunday; weekdays means Monday–Thursday. Preferences
apply to every meal time associated with the meal and affect future generation.

## Menus

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/menus` | List menus |
| `GET` | `/menus/:id` | Show one menu |
| `POST` | `/menus/generate` | Generate the next weekly menu |

`GET /menus` returns menus by start date descending, with descending ID as a
tie-breaker. The latest weekly plan stays first after generation and on reload.

`POST /menus/generate` plans the next Monday–Sunday week (using the existing UTC
next-Monday date semantics). It creates seven days with breakfast, lunch, and
dinner, each using a different meal within the day. A meal may repeat on
separate days, so seven meals per category are no longer required.

Generation minimizes the total number of assignments outside a meal's preferred
days, then minimizes weekly repeats. Thus repeating a suitable weekday meal is
preferred over scheduling weekend pizza on Monday. Among equally suitable
solutions, meal order is randomized. Preferences do not guarantee inclusion in
a menu or variety across different weeks.

Every menu response, including list/detail and generation, includes
`generation_notices: []`. If a preference exception is necessary, the array
contains messages such as:

```json
{
  "generation_notices": [
    "Pizza was scheduled on Monday to complete the menu; its preferred days are Friday, Saturday, Sunday."
  ]
}
```

These notices are saved with the menu as a generation snapshot; editing a meal
later does not rewrite historical notices. Existing menus default to no notices.
The previous menu for that week is replaced atomically only after a complete
schedule has been found. Failed generation preserves it.

If meals are insufficient, the endpoint returns `422`:

```json
{
  "errors": "Cannot complete the menu. Add meals for each meal time; each day needs three different meals."
}
```

## Days

```http
POST /days
```

Payload:

```json
{
  "menu_id": 1,
  "weekday_id": 1,
  "meal_ids": [1, 2]
}
```

## Meal types

```http
GET /meal_types
```

Returns selection pairs such as:

```json
{
  "data": [["breakfast", 1], ["lunch", 2], ["dinner", 3]]
}
```

## CORS

Development origins are configured in [`config/initializers/cors.rb`](../config/initializers/cors.rb). Localhost and `127.0.0.1` origins on any development port are allowed so Vite can use the next available port when the default is occupied.
