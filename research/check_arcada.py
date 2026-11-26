"""Reproduce the 2024 Arcada comparison from two independent publications."""

import csv
import io
import json
from collections import Counter
from urllib.request import Request, urlopen

from probe import get


def main():
    resource = "/opiskelijat_ja_tutkinnot/data"
    filters = "koodiKorkeakoulu=='02535';tilastovuosi==2024;aineistotyyppi=='Lopullinen'"
    count = get(resource + "/count", filter=filters)
    if not 0 < count <= 500:
        raise ValueError(f"Expected a small, nonempty final release, got {count} rows")
    records = get(resource, filter=filters, limit=count)
    if len(records) != count:
        raise ValueError("Incomplete filtered response")
    degrees = Counter()
    for row in records:
        if (row["koodiKorkeakoulu"], str(row["tilastovuosi"]), row["aineistotyyppi"]) != (
                "02535", "2024", "Lopullinen"):
            raise ValueError("Unexpected institution, year or release type")
        degrees[row["koulutusasteTaso2"]] += row["tutkinnot"]
    print("Vipunen final rows:", count, "degrees by level:", dict(degrees))
    students = sum(row["opiskelijat"] for row in records)
    print("Vipunen sum of opiskelijat:", students)

    table = "https://pxdata.stat.fi/PxWeb/api/v1/en/StatFin/opiskt/13k9.px"
    dimensions = {"timeperiod_y": ["2024"], "amk_1_20210101": ["02535"],
                  "contentscode": ["opp_amk", "tutk_amk"]}
    query = [{"code": key, "selection": {"filter": "item", "values": values}}
             for key, values in dimensions.items()]
    body = json.dumps({"query": query, "response": {"format": "csv"}}).encode()
    request = Request(table, data=body, headers={"Content-Type": "application/json"})
    with urlopen(request, timeout=40) as response:
        cells = list(csv.DictReader(io.StringIO(response.read().decode("utf-8-sig"))))
    cell, = cells
    print("StatFin:", cell)
    expected = {"Ammattikorkeakoulututkinto": 478, "Ylempi ammattikorkeakoulututkinto": 84}
    if degrees != expected or int(cell["Qualifications and degrees, total"]) != sum(degrees.values()):
        raise ValueError("Degree figures differ from the cited 2024 annual review or StatFin")
    if students != int(cell["Students, total"]):
        raise ValueError("Investigate the changed student totals before using either definition")


if __name__ == "__main__":
    main()
