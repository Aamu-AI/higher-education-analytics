import completion from "../../data/completion.json";
import degrees from "../../data/degrees.json";
import { agreements } from "../../data/institutions-config";

const institution = "02535";
const { year, field, records } = completion;
const agreement = agreements[institution][year];
const target = agreement.groups.find((group) => group.fields.includes(field));
const sourceUrl = `https://api.vipunen.fi/api/resources/${completion.resource}`;
const definition = "Final health and welfare bachelor’s awards excluding commissioned education";
const sector = `Finnish UAS benchmark (${completion.sectorInstitutions.length} institutions)`;
const bands = [
  ["onTime", "On time"],
  ["withinYear", "Up to 12 months late"],
  ["later", "More than 12 months late"],
];

function total(row) {
  return row.onTime + row.withinYear + row.later;
}

function tally(rows) {
  return Object.fromEntries(bands.map(([key]) => [key, rows.reduce((sum, row) => sum + row[key], 0)]));
}

const qualifications = records.filter((row) => row.institution === institution && total(row) > 0)
  .sort((a, b) => total(b) - total(a) || a.qualification.localeCompare(b.qualification));
const arcada = tally(qualifications);
const benchmark = tally(records);
const history = degrees.records.filter((row) => row.institution === institution && row.field === field &&
  row.level === "bachelor" && row.year < year);

export { agreement, arcada, bands, benchmark, completion, definition, history, qualifications,
  sector, sourceUrl, target, total };
