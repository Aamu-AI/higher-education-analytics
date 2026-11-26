# Independent review of the degree-awards plan

**Verdict on 26 November 2026: revise, then go.** The independent reviewer assessed [commit f695e5c](https://github.com/Aamu-AI/higher-education-analytics/commit/f695e5cfe3f71c5331357a728ba3139cf6e10cb3). The two conditions for local development were to retain funding source and distinguish the two degree definitions, and to test explicitly for disagreements between final sources. The [revised plan](plan.md) and [reconciliation](../research/check_arcada.py) meet those conditions. Milestone 1 is approved for local development.

## Verification on 26 November 2026

| Check | Observed result |
| --- | --- |
| Reconcile Vipunen and StatFin against the fixed Tables 1 and 2 from Arcada’s Swedish annual reports | 2025 all funding 573, excluding commissioned 561. In 2024 both give 562. In 2023 Vipunen gives 544 under either definition, while Arcada reports 546. The 2023 difference is in business bachelors. |
| Compare final Vipunen UAS years with StatFin 13k9, 2022–2025 | The only degree difference among the common institutions was Laurea in 2024. Vipunen had one more bachelor in qualification 631101. Student totals agreed. New-student counts need separate reconciliation. |
| Reconstruct the 2024 sector totals | Vipunen 33,338 across 22 institutions. StatFin 33,771 across 24. Åland and the Police University College add 434 to StatFin, offset by Laurea’s one-degree difference. |
| Check source mechanics and auxiliary resources | The single 2024 UAS fetch matched the paged multiset. No duplicate source keys in 33,111 rows. The 2026 preliminary count of 15,901 covers all sectors, including 6,907 UAS rows. The master's and on-time resources use different funding labels from the awards resource. |
| Run the catalogue probe and compare with the committed JSON | 47 resource names, 29 profiles, zero errors. All fields matched except the retrieval timestamp. |
| Read the publisher’s reuse terms in a browser | Vipunen identifies CC BY 4.0 for its statistics and gives API attribution instructions. Record the upstream attribution and any resource-specific exceptions before publication. [Terms](https://vipunen.fi/fi-fi/Sivut/K%C3%A4ytt%C3%B6ehdot.aspx) |

The executable check prints both source populations, verifies the six field cells and four bachelor agreement groups for each year, and fails if either side of a recorded discrepancy changes. Arcada’s report figures are transcribed from the dated PDFs. Compare a new edition manually before updating them. The broad 2022–2025 comparison and paged-fetch comparison were additional review checks. [Reproduction commands](../README.md) · [Sources, inputs and signed differences](data.md)

## Decisions and follow-up

- Start with one Python importer, plain PostgreSQL, final years 2023–2025, SQL views and one local CSV. The next milestone must pass the [release, correction and failure tests](architecture.md). This review delivered the plan and research check.
- Request written confirmation from Arcada’s statistics contact on commissioned education, the student population and the agreement-field mapping. Ask the authorized register custodian to resolve the 2023 business discrepancy and ask Vipunen or Statistics Finland about Laurea. Both differences remain **unexplained**.
- Interview a manager, programme director and quality lead before milestone 2. Use the interviews to choose the management view and compare a static site with a hosted application. Require signed local programme mappings and validate keyboard, screen-reader and zoom behaviour.
- Before publication, confirm the export attribution and software licence. Before any hosted migration, verify the actual Supabase region, EU function placement if applicable, costs and institutional obligations. Hosting settings, legal applicability and private registers were outside this public-source review.
