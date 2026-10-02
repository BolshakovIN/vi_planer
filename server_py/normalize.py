"""State normalization — mirrors src/model.ts normalizeState for API parity."""

from __future__ import annotations

import math
import random
import string
from datetime import date, timedelta
from typing import Any

DEFAULT_SIZE_RANGES = {
    "XS": {"min": 1, "max": 5},
    "S": {"min": 5, "max": 10},
    "M": {"min": 10, "max": 20},
    "L": {"min": 20, "max": 40},
    "XL": {"min": 40, "max": 80},
    "XXL": {"min": 80, "max": 160},
}
TSHIRT_SIZES = ("XS", "S", "M", "L", "XL", "XXL")
WORKING_DAYS_PER_WEEK = 5
ITEM_STATUSES = {"idea", "ready", "in_progress", "blocked", "done"}
CAPACITY_FROM_SHIRT = {
    "XS": 1.5,
    "S": 2,
    "M": 3.5,
    "L": 5,
    "XL": 7,
    "XXL": 10,
}


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
    s = str(raw or "").upper().strip()
    if s in TSHIRT_SIZES:
        return s
    if s == "XXS":
        return "XS"
    if s == "XXXL":
        return "XXL"
    return "M"


def pw_to_size(estimate_pw: float, capacity_pw: float = 3) -> str:
    return nearest_size_for_estimate_pw(estimate_pw)


def _clone_size_ranges(src: dict[str, dict[str, int]]) -> dict[str, dict[str, int]]:
    return {sz: dict(src[sz]) for sz in TSHIRT_SIZES}


def _is_legacy_week_size_ranges(raw: dict[str, Any]) -> bool:
    if raw.get("XS") is not None or raw.get("XL") is not None or raw.get("XXL") is not None:
        return False
    saw = False
    for sz in ("S", "M", "L"):
        row = raw.get(sz)
        if not isinstance(row, dict):
            continue
        saw = True
        try:
            mx = float(row.get("max"))
        except (TypeError, ValueError):
            return False
        if not math.isfinite(mx) or mx > 8:
            return False
    return saw


def normalize_size_ranges(raw: Any) -> dict[str, dict[str, int]]:
    out = _clone_size_ranges(DEFAULT_SIZE_RANGES)
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
    if _is_legacy_week_size_ranges(raw):
        for sz in ("S", "M", "L"):
            if raw.get(sz) is None:
                continue
            mn = max(1, out[sz]["min"] * WORKING_DAYS_PER_WEEK)
            mx = max(mn, out[sz]["max"] * WORKING_DAYS_PER_WEEK)
            out[sz] = {"min": mn, "max": mx}
    return out


def size_plan_days(size: str, ranges: dict[str, dict[str, int]] | None = None) -> float:
    ranges = ranges or DEFAULT_SIZE_RANGES
    r = ranges.get(size) or DEFAULT_SIZE_RANGES["M"]
    return round(((r["min"] + r["max"]) / 2) * 10) / 10


def size_plan_weeks(size: str, ranges: dict[str, dict[str, int]] | None = None) -> float:
    weeks = size_plan_days(size, ranges) / WORKING_DAYS_PER_WEEK
    return max(1.0, round(weeks * 10) / 10)


def nearest_size_from_days(
    days: float, ranges: dict[str, dict[str, int]] | None = None
) -> str:
    ranges = ranges or DEFAULT_SIZE_RANGES
    target = max(1.0, days)
    best = "M"
    best_dist = math.inf
    for sz in TSHIRT_SIZES:
        dist = abs(size_plan_days(sz, ranges) - target)
        if dist < best_dist:
            best_dist = dist
            best = sz
    return best


def parse_optional_days(raw: Any) -> int | None:
    if raw is None or raw == "":
        return None
    try:
        n = int(round(float(raw)))
    except (TypeError, ValueError):
        return None
    if n < 1:
        return None
    return n


def nearest_size_for_estimate_pw(
    estimate_pw: float, ranges: dict[str, dict[str, int]] | None = None
) -> str:
    ranges = ranges or DEFAULT_SIZE_RANGES
    target = max(0.1, estimate_pw)
    best = "M"
    best_dist = math.inf
    for sz in TSHIRT_SIZES:
        dist = abs(size_plan_weeks(sz, ranges) - target)
        if dist < best_dist:
            best_dist = dist
            best = sz
    return best


RICE_IMPACT_OPTIONS = (0.25, 0.5, 1, 2, 3)


def impact_from_business_value(bv: float) -> float:
    if bv <= 2:
        return 0.25
    if bv <= 4:
        return 0.5
    if bv <= 6:
        return 1.0
    if bv <= 8:
        return 2.0
    return 3.0


def parse_rice_impact(raw: Any, fallback: float = 1.0) -> float:
    try:
        n = float(raw)
    except (TypeError, ValueError):
        return fallback
    if not math.isfinite(n):
        return fallback
    for opt in RICE_IMPACT_OPTIONS:
        if abs(n - opt) < 0.001:
            return opt
    return fallback


def parse_rice_confidence(raw: Any, fallback: float = 0.8) -> float:
    try:
        n = float(raw)
    except (TypeError, ValueError):
        return fallback
    if not math.isfinite(n):
        return fallback
    if n > 1:
        n = n / 100
    return round(min(1.0, max(0.0, n)) * 100) / 100


def total_estimate_weeks(
    item: dict[str, Any], ranges: dict[str, dict[str, int]] | None = None
) -> float:
    ranges = ranges or DEFAULT_SIZE_RANGES
    return sum(
        size_plan_weeks(a.get("size", "M"), ranges)
        for a in (item.get("assignments") or [])
    )


def rice_effort_weeks(
    item: dict[str, Any], ranges: dict[str, dict[str, int]] | None = None
) -> float:
    return max(total_estimate_weeks(item, ranges), 0.5)


def rice(
    item: dict[str, Any], ranges: dict[str, dict[str, int]] | None = None
) -> float:
    score = (
        float(item.get("reach") or 100)
        * float(item.get("impact") or 1)
        * float(item.get("confidence") or 0.8)
    ) / rice_effort_weeks(item, ranges)
    return round(score * 100) / 100


def rice_fields_from_raw(r: dict[str, Any]) -> dict[str, float]:
    """Migrate legacy WSJF → RICE when reach/impact/confidence absent."""
    has_rice = (
        r.get("reach") is not None
        or r.get("impact") is not None
        or r.get("confidence") is not None
    )
    if has_rice:
        return {
            "reach": max(0.0, _num(r.get("reach"), 100)),
            "impact": parse_rice_impact(r.get("impact"), 1.0),
            "confidence": parse_rice_confidence(r.get("confidence"), 0.8),
        }
    bv = _num(r.get("businessValue"), 5)
    tc = _num(r.get("timeCriticality"), 5)
    rr = _num(r.get("riskReduction"), 5)
    return {
        "reach": 100.0,
        "impact": impact_from_business_value(bv),
        "confidence": max(0.5, parse_rice_confidence((tc + rr) / 20, 0.8)),
    }


def ensure_unique_priorities(
    items: list[dict[str, Any]],
    ranges: dict[str, dict[str, int]] | None = None,
) -> list[dict[str, Any]]:
    ranges = ranges or DEFAULT_SIZE_RANGES
    by_rice = sorted(
        items,
        key=lambda it: (-rice(it, ranges), total_estimate_weeks(it, ranges)),
    )
    used: set[float] = set()
    kept: dict[str, float] = {}

    for item in by_rice:
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
                    days_hint = parse_optional_days(a.get("days"))
                    if days_hint is not None:
                        size = nearest_size_from_days(days_hint)
                    else:
                        try:
                            est = float(a.get("estimatePw") or 1)
                        except (TypeError, ValueError):
                            est = 1
                        size = pw_to_size(est, cap)
                row: dict[str, Any] = {
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
                days = parse_optional_days(a.get("days"))
                if days is not None:
                    row["days"] = days
                assignments.append(row)
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

        rice = rice_fields_from_raw(r)
        item: dict[str, Any] = {
            "id": str(r.get("id") or uid("item")),
            "title": str(r.get("title") or "Без названия"),
            "type": "project" if r.get("type") == "project" else "product",
            "backlog": str(r.get("backlog") or "Backlog"),
            "assignments": assignments,
            "status": status,
            "owner": str(r.get("owner") or "—"),
            "reach": rice["reach"],
            "impact": rice["impact"],
            "confidence": rice["confidence"],
            "manualRank": manual_rank,
        }
        if r.get("notes") is not None:
            item["notes"] = str(r["notes"])
        ds = str(r.get("demandStatus") or "").lower().strip()
        if ds in {"submitted", "sent", "отправлено", "на согласовании"}:
            item["demandStatus"] = "submitted"
        items.append(item)

    parsed_ranges = normalize_size_ranges(raw.get("sizeRanges"))
    return {
        "version": 3,
        "startDate": plan_start,
        "teams": teams,
        "sizeRanges": parsed_ranges,
        "items": ensure_unique_priorities(items, parsed_ranges),
    }
