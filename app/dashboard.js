"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  Building2,
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
import { fundingComparisons } from "./comparisons";
import AwardComparison from "./award-comparison";
import FundingOverview from "./funding/overview";
import CompletionView from "./funding/completion";
import { completion, scope as completionScope } from "./funding/results";
import {
  DEFAULTS, FUNDING, LEVELS, awardCount, comparisonAwards, comparisonName,
  downloadCsv, makeCsv, readSelection, selectedChartYears, selectedSchools, selectionUrl,
} from "./report-selection";

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

function CompareChecklist({ title, allLabel, options, selected, onChange }) {
  const allRef = useRef(null);
  const all = selected.length === options.length;
  useEffect(() => {
    allRef.current.indeterminate = selected.length > 0 && !all;
  }, [selected.length, all]);
  const summary = all ? allLabel : selected.length === 1
    ? options.find(([key]) => key === selected[0])?.[1] : selected.length + " selected";
  return <details className="compare-checklist">
    <summary><span>{title}</span><strong>{summary}<ChevronDown size={15} aria-hidden="true"/></strong></summary>
    <fieldset><legend className="sr">{title}</legend>
      <label><input type="checkbox" ref={allRef} checked={all}
        onChange={() => onChange(all ? [] : options.map(([key]) => key))}/>{allLabel}</label>
      {options.map(([key, name]) => <label key={key}><input type="checkbox" checked={selected.includes(key)}
        onChange={() => onChange(selected.includes(key) ? selected.filter(id => id !== key) : [...selected, key])}/>{name}</label>)}
    </fieldset>
  </details>;
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
            Funding uses each ministry agreement’s field groups and three complete activity years of bachelor’s awards excluding commissioned education.{" "}
              <a href={agreements["02535"][2025].source}>
              Annual report, Table 2
            </a>
              {" "}The master’s target uses all funding sources. <a href={agreements["02535"][2025].agreementUrl}>Ministry agreement, p. 4</a>
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
  const dialog = useRef(null);
  const filterTrigger = useRef(null);
  const filterClose = useRef(null);
  const filterAside = useRef(null);
  const main = useRef(null);
  useEffect(() => {
    function sync() {
      setFilters(readSelection(new URLSearchParams(window.location.search), dataset));
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
            "button:not(:disabled),select,summary,input:not(:disabled),a[href]",
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
    if (next.comparison === next.institution) next = { ...next, comparison: "sector" };
    setFilters(next);
    const url = selectionUrl(next);
    if (url !== window.location.pathname + window.location.search) window.history.pushState(null, "", url);
  }
  function set(key, value) {
    const next = { ...filters, [key]: value };
    if (filters.schools && ["comparison", "institution"].includes(key) && value !== "sector") {
      next.schools = [...new Set([...selectedSchools(filters), value])].join(",");
    }
    apply(next);
  }
  const { institution, level, funding, field, comparison, view } = filters;
  const isFunding = view === "funding";
  const isAwards = view === "awards";
  const reportTitle = isFunding ? "Funding" : "Degree awards";
  const year = Number(filters.year);
  const { years } = metadata;
  const chartYears = selectedChartYears(filters.chartYears, years);
  const checkedSchools = selectedSchools(filters);
  const institutionList = Object.entries(institutions).sort((a, b) =>
    a[1].localeCompare(b[1], "en"),
  );
  function reportLink(next, label, { current, className } = {}) {
    return <a className={className} href={selectionUrl(next)} aria-current={current ? "page" : undefined}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        apply(next);
        main.current?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
      }}>{label}</a>;
  }

  function count(y, id = institution, which = level, policy = field, measure = funding) {
    return awardCount(dataset, { year: y, institution: id, level: which, field: policy, funding: measure });
  }
  const compared = comparisonAwards(dataset, { ...filters, comparison: "sector" });
  const compareLabel = comparisonName(dataset, "sector");
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
  const targets = isAwards && level !== "master" && funding === "included"
    ? fundingComparisons(dataset, year)
        .filter(group => !field || group.fields.includes(field))
        .flatMap(group => {
          const school = group.schools.find(row => row.id === institution);
          return school.ceiling == null ? [] : [{ label: group.name, target: school.ceiling, value: school.annual }];
        })
    : null;
  const goal = targets?.reduce((s, g) => s + g.target, 0);
  const achieved = targets?.length && targets.every((g) => g.value != null)
    ? targets.reduce((s, g) => s + g.value, 0)
    : null;
  const attainment =
    goal && achieved != null ? Math.round((100 * achieved) / goal) : null;
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
      "Scope",
      "Benchmark institution codes",
    ];
    const provenance = [
      metadata.unit, metadata.releaseType, metadata.sourceStamps?.[year] ?? metadata.sourceStamp,
      metadata.retrievedAt, metadata.releaseId, metadata.source, metadata.sourceUrl, metadata.upstream,
      metadata.licenceUrl, metadata.transformations,
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
        ...provenance,
        "Selected institution",
        "",
      ]);
    body.push(["", compareLabel, year, LEVELS[level],
      field ? fields[field] : "All fields", FUNDING[funding], compared.value, ...provenance,
      "Sector benchmark", compared.codes.join(" ")]);
    for (const id of checkedSchools) {
      body.push([id, institutions[id], year, LEVELS[level], field ? fields[field] : "All fields", FUNDING[funding],
        count(year, id), ...provenance, "Selected comparison", ""]);
    }
    downloadCsv(makeCsv([headers, ...body]), `degree-awards-${institution}-${year}.csv`);
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
          <div className="filter-heading">
            <span className="side-label">Shared filters</span>
            <SlidersHorizontal size={14} />
          </div>
          <SelectFilter
            label="Institution"
            value={institution}
            options={institutionList.map(([id, n]) => [id, shortName(n)])}
            change={(v) => set("institution", v)}
          />
          <SelectFilter
            label={isAwards ? "Ranking year" : "Reporting year"}
            value={filters.year}
            options={years.toReversed().map((y) => [String(y), String(y)])}
            change={(v) => set("year", v)}
          />
          {view !== "completion" ?
            <CompareChecklist title="Compare schools" allLabel="All schools"
              options={institutionList.map(([id, name]) => [id, shortName(name)])} selected={checkedSchools}
              onChange={ids => {
                const peers = ids.filter(id => id !== institution);
                apply({ ...filters, schools: ids.join(",") || "none", comparison: peers.length === 1 ? peers[0] : "sector" });
              }}/>
          : <SelectFilter
            label="Compare with"
            value={comparison}
            options={[["sector", "Finnish UAS sector"], ...institutionList.filter(([id]) => id !== institution)
              .map(([id, name]) => [id, shortName(name)])]}
            change={(v) => set("comparison", v)}
          />}
          {isAwards && <CompareChecklist title="Chart years" allLabel="All years" options={years.map(y => [y, String(y)])}
            selected={chartYears} onChange={values => set("chartYears", values.length === years.length ? "" : values.sort((a,b) => a-b).join(",") || "none")}/>}
          {isFunding && <SelectFilter label="Field of education" value={field} options={[["", "All fields"], ...Object.entries(fields)]} change={(v) => set("field", v)} />}
          {!isFunding && <>
          <div className="side-rule" />
          <div className="filter-heading"><span className="side-label">Degree filters</span></div>
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
                .map(([k, v]) => [k, shortField(v)]),
            ]}
            change={(v) => set("field", v)}
          />
          <SelectFilter
            label="Funding definition"
            value={funding}
            options={Object.entries(FUNDING)}
            change={(v) => set("funding", v)}
          />
          </>}
          <button className="reset" onClick={() => apply({ ...DEFAULTS, view })}>
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
            <Layers3 size={16} />
            <span>Analytics</span>
            <ChevronRight size={13} />
            <b>{reportTitle}</b>
          </div>
          <button
            className="source-link"
            onClick={() => dialog.current.showModal()}
          >
            <BookOpen size={15} /> <span>Source notes</span>
          </button>
        </header>
        <nav className="workspace-nav" aria-label="Dashboard views">
          {reportLink({ ...filters, view: "funding" }, "Funding", { current: isFunding })}
          {reportLink({ ...filters, view: "awards" }, "Degree awards", { current: !isFunding })}
          <button ref={filterTrigger} className="mobile-toggle" aria-label="Open filters"
            aria-expanded={sidebar} aria-controls="filters" onClick={() => setSidebar(true)}>
            <Menu size={18} aria-hidden="true" /> Filters
          </button>
        </nav>
        <main id="content" className="content" tabIndex={-1} ref={main}>
          <div className="title-row">
            <div>
              <div className="context">
                <span className="live-dot" /> Final statistics{" "}
                <span className="dot-sep">/</span> Finnish higher education
              </div>
              <h1>{reportTitle}</h1>
              <p className="subtitle">
                <Building2 size={15} />
                {institutions[institution]}
                <span className="dot-sep">·</span>
                {year}
              </p>
            </div>
            {isAwards && <button
              className="export"
              disabled={total == null && compared.value == null}
              onClick={exportCsv}
            >
              <ArrowDownToLine size={16} />
              Export CSV
            </button>}
          </div>
          {!isFunding && <nav className="degree-nav" aria-label="Degree measures">
            {reportLink({ ...filters, view: "awards" }, "Awards", { current: isAwards })}
            {reportLink({ ...filters, view: "completion" }, "Completion time", { current: !isAwards })}
          </nav>}
          {isFunding && <FundingOverview dataset={dataset} selection={filters} onField={v => set("field", v)} completionLink={reportLink(
            { ...filters, ...completionScope, view: "completion" }, "View completion times", { className: "report-action" },
          )} />}
          {view === "completion" && <CompletionView dataset={dataset} selection={filters} verifiedLink={reportLink(
            { ...filters, ...completionScope, year: String(completion.year) }, "Open the verified 2025 comparison", { className: "report-action" },
          )} />}
          {isAwards && <>
          <AwardComparison dataset={dataset} selection={filters} set={set} />
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
            <Metric label="Schools compared" icon={Building2}
              note={checkedSchools.length <= 3 ? checkedSchools.map(id => institutions[id]).join(" · ") : "Selected in Compare schools"}>
              {checkedSchools.length}
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
                    " annual group target"
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
                <span className="unit">{years[0]}–{years.at(-1)}</span>
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
            {chartYears.length > 0 && <TrendPanel
              years={chartYears}
              series={series}
              year={year}
              level={level}
              onYear={(y) => set("year", String(y))}
            />}
            <BreakdownPanel
              items={bars}
              targets={targets}
              year={year}
              onField={(label) => {
                const key = matrix.find((r) => r.label === label)?.key;
                if (key) set("field", field ? "" : key);
              }}
            />

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
          </>}
        </main>
      </div>
      <SourceDialog dialog={dialog} data={dataset} />
    </div>
  );
}
