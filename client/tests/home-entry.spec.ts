import type { Page, TestInfo } from "@playwright/test";

import { expect, test } from "./fixtures/app";

async function captureEntry(page: Page, testInfo: TestInfo, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const screenshot = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  await testInfo.attach(name, { path: screenshot, contentType: "image/png" });
}

test(
  "keeps home entry states readable and actionable on a phone",
  { tag: "@responsive" },
  async ({ page, api }, testInfo) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Today’s menu" })).toBeVisible();
    const controls = page.getByRole("banner").getByRole("button");
    for (const control of await controls.all()) {
      const box = (await control.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    await captureEntry(page, testInfo, "home-loaded");
    const styles = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return { background: body.backgroundColor, text: body.color, font: body.fontFamily };
    });
    await testInfo.attach("palette", {
      body: JSON.stringify(styles),
      contentType: "application/json",
    });

    api.readErrors["/menus"] = "Connection details";
    await page.reload();
    await expect(page.getByText("We couldn’t load your menu. Please try again.")).toBeVisible();
    await captureEntry(page, testInfo, "home-error");
    api.menus = [];
    api.meals = [];
    delete api.readErrors["/menus"];
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    const create = page.getByRole("button", { name: "Add your first recipe", exact: true });
    await expect(create).toBeVisible();
    await captureEntry(page, testInfo, "home-empty");
    await create.click();
    await expect(page).toHaveURL("/meals/new");
    const editor = page.getByRole("region", { name: "A new favorite", exact: true });
    await editor.getByLabel("Meal name", { exact: true }).fill("Vegetable soup");
    await page.getByLabel("Recipe servings", { exact: true }).fill("2");
    await editor.getByLabel("Description", { exact: true }).fill("An easy dinner.");
    await editor.getByRole("button", { name: "Dinner", exact: true }).click();
    await editor.getByRole("button", { name: "Save meal", exact: true }).click();
    await expect(page).toHaveURL("/");
    await expect(editor).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Add a recipe", exact: true })).toBeVisible();
    expect(api.saves).toHaveLength(1);

    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("button", { name: "Español", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: "Menú de navegación", exact: true }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Agregar una receta", exact: true }),
    ).toBeVisible();
    await captureEntry(page, testInfo, "home-empty-spanish");
  },
);
