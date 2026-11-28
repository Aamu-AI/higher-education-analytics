"""Reconcile live public degree counts with the dated references in docs/data.md."""
import itertools
import json
from collections import Counter
from urllib.request import Request, urlopen

from probe import get

ARCADA = "02535"
LAUREA = "02629"
NURSING = "671101"
ARCADA_NURSING_STARTERS = {2023: 72, 2024: 177, 2025: 304}
BACHELOR = "Ammattikorkeakoulututkinto"
MASTER = "Ylempi ammattikorkeakoulututkinto"
COMMISSIONED = "Maksullinen tilauskoulutus"
AWARDS_FUNDING = {"Perusrahoitus", "Lukukausimaksu", COMMISSIONED,
                  "ESR-rahoitus, vain ammattikorkeakoulukoulutus",
                  "TE-rahoitus, vain ammattikorkeakoulukoulutus"}
FIELDS = ("Tekniikan alat", "Palvelualat", "Taiteet ja kulttuurialat",
          "Tietojenkäsittely ja tietoliikenne", "Terveys- ja hyvinvointialat",
          "Kauppa, hallinto ja oikeustieteet")
TECH, SERVICES, ARTS, ICT, HEALTH, BUSINESS = FIELDS
NATIONAL = {2023: (470, 74), 2024: (478, 84), 2025: (489, 84)}
STUDENTS = {2023: (2653, 2653), 2024: (2705, 2653), 2025: (2899, 2869)}
# Arcada 2025 annual review, Tables 1 and 2, including prior-year columns.
REPORT = {
    2023: ((37, 22, 47, 38, 253, 149), (32, 226, 144, 70), (472, 74)),
    2024: ((34, 22, 67, 32, 249, 158), (57, 217, 154, 50), (478, 84)),
    2025: ((57, 14, 74, 28, 235, 153), (58, 205, 143, 71), (477, 84)),
}
REPORT_MINUS_VIPUNEN = {2023: 2, 2024: 0, 2025: 0}
VIPUNEN_MEMBERS = set("""02467 02469 02471 02472 02473 02504 02507 02509
02535 02536 02537 02623 02627 02629 02630 02631 10056 10065 10066 10108
10118 10126""".split())
STATFIN_EXTRA = {"10031": 61, "02557": 373}
STATFIN = "https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/opiskt/13k9.px"


def check(label, actual, expected):
    if actual != expected:
        raise ValueError(f"{label}: expected {expected!r}, observed {actual!r}")


def vipunen(resource, filters):
    path = f"/{resource}/data"
    count = get(path + "/count", filter=filters)
    if not 0 < count <= 10000:
        raise ValueError(f"{resource}: expected 1 to 10000 rows, got {count}")
    rows = get(path, filter=filters, limit=10000)
    check(resource + " row count", len(rows), count)
    return rows


def statfin(year):
    dimensions = {"timeperiod_y": [str(year)], "amk_1_20210101": None,
                  "koulutustyyppi_1_20160401": ["S", "1", "2", "6"],
                  "sukupuoli_9_20180101": ["SSS"],
                  "koulutus_25_20250101": ["SSS", "631101"],
                  "contentscode": ["opp_amk", "aloit_amk_1", "tutk_amk"]}
    query = [{"code": code, "selection": {"filter": "item" if values else "all",
                                          "values": values or ["*"]}}
             for code, values in dimensions.items()]
    body = json.dumps({"query": query, "response": {"format": "json-stat2"}}).encode()
    with urlopen(Request(STATFIN, data=body, headers={"Content-Type": "application/json"}),
                 timeout=60) as response:
        cube = json.load(response)
    check("StatFin axes", cube["id"], list(dimensions))
    axes = []
    for code in dimensions:
        index = cube["dimension"][code]["category"]["index"]
        axes.append(sorted(index, key=index.__getitem__))
    cells = dict(zip(itertools.product(*axes), cube["value"], strict=True))

    def read(institution, level="S", education="SSS", measure="tutk_amk"):
        value = cells[str(year), institution, level, "SSS", education, measure]
        if type(value) is not int:
            raise ValueError(f"Unavailable StatFin cell: {year}/{institution}/{level}/{education}/{measure}")
        return value

    return read, set(axes[1]) - {"SSS"}


def tally(rows, dimension):
    counts = Counter()
    for row in rows:
        counts[row[dimension]] += row["tutkinnot"]
    return counts


def levels(rows):
    counts = tally(rows, "koulutusasteTaso2")
    check("degree levels", set(counts), {BACHELOR, MASTER})
    return counts[BACHELOR], counts[MASTER]


def check_arcada(year, rows, read):
    rows = [r for r in rows if r["koodiKorkeakoulu"] == ARCADA]
    included = [r for r in rows if r["rahoituslahde"] != COMMISSIONED]
    check("Arcada nursing starters excluding commissioned education",
          sum(r["uudetOpiskelijat"] for r in included if r["koodiKoulutus"] == NURSING),
          ARCADA_NURSING_STARTERS[year])
    national = levels(rows)
    local = levels(included)
    check("Vipunen national awards", national, NATIONAL[year])
    check("StatFin national awards", (read(ARCADA, "1") + read(ARCADA, "2"), read(ARCADA, "6")), national)
    check("StatFin total", read(ARCADA), sum(national))
    all_students, included_students = STUDENTS[year]
    check("StatFin students", read(ARCADA, measure="opp_amk"), all_students)
    check("Vipunen students", sum(r["opiskelijat"] for r in rows), all_students)
    check("Arcada students", sum(r["opiskelijat"] for r in included), included_students)

    table1, table2, report_levels = REPORT[year]
    gap = REPORT_MINUS_VIPUNEN[year]
    check("report minus Vipunen by level", (report_levels[0] - local[0], report_levels[1] - local[1]), (gap, 0))
    fields = tally(included, "okmOhjauksenAla")
    check("Arcada steering fields", set(fields), set(FIELDS))
    for field, report_value in zip(FIELDS, table1, strict=True):
        check(f"Table 1 report minus Vipunen, {field}", report_value - fields[field], gap if field == BUSINESS else 0)
    bachelors = [r for r in included if r["koulutusasteTaso2"] == BACHELOR]
    fields = tally(bachelors, "okmOhjauksenAla")
    groups = (fields[ARTS], fields[HEALTH], fields[BUSINESS] + fields[SERVICES], fields[TECH] + fields[ICT])
    check("Table 2 report minus Vipunen", tuple(a - b for a, b in zip(table2, groups, strict=True)), (0, 0, gap, 0))
    if year == 2023:
        on_time = vipunen("tavoiteajassa_tutkinnon_suorittaneet",
                          "koodiKorkeakoulu=='02535';tilastovuosi==2023;aineistotyyppi=='Lopullinen'")
        other = [r for r in on_time if r["koulutusasteTaso2"] == BACHELOR]
        check("on-time resource observation", {r["tietojenAjankohta"] for r in other}, {"2026-04-01"})
        check("on-time resource bachelor awards", sum(r["tutkinnot"] for r in other), 472)
        check("business bachelors by resource", (fields[BUSINESS], tally(other, "okmOhjauksenAla")[BUSINESS]), (121, 123))
    if year == 2025:
        excluded = tally([r for r in rows if r["rahoituslahde"] == COMMISSIONED], "koodiKoulutus")
        check("commissioned nursing awards", +excluded, {"671101": 4, "671103": 8})
        check("new students, Vipunen / StatFin", (sum(r["uudetOpiskelijat"] for r in rows),
              read(ARCADA, measure="aloit_amk_1")), (1064, 1065))
    print(f"Arcada {year}: all {national[0]}+{national[1]}={sum(national)}, "
          f"excluding commissioned {local[0]}+{local[1]}={sum(local)}, "
          f"report minus Vipunen {gap:+d}; students {all_students}/{included_students}")


def check_sector(rows, read, stat_members):
    laurea = [r for r in rows if r["koodiKorkeakoulu"] == LAUREA and r["koulutusasteTaso2"] == BACHELOR]
    for code, expected in [("SSS", (1948, 1947)), ("631101", (528, 527))]:
        source = sum(r["tutkinnot"] for r in laurea if code == "SSS" or r["koodiKoulutus"] == code)
        check(f"Laurea {code}, Vipunen / StatFin", (source, read(LAUREA, "1", code) + read(LAUREA, "2", code)), expected)
    vip = tally(rows, "koodiKorkeakoulu")
    check("Vipunen 2024 membership", set(vip), VIPUNEN_MEMBERS)
    check("StatFin 2024 membership", stat_members, VIPUNEN_MEMBERS.union(STATFIN_EXTRA))
    for member in sorted(stat_members):
        if member in STATFIN_EXTRA:
            check(f"StatFin additional member {member}", read(member), STATFIN_EXTRA[member])
        else:
            check(f"{member} Vipunen minus StatFin", vip[member] - read(member), int(member == LAUREA))
    total = sum(read(i) for i in stat_members)
    check("2024 sector totals", (sum(vip.values()), total, read("SSS")), (33338, 33771, 33771))
    print("Laurea 2024 bachelors: Vipunen 1948, StatFin 1947 (+1 unexplained); code 631101: 528/527")
    print(f"Vipunen UAS 2024: 33338 [{', '.join(sorted(vip))}]")
    print(f"StatFin UAS 2024: 33771 [{', '.join(sorted(stat_members))}]; gap 433 = 61 + 373 - 1")


def main():
    for year in sorted(REPORT):
        rows = vipunen("opiskelijat_ja_tutkinnot", f"koodiSektori=='4';aineistotyyppi=='Lopullinen';tilastovuosi=={year}")
        check("Vipunen scope", {(r["koodiSektori"], r["aineistotyyppi"], r["tilastovuosi"]) for r in rows},
              {("4", "Lopullinen", str(year))})
        check("unknown awards funding sources", {r["rahoituslahde"] for r in rows} - AWARDS_FUNDING, set())
        read, members = statfin(year)
        check_arcada(year, rows, read)
        if year == 2024:
            check_sector(rows, read, members)


if __name__ == "__main__":
    main()
