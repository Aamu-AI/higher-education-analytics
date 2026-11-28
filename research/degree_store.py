"""Migrate, refresh and export the local degree database. Use libpq PG* settings."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
from datetime import timezone
from tempfile import NamedTemporaryFile

import psycopg
from psycopg.types.json import Jsonb

from build_dashboard import (
    RESOURCE, SOURCE_KEY, YEARS, assemble, institution_names, summarize,
)
from check_arcada import (
    ARCADA, BACHELOR, COMMISSIONED, LAUREA, NURSING, REPORT, REPORT_MINUS_VIPUNEN,
    check_arcada, check_sector, historical_totals, statfin, vipunen,
)

LOCK = 384690152091
ROOT = Path(__file__).resolve().parents[1]
ALL = "degrees, all funding sources (national statistics definition)"
INCLUDED = "degrees excluding commissioned education (Arcada reporting definition)"


def connect():
    # Uses standard libpq options such as PGHOST, PGDATABASE and PGSERVICE.
    return psycopg.connect(autocommit=True)


def lock(connection):
    connection.execute("SELECT pg_advisory_xact_lock(%s)", (LOCK,))


def migrate(connection):
    with connection.transaction():
        lock(connection)
        connection.execute("""CREATE TABLE IF NOT EXISTS public.awards_migrations
                              (name text PRIMARY KEY, sha256 text NOT NULL)""")
        for path in sorted((ROOT / "db" / "migrations").glob("*.sql")):
            sql = path.read_text(encoding="utf-8")
            checksum = hashlib.sha256(sql.encode()).hexdigest()
            prior = connection.execute(
                "SELECT sha256 FROM public.awards_migrations WHERE name=%s", (path.name,)
            ).fetchone()
            if prior:
                if prior[0] != checksum:
                    raise ValueError(f"Already-applied migration changed: {path.name}")
                continue
            connection.execute(sql)
            connection.execute("INSERT INTO public.awards_migrations VALUES (%s,%s)",
                               (path.name, checksum))


def reconciliations(year, rows):
    read, members = statfin(year)
    if year < 2023:
        counts = historical_totals(rows, read)
        return [(code, ALL, "both", "Vipunen", "StatFin 13k9", count, read(code), 0, "matched")
                for code, count in counts.items()]
    check_arcada(year, rows, read)
    arcada = [r for r in rows if r["koodiKorkeakoulu"] == ARCADA]
    local = sum(r["tutkinnot"] for r in arcada
                if r["rahoituslahde"] != COMMISSIONED and r["koulutusasteTaso2"] == BACHELOR)
    report = REPORT[year][2][0]
    gap = REPORT_MINUS_VIPUNEN[year]
    items = [(ARCADA, INCLUDED, "bachelor", "Arcada annual report", "Vipunen", report,
              local, gap, "unexplained" if gap else "matched"),
             (ARCADA, ALL, "both", "Vipunen", "StatFin 13k9",
              sum(r["tutkinnot"] for r in arcada), read(ARCADA), 0, "matched")]
    if year == 2024:
        check_sector(rows, read, members)
        laurea = sum(r["tutkinnot"] for r in rows
                     if r["koodiKorkeakoulu"] == LAUREA and r["koulutusasteTaso2"] == BACHELOR)
        items.append((LAUREA, ALL, "bachelor", "Vipunen", "StatFin 13k9", laurea,
                      read(LAUREA, "1") + read(LAUREA, "2"), 1, "unexplained"))
    return items


def normalized(rows):
    stamps = {row["tietojoukkoPaivitettyPvm"] for row in rows}
    if len(stamps) != 1:
        raise ValueError("Expected a single publisher update date")
    keyed = [(tuple(row[field] for field in SOURCE_KEY),
              {key: val for key, val in row.items() if key != "tietojoukkoPaivitettyPvm"})
             for row in rows]
    # Canonical JSON keeps null distinct from an empty string in source dimensions.
    keyed.sort(key=lambda item: json.dumps(item[0], ensure_ascii=False))
    serialized = json.dumps(keyed, ensure_ascii=False, sort_keys=True,
                            separators=(",", ":"), allow_nan=False)
    return keyed, stamps.pop(), hashlib.sha256(serialized.encode()).hexdigest()


def record_changes(connection, release_id, previous):
    connection.execute("""
        WITH before AS (SELECT * FROM awards.source_row WHERE release_id = %s),
             after AS (SELECT * FROM awards.source_row WHERE release_id = %s),
             paired AS (
                SELECT coalesce(a.source_key,b.source_key) AS source_key,
                       b.payload AS old_row, a.payload AS new_row
                FROM before b FULL JOIN after a USING (source_key)
                WHERE b.payload IS DISTINCT FROM a.payload
             )
        INSERT INTO awards.change
        SELECT %s::bigint, source_key, '*',
               CASE WHEN old_row IS NULL THEN 'add' ELSE 'remove' END, old_row, new_row
        FROM paired WHERE old_row IS NULL OR new_row IS NULL
        UNION ALL
        SELECT %s::bigint, p.source_key, f.key, 'change', p.old_row->f.key, p.new_row->f.key
        FROM paired p CROSS JOIN LATERAL jsonb_object_keys(p.old_row || p.new_row) f(key)
        WHERE p.old_row IS NOT NULL AND p.new_row IS NOT NULL
          AND (p.old_row->f.key) IS DISTINCT FROM (p.new_row->f.key)
    """, (previous, release_id, release_id, release_id))


def import_slice(connection, year, release_type, fetch=vipunen, labels=institution_names,
                 reconcile=reconciliations):
    source_filter = f"koodiSektori=='4';aineistotyyppi=='{release_type}';tilastovuosi=={year}"
    with connection.transaction():
        lock(connection)
        prior = connection.execute("""
            SELECT r.id, r.release_type, r.content_sha256 FROM awards.current_release c
            JOIN awards.release r ON r.id=c.release_id WHERE c.resource=%s AND c.year=%s
        """, (RESOURCE, year)).fetchone()
        if prior and prior[1] == "Lopullinen" and release_type != "Lopullinen":
            raise ValueError("A preliminary slice cannot replace a final release")
        rows = fetch(RESOURCE, source_filter)
        if not 0 < len(rows) <= 10000:
            raise ValueError(f"Invalid source row count: {len(rows)}")
        summarize(year, rows, release_type)
        keyed, stamp, digest = normalized(rows)
        checks = reconcile(year, rows) if release_type == "Lopullinen" else []
        if prior and (release_type, digest) == prior[1:]:
            return prior[0]
        names = labels()
        codes = sorted({r["koodiKorkeakoulu"] for r in rows})
        if set(names) != set(codes):
            raise ValueError("Incomplete institution labels for the source population")
        previous = prior[0] if prior else None
        release_id, = connection.execute("""
            INSERT INTO awards.release
            (resource,year,release_type,previous_id,content_sha256,source_stamp,source_filter,
             source_rows,institutions,institution_labels)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (RESOURCE, year, release_type, previous, digest, stamp, source_filter,
              len(rows), codes, Jsonb(names))).fetchone()
        with connection.cursor() as cursor:
            with cursor.copy("COPY awards.source_row (release_id,source_key,payload) FROM STDIN") as copy:
                for key, payload in keyed:
                    copy.write_row((release_id, Jsonb(key), Jsonb(payload)))
            cursor.executemany("INSERT INTO awards.reconciliation VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                               [(release_id, *row) for row in checks])
        record_changes(connection, release_id, previous)
        connection.execute("""
            INSERT INTO awards.current_release VALUES (%s,%s,%s)
            ON CONFLICT (resource, year) DO UPDATE SET release_id=excluded.release_id
        """, (RESOURCE, year, release_id))
        return release_id


def snapshot(connection):
    # Both the manifest and result set must refer to the same three immutable releases.
    manifest = connection.execute("""
        SELECT r.id,r.year,r.source_stamp,r.source_rows,r.institution_labels,r.retrieved_at
        FROM awards.current_release c JOIN awards.release r ON r.id=c.release_id
        WHERE r.resource=%s AND r.year=ANY(%s) AND r.release_type='Lopullinen' ORDER BY r.year
    """, (RESOURCE, list(YEARS))).fetchall()
    if [r[1] for r in manifest] != list(YEARS):
        raise ValueError("Import all requested final years before building the dashboard")
    records = []
    for year, institution, level, field, all_count, included in connection.execute("""
        SELECT year,institution,level,field,sum(all_degrees),sum(included_degrees)
        FROM awards.release_degrees WHERE release_id=ANY(%s)
        GROUP BY year,institution,level,field
        ORDER BY year,institution COLLATE "C",level COLLATE "C",field COLLATE "C"
    """, ([r[0] for r in manifest],)):
        records.append({"year": year, "institution": institution, "level": level, "field": field,
                        "all": all_count, "included": included})
    starters = [{"year": year, "institution": institution, "count": count}
                for year, institution, count in connection.execute("""
        SELECT r.year, p.payload->>'koodiKorkeakoulu' AS institution,
               sum(CASE WHEN p.payload->>'rahoituslahde' <> %s
                        THEN (p.payload->>'uudetOpiskelijat')::int ELSE 0 END)
        FROM awards.source_row p JOIN awards.release r ON r.id = p.release_id
        WHERE r.id=ANY(%s) AND p.payload->>'koodiKoulutus'=%s
          AND p.payload->>'uudetOpiskelijat' IS NOT NULL
        GROUP BY 1, 2 ORDER BY 1, 2
    """, (COMMISSIONED, [r[0] for r in manifest], NURSING))]
    release = assemble(records, max(r[2] for r in manifest).isoformat(),
                       {str(r[1]): r[3] for r in manifest}, manifest[-1][4], starters)
    # Unchanged years retain their original release across later source corrections.
    if len({r[2] for r in manifest}) > 1:
        release["metadata"]["sourceStamps"] = {str(r[1]): r[2].isoformat() for r in manifest}
    release["metadata"]["retrievedAt"] = max(r[5] for r in manifest).astimezone(timezone.utc).date().isoformat()
    return release


def export_csv(connection, output):
    header = ("definition", "unit", "year", "institution", "qualification", "level", "field",
              "count", "disclosure", "release_id", "source_hash", "source_stamp", "retrieved_at",
              "constituent_institutions", "attribution", "licence", "source_url", "transformation")
    result = connection.execute("""
        SELECT def.label, 'degrees', d.year,d.institution,d.qualification,d.level,d.field,def.n,
               'observed',r.id,r.content_sha256,r.source_stamp,r.retrieved_at,
               array_to_string(r.institutions,' '),
               'Vipunen – Education Statistics Finland, opiskelijat_ja_tutkinnot, VIRTA',
               'https://creativecommons.org/licenses/by/4.0/',
               'https://api.vipunen.fi/api/resources/opiskelijat_ja_tutkinnot',
               'Final UAS source counts summed by qualification, level and policy field under the named funding rule.'
        FROM awards.current_final_degrees d JOIN awards.release r ON r.id=d.release_id
        CROSS JOIN LATERAL (VALUES (%s::text,d.all_degrees),(%s::text,d.included_degrees)) def(label,n)
        ORDER BY d.year,d.institution,d.qualification,d.level,d.field,def.label
    """, (ALL, INCLUDED))
    first = result.fetchone()
    if first is None:
        raise ValueError("No final releases available for export")
    output.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(mode="w", newline="", encoding="utf-8", dir=output.parent,
                            delete=False) as temp:
        writer = csv.writer(temp)
        writer.writerow(header)
        writer.writerow(first)
        writer.writerows(result)
    Path(temp.name).replace(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("migrate")
    commands.add_parser("import", help="Validate and import all requested final UAS years.")
    export = commands.add_parser("export")
    export.add_argument("output", type=Path)
    args = parser.parse_args()
    with connect() as connection:
        if args.command == "migrate":
            migrate(connection)
        elif args.command == "import":
            for year in YEARS:
                release_id = import_slice(connection, year, "Lopullinen")
                print(f"{year}: final release {release_id}")
        else:
            export_csv(connection, args.output)


if __name__ == "__main__":
    main()
