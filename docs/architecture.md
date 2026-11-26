# Architecture, operations and ownership

## Milestone 1 runs locally

One Python importer reads final UAS rows from Vipunen’s `opiskelijat_ja_tutkinnot`. Numbered SQL migrations create the local schema in ordinary PostgreSQL. A PostgreSQL service in CI replays migrations and runs deterministic database tests using synthetic fixtures. Keep live-source research checks separate. Supabase CLI local development requires Docker, whose daemon was unavailable during discovery. Neither is a prerequisite for the local design. [Supabase local development](https://supabase.com/docs/guides/local-development)

| Relation or output | What one record means |
| --- | --- |
| Source release | One observed resource, whole UAS sector, statistical year and publisher release type. Record normalized-content hash, query, source stamp, retrieval time, row count, definition version and constituent institution codes. Retain release history and the current pointer. |
| Source row | Preserve coded dimensions as text, funding label verbatim and original measures. Within a final UAS slice, the tested key comprises institution code, national qualification code, sex, funding source, January and September attendance and education region. The year and release belong to the slice. Reject duplicate keys before aggregation. |
| Degree awards | Within a release, sum awards by year, institution, national qualification code, raw funding source (`rahoituslahde`), qualification level and ministry policy field (`okmOhjauksenAla`). Preserve zero and unavailable separately. For observed numeric values, disclosure state is `observed`. |
| Indicators and reconciliation | Expose all funding sources or exclude the commissioned category for the named indicator. For each comparison record both sources, definition, population, levels, cells, release, observed and expected values, subtraction direction and explanation status. Fail on changed sides or differences. |
| Institution configuration | Version targets, effective agreement period, steering-field mapping, labels and their approving owner. Add programme mappings only after Arcada signs off register evidence. Keep these choices outside the shared degree calculation. |
| Local results | Two named SQL indicator views and one local CSV containing the selected definitions, unit, year, population, institution, dimensions, counts, release ID, source stamp, retrieval date and attribution. Restrict application reads to approved views if a hosted reader is added. |

### Release and correction contract

1. Take one database advisory lock for the importer. Select the whole UAS sector (`koodiSektori='4'`) and exactly one resource, year and release type. Count matching rows, then fetch them in one request with a 10,000-row limit. Reject empty, oversized, truncated, duplicate or out-of-scope slices and unknown required classifications. If a year outgrows the limit, fail visibly and revisit the contract.
2. Normalize types and field order, sort rows by stable source key and hash their statistical content. Record the publisher’s resource-wide update stamp separately. An identical active release type and content hash is a no-op even if response order changes. A change of release type remains meaningful when the numeric values agree.
3. In one transaction, retain the new release, replace that year’s active rows, record cell additions, changes and removals relative to the previous release and move the current pointer. Preserve both sides of each change. Readers see either complete release. A failure rolls back the switch. The lock serializes concurrent runs.
4. Milestone 1 publishes only final years. Model preliminary and final as distinct source states. A preliminary slice never enters a final view. A final release supersedes a preliminary pointer atomically. A late preliminary response cannot replace an active final year.

CI acceptance covers identical and reordered reruns, a changed cell with old/new values, a removed row, duplicate keys, a count mismatch, an interrupted transaction, concurrent runs, preliminary-to-final promotion and rejection of a later preliminary downgrade. Replay the migrations on an empty database and verify the local CSV against the same release-specific SQL results. There is no paging or partition scheme in this importer.

### Resource-specific vocabulary

Use an explicit mapping per resource and preserve the original value alongside any normalized meaning. In the awards resource, the institution key is `koodiKorkeakoulu`, tuition-fee funding is `Lukukausimaksu` and commissioned education is `Maksullinen tilauskoulutus`. Related resources use `Lukuvuosimaksu` and `Tilauskoulutus`, and `yamk_tutkinnot` uses `kooditKorkeakoulu`. Test each spelling with a fixture from its own resource and reject an unknown funding value before calculating an exclusion. Only the awards adapter belongs in milestone 1.

## Hosting decision for milestone 2

Around 8,000 source rows per year support a static read-only site built from reviewed SQL results. It can publish release-specific tables, filters and downloads without a running database connection. Compare that option with Next.js on Vercel and PostgreSQL on Supabase after interviews establish refresh frequency, access needs and user tasks. Start with accessible HTML tables. Consider AG Grid or AG Charts only for a demonstrated need.

Local milestone 1 needs no hosted service. For an institutional deployment, budget for a commercial plan or institutional hosting. Vercel describes Hobby as personal, non-commercial use. A public repository alone establishes no entitlement for an institutional service. Obtain a current quote for seats, storage, backups and usage if a managed deployment is selected. [Vercel Hobby](https://vercel.com/docs/plans/hobby) · [Vercel Pro](https://vercel.com/docs/plans/pro-plan) · [Supabase pricing](https://supabase.com/pricing)

Before any hosted migration verify and record the connected Supabase project's actual region. Supabase fixes it at creation, and a move requires migration to a new project. If the application needs Vercel functions, set and verify a specific EU execution region. Review database, backups, logs, build artifacts, support and CDN separately. Hosted settings were outside this public-source review. [Supabase regions](https://supabase.com/docs/guides/platform/regions) · [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region)

## Institutional boundary and publication

Use only public aggregates or synthetic inputs in this repository, tests, agent prompts and previews. A future Arvo importer belongs on institution-managed EU infrastructure with an approved static outbound IP, its own credentials, restricted store, logs and backups. An authorized steward can release a defined aggregate file after disclosure review. Use an allowlist of columns, suppress small and complementary cells, reject free text and preserve the distinction between local and national figures. Keep the restricted store and credentials outside the public application project.

Before institutional processing, the institution owns purpose, lawful basis, recipients, retention, processor agreements, access review and any required impact assessment. Confirm location and access for database, backups, logs, support, analytics, build artifacts and CDN independently. An EU database region alone cannot settle these questions. Identity via Entra and role-based access can follow an approved restricted use case. [EU General Data Protection Regulation](https://eur-lex.europa.eu/eli/reg/2016/679) · [Arvo onboarding](https://wiki.eduuni.fi/pages/viewpage.action?pageId=806980264)

The repository is public under Aamu AI. A software release still requires a rights holder, a licence decision and permission for any institutional branding. MIT offers a short permissive grant. Apache 2.0 adds an explicit patent grant and notice obligations. Prefer Apache 2.0 for review if several institutions will contribute. The owner makes the final choice. Software licensing does not grant rights to republish datasets or screenshots. [MIT text](https://opensource.org/license/mit) · [Apache 2.0 text](https://opensource.org/license/apache-2-0)
