import { ArrowDownToLine } from "lucide-react";
import { comparisonName, downloadCsv, formatCount } from "../report-selection";
import { bands, completion, completionCsv, completionResults, definition, onTimeShare, sourceUrl, total } from "./results";

const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const ratio = (row) => row ? percent.format(onTimeShare(row)) : "Unavailable";

function QualificationValue({ row }) {
  return row ? <>{formatCount(row.onTime)} of {formatCount(total(row))}<br /><small>{ratio(row)} on time</small></> : "Unavailable";
}

export default function CompletionView({ dataset, selection, verifiedLink }) {
  const result = completionResults(selection);
  if (!result) return (
    <section className="panel funding-section" aria-labelledby="timing-heading">
      <h2 id="timing-heading">Completion time unavailable for this selection</h2>
      <p>The verified release covers 2025 health and welfare bachelor’s awards excluding commissioned education. Your current filters are still selected.</p>
      {verifiedLink}
    </section>
  );
  const { own, comparison, qualifications } = result;
  const name = dataset.institutions[selection.institution];
  const comparedTo = comparisonName(dataset, selection.comparison);
  return (
    <div className="funding-content">
      <section className="panel funding-section" aria-labelledby="timing-heading">
        <div className="completion-heading">
          <h2 id="timing-heading">Completion time</h2>
          {(own || comparison) && <button className="export" onClick={() => downloadCsv(
            completionCsv(dataset, selection, result), `completion-time-${completion.year}.csv`,
          )}><ArrowDownToLine size={16} aria-hidden="true" /> Download completion CSV</button>}
        </div>
        {(!own || !comparison) && <p>Vipunen has no qualifying completion-time result for {!own ? name : comparedTo} in this release.</p>}
        <table className="funding-table">
          <caption>{completion.year} completion times and award counts</caption>
          <thead><tr><th scope="col">Time to degree</th><th scope="col">{name}</th><th scope="col">{comparedTo}</th></tr></thead>
          <tbody>
            {bands.map(([key, label]) => <tr key={key}><th scope="row">{label}</th><td>{formatCount(own?.[key])}</td><td>{formatCount(comparison?.[key])}</td></tr>)}
            <tr><th scope="row">Total awards</th><td>{formatCount(total(own))}</td><td>{formatCount(total(comparison))}</td></tr>
            <tr><th scope="row">Share on time</th><td>{ratio(own)}</td><td>{ratio(comparison)}</td></tr>
          </tbody>
        </table>
        <p>{definition}. The denominator is everyone awarded a degree in the three time bands. {selection.comparison === "sector" && <>The pooled sector covers {comparison?.codes.length} institutions with qualifying field awards and includes the selected institution if it has qualifying awards. </>}These data describe people who graduated that year.</p>
        <p className="funding-sources">Final {completion.year} data · extract {completion.observedOn} · publisher update {completion.sourceStamp} · retrieved {completion.retrievedAt} · release <code>{completion.releaseId.slice(0, 12)}</code>. <a href={sourceUrl}>Vipunen completion data</a></p>
      </section>
      {qualifications.length > 0 && <section className="panel funding-section" aria-labelledby="qualification-heading">
        <h2 id="qualification-heading">Compare by qualification</h2>
        <table className="funding-table">
          <caption>{completion.year} on-time awards / all awards by national qualification</caption>
          <thead><tr><th scope="col">Qualification</th><th scope="col">{name}</th><th scope="col">{comparedTo}</th></tr></thead>
          <tbody>{qualifications.map((row) => <tr key={row.qualification}>
            <th scope="row"><span lang="fi">{row.label}</span><br /><small>{row.qualification}</small></th>
            <td><QualificationValue row={row} /></td><td><QualificationValue row={row.comparison} /></td>
          </tr>)}</tbody>
        </table>
        <p>The comparison uses the same qualification code on both sides. More than one local programme or intake route can share a code.</p>
      </section>}
    </div>
  );
}
