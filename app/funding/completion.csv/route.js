import degrees from "../../../data/degrees.json";
import { DEFAULTS } from "../../report-selection";
import { completion, completionCsv, completionResults, scope } from "../results";

export const dynamic = "force-static";

export function GET() {
  const selection = { ...DEFAULTS, ...scope, year: String(completion.year) };
  return new Response(completionCsv(degrees, selection, completionResults(selection)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="completion-time-${completion.year}.csv"`,
    },
  });
}
