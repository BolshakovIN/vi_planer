import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  AppState,
  applyClearedDemandTeams,
  applyComputedTeamCapacities,
  applySeededTeamRoster,
  mergeMissingSeedItems,
  applyLocalDeletionTombstones,
  CLEARED_DEMAND_TEAMS_V1,
  ensureUniquePriorities,
  ensureStateAssignmentRoles,
  normalizeState,
  prependChangeLog,
  rememberDeletedIds,
  SEEDED_TEAM_ROSTER_V1,
  syncTeamRoster,
  teamCatalogHasRoster,
  type Team,
} from "./model";
import {
  SEED,
  PORTFOLIO_PACK_ID,
  PORTFOLIO_PACK_ROLLED_BACK,
} from "./seed";

/** v2-only snapshot. Frozen v1 keeps `vi-planer-v3` and never reads this key. */
const STORAGE_KEY = "vi-planer-v2";
/** v1 / pre-split shared key — v2 must not load or save it after bootstrap. */
const V1_STORAGE_KEY = "vi-planer-v3";
const SUPABASE_ROW_ID = "v2";
const PORTFOLIO_BACKUP_KEY = "vi-planer-v2-pre-xlsx-prio";
const TEAMS_BACKUP_KEY = "vi-planer-v2-teams";
const API_STATE_PATH = "/api/state/v2";

export type SyncStatus = "idle" | "loading" | "saved" | "error" | "offline";

let syncStatus: SyncStatus = "idle";
let syncListeners: Array<(status: SyncStatus) => void> = [];

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void) {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
}

function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
  syncListeners.forEach((l) => l(status));
}

function parseStoredState(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const normalized = normalizeState(JSON.parse(raw));
    if (!normalized) return null;
    return {
      ...normalized,
      items: ensureUniquePriorities(normalized.items, normalized.sizeRanges),
    };
  } catch {
    return null;
  }
}

function loadLocal(): AppState | null {
  try {
    return parseStoredState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeTeamsBackup(state: AppState) {
  if (!teamCatalogHasRoster(state.teams)) return;
  try {
    localStorage.setItem(TEAMS_BACKUP_KEY, JSON.stringify(state.teams));
  } catch {
    /* quota */
  }
}

function loadTeamsBackup(): Team[] | null {
  try {
    const raw = localStorage.getItem(TEAMS_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    const teams = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { teams?: unknown }).teams)
        ? (parsed as { teams: unknown[] }).teams
        : null;
    if (!teams) return null;
    const normalized = normalizeState({
      version: 3,
      teams,
      items: [],
      startDate: SEED.startDate,
      sizeRanges: SEED.sizeRanges,
    });
    if (!normalized || !teamCatalogHasRoster(normalized.teams)) return null;
    return applyComputedTeamCapacities(
      normalized.teams.map((t) =>
        syncTeamRoster({ ...t, members: t.members ?? [] })
      )
    );
  } catch {
    return null;
  }
}

function saveLocal(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  writeTeamsBackup(state);
}

function apiBase(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  return url ? url.replace(/\/$/, "") : "";
}

function isPagesStandalone(): boolean {
  const v = import.meta.env.VITE_LOCAL_STORAGE_ONLY;
  return v === "1" || v === "true";
}

function usesRemoteApi(): boolean {
  if (isPagesStandalone()) return false;
  return Boolean(apiBase()) || import.meta.env.PROD;
}

async function loadFromApi(): Promise<AppState | null> {
  if (isPagesStandalone()) return null;
  try {
    const res = await fetch(`${apiBase()}${API_STATE_PATH}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { state?: unknown };
    const normalized = normalizeState(json.state);
    if (!normalized) return null;
    return {
      ...normalized,
      items: ensureUniquePriorities(normalized.items, normalized.sizeRanges),
    };
  } catch {
    return null;
  }
}

async function saveToApi(state: AppState): Promise<boolean> {
  if (isPagesStandalone()) return false;
  try {
    const res = await fetch(`${apiBase()}${API_STATE_PATH}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadFromSupabase(): Promise<AppState | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("app_state")
      .select("payload")
      .eq("id", SUPABASE_ROW_ID)
      .maybeSingle();
    if (error || !data?.payload) return null;
    const normalized = normalizeState(data.payload);
    if (!normalized) return null;
    return {
      ...normalized,
      items: ensureUniquePriorities(normalized.items, normalized.sizeRanges),
    };
  } catch {
    return null;
  }
}

async function saveToSupabase(state: AppState): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from("app_state").upsert({
      id: SUPABASE_ROW_ID,
      payload: state,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export function hasPortfolioPackBackup(): boolean {
  try {
    return Boolean(localStorage.getItem(PORTFOLIO_BACKUP_KEY));
  } catch {
    return false;
  }
}

function writePortfolioBackup(state: AppState) {
  try {
    if (localStorage.getItem(PORTFOLIO_BACKUP_KEY)) return;
    localStorage.setItem(PORTFOLIO_BACKUP_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

/** Replace live portfolio with the Oct-2026 xlsx pack (once, unless re-applied). */
export function applyCurrentPortfolioPack(
  current: AppState,
  opts: { force?: boolean } = {}
): { state: AppState; applied: boolean } {
  const pack = current.portfolioPack;
  if (!opts.force && pack === PORTFOLIO_PACK_ID) {
    return { state: current, applied: false };
  }
  if (!opts.force && pack === PORTFOLIO_PACK_ROLLED_BACK) {
    return { state: current, applied: false };
  }
  // Older packs (v1, PREV/v2, …) fully replace with current seed so team assignments stay correct.
  writePortfolioBackup(current);
  try {
    localStorage.setItem("vi-planer-schedule-mode", "manual");
  } catch {
    /* ignore */
  }
  const next = ensureStateAssignmentRoles(structuredClone(SEED));
  next.demoVariantA = current.demoVariantA;
  next.demoVariantB = false;
  next.changeLog = prependChangeLog(
    current.changeLog,
    "Загружен портфель из таблицы приоритезации (старт 01.10.2026)",
    "system"
  );
  next.portfolioPack = PORTFOLIO_PACK_ID;
  // Pack replaces portfolio items, not the Команды role—ФИО catalog.
  // Do not coerce missing members to [] — that blocks one-shot FIO re-seed.
  if (current.teams.length) {
    next.teams = applyComputedTeamCapacities(
      current.teams.map((t) => syncTeamRoster({ ...t }))
    );
    if (current.teamRosterSeeded) {
      next.teamRosterSeeded = current.teamRosterSeeded;
    }
  }
  return { state: next, applied: true };
}

export function rollbackPortfolioPack(): AppState | null {
  try {
    const raw = localStorage.getItem(PORTFOLIO_BACKUP_KEY);
    if (!raw) return null;
    const normalized = normalizeState(JSON.parse(raw));
    if (!normalized) return null;
    normalized.portfolioPack = PORTFOLIO_PACK_ROLLED_BACK;
    normalized.changeLog = prependChangeLog(
      normalized.changeLog,
      "Откат загрузки приоритезации — восстановлены данные до таблицы",
      "system"
    );
    return {
      ...normalized,
      items: ensureUniquePriorities(normalized.items, normalized.sizeRanges),
    };
  } catch {
    return null;
  }
}

/**
 * First v2 load after the store split: never read the live v1 cloud row.
 * Adopt the old shared local blob only when it still has a v2 role—ФИО catalog.
 * Otherwise re-seed default teams and keep deletion / demand-clear flags.
 */
function bootstrapV2State(local: AppState | null, remote: AppState | null): {
  base: AppState;
  tombstoneSource: AppState | null;
  isolated: boolean;
} {
  if (remote || local) {
    return {
      base: (remote ?? local) as AppState,
      tombstoneSource: local,
      isolated: false,
    };
  }

  let legacy: AppState | null = null;
  try {
    legacy = parseStoredState(localStorage.getItem(V1_STORAGE_KEY));
  } catch {
    legacy = null;
  }

  if (legacy && teamCatalogHasRoster(legacy.teams)) {
    return { base: legacy, tombstoneSource: legacy, isolated: true };
  }

  const seed = ensureStateAssignmentRoles(structuredClone(SEED));
  const backedTeams = loadTeamsBackup();
  if (backedTeams) {
    seed.teams = backedTeams;
    seed.teamRosterSeeded = SEEDED_TEAM_ROSTER_V1;
    seed.changeLog = prependChangeLog(
      seed.changeLog,
      "Восстановлен каталог команд роль—ФИО из резервной копии v2",
      "team"
    );
  } else if (legacy) {
    seed.changeLog = prependChangeLog(
      seed.changeLog,
      "Восстановлен каталог команд роль—ФИО; хранилища v1 и v2 разделены",
      "team"
    );
  }
  if (legacy) {
    seed.deletedItemIds = rememberDeletedIds(
      seed.deletedItemIds,
      legacy.deletedItemIds ?? []
    );
    seed.deletedProjectKeys = rememberDeletedIds(
      seed.deletedProjectKeys,
      legacy.deletedProjectKeys ?? []
    );
    seed.clearedDemandTeams = CLEARED_DEMAND_TEAMS_V1;
    seed.demoVariantA = legacy.demoVariantA;
  }
  return { base: seed, tombstoneSource: legacy, isolated: true };
}

export async function loadState(): Promise<AppState> {
  setSyncStatus("loading");

  const local = loadLocal();
  const remote = (await loadFromApi()) ?? (await loadFromSupabase());
  const { base, tombstoneSource, isolated } = bootstrapV2State(local, remote);

  const packed = applyCurrentPortfolioPack(base);
  const tombstoned = applyLocalDeletionTombstones(packed.state, tombstoneSource);
  const cleared = applyClearedDemandTeams(tombstoned.state);
  const roster = applySeededTeamRoster(cleared.state);
  const merged = mergeMissingSeedItems(roster.state, SEED.items);
  const state = merged.state;
  if (
    isolated ||
    packed.applied ||
    tombstoned.applied ||
    cleared.applied ||
    roster.applied ||
    merged.applied
  ) {
    saveState(state);
  } else {
    saveLocal(state);
    setSyncStatus(getSupabase() || usesRemoteApi() ? "saved" : "idle");
  }
  return state;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: AppState | null = null;
let savingRemote = false;

function scheduleRemoteSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void flushPendingSave();
  }, 350);
}

async function flushPendingSave() {
  if (savingRemote) return;
  const payload = pendingState;
  if (!payload) return;
  pendingState = null;
  savingRemote = true;
  setSyncStatus("loading");
  try {
    const supabaseOk = await saveToSupabase(payload);
    const apiOk = supabaseOk ? true : await saveToApi(payload);
    if (pendingState) return;
    if (supabaseOk || apiOk) {
      setSyncStatus("saved");
      return;
    }
    if (getSupabase() || usesRemoteApi()) {
      setSyncStatus("offline");
    } else {
      setSyncStatus("idle");
    }
  } finally {
    savingRemote = false;
    if (pendingState) scheduleRemoteSave();
  }
}

export function saveState(state: AppState) {
  const payload = ensureStateAssignmentRoles(state);
  saveLocal(payload);
  pendingState = payload;
  scheduleRemoteSave();
}

export function syncStatusLabel(status: SyncStatus): string {
  switch (status) {
    case "loading":
      return "Сохранение…";
    case "saved":
      return "Сохранено в облаке";
    case "error":
      return "Ошибка сохранения";
    case "offline":
      return "Только локально";
    default:
      return "Локально";
  }
}
