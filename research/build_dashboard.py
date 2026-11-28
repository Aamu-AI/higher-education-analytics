"""Build the dashboard's public, reconciled release. Run with Python 3.10+."""
import argparse
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.request import urlopen

from check_arcada import (
    AWARDS_FUNDING, BACHELOR, COMMISSIONED, MASTER, NURSING, STATFIN, VIPUNEN_MEMBERS,
    check, check_arcada, check_sector, statfin, vipunen,
)
from probe import BASE

RESOURCE = "opiskelijat_ja_tutkinnot"
YEARS = (2023, 2024, 2025)
OUTPUT = Path(__file__).resolve().parents[1] / "data" / "degrees.json"
SOURCE_KEY = (
    "koodiKorkeakoulu", "koodiKoulutus", "sukupuoli", "rahoituslahde",
    "kirjoillaoloTammi", "kirjoillaoloSyys", "koulutuksenMaakunta",
)
LEVELS = {BACHELOR: "bachelor", MASTER: "master"}
FIELD_NAMES = {
    "Humanistiset alat": "Humanities",
    "Kasvatusalat": "Education",
    "Kauppa, hallinto ja oikeustieteet": "Business, administration and law",
    "Luonnontieteet": "Natural sciences",
    "Lääketieteet": "Medicine",
    "Maa- ja metsätalousalat": "Agriculture and forestry",
    "Palvelualat": "Services",
    "Taiteet ja kulttuurialat": "Arts and culture",
    "Tekniikan alat": "Technology",
    "Terveys- ja hyvinvointialat": "Health and welfare",
    "Tietojenkäsittely ja tietoliikenne": "Information and communication technology",
    "Yhteiskunnalliset alat": "Social sciences",
}


def summarize(year, rows, release_type="Lopullinen"):
    """Aggregate only observed combinations. A numeric zero remains observable."""
    check("year, sector and release", {
        (row["tilastovuosi"], row["koodiSektori"], row["aineistotyyppi"]) for row in rows
    }, {(str(year), "4", release_type)})
    check("sector membership", {row["koodiKorkeakoulu"] for row in rows}, VIPUNEN_MEMBERS)
    check("duplicate source keys", len(rows) - len({
        tuple(row[field] for field in SOURCE_KEY) for row in rows
    }), 0)

    all_funding = Counter()
    included = Counter()
    for row in rows:
        field = row["okmOhjauksenAla"]
        funding = row["rahoituslahde"]
        if field not in FIELD_NAMES or funding not in AWARDS_FUNDING:
            raise ValueError(f"Unmapped classification: {field!r}, {funding!r}")
        cell = (row["koodiKorkeakoulu"], LEVELS[row["koulutusasteTaso2"]], field)
        awards = row["tutkinnot"]
        if type(awards) is not int or awards < 0:
            raise ValueError(f"Invalid degree count for {year} {cell}: {awards!r}")
        all_funding[cell] += awards
        if funding != COMMISSIONED:
            included[cell] += awards

    return [
        {"year": year, "institution": code, "level": level, "field": field,
         "all": count, "included": included[code, level, field]}
        for (code, level, field), count in sorted(all_funding.items())
    ]


def institution_names():
    with urlopen(STATFIN, timeout=60) as response:
        variables = json.load(response)["variables"]
    institutions = next(v for v in variables if v["code"] == "amk_1_20210101")
    names = dict(zip(institutions["values"], institutions["valueTexts"], strict=True))
    return {code: names[code] for code in sorted(VIPUNEN_MEMBERS)}


def build():
    records = []
    starters = []
    stamps = set()
    counts = {}
    for year in YEARS:
        rows = vipunen(RESOURCE, f"koodiSektori=='4';aineistotyyppi=='Lopullinen';tilastovuosi=={year}")
        records.extend(summarize(year, rows))
        by_institution = Counter()
        for row in rows:
            if row["koodiKoulutus"] == NURSING:
                count = row["uudetOpiskelijat"]
                if type(count) is not int or count < 0:
                    raise ValueError(f"Invalid nursing starter count for {year}: {count!r}")
                by_institution[row["koodiKorkeakoulu"]] += count if row["rahoituslahde"] != COMMISSIONED else 0
        starters.extend({"year": year, "institution": code, "count": count}
                        for code, count in sorted(by_institution.items()))
        stamps.update(row["tietojoukkoPaivitettyPvm"] for row in rows)
        counts[str(year)] = len(rows)
        read, members = statfin(year)
        check_arcada(year, rows, read)
        if year == 2024:
            check_sector(rows, read, members)
    if len(stamps) != 1:
        raise ValueError(f"Inconsistent source update dates: {stamps!r}")
    return assemble(records, stamps.pop(), counts, institution_names(), starters)


def assemble(records, source_stamp, counts, institutions, starters):
    metadata = {
        "source": "Vipunen – Education Statistics Finland",
        "resource": RESOURCE,
        "sourceUrl": f"{BASE}/{RESOURCE}",
        "upstream": "National higher education register (VIRTA)",
        "upstreamUrl": "https://stat.fi/fi/dokumentaatio/tilastojen-dokumentaatio/akop",
        "institutionLabelsSource": "Statistics Finland, StatFin table 13k9",
        "institutionLabelsUrl": STATFIN,
        "sourceStamp": source_stamp,
        "releaseType": "Lopullinen",
        "years": list(YEARS),
        "sourceRows": counts,
        "licence": "CC BY 4.0",
        "licenceUrl": "https://creativecommons.org/licenses/by/4.0/",
        "termsUrl": "https://vipunen.fi/fi-fi/Sivut/K%C3%A4ytt%C3%B6ehdot.aspx",
        "unit": "Degrees awarded",
        "transformations": "Final UAS rows summed by year, institution, degree level and ministry policy field. The included count excludes Maksullinen tilauskoulutus. Field labels translated to English.",
        "coverage": "22 universities of applied sciences in the Vipunen resource. Åland University of Applied Sciences and the Police University College are outside this population.",
        "knownDifferences": [
            {"year": 2023, "institution": "02535", "status": "unexplained",
             "detail": "Arcada reports 472 bachelor’s awards. Vipunen records 470. The difference is in business."},
            {"year": 2024, "institution": "02629", "status": "unexplained",
             "detail": "Vipunen records 1,948 bachelor’s awards at Laurea. StatFin records 1,947. The difference is in qualification 631101."},
        ],
    }
    return {"metadata": metadata, "institutions": institutions,
            "fields": FIELD_NAMES, "nursingStarters": {"qualification": NURSING, "records": starters},
            "records": records}


def write_release(release, output):
    retrieved = release["metadata"].pop("retrievedAt", None)
    content = json.dumps(release, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
    release["metadata"]["releaseId"] = digest
    if output.is_file():
        previous = json.loads(output.read_text(encoding="utf-8"))
        previous["metadata"].pop("retrievedAt", None)
        if previous == release:
            print(f"Same verified release {digest[:12]}.")
            return
    release["metadata"]["retrievedAt"] = retrieved or datetime.now(timezone.utc).date().isoformat()
    output.parent.mkdir(parents=True, exist_ok=True)
    # Compact, one line per aggregate so source corrections produce local diffs.
    header = {key: value for key, value in release.items() if key != "records"}
    doc = json.dumps(header, ensure_ascii=False, indent=2)[:-2] + ',\n  "records": [\n'
    doc += ",\n".join("    " + json.dumps(row, ensure_ascii=False) for row in release["records"])
    doc += "\n  ]\n}\n"
    with NamedTemporaryFile(mode="w", encoding="utf-8", dir=output.parent,
                            delete=False, newline="\n") as temp:
        temp.write(doc)
    Path(temp.name).replace(output)
    print(f"Wrote {len(release['records'])} aggregates, release {digest[:12]}.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from-api", action="store_true",
                        help="Run the standalone public-source check instead of reading local PostgreSQL.")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    if args.from_api:
        release = build()
    else:
        from degree_store import connect, snapshot
        with connect() as connection:
            release = snapshot(connection)
    write_release(release, args.output)


if __name__ == "__main__":
    main()
