import { test as base, expect } from "@playwright/test";
import type { MealForm, Menu } from "../../src/types";
import { meals, mealTypes, menu, units } from "./data";

type SaveRequest = { method: string; path: string; body: MealForm };
type MockApi = {
  menus: Menu[];
  unavailable: boolean;
  generationError: string | null;
  saveError: string | null;
  initialBarrier?: Promise<void>;
  generationBarrier?: Promise<void>;
  saveBarrier?: Promise<void>;
  generationRequests: number;
  saves: SaveRequest[];
};

export const test = base.extend<{ api: MockApi; runtimeErrors: void }>({
  api: [
    async ({ page }, use) => {
      const api: MockApi = {
        menus: structuredClone([menu]),
        unavailable: false,
        generationError: null,
        saveError: null,
        generationRequests: 0,
        saves: [],
      };
      // Keep weekday ordering and date labels independent of the machine's clock.
      await page.clock.setFixedTime(new Date("2026-10-21T12:00:00Z"));
      // Browser tests must also work without access to Google Fonts.
      await page.route(
        /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
        (route) => route.abort(),
      );
      await page.route("http://127.0.0.1:4174/**", async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        const headers = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        };
        if (request.method() === "OPTIONS") {
          await route.fulfill({ status: 204, headers });
          return;
        }
        if (api.unavailable) {
          await route.abort();
          return;
        }
        const respond = (data: unknown) =>
          route.fulfill({ json: { data }, headers });
        const fail = (errors: string) =>
          route.fulfill({ status: 422, json: { errors }, headers });
        if (request.method() === "GET") {
          await api.initialBarrier;
          if (path === "/menus") return void (await respond(api.menus));
          if (path === "/meals") return void (await respond(meals));
          if (path === "/meal_types") return void (await respond(mealTypes));
          if (path === "/units") return void (await respond(units));
        }
        if (path === "/menus/generate" && request.method() === "POST") {
          api.generationRequests++;
          await api.generationBarrier;
          if (api.generationError)
            return void (await fail(api.generationError));
          return void (await respond(menu));
        }
        if (
          (path === "/meals" && request.method() === "POST") ||
          (path === "/meals/1" && request.method() === "PUT")
        ) {
          const body = request.postDataJSON() as MealForm;
          api.saves.push({ method: request.method(), path, body });
          await api.saveBarrier;
          if (api.saveError) return void (await fail(api.saveError));
          return void (await respond({
            ...body,
            id: request.method() === "POST" ? 4 : 1,
            meal_types: mealTypes
              .filter(([, id]) => body.meal_type_ids.includes(id))
              .map(([name]) => name),
          }));
        }
        throw new Error(`Unexpected API request: ${request.method()} ${path}`);
      });
      await use(api);
    },
    { auto: true },
  ],
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use();
      expect(errors, "Uncaught browser errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
