# Client ingredient and shopping-list implementation plan

Status: client implementation and regression coverage updated. Source/diff review
completed; automated verification, rendered review, and Rails integration remain
pending under the repository opt-in policy.

## Objective and scope

Adapt the client to the backend measurement and shopping contracts introduced
in commit `00692a0`. Users should enter recipes using familiar quantities and
receive a practical shopping list: whole onions, jars when the accumulated need
reaches the configured presentation, and weight or volume for smaller needs.

Preserve the current Comal design, mobile-first behavior, receipt layout,
navigation, previews, and dedicated editor pages. Use existing Greda primitives,
React Hook Form, and React Query conventions from `../client/AGENTS.md`.

Use the Impeccable skill for UI implementation as a refinement of existing
Operate surfaces. Follow `DESIGN.md`, retain Greda and the single-preview
navigation model, and read Impeccable's `craft-floor` immediately before UI
edits. Perform rendered review at the supported sizes when verification is
authorized. Document review alone does not establish visual quality.

This is a client implementation plan, not a backend redesign. The authoritative
contracts are in [the API reference](api.md). The backend changes have not been
verified by an automated test run; matching browser mocks will not establish
actual Rails integration.

## Agreed behavior

- Recipe servings are explicit and required on creation.
- Standard culinary measures are a 240 ml cup, 15 ml tablespoon, and 5 ml
  teaspoon. Ingredient references bridge weight, volume, and pieces.
- API identifiers use English, including `piece`, `jar`, `cup`, `tablespoon`,
  and `teaspoon`. Visible labels are translated independently.
- Recipes can repeat an ingredient in separate rows.
- Recipe containers record their own contents, such as one 140 g can. Changing
  the habitual buying presentation must not change those recipe quantities.
- Whole-piece shopping quantities always round upward after accumulation.
- Package quantities below one configured container remain in canonical units:
  20 g of mayonnaise stays 20 g. At or above the threshold, Rails returns whole
  packages rounded upward.
- Missing conversions preserve all quantities and explicitly mark the ingredient
  incomplete, even when only one unresolved measure remains.
- Rails calculates shopping totals and rounding. The client displays its result.

## 1. Update contracts, API access, and translations

Primary files: `client/src/types.ts`, `client/src/api.ts`,
`client/src/queryKeys.ts`, and the English/Spanish translation catalogs.

- Add recipe `servings`, recipe container contents, and unit dimension,
  canonical-unit, and factor metadata. Handle null metadata for package units.
- Replace the legacy shopping-profile fields with `mode`, `shopping_unit`,
  `package_quantity`, and `package_unit`. Remove client assumptions about
  `base_unit`, `equivalences`, and `round_up`.
- Add read and replacement operations for ingredient measurement references.
  Model `density` and `piece_weight`, measured numerator and denominator,
  source, description, and approximation flag.
- Add shopping-item `status`, `required_quantity`, `required_unit`, and optional
  `presentation`. Adopt the `measurement_reference_missing` warning reason.
- Translate the new English unit codes into singular/plural labels in both
  languages. Do not translate identifiers in outgoing payloads.
- Map new API error fields to understandable labels, including servings,
  references, buying mode, and container contents.

Acceptance: types, API helpers, and labels describe the actual backend contract
without a compatibility layer for the removed profile shape.

## 2. Adapt recipe editing and details

Primary files: `client/src/features/meals/MealForm.tsx`,
`IngredientManager.tsx`, and `MealDetails.tsx`.

- Add a required serving-count field explaining that it applies to the entered
  ingredient quantities. Load and preserve the saved value when editing; do not
  silently assume one person for a new recipe.
- Replace quantity inputs that reject fractions. Support familiar positive
  decimals and fractions such as `1/2`, `½`, and `1 ½`, retaining the draft text
  for submission. Match the backend's supported range and precision; let Rails
  remain the authoritative validator.
- Permit repeated ingredient selections with independent quantities and notes.
  Keep dynamic rows in React Hook Form's `useFieldArray` with stable row IDs.
- For a package unit, reveal content per container and a content-unit selector.
  Permit g, kg, ml, l, or pieces, following the API contract.
- Offer the habitual buying presentation as an explicit way to fill those
  fields. Load it only when needed; allow manual contents when no presentation
  exists or the ingredient is still an unsaved recipe draft.
- Preserve recipe container contents when editing. Do not refresh them from the
  current buying presentation. Remove irrelevant content fields when submitting
  an ordinary measure.
- Changing the ingredient invalidates the previous ingredient's suggested
  package contents. Require the new ingredient's contents to be confirmed before
  saving; never silently carry a tuna can's size into another ingredient.
- Changing between container types also requires contents to be reconfirmed.
  Changing to an ordinary measure clears package fields and their validation
  errors. Returning to a container must not silently restore unconfirmed contents.
- Filling from a habitual presentation is an explicit action. If it would
  overwrite edited contents, require confirmation. Late responses for a previous
  ingredient, unit, or removed row must not populate the current row.
- Display servings and package contents in recipe details and previews, such as
  “1 can of 140 g”, using localized labels.

Acceptance: saving and reopening a recipe preserves servings, fractions as valid
quantities, repeated rows, and the meaning of every recipe container. Missing
conversion references do not prevent saving an otherwise valid recipe.
Changing ingredient or container type cannot silently reuse a content snapshot
that the user has not confirmed for the new selection.

## 3. Separate buying setup from measurement references

Primary files: `client/src/features/ingredients/IngredientForm.tsx`,
`IngredientShoppingSummary.tsx`, `IngredientShoppingEditor.tsx`,
`IngredientShoppingFields.tsx`, and `shoppingProfileForm.ts`. Introduce focused
reference components where needed.

### How I buy it

- Offer bulk weight/volume, whole pieces, or a package.
- Bulk accepts g, kg, ml, or l. Pieces do not require a weight reference.
- Packages request a container type, content quantity, and content unit,
  including pieces for presentations such as a six-egg package.
- Explain the selected presentation without inventing sizes or weights.
- Removing buying setup must retain the ingredient's measurement references.

### Measurements used in recipes

- Allow adding, editing, and removing weight/volume and weight/piece references
  independently of buying setup.
- Use familiar capture language, such as “One tablespoon weighs 13 g”, rather
  than requiring users to understand density. Use `/units` metadata when
  translating the entered reference to the API's measured ratio; do not hardcode
  culinary factors or round a ratio into a density before saving.
- Keep the measured relationship as the primary input. Use understandable
  source choices such as product label or personal measurement, with additional
  source details progressively disclosed. The API requires source and description
  text, not a URL; never invent a documentary source. Clearly expose whether the
  reference is approximate.
- Show derived equivalents as read-only information. Edit the original measured
  reference rather than independent cup/spoon conversion factors.
- On reopening, show the stored grams-per-ml or grams-per-piece relationship
  faithfully. The API does not retain the originally entered culinary unit;
  do not claim to recover it. Offer culinary measures for explicitly changing
  the reference, preserving the exact stored numerator and denominator when
  the relationship is unchanged.
- Preserve the other reference kind when saving a change: the endpoint replaces
  the complete collection. An empty array explicitly clears the collection.
- Load the complete reference set before initializing an editable draft or
  allowing a replacement save. Distinguish an empty successful response from a
  failed or pending request. Removing one kind must submit the other unchanged.
- Background refreshes must not reset dirty reference drafts. Keep existing
  input on refresh errors and require a successful load before allowing editing
  when the complete reference set has never been obtained.

Give the two sections independent Save, Cancel, loading, retry, and error states.
They use separate endpoints; do not imply that one combined save is atomic.
Preserve unsaved drafts during errors and protect navigation away from dirty forms.
Saving a section confirms that save locally and leaves other drafts intact;
it does not close the page. Provide a separate Done action to finish editing
and return to the origin, applying the existing dirty-draft protection if any
section still has unsaved changes. For a new standalone ingredient, obtain its
persisted ID and continue on its edit page before saving either configuration
section, retaining the original return context.

Acceptance: users can configure pieces without weights, maintain a single useful
measurement reference, and change or remove a buying presentation without losing
that reference or changing recipes.
Failed loads and background refreshes cannot turn unknown references into an
empty replacement or discard unsaved input in another section.

## 4. Adapt the supermarket receipt

Primary files: `client/src/features/menu/ShoppingReceipt.tsx`,
`ShoppingListContent.tsx`, and the existing ingredient preview/editor navigation.

- Keep the API's quantity and unit as the main line: “Onion — 3 pieces”,
  “Mayonnaise — 20 g”, or “Mayonnaise — 2 jars”. Do not implement another
  conversion or purchase-rounding engine in the client.
- Offer a compact detail showing the need before purchase rounding, with the
  precision returned by the API, and the configured presentation. The returned
  `required_quantity` has three decimal places of display precision; it is not
  the exact mathematical total. Keep supplementary information out of the
  primary checklist hierarchy.
- Distinguish calculation completeness, approximation, and cart state with
  readable, localized text, not color alone. An `incomplete` line can also have
  `approximate: true`; do not make those indicators mutually exclusive.
- For incomplete ingredients, keep every returned requirement visible and make
  the missing conversion actionable through a “Complete reference” entry point.
- Group an incomplete ingredient's lines conceptually and provide one correction
  action for that ingredient. Open its existing editor page with the measurement
  section expanded and focused. Explain the missing relationship using the
  warning's source and target units; volume-to-piece conversion may require both
  density and piece weight. Do not promise that one reference always resolves it.
- Return to the same shopping list after correcting a reference. Reuse the
  existing editor and return-context mechanisms rather than introducing another
  dialog system.
- Checking shopping items must not hide unresolved conversion notices. The
  shopping progress indicator must not imply that incomplete calculation is fixed.
  Keep checks meaning “this displayed quantity is in the cart” and show a separate
  count of ingredients whose calculation remains unresolved.
- After a reference save, retain the origin and allow further corrections before
  Done returns to the same list. If recalculation fails, show the save as successful
  and the list as pending refresh, with retry; do not imply the reference save
  failed or display an old receipt as a newly resolved calculation.
- Preserve missing-recipe notices, loading/retry states, cached-result error
  handling, people controls, and the existing responsive column layout.

Acceptance: the receipt displays Rails results faithfully and makes incomplete
calculations understandable and correctable without losing shopping context.

## 5. Synchronize caches and checklist state

Primary files: ingredient, meal, and menu `queries.ts` files,
`client/src/queryKeys.ts`, and `ShoppingReceipt.tsx`.

- Introduce React Query keys and hooks for measurement references. Fetch
  references and profiles in their consuming surfaces instead of prefetching
  every ingredient's configuration.
- Synchronize successful reference/profile responses and invalidate affected
  shopping lists. Removing a profile retains reference caches; deleting an
  ingredient removes both kinds of cached configuration.
- Preserve existing synchronization of saved meals in the library, details,
  and nested menu data.
- Deduplicate recipe usage in ingredient catalog cache updates. The existing
  save loop can append the same recipe more than once when ingredient rows repeat.
- Revise checklist identity to account for presentation content and incomplete
  states. A change from a 390 g jar to an 850 g jar must invalidate a previous
  check even when both lines display “1 jar”. Preserve checks for unchanged
  purchases and avoid collisions between partial requirement lines.
- Base purchase identity on ingredient ID, displayed quantity/unit, presentation
  contents, and whether the calculation is incomplete. A change only to the
  internal need, such as 300 g to 320 g with the same purchased jar, retains the
  check. A transition to or from incomplete clears affected checks. Use a new
  local-storage format version and discard old-format checks instead of guessing
  which changed purchase they represent.
- Preserve selected week, scroll, filters, unfinished people input, previews,
  and unsaved editor drafts through configuration visits.

Acceptance: successful saves update all relevant views, quantities are not stale,
and shopping checks continue to mean that the displayed purchase is in the cart.

## 6. Update examples, regression coverage, and documentation

Update `client/src/demoData.ts`, `client/tests/fixtures/`, the existing Playwright
specs, and [the client guide](client.md) together with the implementation.

Distinct regression cases should cover:

- Required servings and correct submitted fractions.
- Repeated ingredient rows and unique recipe usage in the catalog.
- Recipe can/jar contents surviving edit and a later buying-presentation change.
- Ingredient/container changes requiring fresh confirmation, normal-unit changes
  clearing package fields/errors, and late responses not overwriting current rows.
- Independent reference and presentation saves, removals, retries, and errors.
- Reference load errors differing from empty results, deletion retaining the
  other kind, exact measured ratios surviving unchanged edits, and refreshes
  preserving dirty drafts.
- English API codes with correct Spanish and English visible labels.
- Whole-piece results, sub-container needs, and whole-container results as
  returned by Rails.
- A single unresolved unit marked incomplete, correction from the receipt,
  recalculation, and return to the same context.
- Incomplete and approximate indicators coexisting, multiple partial lines sharing
  one correction action, and unresolved counts remaining visible after cart checks.
- Section saves preserving other drafts, newly created ingredients continuing
  into configuration, Done/Cancel and browser Back/Forward preserving the return
  context, and failed recalculation offering retry after a successful save.
- Cache refresh and checklist invalidation when presentation contents change.
- Unchanged physical purchases retaining checks despite internal-need changes,
  transitions to/from incomplete clearing them, and old-format checks being discarded.
- Form usability at 320 px, 800 px, and desktop, wrapping labels, keyboard access,
  focus on the correction section and first invalid field, and error messages
  associated with their inputs.
- Lazy request behavior when browsing, opening an editor, or choosing a container.

Browser fixtures must match the final Rails payloads. Browser mocks verify
capture, navigation, and presentation; they do not verify Rails calculations.
Verify actual Rails integration separately when verification is authorized.

Follow the repository's opt-in verification policy: update coverage during
implementation, but do not run tests, builds, type checks, browser automation, or
verification servers without authorization. Any explicit later instructions about
verification take precedence. Record executed commands and coverage limits when
verification occurs.

## Implementation order and completion criteria

Implement contracts and translations first, then recipe forms, ingredient
configuration, receipt/caches, and finally the remaining coverage and documentation.
Deliver the coordinated client change against the new backend contract; an
intermediate stage is not a complete usable flow.

The work is complete when a user can enter recipe measures and servings, define
only the ingredient references actually needed, configure how the ingredient is
bought, and obtain or repair a shopping result through the existing interface.
Do not add pantry inventory, prices, automatic package-size optimization,
multiple habitual presentations, or a general visual redesign to this scope.

## Implementation record

Implemented the client contracts, localized unit labels, required recipe servings,
fraction drafts, repeated rows, and recipe container snapshots. Buying setup and
measurement references now use independent forms and endpoints. Receipt warnings
link to the focused measurement editor and preserve the list origin. Reference
saves replace a successfully loaded complete set; section saves retain other
drafts. Purchase checks use v2 identity with presentation contents and incomplete
state. Examples, deterministic browser fixtures, regression cases, and the client
guide were updated together.

No tests, builds, type checks, linters, verification servers, or browser automation
were run. Visual review at the supported widths and actual Rails integration are
still pending; source/diff review does not establish either.
