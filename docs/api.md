# API reference

The Rails API runs on `http://127.0.0.1:3000` by default.

All responses use a top-level `data` or `errors` key.

## Response language

Requests may send `Accept-Language: en` or `es`. Regional tags (such as `es-MX`)
and quality weights are supported. Unsupported or excluded languages fall back
to English. Locale selection is scoped to each request. Responses include
`Content-Language` and `Vary: Accept-Language`.

Validation and application error messages, including menu generation failures,
are translated. Field keys and the `data`/`errors` envelopes stay unchanged.
Weekday names, preferred-day values, meal-type selection pairs, unit codes and
catalog names, timestamps, and user-entered content are stable across languages.
Clients translate reference display labels using those stable values. For example,
Spanish blank-name validation returns:

```json
{"errors":{"name":["no puede estar en blanco"]}}
```

`generation_notices` remains an array of strings, rendered in the request language
from generation-time snapshots. New snapshots store the original meal name,
assigned weekday, and preferred days in the existing JSON column. Editing a meal
never rewrites these snapshots. Old English notices matching the original
application template are also translated when read; unrecognized historical
text is returned unchanged. No database migration or client payload change is
required.

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
| `POST` | `/ingredients` | Create a standalone ingredient |
| `PUT` / `PATCH` | `/ingredients/:id` | Rename a shared ingredient |
| `DELETE` | `/ingredients/:id` | Delete an unused ingredient |

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
{"data":[{"id":12,"name":"Egg","meals":[{"id":3,"name":"Omelette"}]},{"id":19,"name":"Potato","meals":[]}]}
```

Each catalog entry includes the IDs and names of meals using that ingredient,
sorted by case-insensitive meal name and ID. Unused ingredients have `meals: []`.
The backend loads meal usage with the catalog; the client does not need to fetch
the full meal library to display it.

Standalone create and update accept a top-level `{"name":"Tomato"}` payload.
Create returns `201`; update returns `200`. Both return
`{"data":{"id":12,"name":"Tomato","meals":[]}}` with current meal usage.
Names are trimmed and must be nonblank and unique after lowercasing. Duplicate
names are rejected rather than merged. Validation failures return `422` with
`{"errors":{"name":["…"]}}`; updating a missing ingredient returns `404`
with `{"errors":"Ingredient not found"}`. A rename preserves the ingredient
ID, quantities, units, and recipe notes; every referencing meal and menu returns
the new name.

`DELETE /ingredients/:id` accepts no payload. Deleting an unused ingredient
returns `200` with `{"data":true}`. Missing ingredients return `404` with
`{"errors":"Ingredient not found"}`. Ingredients still referenced by meals
are preserved and return `422` with
`{"errors":"Cannot delete an ingredient used by meals. Remove it from those meals first."}`.
Deletion never removes meals or their recipe rows.

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
position, and the meal-ingredient row `id`. New ingredients drafted within the
meal form are persisted only when that meal saves. My Ingredients uses the
standalone creation endpoint instead.

Create and update payload:

```json
{
  "name": "Avena cocida",
  "servings": 1,
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
    "servings": 1,
    "description": "Warm oats with cinnamon and fruit.",
    "recipe_url": "https://example.com/recipe",
    "meal_types": ["breakfast", "dinner"],
    "preferred_days": ["friday", "saturday", "sunday"]
  }
}
```

`servings` records how many people the recipe's ingredient quantities serve.
It is a positive integer, defaulting to `1` for existing meals and new meals
that omit it. Omission on update preserves the saved value. Changing servings
does not change stored ingredient quantities. All meal responses, including
meals nested inside menus, include it. Integer strings such as `"2"` are also
accepted; fractional values, booleans, nulls, arrays, and objects return `422`
with a localized `servings` field error.
Counts must fit SQLite's signed 64-bit integer range (maximum
`9223372036854775807`); larger values return a localized `422` field error.

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
| `PUT` / `PATCH` | `/menus/:id` | Update the menu's people count |
| `GET` | `/menus/:id/shopping_list` | Calculate the menu's shopping list |

Every menu response includes the positive integer `people_count`. Existing
menus default to `1`. Generation optionally accepts `{"people_count":4}`.
When omitted, a new week defaults to `1`; regenerating an existing week
preserves its people count. An explicit value overrides it. Regeneration
replaces the menu record and its ID, so clients must use the returned menu ID.

`PUT` and `PATCH /menus/:id` accept `{"people_count":4}` and return `200`
with the full updated menu in `data`. Only `people_count` is editable;
omitting it leaves the menu unchanged. The value must be a positive integer
or an integer string such as `"4"`, at most `9223372036854775807`.
Invalid values return `422`, for example:

```json
{"errors":{"people_count":["must be a positive whole number"]}}
```

Invalid updates and generation requests preserve existing data. Missing menus
return localized `404` errors for update and shopping-list requests, using
the same string error envelope as menu detail.

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

These notices are rendered from the menu’s generation snapshot in the requested
language; editing a meal later does not rewrite the snapshot. Existing menus
default to no notices.
The previous menu for that week is replaced atomically only after a complete
schedule has been found. Failed generation preserves it.

If meals are insufficient, the endpoint returns `422`:

```json
{
  "errors": "Cannot complete the menu. Add meals for each meal time; each day needs three different meals."
}
```

## Shopping lists

`GET /menus/:id/shopping_list` returns a view-only list computed on demand:

```json
{
  "data": {
    "menu_id": 12,
    "people_count": 4,
    "items": [
      {"ingredient_id": 3, "name": "Huevo", "quantity": "24.0", "unit": "pieza"}
    ],
    "meals_without_ingredients": [{"id": 7, "name": "Ensalada de pollo"}]
  }
}
```

Each scheduled meal contributes `quantity × people_count ÷ servings`.
Repeated meals count once per scheduled occurrence. Rows are grouped by
ingredient ID and exact unit code; `g` and `kg` remain separate, as do different
catalog entries. Preparation notes do not affect grouping. The endpoint returns
current ingredient names, quantities, and servings, so recipe edits affect
historical menus' lists too. No shopping-list or purchase state is stored.

Aggregation uses exact rational arithmetic and rounds only final totals to
three decimal places, halfway away from zero. Quantities are decimal strings
(including whole values such as `"24.0"`); positive totals smaller than the
display precision are shown as `"0.001"` instead of zero. Fractional pieces
remain fractional; there is no package rounding or unit conversion.

Items are sorted by lowercased ingredient name, ingredient ID, then unit code.
Meals with no ingredient rows are listed once each, sorted by lowercased name
then ID, while available totals are still returned. Partially entered recipes
cannot be detected automatically. Empty menus return both arrays empty.

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
