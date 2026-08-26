import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  AppState,
  ensureUniquePriorities,
  normalizeState,
} from "./model";
import { SEED } from "./seed";

const STORAGE_KEY = "vi-planer-v3";
const SUPABASE_ROW_ID = "main";

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
      items: ensureUniquePriorities(normalized.items),
    };
  } catch {
    return null;
  }
}

function saveLocal(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadFromApi(): Promise<AppState | null> {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { state?: unknown };
    const normalized = normalizeState(json.state);
    if (!normalized) return null;
    return {
      ...normalized,
      items: ensureUniquePriorities(normalized.items),
    };
  } catch {
    return null;
  }
}

async function saveToApi(state: AppState): Promise<boolean> {
  try {
    const res = await fetch("/api/state", {
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
      items: ensureUniquePriorities(normalized.items),
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

export async function loadState(): Promise<AppState> {
  setSyncStatus("loading");

  const remote =
    (await loadFromApi()) ??
    (await loadFromSupabase()) ??
    loadLocal() ??
    structuredClone(SEED);

  saveLocal(remote);
  setSyncStatus(getSupabase() || import.meta.env.PROD ? "saved" : "idle");
  return remote;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: AppState | null = null;

export function saveState(state: AppState) {
  saveLocal(state);
  pendingState = state;

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const payload = pendingState;
    pendingState = null;
    if (!payload) return;

    setSyncStatus("loading");
    const supabaseOk = await saveToSupabase(payload);
    const apiOk = supabaseOk ? true : await saveToApi(payload);

    if (supabaseOk || apiOk) {
      setSyncStatus("saved");
      return;
    }

    if (getSupabase() || import.meta.env.PROD) {
      setSyncStatus("offline");
    } else {
      setSyncStatus("idle");
    }
  }, 350);
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
