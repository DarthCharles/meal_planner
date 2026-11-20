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
| `PUT` / `PATCH` | `/ingredients/:id` | Update a shared ingredient name or shopping category |
| `GET` | `/shopping_categories` | List ordered shopping category codes |
| `DELETE` | `/ingredients/:id` | Delete an unused ingredient |
| `GET` | `/ingredients/:ingredient_id/shopping_profile` | Show shopping units and equivalences |
| `PUT` / `PATCH` | `/ingredients/:ingredient_id/shopping_profile` | Replace shopping configuration |
| `DELETE` | `/ingredients/:ingredient_id/shopping_profile` | Clear shopping configuration |

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
{"data":[{"id":12,"name":"Egg","shopping_category":"dairy_eggs","meals":[{"id":3,"name":"Omelette"}]},{"id":19,"name":"Potato","shopping_category":"produce","meals":[]}]}
```

Each catalog entry includes the IDs and names of meals using that ingredient,
sorted by case-insensitive meal name and ID. Unused ingredients have `meals: []`.
The backend loads meal usage with the catalog; the client does not need to fetch
the full meal library to display it.

Standalone create and update accept a top-level `{"name":"Tomato","shopping_category":"produce"}` payload.
Either field may be omitted on update. Category defaults to `uncategorized` on
create, including new ingredients created within recipes. Unknown, blank, or null
category values return `422` with `{"errors":{"shopping_category":["…"]}}`
and preserve the previous ingredient. Categories are independent of shopping profiles.
Create returns `201`; update returns `200`. Both return
`{"data":{"id":12,"name":"Tomato","shopping_category":"produce","meals":[]}}` with current meal usage.
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

## Shopping categories

`GET /shopping_categories` returns fixed reference data in display order:

```json
{"data":[{"code":"produce","position":0},{"code":"meat","position":1},{"code":"deli","position":2},{"code":"dairy_eggs","position":3},{"code":"bakery_tortillas","position":4},{"code":"pantry","position":5},{"code":"frozen","position":6},{"code":"uncategorized","position":7}]}
```

Codes and positions are identical in every locale. The client translates labels
under `reference.shopping_categories.<code>`; labels are never stored on ingredients
or submitted in place of codes. There is no category-management endpoint.

## Shopping lists

`GET /menus/:id/shopping_list` returns a view-only list computed on demand:

```json
{
  "data": {
    "menu_id": 12,
    "from": "2026-11-16T00:00:00.000Z",
    "to": "2026-11-22T23:59:59.000Z",
    "people_count": 4,
    "categories": [
      {"code":"produce","position":0},
      {"code":"meat","position":1},
      {"code":"deli","position":2},
      {"code":"dairy_eggs","position":3},
      {"code":"bakery_tortillas","position":4},
      {"code":"pantry","position":5},
      {"code":"frozen","position":6},
      {"code":"uncategorized","position":7}
    ],
    "items": [
      {"ingredient_id": 3, "name": "Huevo", "shopping_category": "dairy_eggs", "quantity": "24.0", "unit": "pieza"}
    ],
    "meals_without_ingredients": [{"id": 7, "name": "Ensalada de pollo"}],
    "conversion_warnings": []
  }
}
```

The response includes the full category catalog, menu boundaries, and each item's
current `shopping_category`. Items sort by category position, then lowercase name,
ingredient ID, and unit. Clients can re-sort names within categories using their
locale. Empty categories need not be displayed. Category edits also affect old
menus; a list always covers the entire selected menu, without filtering past days.

Each scheduled meal contributes `quantity × people_count ÷ servings`.
Repeated meals count once per scheduled occurrence. Kilograms are normalized
to grams and liters to milliliters, including for ingredients without a shopping
profile. Ingredient-specific factors first combine compatible quantities in the
profile's base unit. Different catalog entries remain separate; preparation notes
do not affect grouping. Recipe edits affect historical menus' lists too.

After summing the entire menu, the endpoint selects a display unit:

- Below one configured piece/container, return the required base-unit quantity.
- At or above one configured piece/container, express the total in that unit and
  round up to a whole count. For a 425 g mayonnaise jar: 9 g stays 9 g, 425 g
  becomes 1 jar, 500 g becomes 2 jars, and 850 g becomes 2 jars.
- A 148 g onion reference displays 74 g as grams and 360.52 g as 3 pieces.
- Metric shopping units remain in canonical grams/milliliters, without whole-count
  rounding. Without usable factors, preserve the available recipe units.
- If some measures cannot be combined, leave the separate quantities in their
  available/base units and report a warning; do not round a partial total into
  containers while other requirements are unresolved.

Aggregation and the threshold comparison use exact rational arithmetic. Base-unit
quantities are decimal strings rounded only for display to three places, halfway
away from zero; positive totals below display precision stay visible as `"0.001"`.
Whole-count rounding happens only after the exact total reaches the configured
unit's threshold, regardless of the legacy `round_up` flag. `required_quantity`
is not returned. No pantry stock is subtracted and no purchase state is stored.

An item includes `approximate: true` only if a conversion used an approximate
equivalence. Its absence means no approximate conversion was used; it does not
guarantee the original recipe measurements are exact. Approximation can come from
converting recipe measures to the base unit or displaying the total as pieces.
A recipe already expressed entirely in the displayed count does not inherit an
approximation flag from an otherwise unused piece-weight reference.

If an equivalence is missing, the original quantity is retained in its canonical
unit. Converted and unconverted
quantities can therefore remain separate. `conversion_warnings` identifies the
ingredient, source `units`, base `target_unit`, and a stable `reason`:
`equivalence_missing` for a configured profile or `shopping_profile_missing`
when an unconfigured ingredient has multiple incompatible units. Warnings are
needed only when multiple entries remain; a recipe using only cloves can return
cloves without requiring a cloves-to-head conversion. For example:

```json
{"ingredient_id":12,"name":"Cebolla","units":["taza"],"target_unit":"g","reason":"equivalence_missing"}
```

Items are sorted by category position, lowercased ingredient name, ingredient ID, then unit code.
Meals with no ingredient rows are listed once each, sorted by lowercased name
then ID, while available totals are still returned. Partially entered recipes
cannot be detected automatically. Empty menus return all three arrays empty.

## Ingredient shopping profiles

Shopping configuration is optional and separate from the existing ingredient
catalog payload; `/ingredients` continues to return `id`, `name`, and `meals`.
`GET /ingredients/:ingredient_id/shopping_profile` returns `{"data":null}` when
there is no configuration. A missing ingredient returns the existing localized
`404` string error. Clearing a profile returns `{"data":true}` and restores
metric normalization without ingredient-specific conversions.

`PUT` and `PATCH` replace the entire configuration atomically, including its
equivalences. Both return `200` with the saved configuration in `data`:

```json
{
  "base_unit": "g",
  "shopping_unit": "pieza",
  "round_up": true,
  "equivalences": [{
    "unit": "pieza",
    "quantity": "148",
    "source": "https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/nutrition-information-raw-vegetables",
    "description": "One medium raw onion; edible portion. Whole purchase sizes vary.",
    "approximate": true
  }]
}
```

The response adds `ingredient_id`; quantities are decimal strings. The base unit
must be `g`, `ml`, or `pieza`. Each equivalence means **one of its unit equals
quantity base units**, e.g. one piece equals 148 g or one jar equals 390 g.
Factors must be finite and positive, at most `1000000000`, and remain positive
after storage rounding to six decimal places. Oversized factors return `422`;
unusable legacy factors are treated as missing conversions. Source and
description are required text; source can be a reference URL or a description
of a household measurement. `round_up` and `approximate` accept JSON booleans
only and default to false when omitted. Duplicate equivalent units, unknown
units, missing factors for the shopping unit, and malformed inputs return
localized `422` field errors and preserve the previous configuration.

Equivalences use canonical units: use `g` instead of `kg` and `ml` instead of
`l`. Do not repeat the base unit or override its exact metric conversions.
For example, a profile with base `g` can define `ml` for that ingredient's
density; liters then use that same density through the exact metric conversion.
There is no global weight-to-volume or weight-to-piece conversion. Cups,
spoons, cloves, and jars need explicit ingredient-specific factors. The unit
catalog includes jars (`frasco`), bags (`bag`), cans (`can`), bottles (`bottle`),
and packages (`package`). Display labels are English; existing API unit codes
remain stable, including `pieza` for pieces. Package sizes are configured per
ingredient and are never inferred from the container type. Recipe quantities
and ingredient identities are never rewritten by configuring a profile.

Equivalences are entered directly for an ingredient and stored in the database.
There is no external template catalog or automatic matching by ingredient name.
The source and description document the measurement or selected product label;
they do not trigger an external lookup or import. Vegetable piece weights are
approximate and should specify size and whether they cover only edible material.
Package sizes apply only to the selected presentation, not every brand or size.

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
