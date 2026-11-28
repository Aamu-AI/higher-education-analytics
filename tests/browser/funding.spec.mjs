import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("degree awards links to a reconciled completion comparison and download", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Funding and completion time" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Funding and completion time");
  await expect(page.getByText("205 of 300", { exact: true })).toBeVisible();
  const comparison = page.getByRole("table", { name: "2025 completion times and award counts" });
  await expect(comparison.getByRole("row", { name: "On time 157 8,342" })).toBeVisible();
  await expect(comparison.getByRole("row", { name: "Total awards 205 10,535" })).toBeVisible();
  await expect(comparison.getByRole("row", { name: "Share on time 76.6% 79.2%" })).toBeVisible();
  await expect(page.getByText("publisher update", { exact: false })).toBeVisible();
  const event = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download completion CSV" }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe("completion-time-2025.csv");
  const csv = await readFile(await download.path(), "utf8");
  expect(csv).toContain('"release_id","awards_input_hash","source","source_url"');
  expect(csv).toContain('"205","157","28","20","76.6","300"');
  expect(csv).toContain('"10535","8342","1497","696","79.2"');
  expect(csv).toContain('"671101","Sairaanhoitaja (AMK)"');
  await page.getByRole("link", { name: "Degree awards" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Degree awards");
});

test("the funding page and its tables reflow with keyboard-operable details", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/funding");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to funding" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const qualifications = page.locator("summary").filter({ hasText: "Compare Arcada’s qualifications" });
  for (let index = 0; index < 12 && !(await qualifications.evaluate((el) => el === document.activeElement)); index++) {
    await page.keyboard.press("Tab");
  }
  await expect(qualifications).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("table", { name: /national qualification/ }).getByRole("row").nth(7)).toBeVisible();
  await page.getByText("See the national component weights").click();
  await expect(page.getByRole("table", { name: /Components under/ }).getByRole("row", { name: "External R&D funding 12%" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});
