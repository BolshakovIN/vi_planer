/**
 * Store identity for the live planner SPA.
 * Cloud row `v2`, localStorage `vi-planer-v2`, API `/api/state/v2`.
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

/** One-shot migration stamps on AppState (legacy stored value was `"v1"`). */
export const MIGRATION_CLEARED_DEMAND_TEAMS = "done";
export const MIGRATION_SEEDED_TEAM_ROSTER = "done";

/** True if stamp already applied (current or legacy value). */
export function migrationStampDone(
  value: string | undefined,
  stamp: string
): boolean {
  return value === stamp || value === "v1";
}

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
