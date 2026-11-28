# AVOP question evidence and design

AVOP is the graduation-stage survey for both UAS degree levels. Under decree 171/2024, awarded funding uses the sum of scored responses in the reporting year. The separate career follow-up survey asks bachelor's and master's graduates about work five years after graduation. It uses a 1–6 scale and its own item weights and denominator. AVOP scores, career scores and separately reported employment counts each have their own meaning. [AVOP operator](https://avop.fi/en) · [Decree 171/2024, annex §§4–6 in Finnish](https://www.finlex.fi/fi/lainsaadanto/saadoskokoelma/2024/171) · [Swedish annex, pp. 7–9](https://www.finlex.fi/api/media/statute/5600/mainPdf/main.pdf?timestamp=2024-04-11T00%3A00%3A00.000Z#page=7)

## Official set and versions

2025 and 2026 collections have the 28 statutory items for bachelor’s and common items 1–26 for master’s. Arvo’s 11 April 2025 note identifies a stale 2025 funding label for the question about combining study, work and personal circumstances. It was already corrected in Vipunen and removed from Arvo’s 2026 metadata. Exclude that item from a 171/2024 calculation even when an older export flags it. Swedish wording in the survey received corrections in the 2023 questionnaire. Store the exact wording and response options from each questionnaire version for display. Use the official bilingual annex for the statutory wording. Arcada’s agreement separately sets a goal of over 90% reporting satisfaction above 4. Verify the exact item and denominator with Arcada before displaying it. [Arvo correction notice](https://wiki.eduuni.fi/spaces/CscArvo/pages/66323368/AVOP%2Brahoitusmallikysymykset) · [Arvo bachelor form, Finnish and Swedish](https://wiki.eduuni.fi/spaces/CscArvo/pages/15401086/AVOP-kysymykset%2BAMK) · [Arvo forms and master’s preview](https://wiki.eduuni.fi/spaces/CscArvo/pages/17958088/Kyselyn%2Bsis%C3%A4lt%C3%B6) · [Arcada agreement, p. 3](https://okm.fi/ammattikorkeakoulut-sopimukset)

The legal set follows the **funding** year. The previous decree, 117/2019, describes the same 26 common topics and two bachelor’s placement topics in the same annex order. For funding through 2024, retain that rule identifier and the actual survey vintage. For older survey years used in a 2025 or later baseline, map the questionnaire versions to that decision’s statutory set and verify how the allocator handled any wording or applicability differences. Arvo also documents variations in 2016–2018. Arvo’s 2026 collection closes on 15 January 2027, so the collection label and response calendar year need separate fields. For cross-year analysis use the annex number as the rule identifier, the ministry’s published questionnaire number as a cross-reference and the Arvo `kysymysid` with collection and degree level when a permitted export supplies it. The questionnaire number can appear differently by form. Stable Arvo IDs across years and levels remain unverified. [Previous decree, pp. 6–7](https://www.finlex.fi/api/media/statute/43728/mainPdf/main.pdf?timestamp=2019-01-17T00%3A00%3A00.000Z#page=6) · [2026 Arvo collection dates](https://wiki.eduuni.fi/spaces/CscArvo/pages/652612507/Uutiskirje%2B12-2025) · [Arvo API field definitions](https://wiki.eduuni.fi/spaces/CscArvo/pages/136353014/Arvo-API%2Bv.%2B1.0%2Btietosis%C3%A4lt%C3%B6)

| Annex item | Ministry questionnaire number | Topic for navigation |
| ---: | ---: | --- |
| 1 | 14 | Recognition of prior learning |
| 2 | 16 | Avoiding duplicate content |
| 3 | 18 | Personal study plan |
| 4 | 20 | Year-round study opportunities |
| 5 | 22 | Quality of guidance |
| 6 | 23 | Teaching expertise |
| 7 | 27 | Variety and suitability of teaching methods |
| 8 | 31 | Cooperation with teachers |
| 9 | 33 | Equal and fair treatment |
| 10 | 42 | Suitability of teaching and study spaces |
| 11 | 43 | Use of online learning |
| 12 | 44 | Workplaces as learning environments |
| 13 | 47 | IT and software services |
| 14 | 48 | Library and information services |
| 15 | 50 | Information and support for progression |
| 16 | 54 | Assessment reflects competence |
| 17 | 59 | Feedback on development of competence |
| 18 | 60 | Use of student feedback in course development |
| 19 | 64 | Variety of foreign-language instruction |
| 20 | 66 | Opportunities for placement or exchange abroad |
| 21 | 71 | Involvement of alumni |
| 22 | 72 | Study opportunities with employers |
| 23 | 74 | Career planning support |
| 24 | 85 | Thesis guidance and support |
| 25 | 91 | Thesis preparation for professional work |
| 26 | 131 | Overall satisfaction with studies |
| 27 | 79 | Placement guidance and support (bachelor’s only) |
| 28 | 82 | Placement strengthened skills (bachelor’s only) |

[Ministry questionnaire number mapping](https://wiki.eduuni.fi/download/attachments/39984987/Ammattikorkeakoulujen%20perusrahoituksen%20laskennassa%20k%C3%A4ytett%C3%A4v%C3%A4t%20indikaattorit.pdf) · [Official wording in both languages](https://valtioneuvosto.fi/paatokset/paatos?decisionId=1148)

Most AVOP answers score 1–7. Annex item 18, questionnaire item 60, uses five response options scored 7, 5.5, 4, 2.5 and 1 in descending order. Sum valid scored answers across items and people. Preserve an inapplicable item, a missing or invalid answer and a suppressed count as distinct states. The ministry’s exact points require valid exact response counts by score, or exact score totals per item from the same allocation vintage. Rounded means multiplied by rounded counts introduce errors. [Swedish annex, §§4–5](https://www.finlex.fi/api/media/statute/5600/mainPdf/main.pdf?timestamp=2024-04-11T00%3A00%3A00.000Z#page=7)

## Public aggregate check

AVOP’s operator identifies Vipunen as the public route. The named funding-question workbook redirected to sign-in in this session. Its public Power BI counterpart returned “This content isn't available.” The live Vipunen API catalogue contained no UAS AVOP resource. Neither route yielded a usable question export. The annual reports include useful published institutional context but do not establish a per-question Arcada and sector export. [Vipunen AVOP catalogue](https://vipunen.fi/fi-fi/amk/Sivut/Opiskelijapalaute.aspx) · [Named workbook](https://vipunen.fi/fi-fi/Raportit/Ammattikorkeakoulutus%20-%20opiskelijapalaute%20-%20rahoitusmalli%20-%20amk.xlsb?Web=1) · [Public report link](https://www.xamk.fi/valmistuneet-opiskelijat-arvioivat-xamkin-opiskelijat-ovat-tyytyvaisia-opiskelijoita/) · [Live API catalogue](https://api.vipunen.fi/api/resources)

| Check | Evidence and acceptance |
| --- | --- |
| Question-level values | Report is described as covering funding items. Actual rows and cases for Arcada, sector, degree level and year remain unverified. |
| Valid response count | Require per-question count or a published distribution and an exact definition. A survey-wide respondent count may not apply to every item. |
| Response coverage | Require eligible survey population by matching year, level and field. Show eligible count, respondent count and valid item count separately. Arvo notes that responses and annual awards describe different timing and can yield a proxy ratio above 100%. |
| Sector comparisons | Require the official aggregate or exact compatible counts and scores with sector coverage. Do not average institution means equally. |
| Suppression | Arvo documents a Vipunen default since 2022: 1–4 shown as a range with the calculation withheld, larger person counts rounded to multiples of three, and shares based on protected counts. Verify the workbook’s own legend before relying on that rule. Do not derive hidden cells by subtraction. |
| Precision | Default protected counts cannot recover exact funding points. Seek an expressly permitted official aggregate or reconcile a calculation within Arcada to the official funding input. An Arvo staff export is permissioned and can contain respondent-level data. Leave it within institutional systems. |

[Arvo reporting and disclosure](https://wiki.eduuni.fi/pages/viewpage.action?pageId=395903963) · [AVOP coverage FAQ](https://wiki.eduuni.fi/spaces/CscArvo/pages/15401488/Kysymyksi%C3%A4%2Bja%2Bvastauksia%2BAVOP-tiedonkeruusta) · [Arvo permissions and export scope](https://wiki.eduuni.fi/spaces/CscArvo/pages/546015933/CSV-raportin%2Bottaminen)

## Arcada watchlist and usability check

Offer a full statutory set plus an optional **Arcada quality watchlist**. Select up to seven after the quality lead and programme directors assess each question for a repeatable gap against a comparable field, adequate coverage across at least two releases and a process owner who can act. Pick distinct issues across the learner journey. A starting set for discussion is 14 (prior learning), 22 (guidance), 50 (progression support), 60 (closing the feedback loop), 79 (placement support), 85 (thesis support) and 131 (overall satisfaction). If covering master’s programmes, use an applicable substitute for 79 or show the bachelor-only scope. Record who approved the list, why, its effective periods and review date. Changes affect only the local view.

Put score and coverage in separate labelled columns and report the scale and valid item count near each score. Use the [synthetic validation exercise](funding-validation.md) before adding any live survey view. Ratings and response coverage answer different questions even when they come from the same release.
