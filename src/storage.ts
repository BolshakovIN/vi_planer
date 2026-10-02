import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  AppState,
  applyClearedDemandTeams,
  applyComputedTeamCapacities,
  applySeededTeamRoster,
  ensureUniquePriorities,
  ensureStateAssignmentRoles,
  normalizeState,
  prependChangeLog,
  syncTeamRoster,
} from "./model";
import {
  SEED,
  PORTFOLIO_PACK_ID,
  PORTFOLIO_PACK_ROLLED_BACK,
} from "./seed";

const STORAGE_KEY = "vi-planer-v3";
const SUPABASE_ROW_ID = "main";
const PORTFOLIO_BACKUP_KEY = "vi-planer-v3-pre-xlsx-prio";

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

function loadLocal(): AppState | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem("vi-planer-v2") ??
      localStorage.getItem("vi-planer-v1");
    if (!raw) return null;
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

function saveLocal(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    const res = await fetch(`${apiBase()}/api/state`, { cache: "no-store" });
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
    const res = await fetch(`${apiBase()}/api/state`, {
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
  if (current.teams.length) {
    next.teams = applyComputedTeamCapacities(
      current.teams.map((t) =>
        syncTeamRoster({ ...t, members: t.members ?? [] })
      )
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

export async function loadState(): Promise<AppState> {
  setSyncStatus("loading");

  const remote =
    (await loadFromApi()) ??
    (await loadFromSupabase()) ??
    loadLocal() ??
    ensureStateAssignmentRoles(structuredClone(SEED));

  const packed = applyCurrentPortfolioPack(remote);
  const cleared = applyClearedDemandTeams(packed.state);
  const roster = applySeededTeamRoster(cleared.state);
  const state = roster.state;
  if (packed.applied || cleared.applied || roster.applied) {
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
