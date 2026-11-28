# Funding decisions and first implementation

Use the funding model to identify outcomes staff can improve and review again, starting with Arcada’s health and welfare bachelor’s awards. The first view should put the observed gap and the distribution of completion times beside the ministry’s weighting. Arcada leadership can then choose whether to investigate progression, intake or both, assign an owner and set a review date.

## First increment

- Add a funding page linked from Degree awards. Show the national model weights and distinguish the published 2025 Arcada award from the 2026 sector budget. A euro scenario requires a Ministry allocation calculation with the exact Arcada input, sector denominator, observation years, pool and applicable adjustments.
- Lead with the 2025 health and welfare case. The agreement target is an annual average over 2025–2028. Arcada uses it as a 2025 reference in its annual report. Compare 205 bachelor’s awards with 300, and show 226 and 217 in the preceding years. Keep the target, reporting source and field mapping in Arcada’s configuration.
- Use the three published completion-time groups from Vipunen for final 2025 bachelor’s awards in the same health and welfare field, excluding commissioned education. The denominator is awards with a reported completion time. Show Arcada and the pooled benchmark with counts and rates, plus Arcada’s national qualification codes. The benchmark includes Arcada. No entry-cohort completion rate, programme-level attribution or causal diagnosis is in scope.
- Publish a separate, versioned completion release through PostgreSQL. Require the three timing groups to sum to awards, match the same institution-level awards in the published degree release, and reconcile Arcada’s 205 to Table 2. Retain observation date, source update date, retrieve date, counts and coverage. Export the data and provenance shown on the page as CSV.
- Accept the increment when the accessible table and CSV agree on 157 / 205 on time for Arcada and 8,342 / 10,535 for the 21 covered institutions. Show delayed bands and the unavailable-evidence boundary. Verify the navigation and downloads on desktop, at a narrow width and using the keyboard.

## Build order

1. National weights and the degree completion case together. The 56% component and comparable completion evidence justify starting here.
2. Run two evidence checks in parallel. Reconcile eligible external R&D to the ministry’s funding input (12%), and qualify a public AVOP question export (3%) for improvement work. Prioritize R&D as the next funding view if it reconciles. AVOP can be the next quality view if score and response coverage are both usable.
3. Add a euro scenario only after reproducing a base allocation component. Add local programme or entry-cohort analysis only with approved mappings and processing under Arcada’s control.

See the [funding evidence](funding-evidence.md), [AVOP item and source check](avop.md) and [staff validation exercise](funding-validation.md).

[Ministry model](https://okm.fi/ohjaus-rahoitus-ja-sopimukset) · [Arcada’s 2025–2028 agreement, pp. 3–5](https://okm.fi/documents/1410845/3991460/Yrkesh%C3%B6gskolan%2BArcada%2Bavtal%2B2025-2028.pdf/d8e3f5a8-d62c-9e9a-b2b3-591a98dab230?t=1738563519564&version=1.2) · [Arcada annual report, Table 2](https://www.arcada.fi/sites/default/files/2026-04/Arcada%20University%20of%20Applied%20Sciences%20Annual%20Report%202025%20in%20Swedish.pdf) · [Vipunen completion resource](https://api.vipunen.fi/api/resources/tavoiteajassa_tutkinnon_suorittaneet)
