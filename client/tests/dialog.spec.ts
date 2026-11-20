import type { Page } from "@playwright/test";

import { cancelEditor, editorScreen, expect, test } from "./fixtures/app";

async function openMealPreview(page: Page) {
  await page.goto("/");
  const trigger = page
    .getByRole("button", { name: "View Breakfast: Huevos a la mexicana", exact: true })
    .first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Huevos a la mexicana", exact: true });
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

test("contains preview focus and restores the meal trigger after Escape", async ({ page }) => {
  const { dialog, trigger } = await openMealPreview(page);
  await expect(
    dialog.getByRole("heading", { name: "Huevos a la mexicana", exact: true }),
  ).toBeFocused();
  const first = dialog.getByRole("button", { name: "Close", exact: true });
  const last = dialog.getByRole("button", { name: "Edit meal", exact: true });
  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("only dismisses a preview when the pointer starts on its backdrop", async ({ page }) => {
  const { dialog, trigger } = await openMealPreview(page);
  const title = dialog.getByRole("heading", { name: "Huevos a la mexicana", exact: true });
  const box = (await title.boundingBox())!;
  await page.mouse.move(box.x + 3, box.y + 3);
  await page.mouse.down();
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("opens creation as a page and allows cancel while reference data loads", async ({
  page,
  api,
}) => {
  let release!: () => void;
  api.readBarriers["/units"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/meals");
  const trigger = page.getByRole("button", { name: "+ Add meal", exact: true });
  await trigger.click();
  await expect(page).toHaveURL("/meals/new");
  await expect(
    editorScreen(page).getByRole("heading", { name: "A new favorite", exact: true }),
  ).toBeFocused();
  await expect(editorScreen(page).getByText("Loading meal options…")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await cancelEditor(page);
  await expect(trigger).toBeFocused();
  release();
  expect(api.saves).toEqual([]);
});

test("protects an unsaved editor on browser Back and allows keeping the draft", async ({
  page,
}) => {
  await page.goto("/meals");
  await page.getByRole("button", { name: "+ Add meal", exact: true }).click();
  await editorScreen(page).getByLabel("Meal name", { exact: true }).fill("Keep this draft");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.goBack();
  await expect(page).toHaveURL("/meals/new");
  await expect(editorScreen(page).getByLabel("Meal name", { exact: true })).toHaveValue(
    "Keep this draft",
  );
  await cancelEditor(page);
  await expect(page).toHaveURL("/meals");
});

test("an old save cannot leave a subsequently opened editor", async ({ page, api }) => {
  let release!: () => void;
  api.saveBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/meals");
  await page.getByRole("button", { name: "Edit Huevos a la mexicana", exact: true }).click();
  await editorScreen(page).getByLabel("Meal name", { exact: true }).fill("First draft");
  await editorScreen(page).getByRole("button", { name: "Update meal", exact: true }).click();
  await expect(
    editorScreen(page).getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  await cancelEditor(page);
  await page.getByRole("button", { name: "+ Add meal", exact: true }).click();
  await editorScreen(page).getByLabel("Meal name", { exact: true }).fill("Second draft");
  release();
  await expect(page.getByRole("heading", { name: "First draft", includeHidden: true })).toHaveCount(
    1,
  );
  await expect(page).toHaveURL("/meals/new");
  await expect(editorScreen(page).getByLabel("Meal name", { exact: true })).toHaveValue(
    "Second draft",
  );
});

test("replaces generic dialog content with fresh state and ignores an older close callback", async ({
  page,
}) => {
  await page.goto("/tests/fixtures/dialog-harness.html");
  const trigger = page.getByRole("button", {
    name: "Open test dialog",
    exact: true,
  });
  await trigger.click();
  await page.getByLabel("Draft", { exact: true }).fill("Changed draft");
  await page.getByRole("button", { name: "Replace dialog", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByRole("dialog", { name: "Second dialog" })).toBeVisible();
  await expect(page.getByLabel("Draft", { exact: true })).toHaveValue("Fresh draft");
  await page.getByRole("button", { name: "Invoke previous close", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Second dialog" })).toBeVisible();
  await page.getByRole("button", { name: "Close through context", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("keeps menu keyboard dismissal and opens its creation action as a page", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Menu", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("dialog", { name: "Navigation menu", exact: true });
  await expect(menu.getByRole("link", { name: "My Menu", exact: true })).toBeFocused();
  await expect(menu.getByRole("link")).toHaveCount(4);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole("button", { name: "Add a meal", exact: true }).click();
  await expect(page).toHaveURL("/meals/new");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(editorScreen(page)).toBeVisible();
  await cancelEditor(page);
  await expect(trigger).toBeFocused();
});
