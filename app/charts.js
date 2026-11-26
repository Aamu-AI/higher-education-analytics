"use client";

import { useState } from "react";
import {
  BarChart3,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesGantt,
  Table2,
} from "lucide-react";
import "./charts.css";

const numbers = new Intl.NumberFormat("en");
const displayCount = (value) =>
  Number.isFinite(value) ? numbers.format(value) : "Unavailable";
const countFor = (row, level) => row?.[level === "both" ? "total" : level];

function axisFor(values) {
  const max = Math.max(1, ...values.filter(Number.isFinite));
  const magnitude = 10 ** Math.floor(Math.log10(max / 3));
  const interval =
    [1, 2, 2.5, 5, 10]
      .map((step) => step * magnitude)
      .find((step) => step * 4 >= max && Number.isInteger(step)) || 1;
  const ceiling = Math.ceil(max / interval) * interval;
  return Array.from(
    { length: ceiling / interval + 1 },
    (_, index) => ceiling - index * interval,
  );
}

function ViewToggle({ table, setTable, title }) {
  const Icon = table ? BarChart3 : Table2;
  const action = `Show ${title} as ${table ? "a chart" : "a table"}`;
  return (
    <button
      type="button"
      className="viz-view-toggle"
      onClick={() => setTable(!table)}
      aria-label={action}
      title={action}
    >
      <Icon size={16} strokeWidth={1.65} aria-hidden="true" />
    </button>
  );
}

function YearButton({ row, year, onYear }) {
  return (
    <button
      type="button"
      className="viz-year-button"
      onClick={() => onYear(row.year)}
      aria-pressed={row.year === year}
    >
      {row.year}
    </button>
  );
}

export function TrendPanel({ years, series, year, level, onYear }) {
  const [table, setTable] = useState(false);
  const rows = years.map(
    (period) => series.find((row) => row.year === period) ?? { year: period },
  );
  const ticks = axisFor(rows.map((row) => countFor(row, level)));
  const ceiling = ticks[0];
  const showBachelor = level !== "master";
  const showMaster = level !== "bachelor";
  return (
    <section className="viz-panel viz-trend" aria-label="Annual trend">
      <header className="viz-header">
        <div className="viz-heading">
          <ChartNoAxesColumnIncreasing aria-hidden="true" />
          <h2>Annual trend</h2>
        </div>
        <ViewToggle table={table} setTable={setTable} title="annual trend" />
      </header>
      {table ? (
        <div className="viz-table-wrap">
          <table className="viz-table">
            <caption>Degree awards by year and level</caption>
            <thead>
              <tr>
                <th scope="col">Year</th>
                {showBachelor && <th scope="col">Bachelor’s</th>}
                {showMaster && <th scope="col">Master’s</th>}
                {level === "both" && <th scope="col">Total</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year}>
                  <th scope="row">
                    <YearButton row={row} year={year} onYear={onYear} />
                  </th>
                  {showBachelor && <td>{displayCount(row.bachelor)}</td>}
                  {showMaster && <td>{displayCount(row.master)}</td>}
                  {level === "both" && <td>{displayCount(row.total)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="viz-trend-content">
          <div className="viz-legend">
            {showBachelor && (
              <span>
                <i className="viz-key viz-bachelor" />
                Bachelor’s
              </span>
            )}
            {showMaster && (
              <span>
                <i className="viz-key viz-master" />
                Master’s
              </span>
            )}
          </div>
          <div className="viz-plot">
            <div className="viz-grid" aria-hidden="true">
              {ticks.map((tick) => (
                <div className="viz-gridline" key={tick}>
                  <span>{numbers.format(tick)}</span>
                </div>
              ))}
            </div>
            <div className="viz-columns">
              {rows.map((row) => {
                const value = countFor(row, level);
                const available = Number.isFinite(value);
                const description =
                  level === "both" && available
                    ? `${row.year}, ${displayCount(value)} degrees. Bachelor’s: ${displayCount(row.bachelor)}. Master’s: ${displayCount(row.master)}.`
                    : `${row.year}, ${displayCount(value)}${available ? " degrees" : ""}`;
                return (
                  <button
                    type="button"
                    key={row.year}
                    className="viz-column"
                    aria-pressed={row.year === year}
                    title={description}
                    aria-label={`Select ${description}`}
                    onClick={() => onYear(row.year)}
                  >
                    <span
                      className="viz-bar"
                      style={{
                        height: available
                          ? `${(100 * value) / ceiling}%`
                          : "0%",
                      }}
                    >
                      <strong className="viz-value">
                        {available ? numbers.format(value) : "N/A"}
                      </strong>
                      {value > 0 &&
                        showMaster &&
                        Number.isFinite(row.master) && (
                          <span
                            className="viz-segment viz-master"
                            style={{ flexGrow: row.master }}
                          />
                        )}
                      {value > 0 &&
                        showBachelor &&
                        Number.isFinite(row.bachelor) && (
                          <span
                            className="viz-segment viz-bachelor"
                            style={{ flexGrow: row.bachelor }}
                          />
                        )}
                    </span>
                    <span className="viz-year">{row.year}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function BreakdownPanel({ items, targets, year, onField }) {
  const [mode, setMode] = useState("fields");
  const [table, setTable] = useState(false);
  const hasTargets = Boolean(targets?.length);
  const showTargets = mode === "targets" && hasTargets;
  const rows = showTargets
    ? targets
    : [...items].sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  const max = Math.max(1, ...rows.map((row) => row.value ?? 0));
  const targetScale = showTargets
    ? Math.max(
        1.06,
        ...rows.map((row) =>
          row.target > 0 ? (row.value ?? 0) / row.target : 0,
        ),
      )
    : 1;
  const complete =
    showTargets &&
    rows.every(
      (row) => Number.isFinite(row.value) && Number.isFinite(row.target),
    );
  return (
    <section className="viz-panel viz-breakdown" aria-label="Awards by field">
      <header className="viz-header">
        <div className="viz-heading">
          <ChartNoAxesGantt aria-hidden="true" />
          <h2>Awards by field</h2>
        </div>
        <ViewToggle table={table} setTable={setTable} title="awards by field" />
      </header>
      <div className="viz-break-subheader">
        {hasTargets ? (
          <div className="viz-switch" role="group" aria-label="Field breakdown">
            <button
              type="button"
              aria-pressed={!showTargets}
              onClick={() => setMode("fields")}
            >
              Awards
            </button>
            <button
              type="button"
              aria-pressed={showTargets}
              onClick={() => setMode("targets")}
            >
              Bachelor’s targets
            </button>
          </div>
        ) : (
          <span>Degree awards</span>
        )}
        <span>{year}</span>
      </div>
      {rows.length === 0 ? (
        <p className="viz-empty">No field observations for this selection.</p>
      ) : table ? (
        <div className="viz-table-wrap">
          <table className="viz-table">
            <caption>
              {showTargets
                ? "Bachelor’s awards and agreement targets"
                : "Degree awards by policy field"}{" "}
              in {year}
            </caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Awards</th>
                {showTargets && <th scope="col">Target</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">
                    {showTargets ? (
                      row.label
                    ) : (
                      <button
                        type="button"
                        className="viz-field-link"
                        onClick={() => onField(row.label)}
                      >
                        {row.label}
                      </button>
                    )}
                  </th>
                  <td>{displayCount(row.value)}</td>
                  {showTargets && <td>{displayCount(row.target)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="viz-field-list">
          {rows.map((row) => {
            const valid = Number.isFinite(row.value);
            const width = showTargets
              ? row.target > 0
                ? (row.value ?? 0) / row.target / targetScale
                : 0
              : (row.value ?? 0) / max;
            const content = (
              <>
                <span className="viz-field-label">{row.label}</span>
                <span className="viz-field-count">
                  {displayCount(row.value)}
                  {showTargets && <small> / {displayCount(row.target)}</small>}
                </span>
                <span className="viz-track" aria-hidden="true">
                  {valid && <i style={{ width: `${width * 100}%` }} />}
                  {showTargets && row.target > 0 && (
                    <b style={{ left: `${100 / targetScale}%` }} />
                  )}
                </span>
              </>
            );
            return (
              <li key={row.label}>
                {showTargets ? (
                  <div className="viz-field">{content}</div>
                ) : (
                  <button
                    type="button"
                    className="viz-field"
                    onClick={() => onField(row.label)}
                    aria-label={`Filter to ${row.label}, ${displayCount(row.value)}${valid ? " degrees" : ""}`}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {complete && (
        <div className="viz-target-summary">
          <span>
            {rows.length === 1 ? "Selected group total" : "Agreement total"}
          </span>
          <strong>
            {numbers.format(rows.reduce((sum, row) => sum + row.value, 0))} /{" "}
            {numbers.format(rows.reduce((sum, row) => sum + row.target, 0))}
          </strong>
        </div>
      )}
    </section>
  );
}
