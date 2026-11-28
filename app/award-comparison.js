import { annualRankings, agreementPeriod, groups } from "./comparisons";
import {
  AWARD_ORDERS,
  selectedSchools,
  selectedChartYears,
  awardCount,
  downloadCsv,
  FUNDING,
  LEVELS,
  makeCsv,
} from "./report-selection";

const number = new Intl.NumberFormat("en-GB");
const label = (value) => (value == null ? "Unavailable" : number.format(value));
const short = (name) => name.replace(/ University of Applied Sciences$/, "");
const colors = [
  "#c6f18e",
  "#95cafa",
  "#ffc49b",
  "#dfadff",
  "#93d6cb",
  "#f6c7d6",
];
const linePattern = (index) =>
  [undefined, "6 3", "2 3", "7 2 2 2"][Math.floor(index / colors.length) % 4];
const schoolIds = (rows) =>
  rows
    .filter((row) => row.rank != null)
    .map((row) => row.id)
    .sort()
    .join(",");
const change = (n) => (n > 0 ? "+" + n : String(n));

const trendLabels = {
  count: "Degree counts",
  growth: "Change in degrees",
  rank: "Rank",
};

function TrendLines({ series, years, trend, coverage }) {
  const rank = trend === "rank";
  const values = series.flatMap((s) => s.values).filter((v) => v != null);
  const low = rank ? 1 : Math.min(0, ...values);
  const high = rank
    ? Math.max(2, ...coverage)
    : Math.max(low + 1, 0, ...values);
  const y = (v) =>
    rank
      ? 18 + (142 * (v - low)) / (high - low)
      : 160 - (142 * (v - low)) / (high - low);
  const x = (i) =>
    years.length === 1
      ? 260
      : 48 + (425 * (years[i] - years[0])) / (years.at(-1) - years[0]);
  const middle = low < 0 && high > 0 ? 0 : Math.round((high + low) / 2);
  const ticks = [...new Set([high, middle, low])];
  return (
    <svg
      className="school-trend"
      viewBox="0 0 500 194"
      role="img"
      aria-label={trendLabels[trend] + " over time"}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1="48" x2="473" y1={y(t)} y2={y(t)} className="trend-grid" />
          <text x="40" y={y(t) + 4} textAnchor="end">
            {label(t)}
          </text>
        </g>
      ))}
      {years.map((year, i) => (
        <text key={year} x={x(i)} y="184" textAnchor="middle">
          {year}
        </text>
      ))}
      {series.map(({ id, name, values, connected }, index) => (
        <g
          key={id}
          stroke={colors[index % colors.length]}
          fill={colors[index % colors.length]}
        >
          {values.map((value, i) =>
            value == null ? null : (
              <g key={i}>
                {connected[i] && (
                  <line
                    x1={x(i - 1)}
                    y1={y(values[i - 1])}
                    x2={x(i)}
                    y2={y(value)}
                    strokeWidth="2.5"
                    strokeDasharray={linePattern(index)}
                  />
                )}
                <circle cx={x(i)} cy={y(value)} r="3.4">
                  <title>
                    {name} · {years[i]} · {label(value)}
                  </title>
                </circle>
              </g>
            ),
          )}
        </g>
      ))}
    </svg>
  );
}

const percentage = new Intl.NumberFormat("en-GB", {
  style: "percent",
  maximumFractionDigits: 1,
});

function TargetCell({ result, source, heading }) {
  if (result.share == null) return <td data-label={heading}>Unavailable</td>;
  return (
    <td className="annual-target" data-label={heading}>
      <strong>{percentage.format(result.share)}</strong>
      <small>
        <a href={source}>
          {label(result.count)} / {label(result.target)}
        </a>
      </small>
    </td>
  );
}

function RankMovement({ value }) {
  if (value == null) return null;
  const direction = value > 0 ? "Up" : "Down";
  return (
    <>
      <span className="sr">
        {value === 0 ? "Unchanged" : direction + " " + Math.abs(value)}
      </span>
      <span aria-hidden="true">
        {value === 0 ? "–" : (value > 0 ? "↑ " : "↓ ") + Math.abs(value)}
      </span>
    </>
  );
}

export default function AwardComparison({ dataset, selection, set }) {
  const { institution, field, year, level, funding, trend } = selection;
  const { years } = dataset.metadata;
  const group = groups.find((g) => g.fields.includes(field));
  const showBachelor = level !== "master";
  const showMaster = level !== "bachelor";
  const orders = Object.entries(AWARD_ORDERS).filter(
    ([key]) =>
      !(key.startsWith("bachelor") && !showBachelor) &&
      !(key.startsWith("master") && (!showMaster || group)),
  );
  const order = orders.some(([key]) => key === selection.order)
    ? selection.order
    : "awards";
  const history = annualRankings(dataset, selection, order);
  const index = years.indexOf(Number(year));
  const current = history[index];
  const own = current.find((row) => row.id === institution);
  const prior = history[index - 1] ?? [];
  const comparable =
    years[index - 1] === Number(year) - 1 &&
    schoolIds(current) === schoolIds(prior) &&
    (["awards", "growth"].includes(order) ||
      agreementPeriod(year) === agreementPeriod(year - 1));
  const ids = selectedSchools(selection);
  const rank = trend === "rank";
  const coverage = history.map(
    (rows) => rows.filter((r) => r.rank != null).length,
  );
  const chartYears = selectedChartYears(selection.chartYears, years);
  const periods = chartYears.map((y) => years.indexOf(y));
  const series = ids.map((id) => {
    const historyValues = history.map(
      (rows) =>
        rows.find((row) => row.id === id)[trend === "count" ? "value" : trend],
    );
    return {
      id,
      name: dataset.institutions[id],
      values: periods.map((i) => historyValues[i]),
      connected: periods.map(
        (end, i) =>
          i > 0 &&
          historyValues
            .slice(periods[i - 1], end + 1)
            .every((value) => value != null),
      ),
    };
  });
  const rankChange = (row) => {
    const before = prior.find((p) => p.id === row.id);
    return comparable && row.rank != null && before?.rank != null
      ? before.rank - row.rank
      : null;
  };
  const scope = `${field ? dataset.fields[field] : "All fields"} · ${LEVELS[level]} · ${FUNDING[funding]}`;
  function exportResults() {
    const rows = [
      [
        "Series",
        "School code",
        "School",
        "Year",
        "Level",
        "Field",
        "Counting rule",
        "Awards",
        "Previous awards",
        "Additional degrees",
        "Ranked by",
        "Bachelor’s eligible awards",
        "Bachelor’s target",
        "Bachelor’s target (%)",
        "Master’s awards",
        "Master’s target",
        "Master’s target (%)",
        "Agreement period",
        "Bachelor’s target scope",
        "Agreement source",
        "Rank",
        "Change in rank",
        "Schools ranked",
        "Release",
        "Source",
      ],
    ];
    function add(type, row, i, delta) {
      rows.push([
        type,
        row.id,
        row.name,
        years[i],
        LEVELS[level],
        field || "All fields",
        FUNDING[funding],
        row.value,
        row.before,
        row.growth,
        AWARD_ORDERS[order],
        row.bachelor.count,
        row.bachelor.target,
        row.bachelor.share == null ? null : 100 * row.bachelor.share,
        row.master.count,
        row.master.target,
        row.master.share == null ? null : 100 * row.master.share,
        agreementPeriod(years[i]),
        group?.name ?? "Institution",
        row.source,
        row.rank,
        delta,
        coverage[i],
        dataset.metadata.releaseId,
        dataset.metadata.sourceUrl,
      ]);
    }
    current.forEach((row) => add("Ranking", row, index, rankChange(row)));
    periods.forEach((i) =>
      history[i]
        .filter((s) => ids.includes(s.id))
        .forEach((s) => add("Selected trend", s, i, null)),
    );
    downloadCsv(makeCsv(rows), `school-comparison-${year}.csv`);
  }
  return (
    <>
      <div className="awards-workspace">
        <section className="panel funding-section">
          <h2>Institution rankings</h2>
          <p>
            {scope} · {year}
          </p>
          <p className="selected-awards">
            <strong>
              {short(own.name)} · {label(own.value)}
              {own.value == null ? "" : " awards"}
            </strong>
            <br />
            {own.rank == null ? "Unranked" : "Rank " + own.rank} ·{" "}
            {coverage[index]} schools ranked
          </p>
          <label className="ranking-order">
            Rank schools by
            <select
              value={order}
              onChange={(event) => set("order", event.target.value)}
            >
              {orders.map(([key, title]) => (
                <option key={key} value={key}>
                  {title}
                </option>
              ))}
            </select>
          </label>
          <p>
            Schools selected under Compare are highlighted.{" "}
            <a href="#school-trends">View chart ({ids.length} selected)</a>
          </p>
          <p className="funding-sources">
            Target percentages use annual awards against the agreement’s annual
            average target. Bachelor’s counts exclude commissioned education.
            Master’s counts include all funding sources.
            {group && (
              <>
                {" "}
                The bachelor’s comparison covers the whole {group.name} group.
                Master’s field targets are unavailable.
              </>
            )}
            {!agreementPeriod(year) && (
              <> Agreement targets are unavailable for {year}.</>
            )}
          </p>
          <div
            className="table-scroll rankings-scroll"
            role="region"
            aria-label="Scrollable school rankings"
            tabIndex={0}
          >
            <table>
              <caption className="sr">Annual institution rankings</caption>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th className="align-left">Institution</th>
                  <th>{year} awards</th>
                  <th>Change in degrees</th>
                  {showBachelor && <th>Bachelor’s target reached</th>}
                  {showMaster && <th>Master’s target reached</th>}
                  <th>Rank change</th>
                </tr>
              </thead>
              <tbody>
                {current.map((row) => (
                  <tr
                    key={row.id}
                    className={ids.includes(row.id) ? "chosen" : ""}
                  >
                    <td className="annual-rank" data-label="Rank">
                      {row.rank ?? "—"}
                    </td>
                    <th scope="row">
                      {short(row.name)}
                      {ids.includes(row.id) && (
                        <span className="sr"> (selected for comparison)</span>
                      )}
                    </th>
                    <td data-label={year + " awards"}>
                      {row.value == null
                        ? "No published count"
                        : label(row.value)}
                    </td>
                    <td data-label="Award change">
                      {row.growth == null ? "Unavailable" : change(row.growth)}
                    </td>
                    {showBachelor && (
                      <TargetCell
                        heading="Bachelor’s target"
                        result={row.bachelor}
                        source={row.source}
                      />
                    )}
                    {showMaster && (
                      <TargetCell
                        heading="Master’s target"
                        result={row.master}
                        source={row.source}
                      />
                    )}
                    <td data-label="Rank change">
                      <RankMovement value={rankChange(row)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="funding-sources">
            Arrows show movement since last year under the selected ranking. A
            dash means the rank held steady. A blank means the years cannot be
            compared.
            {!["awards", "growth"].includes(order) &&
              agreementPeriod(year) !== agreementPeriod(year - 1) && (
                <>
                  {" "}
                  The agreement period changed between {year - 1} and {year}.
                </>
              )}
          </p>
          <button className="export" onClick={exportResults}>
            Export ranking and trend CSV
          </button>
        </section>
        <section className="panel funding-section">
          <h2 id="school-trends" tabIndex={-1}>
            School trends
          </h2>
          <p>
            {scope}
            {rank && <> · {AWARD_ORDERS[order]}</>}
          </p>
          <div className="viz-switch" role="group" aria-label="Trend measure">
            {[
              ["count", "Degree counts"],
              ["growth", "Change in degrees"],
              ["rank", "Rank over time"],
            ].map(([mode, name]) => (
              <button
                key={mode}
                aria-pressed={trend === mode}
                onClick={() => set("trend", mode)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="trend-legend">
            {series.map((s, i) => (
              <span key={s.id}>
                <svg width="20" height="6" aria-hidden="true">
                  <line
                    x1="0"
                    x2="20"
                    y1="3"
                    y2="3"
                    stroke={colors[i % colors.length]}
                    strokeWidth="2.5"
                    strokeDasharray={linePattern(i)}
                  />
                </svg>
                {short(s.name)}
              </span>
            ))}
          </div>
          {ids.length === 0 ? (
            <p>Select a school under Compare schools to see its trend.</p>
          ) : !periods.length ? (
            <p>Select one or more chart years to see the trend.</p>
          ) : (
            <TrendLines
              series={series}
              years={chartYears}
              trend={trend}
              coverage={periods.map((i) => coverage[i])}
            />
          )}
          <div
            className="table-scroll"
            role="region"
            aria-label="School trend values"
            tabIndex={0}
          >
            <table>
              <caption>{trendLabels[trend]} by year</caption>
              <thead>
                <tr>
                  <th>Year</th>
                  {series.map((s) => (
                    <th key={s.id}>{short(s.name)}</th>
                  ))}
                  <th>Schools ranked</th>
                </tr>
              </thead>
              <tbody>
                {chartYears.map((y, i) => (
                  <tr key={y}>
                    <th scope="row">{y}</th>
                    {series.map((s) => (
                      <td key={s.id}>{label(s.values[i])}</td>
                    ))}
                    <td>{coverage[periods[i]]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {ids.length > 1 && (
        <section className="panel funding-section">
          <h2>Annual awards side by side</h2>
          <p>
            {year} · {LEVELS[level]} · {FUNDING[funding]}
          </p>
          <div
            className="table-scroll"
            role="region"
            aria-label="School comparison values"
            tabIndex={0}
          >
            <table>
              <caption className="sr">Awards by school and field</caption>
              <thead>
                <tr>
                  <th>Field</th>
                  {ids.map((id) => (
                    <th key={id}>{short(dataset.institutions[id])}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(dataset.fields)
                  .filter(([f]) => !field || f === field)
                  .map(([f, name]) => (
                    <tr key={f}>
                      <th scope="row">{name}</th>
                      {ids.map((id) => (
                        <td key={id}>
                          {label(
                            awardCount(dataset, {
                              ...selection,
                              institution: id,
                              field: f,
                            }),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">
                    {field ? "Selected field awards" : "Total awards"}
                  </th>
                  {ids.map((id) => (
                    <td key={id}>
                      {label(current.find((row) => row.id === id).value)}
                    </td>
                  ))}
                </tr>
                {[
                  ...(showBachelor ? ["bachelor"] : []),
                  ...(showMaster ? ["master"] : []),
                ].map((key) => (
                  <tr key={key}>
                    <th scope="row">
                      {key === "bachelor" ? "Bachelor’s" : "Master’s"} target
                      reached
                      {key === "bachelor" && group ? " · " + group.name : ""}
                    </th>
                    {ids.map((id) => {
                      const row = current.find((school) => school.id === id);
                      return (
                        <TargetCell
                          key={id}
                          result={row[key]}
                          source={row.source}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
