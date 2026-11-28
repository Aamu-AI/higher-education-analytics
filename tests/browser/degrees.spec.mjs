import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("funding definitions, shared URLs and CSV agree on Arcada’s 2025 figures", async ({
  page,
}) => {
  await page.goto("/?view=awards");
  const total = page.getByRole("region", {
    name: "Degrees awarded",
    exact: true,
  });
  await expect(total).toContainText("573");
  await page.getByLabel("Funding definition").selectOption("included");
  await expect(total).toContainText("561");
  await expect(
    page.getByRole("region", { name: "Bachelor’s target attainment" }),
  ).toContainText("477 of 635");
  await page.getByLabel("Funding definition").selectOption("all");
  await expect(total).toContainText("573");
  await page.reload();
  await expect(total).toContainText("573");
  await page.getByLabel("Degree level").selectOption("bachelor");
  await expect(total).toContainText("489");
  const ready = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const csv = await readFile(await (await ready).path(), "utf8");
  expect(csv).toContain("https://creativecommons.org/licenses/by/4.0/"); // Licence URL and release metadata travel with every export.
  expect(csv).toContain("opiskelijat_ja_tutkinnot");
  expect(csv).toContain("All funding sources");
  expect(csv).toContain('"Finnish UAS sector"');
  expect(csv).toContain('"Selected comparison"');
  await page.getByLabel("Reporting year").selectOption("2024");
  await expect(total).toContainText("478");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(total).toContainText("573");
});

test("mobile filters and the equivalent trend table work with the keyboard", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?view=awards");
  await page.getByRole("button", { name: "Open filters" }).click();
  await page.getByLabel("Reporting year").selectOption("2024");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open filters" }),
  ).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Degrees awarded", exact: true }),
  ).toContainText("562");
  await page
    .getByRole("button", { name: "Show annual trend as a table" })
    .click();
  await expect(
    page.getByRole("table", { name: "Degree awards by year and level" }),
  ).toContainText("478");
  await page.getByRole("button", { name: "Source notes" }).click();
  await expect(page.getByRole("dialog")).toContainText("Source differences");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
