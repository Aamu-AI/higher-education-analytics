"""Exercise migrations and release transitions on a fresh disposable PostgreSQL database."""
import csv
import json
import tempfile
import threading
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import psycopg
from psycopg import sql

import degree_store as store
import completion_store as completion
from build_dashboard import write_release
from check_arcada import ARCADA, BACHELOR, COMMISSIONED, HEALTH, VIPUNEN_MEMBERS


def fixture(year, release_type="Lopullinen"):
    return [
        {"tilastovuosi": str(year), "koodiSektori": "4", "aineistotyyppi": release_type,
         "koodiKorkeakoulu": code, "koodiKoulutus": "001002", "sukupuoli": "mies",
         "rahoituslahde": "Perusrahoitus", "kirjoillaoloTammi": "A",
         "kirjoillaoloSyys": "A", "koulutuksenMaakunta": "Uusimaa",
         "koulutusasteTaso2": BACHELOR, "okmOhjauksenAla": "Tekniikan alat",
         "tietojoukkoPaivitettyPvm": "2026-09-28", "tutkinnot": 3}
        for code in sorted(VIPUNEN_MEMBERS)
    ]


def ingest(connection, year, rows, release_type="Lopullinen"):
    return store.import_slice(connection, year, release_type, fetch=lambda *args: rows,
                              labels=lambda: {code: code for code in VIPUNEN_MEMBERS},
                              reconcile=lambda *_: [])


class StoreTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.admin = store.connect()
        cls.dbname = "degree_test_" + uuid.uuid4().hex
        cls.admin.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(cls.dbname)))
        cls.con = psycopg.connect(dbname=cls.dbname, autocommit=True)
        store.migrate(cls.con)
        store.migrate(cls.con)

    @classmethod
    def tearDownClass(cls):
        cls.con.close()
        cls.admin.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(cls.dbname)))
        cls.admin.close()

    def test_completion_release_reconciles_and_keeps_previous_version(self):
        year = completion.YEAR
        awards = fixture(year)
        for row in awards:
            row.update(okmOhjauksenAla=HEALTH, tutkinnot=205 if row["koodiKorkeakoulu"] == ARCADA else 3)
        rows = [dict(row, tilastovuosi=year, koulutus="Test degree", kuukausi=3,
                     koulutustyyppi="Test", koulutuskieli="fi", onAiempiKorkeakoulututkinto=0,
                     tutkintopisteluokka=1.0, tietojenAjankohta="2026-03-23",
                     tavoiteajassa=row["tutkinnot"] - 1, tavoiteaikaYlitettyKorkeintaan12Kk=1,
                     tavoiteaikaYlitettyYli12Kk=0) for row in awards]
        with self.con.transaction(force_rollback=True):
            awards_id = ingest(self.con, year, awards)
            release = completion.publish(self.con, fetch=lambda *_: rows)
            self.assertEqual(completion.publish(self.con, fetch=lambda *_: rows[::-1]), release)
            first = completion.snapshot(self.con, release)
            self.assertEqual(first["records"][0]["qualification"], "001002")
            self.assertEqual(first["sourceRows"], len(rows))
            self.assertTrue(first["awardsInputHash"])

            corrected = [dict(rows[0], tavoiteajassa=1, tavoiteaikaYlitettyKorkeintaan12Kk=2), *rows[1:]]
            updated = completion.publish(self.con, fetch=lambda *_: corrected)
            self.assertNotEqual(updated, release)
            self.assertEqual(completion.snapshot(self.con, release), first)
            invalid = [dict(rows[0], tutkinnot=4, tavoiteajassa=3), *rows[1:]]
            with self.assertRaisesRegex(ValueError, "disagree with final awards"):
                completion.publish(self.con, fetch=lambda *_: invalid)
            self.assertEqual(dict(self.con.execute("""
                SELECT resource,release_id FROM awards.current_release WHERE year=%s
            """, (year,))), {store.RESOURCE: awards_id, completion.RESOURCE: updated})

    def test_reruns_corrections_deletions_and_rollback(self):
        year = 2030
        rows = fixture(year)
        rows.append(dict(rows[0], koodiKoulutus="002003", tutkinnot=9))
        original = ingest(self.con, year, rows)
        rows.reverse()
        for row in rows:
            row["tietojoukkoPaivitettyPvm"] = "2026-10-01"
        self.assertEqual(ingest(self.con, year, rows), original)
        rows.pop(0)
        rows[0]["tutkinnot"] = 7
        with patch.object(store, "record_changes", side_effect=RuntimeError("transaction interrupted")):
            with self.assertRaisesRegex(RuntimeError, "interrupted"):
                ingest(self.con, year, rows)
        self.assertEqual(self.con.execute(
            "SELECT release_id FROM awards.current_release WHERE year=%s", (year,)
        ).fetchone()[0], original)
        self.assertEqual(self.con.execute("SELECT count(*) FROM awards.release WHERE year=%s",
                                          (year,)).fetchone()[0], 1)
        new = ingest(self.con, year, rows)
        self.assertNotEqual(new, original)
        self.assertEqual(self.con.execute("""
            SELECT field_name,old_value,new_value FROM awards.change
            WHERE release_id=%s AND action='change'
        """, (new,)).fetchall(), [("tutkinnot", 3, 7)])
        self.assertEqual(self.con.execute("""
            SELECT old_value->>'koodiKoulutus',new_value FROM awards.change
            WHERE release_id=%s AND action='remove'
        """, (new,)).fetchall(), [("002003", None)])
        self.assertEqual(self.con.execute("""
            SELECT release_id FROM awards.release_degrees WHERE qualification='002003' AND year=%s
        """, (year,)).fetchall(), [(original,)])
        self.assertEqual(self.con.execute("""
            SELECT count(*) FROM awards.current_final_degrees WHERE qualification='002003' AND year=%s
        """, (year,)).fetchone()[0], 0)

    def test_bounded_source_validation(self):
        year = 2031
        rows = fixture(year)
        for change in ({"rahoituslahde": "Tilauskoulutus"}, {"rahoituslahde": "Lukuvuosimaksu"},
                       {"koodiSektori": "1"}, {"tilastovuosi": "1999"}, {"tutkinnot": None}):
            with self.subTest(change=change), self.assertRaises(ValueError):
                ingest(self.con, year, [dict(rows[0], **change)] + rows[1:])
        with self.assertRaisesRegex(ValueError, "duplicate"):
            ingest(self.con, year, rows + [rows[0]])
        for count in (0, 10001, len(rows) + 1):
            with patch("check_arcada.get", side_effect=[count, rows]), self.assertRaises(ValueError):
                store.import_slice(self.con, year, "Lopullinen")
        self.assertEqual(self.con.execute("SELECT count(*) FROM awards.release WHERE year=%s",
                                          (year,)).fetchone()[0], 0)

    def test_preliminary_final_and_csv(self):
        year = 2032
        preliminary = ingest(self.con, year, fixture(year, "Ennakko"), "Ennakko")
        self.assertEqual(self.con.execute("""
            SELECT count(*) FROM awards.current_final_degrees WHERE year=%s
        """, (year,)).fetchone()[0], 0)
        rows = fixture(year)
        rows.append(dict(rows[0], rahoituslahde=COMMISSIONED, tutkinnot=5))
        rows[1]["tutkinnot"] = 0
        final = ingest(self.con, year, rows)
        self.assertNotEqual(final, preliminary)
        with self.assertRaisesRegex(ValueError, "preliminary"):
            ingest(self.con, year, fixture(year, "Ennakko"), "Ennakko")
        code = rows[0]["koodiKorkeakoulu"]
        with tempfile.TemporaryDirectory() as dest:
            path = Path(dest) / "degrees.csv"
            store.export_csv(self.con, path)
            with path.open(encoding="utf-8", newline="") as f:
                cells = [c for c in csv.DictReader(f) if int(c["year"]) == year]
        self.assertEqual({c["release_id"] for c in cells}, {str(final)})
        self.assertEqual({c["definition"]: int(c["count"]) for c in cells if c["institution"] == code},
                         {store.ALL: 8, store.INCLUDED: 3})
        self.assertTrue(all(c["source_stamp"] == "2026-09-28" and c["licence"] and
                            c["retrieved_at"] and c["disclosure"] == "observed" for c in cells))
        for view, definition in [("degrees_all_funding", store.ALL),
                                 ("degrees_excluding_commissioned", store.INCLUDED)]:
            recorded = self.con.execute(sql.SQL("""
                SELECT institution,degrees FROM awards.{} WHERE year=%s ORDER BY institution
            """).format(sql.Identifier(view)), (year,)).fetchall()
            self.assertEqual(recorded, sorted((c["institution"], int(c["count"]))
                                              for c in cells if c["definition"] == definition))

    def test_concurrent_imports_serialize(self):
        year = 2033
        rows = fixture(year)
        with ThreadPoolExecutor(max_workers=2) as pool:
            start = threading.Barrier(2)

            def import_once():
                with psycopg.connect(dbname=self.dbname, autocommit=True) as connection:
                    start.wait(timeout=10)
                    return ingest(connection, year, rows)

            first, second = [pool.submit(import_once) for _ in range(2)]
            self.assertEqual(first.result(timeout=30), second.result(timeout=30))
        self.assertEqual(self.con.execute("SELECT count(*) FROM awards.release WHERE year=%s",
                                          (year,)).fetchone()[0], 1)

    def test_one_year_correction_preserves_other_releases_and_dates(self):
        def with_starters(year):
            rows = fixture(year)
            if year == 2025:
                row = next(row for row in rows if row["koodiKorkeakoulu"] == ARCADA)
                row.update(koodiKoulutus=store.NURSING, uudetOpiskelijat=7)
                rows.append(dict(row, rahoituslahde=COMMISSIONED, uudetOpiskelijat=9))
            return rows

        prior = {year: ingest(self.con, year, with_starters(year)) for year in store.YEARS}
        self.con.execute("UPDATE awards.release SET retrieved_at='2026-09-29 12:00:00+00' WHERE id=ANY(%s)",
                         (list(prior.values()),))
        current = {}
        for year in store.YEARS:
            rows = with_starters(year)
            for row in rows:
                row["tietojoukkoPaivitettyPvm"] = "2026-10-01"
            if year == 2024:
                rows[0]["tutkinnot"] += 1
            current[year] = ingest(self.con, year, rows)
        self.assertEqual([y for y in prior if current[y] != prior[y]], [2024])
        self.con.execute("UPDATE awards.release SET retrieved_at='2026-10-03 01:00:00+00' WHERE id=%s",
                         (current[2024],))
        with tempfile.TemporaryDirectory() as dest:
            path = Path(dest) / "degrees.json"
            write_release(store.snapshot(self.con), path)
            result = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(result["metadata"]["retrievedAt"], "2026-10-03")
            self.assertEqual(result["metadata"]["sourceStamp"], "2026-10-01")
            self.assertEqual(result["metadata"]["sourceStamps"], {
                "2023": "2026-09-28", "2024": "2026-10-01", "2025": "2026-09-28"})
            self.assertEqual(result["nursingStarters"], {"qualification": store.NURSING,
                "records": [{"year": 2025, "institution": ARCADA, "count": 7}]})
            path_csv = Path(dest) / "degrees.csv"
            store.export_csv(self.con, path_csv)
            with path_csv.open(encoding="utf-8", newline="") as f:
                cells = [c for c in csv.DictReader(f) if int(c["year"]) in prior]
            for cell in cells:
                year = int(cell["year"])
                self.assertEqual(int(cell["release_id"]), current[year])
                self.assertEqual(cell["source_stamp"], result["metadata"]["sourceStamps"][str(year)])
                retrieved = datetime.fromisoformat(cell["retrieved_at"]).astimezone(timezone.utc).date()
                self.assertEqual(retrieved.isoformat(), "2026-10-03" if year == 2024 else "2026-09-29")


if __name__ == "__main__":
    unittest.main()
