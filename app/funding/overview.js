import CeilingComparison from "./ceilings";
import { agreements, nursingReview } from "../../data/institutions-config";
import { awardCount, comparisonAwards, comparisonName, formatCount } from "../report-selection";
import { completion, completionResults, onTimeShare, scope, sourceUrl, total } from "./results";

const euros = (value) => `€${(value / 1e6).toFixed(3)}m`;
const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const modelUrl = "https://okm.fi/ohjaus-rahoitus-ja-sopimukset";
const decreeUrl = "https://www.finlex.fi/fi/lainsaadanto/saadoskokoelma/2024/171";
const budgetUrl = "https://budjetti.vm.fi/sisalto.jsp?lang=fi&maindoc=%2F2026%2Faky%2Faky.xml&opennode=0%3A1%3A11%3A269%3A719%3A793%3A803%3A&year=0";
const currentWeights = [
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

const earlierWeights = [
  ["Education", 76, [
    ["Bachelor’s degrees", 56], ["Continuous learning credits", 8], ["Inter-institutional credits", 1],
    ["Graduation feedback (AVOP)", 3], ["Career follow-up", 3], ["Graduate employment in Finland", 3],
    ["Vocational teacher education", 2],
  ]],
  ["Research, development and innovation", 19, [
    ["External R&D funding", 11], ["Master’s degrees", 6], ["Publications and other outputs", 2],
  ]],
  ["Strategy", 5, []],
];
const legacyWeights = [
  ["Education", 79, [
    ["Bachelor’s degrees", 40], ["Students completing 55 credits", 23], ["Graduate employment", 4],
    ["Open UAS and other eligible studies", 5], ["Graduation feedback (AVOP)", 3],
    ["International student and placement mobility", 2], ["Vocational teacher education", 2],
  ]],
  ["Research, development and innovation", 15, [
    ["External R&D funding", 8], ["Master’s degrees", 4], ["Publications and other outputs", 2],
    ["International staff mobility", 1],
  ]],
  ["Other policy objectives", 6, [["Strategy", 5], ["Field-specific funding", 1]]],
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

export default function FundingOverview({ dataset, selection, onField, completionLink }) {
  const weights = selection.year >= 2025 ? currentWeights : selection.year >= 2021 ? earlierWeights : legacyWeights;
  const modelPeriod = selection.year >= 2025 ? "2025–2028" : selection.year >= 2021 ? "2021–2024" : "2017–2020";
  const modelSource = selection.year >= 2025 ? decreeUrl : selection.year >= 2021
    ? "https://okm.fi/documents/1410845/4392480/AMK_rahoitusmalli_fi/65aedf23-83a0-64f7-aed5-ebdf07bc9efe/AMK_rahoitusmalli_fi.pdf"
    : "https://okm.fi/documents/1410845/4177242/181024_OKM_rahoitusraportti_web.pdf/44cd4514-8627-1ba7-029f-4ab712f40763/181024_OKM_rahoitusraportti_web.pdf.pdf";
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
  function componentFigure(label) {
    if (label === "Bachelor’s degrees") return formatCount(awardCount(dataset, { ...selection, level: "bachelor", field: "", funding: "included" })) + " annual awards";
    if (label === "Master’s degrees") return formatCount(masterCount) + " annual awards";
    if (label === "Strategy" && allocation) return euros(allocation.strategy) + " at signing";
    if (label === "Graduation feedback (AVOP)") return "Question scores, valid answer counts and verified funding points unavailable";
    return "School figure unavailable in this release";
  }
  const sourceStamp = dataset.metadata.sourceStamps?.[selection.year] ?? dataset.metadata.sourceStamp;
  return (
    <div className="funding-content">
      <CeilingComparison dataset={dataset} selection={selection} onField={onField} />
      <section className="panel funding-section" aria-labelledby="model-heading">
        <h2 id="model-heading">National base funding model · {modelPeriod}</h2>
        <p>Weights are shares of national base funding. The school column identifies the published measure for the selected year.</p>
        <div className="funding-weights">
          {weights.map(([label, weight]) => <div key={label}><strong>{weight}%</strong><span>{label}</span></div>)}
        </div>
        <div className="table-scroll">
          <table className="funding-table">
            <caption>Weights as shares of the whole model</caption>
            <thead><tr><th scope="col">Component</th><th scope="col">National weight</th><th scope="col">School figure · {selection.year}</th></tr></thead>
            <tbody>{weights.flatMap(([category, weight, items]) => items.length ? items : [[category, weight]])
              .map(([label, weight]) => <tr key={label}><th scope="row">{label}</th><td>{weight}%</td><td>{componentFigure(label)}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="funding-sources"><a href={modelUrl}>Ministry guidance</a> · <a href={modelSource}>Model weights for {modelPeriod}</a></p>
      </section>

      <section className="panel funding-section" aria-labelledby="masters-heading">
        <h2 id="masters-heading">Master’s degrees</h2>
        <div className="funding-overview-metrics">
          <div className="funding-result"><strong>{formatCount(masterCount)}{agreement?.masterTarget ? <small> of {agreement.masterTarget}</small> : null}</strong>
            <span>{agreement?.masterTarget ? `Awards against the ${agreement.period} annual average target` : "Awards"}</span></div>
          <div className="funding-result"><strong>{formatCount(masterComparison.value)}</strong><span>{comparison}</span>
            {selection.comparison === "sector" && <span className="unit">{masterComparison.codes.length} institutions with published counts</span>}</div>
        </div>
        <p>Final {selection.year} awards across all funding sources under the {selection.year >= 2021 ? 6 : 4}% national model component.</p>
        <p className="funding-sources">Source update {sourceStamp} · <a href={dataset.metadata.sourceUrl}>Vipunen awards</a>{agreement?.masterTarget && <> · <a href={agreement.agreementUrl}>Ministry agreement, p. 4</a></>}</p>
      </section>

      <details className="panel funding-section"><summary>Health and welfare completion-time case</summary>
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
      </details>

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
