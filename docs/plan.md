# Product plan for independent review

## Decision requested

Approve a local milestone that imports final degree awards for Finnish universities of applied sciences (UAS) and reconciles Arcada with published figures. A programme director should be able to take the same comparison into next year's review and explain exactly who and what it covers. Degree awards have a manageable first slice, education codes and an external check. The supplied AVOP example remains the design reference for a later feedback page.

The first milestone ends at verified database queries. The first user-facing release adds an overview and comparison page. Hosting, authentication, unrestricted exploration, personal records, AI, research metrics and funding projections are outside this release. The broader product includes demand, progression, outcomes and feedback as their definitions and sources qualify.

## Decisions people need to make

These are hypotheses from the brief and available statistics. Interviews and usability sessions have yet to take place.

| User and occasion | Question | Evidence and action |
| --- | --- | --- |
| Leadership preparing the annual review | Which fields account for the change in degrees? | Compare two final years, show the absolute contribution by field, inspect the level mix and decide which fields warrant discussion. A large institution's count conveys volume only. |
| Programme director preparing an intake review | Did demand or degree output change for the education we offer? | Begin with the comparable field or national qualification. Show intake options separately by round and language when available. Confirm local programme mappings with the director before attributing results or changing intake. |
| Quality lead preparing a development meeting | Which feedback themes changed, and who responded? | Review question wording, distribution or mean, valid respondent count, coverage, scale and benchmark. Seek qualitative follow-up for persistent differences. A movement in rank alone carries little decision value. |
| Institutional analyst signing off a board paper | Can I reproduce this exact number after the source changes? | Export the selected aggregate, definition version, period, release and filters. Retain a release-specific link or manifest under the applicable terms. |

Validate these hypotheses with one representative of each principal role. Ask them to reproduce last year’s board statistic, identify one field to investigate and explain one unavailable comparison. Record their source, time taken, any mistaken interpretations and the reason for the decision. Use the findings to set language priorities and select the next indicator.

## Dashboard concept

The supplied Karelia example brings four useful items together: question-by-year table, respondent volume and score trend, question groups and a peer table. The side filters distinguish bachelor’s and master’s education, year, institution, question group and question. Its 5.5 target belongs to Karelia. The October 2026 refresh illustrates the danger of comparing an incomplete year to a full year. Neither its numbers nor its branding are source material for the application.

| Screen | Initial content and interaction |
| --- | --- |
| Overview | Institution picker defaults to Arcada. Show the latest *validated final* year, degree awards, change from previous final year and a bachelor’s/master’s split. Follow with a short trend, field contribution table and a source link. A different institution uses the identical query. |
| Compare | Carry the indicator, year, level and field across pages. Choose Finnish UAS peers. Show selected institutions side by side, an explicitly labelled sector total where validated, and comparison coverage. Sort by name initially. Make changes in peer membership visible. |
| Indicator detail | Show source, unit, reference population, release date, definition, known breaks and calculation next to the number. Allow switching between chart and equivalent table. CSV uses the same approved cells and includes metadata. |
| Feedback, once qualified | Show one theme and year at a time. Separate score and respondent count into aligned panels with separate units. Offer the question matrix as detail and the peer comparison on demand. Display a local target only when its owner, scale and effective dates are known. |

Use labelled filters with a reset action, visible units, last comparable period and plain-language unavailable states. Preserve selections in the URL. If a selected peer lacks the requested field, show its missing state and why. A narrow screen stacks headline, trend, comparison and source. A keyboard user can reach every filter, read chart values in a table, and distinguish changes without colour. Support Swedish and Finnish source labels and English where available. Keep untranslated publisher terms identifiable. Test the first language and translations with Arcada staff.

For counts, compare absolute change and base volume. Offer percent change only for a positive known baseline. For rates, show percentage-point changes and calculate the national benchmark from compatible numerators and denominators. For survey means, require valid per-question weights or the official aggregate. A missing respondent count disables recombination. Distinguish a peer median, an institution-weighted mean and a respondent-weighted mean whenever used.

## Milestones and acceptance

| Order | Deliverable | Observable acceptance |
| --- | --- | --- |
| 0. Independent review | These plans, reproducible probes and open issues | Reviewer can run the check from a clean checkout, identify the data boundary and challenge the proposed first metric. Owner supplies feedback or approval. |
| 1. Local foundation | One Vipunen adapter, versioned SQL migrations, final UAS degree aggregates, import history, unit and database tests in CI | Start with 2023 and 2024, Arcada and one peer, then all UAS for those years. Reproduce the 2024 Arcada total of 562 and both levels. Reconcile a second institution against StatFin. An identical import changes no facts. A revised or removed source row replaces the old slice. A failed or concurrent import keeps the last complete release available. Clean database rebuild passes. |
| 2. First usable analytics release | Overview, field detail, peer comparison and contextual export | A user can explain the year-on-year change, switch institutions, identify exclusions and reproduce the CSV from the recorded release. Desktop, mobile, keyboard and table views show consistent results. A programme filter appears only for mappings that have been verified. |
| 3. Extend by decision value | Admissions by intake option, on-time degrees among graduates, then feedback pilot | Every new series has a named owner, licence record, denominator or unit, period policy, source check and tests for suppressed cells. Admit AVOP earlier if a reusable public aggregate meets those conditions. |
| 4. Institutional extensions | Restricted Arvo pilot, Entra sign-in and local programme mappings as needed | Proceed when the institution owns the infrastructure and approves recipients, retention, transfer and export rules. Test access boundaries with synthetic data. Saved reports, scheduling and grounded natural-language queries can reuse the published indicators later. |

The priority changes if programme directors chiefly need a documented survey measure and a public export of sufficient quality becomes available. Reorder the feedback pilot after a source audit and user interview. No elapsed-time estimate substitutes for passing the reconciliation checks.
