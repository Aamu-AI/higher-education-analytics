import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("ICT awards and the entire funding group have separate ranks, exports and periods", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".gap-note")).toContainText("84 degrees below");
  const arts = page.getByRole("table", { name: "Selected schools · Education, arts and social sciences" });
  await expect(
    arts.getByRole("row", { name: /Arcada/ }),
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
  await expect(page.getByRole("table", { name: "Selected schools · Technology and ICT" })).toContainText("2020–2022 average");
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
  await page.locator("summary").filter({ hasText: "Compare schools" }).click();
  await page.getByRole("checkbox", { name: "Laurea" }).click();
  await page.getByRole("button", { name: "Rank over time" }).click();
  await page.reload();
  const trend = page.getByRole("table", { name: "Rank by year", exact: true });
  await expect(
    trend.getByRole("columnheader", { name: "Laurea" }),
  ).toBeVisible();
  await expect(trend.getByRole("row", { name: /^2020/ })).toContainText("22");
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
  await page.getByLabel("Ranking year").selectOption("2020");
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
    has: page.getByRole("rowheader", { name: /^Tampere/ }),
  });
  await expect(tampere.locator("td").first()).toHaveText("5");
  await expect(tampere.locator("td").nth(1)).toHaveText("0");
  const arcada = ranking.getByRole("row").filter({
    has: page.getByRole("rowheader", { name: /^Arcada/ }),
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
    has: page.getByRole("rowheader", { name: /^Arcada/ }),
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
            return Number(cells[2].textContent.replaceAll(",", ""));
          const fraction = cells[mode.startsWith("master") ? 4 : 3]
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
  await page.locator("summary").filter({ hasText: "Compare schools" }).click();
  await page.getByRole("checkbox", { name: "Laurea" }).check();
  await page.getByRole("checkbox", { name: "Novia" }).focus();
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
  await page.locator("summary").filter({ hasText: "Compare schools" }).click();
  await expect(page.getByRole("checkbox", { name: "Novia" })).toBeChecked();
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
  await page.getByRole("checkbox", { name: "Novia" }).uncheck();
  await expect(side.getByRole("columnheader", { name: "Novia" })).toHaveCount(
    0,
  );
  await page.getByLabel("Field of education").selectOption({ label: "ICT" });
  await sort.selectOption("bachelorHighest");
  await expect(own).toContainText("71 / 120");
  await expect(own.locator(".annual-target")).toHaveCount(1);
  await expect(sort.locator('option[value="masterHighest"]')).toHaveCount(0);
  await page.getByLabel("Ranking year").selectOption("2020");
  await expect(own.locator("td").first()).toHaveText("—");
});

test("Compare selects schools and chart years independently of the national ranking", async ({
  page,
}) => {
  await page.goto("/?view=awards");
  const ranking = page.getByRole("table", {
    name: "Annual institution rankings",
  });
  const rows = ranking.locator("tbody tr");
  const national = () =>
    rows.evaluateAll((items) =>
      items.map((row) => [
        row.cells[0].textContent,
        row.cells[1].firstChild.textContent,
      ]),
    );
  await expect(rows).toHaveCount(22);
  const baseline = await national();
  await expect(ranking.getByRole("checkbox")).toHaveCount(0);
  await expect(
    ranking.getByRole("columnheader", { name: "2024 awards" }),
  ).toHaveCount(0);
  await page.locator("summary").filter({ hasText: "Compare schools" }).click();
  const schools = page.getByRole("group", { name: "Compare schools" });
  await expect(schools.getByRole("checkbox").first()).toHaveAccessibleName(
    "All schools",
  );
  await schools.getByLabel("All schools").check();
  await expect(ranking.locator("tr.chosen")).toHaveCount(22);
  await schools.getByLabel("All schools").uncheck();
  await schools.getByLabel("Laurea").check();
  await expect(ranking.locator("tr.chosen")).toHaveCount(1);
  await page.locator("summary").filter({ hasText: "Chart years" }).click();
  const years = page.getByRole("group", { name: "Chart years" });
  await years.getByLabel("All years").uncheck();
  await expect(
    page.getByText("Select one or more chart years to see the trend."),
  ).toBeVisible();
  await years.getByLabel("2020").check();
  await years.getByLabel("2023").check();
  const trend = page.getByRole("table", { name: "Degree counts by year" });
  await expect(trend.locator("tbody tr")).toHaveCount(2);
  expect(await national()).toEqual(baseline);
  await expect(page.getByLabel("Ranking year")).toHaveValue("2025");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export ranking and trend CSV" })
    .click();
  const records = (await readFile(await (await download).path(), "utf8")).split(
    "\r\n",
  );
  expect(records.filter((line) => line.startsWith('"Ranking",'))).toHaveLength(
    22,
  );
  const exported = records.filter((line) =>
    line.startsWith('"Selected trend",'),
  );
  expect(exported.map((line) => line.split('","')[3])).toEqual([
    "2020",
    "2023",
  ]);
  await page.getByLabel("Ranking year").selectOption("2024");
  await expect(trend.locator("tbody tr")).toHaveCount(2);
  await page.reload();
  await expect(trend.locator("tbody tr")).toHaveCount(2);
  await expect(ranking.locator("tr.chosen")).toContainText("Laurea");
  await page.locator("summary").filter({ hasText: "Chart years" }).click();
  await years.getByLabel("All years").check();
  await expect(trend.locator("tbody tr")).toHaveCount(6);
  await expect(page.getByLabel("Ranking year")).toHaveValue("2024");
});
