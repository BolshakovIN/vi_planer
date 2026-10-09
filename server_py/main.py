"""VI Planer Python backend — FastAPI, same /api contract as server/index.ts."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .db import get_state, get_storage_mode, get_updated_at, init_db, ping_db, set_state
from .normalize import normalize_state

ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = ROOT / "dist"

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8787"))
CORS_ORIGIN = os.environ.get("CORS_ORIGIN")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="VI Planer", lifespan=lifespan)


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    if not CORS_ORIGIN:
        return await call_next(request)
    if request.method == "OPTIONS":
        return Response(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": CORS_ORIGIN,
                "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        )
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = CORS_ORIGIN
    response.headers["Access-Control-Allow-Methods"] = "GET, PUT, POST, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def _jira_status() -> dict[str, Any]:
    url = (os.environ.get("JIRA_URL") or "").strip().rstrip("/") or None
    enabled_raw = (os.environ.get("JIRA_ENABLED") or "").strip().lower()
    enabled = bool(url) and enabled_raw in ("1", "true", "yes")
    if not url:
        status = "not_configured"
        message = (
            "Задайте JIRA_URL в .env (и JIRA_ENABLED=1). "
            "PAT не хранится на диске — только в сессии."
        )
    elif not enabled:
        status = "disabled"
        message = (
            "JIRA_URL задан, но JIRA_ENABLED выключен. "
            "Включите флаг, чтобы открыть sync-preview."
        )
    else:
        status = "ready"
        message = (
            "Backend готов принимать PAT и проксировать read-only Jira REST. "
            "Live sync ещё не подключён."
        )
    return {
        "status": status,
        "configured": bool(url),
        "enabled": enabled,
        "mode": "read_only",
        "jiraUrl": url,
        "sessionAuth": "personal_pat",
        "writeBack": False,
        "message": message,
        "endpoints": {
            "status": "GET /api/jira/status",
            "session": "POST /api/jira/session · DELETE /api/jira/session",
            "syncPreview": "GET /api/jira/sync-preview",
        },
    }


@app.get("/api/health")
async def health():
    db_ok = await ping_db()
    return JSONResponse(
        status_code=200 if db_ok else 503,
        content={"ok": db_ok, "storage": get_storage_mode()},
    )


@app.get("/api/jira/status")
async def jira_status():
    return _jira_status()


@app.post("/api/jira/session")
async def jira_session_create(request: Request):
    try:
        body: Any = await request.json()
    except Exception:
        body = {}
    token = str((body or {}).get("token") or "").strip()
    if not token:
        return JSONResponse(status_code=400, content={"ok": False, "error": "token required"})
    status = _jira_status()
    if not status["enabled"]:
        return JSONResponse(
            status_code=503,
            content={
                "ok": False,
                "error": "Jira not configured (set JIRA_URL and JIRA_ENABLED=1)",
            },
        )
    return JSONResponse(
        status_code=501,
        content={
            "ok": False,
            "error": "Session store not implemented yet",
            "hint": "Next: in-memory session keyed by cookie; never write PAT to disk/logs.",
        },
    )


@app.delete("/api/jira/session")
async def jira_session_clear():
    return {"ok": True, "cleared": False, "hint": "No active session store yet"}


@app.get("/api/jira/sync-preview")
async def jira_sync_preview():
    status = _jira_status()
    reason = (
        "Live Jira REST ещё не подключён — сначала POST /api/jira/session с PAT."
        if status["enabled"]
        else "Интеграция выключена (нужны JIRA_URL и JIRA_ENABLED=1)."
    )
    return JSONResponse(
        status_code=503,
        content={
            "ok": False,
            "reason": reason,
            "mapping": {
                "project": "Issue type «Проект» / контейнер VI Planer project",
                "functionality": "Issue type «Функциональность» → WorkItem",
                "jiraKey": "issue.key → колонка Реестра",
                "status": "status.name → ItemStatus (маппинг таблицей)",
                "assignee": "assignee → роль/исполнитель (опционально)",
                "targetStart": "customfield Target start → workStartDate",
                "targetEnd": "customfield Target end → baseline/actual finish",
            },
            "items": [],
        },
    )


async def _read_state_payload():
    try:
        state = await get_state()
        updated_at = await get_updated_at()
        return {"state": state, "updatedAt": updated_at}
    except Exception as err:
        print(f"GET /api/state failed: {err}")
        return JSONResponse(
            status_code=500, content={"error": "Failed to load state"}
        )


async def _write_state_payload(request: Request):
    try:
        body: Any = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400, content={"error": "Invalid state payload"}
        )
    normalized = normalize_state(body)
    if not normalized:
        return JSONResponse(
            status_code=400, content={"error": "Invalid state payload"}
        )
    try:
        updated_at = await set_state(normalized)
        return {"ok": True, "updatedAt": updated_at}
    except Exception as err:
        print(f"PUT /api/state failed: {err}")
        return JSONResponse(
            status_code=500, content={"error": "Failed to save state"}
        )


@app.get("/api/state")
async def read_state():
    return await _read_state_payload()


@app.put("/api/state")
async def write_state(request: Request):
    return await _write_state_payload(request)


@app.get("/api/state/v2")
async def read_state_v2():
    return await _read_state_payload()


@app.put("/api/state/v2")
async def write_state_v2(request: Request):
    return await _write_state_payload(request)


@app.get("/api/state/{edition}")
async def read_state_edition(edition: str):
    return JSONResponse(status_code=404, content={"error": "Unknown edition"})


@app.put("/api/state/{edition}")
async def write_state_edition(edition: str, request: Request):
    return JSONResponse(status_code=404, content={"error": "Unknown edition"})


if DIST_DIR.is_dir():
    # html=True → missing paths fall back to index.html (SPA), like Express.
    app.mount(
        "/",
        StaticFiles(directory=str(DIST_DIR), html=True),
        name="frontend",
    )


def main() -> None:
    import uvicorn

    print(f"VI Planer (Python) listening on http://{HOST}:{PORT}")
    uvicorn.run(
        "server_py.main:app",
        host=HOST,
        port=PORT,
        reload=False,
    )


if __name__ == "__main__":
    main()
