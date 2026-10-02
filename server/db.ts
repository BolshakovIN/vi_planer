import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { SEED } from "../src/seed.ts";
import {
  applyClearedDemandTeams,
  normalizeState,
  type AppState,
} from "../src/model.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type StateEdition = "v1" | "v2";

const ROW_IDS: Record<StateEdition, string> = {
  v1: "main",
  v2: "v2",
};

const dataDir = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");

function stateFileFor(edition: StateEdition): string {
  if (edition === "v2") {
    return (
      process.env.STATE_FILE_V2 ??
      path.join(dataDir, "vi-planer-state-v2.json")
    );
  }
  return process.env.STATE_FILE ?? path.join(dataDir, "vi-planer-state.json");
}

interface StoredState {
  state: AppState;
  updatedAt: number;
}

let pool: pg.Pool | null = null;
let storageMode: "postgres" | "file" = "file";

function usePostgres(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getStorageMode(): "postgres" | "file" {
  return storageMode;
}

export async function initDb(): Promise<void> {
  if (!usePostgres()) {
    fs.mkdirSync(dataDir, { recursive: true });
    storageMode = "file";
    console.log(`Storage: file (${stateFileFor("v1")}, ${stateFileFor("v2")})`);
    return;
  }

  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.PGSSLMODE === "disable"
        ? false
        : { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY DEFAULT 'main',
      payload JSONB NOT NULL,
      updated_at BIGINT NOT NULL
    )
  `);
  for (const id of Object.values(ROW_IDS)) {
    await pool.query(
      `INSERT INTO app_state (id, payload, updated_at)
       VALUES ($1, '{}'::jsonb, 0)
       ON CONFLICT (id) DO NOTHING`,
      [id],
    );
  }

  storageMode = "postgres";
  console.log("Storage: PostgreSQL");
}

function readFile(edition: StateEdition): StoredState | null {
  const stateFile = stateFileFor(edition);
  if (!fs.existsSync(stateFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8")) as StoredState;
  } catch {
    return null;
  }
}

function writeFile(edition: StateEdition, state: AppState, updatedAt: number) {
  const stateFile = stateFileFor(edition);
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  const tmp = `${stateFile}.tmp`;
  fs.writeFileSync(
    tmp,
    JSON.stringify({ state, updatedAt } satisfies StoredState, null, 2),
    "utf8",
  );
  fs.renameSync(tmp, stateFile);
}

async function readPostgres(edition: StateEdition): Promise<StoredState | null> {
  if (!pool) return null;
  const { rows } = await pool.query<{ payload: unknown; updated_at: string }>(
    "SELECT payload, updated_at FROM app_state WHERE id = $1",
    [ROW_IDS[edition]],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    state: row.payload as AppState,
    updatedAt: Number(row.updated_at),
  };
}

async function writePostgres(
  edition: StateEdition,
  state: AppState,
  updatedAt: number,
) {
  if (!pool) throw new Error("PostgreSQL pool not initialized");
  await pool.query(
    `INSERT INTO app_state (id, payload, updated_at)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (id) DO UPDATE
     SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
    [ROW_IDS[edition], JSON.stringify(state), updatedAt],
  );
}

async function readStored(edition: StateEdition): Promise<StoredState | null> {
  if (storageMode === "postgres") return readPostgres(edition);
  return readFile(edition);
}

async function writeStored(
  edition: StateEdition,
  state: AppState,
  updatedAt: number,
) {
  if (storageMode === "postgres") {
    await writePostgres(edition, state, updatedAt);
    return;
  }
  writeFile(edition, state, updatedAt);
}

function seedState(): AppState {
  return structuredClone(SEED);
}

export async function getState(
  edition: StateEdition = "v1",
): Promise<AppState> {
  const stored = await readStored(edition);
  if (!stored) {
    const seed = seedState();
    await setState(seed, edition);
    return seed;
  }
  const normalized = normalizeState(stored.state);
  if (!normalized) {
    const seed = seedState();
    await setState(seed, edition);
    return seed;
  }
  const { state, applied } = applyClearedDemandTeams(normalized);
  if (applied) await setState(state, edition);
  return state;
}

export async function setState(
  state: AppState,
  edition: StateEdition = "v1",
): Promise<number> {
  const updatedAt = Date.now();
  await writeStored(edition, state, updatedAt);
  return updatedAt;
}

export async function getUpdatedAt(
  edition: StateEdition = "v1",
): Promise<number> {
  const stored = await readStored(edition);
  return stored?.updatedAt ?? 0;
}

export async function pingDb(): Promise<boolean> {
  if (storageMode === "file") return true;
  if (!pool) return false;
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
