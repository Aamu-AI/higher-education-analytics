"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  Building2,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  ExternalLink,
  GraduationCap,
  Layers3,
  Menu,
  PanelLeftClose,
  RotateCcw,
  SlidersHorizontal,
  Table2,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { TrendPanel, BreakdownPanel } from "./charts";
import { agreements } from "../data/institutions-config";

const DEFAULTS = {
  institution: "02535",
  year: "2025",
  level: "both",
  funding: "included",
  field: "",
};
const LEVELS = {
  both: "All levels",
  bachelor: "Bachelor’s",
  master: "Master’s",
};
const FUNDING = {
  included: "Exclude commissioned",
  all: "All funding sources",
};
const format = (value) =>
  value == null ? "—" : new Intl.NumberFormat("en-GB").format(value);
const diff = (value, prior) =>
  value == null || prior == null ? null : value - prior;
const signed = (value) =>
  value == null
    ? "—"
    : (value > 0 ? "+" : value < 0 ? "−" : "") + format(Math.abs(value));
const shortName = (name) =>
  name
    .replace(/ (University|UAS) of Applied Sciences/i, "")
    .replace(/^University of Applied Sciences /i, "");
const shortField = (name) =>
  name === "Information and communication technology" ? "ICT" : name;

function readFilters(data) {
  const params = new URLSearchParams(window.location.search);
  const allowed = {
    institution: Object.keys(data.institutions),
    year: data.metadata.years.map(String),
    level: Object.keys(LEVELS),
    funding: Object.keys(FUNDING),
    field: Object.keys(data.fields),
  };
  return Object.fromEntries(
    Object.entries(DEFAULTS).map(([key, fallback]) => [
      key,
      allowed[key].includes(params.get(key)) ? params.get(key) : fallback,
    ]),
  );
}

function SelectFilter({ label, value, options, change }) {
  return (
    <label className="filter">
      <span>{label}</span>
      <span className="select-wrap">
        <select value={value} onChange={(e) => change(e.target.value)}>
          {options.map(([key, text]) => (
            <option key={key} value={key}>
              {text}
            </option>
          ))}
        </select>
        <ChevronDown size={15} aria-hidden="true" />
      </span>
    </label>
  );
}

function Logo() {
  return (
    <div className="logo">
      <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
        <path
          fill="currentColor"
          d="M1 33 18 4h6l15 29h-9L20.5 14 10 33zm13 0 6.7-11.8L27 33z"
        />
      </svg>
      <span>
        aamu<span className="brand-period">.</span>
      </span>
      <span className="brand-product">Analytics</span>
    </div>
  );
}

function Metric({ label, icon: Icon, children, note, accent }) {
  return (
    <section
      aria-label={label}
      className={"metric" + (accent ? " accent" : "")}
    >
      <div className="metric-label">
        {label}
        <Icon size={17} aria-hidden="true" />
      </div>
      <div className="metric-value">{children}</div>
      <div className="metric-note">{note}</div>
    </section>
  );
}

function SourceDialog({ dialog, data }) {
  const m = data.metadata;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="sources-heading"
      className="source-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) dialog.current.close();
      }}
    >
      <div>
        <div className="dialog-head">
          <Database size={22} />
          <h2 id="sources-heading">Sources and definitions</h2>
          <button
            aria-label="Close sources"
            onClick={() => dialog.current.close()}
          >
            <X size={18} />
          </button>
        </div>
        <p>
          Final annual degree awards at the{" "}
          {Object.keys(data.institutions).length} universities of applied
          sciences covered by Vipunen. Åland and the Police University College
          are outside this population.
        </p>
        <dl>
          <dt>All funding sources</dt>
          <dd>
            Includes commissioned education. Use this definition for national
            statistics.
          </dd>
          <dt>Exclude commissioned</dt>
          <dd>
            Excludes awards funded by <i>Maksullinen tilauskoulutus</i>. Arcada
            uses this definition in its annual report.
          </dd>
          <dt>Agreement targets</dt>
          <dd>
            Arcada’s 2025 agreement covers bachelor’s degrees excluding
            commissioned education. The field mapping awaits written
            confirmation.{" "}
            <a href={agreements["02535"][2025].source}>
              Annual report, Table 2
            </a>
          </dd>
          <dt>Source differences</dt>
          {m.knownDifferences.map((x) => (
            <dd key={x.institution}>{x.detail}</dd>
          ))}
          <dt>Release</dt>
          <dd>
            {m.sourceStamps
              ? Object.entries(m.sourceStamps).map(([year, stamp]) => year + ": " + stamp).join(" · ")
              : m.sourceStamp} · Retrieved {m.retrievedAt} ·{" "}
            <code>{m.releaseId.slice(0, 12)}</code>
          </dd>
        </dl>
        <p className="provenance">
          {m.source}. <a href={m.sourceUrl}>{m.resource}</a>.{" "}
          <a href={m.upstreamUrl}>{m.upstream}</a>. Aggregated and translated
          for this dashboard. Institution names from{" "}
          <a href={m.institutionLabelsUrl}>StatFin 13k9</a>.{" "}
          <a href={m.licenceUrl}>{m.licence}</a>.
        </p>
      </div>
    </dialog>
  );
}

export default function Dashboard({ dataset }) {
  const { institutions, fields, records, metadata } = dataset;
  const [filters, setFilters] = useState(DEFAULTS);
  const [sidebar, setSidebar] = useState(false);
  const [peersExpanded, setPeersExpanded] = useState(false);
  const dialog = useRef(null);
  const filterTrigger = useRef(null);
  const filterClose = useRef(null);
  const filterAside = useRef(null);
  useEffect(() => {
    function sync() {
      setFilters(readFilters(dataset));
    }
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [dataset]);
  useEffect(() => {
    if (!sidebar) return;
    filterClose.current?.focus();
    function handle(e) {
      if (e.key === "Escape") {
        setSidebar(false);
        filterTrigger.current?.focus();
      }
      if (e.key === "Tab") {
        const nodes = [
          ...filterAside.current.querySelectorAll(
            "button:not(:disabled),select,a[href]",
          ),
        ].filter((el) => el.offsetParent !== null);
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [sidebar]);
  function apply(next) {
    setFilters(next);
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next))
      if (v !== DEFAULTS[k]) params.set(k, v);
    const search = params.toString();
    window.history.pushState(
      null,
      "",
      window.location.pathname + (search ? "?" + search : ""),
    );
  }
  const set = (key, value) => apply({ ...filters, [key]: value });
  const { institution, level, funding, field } = filters;
  const year = Number(filters.year);
  const { years } = metadata;
  const institutionList = Object.entries(institutions).sort((a, b) =>
    a[1].localeCompare(b[1], "en"),
  );
  function count(
    y,
    id = institution,
    which = level,
    policy = field,
    measure = funding,
  ) {
    const hits = records.filter(
      (r) =>
        r.year === y &&
        r.institution === id &&
        (which === "both" || r.level === which) &&
        (!policy || r.field === policy),
    );
    return hits.length ? hits.reduce((sum, r) => sum + r[measure], 0) : null;
  }
  const total = count(year),
    prior = count(year - 1),
    delta = diff(total, prior);
  const institutionFields = Object.keys(fields).filter((f) =>
    records.some(
      (r) =>
        r.institution === institution &&
        r.field === f &&
        (level === "both" || r.level === level),
    ),
  );
  const visibleFields = field ? [field] : institutionFields;
  const matrix = visibleFields
    .map((f) => ({
      key: f,
      label: shortField(fields[f]),
      values: years.map((y) => count(y, institution, level, f)),
    }))
    .sort(
      (a, b) =>
        (b.values[years.indexOf(year)] ?? -1) -
          (a.values[years.indexOf(year)] ?? -1) ||
        a.label.localeCompare(b.label),
    );
  const bars = matrix.map((r) => ({
    label: r.label,
    value: r.values[years.indexOf(year)],
  }));
  const series = years.map((y) => ({
    year: y,
    total: count(y),
    bachelor: level === "master" ? null : count(y, institution, "bachelor"),
    master: level === "bachelor" ? null : count(y, institution, "master"),
  }));
  const agreement = agreements[institution]?.[year];
  const applicable = agreement && level !== "master" && funding === "included";
  const targetGroups = applicable
    ? agreement.groups.filter(
        (g) => !field || (g.fields.length === 1 && g.fields[0] === field),
      )
    : [];
  const targets = targetGroups.length
    ? targetGroups.map((g) => {
        const values = g.fields.map((f) =>
          count(year, institution, "bachelor", f, "included"),
        );
        return {
          label: g.name,
          target: g.target,
          value: values.every((v) => v != null)
            ? values.reduce((a, b) => a + b, 0)
            : null,
        };
      })
    : null;
  const goal = targets?.reduce((s, g) => s + g.target, 0);
  const achieved = targets?.every((g) => g.value != null)
    ? targets.reduce((s, g) => s + g.value, 0)
    : null;
  const attainment =
    goal && achieved != null ? Math.round((100 * achieved) / goal) : null;
  const peers = institutionList
    .map(([id, name]) => ({
      id,
      name,
      value: count(year, id),
      prior: count(year - 1, id),
    }))
    .sort(
      (a, b) =>
        (b.value ?? -1) - (a.value ?? -1) || a.name.localeCompare(b.name),
    );
  const selectionIndex = peers.findIndex((p) => p.id === institution);
  const start = Math.max(0, Math.min(selectionIndex - 2, peers.length - 5));
  const displayed = peersExpanded ? peers : peers.slice(start, start + 5);
  function exportCsv() {
    const headers = [
      "Institution code",
      "Institution",
      "Year",
      "Degree level",
      "Policy field",
      "Funding definition",
      "Degrees",
      "Unit",
      "Release type",
      "Source update",
      "Retrieved",
      "Release ID",
      "Source",
      "Resource URL",
      "Upstream source",
      "Licence",
      "Transformations",
    ];
    const body = records
      .filter(
        (r) =>
          r.institution === institution &&
          r.year === year &&
          (level === "both" || r.level === level) &&
          (!field || r.field === field),
      )
      .map((r) => [
        r.institution,
        institutions[institution],
        r.year,
        LEVELS[r.level],
        fields[r.field],
        FUNDING[funding],
        r[funding],
        metadata.unit,
        metadata.releaseType,
        metadata.sourceStamps?.[r.year] ?? metadata.sourceStamp,
        metadata.retrievedAt,
        metadata.releaseId,
        metadata.source,
        metadata.sourceUrl,
        metadata.upstream,
        metadata.licenceUrl,
        metadata.transformations,
      ]);
    const contents = [headers, ...body]
      .map((row) =>
        row.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "degree-awards-" + institution + "-" + year + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function closeFilters() {
    setSidebar(false);
    filterTrigger.current?.focus();
  }
  return (
    <div className="shell">
      <a href="#content" className="skip">
        Skip to dashboard
      </a>
      {sidebar && (
        <button
          className="veil"
          onClick={closeFilters}
          aria-label="Close filters"
        />
      )}
      <aside
        id="filters"
        ref={filterAside}
        className={"sidebar" + (sidebar ? " open" : "")}
        aria-label="Report controls"
      >
        <div className="brand-row">
          <Logo />
          <button
            className="mobile-close"
            ref={filterClose}
            onClick={closeFilters}
            aria-label="Close filters"
          >
            <PanelLeftClose size={19} />
          </button>
        </div>
        <div className="side-inner">
          <div className="side-label">Workspace</div>
          <div className="active-report">
            <ChartNoAxesColumnIncreasing size={18} />
            <strong>Degree awards</strong>
            <span />
          </div>
          <div className="side-rule" />
          <div className="filter-heading">
            <span className="side-label">Report filters</span>
            <SlidersHorizontal size={14} />
          </div>
          <SelectFilter
            label="Institution"
            value={institution}
            options={institutionList.map(([id, n]) => [id, shortName(n)])}
            change={(v) => set("institution", v)}
          />
          <SelectFilter
            label="Reporting year"
            value={filters.year}
            options={years.toReversed().map((y) => [String(y), String(y)])}
            change={(v) => set("year", v)}
          />
          <SelectFilter
            label="Degree level"
            value={level}
            options={Object.entries(LEVELS)}
            change={(v) => set("level", v)}
          />
          <SelectFilter
            label="Field of education"
            value={field}
            options={[
              ["", "All fields"],
              ...Object.entries(fields)
                .map(([k, v]) => [k, shortField(v)])
                .sort((a, b) => a[1].localeCompare(b[1])),
            ]}
            change={(v) => set("field", v)}
          />
          <SelectFilter
            label="Funding definition"
            value={funding}
            options={Object.entries(FUNDING)}
            change={(v) => set("funding", v)}
          />
          <button className="reset" onClick={() => apply(DEFAULTS)}>
            <RotateCcw size={14} />
            Reset filters
          </button>
        </div>
        <div className="side-bottom">
          <Database size={16} />
          <div>
            <b>Vipunen</b>
            <small>Public education statistics</small>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <div className="crumb">
            <button
              ref={filterTrigger}
              className="mobile-toggle"
              aria-label="Open filters"
              aria-expanded={sidebar}
              aria-controls="filters"
              onClick={() => setSidebar(true)}
            >
              <Menu size={20} />
            </button>
            <Layers3 size={16} />
            <span>Analytics</span>
            <ChevronRight size={13} />
            <b>Degree awards</b>
          </div>
          <button
            className="source-link"
            onClick={() => dialog.current.showModal()}
          >
            <BookOpen size={15} /> <span>Source notes</span>
          </button>
        </header>
        <main id="content" className="content">
          <div className="title-row">
            <div>
              <div className="context">
                <span className="live-dot" /> Final statistics{" "}
                <span className="dot-sep">/</span> Finnish higher education
              </div>
              <h1>Degree awards</h1>
              <p className="subtitle">
                <Building2 size={15} />
                {institutions[institution]}
                <span className="dot-sep">·</span>
                {year}
              </p>
              <a className="related-report" href="/funding">Funding and completion time</a>
            </div>
            <button
              className="export"
              disabled={total == null}
              title={total == null ? "No observed rows to export" : undefined}
              onClick={exportCsv}
            >
              <ArrowDownToLine size={16} />
              Export CSV
            </button>
          </div>
          <div className="metrics">
            <Metric
              accent
              label="Degrees awarded"
              icon={GraduationCap}
              note={
                funding === "included"
                  ? "Excluding commissioned education"
                  : "Across all funding sources"
              }
            >
              {format(total)}
            </Metric>
            <Metric
              label="Year-on-year change"
              icon={TrendingUp}
              note={
                prior != null
                  ? format(prior) + " degrees in " + (year - 1)
                  : "Previous year unavailable"
              }
            >
              {signed(delta)}
              <small>
                {delta == null
                  ? ""
                  : Math.abs(delta) === 1
                    ? " degree"
                    : " degrees"}
              </small>
            </Metric>
            <Metric
              label="Bachelor’s target attainment"
              icon={Target}
              note={
                attainment != null
                  ? format(achieved) +
                    " of " +
                    format(goal) +
                    " agreement target"
                  : "No comparable target for this selection"
              }
            >
              {attainment == null ? "—" : attainment}
              <small>{attainment == null ? "" : "%"}</small>
            </Metric>
          </div>
          <div className="analysis-grid">
            <section className="panel history">
              <div className="panel-header">
                <div>
                  <div className="overline">
                    <Table2 size={13} />
                    Field analysis
                  </div>
                  <h2>Degrees by field</h2>
                </div>
                <span className="unit">2023–25</span>
              </div>
              <div className="table-scroll">
                <table>
                  <caption className="sr">
                    Degrees by education field and final statistical year
                  </caption>
                  <thead>
                    <tr>
                      <th>Education field</th>
                      {years.map((y) => (
                        <th
                          className={year === y ? "selected-col" : ""}
                          key={y}
                        >
                          {y}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((r) => (
                      <tr key={r.key}>
                        <th scope="row">
                          <button
                            className="text-btn"
                            title={
                              field ? "Show all fields" : "Filter to " + r.label
                            }
                            onClick={() => set("field", field ? "" : r.key)}
                          >
                            {r.label}
                          </button>
                        </th>
                        {r.values.map((v, i) => (
                          <td
                            className={year === years[i] ? "selected-col" : ""}
                            key={i}
                          >
                            {format(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th>Total degrees</th>
                      {years.map((y) => (
                        <td
                          className={year === y ? "selected-col" : ""}
                          key={y}
                        >
                          {format(count(y))}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
            <TrendPanel
              years={years}
              series={series}
              year={year}
              level={level}
              onYear={(y) => set("year", String(y))}
            />
            <BreakdownPanel
              items={bars}
              targets={targets}
              year={year}
              onField={(label) => {
                const key = matrix.find((r) => r.label === label)?.key;
                if (key) set("field", field ? "" : key);
              }}
            />
            <section className="panel peer">
              <div className="panel-header">
                <div>
                  <div className="overline">
                    <Building2 size={13} />
                    Peer comparison
                  </div>
                  <h2>Institution rankings</h2>
                </div>
                <span className="unit">{year}</span>
              </div>
              <div className="table-scroll">
                <table>
                  <caption className="sr">
                    Peer rankings by degree count using current filters
                  </caption>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Institution</th>
                      <th>Degrees</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((p) => (
                      <tr
                        className={p.id === institution ? "chosen" : ""}
                        key={p.id}
                      >
                        <td>
                          {p.value == null
                            ? "—"
                            : peers.findIndex(
                                (other) => other.value === p.value,
                              ) + 1}
                        </td>
                        <th scope="row">
                          <button
                            className="text-btn"
                            title={p.name}
                            onClick={() => set("institution", p.id)}
                          >
                            {shortName(p.name)}
                          </button>
                        </th>
                        <td>{format(p.value)}</td>
                        <td>{signed(diff(p.value, p.prior))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="all-peers"
                aria-expanded={peersExpanded}
                onClick={() => setPeersExpanded(!peersExpanded)}
              >
                {peersExpanded
                  ? "Show selected peers"
                  : "View all " + peers.length + " institutions"}
                <ChevronDown
                  size={14}
                  style={{
                    transform: peersExpanded ? "rotate(180deg)" : undefined,
                  }}
                />
              </button>
            </section>
          </div>
          {metadata.knownDifferences
            .filter((x) => x.institution === institution && x.year === year)
            .map((x) => (
              <p className="difference" key={x.year}>
                <CircleHelp size={15} />
                {x.detail}
              </p>
            ))}
          <footer>
            <span>
              <Database size={13} />
              Source: <a href={metadata.sourceUrl}>Vipunen</a> · Final data for{" "}
              {years[0]}–{years.at(-1)}
            </span>
            <button onClick={() => dialog.current.showModal()}>
              Definitions and attribution <ExternalLink size={12} />
            </button>
          </footer>
        </main>
      </div>
      <SourceDialog dialog={dialog} data={dataset} />
    </div>
  );
}
