# Product plan

## Approved local milestone

The independent review approved local work once the degree definition and reconciliation criteria were revised. Both changes are in this plan. Begin with final degree awards for all Vipunen universities of applied sciences (UAS) for 2023–2025. Use 2025 as the main acceptance case and 2024 and 2023 as regressions. The deliverables are SQL views and one local CSV with release metadata. [Review decision](review.md)

Offer two indicators: **degrees, all funding sources (national statistics definition)** and **degrees excluding commissioned education (Arcada reporting definition)**. Compare peers under the same selected definition. Arcada awarded 561 degrees on its reporting definition in 2025, one fewer than in 2024. The national definition gives 573, eleven more. Show the definition alongside each count.

## Decisions people need to make

These are hypotheses from the brief and available statistics. Interviews and usability sessions have yet to take place.

| User and occasion | Question | Evidence and action |
| --- | --- | --- |
| Leadership preparing the annual review | How close was each steering field to its bachelor’s degree target under the ministry agreement? | Show awards and targets together. Discuss where the gap warrants action, with counts by national qualification and funding source available for follow-up. |
| Programme director preparing an intake review | Did demand or degree output change for the education we offer? | Begin with the comparable field or national qualification. Show intake options separately by round and language when available. Confirm local programme mappings with the director before attributing results or changing intake. |
| Quality lead preparing a development meeting | Which feedback themes changed, and who responded? | Review question wording, distribution or mean, valid respondent count, coverage, scale and benchmark. Seek qualitative follow-up for persistent differences. A movement in rank alone carries little decision value. |
| Institutional analyst signing off a board paper | Can I reproduce this exact number after the source changes? | Export the selected aggregate, definition version, period, release and filters. Retain a release-specific link or manifest under the applicable terms. |

Arcada's 2025 agreement view would show **477 bachelor’s degrees against a target of 635**. Health and welfare achieved 205 of 300, technology and ICT 71 of 120, economy and services 143 of 170, and arts and culture 58 of 45. Keep targets, field mappings, agreement period, source and owner in institution configuration. Group the six ministry policy fields for 2025. The older funding-model column is only a historical cross-check. Ask Arcada’s statistics contact to confirm the exclusion and mapping in writing. [Evidence and exceptions](data.md)

Before milestone 2, interview a manager, a programme director and a quality lead. Ask each to reproduce a board statistic, identify a field for discussion and explain one unavailable comparison. Record decisions, misunderstandings and language needs. These interviews can run alongside milestone 1.

## Dashboard concept

A future feedback view can combine a question-by-year table, respondent counts, score trends and peer comparisons. Label partial years and use only an institution’s own approved targets.

| Screen | Initial content and interaction |
| --- | --- |
| Overview | Default to Arcada’s latest validated final year. Lead with bachelor’s awards and agreement targets by steering field. Show each difference in degrees, the previous year, definition and release. An institution without an approved target sees counts and an unavailable target. |
| Compare | Carry the indicator, year, level and field across pages. Choose Finnish UAS peers. Show selected institutions side by side, an explicitly labelled sector total where validated, and comparison coverage. Sort by name initially. Make changes in peer membership visible. |
| Indicator detail | Show source, unit, reference population, release date, definition, known breaks and calculation next to the number. Allow switching between chart and equivalent table. CSV uses the same approved cells and includes metadata. |
| Feedback, once qualified | Show one theme and year at a time. Separate score and respondent count into aligned panels with separate units. Offer the question matrix as detail and the peer comparison on demand. Display a local target only when its owner, scale and effective dates are known. |

Use labelled filters with a reset action, visible units, last comparable period and plain-language unavailable states. Preserve selections in the URL. If a selected peer lacks the requested field, show its missing state and why. A narrow screen stacks headline, trend, comparison and source. A keyboard user can reach every filter, read chart values in a table, and distinguish changes without colour. Support Swedish and Finnish source labels and English where available. Keep untranslated publisher terms identifiable. Test the first language and translations with Arcada staff.

For counts, compare absolute change and base volume. Offer percent change only for a positive known baseline. For rates, show percentage-point changes and calculate the national benchmark from compatible numerators and denominators. For survey means, require valid per-question weights or the official aggregate. A missing respondent count disables recombination. Distinguish a peer median, an institution-weighted mean and a respondent-weighted mean whenever used.

## Milestones and acceptance

| Order | Deliverable | Observable acceptance |
| --- | --- | --- |
| 0. Independent review | Completed on 26 November 2026 | Findings, corrections and outstanding questions are in the [review record](review.md). |
| 1. Local degree awards | Plain PostgreSQL, numbered SQL migrations, one Python importer for `opiskelijat_ja_tutkinnot`, SQL views and one local CSV | Load final UAS years 2023–2025. Retain funding source at qualification level. Pass the Arcada, Laurea and named-sector checks, the release and rollback tests, and a clean rebuild against a PostgreSQL service in CI. Include the indicator definition, year, source and release in the CSV. [Import contract](architecture.md) |
| 2. First management view | Choose a static read-only site or a hosted application after the three interviews | A user can identify the largest target gap, see both degree definitions, explain peer coverage and reproduce a displayed value from its release. Verify WCAG 2.1 AA with keyboard, screen reader, equivalent tables, narrow screens and 200%–400% zoom and reflow. Confirm the applicability of Finland’s Act on the Provision of Digital Services with Arcada. [Act 306/2019](https://www.finlex.fi/en/legislation/2019/306) |
| 3. Additional indicators | Admissions, progression, graduate outcomes or public feedback, in interview priority order | Define population, unit, period, coverage and rights for each series. Investigate new-student differences before admissions. Verify denominators and suppression rules before a survey pilot. |
| 4. Institutional extensions | Signed local programme mappings, restricted sources and access controls as needed | Arcada approves the mapping from its register, the permitted recipients, retention and exports. Test access boundaries with synthetic data. |

The finest public breakdown is national qualification code and funding source. Multiple programmes or languages can share a code. A local programme view requires a register-based mapping signed off by Arcada. Web development, hosting and survey ingestion are later decisions.
