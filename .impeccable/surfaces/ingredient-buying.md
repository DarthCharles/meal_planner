---
version: 1
slug: "ingredient-buying"
primary_target: "client/src/features/ingredients/IngredientShoppingSummary.tsx"
related_targets: ["client/src/features/ingredients/IngredientShoppingFields.tsx", "client/src/features/ingredients/IngredientShoppingEditor.tsx"]
---

# Ingredient buying setup

Mode: Operate. Improve the existing buying section within Comal's visual world.

Show the three methods together as accessible native radio choices. Keep fields
conditional, explain what reaches the receipt, and replace bare-unit summaries
with sentences. Weight/volume replaces the redundant g/kg/ml/l selection without
changing the API. Preserve existing units on unrelated saves. Package contents
remain optional recipe information; packaged groceries remain name-only.

Use Comal semantic tokens, Fraunces headings, DM Sans controls, visible field
labels, generous touch targets, and stacking on phones. Show field errors inline,
expand invalid package contents, and restore focus when editing ends. Keep
Save/Cancel primary and reset behind a secondary disclosure explaining retained
recipes and piece weights. Preserve independent ingredient drafts and dirty
navigation protection. Update both English and Spanish.

Source and diff review completed; regression coverage updated. Before committing,
`npm run build` and `npx tsc -p tsconfig.tests.json` passed. The build reported a
bundle-size warning. Tests were skipped at the user's explicit request; rendered
browser review remains pending. No backend contract changes or raster assets.
