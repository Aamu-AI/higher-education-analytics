import { agreements, nursingReview } from "../../data/institutions-config";
import { awardCount, comparisonAwards, comparisonName, formatCount } from "../report-selection";
import { completion, completionResults, onTimeShare, scope, sourceUrl, total } from "./results";

const euros = (value) => `€${(value / 1e6).toFixed(3)}m`;
const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const modelUrl = "https://okm.fi/ohjaus-rahoitus-ja-sopimukset";
const decreeUrl = "https://www.finlex.fi/fi/lainsaadanto/saadoskokoelma/2024/171";
const budgetUrl = "https://budjetti.vm.fi/sisalto.jsp?lang=fi&maindoc=%2F2026%2Faky%2Faky.xml&opennode=0%3A1%3A11%3A269%3A719%3A793%3A803%3A&year=0";
const weights = [
  ["Education", 75, [
    ["Bachelor’s degrees", 56], ["Continuous learning credits", 5],
    ["First-time entrants", 3], ["Graduation feedback (AVOP)", 3],
    ["Career follow-up", 3], ["Graduate employment in Finland", 2],
    ["Vocational teacher education", 2], ["Inter-institutional credits", 1],
  ]],
  ["Research, development and innovation", 20, [
    ["External R&D funding", 12], ["Master’s degrees", 6], ["Publications and other outputs", 2],
  ]],
  ["Strategy", 5, []],
];

function NursingReview({ dataset, selection, result }) {
  const nursing = result?.qualifications.find((row) => row.qualification === nursingReview.qualification);
  const starterSeries = dataset.nursingStarters?.records.filter((row) =>
    row.institution === selection.institution && row.year <= Number(selection.year));
  return (
    <div className="funding-next">
      <h3>Review nursing intake routes and placement capacity</h3>
      {starterSeries?.length > 0 && <p>Nursing starters, excluding commissioned education. {starterSeries.map(({ year, count }) => `${year} (${formatCount(count)})`).join(" · ")}. The published counts combine intake routes.</p>}
      {nursing && <p>{formatCount(nursing.onTime)} of {formatCount(total(nursing))} nursing awards were on time ({percent.format(onTimeShare(nursing))}){nursing.comparison && (
        <> compared with {formatCount(nursing.comparison.onTime)} of {formatCount(total(nursing.comparison))} ({percent.format(onTimeShare(nursing.comparison))}) for the same qualification</>
      )}. Timing describes people who graduated that year.</p>}
      <p>The nursing programme director and Study Services should review entrants by route and check placement progress before the next placement allocation. Arcada’s TopUp route can have a different study duration.</p>
      <p className="funding-sources"><a href={dataset.metadata.sourceUrl}>Vipunen starters, qualification {nursingReview.qualification}</a> · <a href={nursingReview.source}>Arcada Nursing TopUp</a></p>
    </div>
  );
}

export default function FundingOverview({ dataset, selection, completionLink }) {
  const agreement = agreements[selection.institution]?.[selection.year];
  const healthTarget = agreement?.groups.find((group) => group.fields.includes(scope.field))?.target;
  const health = { ...selection, ...scope };
  const bachelorCount = awardCount(dataset, health);
  const bachelorComparison = comparisonAwards(dataset, health);
  const result = completionResults(health);
  const comparison = comparisonName(dataset, selection.comparison);
  const ownShare = onTimeShare(result?.own);
  const comparedShare = onTimeShare(result?.comparison);
  const masters = { ...selection, level: "master", field: "", funding: "all" };
  const masterCount = awardCount(dataset, masters);
  const masterComparison = comparisonAwards(dataset, masters);
  const { allocation } = agreement ?? {};
  const stateAward = allocation && Object.values(allocation).reduce((sum, value) => sum + value, 0);
  const sourceStamp = dataset.metadata.sourceStamps?.[selection.year] ?? dataset.metadata.sourceStamp;
  return (
    <div className="funding-content">
      <section className="panel funding-section" aria-labelledby="case-heading">
        <h2 id="case-heading">Health and welfare bachelor’s degrees</h2>
        <p>Final {selection.year} awards excluding commissioned education.</p>
        <div className="funding-overview-metrics">
          <div className="funding-result">
            <strong>{formatCount(bachelorCount)}{healthTarget && bachelorCount != null ? <small> of {healthTarget}</small> : null}</strong>
            <span>{healthTarget && bachelorCount != null ? `${Math.abs(healthTarget - bachelorCount)} ${bachelorCount < healthTarget ? "below" : bachelorCount > healthTarget ? "above" : "from"} the annual average target` : "Bachelor’s awards"}</span>
          </div>
          <div className="funding-result">
            <strong>{ownShare == null ? formatCount(bachelorComparison.value) : percent.format(ownShare)}{ownShare == null ? null : <small> on time</small>}</strong>
            <span>{ownShare != null && comparedShare != null ? `${percent.format(comparedShare)} on time · ${comparison}` : ownShare != null ? `Timing unavailable · ${comparison}` : `Awards · ${comparison}`}</span>
            {selection.comparison === "sector" && <span className="unit">{ownShare != null ? result?.comparison?.codes.length : bachelorComparison.codes.length} institutions with {ownShare != null ? "completion data" : "published counts"}</span>}
          </div>
        </div>
        {completionLink}
        {healthTarget && <p>The {agreement.period} agreement target is an annual average. Its field group also includes humanities and medicine. <a href={agreement.agreementUrl}>Ministry agreement</a> · <a href={agreement.source}>Arcada annual report, Table 2</a></p>}
        <p className="funding-sources">Awards update {sourceStamp} · <a href={dataset.metadata.sourceUrl}>Vipunen awards</a>{ownShare != null && <> · Timing update {completion.sourceStamp} · <a href={sourceUrl}>Vipunen completion data</a></>}</p>
        {selection.institution === nursingReview.institution && <NursingReview dataset={dataset} selection={selection} result={result} />}
      </section>

      <section className="panel funding-section" aria-labelledby="masters-heading">
        <h2 id="masters-heading">Master’s degrees</h2>
        <div className="funding-overview-metrics">
          <div className="funding-result"><strong>{formatCount(masterCount)}{agreement?.masterTarget ? <small> of {agreement.masterTarget}</small> : null}</strong>
            <span>{agreement?.masterTarget ? `Awards against the ${agreement.period} annual average target` : "Awards"}</span></div>
          <div className="funding-result"><strong>{formatCount(masterComparison.value)}</strong><span>{comparison}</span>
            {selection.comparison === "sector" && <span className="unit">{masterComparison.codes.length} institutions with published counts</span>}</div>
        </div>
        <p>Final {selection.year} awards across all funding sources under the 6% national model component.</p>
        <p className="funding-sources">Source update {sourceStamp} · <a href={dataset.metadata.sourceUrl}>Vipunen awards</a>{agreement?.masterTarget && <> · <a href={agreement.agreementUrl}>Ministry agreement, p. 4</a></>}</p>
      </section>

      <section className="panel funding-section" aria-labelledby="model-heading">
        <h2 id="model-heading">National base funding model</h2>
        <p>Under the model in force since 2025, the ministry distributes each indicator’s funding by institutions’ shares of the same sector measure. Strategy funding is agreed separately.</p>
        <div className="funding-weights">
          {weights.map(([label, weight]) => <div key={label}><strong>{weight}%</strong><span>{label}</span></div>)}
        </div>
        <details className="funding-details">
          <summary>See the national component weights</summary>
          <table className="funding-table">
            <caption>Weights as shares of the whole model</caption>
            <thead><tr><th scope="col">Component</th><th scope="col">Weight</th></tr></thead>
            <tbody>{weights.flatMap(([category, weight, items]) => items.length ? items : [[category, weight]])
              .map(([label, weight]) => <tr key={label}><th scope="row">{label}</th><td>{weight}%</td></tr>)}</tbody>
          </table>
        </details>
        <p className="funding-sources"><a href={modelUrl}>Ministry guidance</a> · <a href={decreeUrl}>Decree 171/2024</a></p>
      </section>

      <section className="panel funding-section" aria-labelledby="allocation-heading">
        <h2 id="allocation-heading">Published allocations</h2>
        <dl className="funding-allocation">
          <div><dt>{dataset.institutions[selection.institution]} · {selection.year} state award at signing</dt><dd>{allocation ? euros(stateAward) : "Unavailable"}</dd></div>
          <div><dt>2026 Finnish UAS base funding budget</dt><dd>€939.168m</dd></div>
        </dl>
        {allocation && <p>The institution’s award includes {euros(allocation.indicators)} indicator-based, {euros(allocation.strategy)} strategy, {euros(allocation.vat)} VAT compensation and {euros(allocation.discretionary)} discretionary funding.</p>}
        <p className="funding-sources">{allocation && <><a href={agreement.agreementUrl}>Ministry agreement, pp. 4–5</a> · </>}<a href={budgetUrl}>2026 Finnish state budget</a></p>
      </section>
    </div>
  );
}
