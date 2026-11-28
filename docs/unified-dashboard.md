# One dashboard with Funding first

Funding opens with a decision Arcada can act on. The awards and completion evidence stays in the same workspace so the user can investigate the result without re-entering filters. The independent audit supports reviewing nursing intake routes and placement capacity before attributing the award gap to delays.

## Views and filters

- Keep one navigation and filter panel. Institution, reporting year and **Compare with** apply across Funding and Degree awards. Offer the pooled Finnish UAS benchmark and any other covered institution as the comparison. Keep the full rankings in Awards for users who need more institutions at once.
- Funding leads with the health and welfare bachelor’s case. Use the selected institution, year and comparator. Label the featured degree scope. Show Arcada’s agreement target and published allocation in applicable selections only. Add master’s awards under their all-funding definition, including Arcada’s 84 awards and 110 annual average target. Keep national weights and the dated sector budget visible.
- Degree awards has **Awards** and **Completion time** views. Both use degree level, field and funding definition. Funding’s **View completion times** link sets the featured degree scope and carries the institution, year and comparator into Completion time. The navigation, browser history and copied URL preserve selections. Existing degree filter URLs without a view continue to open Awards.
- Publish timing for the reconciled 2025 health and welfare bachelor’s release excluding commissioned education. Show counts, rates and a qualification table against the selected comparator. If an institution, qualification or scope lacks a matching observation, retain the selection and explain the gap. Show the sector’s coverage for the selected outcome and keep missing observations blank in exports.

## Evidence and build order

The first increment reuses the published awards and completion releases. Verify the 205/300 health and welfare case, pooled timing counts, nursing qualification comparison and master’s target against the official sources. Show nursing starters by entry year as operational context only where the public awards source can be reproduced. Arcada's public qualification totals combine intake routes. The programme director and Study Services should review route-level cohort and placement milestones before the next placement allocation.

Keep external R&D first in the funding evidence queue. Resolve the €15,000 difference for 2024 and obtain the funder-code return. Ask Arcada’s authorised analyst for an approved AVOP aggregate and legend for the Student feedback view. Keep euro scenarios gated on reproduction of a ministry calculation. The other model components remain visible as weights while their eligible outcomes are qualified. This increment uses public data. [Funding evidence](funding-evidence.md) · [AVOP evidence](avop.md)

The audit also identified operational measures to qualify next. Arcada’s 2025 annual report gives 5,246 open UAS credits, 320 specialisation credits, 879 higher-education cooperation credits and 163 publications and productions. Validate like-for-like sector measures and eligibility before bringing them into Funding. Keep the public starter series separate from eligible first-time entrants. [Arcada annual report, Tables 5–6](https://www.arcada.fi/sites/default/files/2026-04/Arcada%20University%20of%20Applied%20Sciences%20Annual%20Report%202025%20in%20Swedish.pdf)

| Owner | Evidence to request |
| --- | --- |
| Finance | Final 2026 allocation and calculation, separately dated 2027 estimate and R&D return by funder code. Reproduce one bachelor’s funding component. |
| Nursing programme director and Study Services | Approved cohorts by qualification, entry year and route. Include starters, active students, placements, thesis milestones, awards and withdrawals at comparable elapsed times. Confirm the local programme mapping. |
| Quality lead | Obtain the AVOP workbook successor or an approved aggregate from Arcada’s authorised analyst. Start with distinct bachelor’s and master’s results, Arcada and the matched sector, and the file’s disclosure legend. |

## Acceptance

- `/` opens Funding. The funding link displays Arcada, 2025, bachelor’s, health and welfare, excluding commissioned education, with the current comparator. A different comparator updates the columns and export. Reload, Back and a copied URL restore the same selection.
- The default timing table and CSV show Arcada 157/205 and sector 8,342/10,535. The qualification table shows nursing 51/65 and 2,935/3,778. A 2024 selection remains 2024 and shows the timing release limitation. Opening Awards from the workspace preserves the degree-awards measures and existing exports.
- Verify the published source rows and release dates, local PostgreSQL tests, production build, desktop and narrow layouts, keyboard navigation, table labels and CSV downloads. Owner approval is required before public deployment.

Local verification on 28 November 2026 reproduced the awards and starter results from the live API and PostgreSQL, and reproduced the completion snapshot. Six database tests and five production browser tests passed. The Funding and Completion time views reflowed at 1440, 390 and 320 pixels with no violations in the automated accessibility scans. Staff sessions and a manual screen-reader pass remain pending.
