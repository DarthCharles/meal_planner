import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures/app";

async function openMealDialog(page: Page) {
  await page.goto("/");
  await page.getByRole("heading", { name: "Wednesday" }).waitFor();
  const trigger = page
    .getByRole("navigation")
    .getByRole("button", { name: /Add meal/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "A new favorite" });
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

test("places focus in the dialog, contains keyboard navigation, and restores focus on Escape", async ({
  page,
}) => {
  const { dialog, trigger } = await openMealDialog(page);
  await expect(
    dialog.getByRole("heading", { name: "A new favorite" }),
  ).toBeFocused();
  await expect(
    dialog.getByRole("button", { name: "Save meal", exact: true }),
  ).toBeVisible();
  const first = dialog.getByRole("button", { name: "Close", exact: true });
  const last = dialog.getByRole("button", { name: "Save meal", exact: true });
  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("makes the background inert and restores scroll settings after closing", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("heading", { name: "Wednesday" }).waitFor();
  await page.evaluate(() => {
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "scroll";
  });
  const trigger = page
    .getByRole("navigation")
    .getByRole("button", { name: /Add meal/ });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  await page
    .getByRole("button", { name: "Open profile", includeHidden: true })
    .evaluate((element) => (element as HTMLElement).focus());
  expect(
    await dialog.evaluate((element) =>
      element.contains(document.activeElement),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => [
      document.body.style.overflow,
      document.documentElement.style.overflow,
    ]),
  ).toEqual(["hidden", "hidden"]);
  const initialScroll = await page.evaluate(() => scrollY);
  await page.mouse.move(5, 5);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(initialScroll);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(
    await page.evaluate(() => [
      document.body.style.overflow,
      document.documentElement.style.overflow,
    ]),
  ).toEqual(["auto", "scroll"]);
  await expect(trigger).toBeFocused();
});

test("only dismisses on a backdrop click that starts outside the panel", async ({
  page,
}) => {
  const { dialog, trigger } = await openMealDialog(page);
  const title = dialog.getByRole("heading", { name: "A new favorite" });
  await title.click();
  await expect(dialog).toBeVisible();
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

test("supports closing while options are loading without creating a form", async ({
  page,
  api,
}) => {
  let release!: () => void;
  api.readBarriers["/units"] = new Promise<void>((resolve) => {
    release = resolve;
  });
  const { dialog, trigger } = await openMealDialog(page);
  await expect(dialog.getByText("Loading meal options…")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  release();
  await trigger.click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Save meal", exact: true }),
  ).toBeVisible();
  expect(api.saves).toEqual([]);
});

test("a dismissed pending save cannot close the next meal dialog", async ({
  page,
  api,
}) => {
  let release!: () => void;
  api.saveBarrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.goto("/");
  await page.getByRole("heading", { name: "Wednesday" }).waitFor();
  const nav = page.getByRole("navigation");
  await nav.getByRole("button", { name: /My meals/ }).click();
  await page
    .getByRole("button", { name: "Edit Huevos a la mexicana", exact: true })
    .click();
  const oldDialog = page.getByRole("dialog", { name: "Edit this favorite" });
  await page.getByLabel("Meal name", { exact: true }).fill("First draft");
  await oldDialog
    .getByRole("button", { name: "Update meal", exact: true })
    .click();
  await expect(
    oldDialog.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(oldDialog).toHaveCount(0);
  await nav.getByRole("button", { name: /Add meal/ }).click();
  const dialog = page.getByRole("dialog", { name: "A new favorite" });
  await page.getByLabel("Meal name", { exact: true }).fill("Second draft");
  release();
  // Wait until the old mutation's cache update has reached the underlying library.
  await expect(
    page.getByRole("heading", { name: "First draft", includeHidden: true }),
  ).toHaveCount(1);
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Save meal", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Meal name", { exact: true })).toHaveValue(
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
  await page
    .getByRole("button", { name: "Replace dialog", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(
    page.getByRole("dialog", { name: "Second dialog" }),
  ).toBeVisible();
  await expect(page.getByLabel("Draft", { exact: true })).toHaveValue(
    "Fresh draft",
  );
  await page
    .getByRole("button", { name: "Invoke previous close", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Second dialog" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close through context", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
