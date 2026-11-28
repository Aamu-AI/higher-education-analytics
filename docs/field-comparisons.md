# Funding and degree comparisons

The opening view should let a reader identify the largest bachelor’s degree shortfall and compare the underlying fields across institutions. Preserve every ministry policy field in numeric code order. Attribute ceilings to the ministry agreement group and period. Keep programme targets, funding estimates in euros and individual survey returns outside this release.

Funding uses the mean eligible bachelor’s count over three complete activity years ending with the selection. Compare it with the agreement in force for the selected year. Show the period, annual count, largest positive difference in degrees, coverage and uncapped percentage. This planning comparison does not establish an allocation for a funding year. Compare the selected field and its full group side by side. List all model weights and data availability.

Degree awards opens with all levels, all fields, all funding sources and all schools. The shared counting rule drives the annual ranking, field comparison, peer trends and export. Preserve zero and missing observations separately. Competition ranking gives equal results equal positions. Compare ranks only with the same covered institutions, measure and scope in consecutive years. Show the verified 2020–2025 history.

Acceptance includes Arcada’s 573 and 561 totals for 2025, arts group average 49 against 45, a separate ICT awards comparison, peer selection across both trend modes, exports, missing states, keyboard operation and narrow-screen reflow. AVOP question rankings depend on an approved or public aggregate containing wording, score and valid item counts. The funding-points view requires exact verified totals.

## Sources and coverage

The final Vipunen releases cover all 22 institutions in each of the six years. The 2020–2022 all-funding annual totals match StatFin 13k9 for all 66 institution-year observations. One legacy vocational level in 2020 contributes zero awards. Its original records remain in PostgreSQL. Retain the documented 2023 Arcada and 2024 Laurea differences. Use the [VIRTA ministry field codes](https://wiki.eduuni.fi/spaces/CSCVIRTA/pages/145305828/Tietovarannon%2Bkoodistot) for field order.

The [ministry agreement register](https://okm.fi/ammattikorkeakoulut-sopimukset) contains 22 agreements in each of 2021–2024 and 2025–2028. For each agreement the sum of the entered field-group ceilings equals its published bachelor’s target. Each record links to the signed agreement and uses its period average column. A missing group in an agreement has no listed ceiling. Complete grouped award totals combine all observed rows for that group within the final institution-year release. Individual fields without a source observation remain unavailable. The first full award window ends in 2022. Show annual results for earlier selections. The calculation measures progress against a ceiling and makes no prediction of awarded euros.

For the 2025 Arcada selection, the health group averaged 216 awards against 300, and the arts group averaged 49 against 45. ICT uses its own annual award count and belongs to the same ceiling group as natural sciences, technology and agriculture/forestry. Programme-level ceilings have no source in these agreements.

The public AVOP API catalogue still lacks a UAS question result set. The named Vipunen workbook redirects to institutional sign-in. The AVOP funding row records the missing figures. See the [survey evidence](avop.md) for the required item counts, privacy rules and scoring definitions.

## Local verification

The independent API build and the PostgreSQL snapshot produced identical releases containing 1,601 school, field, level and year aggregates. A repeated import retained the six original release identifiers and reproduced the snapshot. Six disposable-database tests cover import validation, retry, correction, rollback and concurrent publication.

The production build passed eight browser tests, including confirmed zero versus missing awards, ceiling scope, both counting rules, rank and count trends, peer retention, keyboard navigation and downloads. The Funding, ICT comparison and Degree awards views had no automated WCAG A/AA findings at 1440, 390 and 320 pixels. The narrow layout exposed tables and row and column headers in Chromium’s accessibility tree. Keyboard selection of ICT moved focus to its two comparisons. Manual screen-reader listening and staff usability sessions are outstanding.

## Annual target and growth rankings

Managers need to compare annual output with the ministry agreement at each degree level. Keep total awards under the selected counting rule. Beside the count, show the eligible bachelor's count excluding commissioned education and the all-funding master's count against their separate annual targets. The Funding view keeps its three-year calculation. A field selection uses the entire applicable bachelor's agreement group, named in the view. Master's targets apply institution-wide. Leave field-level master's attainment unavailable.

Rank by total awards, year-on-year change in degrees, or attainment at either level. Closest means the smallest absolute distance from 100%. Highest share sorts attainment descending. Use the chosen ranking throughout the rank trend, change in position and CSV. A missing comparable input leaves a school unranked. Allow each school to be checked or unchecked; the chart and annual field table use the same selection.

Acceptance includes Arcada in 2025 with 573 total, 562 last year, growth of 11, 477 of 635 bachelor's and 84 of 110 master's. Verify three-school comparisons, keyboard toggles, links and reloads, signed growth, missing targets and equal rankings.

The 44 signed agreement extracts supply the master's annual target for each school and period. The 2020 target columns remain unavailable. The growth trend uses consecutive annual counts under the selected definition, and the earliest available year has no change value. The local production build and all nine browser tests passed. The three-school comparison passed automated accessibility checks at 320, 390 and 1440 pixels. Keyboard selection, reload, the ranking export and the mobile target layout were checked.
