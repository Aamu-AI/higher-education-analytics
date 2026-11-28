# Higher Education Analytics Platform

This project helps Finnish higher education institutions use public statistics in management and programme reviews. Arcada University of Applied Sciences is the first use case. The first milestone reconciles national degree statistics with Arcada’s annual report. The proposed first management view compares bachelor’s awards with agreement targets by field.

The local dashboard covers final degree awards from 2020 to 2025 for 22 Finnish universities of applied sciences. Funding compares three complete activity years of bachelor’s awards with ministry agreement ceilings. Choose schools on the left to compare their three-year averages, ministry ceilings and selected-year awards. Each Vipunen field remains visible, with shared ceilings identified by agreement group. Degree awards opens with 573 awards at Arcada in 2025 across all funding sources. Excluding commissioned education gives 561. The school ranking and peer trend use the same counting rule. [Comparison scope and verification](docs/field-comparisons.md)

## Run the site

Use Node.js 24 and npm. The dashboard builds from the verified release in `data/degrees.json`. Running it locally requires no credentials.

```sh
npm ci
npm run dev
```

Open [the local dashboard](http://localhost:3000). For a production check, run `npm run build`, `npx playwright install chromium` and `npm run test:browser`. The connected Vercel project builds the repository root using the Next.js preset.

The local review version opens on Funding. The Degree awards and Completion time views share the institution, reporting year and comparison. The awards view is also available at `/?view=awards`.

## Refresh the degree data

Point the standard PostgreSQL connection settings (`PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`) at a local development database. With Python 3.10 or newer, run:

```sh
python -m pip install -r research/requirements.txt
python research/degree_store.py migrate
python research/degree_store.py import
python research/degree_store.py export research-local/degrees.csv
python research/build_dashboard.py
```

The import checks the public sources before activating a release. The dashboard generator reads the final SQL results and includes source and release metadata in the snapshot. Review and commit a changed snapshot to publish an update. For a comparison directly from the public APIs, run `python research/build_dashboard.py --from-api --output research-local/api-degrees.json`. For database tests use `python research/test_degree_store.py -v` with a local test role that can create a disposable database.

| Start here | What you will find |
| --- | --- |
| [Independent review](docs/review.md) | Verdict, verified discrepancies and open decisions |
| [First dashboard](docs/dashboard.md) | Scope, layout and acceptance criteria |
| [Funding and completion strategy](docs/funding-strategy.md) | The first funding decision, release criteria and build order |
| [Unified dashboard plan](docs/unified-dashboard.md) | Funding-first navigation, shared comparisons and evidence from the independent audit |
| [Product and implementation plan](docs/plan.md) | User decisions, dashboard concept, milestones and acceptance criteria |
| [Data inventory](docs/data.md) | Verified coverage, comparison limits, survey access and source terms |
| [Architecture and operations](docs/architecture.md) | Proposed schema, imports, privacy, migration workflow, hosting and costs |
| [Machine-readable evidence](research/vipunen-profile.json) | Live catalogue, fields, row counts, sample update dates and period endpoints |

## Reproduce the discovery

Clone the repository and run the commands below with Python 3.10 or newer and outbound HTTPS access to Vipunen and Statistics Finland. The scripts use the standard library. On Windows, substitute `py -3` for `python3`.

```sh
git clone https://github.com/Aamu-AI/higher-education-analytics.git
cd higher-education-analytics
python3 research/check_arcada.py
python3 research/probe.py research-local/vipunen-profile.json
```

The first script checks Arcada’s 2023–2025 degree definitions and report tables, Laurea’s 2024 difference and the two publishers’ 2024 sector populations. The second takes a fresh metadata snapshot. Later publisher revisions may change results. Compare the new file with the committed snapshot. Investigate any difference before changing the reference values.

Institutional ownership and the software licence await approval. Each data source has its own reuse terms. The dashboard lists attribution, definitions and known differences under **Source notes**.
