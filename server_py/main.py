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
                "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        )
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = CORS_ORIGIN
    response.headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.get("/api/health")
async def health():
    db_ok = await ping_db()
    return JSONResponse(
        status_code=200 if db_ok else 503,
        content={"ok": db_ok, "storage": get_storage_mode()},
    )


@app.get("/api/state")
async def read_state():
    try:
        state = await get_state()
        updated_at = await get_updated_at()
        return {"state": state, "updatedAt": updated_at}
    except Exception as err:
        print(f"GET /api/state failed: {err}")
        return JSONResponse(
            status_code=500, content={"error": "Failed to load state"}
        )


@app.put("/api/state")
async def write_state(request: Request):
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
