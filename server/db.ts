import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEED } from "../src/seed.ts";
import { normalizeState, type AppState } from "../src/model.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR ?? path.join(__dirname, "..", "data");
const stateFile =
  process.env.STATE_FILE ?? path.join(dataDir, "vi-planer-state.json");

fs.mkdirSync(dataDir, { recursive: true });

interface StoredState {
  state: AppState;
  updatedAt: number;
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

export function getState(): AppState {
  const stored = readFile();
  if (!stored) {
    const seed = structuredClone(SEED);
    setState(seed);
    return seed;
  }
  const normalized = normalizeState(stored.state);
  if (!normalized) {
    const seed = structuredClone(SEED);
    setState(seed);
    return seed;
  }
  return normalized;
}

export function setState(state: AppState): number {
  const updatedAt = Date.now();
  writeFile(state, updatedAt);
  return updatedAt;
}

export function getUpdatedAt(): number {
  return readFile()?.updatedAt ?? 0;
}
