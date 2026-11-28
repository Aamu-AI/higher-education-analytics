import { agreement, arcada, benchmark, completion, definition, qualifications, sector, sourceUrl, target, total } from "../results";

export const dynamic = "force-static";

const header = [
  "scope", "institution_code", "qualification_code", "qualification_label_fi",
  "year", "field_fi", "definition", "awards", "on_time", "up_to_12_months_late",
  "more_than_12_months_late", "on_time_percent", "agreement_target", "agreement_period",
  "agreement_url", "annual_report_url", "benchmark_institution_codes", "release_status",
  "observation_extract", "publisher_update", "retrieved_at", "release_id", "awards_input_hash",
  "source", "source_url", "licence_url",
];

const csv = (cells) => cells.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",");

export function GET() {
  const provenance = [completion.releaseType, completion.observedOn, completion.sourceStamp,
    completion.retrievedAt, completion.releaseId, completion.awardsInputHash,
    "Vipunen – Education Statistics Finland, VIRTA", sourceUrl, "https://creativecommons.org/licenses/by/4.0/"];
  const rows = [
    ["Arcada", qualifications[0].institution, "", "", arcada, target.target, agreement.period, agreement.agreementUrl, agreement.source, ""],
    [sector, "", "", "", benchmark, "", "", "", "", completion.sectorInstitutions.join(" ")],
    ...qualifications.map((row) => ["Arcada qualification", row.institution, row.qualification, row.label, row]),
  ];
  const lines = rows.map(([scope, institution, code, label, row, targetValue, period, agreementUrl, report, memberCodes]) =>
    csv([scope, institution, code, label, completion.year, completion.field, definition,
      total(row), row.onTime, row.withinYear, row.later, (100 * row.onTime / total(row)).toFixed(1),
      targetValue, period, agreementUrl, report, memberCodes, ...provenance]));
  return new Response("\ufeff" + [csv(header), ...lines].join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="completion-time-${completion.year}.csv"`,
    },
  });
}
