"""Storage: PostgreSQL via DATABASE_URL, or JSON file fallback (mirrors server/db.ts)."""

from __future__ import annotations

import json
import os
import ssl
import time
from pathlib import Path
from typing import Any, Literal, Optional

import asyncpg

from .normalize import normalize_state

CLOUD_ROW_ID = "v2"
ROOT = Path(__file__).resolve().parent.parent

DATA_DIR = Path(os.environ.get("DATA_DIR", str(ROOT / "data")))


def state_file() -> Path:
    return Path(
        os.environ.get(
            "STATE_FILE_V2",
            os.environ.get("STATE_FILE", str(DATA_DIR / "vi-planer-state-v2.json")),
        )
    )


StorageMode = Literal["postgres", "file"]

_pool: Optional[asyncpg.Pool] = None
_storage_mode: StorageMode = "file"


def use_postgres() -> bool:
    return bool(os.environ.get("DATABASE_URL"))


def get_storage_mode() -> StorageMode:
    return _storage_mode


def _ssl_setting():
    if os.environ.get("PGSSLMODE") == "disable":
        return False
    # Match Node: rejectUnauthorized: false for managed Postgres (Railway, etc.)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


async def init_db() -> None:
    global _pool, _storage_mode

    if not use_postgres():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        _storage_mode = "file"
        print(f"Storage: file ({state_file()})")
        return

    database_url = os.environ["DATABASE_URL"]
    if database_url.startswith("postgres://"):
        database_url = "postgresql://" + database_url[len("postgres://") :]

    _pool = await asyncpg.create_pool(
        dsn=database_url,
        ssl=_ssl_setting(),
        min_size=1,
        max_size=5,
    )

    async with _pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
              id TEXT PRIMARY KEY DEFAULT 'v2',
              payload JSONB NOT NULL,
              updated_at BIGINT NOT NULL
            )
            """
        )
        await conn.execute(
            """
            INSERT INTO app_state (id, payload, updated_at)
            VALUES ($1, '{}'::jsonb, 0)
            ON CONFLICT (id) DO NOTHING
            """,
            CLOUD_ROW_ID,
        )

    _storage_mode = "postgres"
    print("Storage: PostgreSQL")


def _read_file() -> Optional[dict[str, Any]]:
    path = state_file()
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return None
        return data
    except Exception:
        return None


def _write_file(state: dict[str, Any], updated_at: int) -> None:
    path = state_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = Path(str(path) + ".tmp")
    payload = {"state": state, "updatedAt": updated_at}
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


async def _read_postgres() -> Optional[dict[str, Any]]:
    if _pool is None:
        return None
    async with _pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT payload, updated_at FROM app_state WHERE id = $1",
            CLOUD_ROW_ID,
        )
    if not row:
        return None
    payload = row["payload"]
    if isinstance(payload, str):
        payload = json.loads(payload)
    return {"state": payload, "updatedAt": int(row["updated_at"])}


async def _write_postgres(state: dict[str, Any], updated_at: int) -> None:
    if _pool is None:
        raise RuntimeError("PostgreSQL pool not initialized")
    async with _pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO app_state (id, payload, updated_at)
            VALUES ($1, $2::jsonb, $3)
            ON CONFLICT (id) DO UPDATE
            SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at
            """,
            CLOUD_ROW_ID,
            json.dumps(state),
            updated_at,
        )


async def _read_stored() -> Optional[dict[str, Any]]:
    if _storage_mode == "postgres":
        return await _read_postgres()
    return _read_file()


async def _write_stored(state: dict[str, Any], updated_at: int) -> None:
    if _storage_mode == "postgres":
        await _write_postgres(state, updated_at)
        return
    _write_file(state, updated_at)


async def get_state() -> Optional[dict[str, Any]]:
    stored = await _read_stored()
    if not stored:
        return None
    return normalize_state(stored.get("state"))


async def set_state(state: dict[str, Any]) -> int:
    updated_at = int(time.time() * 1000)
    await _write_stored(state, updated_at)
    return updated_at


async def get_updated_at() -> int:
    stored = await _read_stored()
    if not stored:
        return 0
    return int(stored.get("updatedAt") or 0)


async def ping_db() -> bool:
    if _storage_mode == "file":
        return True
    if _pool is None:
        return False
    try:
        async with _pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return True
    except Exception:
        return False
