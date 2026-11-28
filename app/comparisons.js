import ceilings from "../data/ministry-ceilings.json";
import { awardRows } from "./report-selection";

export const groups = [
  {
    key: "arts",
    name: "Education, arts and social sciences",
    fields: [
      "Kasvatusalat",
      "Taiteet ja kulttuurialat",
      "Yhteiskunnalliset alat",
    ],
  },
  {
    key: "health",
    name: "Humanities, medicine and health",
    fields: [
      "Humanistiset alat",
      "Lääketieteet",
      "Terveys- ja hyvinvointialat",
    ],
  },
  {
    key: "business",
    name: "Business and services",
    fields: ["Kauppa, hallinto ja oikeustieteet", "Palvelualat"],
  },
  {
    key: "technology",
    name: "Technology and ICT",
    fields: [
      "Luonnontieteet",
      "Tietojenkäsittely ja tietoliikenne",
      "Tekniikan alat",
      "Maa- ja metsätalousalat",
    ],
  },
];

export function agreementPeriod(year) {
  if (year >= 2025 && year <= 2028) return "2025–2028";
  if (year >= 2021 && year <= 2024) return "2021–2024";
  return null;
}

export function rankSchools(rows, score = (row) => row.value) {
  const sorted = rows.slice().sort((a, b) => {
    const x = score(a),
      y = score(b);
    if (x == null && y != null) return 1;
    if (y == null && x != null) return -1;
    return y - x || a.name.localeCompare(b.name);
  });
  let rank;
  return sorted.map((row, index) => {
    const value = score(row);
    if (index === 0 || value !== score(sorted[index - 1])) rank = index + 1;
    return { ...row, rank: value == null ? null : rank };
  });
}

export function awardRanking(dataset, selection) {
  const amounts = new Map();
  for (const row of awardRows(dataset, selection)) {
    amounts.set(
      row.institution,
      (amounts.get(row.institution) ?? 0) + row[selection.funding],
    );
  }
  return rankSchools(
    Object.entries(dataset.institutions).map(([id, name]) => ({
      id,
      name,
      value: amounts.get(id) ?? null,
    })),
  );
}

export function fundingComparisons(dataset, year) {
  const end = Number(year);
  const period = agreementPeriod(end);
  const records = dataset.records.filter(
    (row) => row.level === "bachelor" && row.year >= end - 2 && row.year <= end,
  );
  const totals = new Map();
  for (const row of records) {
    const group = groups.find((g) => g.fields.includes(row.field));
    const key = [row.institution, row.year, group.key].join("/");
    totals.set(key, (totals.get(key) ?? 0) + row.included);
  }
  return groups.map((group) => {
    const schools = Object.entries(dataset.institutions).map(([id, name]) => {
      const agreement = ceilings[period]?.[id];
      const ceiling = agreement?.ceilings[group.key] ?? null;
      const counts = [end - 2, end - 1, end].map(
        (y) => totals.get([id, y, group.key].join("/")) ?? null,
      );
      const average = counts.every((n) => n != null)
        ? counts.reduce((a, b) => a + b, 0) / 3
        : null;
      const value =
        ceiling > 0 && average != null ? (average / ceiling) * 100 : null;
      const reason = !agreement
        ? "Agreement unavailable"
        : ceiling == null
          ? "No ceiling listed for group"
          : average == null
            ? "Three comparable years unavailable"
            : "";
      return {
        id,
        name,
        ceiling,
        annual: counts[2],
        average,
        value,
        reason,
        source: agreement?.source,
      };
    });
    return { ...group, schools: rankSchools(schools) };
  });
}

export function annualRankings(dataset, selection, order) {
  const group = groups.find((g) => g.fields.includes(selection.field));
  let previous = new Map();
  let previousYear;
  return dataset.metadata.years.map((year) => {
    const agreements = ceilings[agreementPeriod(year)];
    const bachelors = new Map();
    const masters = new Map();
    for (const row of dataset.records) {
      if (row.year !== year) continue;
      if (
        row.level === "bachelor" &&
        (!group || group.fields.includes(row.field))
      ) {
        bachelors.set(
          row.institution,
          (bachelors.get(row.institution) ?? 0) + row.included,
        );
      }
      if (row.level === "master" && !group) {
        masters.set(
          row.institution,
          (masters.get(row.institution) ?? 0) + row.all,
        );
      }
    }
    const rows = awardRanking(dataset, { ...selection, year }).map((row) => {
      const agreement = agreements?.[row.id];
      const before = previousYear === year - 1 ? previous.get(row.id) : null;
      const bachelorTarget = group
        ? agreement?.ceilings[group.key]
        : agreement &&
          Object.values(agreement.ceilings).reduce((sum, n) => sum + n, 0);
      const masterTarget = group ? null : agreement?.masterTarget;
      const bachelor = targetResult(bachelors.get(row.id), bachelorTarget);
      const master = targetResult(masters.get(row.id), masterTarget);
      const growth =
        before != null && row.value != null ? row.value - before : null;
      return {
        ...row,
        before,
        growth,
        bachelor,
        master,
        source: agreement?.source,
      };
    });
    previous = new Map(rows.map((row) => [row.id, row.value]));
    previousYear = year;
    return rankSchools(rows, (row) => {
      if (order === "awards") return row.value;
      if (order === "growth") return row.growth;
      const result = order.startsWith("bachelor") ? row.bachelor : row.master;
      if (result.share == null) return null;
      return order.endsWith("Closest")
        ? -Math.abs(result.count - result.target) / result.target
        : result.share;
    });
  });
}

function targetResult(count, target) {
  return {
    count,
    target,
    share: target > 0 && count != null ? count / target : null,
  };
}
