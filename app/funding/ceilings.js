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
  selectedSchools,
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
  const { year, institution, field } = selection;
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
  const selected = selectedSchools(selection);
  const comparedGroups = (active ? [active] : groups).map((group) => ({
    ...group,
    compared: group.schools.filter((row) => selected.includes(row.id)),
  }));
  const maximum = Math.max(
    125,
    ...comparedGroups.flatMap((group) =>
      group.schools.map((row) => row.value ?? 0),
    ),
  );
  const differences = dataset.metadata.knownDifferences.filter(
    (d) =>
      selected.includes(d.institution) &&
      d.year >= year - 2 &&
      d.year <= Number(year),
  );
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
      for (const id of selected) {
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
    for (const group of comparedGroups) {
      for (const row of group.compared)
        append(
          "Group overview",
          row.id,
          group.name,
          covered(group),
          row.annual,
          row.average,
          row.ceiling,
          row.value,
          row.rank,
          row.reason,
          row.source,
        );
    }
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
        {!field && (
          <div className="gap-note">
            <strong>{dataset.institutions[institution]}</strong>
            <br />
            {largest ? (
              <>
                <strong>{largest.group.name}</strong> has the largest shortfall.
                It averaged{" "}
                <strong>
                  {display(largest.average)} of {display(largest.ceiling)}{" "}
                  degrees
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
        )}
        {selected.length === 0 && (
          <p>
            Choose schools under Compare schools to see their funding ceilings.
          </p>
        )}
        {selected.length > 0 &&
          comparedGroups.map((group) => (
            <div key={group.key}>
              <h3>{group.name}</h3>
              <p>Shared ceiling for {covered(group)}. The marker shows 100%.</p>
              <div className="table-scroll">
                <table className="ceiling-summary">
                  <caption>Selected schools · {group.name}</caption>
                  <thead>
                    <tr>
                      <th scope="col">School</th>
                      <th scope="col">{window} average</th>
                      <th scope="col">Ministry ceiling</th>
                      <th scope="col">Share of funding ceiling reached</th>
                      <th scope="col">{year} group awards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.compared.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{row.name}</th>
                        <td data-label="3-year average">
                          {display(row.average)}
                        </td>
                        <td data-label="Ministry ceiling">
                          {row.source && row.ceiling != null ? (
                            <a
                              href={row.source}
                              aria-label={
                                row.name +
                                " agreement, ceiling " +
                                display(row.ceiling)
                              }
                            >
                              {display(row.ceiling)}
                            </a>
                          ) : (
                            display(row.ceiling)
                          )}
                        </td>
                        <td data-label="Share reached">
                          {row.reason || percent(row.value)}
                          <ShareBar value={row.value} maximum={maximum} />
                        </td>
                        <td data-label={year + " group awards"}>
                          {display(row.annual)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        {differences.map((d) => (
          <p className="funding-sources" key={d.institution + d.year}>
            {dataset.institutions[d.institution]} · {d.year} source note ·{" "}
            {d.detail}
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
                      className={selected.includes(row.id) ? "chosen" : ""}
                    >
                      <td>{row.rank ?? "—"}</td>
                      <th scope="row">
                        {row.name}
                        {selected.includes(row.id) && (
                          <span className="sr"> (selected)</span>
                        )}
                      </th>
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
                      className={selected.includes(row.id) ? "chosen" : ""}
                    >
                      <td>{row.rank ?? "—"}</td>
                      <th scope="row">
                        {row.name}
                        {selected.includes(row.id) && (
                          <span className="sr"> (selected)</span>
                        )}
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
        <div
          className="table-scroll"
          role="region"
          aria-label="Annual field award counts"
          tabIndex={0}
        >
          <table>
            <caption>
              {year} bachelor’s degrees excluding commissioned education
            </caption>
            <thead>
              <tr>
                <th>Field</th>
                {selected.map((id) => (
                  <th scope="col" key={id}>
                    {dataset.institutions[id]}
                  </th>
                ))}
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
                  {selected.map((id) => (
                    <td key={id}>{formatCount(count(id, f))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
