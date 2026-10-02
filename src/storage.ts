import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  AppState,
  applyClearedDemandTeams,
  applyComputedTeamCapacities,
  applySeededTeamRoster,
  mergeMissingSeedItems,
  applyLocalDeletionTombstones,
  migrateLegacyCatalogRoles,
  CLEARED_DEMAND_TEAMS_V1,
  ensureUniquePriorities,
  ensureStateAssignmentRoles,
  mergeLiveV2States,
  normalizeState,
  prependChangeLog,
  SEEDED_TEAM_ROSTER_V1,
  syncTeamRoster,
  teamCatalogHasRoster,
  localV2BeatsRemote,
  v2StateWouldShrink,
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
    return normalizeState(JSON.parse(raw));
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
  if ((STORAGE_KEY as string) === V1_STORAGE_KEY) {
    throw new Error("v2 refused to write the v1 store");
  }
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
    return normalized;
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
    return normalized;
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

/**
 * Auto-load never replaces a live portfolio. Missing pack id is stamped only.
 * Explicit force still keeps Команды, demand assignments, and user ranks.
 */
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
  const hasUserPortfolio = current.items.length > 0 || current.teams.length > 0;
  if (!opts.force && hasUserPortfolio) {
    if (pack === PORTFOLIO_PACK_ID) {
      return { state: current, applied: false };
    }
    return {
      state: { ...current, portfolioPack: PORTFOLIO_PACK_ID },
      applied: pack !== PORTFOLIO_PACK_ID,
    };
  }

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
  next.clearedDemandTeams =
    current.clearedDemandTeams ?? next.clearedDemandTeams;
  if (current.teams.length) {
    next.teams = applyComputedTeamCapacities(
      current.teams.map((t) => syncTeamRoster({ ...t }))
    );
    if (current.teamRosterSeeded) {
      next.teamRosterSeeded = current.teamRosterSeeded;
    }
  }
  if (current.items.length) {
    const live = new Map(current.items.map((item) => [item.id, item]));
    next.items = next.items.map((item) => {
      const mine = live.get(item.id);
      if (!mine) return item;
      return {
        ...item,
        assignments: mine.assignments.length ? mine.assignments : item.assignments,
        manualRank: mine.manualRank ?? item.manualRank,
      };
    });
    const seedIds = new Set(next.items.map((item) => item.id));
    next.items = [
      ...next.items,
      ...current.items.filter((item) => !seedIds.has(item.id)),
    ];
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
 * Empty v2 restores the v2 teams backup only — never copies v1 items.
 */
function bootstrapV2State(local: AppState | null, remote: AppState | null): {
  base: AppState;
  tombstoneSource: AppState | null;
  isolated: boolean;
} {
  if (local && remote) {
    return {
      base: mergeLiveV2States(local, remote),
      tombstoneSource: local,
      isolated: false,
    };
  }
  if (local || remote) {
    return {
      base: (local ?? remote) as AppState,
      tombstoneSource: local,
      isolated: false,
    };
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
  }
  seed.clearedDemandTeams = CLEARED_DEMAND_TEAMS_V1;
  return { base: seed, tombstoneSource: null, isolated: true };
}

function restoreTeamsBackupIfEmpty(state: AppState): AppState {
  if (teamCatalogHasRoster(state.teams) || state.teams.length > 0) {
    return state;
  }
  const backed = loadTeamsBackup();
  if (!backed) return state;
  return {
    ...state,
    teams: backed,
    teamRosterSeeded: SEEDED_TEAM_ROSTER_V1,
  };
}

/** Load pipeline used by the app and the persist regression. */
export function hydrateV2State(
  local: AppState | null,
  remote: AppState | null
): AppState {
  const { base, tombstoneSource } = bootstrapV2State(local, remote);
  const packed = applyCurrentPortfolioPack(base);
  const tombstoned = applyLocalDeletionTombstones(packed.state, tombstoneSource);
  const cleared = applyClearedDemandTeams(tombstoned.state);
  const roster = applySeededTeamRoster(cleared.state);
  const merged = mergeMissingSeedItems(roster.state, SEED.items);
  const roles = migrateLegacyCatalogRoles(merged.state);
  const restored = restoreTeamsBackupIfEmpty(roles.state);
  if (local && v2StateWouldShrink(restored, local)) {
    return mergeLiveV2States(local, restored);
  }
  return restored;
}

export async function loadState(): Promise<AppState> {
  setSyncStatus("loading");

  const local = loadLocal();
  const remote = (await loadFromApi()) ?? (await loadFromSupabase());
  const state = hydrateV2State(local, remote);
  if (v2StateWouldShrink(state, local)) {
    const kept = local ? mergeLiveV2States(local, state) : state;
    saveLocal(kept);
    setSyncStatus(getSupabase() || usesRemoteApi() ? "saved" : "idle");
    return kept;
  }
  const isolated = !local && !remote;
  const healRemote = Boolean(local && remote && localV2BeatsRemote(local, remote));
  const stampFlags =
    isolated ||
    !local ||
    local.clearedDemandTeams !== state.clearedDemandTeams ||
    local.teamRosterSeeded !== state.teamRosterSeeded ||
    local.portfolioPack !== state.portfolioPack;
  if (healRemote || stampFlags) {
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
  const payload = ensureStateAssignmentRoles({
    ...state,
    savedAt: new Date().toISOString(),
  });
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
