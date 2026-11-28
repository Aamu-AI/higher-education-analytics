import completion from "../../data/completion.json";
import { agreements } from "../../data/institutions-config";
import { comparisonName, makeCsv } from "../report-selection";

export { completion };
export const definition = "Final health and welfare bachelor’s awards excluding commissioned education";
export const sourceUrl = `https://api.vipunen.fi/api/resources/${completion.resource}`;
export const scope = { level: "bachelor", funding: "included", field: completion.field };
export const bands = [
  ["onTime", "On time"],
  ["withinYear", "Up to 12 months late"],
  ["later", "More than 12 months late"],
];

export function total(row) {
  return row ? row.onTime + row.withinYear + row.later : null;
}

export function onTimeShare(row) {
  return total(row) > 0 ? row.onTime / total(row) : null;
}

function tally(rows) {
  const observed = rows.filter((row) => total(row) > 0);
  if (!observed.length) return null;
  return {
    ...Object.fromEntries(bands.map(([key]) => [key, observed.reduce((sum, row) => sum + row[key], 0)])),
    codes: [...new Set(observed.map((row) => row.institution))].sort(),
  };
}

export function completionResults(selection) {
  if (Number(selection.year) !== completion.year || Object.entries(scope).some(([key, value]) => selection[key] !== value)) {
    return null;
  }
  const own = completion.records.filter((row) => row.institution === selection.institution);
  const compared = selection.comparison === "sector" ? completion.records :
    completion.records.filter((row) => row.institution === selection.comparison);
  const qualifications = own.filter((row) => total(row) > 0)
    .sort((a, b) => total(b) - total(a) || a.qualification.localeCompare(b.qualification))
    .map((row) => ({ ...row, comparison: tally(compared.filter((other) => other.qualification === row.qualification)) }));
  return { own: tally(own), comparison: tally(compared), qualifications };
}

export function completionCsv(dataset, selection, result) {
  const agreement = agreements[selection.institution]?.[selection.year];
  const target = agreement?.groups.find((group) => group.fields.includes(selection.field))?.target;
  const comparedTo = comparisonName(dataset, selection.comparison);
  const institutionName = dataset.institutions[selection.institution];
  const header = [
    "scope", "institution_code", "qualification_code", "qualification_label_fi",
    "year", "field_fi", "definition", "awards", "on_time", "up_to_12_months_late",
    "more_than_12_months_late", "on_time_percent", "agreement_target", "agreement_period",
    "agreement_url", "annual_report_url", "benchmark_institution_codes", "release_status",
    "observation_extract", "publisher_update", "retrieved_at", "release_id", "awards_input_hash",
    "source", "source_url", "licence_url", "observation_status",
  ];
  const provenance = [completion.releaseType, completion.observedOn, completion.sourceStamp,
    completion.retrievedAt, completion.releaseId, completion.awardsInputHash,
    "Vipunen – Education Statistics Finland, VIRTA", sourceUrl, "https://creativecommons.org/licenses/by/4.0/"];
  const comparedCode = selection.comparison === "sector" ? "" : selection.comparison;
  const rows = [
    [institutionName, selection.institution, "", "", result.own, true],
    [comparedTo, comparedCode, "", "", result.comparison],
    ...result.qualifications.flatMap((row) => [
      [institutionName, selection.institution, row.qualification, row.label, row],
      [comparedTo, comparedCode, row.qualification, row.label, row.comparison],
    ]),
  ];
  return makeCsv([header, ...rows.map(([label, institution, code, qualification, row, hasTarget]) => [
    label, institution, code, qualification, completion.year, completion.field, definition,
    total(row), row?.onTime, row?.withinYear, row?.later,
    row && (100 * onTimeShare(row)).toFixed(1), hasTarget ? target : null,
    hasTarget ? agreement?.period : null, hasTarget ? agreement?.agreementUrl : null,
    hasTarget ? agreement?.source : null, institution ? null : row?.codes.join(" "),
    ...provenance, row ? "observed" : "unavailable",
  ])]);
}
