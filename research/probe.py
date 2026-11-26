"""Inspect public Vipunen metadata and bounded samples. Uses Python 3.10+."""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE = "https://api.vipunen.fi/api/resources"
DATASETS = """
korkeakoulutus_hakeneet_ja_paikan_vastaanottaneet opiskelijat_ja_tutkinnot
tavoiteajassa_tutkinnon_suorittaneet suorittanut55 amk_opintopisteet
amk_opintopisteet_kuukausi yo_opintopisteet yo_opintopisteet_kuukausi
korkeakoulutus_kv_liikkuvuus amk_talous amk_talous2 yo_talous yo_talous2
avoin_amk avoin_yliopisto yamk_tutkinnot koulutusluokitus henkilosto
suoritteet erilliset_opinto_oikeudet julkaisut opinnaytetyot
taydennyskoulutukset toimitilat toimipisteet alayksikkokoodisto
muu_henkilosto_amk koulutuksenkustannukset harjoittelukoulut
""".split()


def get(path="", **params):
    url = BASE + path
    if params:
        url += "?" + urlencode(params)
    request = Request(url, headers={"Accept": "application/json"})
    with urlopen(request, timeout=40) as response:
        return json.load(response)


def inspect_resource(name):
    path = "/" + name
    fields = [field["name"] for field in get(path)]
    sample = get(path + "/data", limit=1)
    record = sample[0] if sample else {}
    result = {"fields": fields, "sample_received": bool(sample)}
    for key in ("tietojoukkoPaivitettyPvm", "tietojenAjankohta"):
        if key in record:
            result[key] = record[key]
    result["rows"] = get(path + "/data/count")
    for field in ("tilastovuosi", "koulutuksenAlkamisvuosi", "vuosi",
                  "lukuvuosi", "kalenterivuosi", "varainhoitovuosi", "tilikausi",
                  "tutkinnonSuorittamisvuosi"):
        if field in fields:
            result["period_field"] = field
            for label, sign in (("first", "+"), ("last", "-")):
                edge = get(path + "/data", sort=f"({sign}{field})", limit=1)
                result[label] = edge[0][field] if edge else None
            break
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    catalog = sorted(get())
    report = {"observed_utc": datetime.now(timezone.utc).isoformat(),
              "catalog": catalog, "resources": {}}
    for name in DATASETS:
        try:
            report["resources"][name] = inspect_resource(name)
        except (OSError, ValueError, KeyError, IndexError) as error:
            report["resources"][name] = {"error": str(error)}
        print(name, flush=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n",
                           encoding="utf-8")
    return any("error" in item for item in report["resources"].values())


if __name__ == "__main__":
    raise SystemExit(main())
