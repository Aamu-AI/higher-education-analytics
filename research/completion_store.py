"""Publish the final 2025 health and welfare completion comparison."""
import argparse
import hashlib
import json
from collections import Counter
from datetime import date, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile

from psycopg.types.json import Jsonb

from build_dashboard import RESOURCE as AWARDS_RESOURCE
from check_arcada import ARCADA, BACHELOR, HEALTH, REPORT, vipunen
from degree_store import ROOT, connect, lock

RESOURCE = "tavoiteajassa_tutkinnon_suorittaneet"
YEAR = 2025
FILTER = (f"koodiSektori=='4';tilastovuosi=={YEAR};aineistotyyppi=='Lopullinen';"
          f"koulutusasteTaso2=='{BACHELOR}';okmOhjauksenAla=='{HEALTH}'")
BANDS = ("tavoiteajassa", "tavoiteaikaYlitettyKorkeintaan12Kk", "tavoiteaikaYlitettyYli12Kk")
FUNDING = {"Perusrahoitus", "Lukuvuosimaksu", "TE-rahoitus", "Tilauskoulutus"}
KEY_FIELDS = ("koodiKorkeakoulu", "koodiKoulutus", "kuukausi", "koulutustyyppi",
              "koulutuskieli", "rahoituslahde", "onAiempiKorkeakoulututkinto",
              "tutkintopisteluokka")


def summarize(rows):
    stamp, = {date.fromisoformat(r["tietojoukkoPaivitettyPvm"]) for r in rows}
    observed_on, = {date.fromisoformat(r["tietojenAjankohta"]) for r in rows}
    groups = {}
    keys = set()
    for row in rows:
        scope = tuple(row[k] for k in ("koodiSektori", "tilastovuosi", "aineistotyyppi",
                                      "koulutusasteTaso2", "okmOhjauksenAla"))
        if scope != ("4", YEAR, "Lopullinen", BACHELOR, HEALTH) or row["rahoituslahde"] not in FUNDING:
            raise ValueError(f"Unexpected completion scope or funding source: {scope}, {row['rahoituslahde']}")
        key = tuple(row[k] for k in KEY_FIELDS)
        if key in keys:
            raise ValueError(f"Duplicate completion source row: {key}")
        keys.add(key)
        counts = tuple(row[k] for k in (*BANDS, "tutkinnot"))
        if any(type(n) is not int or n < 0 for n in counts) or sum(counts[:3]) != counts[3]:
            raise ValueError(f"Invalid counts for completion row: {key}")
        if row["rahoituslahde"] == "Tilauskoulutus":
            continue
        group = (key[0], key[1])
        if any(not isinstance(code, str) or not code for code in group):
            raise ValueError(f"Invalid institution or qualification code: {group}")
        label, totals = groups.setdefault(group, (row["koulutus"], Counter()))
        if not label or label != row["koulutus"]:
            raise ValueError(f"Inconsistent qualification label: {group}")
        totals.update(dict(zip(BANDS, counts[:3], strict=True)))
    records = [(*key, label, *(counts[band] for band in BANDS))
               for key, (label, counts) in sorted(groups.items())]
    return records, stamp, observed_on


def publish(connection, fetch=vipunen):
    with connection.transaction():
        lock(connection)
        awards_release = connection.execute("""
            SELECT r.id, r.institution_labels, r.content_sha256 FROM awards.current_release c
            JOIN awards.release r ON r.id=c.release_id
            WHERE c.resource=%s AND c.year=%s AND r.release_type='Lopullinen'
        """, (AWARDS_RESOURCE, YEAR)).fetchone()
        if awards_release is None:
            raise ValueError("Import the final degree awards before publishing completion time")
        awards_id, names, awards_digest = awards_release
        rows = fetch(RESOURCE, FILTER)
        records, stamp, observed_on = summarize(rows)
        institution_totals = Counter()
        for institution, _, _, *counts in records:
            institution_totals[institution] += sum(counts)
        expected = dict(connection.execute("""
            SELECT institution, sum(included_degrees) FROM awards.release_degrees
            WHERE release_id=%s AND level='bachelor' AND field=%s GROUP BY institution
        """, (awards_id, HEALTH)))
        if +institution_totals != {code: n for code, n in expected.items() if n > 0}:
            differing = sorted(code for code in institution_totals.keys() | expected.keys()
                               if institution_totals[code] != expected.get(code, 0))
            raise ValueError(f"Completion counts disagree with final awards for: {differing}")
        if institution_totals[ARCADA] != REPORT[YEAR][1][1]:
            raise ValueError("Arcada health and welfare awards disagree with annual report Table 2")
        digest = hashlib.sha256(json.dumps([records, len(rows), observed_on.isoformat(), awards_digest],
                                           ensure_ascii=False).encode()).hexdigest()
        prior = connection.execute("""
            SELECT r.id, r.content_sha256, t.awards_release_id FROM awards.current_release c
            JOIN awards.release r ON r.id=c.release_id
            JOIN awards.completion_release t ON t.release_id=r.id
            WHERE c.resource=%s AND c.year=%s
        """, (RESOURCE, YEAR)).fetchone()
        if prior and prior[1:] == (digest, awards_id):
            return prior[0]
        release_id, = connection.execute("""
            INSERT INTO awards.release
                (resource,year,release_type,previous_id,content_sha256,source_stamp,source_filter,
                 source_rows,institutions,institution_labels)
            VALUES (%s,%s,'Lopullinen',%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (RESOURCE, YEAR, prior[0] if prior else None, digest, stamp, FILTER,
              len(rows), sorted(+institution_totals), Jsonb(names))).fetchone()
        connection.execute("INSERT INTO awards.completion_release VALUES (%s,%s,%s)",
                           (release_id, awards_id, observed_on))
        with connection.cursor() as cursor:
            cursor.executemany("INSERT INTO awards.completion_time VALUES (%s,%s,%s,%s,%s,%s,%s)",
                               [(release_id, *row) for row in records])
        connection.execute("""
            INSERT INTO awards.current_release VALUES (%s,%s,%s)
            ON CONFLICT (resource,year) DO UPDATE SET release_id=excluded.release_id
        """, (RESOURCE, YEAR, release_id))
        return release_id


def snapshot(connection, release_id):
    digest, stamp, retrieved, observed, source_rows, institutions, awards_digest = connection.execute("""
        SELECT r.content_sha256,r.source_stamp,r.retrieved_at,c.observed_on,r.source_rows,
               r.institutions,a.content_sha256
        FROM awards.completion_release c JOIN awards.release r ON r.id=c.release_id
        JOIN awards.release a ON a.id=c.awards_release_id WHERE c.release_id=%s
    """, (release_id,)).fetchone()
    records = connection.execute("""
        SELECT institution,qualification,label,on_time,within_year,later
        FROM awards.completion_time WHERE release_id=%s ORDER BY institution,qualification
    """, (release_id,)).fetchall()
    return {"year": YEAR, "field": HEALTH, "resource": RESOURCE, "releaseType": "Lopullinen",
            "releaseId": digest, "awardsInputHash": awards_digest, "sourceRows": source_rows,
            "sourceStamp": stamp.isoformat(), "observedOn": observed.isoformat(),
            "retrievedAt": retrieved.astimezone(timezone.utc).date().isoformat(),
            "sectorInstitutions": institutions,
            "records": [dict(zip(("institution", "qualification", "label", "onTime", "withinYear", "later"),
                                 row, strict=True)) for row in records]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "data" / "completion.json")
    args = parser.parse_args()
    with connect() as connection:
        release_id = publish(connection)
        release = snapshot(connection, release_id)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n",
                            dir=args.output.parent, delete=False) as temp:
        json.dump(release, temp, ensure_ascii=False, indent=2)
        temp.write("\n")
    Path(temp.name).replace(args.output)
    print(f"Published completion release {release['releaseId'][:12]}")


if __name__ == "__main__":
    main()
