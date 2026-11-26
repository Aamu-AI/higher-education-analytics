# Higher Education Analytics Platform

This project helps Finnish higher education institutions use public statistics in management and programme reviews. Arcada University of Applied Sciences is the first use case. The first milestone reconciles national degree statistics with Arcada’s annual report. The proposed first management view compares bachelor’s awards with agreement targets by field.

**Status on 26 November 2026.** The repository is public and the independent review is complete. The local degree-awards milestone is approved.

| Start here | What you will find |
| --- | --- |
| [Independent review](docs/review.md) | Verdict, verified discrepancies and open decisions |
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

Phase 0 needs no database, account keys or running web server. The architecture document describes the local database and migration sequence for the next milestone. Institutional ownership and the software licence await approval. Each data source has its own reuse terms.
