"""Demo seed — mirrors src/seed.ts (dates relative to current Monday)."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from .normalize import DEFAULT_SIZE_RANGES, ensure_unique_priorities, monday_of


def _add_weeks(iso: str, weeks: int) -> str:
    d = date.fromisoformat(iso)
    return (d + timedelta(weeks=weeks)).isoformat()


def build_seed() -> dict[str, Any]:
    s0 = monday_of()
    s1 = _add_weeks(s0, 1)
    s2 = _add_weeks(s0, 2)
    s3 = _add_weeks(s0, 3)
    s4 = _add_weeks(s0, 4)
    s6 = _add_weeks(s0, 6)
    s8 = _add_weeks(s0, 8)

    raw: dict[str, Any] = {
        "version": 3,
        "startDate": s0,
        "sizeRanges": {
            "S": dict(DEFAULT_SIZE_RANGES["S"]),
            "M": dict(DEFAULT_SIZE_RANGES["M"]),
            "L": dict(DEFAULT_SIZE_RANGES["L"]),
        },
        "teams": [
            {"id": "platform", "name": "Platform", "capacityPw": 4, "color": "#d60000"},
            {"id": "mobile", "name": "Mobile", "capacityPw": 3, "color": "#455a64"},
            {
                "id": "data",
                "name": "Data & Analytics",
                "capacityPw": 2.5,
                "color": "#737373",
            },
            {
                "id": "crm",
                "name": "CRM / Sales Tech",
                "capacityPw": 3.5,
                "color": "#e65100",
            },
        ],
        "items": [
            {
                "id": "p2",
                "title": "Мобильный чекаут v2",
                "type": "product",
                "backlog": "Product backlog · Mobile",
                "assignments": [{"teamId": "mobile", "size": "M", "workStartDate": s0}],
                "status": "ready",
                "owner": "Маша Л.",
                "businessValue": 8,
                "timeCriticality": 5,
                "riskReduction": 5,
                "jobSize": 6,
                "manualRank": None,
            },
            {
                "id": "j4",
                "title": "Интеграция телефонии для отдела продаж",
                "type": "project",
                "backlog": "Projects backlog · Sales Ops",
                "assignments": [{"teamId": "crm", "size": "S", "workStartDate": s1}],
                "status": "ready",
                "owner": "Сергей М.",
                "businessValue": 7,
                "timeCriticality": 7,
                "riskReduction": 3,
                "jobSize": 3,
                "manualRank": None,
            },
            {
                "id": "p6",
                "title": "Push-уведомления и deep links",
                "type": "product",
                "backlog": "Product backlog · Mobile",
                "assignments": [{"teamId": "mobile", "size": "S", "workStartDate": s4}],
                "status": "idea",
                "owner": "Маша Л.",
                "businessValue": 6,
                "timeCriticality": 4,
                "riskReduction": 2,
                "jobSize": 3,
                "manualRank": None,
            },
            {
                "id": "j6",
                "title": "Дашборд KPI для совета директоров",
                "type": "project",
                "backlog": "Projects backlog · Exec",
                "assignments": [{"teamId": "data", "size": "S", "workStartDate": s0}],
                "status": "ready",
                "owner": "Павел Р.",
                "businessValue": 8,
                "timeCriticality": 9,
                "riskReduction": 2,
                "jobSize": 2,
                "notes": "Нужен к ближайшему совету",
                "manualRank": None,
            },
            {
                "id": "p5",
                "title": "Админ-панель ролей и аудита",
                "type": "product",
                "backlog": "Product backlog · Platform",
                "assignments": [
                    {"teamId": "platform", "size": "S", "workStartDate": s6}
                ],
                "status": "idea",
                "owner": "Аня К.",
                "businessValue": 5,
                "timeCriticality": 2,
                "riskReduction": 8,
                "jobSize": 4,
                "manualRank": None,
            },
            {
                "id": "p1",
                "title": "Единый каталог цен и остатков",
                "type": "product",
                "backlog": "Product backlog · Commerce",
                "assignments": [
                    {"teamId": "platform", "size": "M", "workStartDate": s0},
                    {"teamId": "data", "size": "M", "workStartDate": s3},
                ],
                "status": "in_progress",
                "owner": "Аня К.",
                "businessValue": 9,
                "timeCriticality": 7,
                "riskReduction": 6,
                "jobSize": 8,
                "notes": "Data стартует после первых API Platform",
                "manualRank": None,
            },
            {
                "id": "j1",
                "title": "Внедрение EDI для крупного B2B-клиента",
                "type": "project",
                "backlog": "Projects backlog · Delivery",
                "assignments": [
                    {"teamId": "platform", "size": "M", "workStartDate": s1},
                    {"teamId": "crm", "size": "S", "workStartDate": s4},
                ],
                "status": "ready",
                "owner": "Игорь С.",
                "businessValue": 8,
                "timeCriticality": 9,
                "riskReduction": 4,
                "jobSize": 5,
                "notes": "CRM — онбординг после ядра EDI",
                "manualRank": None,
            },
            {
                "id": "j2",
                "title": "Пилот Launchpad: клинический портал",
                "type": "project",
                "backlog": "Projects backlog · Launchpad",
                "assignments": [
                    {"teamId": "mobile", "size": "M", "workStartDate": s2},
                    {"teamId": "platform", "size": "S", "workStartDate": s2},
                ],
                "status": "ready",
                "owner": "Денис В.",
                "businessValue": 7,
                "timeCriticality": 8,
                "riskReduction": 7,
                "jobSize": 4,
                "notes": "Обе команды стартуют одновременно",
                "manualRank": None,
            },
            {
                "id": "j3",
                "title": "Миграция отчётности клиента X на DWH",
                "type": "project",
                "backlog": "Projects backlog · Data",
                "assignments": [
                    {"teamId": "data", "size": "M", "workStartDate": s1},
                    {"teamId": "platform", "size": "S", "workStartDate": s0},
                ],
                "status": "ready",
                "owner": "Павел Р.",
                "businessValue": 6,
                "timeCriticality": 6,
                "riskReduction": 8,
                "jobSize": 5,
                "notes": "Platform — пайплайн выгрузки раньше Data",
                "manualRank": None,
            },
            {
                "id": "p4",
                "title": "Сквозная воронка лида → сделка",
                "type": "product",
                "backlog": "Product backlog · CRM",
                "assignments": [
                    {"teamId": "crm", "size": "M", "workStartDate": s0},
                    {"teamId": "platform", "size": "S", "workStartDate": s2},
                    {"teamId": "mobile", "size": "S", "workStartDate": s6},
                ],
                "status": "in_progress",
                "owner": "Оля Т.",
                "businessValue": 9,
                "timeCriticality": 6,
                "riskReduction": 5,
                "jobSize": 6,
                "notes": "Mobile подключается после событий Platform",
                "manualRank": None,
            },
            {
                "id": "j5",
                "title": "Compliance-пакет HIPAA для продукта Y",
                "type": "project",
                "backlog": "Projects backlog · Security",
                "assignments": [
                    {"teamId": "platform", "size": "M", "workStartDate": s3},
                    {"teamId": "data", "size": "S", "workStartDate": s4},
                    {"teamId": "mobile", "size": "S", "workStartDate": s8},
                ],
                "status": "blocked",
                "owner": "Игорь С.",
                "businessValue": 8,
                "timeCriticality": 8,
                "riskReduction": 9,
                "jobSize": 6,
                "notes": "Ждём юристов; старты сдвинуты",
                "manualRank": None,
            },
            {
                "id": "p3",
                "title": "Рекомендации в поиске (ML)",
                "type": "product",
                "backlog": "Product backlog · Growth",
                "assignments": [
                    {"teamId": "data", "size": "L", "workStartDate": s2},
                    {"teamId": "platform", "size": "S", "workStartDate": s6},
                    {"teamId": "mobile", "size": "S", "workStartDate": s8},
                ],
                "status": "idea",
                "owner": "Катя Н.",
                "businessValue": 7,
                "timeCriticality": 3,
                "riskReduction": 6,
                "jobSize": 7,
                "notes": "Serving и UI после модели",
                "manualRank": None,
            },
        ],
    }
    return {
        **raw,
        "items": ensure_unique_priorities(raw["items"]),
    }


SEED = build_seed()
