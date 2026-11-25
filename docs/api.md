# API reference

The Rails API runs on `http://127.0.0.1:3000` by default.

All responses use a top-level `data` or `errors` key.

## Postman collection

Import [meal-planner.postman_collection.json](postman/meal-planner.postman_collection.json)
using Postman's **Import → Files**. The collection uses the v2.1 format, includes
all configuration in collection variables, and requires no separate environment.
Set `base_url` (default `http://127.0.0.1:3000`), `locale` (`es` or `en`), and
`people_count`. Start the Rails server separately after migrations and seeds.

Run folders **01–06 in order**. Response scripts capture ingredient, recipe,
meal-type, and menu IDs. Folder 02 creates uniquely named demonstration ingredients.
Reference ratios are explicitly synthetic. Folder 06 updates the selected menu
and generation replaces the next weekly menu. The generator may choose other
recipes; weekly quantities reflect actual assignments, not guaranteed demo totals.
Folder 07 contains expected validation errors; folder 08 optionally deletes demo
records. Select folders explicitly in Collection Runner if you want to retain
the demo records, since running the entire collection also runs cleanup.

The collection includes response assertions but has not been executed against
Rails or imported into Postman as part of its creation.

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
{ "errors": { "name": ["no puede estar en blanco"] } }
```

`generation_notices` remains an array of strings, rendered in the request language
from generation-time snapshots. New snapshots store the original meal name,
assigned weekday, and preferred days in the existing JSON column. Editing a meal
never rewrites these snapshots. Old English notices matching the original
application template are also translated when read; unrecognized historical
text is returned unchanged. No database migration or client payload change is
required.

## Meals

| Method          | Endpoint                                       | Purpose                                              |
| --------------- | ---------------------------------------------- | ---------------------------------------------------- |
| `GET`           | `/meals`                                       | List meals                                           |
| `GET`           | `/meals/:id`                                   | Show one meal                                        |
| `POST`          | `/meals`                                       | Create a meal                                        |
| `PUT`           | `/meals/:id`                                   | Update a meal                                        |
| `PATCH`         | `/meals/:id`                                   | Update a meal                                        |
| `DELETE`        | `/meals/:id`                                   | Delete a meal                                        |
| `GET`           | `/units`                                       | List available ingredient units                      |
| `GET`           | `/ingredients`                                 | List the shared ingredient catalog                   |
| `POST`          | `/ingredients`                                 | Create a standalone ingredient                       |
| `PUT` / `PATCH` | `/ingredients/:id`                             | Update a shared ingredient name or shopping category |
| `GET`           | `/shopping_categories`                         | List ordered shopping category codes                 |
| `DELETE`        | `/ingredients/:id`                             | Delete an unused ingredient                          |
| `GET`           | `/ingredients/:ingredient_id/shopping_profile` | Show the habitual buying presentation                 |
| `PUT` / `PATCH` | `/ingredients/:ingredient_id/shopping_profile` | Replace shopping configuration                       |
| `DELETE`        | `/ingredients/:ingredient_id/shopping_profile` | Clear shopping configuration                         |
| `GET` | `/ingredients/:ingredient_id/measurement_references` | Show ingredient-specific measurement references |
| `PUT` / `PATCH` | `/ingredients/:ingredient_id/measurement_references` | Replace all ingredient measurement references |

Meal create and update requests may include an `ingredients` array. Each item
uses exactly one of `ingredient_id` (an existing catalog ID) or `name` (a new
ingredient), plus `quantity`, `unit`, and optional `preparation_note` and
`position`. Existing clients may continue submitting names. Names are trimmed
and matched case-insensitively to reuse an existing ingredient; otherwise a new
catalog entry is created as part of the meal save.
When `ingredients` is included in an update, it replaces the meal's current
ingredient list. Meal responses include the normalized `ingredients` array.
The `unit` value must be one of the codes returned by `GET /units`.
Omitting `ingredients` preserves the list on update; `[]` clears it. An
ingredient may occur several times in a meal; all rows contribute to its total. Invalid identities,
nonpositive quantities, and unknown units return `422` with
`{"errors":{"ingredients":["…"]}}`. Meal fields, preferences, meal types,
recipe rows, and new catalog entries save in one transaction; a failure rolls
back all changes.

`GET /ingredients` returns all ingredients sorted by normalized name, with no
ownership filtering:

```json
{
  "data": [
    {
      "id": 12,
      "name": "Egg",
      "shopping_category": "dairy_eggs",
      "meals": [{ "id": 3, "name": "Omelette" }]
    },
    { "id": 19, "name": "Potato", "shopping_category": "produce", "meals": [] }
  ]
}
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
    { "ingredient_id": 12, "quantity": "2", "unit": "piece" },
    { "name": "Onion", "quantity": "100", "unit": "g", "preparation_note": "diced" }
  ]
}
```

Meal responses retain `ingredient_id`, display `name`, quantity, unit, `package_quantity`, `package_unit`, note,
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
It is a required positive integer on creation, with no implicit default.
Omission on update preserves the saved value. Changing servings
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

| Method          | Endpoint                   | Purpose                            |
| --------------- | -------------------------- | ---------------------------------- |
| `GET`           | `/menus`                   | List menus                         |
| `GET`           | `/menus/home?date=YYYY-MM-DD` | Get the home menu and planning status |
| `GET`           | `/menus/summaries`         | List saved menu IDs and dates      |
| `GET`           | `/menus/:id`               | Show one menu                      |
| `POST`          | `/menus/generate`          | Generate the next weekly menu      |
| `PUT` / `PATCH` | `/menus/:id`               | Update the menu's people count     |
| `GET`           | `/menus/:id/shopping_list` | Calculate the menu's shopping list |

Full menu records include the positive integer `people_count`. Existing
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
{ "errors": { "people_count": ["must be a positive whole number"] } }
```

Invalid updates and generation requests preserve existing data. Missing menus
return localized `404` errors for update and shopping-list requests, using
the same string error envelope as menu detail.

`GET /menus` returns menus by start date descending, with descending ID as a
tie-breaker. The latest weekly plan stays first after generation and on reload.

`GET /menus/summaries` uses the same ordering and returns only `id`, `from`, and
`to` for each saved menu. Use `GET /menus/:id` to load one week's full menu.

`GET /menus/home` takes the browser's local calendar date and returns a planning
snapshot in `data`. Missing or invalid dates return a localized `422` error.

- `current_menu` is the full menu covering that date, or `null`. If several
  menus cover the date, the start date and ID ordering determines which appears.
- `next_week` contains the next generation week's `from` and `to` calendar
  dates. The server uses the same UTC next-Monday rule as generation.
- `next_week_menu_id` is the newest saved menu starting within that generation
  week, or `null`.
- `next_meal_date` is the first later scheduled calendar date when a current
  menu exists and has no meals for the requested date, or `null`.
- `has_saved_menus` and `has_meals` indicate whether those collections have records.

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
{
  "data": [
    { "code": "produce", "position": 0 },
    { "code": "meat", "position": 1 },
    { "code": "deli", "position": 2 },
    { "code": "dairy_eggs", "position": 3 },
    { "code": "bakery_tortillas", "position": 4 },
    { "code": "pantry", "position": 5 },
    { "code": "frozen", "position": 6 },
    { "code": "uncategorized", "position": 7 }
  ]
}
```

Codes and positions are identical in every locale. The client translates labels
under `reference.shopping_categories.<code>`; labels are never stored on ingredients
or submitted in place of codes. There is no category-management endpoint.

## Standard units and recipe packages

`GET /units` returns sorted objects with `code`, `name`, `dimension`,
`canonical_unit`, and decimal-string `factor`. Units are a fixed global standard;
there is no endpoint for overriding them per ingredient. All unit codes and names
are English; display labels are translated separately by clients.

| Codes | Dimension | Canonical unit | Factor |
| --- | --- | --- | --- |
| `g`, `kg` | mass | `g` | 1, 1000 |
| `ml`, `l` | volume | `ml` | 1, 1000 |
| `teaspoon`, `tablespoon`, `cup` | volume | `ml` | 5, 15, 240 |
| `piece` | count | `piece` | 1 |
| `jar`, `bag`, `can`, `bottle`, `package` | package | null | null |

The 240 ml cup and 15/5 ml spoons are Comal's culinary convention, not an
assertion that every external recipe uses those measures. There is no universal
conversion between grams, ml, and pieces. The old `diente` unit was removed:
represent a garlic clove as ingredient “Diente de ajo”, measured in `piece`,
rather than assuming that a clove equals a whole garlic bulb.

Quantities accept positive decimal numbers/strings and fractions such as `1/2`,
`1 1/2`, `½`, and `1½`. They are stored to six decimal places and must remain
positive after storage rounding, with a maximum of `1000000000`. Scientific-notation strings
and malformed quantities are rejected. Responses serialize decimals
as strings. Recipe ingredients can repeat, preserving their notes and order.

A recipe stores a count and its selected container unit. The ingredient's buying
preference supplies the current contents and shopping container. To configure
that preference while saving a recipe, send the container as the row's unit
and add `ingredient_package`:

```json
{
  "name": "Tuna salad",
  "description": "Mix the ingredients",
  "servings": 2,
  "ingredients": [
    { "name": "Tuna", "quantity": "1", "unit": "can", "ingredient_package": { "quantity": "140", "unit": "g" } },
    { "name": "Mayonnaise", "quantity": "1/2", "unit": "cup" }
  ]
}
```

The container can be `jar`, `bag`, `can`, `bottle`, or `package`. When supplied,
the contents must be a positive quantity in `g`, `kg`, `ml`, `l`, or `piece`.
With an existing ingredient, identify it by `ingredient_id` to change its
buying preference when a package size is missing. A request that repeats the
saved presentation is accepted. Change a saved size using the ingredient
shopping-profile endpoint. If `ingredient_package` is omitted, an existing preference
is retained and a new ingredient starts with recipe measurements. A name
that resolves to a preexisting ingredient cannot configure its profile in a meal
request. Invalid rows return `422` under `errors.ingredients`, atomically rolling
back the meal, newly drafted ingredients, and their profiles.

Recipe responses still include the read-only `package_quantity` and `package_unit`,
derived from the current purchasing profile for a package row, or null if the
contents are unknown. Writing the old top-level contents fields with non-null
values returns `422`. Direct measurements such as 140 g stay exact when the
ingredient's presentation changes.

## Ingredient measurement references

`GET /ingredients/:id/measurement_references` returns `data: []` when no
references exist. `PUT` and `PATCH` replace the whole set atomically. `[]`
clears it. These references belong to the ingredient independently of its
shopping profile. Both endpoints return `404` for missing ingredients.
These endpoints remain available for existing data and API consumers; the client
no longer asks users to configure measurement references.

```json
{
  "references": [
    {
      "kind": "density",
      "quantity": "13",
      "reference_quantity": "15",
      "source": "Product label or documented household measurement",
      "description": "13 g per 15 ml for the selected mayonnaise",
      "approximate": true
    }
  ]
}
```

There is at most one reference of each kind:

- `density`: `quantity` grams per `reference_quantity` ml.
- `piece_weight`: `quantity` grams per `reference_quantity` whole pieces.

`reference_quantity` defaults to 1. Keeping both measured quantities avoids
rounding a density such as 13/15 before summing the menu. Source and description
are required text. `approximate` defaults to true and accepts JSON booleans only.
The response's `data` is an array of saved reference objects, sorted by kind.
Malformed arrays, duplicate/unknown kinds, invalid quantities or booleans return
`422` with field errors and leave the previous set intact.

Culinary measures are derived from these references and the standard units;
they cannot be entered as independent contradictory factors. A density is
unnecessary when recipe and purchase both use mass; piece weight is unnecessary
when both use pieces. Volume↔pieces requires both references, through grams.
There is no inference from ingredient names, and calculation never fetches
external data. Preparation notes do not introduce cooking yields or peel losses.

## Ingredient shopping profiles

`GET /ingredients/:id/shopping_profile` returns `data: null` if unconfigured.
`PUT` and `PATCH` replace the whole presentation, returning `200` and the saved
object in `data`, including `ingredient_id`:

```json
{
  "mode": "package",
  "shopping_unit": "jar",
  "package_quantity": "390",
  "package_unit": "g"
}
```

| Mode | Allowed shopping unit | Package contents |
| --- | --- | --- |
| `bulk` | `g`, `kg`, `ml`, `l` | Must be absent/null |
| `piece` | `piece` | Must be absent/null |
| `package` | `jar`, `bag`, `can`, `bottle`, `package` | Optional; when supplied, positive quantity and `g`, `kg`, `ml`, `l`, or `piece` |

Packages can be saved with only `mode` and `shopping_unit`. Both content fields
must be absent/null together, or form a valid complete pair. Recipe container counts
remain calculable without contents; known contents also allow conversion from
recipe weights, volumes, or pieces. Invalid combinations return `422` with field errors and
preserve the previous presentation. `DELETE` returns `data: true`, retaining
measurement references and recipe quantities. Removing an unused ingredient
removes both its references and its shopping profile.

Buying setup also accepts an optional `piece_weight` object, allowing users to
record a habitual piece weight without a separate measurement form:

```json
{
  "mode": "bulk",
  "shopping_unit": "g",
  "piece_weight": { "quantity": "272", "reference_quantity": "1" }
}
```

The quantities mean grams for the specified number of pieces; `reference_quantity`
defaults to 1. They use the existing positive-quantity validation and exact stored
ratio. GET and successful saves include `piece_weight` when a reference exists.
Omitting the property preserves it; explicit null removes only the piece-weight
reference. Density references and recipe quantities remain unchanged. Unchanged
ratios preserve their original source, description, approximation flag, and IDs.
New or changed weights use internal provenance and are approximate; no source or
description is requested from the user. The profile and optional weight update
atomically; invalid nested data returns 422 under `errors.piece_weight` and rolls
back both. This reuses measurement-reference storage and needs no migration.

The old `base_unit`, `equivalences`, and `round_up` contract is removed. This is
a breaking backend change; the client must adopt these contracts separately.

## Shopping lists

`GET /menus/:id/shopping_list` returns a live grocery checklist, with exactly one
item per ingredient ID across the selected menu. Each scheduled occurrence
contributes `quantity × people_count ÷ servings`; compatible quantities accumulate
before display rounding. Other menus do not contribute.

Display rules:

- A recipe package count maps to the ingredient’s current buying container.
  For example, one recipe package produces one can if the ingredient is bought
  in cans, and one jar if its buying preference changes to jars.
- Known buying contents also convert compatible recipe weights, volumes, and
  pieces to containers. Sum all occurrences before rounding to the nearest whole
  container (half rounds up). If that would give zero, retain the required canonical
  amount using known contents, or the fractional container count without contents.
  For a 390 g jar: 36.67 g stays 36.67 g, 195 g and 380 g display 1 jar,
  and 585 g displays 2 jars. This display rule can round below the exact need.
- Without a profile, package-only requirements use the recipe container label
  when all rows share it, or the generic package label when they differ.
- Unknown contents still allow a package count. If mixed
  measures cannot be combined completely, return one name-only item instead of
  a partial purchase; other ingredients still calculate.
- Otherwise, configured buying units select the canonical target (g, ml, or piece).
  Without a profile the target follows the existing g/ml/piece priority.
- Standard units normalize automatically. Existing ingredient references may
  bridge dimensions, but users do not have to supply references.
- If any quantity cannot convert, the ingredient is returned once without a
  quantity. No partial purchase totals or reference-correction warnings are emitted.
- Fully calculated pieces round upward after accumulation. Mass and volume
  display in canonical g/ml. Ingredient names and categories remain unchanged.

Example name-only grocery:

```json
{
  "ingredient_id": 12,
  "name": "Mayonnaise",
  "shopping_category": "pantry",
  "quantity": null,
  "unit": null,
  "status": "unquantified",
  "required_quantity": null,
  "required_unit": null
}
```

`quantity` and `unit` are either both populated or both null. `status` is
`calculated`, `approximate`, or `unquantified`. `required_quantity` and
`required_unit` remain as API metadata for calculated items (the unrounded need,
with three-place display precision); they are null for name-only items.
`presentation` is included when configured. `approximate: true` is present only
when a used reference is approximate. The client displays no calculation metadata.

The response retains `menu_id`, `from`, `to`, `people_count`, the ordered category
catalog, `items`, and `meals_without_ingredients`. `conversion_warnings` is retained
as an always-empty array for compatibility; its emptiness no longer promises all
quantities converted. Recipes without ingredients remain listed once, since those
recipes contribute no products. Partially entered recipes cannot be detected.
Items sort by category position, lowercase name, then ingredient ID. Empty menus
return empty item/warning/missing-recipe arrays. Calculations are live, including
for saved menus.

Accumulation and reference ratios use exact rational arithmetic. Decimal display
rounds to three places, halfway away from zero; positive values below that
precision stay visible as `0.001`. No pantry stock is subtracted and Rails stores
no shopping checklist marks or manual shopping adjustments.

This changes the checklist contract: clients must support null amounts and must
not expect multiple partial lines or `incomplete` conversion warnings.

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
  "data": [
    ["breakfast", 1],
    ["lunch", 2],
    ["dinner", 3]
  ]
}
```

## CORS

Development origins are configured in [`config/initializers/cors.rb`](../config/initializers/cors.rb). Localhost and `127.0.0.1` origins on any development port are allowed so Vite can use the next available port when the default is occupied.
