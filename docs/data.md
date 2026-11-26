# Data inventory and statistical evidence

## What the live sources establish

On 26 November 2026, Vipunen listed **47 resources**. We profiled 29 tertiary, reference or cross-sector candidates. Each profile includes the advertised fields, a successful request for one actual row, total row count and, where there is a recognized time axis, a one-row ascending and descending sort. The other names concern school, vocational or matriculation-examination data. Counts below are records across the whole resource. Period endpoints establish bounds only. Individual institutions, measures and intermediate years may have shorter coverage. The snapshot records the update stamp found on a sample. It cannot establish a refresh schedule from a single observation. [Catalogue](https://api.vipunen.fi/api/resources) · [Swagger](https://api.vipunen.fi/api/swagger-ui/index.html) · [OpenAPI contract](https://api.vipunen.fi/api/v3/api-docs) · [Full probe output](../research/vipunen-profile.json)

A reviewer can request `/resources/{name}`, `/data/count` and `/data?limit=1` under that resource. Discovery tested an encoded FIQL filter (the API's filtering language), sorted period endpoints, and a complete small filtered response. The contract exposes offset and limit. It gives no release pin, stable default order or deletion feed. The JSON resource description contains field names and types. Population definitions and reuse terms need additional sources. [Reproduction commands](../README.md)

### Degree awards and students at Arcada

Observed 26 November 2026. Both national publications include all funding sources. Arcada’s 2025 Swedish annual report explicitly excludes degrees completed in commissioned education. In Vipunen’s awards resource this means excluding precisely `rahoituslahde = 'Maksullinen tilauskoulutus'`. Retain tuition-fee degrees. The last column below applies the same funding filter to the student measure. [2025 annual report, Tables 1 and 2](https://www.arcada.fi/sites/default/files/2026-04/Arcada%20University%20of%20Applied%20Sciences%20Annual%20Report%202025%20in%20Swedish.pdf) · [2024 annual report, Tables 1 and 2](https://www.arcada.fi/sites/default/files/2025-06/Yrkesh%C3%B6gskolan%20Arcadas%20verksamhetsber%C3%A4ttelse%202024.pdf) · [StatFin 13k9](https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__opiskt/13k9.px/) · [Executable comparison](../research/check_arcada.py)

| Final year | National degrees, bachelor + master | Vipunen excluding commissioned | Arcada report | Students, all − commissioned = report |
| --- | --- | --- | --- | --- |
| 2025 | 489 + 84 = 573 | 477 + 84 = 561 | 561 | 2,899 − 30 = 2,869 |
| 2024 | 478 + 84 = 562 | 478 + 84 = 562 | 562 | 2,705 − 52 = 2,653 |
| 2023 | 470 + 74 = 544 | 470 + 74 = 544 | 546 | 2,653 − 0 = 2,653 |

The 12 commissioned awards in 2025 were four nursing degrees (671101) and eight public health nursing degrees (671103). In 2024 there were zero commissioned awards in 240 Arcada source rows. That explains the 562 under both definitions and why 2025 is the stronger test. The student arithmetic resolves the earlier 52-student question. Request written confirmation of the degree rule and student population from Arcada’s statistics contact.

| Arcada annual report cell | 2025 | 2024 | 2023 |
| --- | ---: | ---: | ---: |
| Table 1, technology | 57 | 34 | 37 |
| Services | 14 | 22 | 22 |
| Arts and culture | 74 | 67 | 47 |
| ICT | 28 | 32 | 38 |
| Health and welfare | 235 | 249 | 253 |
| Business | 153 | 158 | 149 |
| Table 2, arts and culture (bachelor) | 58 | 57 | 32 |
| Health and welfare (bachelor) | 205 | 217 | 226 |
| Economy and services (bachelor) | 143 | 154 | 144 |
| Technology and ICT (bachelor) | 71 | 50 | 70 |

After the funding exclusion, the six policy fields in `okmOhjauksenAla` reproduce both 2025 and 2024 tables. For Table 2 combine business with services, and technology with ICT. Arts and health each stand alone. The historical `rahoitusmallialaAmk2021-2024` grouping also yields the four 2025 counts. The source has no 2025–2028 funding-field column. Store Arcada’s agreement and mapping separately, pending its written confirmation. The same grouping localizes the 2023 discrepancy.

### Expected differences

| Period and status | Named sides and expected difference | Evidence needed for resolution |
| --- | --- | --- |
| Arcada 2023, unexplained | Report minus final Vipunen awards = **+2** bachelors (472 − 470). StatFin also gives 470. Vipunen’s on-time resource with observation date 1 April 2026 gives 472. Business bachelors are 123 there and 121 in the awards resource. Table 1 business is 149 vs 147 **across both levels**. Table 2 economy and services is 144 vs 142. | Arcada’s authorized statistics contact checks its 2023 business bachelor award list, award dates and funding sources inside the register. Record the aggregate explanation only. |
| Laurea 2024, unexplained | Final Vipunen awards minus StatFin 13k9 = **+1** bachelor (1,948 − 1,947). All of it occurs in qualification 631101 (528 − 527). | Ask Vipunen or Statistics Finland to reconcile the releases for institution 02629 and code 631101. |

Across the 22 common institutions in 2022–2025, we compared degrees and students by institution, bachelor/master level and qualification code. The only numeric award difference was the Laurea cell. Student totals matched. Full-time and part-time bachelors are combined in StatFin. Preserve each source’s values and the signed difference until its publisher explains it. The related `yamk_tutkinnot` resource also gives Arcada 74, 84 and 84 master's awards in 2023–2025.

New students need their own reconciliation before admissions work. Institution totals differed by one to three in 37 of 88 comparisons. Arcada 2025 was 1,064 in Vipunen and 1,065 in StatFin. Both gave 414 men. Women were 650 vs 651, accounting for the difference. StatFin’s unknown category had no numeric value.

### Sector coverage and source behaviour

In 2024 Vipunen counted 33,338 degrees at its 22 UAS. StatFin counted 33,771 at 24 institutions. StatFin additionally includes Åland UAS (10031, 61 degrees) and the Police University College (02557, 373). StatFin minus Vipunen is 433 = 61 + 373 − 1, after Laurea. Every published sector total must carry its constituent institution codes. The reconciliation prints and checks both complete membership lists.

Final Vipunen UAS slices contained 7,948, 8,303, 8,331 and 8,529 rows for 2022–2025 respectively. A bounded single fetch of 2024 matched the paged result as a multiset. The [source-row key](architecture.md) was unique across 33,111 rows. The source publishes numeric cells of one. Preserve observed counts and distinguish missing observations from zero. Defer report-specific suppression and differencing controls to survey sources.

The resource-wide update stamp was 28 September 2026 across years. It cannot identify a changed year. For 2026, 15,901 preliminary (`Ennakko`) rows covered all sectors, including 6,907 UAS rows. Keep those outside the final series. Source vocabulary also varies: tuition appears as `Lukukausimaksu` in awards and `Lukuvuosimaksu` in the master's and on-time resources. Commissioned education appears as `Tilauskoulutus` in the on-time resource. [Resource catalogue](https://api.vipunen.fi/api/resources)

Arcada’s 2024 awards covered 25 national qualification codes. Qualifying as a nurse can cover both Swedish- and English-language programmes. Among the three degree resources checked, only the on-time resource supplies `koulutuskieli`. Arcada bachelor awards there had unknown language in 2022–2024 and 374 Swedish and 115 English in 2025, including commissioned education. These counts cannot identify local programmes. Keep the public breakdown at qualification code and funding source pending signed register mappings.

## Vipunen resources

AMK denotes a university of applied sciences, YAMK its master's qualification and YO a university. Field means a published education classification. A national qualification code can correspond to several named local programmes. Programme-level admission options carry their own identifiers.

| Resource | Years observed | Records | Supported comparisons and conditions |
| --- | --- | ---: | --- |
| `opiskelijat_ja_tutkinnot` | 2010–2026 | 306,951 | Institution, qualification, three field levels, gender, region, funding and January/September attendance. Separate final and other releases. Degrees, new entrants, student counts and full-time equivalents have different units. Age and nationality are absent here. |
| `korkeakoulutus_hakeneet_ja_paikan_vastaanottaneet` | 2015–2027 intake | 259,973 | Institution, field, option OID, language, start term, application route, selection queue. Fields cover applicants, first choice, selected, accepted places, starters and capacity. Sample had null capacity and score bounds. Future intake can exist before a selection is complete. Establish the privacy/rounding and queue overlap rules before computing totals. |
| `tavoiteajassa_tutkinnon_suorittaneet` | 2015–2026 | 243,635 | Institution, qualification, field, month, funding source, release, on-time and late award counts. Candidate rate is on-time awards / eligible awards within the same final observation scope. This answers a question about graduates. An entry-cohort completion probability needs entrants and longitudinal follow-up. |
| `suorittanut55` | 2006–2026 | 32,849 | Institution, field and qualification. Separate 55-credit counts with/without credit banking and the 27-credit measure. Verify academic period, eligible population and historical rule changes before expressing as a share. |
| `amk_opintopisteet` / `amk_opintopisteet_kuukausi` | 2009–2026 / 2019–2026 | 24,061 / 47,668 | UAS, policy field, education type and month. Categories include degree, open and exchange credits. Verify whether the chosen measure is cumulative and which categories overlap before summing months or categories. |
| `yo_opintopisteet` / `yo_opintopisteet_kuukausi` | 2009–2026 / 2019–2026 | 2,850 / 8,858 | University and policy field. Separate adapters for university measures. Compare within sector until definitions align. |
| `yamk_tutkinnot` | 2004–2026 | 19,503 | UAS master's awards, month, institution, qualification, scope in credits, funding and field. Useful to cross-check a subset of the general awards series. |
| `korkeakoulutus_kv_liikkuvuus` | 2004–2025 | 35,832 | Institution, qualification, field, gender, direction, duration and type. Counts mobility periods. Students can have multiple periods. Degree mobility, nationality and incoming exchange are distinct questions. |
| `amk_talous` / `amk_talous2` | 2014–2025 / 2015–2025 | 31,889 / 52,387 | UAS fiscal accounts, field, function, multilingual account hierarchy. Second resource includes group scope and account code. Check unit, consolidation, negative entries and parent accounts against a financial statement. |
| `yo_talous` / `yo_talous2` | 2012–2025 / 2013–2025 | 77,779 / 93,221 | University accounts, group, accounting category and field. Overlapping versions need a coverage and methodology comparison. Annual accounts and government funding entitlements require separate indicators. |
| `avoin_amk` / `avoin_yliopisto` | 2009–2025 / 2010–2025 | 12,456 / 706 | Open UAS participation and credits by provider/field/gender. University series has institution, gender and completer count. Denominators differ. |
| `koulutusluokitus` | reference snapshot | 3,185 | Finnish, Swedish and English education/field labels and codes. Version with each source release. Historical funding classifications coexist. |
| `henkilosto` | 2010–2025 | 1,889,328 | Institution, field, role, nationality and staff-years. Staff-years measure labour input. Consider for a later capacity question after aligning student and staff populations. |

Other profiled candidates include commissioned and noncommissioned theses, continuing education, separate study rights, teaching hours, publications, campuses and premises. The subunit directory has old and current institution codes and an observed year sentinel of `-1`. Preserve that value outside the calendar axis. Publication records can repeat a publication across organizations. Cross-sector cost and output resources include provider, sector and municipality. Verify the actual UAS population before treating them as a funding source. Keep vocational `amm_rahoitus_*` outside university funding and AVOP. See the full profile for per-resource sizes, dates, fields and update stamps. [Measured profiles](../research/vipunen-profile.json)

**Refresh and interpretation.** EDUFI maintains sector release calendars and a report update log. Its higher education live admissions report refreshes daily. That promise applies to the report. The API sample had an update stamp of 21 November for admissions, 28 September for students/degrees and 26 November for on-time awards. Use source release checks with a weekly pilot poll and a manual refresh after corrections. Record data-as-of date separately from import time. Yearly or monthly observation grain alone gives no ingestion schedule. [EDUFI reporting guide](https://www.oph.fi/fi/tilastot/tilastopalvelu-vipunen) · [Admissions reporting](https://www.oph.fi/fi/tilastot/tilastotietoa-koulutukseen-hakemisesta)

**Admission comparisons.** In Finland's first spring 2025 joint application, applicants could receive multiple offers. EDUFI's downloadable table reports 923 applicants and 199 accepted at Arcada (rounded rate 22%). This is a useful institution/round check. Distinct institution-wide applicants cannot be recovered by adding counts across options where individuals may occur more than once. Likewise, verify which rounds use ordered preferences before labelling a measure first choice. [EDUFI application rules](https://www.oph.fi/en/news/2025/number-applicants-halved-joint-application-higher-education-english) · [Published acceptance table](https://www.oph.fi/sites/default/files/documents/Number%20of%20applicants%20by%20field%20and%20by%20HEI%2C%20first%20joint%20application%20to%20higher%20education%2C%20spring%202025%20.pdf)

## Survey reports, exports and rights

| Source | Verified route and evidence | Next qualification check |
| --- | --- | --- |
| AVOP graduating-student feedback | Survey operator publishes national aggregates in Vipunen. A publisher analysis covered 161,982 respondents in 2016–2022 using a 1–7 scale. Arvo documentation describes annual public updates in early February. | Obtain a downloadable public aggregate and report explanation. Verify latest complete cohort, question versions, bachelor/master coverage, weights, valid counts, eligible graduates, field/degree cuts and allowed redistribution. |
| UAS career follow-up | Annual survey of bachelor's and master's graduates five years after graduation. The UAS network links public results, a Power BI view and reports for the 2013, 2014 and 2015 graduating cohorts. Public updates follow each survey with a variable lag. | Keep survey year, graduation cohort and valid respondents separate. Confirm published aggregation, sample size, response rate and cross-year comparability for the chosen question. Full public file range and size are unverified. |
| Vipunen workbooks | EDUFI links the live HE admissions `Haku ja valinta - korkeakoulu - live.xlsb` Excel report. The viewer redirected through sign-in infrastructure and the anonymous file request returned HTTP 403 here. A public report listing does not establish a stable machine download. | Prefer the documented JSON API for admissions. For surveys, accept a dated, permitted public aggregate export manually, accompanied by its report legend, filters, source link and checksum. Reject unexpected columns and respondent-level files. |
| Institutional Arvo CSV/API | Authorized Arvo users can export a CSV containing identifiers, small cells and free text. The CSV lacks national comparison data. The API is a paid higher-education add-on requiring an agreement and registered static outbound IP. | Only a future institution-operated importer may read this material. Public analysis uses separately approved aggregate cells and the authorized recipient/purpose. Do not ask staff to send raw exports to the development team. |

Sources for these routes and limitations: [AVOP operator](https://avop.fi/en) · [Vipunen AVOP analysis](https://tilastoneuvos.vipunen.fi/2023/07/20/opiskelijatyytyvaisyyteen-vaikuttavat-tekijat-ammattikorkeakoulujen-opiskelijapalautekyselyn-nakokulmasta/) · [Arvo publication calendar and reports](https://wiki.eduuni.fi/pages/viewpage.action?pageId=567370485) · [UAS career results](https://amk-uraseuranta.turkuamk.fi/en/results/) · [Career survey population](https://lab.fi/en/career-monitoring-survey) · [Arvo CSV contents](https://wiki.eduuni.fi/spaces/CscArvo/pages/546015933/CSV-raportin%2Bottaminen) · [Arvo onboarding](https://wiki.eduuni.fi/pages/viewpage.action?pageId=806980264) · [EDUFI workbook listing](https://www.oph.fi/fi/tilastot/tilastotietoa-koulutukseen-hakemisesta).

Public survey reports have applied suppression and rounding. One documented rule displays counts of 1–4 as a range and withholds the corresponding statistic. Record the rule from the specific report and vintage. Preserve the publisher's displayed value, suppression flag and rounding precision. Prevent comparisons and exports that reveal hidden cells by subtraction. Where a valid response count, eligible population or score distribution is missing, show that limitation. A response rate, a question mean and a funding score each require their own definition. [Arvo disclosure guidance](https://wiki.eduuni.fi/pages/viewpage.action?pageId=390825445)

**Reuse.** Publisher wording for the Vipunen API could not be captured from its landing page in this run. Record the authoritative licence, attribution and modification wording and any dataset exceptions before redistributing rows or enabling public downloads. Confirm workbook/report terms separately. Keep raw responses and the user's reference image outside Git. StatFin explicitly permits reuse of open material under CC BY 4.0. Attribute the producer, table, release, retrieval date, licence and transformations in exports. Institutional authorisation is specific to the recipient and purpose. [Vipunen API landing page](https://vipunen.fi/fi-fi/Sivut/Vipunen-API.aspx) · [Statistics Finland terms](https://stat.fi/en/about-us/get-to-know-statistics-finland/legislation/terms-of-use)

## Complementary sources and comparison levels

| Source | Verified coverage and dimensions | Appropriate use |
| --- | --- | --- |
| StatFin 13k9 | Live metadata: 2002–2025, 25 institution selections including total, 185 education selections, gender and type. Annual release. The reconciliation reads coded JSON-stat cells. | Cross-check comparable UAS qualifications and counts. Changes to education types before 2015 affect long historical comparisons. [Table](https://pxdata.stat.fi/PxWeb/pxweb/en/StatFin/StatFin__opiskt/13k9.px/) |
| StatFin 14pm / 14pn | Annual discontinuation. Live 14pm metadata has six school years 2018/19–2023/24, five sector selections, 30 fields, gender and four measures. 14pn spans 2000/01–2023/24 at a broader level. | Show the September denominator and specify leaving a field, sector or all qualification education. Neither a national field rate nor its complement establishes retention at Arcada. [14pm metadata](https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/kkesk/14pm.px) · [Methodology](https://stat.fi/en/documentation/documentation-of-statistics/kkesk) |
| StatFin 111l | Live metadata: 2007–2024, 14 education-level selections, 3 sex selections, 21 regions, 13 fields and 26 measures. Annual register-based outcomes one and three years after graduation. | National/field/region benchmark. Institution and named programme are absent from this table. Distinguish employment among all graduates from employment among respondents or residents. [Table metadata](https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/sijk/111l.px) |
| Eurostat UOE | Graduate table `educ_uoe_grad01` covers 2012–2024, 1,844,527 possible cells, annual country/ISCED level, sex and age. Enrolment by field is available separately. | International context at national level. Check reporting boundaries, flags, licence exceptions and coverage for each series. ETER offers a separate candidate route for institution-level comparisons after entity and mission matching. [Eurostat graduate table](https://ec.europa.eu/eurostat/databrowser/view/educ_uoe_grad01/default/table?lang=en) · [ETER comparison example](https://tilastoneuvos.vipunen.fi/2023/08/28/opiskelijoita-per-opetus-ja-tutkimushenkilo-ja-professori-kansainvalisessa-vertailussa/) |

Vipunen and PxWeb already let analysts explore many dimensions. The product should save the validated cohort, comparison, definitions and provenance used in recurring management decisions. The career network's Töissä.fi service demonstrates a different task: career guidance by field. Its audience and outcome groupings are useful references for a future graduate outcomes page. [UAS network's comparison of result services](https://amk-uraseuranta.turkuamk.fi/en/results/)
