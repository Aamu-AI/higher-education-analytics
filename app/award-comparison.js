import { awardRanking } from "./comparisons";
import {
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
const schoolIds = (rows) =>
  rows
    .filter((row) => row.rank != null)
    .map((row) => row.id)
    .sort()
    .join(",");
const change = (n) => (n > 0 ? "+" + n : String(n));

function TrendLines({ series, years, rank, coverage }) {
  const maximum = rank
    ? Math.max(2, ...coverage)
    : Math.max(1, ...series.flatMap((s) => s.values).filter((v) => v != null));
  const y = (v) =>
    rank ? 18 + (142 * (v - 1)) / (maximum - 1) : 160 - (142 * v) / maximum;
  const x = (i) => 48 + (425 * i) / Math.max(1, years.length - 1);
  const ticks = [
    ...new Set([
      rank ? 1 : maximum,
      Math.round(maximum / 2),
      rank ? maximum : 0,
    ]),
  ];
  return (
    <svg
      className="school-trend"
      viewBox="0 0 500 194"
      role="img"
      aria-label={
        rank ? "Institution ranks over time" : "Degree counts over time"
      }
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
      {series.map(({ id, name, values }, index) => (
        <g
          key={id}
          stroke={colors[index % colors.length]}
          fill={colors[index % colors.length]}
        >
          {values.map((value, i) =>
            value == null ? null : (
              <g key={i}>
                {i > 0 && values[i - 1] != null && (
                  <line
                    x1={x(i - 1)}
                    y1={y(values[i - 1])}
                    x2={x(i)}
                    y2={y(value)}
                    strokeWidth="2.5"
                    strokeDasharray={index % 2 ? "6 3" : undefined}
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

export default function AwardComparison({ dataset, selection, set }) {
  const { institution, comparison, field, year, level, funding, trend, peers } =
    selection;
  const { years } = dataset.metadata;
  const history = years.map((y) =>
    awardRanking(dataset, { ...selection, year: y }),
  );
  const index = years.indexOf(Number(year));
  const current = history[index];
  const own = current.find((row) => row.id === institution);
  const prior = history[index - 1] ?? [];
  const comparable =
    years[index - 1] === Number(year) - 1 &&
    schoolIds(current) === schoolIds(prior);
  const peerIds = peers ? peers.split(",") : [];
  const ids = [
    ...new Set([
      institution,
      ...(comparison === "sector" ? [] : [comparison]),
      ...peerIds,
    ]),
  ];
  const rank = trend === "rank";
  const coverage = history.map(
    (rows) => rows.filter((r) => r.rank != null).length,
  );
  const series = ids.map((id) => ({
    id,
    name: dataset.institutions[id],
    values: history.map(
      (rows) => rows.find((r) => r.id === id)[rank ? "rank" : "value"],
    ),
  }));
  const rankChange = (row) => {
    const before = prior.find((p) => p.id === row.id);
    return comparable && row.rank != null && before?.rank != null
      ? before.rank - row.rank
      : null;
  };
  function toggle(id) {
    set(
      "peers",
      (peerIds.includes(id)
        ? peerIds.filter((p) => p !== id)
        : [...peerIds, id]
      ).join(","),
    );
  }
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
        row.rank,
        delta,
        coverage[i],
        dataset.metadata.releaseId,
        dataset.metadata.sourceUrl,
      ]);
    }
    current.forEach((row) => add("Ranking", row, index, rankChange(row)));
    history.forEach((schools, i) =>
      schools
        .filter((s) => ids.includes(s.id))
        .forEach((s) => add("Selected trend", s, i, null)),
    );
    downloadCsv(makeCsv(rows), `school-comparison-${year}.csv`);
  }
  return (
    <>
      {comparison !== "sector" && (
        <section className="panel funding-section">
          <h2>Annual awards side by side</h2>
          <p>
            {year} · {LEVELS[level]} · {FUNDING[funding]}
          </p>
          <div className="table-scroll">
            <table>
              <caption className="sr">Awards by school and field</caption>
              <thead>
                <tr>
                  <th>Field</th>
                  {[institution, comparison].map((id) => (
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
                      {[institution, comparison].map((id) => (
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
            </table>
          </div>
        </section>
      )}
      <div className="compare-grid awards-compare">
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
          <p>Select a school to add its trend line.</p>
          <div className="table-scroll">
            <table>
              <caption className="sr">Annual institution rankings</caption>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th className="align-left">Institution</th>
                  <th>Awards</th>
                  <th>Rank change</th>
                </tr>
              </thead>
              <tbody>
                {current.map((row) => (
                  <tr
                    key={row.id}
                    className={ids.includes(row.id) ? "chosen" : ""}
                  >
                    <td>{row.rank ?? "—"}</td>
                    <th scope="row">
                      <button
                        className="text-btn"
                        aria-pressed={ids.includes(row.id)}
                        disabled={
                          row.id === institution || row.id === comparison
                        }
                        onClick={() => toggle(row.id)}
                      >
                        {short(row.name)}
                      </button>
                    </th>
                    <td>
                      {row.value == null
                        ? "No published count"
                        : label(row.value)}
                    </td>
                    <td>
                      {rankChange(row) == null ? "" : change(rankChange(row))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="funding-sources">
            Positive change means a higher rank than last year. Blank cells
            indicate that the positions cannot be compared.
          </p>
          <button className="export" onClick={exportResults}>
            Export ranking and trend CSV
          </button>
        </section>
        <section className="panel funding-section">
          <h2>School trends</h2>
          <p>{scope}</p>
          <div className="viz-switch" role="group" aria-label="Trend measure">
            {[
              ["count", "Degree counts"],
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
                <i style={{ background: colors[i % colors.length] }} />
                {short(s.name)}
              </span>
            ))}
          </div>
          <TrendLines
            series={series}
            years={years}
            rank={rank}
            coverage={coverage}
          />
          <div className="table-scroll">
            <table>
              <caption>{rank ? "Rank" : "Degree counts"} by year</caption>
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
                {years.map((y, i) => (
                  <tr key={y}>
                    <th scope="row">{y}</th>
                    {series.map((s) => (
                      <td key={s.id}>{label(s.values[i])}</td>
                    ))}
                    <td>{coverage[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
