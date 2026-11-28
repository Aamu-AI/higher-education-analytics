import {
  agreement, arcada, bands, benchmark, completion, definition, history,
  qualifications, sector, sourceUrl, target, total,
} from "./results";

export const metadata = { title: "Funding and completion time | Aamu Analytics" };

const number = new Intl.NumberFormat("en-GB");
const percent = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const share = (row) => percent.format(row.onTime / total(row));
const euros = (value) => `€${(value / 1e6).toFixed(3)}m`;
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

function CompletionBar({ name, row }) {
  return (
    <div className="completion-bar-row">
      <div><strong>{name}</strong><span>{share(row)} on time</span></div>
      <div className="completion-bar" aria-hidden="true">
        <span style={{ width: share(row) }} />
      </div>
    </div>
  );
}

export default function Funding() {
  const { allocation } = agreement;
  const stateAward = Object.values(allocation).reduce((sum, value) => sum + value, 0);
  return (
    <div className="funding-page">
      <a href="#content" className="skip">Skip to funding</a>
      <header className="funding-nav"><a href="/">← Degree awards</a></header>
      <main id="content" tabIndex={-1}>
        <div className="funding-heading">
          <div>
            <h1>Funding and completion time</h1>
            <p>Arcada · Finnish universities of applied sciences</p>
          </div>
          <a className="export" href="/funding/completion.csv">Download completion CSV</a>
        </div>

        <section className="panel funding-section" aria-labelledby="case-heading">
          <h2 id="case-heading">Health and welfare bachelor’s degrees</h2>
          <div className="funding-result">
            <strong>{total(arcada)} <small>of {target.target}</small></strong>
            <span>{completion.year} awards · {target.target - total(arcada)} below target</span>
          </div>
          <p>{history.map((row) => `${row.year}: ${row.included}`).join(" · ")} · {completion.year}: {total(arcada)}.</p>
          <p>{target.target} is the agreement’s annual average target for {agreement.period}. Arcada uses it as the 2025 reference. The agreement group also covers humanities and medicine.</p>
          <p className="funding-sources"><a href={agreement.source}>Arcada annual report, Table 2</a> · <a href={agreement.agreementUrl}>Ministry agreement, p. 4</a></p>

          <h3>How long did graduates take?</h3>
          <div className="completion-bars">
            <CompletionBar name="Arcada" row={arcada} />
            <CompletionBar name={sector} row={benchmark} />
          </div>
          <table className="funding-table">
            <caption>2025 completion times and award counts</caption>
            <thead><tr><th scope="col">Time to degree</th><th scope="col">Arcada</th><th scope="col">Finnish UAS benchmark</th></tr></thead>
            <tbody>
              {bands.map(([key, label]) => (
                <tr key={key}><th scope="row">{label}</th><td>{number.format(arcada[key])}</td><td>{number.format(benchmark[key])}</td></tr>
              ))}
              <tr><th scope="row">Total awards</th><td>{number.format(total(arcada))}</td><td>{number.format(total(benchmark))}</td></tr>
              <tr><th scope="row">Share on time</th><td>{share(arcada)}</td><td>{share(benchmark)}</td></tr>
            </tbody>
          </table>
          <p>{definition}. Rates divide on-time awards by all awards in the three time bands. The pooled benchmark includes Arcada and covers 21 of the 22 UASs in Vipunen, counting only institutions with awards in this field. These data describe graduates and leave open what happened to students who had yet to graduate.</p>
          <p className="funding-sources">Final 2025 data · observation extract {completion.observedOn} · publisher update {completion.sourceStamp} · retrieved {completion.retrievedAt} · release <code>{completion.releaseId.slice(0, 12)}</code>. <a href={sourceUrl}>Vipunen completion data</a></p>

          <details className="funding-details">
            <summary>Compare Arcada’s qualifications</summary>
            <table className="funding-table">
              <caption>Arcada’s 2025 awards by national qualification, using Vipunen’s Finnish labels</caption>
              <thead><tr><th scope="col">Qualification</th><th scope="col">On time</th><th scope="col">Awards</th></tr></thead>
              <tbody>{qualifications.map((row) => (
                <tr key={row.qualification}>
                  <th scope="row"><span lang="fi">{row.label}</span><br /><small>{row.qualification}</small></th>
                  <td>{number.format(row.onTime)}</td><td>{number.format(total(row))}</td>
                </tr>
              ))}</tbody>
            </table>
            <p>Multiple Arcada programmes can share a national qualification code.</p>
          </details>
          <p className="funding-next">To investigate the gap, compare the size and progress of recent entry cohorts. Ask programme directors and study services to check for placement or thesis delays before choosing an intervention.</p>
        </section>

        <section className="panel funding-section" aria-labelledby="model-heading">
          <h2 id="model-heading">National base funding model</h2>
          <p>The ministry distributes each indicator’s funding by institutions’ shares of the same sector measure. Strategy funding is agreed separately.</p>
          <div className="funding-weights">
            {weights.map(([label, weight]) => <div key={label}><strong>{weight}%</strong><span>{label}</span></div>)}
          </div>
          <p>Bachelor’s awards account for 56% of the national model. The calculation weights completion time, qualification group and previous degrees, and applies field caps to the average award count.</p>
          <details className="funding-details">
            <summary>See the national component weights</summary>
            <table className="funding-table">
              <caption>Components under the model in force since 2025</caption>
              <thead><tr><th scope="col">Component</th><th scope="col">National weight</th></tr></thead>
              <tbody>{weights.flatMap(([category, weight, items]) => items.length ? items : [[category, weight]])
                .map(([label, weight]) => <tr key={label}><th scope="row">{label}</th><td>{weight}%</td></tr>)}</tbody>
            </table>
          </details>
          <p className="funding-sources"><a href={modelUrl}>Ministry guidance</a> · <a href={decreeUrl}>Decree 171/2024</a></p>
        </section>

        <section className="panel funding-section" aria-labelledby="allocation-heading">
          <h2 id="allocation-heading">Published allocations</h2>
          <dl className="funding-allocation">
            <div><dt>Arcada’s 2025 state award at signing</dt><dd>{euros(stateAward)}</dd></div>
            <div><dt>2026 Finnish UAS base funding budget</dt><dd>€939.168m</dd></div>
          </dl>
          <p>Arcada’s 2025 award includes {euros(allocation.indicators)} indicator-based, {euros(allocation.strategy)} strategy, {euros(allocation.vat)} VAT compensation and {euros(allocation.discretionary)} discretionary funding. The sector budget is for base funding.</p>
          <p className="funding-sources"><a href={agreement.agreementUrl}>Arcada ministry agreement, pp. 4–5</a> · <a href={budgetUrl}>2026 Finnish state budget</a></p>
        </section>
      </main>
    </div>
  );
}
