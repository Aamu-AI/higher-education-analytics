# Independent review handoff

**Decision requested:** Should we proceed with the local degree-awards milestone, revise it, or obtain more evidence first? The owner will return the independent review or approve proceeding. No application, database schema or public deployment has been implemented.

## Evidence to test first

1. Run the two commands in the [README](../README.md). The committed profile covers 29 candidate resources from a 47-resource live catalogue. Row counts and period endpoints are observations from 26 November 2026.
2. The proposed anchor is Arcada's 2024 final award count: 478 bachelor's and 84 master's degrees. A filtered 240-row Vipunen response, a live StatFin CSV and Arcada's annual review agree on the total. The two statistical sources give 2,705 students and Arcada's report gives 2,653. We have no reconciled explanation for the difference. [Data and publications](data.md)
3. The dashboard image describes a feedback workflow. Public AVOP reporting exists, while a licensed repeatable aggregate export, question weights, disclosure legend and grain still need verification. An authorized Arvo CSV may contain identifiers and free text. The candidate first UI is a degree trend, field breakdown, peer comparison and definition panel. [Product plan](plan.md)
4. Proposed stack: TypeScript/Next.js with Vercel, plain SQL on Supabase PostgreSQL, a separate import job, versioned aggregates and a read-only publication layer. Local development is sufficient for the first milestone. A one-seat, single-project production baseline is about $45/month before tax and overages. [Architecture and alternatives](architecture.md)

## Questions most likely to change the plan

| Risk | Decision for review |
| --- | --- |
| A final-year total can match by coincidence | Are the source dimensions mutually exclusive for each proposed rollup? What second institution, field and year would best challenge the check? |
| A national qualification can map to several local programmes | Where should drill-down stop? What evidence and dated mapping would justify a local programme comparison? |
| Admissions options duplicate people and some rounds accept multiple offers | Which published aggregates can support demand analysis without inventing a unique-person total? |
| Live paging, suppression and revised releases | Can a complete consistent slice be verified? How should a changed row, removed row, suppression change or definition break reach the UI and CSV? |
| Survey exports may be unusable or too sensitive | Would an authorized public AVOP extract justify moving feedback up the roadmap? Can any filter, cache or export reveal a withheld cell? |
| Hosting and architecture | Would a static release, ordinary PostgreSQL or another host meet the first users' needs more simply? Are storage, operations, accessibility, portability and EU residency estimates credible? |

## Decisions for people

- **Now:** return an independent review or approve the first local milestone. An agent with existing authorized repository access can review the committed files. The reviewer needs no cloud credentials.
- **Before a survey pilot or public release:** the institutional data steward confirms indicator populations, permitted aggregates, source rights and disclosure rules. The owner confirms institutional sponsorship, licensing, publication and branding. Development can proceed locally after the first gate.
- **When hosting is needed:** use a separate Aamu AI Supabase project in an approved EU region. Verify any incremental charge and choose the institution-controlled production account. Vercel deployment and Arvo procurement have their own later decisions.

## Prompt for the independent reviewer

```text
Review the private Aamu-AI/higher-education-analytics repository as an independent senior engineer and statistical reviewer. Read README.md, docs/data.md, docs/plan.md, docs/architecture.md and the research evidence. Reproduce the Arcada 2024 check and challenge at least one proposed comparison using a primary source.

Decide whether to approve the first local milestone, request revisions, or block it. Examine population and denominator definitions, release completeness, code mappings, suppression and differencing, import retries and corrections, source terms, institutional isolation, user decisions, accessibility, operating costs and portability. Identify anything the proposal should remove or defer.

Return findings ordered by severity. For each, name the file or claim, the evidence, its consequence, and a concrete change or acceptance test. Distinguish a milestone blocker from a later publication or hosting gate. Finish with your verdict and the smallest milestone you would approve. This is a review only. Leave files and infrastructure unchanged.
```
