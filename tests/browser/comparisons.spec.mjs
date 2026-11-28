import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("ICT awards and the entire funding group have separate ranks, exports and periods", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".gap-note")).toContainText("84 degrees below");
  const groups = page.getByRole("table", { name: /Ministry groups/ });
  await expect(
    groups.getByRole("row", { name: /Education, arts and social/ }),
  ).toContainText("108.9%");
  await page
    .getByLabel("Field of education")
    .selectOption({ label: "Information and communication technology" });
  const ranking = page.getByRole("table", { name: "Ministry group ranking" });
  await expect(ranking.locator("tbody tr")).toHaveCount(22);
  const own = ranking.locator("tr").filter({ hasText: "Arcada" });
  await expect(own).toContainText("Ceiling 120");
  await expect(own).toContainText("53.1%");
  await expect(
    page
      .getByRole("table", { name: "Annual field ranking" })
      .locator("tbody tr"),
  ).toHaveCount(22);
  await expect(ranking.locator("tbody tr").last()).toContainText(
    "No ceiling listed for group",
  );
  const ready = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export comparison CSV" }).click();
  const csv = await readFile(await (await ready).path(), "utf8");
  expect(csv).toContain('"Group ranking","02535"');
  expect(csv).toContain('"Field ranking","02535"');
  await page.getByLabel("Reporting year").selectOption("2021");
  await expect(own).toContainText("Three comparable years unavailable");
  await page.getByLabel("Reporting year").selectOption("2022");
  await expect(groups).toContainText("2020–2022 average");
});

test("annual peer lines and rank coverage follow filters and survive reload", async ({
  page,
}) => {
  await page.goto("/?view=awards");
  const ranking = page.getByRole("table", {
    name: "Annual institution rankings",
  });
  await expect(ranking.locator("tbody tr")).toHaveCount(22);
  await expect(
    page
      .getByRole("table", { name: "Degree counts by year" })
      .getByRole("row", { name: /2025 573 22/ }),
  ).toBeVisible();
  await ranking.getByRole("checkbox", { name: "Laurea" }).click();
  await page.getByRole("button", { name: "Rank over time" }).click();
  await page.reload();
  const trend = page.getByRole("table", { name: "Rank by year", exact: true });
  await expect(
    trend.getByRole("columnheader", { name: "Laurea" }),
  ).toBeVisible();
  await expect(trend.getByRole("row", { name: /^2020/ })).toContainText("22");
  await page.getByLabel("Compare with").selectOption("02629");
  const comparison = page.getByRole("table", {
    name: "Awards by school and field",
  });
  await expect(
    comparison.getByRole("columnheader", { name: "Laurea" }),
  ).toBeVisible();
  await page
    .getByLabel("Field of education")
    .selectOption({ label: "Arts and culture" });
  await expect(comparison.locator("tbody tr")).toHaveCount(1);
  await expect(ranking.locator("tbody tr").last()).toContainText(
    "No published count",
  );
  await page.getByLabel("Reporting year").selectOption("2020");
  await expect(
    ranking.locator("tbody tr").first().locator("td").last(),
  ).toBeEmpty();
});

test("a published zero is ranked and an absent field observation is unranked", async ({
  page,
}) => {
  await page.goto(
    "/?view=awards&level=bachelor&field=" + encodeURIComponent("Lääketieteet"),
  );
  const ranking = page.getByRole("table", {
    name: "Annual institution rankings",
  });
  const tampere = ranking.getByRole("row").filter({
    has: page.getByRole("checkbox", { name: "Tampere", exact: true }),
  });
  await expect(tampere.locator("td").first()).toHaveText("5");
  await expect(tampere.locator("td").nth(1)).toHaveText("0");
  const arcada = ranking.getByRole("row").filter({
    has: page.getByRole("checkbox", { name: "Arcada", exact: true }),
  });
  await expect(arcada.locator("td").first()).toHaveText("—");
  await expect(arcada).toContainText("No published count");
});

test("annual target orders, growth, exports and checked school comparisons agree", async ({
  page,
}) => {
  await page.goto("/?view=awards");
  const table = page.getByRole("table", {
    name: "Annual institution rankings",
  });
  const own = table.getByRole("row").filter({
    has: page.getByRole("checkbox", { name: "Arcada", exact: true }),
  });
  await expect(own).toContainText("477 / 635");
  await expect(own).toContainText("84 / 110");
  await expect(own).toContainText("75.1%");
  await expect(own).toContainText("76.4%");
  await expect(own).toContainText("+11");
  const sort = page.getByLabel("Rank schools by");
  for (const mode of [
    "bachelorClosest",
    "bachelorHighest",
    "masterClosest",
    "masterHighest",
    "growth",
  ]) {
    await sort.selectOption(mode);
    const scores = await table.locator("tbody tr").evaluateAll(
      (rows, mode) =>
        rows.map((row) => {
          const cells = row.querySelectorAll("td");
          if (mode === "growth")
            return Number(cells[3].textContent.replaceAll(",", ""));
          const fraction = cells[mode.startsWith("master") ? 5 : 4]
            .querySelector("small")
            .textContent.replaceAll(",", "")
            .split("/")
            .map(Number);
          const ratio = fraction[0] / fraction[1];
          return mode.endsWith("Closest") ? -Math.abs(1 - ratio) : ratio;
        }),
      mode,
    );
    for (let i = 1; i < scores.length; i++)
      expect(scores[i - 1] + 1e-9).toBeGreaterThanOrEqual(scores[i]);
  }
  await table.getByRole("checkbox", { name: "Laurea" }).check();
  await table.getByRole("checkbox", { name: "Novia" }).focus();
  await page.keyboard.press("Space");
  const side = page.getByRole("table", { name: "Awards by school and field" });
  await expect(side.getByRole("columnheader")).toHaveCount(4);
  await expect(
    side.getByRole("row", { name: /Bachelor’s target reached/ }),
  ).toContainText("75.1%");
  await page
    .getByRole("button", { name: "Change in degrees", exact: true })
    .click();
  const growthTrend = page.getByRole("table", {
    name: "Change in degrees by year",
    exact: true,
  });
  await expect(
    growthTrend.getByRole("row", { name: /^2025/ }).locator("td").first(),
  ).toHaveText("11");
  await expect(
    growthTrend.getByRole("row", { name: /^2020/ }).locator("td").first(),
  ).toHaveText("Unavailable");
  await page.getByRole("button", { name: "Rank over time" }).click();
  await page.reload();
  await expect(table.getByRole("checkbox", { name: "Novia" })).toBeChecked();
  await expect(
    page
      .getByRole("table", { name: "Rank by year", exact: true })
      .getByRole("columnheader", { name: "Novia" }),
  ).toBeVisible();
  const ready = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export ranking and trend CSV" })
    .click();
  const csv = await readFile(await (await ready).path(), "utf8");
  expect(csv).toContain(
    '"573","562","11","Most additional degrees","477","635"',
  );
  await table.getByRole("checkbox", { name: "Novia" }).uncheck();
  await expect(side.getByRole("columnheader", { name: "Novia" })).toHaveCount(
    0,
  );
  await page.getByLabel("Field of education").selectOption({ label: "ICT" });
  await sort.selectOption("bachelorHighest");
  await expect(own).toContainText("71 / 120");
  await expect(own.locator(".annual-target")).toHaveCount(1);
  await expect(sort.locator('option[value="masterHighest"]')).toHaveCount(0);
  await page.getByLabel("Reporting year").selectOption("2020");
  await expect(own.locator("td").first()).toHaveText("—");
});
