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
                "backlog": "Mobile",
                "assignments": [{"teamId": "mobile", "size": "M", "workStartDate": s0}],
                "status": "ready",
                "owner": "Маша Л.",
                "reach": 5000,
                "impact": 2,
                "confidence": 0.8,
                "manualRank": None,
            },
            {
                "id": "j4",
                "title": "Интеграция телефонии для отдела продаж",
                "type": "project",
                "backlog": "ЛК B2B",
                "assignments": [{"teamId": "crm", "size": "S", "workStartDate": s1}],
                "status": "ready",
                "owner": "Сергей М.",
                "reach": 40,
                "impact": 1,
                "confidence": 0.7,
                "manualRank": None,
            },
            {
                "id": "p6",
                "title": "Push-уведомления и deep links",
                "type": "product",
                "backlog": "Mobile",
                "assignments": [{"teamId": "mobile", "size": "S", "workStartDate": s4}],
                "status": "idea",
                "owner": "Маша Л.",
                "reach": 8000,
                "impact": 1,
                "confidence": 0.6,
                "manualRank": None,
            },
            {
                "id": "j6",
                "title": "Дашборд KPI для совета директоров",
                "type": "project",
                "backlog": "Exec",
                "assignments": [{"teamId": "data", "size": "S", "workStartDate": s0}],
                "status": "ready",
                "owner": "Павел Р.",
                "reach": 12,
                "impact": 2,
                "confidence": 0.9,
                "notes": "Нужен к ближайшему совету",
                "manualRank": None,
            },
            {
                "id": "p5",
                "title": "Админ-панель ролей и аудита",
                "type": "product",
                "backlog": "Platform",
                "assignments": [
                    {"teamId": "platform", "size": "S", "workStartDate": s6}
                ],
                "status": "idea",
                "owner": "Аня К.",
                "reach": 25,
                "impact": 0.5,
                "confidence": 0.85,
                "manualRank": None,
            },
            {
                "id": "p1",
                "title": "Единый каталог цен и остатков",
                "type": "product",
                "backlog": "Commerce",
                "assignments": [
                    {"teamId": "platform", "size": "M", "workStartDate": s0},
                    {"teamId": "data", "size": "M", "workStartDate": s3},
                ],
                "status": "in_progress",
                "owner": "Аня К.",
                "reach": 10000,
                "impact": 3,
                "confidence": 0.8,
                "notes": "Data стартует после первых API Platform",
                "manualRank": None,
            },
            {
                "id": "j1",
                "title": "Внедрение EDI для крупного B2B-клиента",
                "type": "project",
                "backlog": "Delivery",
                "assignments": [
                    {"teamId": "platform", "size": "M", "workStartDate": s1},
                    {"teamId": "crm", "size": "S", "workStartDate": s4},
                ],
                "status": "ready",
                "owner": "Игорь С.",
                "reach": 1,
                "impact": 2,
                "confidence": 0.85,
                "notes": "CRM — онбординг после ядра EDI",
                "manualRank": None,
            },
            {
                "id": "j2",
                "title": "Пилот Launchpad: клинический портал",
                "type": "project",
                "backlog": "Launchpad",
                "assignments": [
                    {"teamId": "mobile", "size": "M", "workStartDate": s2},
                    {"teamId": "platform", "size": "S", "workStartDate": s2},
                ],
                "status": "ready",
                "owner": "Денис В.",
                "reach": 200,
                "impact": 2,
                "confidence": 0.7,
                "notes": "Обе команды стартуют одновременно",
                "manualRank": None,
            },
            {
                "id": "j3",
                "title": "Миграция отчётности клиента X на DWH",
                "type": "project",
                "backlog": "Data",
                "assignments": [
                    {"teamId": "data", "size": "M", "workStartDate": s1},
                    {"teamId": "platform", "size": "S", "workStartDate": s0},
                ],
                "status": "ready",
                "owner": "Павел Р.",
                "reach": 5,
                "impact": 1,
                "confidence": 0.75,
                "notes": "Platform — пайплайн выгрузки раньше Data",
                "manualRank": None,
            },
            {
                "id": "p4",
                "title": "Сквозная воронка лида → сделка",
                "type": "product",
                "backlog": "CRM",
                "assignments": [
                    {"teamId": "crm", "size": "M", "workStartDate": s0},
                    {"teamId": "platform", "size": "S", "workStartDate": s2},
                    {"teamId": "mobile", "size": "S", "workStartDate": s6},
                ],
                "status": "in_progress",
                "owner": "Оля Т.",
                "reach": 3000,
                "impact": 3,
                "confidence": 0.8,
                "notes": "Mobile подключается после событий Platform",
                "manualRank": None,
            },
            {
                "id": "j5",
                "title": "Compliance-пакет HIPAA для продукта Y",
                "type": "project",
                "backlog": "Security",
                "assignments": [
                    {"teamId": "platform", "size": "M", "workStartDate": s3},
                    {"teamId": "data", "size": "S", "workStartDate": s4},
                    {"teamId": "mobile", "size": "S", "workStartDate": s8},
                ],
                "status": "blocked",
                "owner": "Игорь С.",
                "reach": 500,
                "impact": 2,
                "confidence": 0.9,
                "notes": "Ждём юристов; старты сдвинуты",
                "manualRank": None,
            },
            {
                "id": "p3",
                "title": "Рекомендации в поиске (ML)",
                "type": "product",
                "backlog": "Growth",
                "assignments": [
                    {"teamId": "data", "size": "L", "workStartDate": s2},
                    {"teamId": "platform", "size": "S", "workStartDate": s6},
                    {"teamId": "mobile", "size": "S", "workStartDate": s8},
                ],
                "status": "idea",
                "owner": "Катя Н.",
                "reach": 15000,
                "impact": 2,
                "confidence": 0.5,
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
