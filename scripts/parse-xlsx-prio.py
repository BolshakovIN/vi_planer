#!/usr/bin/env python3
"""Parse «Приоритизация доп. проектов» xlsx → JSON for seed.ts."""
from __future__ import annotations

import json
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import OrderedDict
from pathlib import Path

XLSX = Path("/Users/ivanbolsakov/Downloads/Приоритизация доп. проектов .xlsx")
OUT = Path("/Users/ivanbolsakov/vi_planer/scripts/xlsx-prio.json")
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

SIZE_MAP = {
    "XXS": "XS",
    "XS": "XS",
    "S": "S",
    "M": "M",
    "L": "L",
    "XL": "XL",
    "XXL": "XXL",
    "XXXL": "XXL",
}
SIZE_RE = r"(XXXL|XXL|XL|XS|XXS|S|M|L)"
RANK = {"XS": 0, "S": 1, "M": 2, "L": 3, "XL": 4, "XXL": 5}

ROLE_ALIASES = [
    ("прод. проработка", "прод. проработка"),
    ("продуктовая проработка", "прод. проработка"),
    ("системный аналитик", "системный аналитик"),
    ("разработка", "разработка"),
    ("разраб.", "разработка"),
    ("разраб", "разработка"),
    ("аналитика", "аналитика"),
    ("архитектура", "архитектура"),
    ("оплаты", "оплаты"),
    ("документы", "документы"),
    ("frontend", "frontend"),
    ("backend", "backend"),
]

ABBREV_ROLE = {
    "FE": "frontend",
    "BE": "backend",
    "SA": "системный аналитик",
    "CA": "системный аналитик",
    "СА": "системный аналитик",
}

TEAM_MAP = {
    "do": "Data-office",
    "data-office": "Data-office",
    "?": "TBD",
    "dwh": "DWH",
    "crm (touch)": "CRM Touch",
    "сайт лк/b2b": "Сайт ЛК/B2B",
    "сайт лк": "Сайт ЛК",
    "сайт выбор": "Сайт Выбор",
    "сайт выбор и навигация": "Сайт Выбор и навигация",
    "сайт оформление": "Сайт Оформление",
    "oms/arm": "OMS/ARM",
    "oms": "OMS",
    "кб": "КБ",
    "фд": "ФД",
    "1с": "1С",
    "1c": "1С",
    "crm": "CRM",
    "сайт": "Сайт",
    "аналитика": "Аналитика",
    "цо": "ЦО",
    "товарный каталог": "Товарный каталог",
}


def load_sheet(path: Path) -> dict[int, dict[str, str]]:
    with zipfile.ZipFile(path) as z:
        ss: list[str] = []
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall("m:si", NS):
            texts = [t.text or "" for t in si.findall(".//m:t", NS)]
            ss.append("".join(texts))
        sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
        rows: dict[int, dict[str, str]] = {}
        for c in sheet.findall(".//m:c", NS):
            ref = c.attrib.get("r", "")
            m = re.match(r"([A-Z]+)(\d+)", ref)
            if not m:
                continue
            col, row = m.group(1), int(m.group(2))
            t = c.attrib.get("t")
            v = c.find("m:v", NS)
            is_el = c.find("m:is", NS)
            val = ""
            if t == "s" and v is not None and v.text is not None:
                val = ss[int(v.text)]
            elif t == "inlineStr" and is_el is not None:
                val = "".join(x.text or "" for x in is_el.findall(".//m:t", NS))
            elif v is not None and v.text is not None:
                val = v.text
            rows.setdefault(row, {})[col] = val
        return rows


def cell(rows: dict, r: int, c: str) -> str:
    return (rows.get(r, {}).get(c) or "").strip()


def canon_team(raw: str) -> str:
    t = re.sub(r"\s+", " ", raw.replace("\n", " ")).strip(" ·,;")
    t = t.replace("1C", "1С")
    return TEAM_MAP.get(t.lower(), t)


def split_teams(raw: str) -> list[str]:
    if not raw.strip():
        return []
    # Keep «OMS/ARM», «Сайт ЛК/B2B» as one team; split only on newline / comma / ;
    parts = re.split(r"[\n,;]+", raw)
    out: list[str] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        name = canon_team(part)
        if name and name not in out:
            out.append(name)
    return out


def role_from_text(chunk: str) -> str | None:
    cl = chunk.lower()
    for key, role_name in ROLE_ALIASES:
        if key in cl:
            return role_name
    return None


def map_site_parent(parent: str, teams: list[str]) -> str:
    if parent != "Сайт":
        return parent
    site = next((t for t in teams if t.lower().startswith("сайт")), None)
    return site or (teams[0] if teams else "Сайт")


def parse_est_lines(est: str, teams: list[str]):
    orig = est.strip()
    notes: list[str] = []
    assigns: list[tuple[str, str, str]] = []
    text = orig.replace("–", "-").replace("—", "-")
    low = text.lower()
    unknown = text.strip() in {"?", ""} or "tbd" in low

    if "http" in low:
        notes.append(orig)
        for t in teams or ["TBD"]:
            assigns.append((t, "M", "оценка в связанной таблице"))
        return merge_assigns(assigns), notes, "ready"

    listed = teams[:]
    listed_l = {t.lower(): t for t in listed}

    def find_listed(hint: str) -> str | None:
        h = canon_team(hint).lower()
        if not h:
            return None
        if h in listed_l:
            return listed_l[h]
        for t in listed:
            tl = t.lower()
            if h in tl or tl in h:
                return t
        return None

    # Tokens: "Аналитика - M", "Разработка CRM - M", "CRM разраб. - M", "FE: XS"
    token_re = re.compile(
        rf"(?:(?:разработка|разраб\.?|аналитика|архитектура|оплаты|документы|прод\.?\s*проработка|frontend|backend)\s+)?"
        rf"(?P<team>CRM|КБ|ФД|1С|1C|DWH|OMS/?ARM|OMS|Data-office|DO|ЦО|Аналитика|Сайт(?:\s+ЛК(?:/B2B)?|\s+Выбор(?:\s+и\s+навигация)?|\s+Оформление)?|товарный каталог)?"
        rf"(?:\s+(?:разработка|разраб\.?|аналитика))?"
        rf"\s*[-:]?\s*(?P<size>{SIZE_RE})",
        re.I,
    )

    for m in token_re.finditer(text):
        sz = SIZE_MAP[m.group("size").upper()]
        chunk = m.group(0)
        team_hint = (m.group("team") or "").strip()
        matched = find_listed(team_hint) if team_hint else None
        if not matched:
            # "Аналитика - M" with team column containing Аналитика
            role = role_from_text(chunk)
            if role == "аналитика":
                matched = find_listed("Аналитика")
            elif role == "разработка":
                # "Разработка CRM" already handled via team_hint; bare "разраб - M"
                matched = None
        if matched:
            assigns.append((matched, sz, chunk.strip()))
            continue
        if team_hint:
            parent = map_site_parent(canon_team(team_hint), listed)
            role = role_from_text(chunk)
            # Role-split only if that parent is the sole listed team (or not listed)
            if role and (not listed or (len(listed) == 1 and listed[0].lower() == parent.lower())):
                assigns.append((f"{parent} · {role}", sz, chunk.strip()))
            else:
                assigns.append((parent, sz, chunk.strip()))
            continue
        if listed:
            role = role_from_text(chunk)
            if role and len(listed) == 1:
                assigns.append((f"{listed[0]} · {role}", sz, chunk.strip()))
            else:
                assigns.append((listed[0], sz, chunk.strip()))

    for m in re.finditer(rf"\b(FE|BE|SA|CA|СА)\s*[:.\-]?\s*{SIZE_RE}", text, re.I):
        role = "системный аналитик" if m.group(1).upper() in {"SA", "CA", "СА"} else ABBREV_ROLE.get(
            m.group(1).upper(), "frontend" if m.group(1).upper() == "FE" else "backend"
        )
        if m.group(1).upper() == "FE":
            role = "frontend"
        elif m.group(1).upper() == "BE":
            role = "backend"
        sz = SIZE_MAP[m.group(2).upper()]
        parent = listed[0] if listed else "TBD"
        if len(listed) <= 1:
            assigns.append((f"{parent} · {role}", sz, m.group(0)))
        else:
            assigns.append((parent, sz, m.group(0)))

    # Every team from the file column must appear
    have = {n.lower() for n, _ in merge_assigns(assigns)}
    for t in listed:
        if t.lower() not in have:
            assigns.append((t, "M", "команда из таблицы без отдельной оценки"))

    if not assigns:
        m = re.search(rf"\b{SIZE_RE}\b", text)
        if m and not unknown:
            t = listed[0] if listed else "TBD"
            assigns.append((t, SIZE_MAP[m.group(1).upper()], orig[:80]))
        else:
            for t in listed or ["TBD"]:
                assigns.append((t, "M", orig[:120] if orig else "?"))
            if unknown or orig in {"?"}:
                notes.append("Оценка в таблице: не задана / tbd")
            elif orig:
                notes.append("Оценка (исходник): " + re.sub(r"\s+", " ", orig)[:240])

    if orig and orig not in {"?", ""}:
        if len(assigns) > 1 or re.search(r"xl|xxl|xs|аналитика|разраб", orig, re.I):
            notes.append("Оценка из таблицы: " + re.sub(r"\s+", " ", orig)[:240])

    return merge_assigns(assigns), notes, "ready"


def merge_assigns(assigns: list[tuple[str, str, str]]) -> list[tuple[str, str]]:
    merged: OrderedDict[str, str] = OrderedDict()
    for name, sz, _extra in assigns:
        name = re.sub(r"\s+", " ", name).strip()
        if name in merged:
            if RANK[sz] > RANK[merged[name]]:
                merged[name] = sz
        else:
            merged[name] = sz
    return list(merged.items())


def slug(name: str) -> str:
    trans = str.maketrans(
        "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
        "abvgdeejziyklmnoprstufhccss_y_eua",
    )
    s = name.lower().translate(trans)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:48] or "team"


SEED_TS = Path("/Users/ivanbolsakov/vi_planer/src/seed.ts")

SIZE_RANGES_TS = """    XS: { min: 1, max: 5 },
    S: { min: 5, max: 10 },
    M: { min: 10, max: 20 },
    L: { min: 20, max: 40 },
    XL: { min: 40, max: 80 },
    XXL: { min: 80, max: 160 },"""


def ts_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_seed_ts(team_rows: list[dict], items: list[dict]) -> None:
    name_to_id = {t["name"]: t["id"] for t in team_rows}
    team_blocks = []
    for t in team_rows:
        team_blocks.append(
            "    {\n"
            f"      id: {ts_str(t['id'])},\n"
            f"      name: {ts_str(t['name'])},\n"
            f"      capacityPw: {t['capacityPw']},\n"
            f"      color: {ts_str(t['color'])},\n"
            "    }"
        )

    item_blocks = []
    for it in items:
        rank = int(it["rank"])
        assigns_lines = []
        for a in it["assigns"]:
            tid = name_to_id.get(a["team"]) or slug(a["team"])
            assigns_lines.append(
                f'        {{ teamId: {ts_str(tid)}, size: {ts_str(a["size"])}, workStartDate: START }}'
            )
        assigns_joined = ",\n".join(assigns_lines)
        notes = it.get("notes") or []
        note = notes[0] if notes else ""
        notes_line = f"      notes: {ts_str(note)},\n" if note else ""
        item_blocks.append(
            "    {\n"
            f'      id: {ts_str(f"x{rank:03d}")},\n'
            f"      title: {ts_str(it['title'])},\n"
            '      type: "project",\n'
            f"      backlog: {ts_str(it['project'])},\n"
            "      assignments: [\n"
            f"{assigns_joined}\n"
            "      ],\n"
            f'      status: {ts_str(it.get("status") or "ready")},\n'
            '      owner: "—",\n'
            '      assignee: "",\n'
            "      reach: 0,\n"
            "      impact: 1,\n"
            "      confidence: 0.7,\n"
            f"{notes_line}"
            f"      manualRank: {rank},\n"
            "      cashFlow12m: null,\n"
            "      roi12m: null,\n"
            "    }"
        )

    teams_joined = ",\n".join(team_blocks)
    items_joined = ",\n".join(item_blocks)
    body = f"""import {{
  AppState,
  ensureUniquePriorities,
  uniqCatalogNames,
  containerNameFromBacklog,
}} from "./model";

/** ISO start for the Oct 2026 prioritization pack (all assignments). */
export const PORTFOLIO_START = "2026-10-01";

/** Applied once to live/cloud state; rollback keeps this from re-applying. */
export const PORTFOLIO_PACK_ID = "xlsx-prio-2026-10-v4";
/** Previous packs — load path fully replaces seed (not a status-only patch). */
export const PORTFOLIO_PACK_PREV = "xlsx-prio-2026-10-v3";
export const PORTFOLIO_PACK_V2 = "xlsx-prio-2026-10-v2";
export const PORTFOLIO_PACK_V1 = "xlsx-prio-2026-10";
export const PORTFOLIO_PACK_ROLLED_BACK = "xlsx-prio-2026-10-rolled-back";

const START = PORTFOLIO_START;

const SEED_RAW: AppState = {{
  version: 3,
  startDate: START,
  sizeRanges: {{
{SIZE_RANGES_TS}
  }},
  portfolioNotes: "",
  changeLog: [],
  demoVariantA: true,
  demoVariantB: false,
  portfolioPack: PORTFOLIO_PACK_ID,
  teams: [
{teams_joined},
  ],
  customers: [],
  executors: [],
  projects: [],
  products: [],
  items: [
{items_joined},
  ],
}};

export const SEED: AppState = {{
  ...SEED_RAW,
  customers: uniqCatalogNames(SEED_RAW.items.map((i) => i.owner)),
  executors: uniqCatalogNames(SEED_RAW.items.map((i) => i.assignee)),
  projects: uniqCatalogNames(
    SEED_RAW.items
      .filter((i) => i.type === "project")
      .map((i) => containerNameFromBacklog(i.backlog))
  ),
  products: uniqCatalogNames(
    SEED_RAW.items
      .filter((i) => i.type === "product")
      .map((i) => containerNameFromBacklog(i.backlog))
  ),
  items: ensureUniquePriorities(SEED_RAW.items),
}};
"""
    SEED_TS.write_text(body, encoding="utf-8")
    print("seed", len(team_rows), "teams", len(items), "items ->", SEED_TS)


def main() -> None:
    rows = load_sheet(XLSX)

    blocks = [
        ("Единая операционная модель", "A", "B", "C", 2, 11),
        ("Подарочные сертификаты", "E", "F", "G", 2, 9),
        ("Mobile ID (SIM Push)", "I", "J", "K", 2, 8),
        ("Кредитование Б2Б", "M", "N", "O", 2, 6),
        ("B2b онлайн платформа", "A", "B", "C", 14, 27),
        ("Активные продажи", "E", "F", "G", 14, 25),
        ("ДКБ", "I", "J", "K", 14, 20),
    ]

    items = []
    teams_all: OrderedDict[str, None] = OrderedDict()
    rank = 1
    for project, tc, cc, ec, r0, r1 in blocks:
        for r in range(r0, r1 + 1):
            title = cell(rows, r, tc)
            if not title:
                continue
            title = re.sub(r"\s+", " ", title.replace("\n", " ")).strip()
            team_raw = cell(rows, r, cc)
            est_raw = cell(rows, r, ec)
            if project == "Подарочные сертификаты" and team_raw:
                team_hint = re.sub(r"\s+", " ", team_raw.replace("\n", " ")).strip()
                if team_hint and team_hint.lower() not in title.lower():
                    title = f"{title} — {team_hint}"
            teams = split_teams(team_raw)
            assigns, notes, status = parse_est_lines(est_raw, teams)
            for n, _ in assigns:
                teams_all.setdefault(n, None)
            items.append(
                {
                    "rank": rank,
                    "project": project,
                    "title": title[:220],
                    "assigns": [{"team": a, "size": s} for a, s in assigns],
                    "notes": notes,
                    "status": status,
                }
            )
            rank += 1

    palette = [
        "#d60000",
        "#455a64",
        "#e65100",
        "#2e7d32",
        "#1565c0",
        "#6a1b9a",
        "#00838f",
        "#c62828",
        "#546e7a",
        "#ef6c00",
        "#558b2f",
        "#283593",
        "#ad1457",
        "#00695c",
        "#5d4037",
        "#37474f",
        "#f9a825",
        "#0277bd",
        "#7b1fa2",
        "#009688",
        "#ff7043",
        "#5c6bc0",
        "#8d6e63",
        "#26a69a",
        "#ec407a",
        "#78909c",
        "#9ccc65",
        "#ba68c8",
        "#4dd0e1",
        "#ffb74d",
        "#90a4ae",
        "#a1887f",
    ]
    used_ids: set[str] = set()
    team_rows = []
    for i, name in enumerate(teams_all):
        tid = slug(name)
        base = tid
        n = 2
        while tid in used_ids:
            tid = f"{base}-{n}"
            n += 1
        used_ids.add(tid)
        team_rows.append(
            {
                "id": tid,
                "name": name,
                "capacityPw": 3,
                "color": palette[i % len(palette)],
            }
        )

    OUT.write_text(
        json.dumps({"teams": team_rows, "items": items}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print("teams", len(team_rows), "items", len(items), "->", OUT)
    write_seed_ts(team_rows, items)


if __name__ == "__main__":
    main()
