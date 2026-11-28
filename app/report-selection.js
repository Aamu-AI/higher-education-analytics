export const DEFAULTS = {
  view: "funding",
  institution: "02535",
  year: "2025",
  comparison: "sector",
  level: "both",
  funding: "all",
  field: "",
  schools: "",
  chartYears: "",
  order: "awards",
  trend: "count",
};

export const AWARD_ORDERS = {
  awards: "Most awards",
  growth: "Most additional degrees",
  bachelorClosest: "Closest to bachelor’s target",
  masterClosest: "Closest to master’s target",
  bachelorHighest: "Highest bachelor’s target share",
  masterHighest: "Highest master’s target share",
};

export function selectedSchools(selection) {
  if (selection.schools === "none") return [];
  if (selection.schools) return selection.schools.split(",");
  return [...new Set([selection.institution, selection.comparison].filter(id => id !== "sector"))];
}

export function selectedChartYears(choice, years) {
  if (!choice) return years;
  const selected = choice.split(",");
  return years.filter(year => selected.includes(String(year)));
}

export const LEVELS = { both: "All levels", bachelor: "Bachelor’s", master: "Master’s" };
export const FUNDING = { included: "Exclude commissioned", all: "All funding sources" };

export const formatCount = (value) => value == null ? "Unavailable" : new Intl.NumberFormat("en-GB").format(value);

export function readSelection(params, dataset) {
  const allowed = {
    view: ["funding", "awards", "completion"],
    institution: Object.keys(dataset.institutions),
    year: dataset.metadata.years.map(String),
    comparison: ["sector", ...Object.keys(dataset.institutions)],
    level: Object.keys(LEVELS),
    funding: Object.keys(FUNDING),
    field: Object.keys(dataset.fields),
    schools: [],
    chartYears: [],
    order: Object.keys(AWARD_ORDERS),
    trend: ["count", "growth", "rank"],
  };
  const selection = Object.fromEntries(Object.entries(DEFAULTS).map(([key, fallback]) => [
    key, allowed[key].includes(params.get(key)) ? params.get(key) : fallback,
  ]));
  const checked = (params.get("schools") ?? params.get("peers") ?? "").split(",").filter(id => Object.hasOwn(dataset.institutions, id));
  if (params.get("schools") === "none") selection.schools = "none";
  else if (checked.length) {
    const ids = params.has("schools") ? checked : [...selectedSchools(selection), ...checked];
    selection.schools = [...new Set(ids)].join(",");
  }
  const yearChoice = params.get("chartYears");
  if (yearChoice === "none") selection.chartYears = "none";
  else if (yearChoice) {
    const valid = selectedChartYears(yearChoice, dataset.metadata.years);
    if (valid.length && valid.length < dataset.metadata.years.length) selection.chartYears = valid.join(",");
  }
  if (!params.has("view") && ["institution", "year", "level", "funding", "field"].some((key) => params.has(key))) {
    selection.view = "awards";
  }
  if (selection.view === "completion" && !params.has("funding")) selection.funding = "included";
  if (selection.comparison === selection.institution) selection.comparison = "sector";
  return selection;
}

export function selectionUrl(selection) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(selection)) {
    if (value !== DEFAULTS[key] || (key === "funding" && selection.view === "completion")) params.set(key, value);
  }
  if (params.size && !params.has("view")) params.set("view", selection.view);
  return params.size ? `/?${params}` : "/";
}

export function awardRows(dataset, { year, level, field }) {
  return dataset.records.filter((row) => row.year === Number(year) &&
    (level === "both" || row.level === level) && (!field || row.field === field));
}

export function awardCount(dataset, selection) {
  const rows = awardRows(dataset, selection).filter((row) => row.institution === selection.institution);
  return rows.length ? rows.reduce((sum, row) => sum + row[selection.funding], 0) : null;
}

export function comparisonAwards(dataset, selection) {
  const rows = awardRows(dataset, selection).filter((row) =>
    selection.comparison === "sector" || row.institution === selection.comparison);
  return {
    value: rows.length ? rows.reduce((sum, row) => sum + row[selection.funding], 0) : null,
    codes: [...new Set(rows.map((row) => row.institution))].sort(),
  };
}

export function comparisonName(dataset, comparison) {
  return comparison === "sector" ? "Finnish UAS sector" : dataset.institutions[comparison];
}

export function makeCsv(rows) {
  const lines = rows.map((row) => row.map((value) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`).join(","));
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

export function downloadCsv(contents, filename) {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
