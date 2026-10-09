/**
 * Store identity for the live planner SPA.
 * Single cloud row (`v2`) and localStorage key (`vi-planer-v2`).
 */

/** Browser snapshot. */
export const V2_LOCAL_STATE_KEY = "vi-planer-v2";

/** Supabase / Postgres `app_state.id`. */
export const V2_CLOUD_ROW_ID = "v2";

/** HTTP API path used by the client. */
export const V2_API_STATE_PATH = "/api/state/v2";

/** One-time portfolio backup before an explicit pack force-load. */
export const V2_PORTFOLIO_BACKUP_KEY = "vi-planer-v2-pre-xlsx-prio";

/** Role—ФИО catalog backup so empty cloud cannot erase Команды. */
export const V2_TEAMS_BACKUP_KEY = "vi-planer-v2-teams";

/** Active UI tab. */
export const V2_UI_TAB_KEY = "vi-planer-v2-ui-tab";

/**
 * One-shot migration stamps stored on AppState.
 * The string `"v1"` is historical (first migrate pass), not a UI edition.
 */
export const MIGRATION_CLEARED_DEMAND_TEAMS = "v1";
export const MIGRATION_SEEDED_TEAM_ROSTER = "v1";

/** @deprecated Use MIGRATION_CLEARED_DEMAND_TEAMS — same stamp value. */
export const CLEARED_DEMAND_TEAMS_V1 = MIGRATION_CLEARED_DEMAND_TEAMS;

/** @deprecated Use MIGRATION_SEEDED_TEAM_ROSTER — same stamp value. */
export const SEEDED_TEAM_ROSTER_V1 = MIGRATION_SEEDED_TEAM_ROSTER;

export function assertV2LocalKey(key: string): void {
  if (key !== V2_LOCAL_STATE_KEY) {
    throw new Error(`refused unexpected local key: ${key}`);
  }
}

export function assertV2CloudRow(id: string): void {
  if (id !== V2_CLOUD_ROW_ID) {
    throw new Error(`refused unexpected cloud row: ${id}`);
  }
}
