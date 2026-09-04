"""State normalization — mirrors src/model.ts normalizeState for API parity."""

from __future__ import annotations

import math
import random
import string
from datetime import date, timedelta
from typing import Any

DEFAULT_SIZE_RANGES = {
    "S": {"min": 1, "max": 2},
    "M": {"min": 2, "max": 4},
    "L": {"min": 4, "max": 8},
}
TSHIRT_SIZES = ("S", "M", "L")
ITEM_STATUSES = {"idea", "ready", "in_progress", "blocked", "done"}
CAPACITY_FROM_SHIRT = {"S": 2, "M": 3.5, "L": 5}


def uid(prefix: str) -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=7))
    return f"{prefix}_{suffix}"


def monday_of(d: date | None = None) -> str:
    d = d or date.today()
    monday = d - timedelta(days=d.weekday())
    return monday.isoformat()


def snap_to_monday(iso: str) -> str:
    if not iso or len(iso) < 10:
        return monday_of()
    try:
        d = date.fromisoformat(iso[:10])
    except ValueError:
        return monday_of()
    return monday_of(d)


def parse_size(raw: Any) -> str:
    s = str(raw or "").upper()
    if s in TSHIRT_SIZES:
        return s
    return "M"


def pw_to_size(estimate_pw: float, capacity_pw: float = 3) -> str:
    weeks = estimate_pw / max(capacity_pw, 0.5)
    if weeks <= 2:
        return "S"
    if weeks <= 4:
        return "M"
    return "L"


def normalize_size_ranges(raw: Any) -> dict[str, dict[str, int]]:
    out = {
        "S": dict(DEFAULT_SIZE_RANGES["S"]),
        "M": dict(DEFAULT_SIZE_RANGES["M"]),
        "L": dict(DEFAULT_SIZE_RANGES["L"]),
    }
    if not isinstance(raw, dict):
        return out
    for sz in TSHIRT_SIZES:
        row = raw.get(sz)
        if not isinstance(row, dict):
            continue
        try:
            mn = round(float(row.get("min")))
        except (TypeError, ValueError):
            mn = out[sz]["min"]
        try:
            mx = round(float(row.get("max")))
        except (TypeError, ValueError):
            mx = out[sz]["max"]
        if not math.isfinite(mn):
            mn = out[sz]["min"]
        if not math.isfinite(mx):
            mx = out[sz]["max"]
        mn = max(1, mn)
        mx = max(mn, mx)
        out[sz] = {"min": mn, "max": mx}
    if out["S"]["max"] > 12 or out["M"]["max"] > 12 or out["L"]["max"] > 12:
        for sz in TSHIRT_SIZES:
            out[sz] = {
                "min": max(1, round(out[sz]["min"] / 7)),
                "max": max(1, round(out[sz]["max"] / 7)),
            }
            if out[sz]["max"] < out[sz]["min"]:
                out[sz]["max"] = out[sz]["min"]
    return out


def size_plan_weeks(size: str, ranges: dict[str, dict[str, int]] | None = None) -> float:
    ranges = ranges or DEFAULT_SIZE_RANGES
    r = ranges.get(size) or DEFAULT_SIZE_RANGES["M"]
    return round(((r["min"] + r["max"]) / 2) * 10) / 10


def wsjf(item: dict[str, Any]) -> float:
    job = float(item.get("jobSize") or 5) or 5
    return (
        float(item.get("businessValue") or 5)
        + float(item.get("timeCriticality") or 5)
        + float(item.get("riskReduction") or 5)
    ) / job


def total_estimate_weeks(
    item: dict[str, Any], ranges: dict[str, dict[str, int]] | None = None
) -> float:
    ranges = ranges or DEFAULT_SIZE_RANGES
    return sum(
        size_plan_weeks(a.get("size", "M"), ranges)
        for a in (item.get("assignments") or [])
    )


def ensure_unique_priorities(
    items: list[dict[str, Any]],
    ranges: dict[str, dict[str, int]] | None = None,
) -> list[dict[str, Any]]:
    ranges = ranges or DEFAULT_SIZE_RANGES
    by_wsjf = sorted(
        items,
        key=lambda it: (-wsjf(it), total_estimate_weeks(it, ranges)),
    )
    used: set[float] = set()
    kept: dict[str, float] = {}

    for item in by_wsjf:
        r = item.get("manualRank")
        if r is None:
            continue
        try:
            rf = float(r)
        except (TypeError, ValueError):
            continue
        if math.isfinite(rf) and rf >= 1 and rf not in used:
            used.add(rf)
            kept[item["id"]] = rf

    next_rank = 1

    def take_next() -> int:
        nonlocal next_rank
        while next_rank in used:
            next_rank += 1
        n = next_rank
        used.add(n)
        next_rank += 1
        return n

    result: list[dict[str, Any]] = []
    for item in items:
        rank = kept.get(item["id"])
        if rank is None:
            rank = take_next()
        if item.get("manualRank") == rank:
            result.append(item)
        else:
            result.append({**item, "manualRank": rank})
    return result


def _num(raw: Any, default: float) -> float:
    try:
        v = float(raw)
        return v if math.isfinite(v) and v else default
    except (TypeError, ValueError):
        return default


def normalize_state(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    if not isinstance(raw.get("teams"), list) or not isinstance(raw.get("items"), list):
        return None

    plan_start = snap_to_monday(str(raw.get("startDate") or monday_of()))

    teams: list[dict[str, Any]] = []
    for row in raw["teams"]:
        t = row if isinstance(row, dict) else {}
        try:
            legacy_cap = float(t.get("capacityPw"))
        except (TypeError, ValueError):
            legacy_cap = float("nan")
        from_pw = legacy_cap if math.isfinite(legacy_cap) and legacy_cap > 0 else None
        from_shirt = (
            CAPACITY_FROM_SHIRT.get(parse_size(t.get("capacity")))
            if t.get("capacity") is not None
            else None
        )
        teams.append(
            {
                "id": str(t.get("id") or uid("team")),
                "name": str(t.get("name") or "Команда"),
                "color": str(t.get("color") or "#737373"),
                "capacityPw": from_pw
                if from_pw is not None
                else (from_shirt if from_shirt is not None else 3),
            }
        )

    team_cap = {t["id"]: t["capacityPw"] for t in teams}

    items: list[dict[str, Any]] = []
    for row in raw["items"]:
        r = row if isinstance(row, dict) else {}
        assignments: list[dict[str, Any]] = []
        raw_assignments = r.get("assignments")
        if isinstance(raw_assignments, list) and raw_assignments:
            for a in raw_assignments:
                if not isinstance(a, dict) or not isinstance(a.get("teamId"), str):
                    continue
                team_id = str(a["teamId"])
                cap = team_cap.get(team_id, 3)
                if a.get("size") is not None:
                    size = parse_size(a.get("size"))
                else:
                    try:
                        est = float(a.get("estimatePw") or 1)
                    except (TypeError, ValueError):
                        est = 1
                    size = pw_to_size(est, cap)
                assignments.append(
                    {
                        "teamId": team_id,
                        "size": size,
                        "workStartDate": snap_to_monday(
                            str(
                                a.get("workStartDate")
                                or r.get("workStartDate")
                                or plan_start
                            )
                        ),
                    }
                )
        elif isinstance(r.get("teamId"), str):
            tid = r["teamId"]
            try:
                est = float(r.get("estimatePw") or 1)
            except (TypeError, ValueError):
                est = 1
            assignments = [
                {
                    "teamId": tid,
                    "size": pw_to_size(est, team_cap.get(tid, 3)),
                    "workStartDate": plan_start,
                }
            ]
        if not assignments and teams:
            assignments = [
                {"teamId": teams[0]["id"], "size": "M", "workStartDate": plan_start}
            ]

        status = str(r.get("status") or "idea")
        if status not in ITEM_STATUSES:
            status = "idea"

        manual = r.get("manualRank")
        if manual is None or manual == "":
            manual_rank = None
        else:
            try:
                manual_rank = float(manual)
            except (TypeError, ValueError):
                manual_rank = None

        item: dict[str, Any] = {
            "id": str(r.get("id") or uid("item")),
            "title": str(r.get("title") or "Без названия"),
            "type": "project" if r.get("type") == "project" else "product",
            "backlog": str(r.get("backlog") or "Backlog"),
            "assignments": assignments,
            "status": status,
            "owner": str(r.get("owner") or "—"),
            "businessValue": _num(r.get("businessValue"), 5),
            "timeCriticality": _num(r.get("timeCriticality"), 5),
            "riskReduction": _num(r.get("riskReduction"), 5),
            "jobSize": _num(r.get("jobSize"), 5),
            "manualRank": manual_rank,
        }
        if r.get("notes") is not None:
            item["notes"] = str(r["notes"])
        items.append(item)

    parsed_ranges = normalize_size_ranges(raw.get("sizeRanges"))
    return {
        "version": 3,
        "startDate": plan_start,
        "teams": teams,
        "sizeRanges": parsed_ranges,
        "items": ensure_unique_priorities(items, parsed_ranges),
    }
