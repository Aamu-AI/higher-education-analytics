import {
  agreementPeriod,
  awardRanking,
  fundingComparisons,
} from "../comparisons";
import {
  awardCount,
  formatCount,
  downloadCsv,
  makeCsv,
} from "../report-selection";

const decimal = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 });
const display = (value) =>
  value == null ? "Unavailable" : decimal.format(value);
const percent = (value) =>
  value == null ? "Unavailable" : display(value) + "%";

function ShareBar({ value, maximum }) {
  if (value == null) return null;
  return (
    <span className="share-track" aria-hidden="true">
      <span style={{ width: Math.min(100, (value / maximum) * 100) + "%" }} />
      <i style={{ left: (100 / maximum) * 100 + "%" }} />
    </span>
  );
}

export default function CeilingComparison({ dataset, selection, onField }) {
  const { year, institution, comparison, field } = selection;
  const period = agreementPeriod(year);
  const window = `${year - 2}–${year}`;
  const scope = { ...selection, level: "bachelor", funding: "included" };
  const groups = fundingComparisons(dataset, year);
  const own = groups.map((group) => ({
    group,
    ...group.schools.find((row) => row.id === institution),
  }));
  const comparable = own.filter((row) => row.value != null);
  const largest = comparable
    .filter((row) => row.ceiling > row.average)
    .sort((a, b) => b.ceiling - b.average - (a.ceiling - a.average))[0];
  const active = groups.find((group) => group.fields.includes(field));
  const awards = field ? awardRanking(dataset, scope) : [];
  const ownMaximum = Math.max(125, ...comparable.map((row) => row.value));
  const maximum = Math.max(
    125,
    ...(active?.schools.map((row) => row.value ?? 0) ?? []),
  );
  const differences = dataset.metadata.knownDifferences.filter(
    (d) =>
      d.institution === institution &&
      d.year >= year - 2 &&
      d.year <= Number(year),
  );
  const peer = comparison !== "sector";
  const count = (id, f) =>
    awardCount(dataset, { ...scope, institution: id, field: f });
  const covered = (group) =>
    group.fields.map((f) => dataset.fields[f]).join(", ");
  function selectField(next) {
    onField(next);
    if (next)
      requestAnimationFrame(() =>
        document.getElementById("field-rankings")?.focus(),
      );
  }
  function exportFunding() {
    const header = [
      "Measure",
      "Institution code",
      "Institution",
      "Field or group",
      "Covered fields",
      "Activity year",
      "Annual awards",
      "Three-year window",
      "Average",
      "Ceiling",
      "Share (%)",
      "Rank",
      "Availability",
      "Agreement period",
      "Agreement source",
      "Counting rule",
      "Awards release",
      "Awards source",
    ];
    const rows = [];
    const append = (
      measure,
      id,
      label,
      fields,
      annual,
      average,
      ceiling,
      share,
      rank,
      reason,
      source,
    ) =>
      rows.push([
        measure,
        id,
        dataset.institutions[id],
        label,
        fields,
        year,
        annual,
        window,
        average,
        ceiling,
        share,
        rank,
        reason,
        period,
        source,
        "Bachelor’s awards excluding commissioned education",
        dataset.metadata.releaseId,
        dataset.metadata.sourceUrl,
      ]);
    for (const [f, label] of Object.entries(dataset.fields)) {
      for (const id of peer ? [institution, comparison] : [institution]) {
        const value = count(id, f);
        append(
          "Annual field awards",
          id,
          label,
          f,
          value,
          null,
          null,
          null,
          null,
          value == null ? "No published count" : "",
          null,
        );
      }
    }
    for (const row of own)
      append(
        "Group overview",
        institution,
        row.group.name,
        covered(row.group),
        row.annual,
        row.average,
        row.ceiling,
        row.value,
        null,
        row.reason,
        row.source,
      );
    for (const row of awards)
      append(
        "Field ranking",
        row.id,
        dataset.fields[field],
        field,
        row.value,
        null,
        null,
        null,
        row.rank,
        row.value == null ? "No published count" : "",
        null,
      );
    for (const row of active?.schools ?? [])
      append(
        "Group ranking",
        row.id,
        active.name,
        covered(active),
        row.annual,
        row.average,
        row.ceiling,
        row.value,
        row.rank,
        row.reason,
        row.source,
      );
    downloadCsv(makeCsv([header, ...rows]), `funding-comparison-${year}.csv`);
  }
  return (
    <>
      <section
        className="panel funding-section"
        aria-labelledby="ceiling-title"
      >
        <div className="section-tools">
          <h2 id="ceiling-title">Bachelor’s awards against funding ceilings</h2>
          <button className="export" onClick={exportFunding}>
            Export comparison CSV
          </button>
        </div>
        <p>
          Average annual awards in {window} against{" "}
          {period
            ? `the ${period} ministry agreement`
            : "the selected period’s agreement"}
          . Counts exclude commissioned education.
        </p>
        <div className="gap-note">
          {largest ? (
            <>
              <strong>{largest.group.name}</strong> has the largest shortfall.
              It averaged{" "}
              <strong>
                {display(largest.average)} of {display(largest.ceiling)} degrees
              </strong>
              , {display(largest.ceiling - largest.average)} degrees below its
              ceiling.
            </>
          ) : comparable.length ? (
            "Every comparable group reaches its ceiling."
          ) : (
            "No group has both a verified ceiling and three comparable years."
          )}
          <small>
            {comparable.length} of {groups.length} ministry groups comparable
          </small>
        </div>
        <div className="table-scroll">
          <table className="ceiling-summary">
            <caption>
              Ministry groups · {dataset.institutions[institution]}
            </caption>
            <thead>
              <tr>
                <th>Ministry group</th>
                <th>{year} awards</th>
                <th>{window} average</th>
                <th>Ceiling</th>
                <th>Share reached</th>
              </tr>
            </thead>
            <tbody>
              {own.map((row) => (
                <tr key={row.group.key}>
                  <th scope="row">
                    {row.group.name}
                    <small className="cell-note">{covered(row.group)}</small>
                  </th>
                  <td data-label={year + " awards"}>{display(row.annual)}</td>
                  <td data-label="3-year average">{display(row.average)}</td>
                  <td data-label="Ceiling">{display(row.ceiling)}</td>
                  <td data-label="Share reached">
                    {row.value == null ? row.reason : percent(row.value)}
                    <ShareBar value={row.value} maximum={ownMaximum} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="funding-sources">
          The vertical marker shows 100%. Each group combines the fields listed.{" "}
          {own[0].source && (
            <a href={own[0].source}>Ministry agreement, degree targets</a>
          )}
        </p>
        {differences.map((d) => (
          <p className="funding-sources" key={d.year}>
            {d.year} source note · {d.detail}
          </p>
        ))}
      </section>
      {active && (
        <div
          className="compare-grid"
          id="field-rankings"
          tabIndex={-1}
          role="region"
          aria-label="Field and group comparisons"
        >
          <section className="panel funding-section">
            <h2>{dataset.fields[field]} awards by school</h2>
            <p>
              {year} bachelor’s degrees ·{" "}
              {awards.filter((r) => r.rank != null).length} schools ranked
            </p>
            <div className="table-scroll">
              <table>
                <caption className="sr">Annual field ranking</caption>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>School</th>
                    <th>Awards</th>
                  </tr>
                </thead>
                <tbody>
                  {awards.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        [institution, comparison].includes(row.id)
                          ? "chosen"
                          : ""
                      }
                    >
                      <td>{row.rank ?? "—"}</td>
                      <th scope="row">{row.name}</th>
                      <td>{row.value ?? "No published count"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel funding-section">
            <h2>Share of funding ceiling reached</h2>
            <p>
              <strong>{active.name}</strong> · {covered(active)}.
            </p>
            <p>
              {window} average · marker at 100% ·{" "}
              {active.schools.filter((r) => r.rank != null).length} schools
              ranked
            </p>
            <div className="table-scroll">
              <table>
                <caption className="sr">Ministry group ranking</caption>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>School</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {active.schools.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        [institution, comparison].includes(row.id)
                          ? "chosen"
                          : ""
                      }
                    >
                      <td>{row.rank ?? "—"}</td>
                      <th scope="row">
                        {row.name}
                        {row.source && row.ceiling != null && (
                          <small className="cell-note">
                            <a href={row.source}>
                              Ceiling {display(row.ceiling)}
                            </a>{" "}
                            · average {display(row.average)}
                          </small>
                        )}
                      </th>
                      <td>
                        {row.reason || percent(row.value)}
                        <ShareBar value={row.value} maximum={maximum} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
      <section className="panel funding-section">
        <h2>Annual awards by Vipunen field</h2>
        <p>
          Select a field to see its school ranking and the ranking for its
          funding group.
        </p>
        <div className="table-scroll">
          <table>
            <caption>
              {year} bachelor’s degrees excluding commissioned education
            </caption>
            <thead>
              <tr>
                <th>Field</th>
                <th>{dataset.institutions[institution]}</th>
                {peer && <th>{dataset.institutions[comparison]}</th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(dataset.fields).map(([f, label]) => (
                <tr key={f} className={f === field ? "chosen" : ""}>
                  <th scope="row">
                    <button
                      className="text-btn"
                      aria-pressed={field === f}
                      onClick={() => selectField(f === field ? "" : f)}
                    >
                      {label}
                    </button>
                  </th>
                  <td>{formatCount(count(institution, f))}</td>
                  {peer && <td>{formatCount(count(comparison, f))}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
