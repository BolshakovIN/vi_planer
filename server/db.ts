import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { SEED } from "../src/seed.ts";
import { normalizeState, type AppState } from "../src/model.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROW_ID = "main";

const dataDir = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");
const stateFile =
  process.env.STATE_FILE ?? path.join(dataDir, "vi-planer-state.json");

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
    console.log(`Storage: file (${stateFile})`);
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
  await pool.query(
    `INSERT INTO app_state (id, payload, updated_at)
     VALUES ($1, '{}'::jsonb, 0)
     ON CONFLICT (id) DO NOTHING`,
    [ROW_ID],
  );

  storageMode = "postgres";
  console.log("Storage: PostgreSQL");
}

function readFile(): StoredState | null {
  if (!fs.existsSync(stateFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8")) as StoredState;
  } catch {
    return null;
  }
}

function writeFile(state: AppState, updatedAt: number) {
  const tmp = `${stateFile}.tmp`;
  fs.writeFileSync(
    tmp,
    JSON.stringify({ state, updatedAt } satisfies StoredState, null, 2),
    "utf8",
  );
  fs.renameSync(tmp, stateFile);
}

async function readPostgres(): Promise<StoredState | null> {
  if (!pool) return null;
  const { rows } = await pool.query<{ payload: unknown; updated_at: string }>(
    "SELECT payload, updated_at FROM app_state WHERE id = $1",
    [ROW_ID],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    state: row.payload as AppState,
    updatedAt: Number(row.updated_at),
  };
}

async function writePostgres(state: AppState, updatedAt: number) {
  if (!pool) throw new Error("PostgreSQL pool not initialized");
  await pool.query(
    `INSERT INTO app_state (id, payload, updated_at)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (id) DO UPDATE
     SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
    [ROW_ID, JSON.stringify(state), updatedAt],
  );
}

async function readStored(): Promise<StoredState | null> {
  if (storageMode === "postgres") return readPostgres();
  return readFile();
}

async function writeStored(state: AppState, updatedAt: number) {
  if (storageMode === "postgres") {
    await writePostgres(state, updatedAt);
    return;
  }
  writeFile(state, updatedAt);
}

function seedState(): AppState {
  return structuredClone(SEED);
}

export async function getState(): Promise<AppState> {
  const stored = await readStored();
  if (!stored) {
    const seed = seedState();
    await setState(seed);
    return seed;
  }
  const normalized = normalizeState(stored.state);
  if (!normalized) {
    const seed = seedState();
    await setState(seed);
    return seed;
  }
  return normalized;
}

export async function setState(state: AppState): Promise<number> {
  const updatedAt = Date.now();
  await writeStored(state, updatedAt);
  return updatedAt;
}

export async function getUpdatedAt(): Promise<number> {
  const stored = await readStored();
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
