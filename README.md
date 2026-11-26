# Higher Education Analytics Platform

This project helps Finnish higher education institutions use public statistics in management and programme reviews. Arcada University of Applied Sciences is the first use case. The proposed first release answers how many degrees an institution awarded and how that changed by level and field.

**Status on 26 November 2026.** The repository is public and the discovery plan is ready for independent review. Application development starts after review or owner approval.

| Start here | What you will find |
| --- | --- |
| [Independent review handoff](docs/review.md) | Recommendation, questions for the reviewer and a copyable prompt |
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

The first command after cloning and entering the directory checks the 2024 degree split against Arcada's published 478 bachelor’s and 84 master’s degrees and checks the total against StatFin. The second takes a fresh metadata snapshot. Later publisher revisions may change results. Compare the new file with the committed snapshot. Investigate any difference before changing the reference values.

Phase 0 needs no database, account keys or running web server. The architecture document describes the local database and migration sequence for the next milestone. Institutional ownership and the software licence await approval. Each data source has its own reuse terms.
