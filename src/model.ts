import {
  CLEARED_DEMAND_TEAMS_V1,
  MIGRATION_CLEARED_DEMAND_TEAMS,
  MIGRATION_SEEDED_TEAM_ROSTER,
  SEEDED_TEAM_ROSTER_V1,
} from "./v2Store";

export {
  CLEARED_DEMAND_TEAMS_V1,
  MIGRATION_CLEARED_DEMAND_TEAMS,
  MIGRATION_SEEDED_TEAM_ROSTER,
  SEEDED_TEAM_ROSTER_V1,
};

export type ItemType = "project" | "product";
/**
 * Project status (v2 resource plan).
 * Migration from legacy keys:
 * - idea, ready → staffing (комплектуется)
 * - in_progress → in_progress (в работе)
 * - blocked → paused (на паузе)
 * - done → done (завершен)
 */
export type ItemStatus = "staffing" | "in_progress" | "paused" | "done";

export const ITEM_STATUSES: ItemStatus[] = [
  "staffing",
  "in_progress",
  "paused",
  "done",
];

/** Coerce persisted / legacy status strings to the current enum. */
export function coerceItemStatus(raw: unknown, fallback: ItemStatus = "staffing"): ItemStatus {
  const s = String(raw ?? "");
  if ((ITEM_STATUSES as string[]).includes(s)) return s as ItemStatus;
  // Legacy → new
  if (s === "idea" || s === "ready") return "staffing";
  if (s === "blocked") return "paused";
  if (s === "done") return "done";
  if (s === "in_progress") return "in_progress";
  return fallback;
}

export type TShirtSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export const TSHIRT_SIZES: TShirtSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

/** Working days in a planning week — effort days ÷ this = person-weeks. */
export const WORKING_DAYS_PER_WEEK = 5;

/**
 * T-shirt ranges in calendar days (editable in Settings).
 * XXL is “80+”; 160 is a sane planning cap (double XL).
 */
export const DEFAULT_SIZE_RANGES: Record<TShirtSize, { min: number; max: number }> = {
  XS: { min: 1, max: 5 },
  S: { min: 5, max: 10 },
  M: { min: 10, max: 20 },
  L: { min: 20, max: 40 },
  XL: { min: 40, max: 80 },
  XXL: { min: 80, max: 160 },
};

/** @deprecated use DEFAULT_SIZE_RANGES */
export const SIZE_RANGES = DEFAULT_SIZE_RANGES;

export type SizeRanges = Record<TShirtSize, { min: number; max: number }>;

function cloneSizeRanges(src: SizeRanges): SizeRanges {
  return Object.fromEntries(
    TSHIRT_SIZES.map((sz) => [sz, { ...src[sz] }])
  ) as SizeRanges;
}

/**
 * Old packs stored S/M/L only, in weeks, with max ≤ 8.
 * New ranges are days (XL/XXL max well above 8) — do not divide by 7.
 */
function isLegacyWeekSizeRanges(raw: object): boolean {
  const rec = raw as Record<string, unknown>;
  if (rec.XS != null || rec.XL != null || rec.XXL != null) return false;
  const sml: TShirtSize[] = ["S", "M", "L"];
  let saw = false;
  for (const sz of sml) {
    const row = rec[sz];
    if (!row || typeof row !== "object") continue;
    saw = true;
    const max = Number((row as { max?: unknown }).max);
    if (!Number.isFinite(max) || max > 8) return false;
  }
  return saw;
}

export function normalizeSizeRanges(raw: unknown): SizeRanges {
  const out = cloneSizeRanges(DEFAULT_SIZE_RANGES);
  if (!raw || typeof raw !== "object") return out;
  const rec = raw as Record<string, unknown>;
  for (const sz of TSHIRT_SIZES) {
    const row = rec[sz];
    if (!row || typeof row !== "object") continue;
    const bounds = row as { min?: unknown; max?: unknown };
    let min = Math.round(Number(bounds.min));
    let max = Math.round(Number(bounds.max));
    if (!Number.isFinite(min)) min = out[sz].min;
    if (!Number.isFinite(max)) max = out[sz].max;
    min = Math.max(1, min);
    max = Math.max(min, max);
    out[sz] = { min, max };
  }
  if (isLegacyWeekSizeRanges(rec)) {
    for (const sz of ["S", "M", "L"] as TShirtSize[]) {
      if (rec[sz] == null) continue;
      const min = Math.max(1, out[sz].min * WORKING_DAYS_PER_WEEK);
      const max = Math.max(min, out[sz].max * WORKING_DAYS_PER_WEEK);
      out[sz] = { min, max };
    }
  }
  return out;
}

/** Midpoint of the size range, in calendar days. */
export function sizePlanDays(
  size: TShirtSize,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  const r = ranges[size] ?? DEFAULT_SIZE_RANGES.M;
  return Math.round(((r.min + r.max) / 2) * 10) / 10;
}

/** Planning effort — midpoint days / 5 working days, at least 1 week. */
export function sizePlanWeeks(
  size: TShirtSize,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  const weeks = sizePlanDays(size, ranges) / WORKING_DAYS_PER_WEEK;
  return Math.max(1, Math.round(weeks * 10) / 10);
}

/** Screenshot-style caption: «до 5 дней», «5–10 дней», «80+ дней». */
export function sizePillCaption(
  size: TShirtSize,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string {
  const r = ranges[size] ?? DEFAULT_SIZE_RANGES.M;
  if (size === "XS") return `до ${r.max} дней`;
  if (size === "XXL") return `${r.min}+ дней`;
  return `${r.min}–${r.max} дней`;
}

export function sizeLabel(
  size: TShirtSize,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string {
  const r = ranges[size] ?? DEFAULT_SIZE_RANGES.M;
  if (size === "XS") return `XS (до ${r.max} дн.)`;
  if (size === "XXL") return `XXL (${r.min}+ дн.)`;
  return `${size} (${r.min}–${r.max} дн.)`;
}

export function sizeRangesSummary(ranges: SizeRanges): string {
  return TSHIRT_SIZES.map((sz) => sizeLabel(sz, ranges)).join(", ");
}

export function parseSize(raw: unknown): TShirtSize {
  const s = String(raw ?? "").toUpperCase().trim();
  if ((TSHIRT_SIZES as readonly string[]).includes(s)) return s as TShirtSize;
  if (s === "XXS") return "XS";
  if (s === "XXXL") return "XXL";
  return "M";
}

/**
 * Weekly slot budget for Gantt / queue packing.
 * Always 1 FTE — team headcount is not used for parallel compression.
 */
export const SCHEDULE_CAPACITY_PW = 1;

/** Legacy person-week estimate → nearest t-shirt by planning midpoint. */
export function pwToSize(
  estimatePw: number,
  _ignoredCapacityPw = 1,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): TShirtSize {
  return nearestSizeForEstimatePw(estimatePw, ranges);
}

/** Nearest t-shirt by planning midpoint (person-weeks) */
export function nearestSizeForEstimatePw(
  estimatePw: number,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): TShirtSize {
  const target = Math.max(0.1, estimatePw);
  let best: TShirtSize = "M";
  let bestDist = Infinity;
  for (const sz of TSHIRT_SIZES) {
    const dist = Math.abs(sizePlanWeeks(sz, ranges) - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = sz;
    }
  }
  return best;
}

/**
 * Calendar weeks a size occupies at SCHEDULE_CAPACITY_PW (same fill rule as schedule).
 */
export function calendarWeeksForSize(
  size: TShirtSize,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  const pw = sizePlanWeeks(size, ranges);
  return Math.max(1, Math.ceil(pw / SCHEDULE_CAPACITY_PW - 1e-9));
}

/**
 * Map a dragged/resized Gantt span (inclusive calendar weeks) to the nearest t-shirt
 * — used when the user edits bar length on the timeline.
 */
export function nearestSizeForCalendarWeeks(
  calendarWeeks: number,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): TShirtSize {
  const target = Math.max(1, Math.round(calendarWeeks));
  return nearestSizeForEstimatePw(target * SCHEDULE_CAPACITY_PW, ranges);
}

/** Nearest t-shirt by planning midpoint in calendar days. */
export function nearestSizeFromDays(
  days: number,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): TShirtSize {
  const target = Math.max(1, days);
  let best: TShirtSize = "M";
  let bestDist = Infinity;
  for (const sz of TSHIRT_SIZES) {
    const dist = Math.abs(sizePlanDays(sz, ranges) - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = sz;
    }
  }
  return best;
}

export function parseOptionalDays(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

/** Legacy item-level flag after «Отправить». Prefer assignment `demandStatus`. */
export type DemandStatus = "submitted";

/** Per-assignment потребность status (Черновик / На согласовании / Согласовано). */
export type AssignmentDemandStatus = "draft" | "pending" | "approved";

export const ASSIGNMENT_DEMAND_STATUSES: AssignmentDemandStatus[] = [
  "draft",
  "pending",
  "approved",
];

export const ASSIGNMENT_DEMAND_LABELS: Record<AssignmentDemandStatus, string> = {
  draft: "Черновик",
  pending: "На согласовании",
  approved: "Согласовано",
};

export function parseDemandStatus(raw: unknown): DemandStatus | undefined {
  const s = String(raw ?? "").toLowerCase().trim();
  if (
    s === "submitted" ||
    s === "sent" ||
    s === "отправлено" ||
    s === "на согласовании"
  ) {
    return "submitted";
  }
  return undefined;
}

export function parseAssignmentDemandStatus(
  raw: unknown
): AssignmentDemandStatus | undefined {
  const s = String(raw ?? "").toLowerCase().trim();
  if (!s) return undefined;
  if (
    s === "pending" ||
    s === "submitted" ||
    s === "sent" ||
    s === "на согласовании"
  ) {
    return "pending";
  }
  if (s === "approved" || s === "согласовано") return "approved";
  if (s === "draft" || s === "черновик") return "draft";
  return undefined;
}

export function resolveAssignmentDemandStatus(
  a: TeamAssignment,
  item?: WorkItem
): AssignmentDemandStatus {
  return (
    parseAssignmentDemandStatus(a.demandStatus) ??
    (item?.demandStatus === "submitted" ? "pending" : "draft")
  );
}

export interface TeamMember {
  id: string;
  /** Full ФИО, e.g. «Романов Сергей» */
  name: string;
  /** Catalog role for this seat (Команды row «роль — ФИО»). */
  role: string;
}

export interface Team {
  id: string;
  name: string;
  /**
   * @deprecated Ignored at runtime. Schedule always uses {@link SCHEDULE_CAPACITY_PW}.
   * Accepted on hydrate for older saves; stripped on sync/write.
   */
  capacityPw?: number;
  color: string;
  /** Seats on the team: each row is роль — ФИО. */
  members?: TeamMember[];
  /**
   * Distinct role names present in `members` (kept in sync for older loads).
   * Потребность uses these — not a separate catalog tab.
   */
  roles?: string[];
}

const FIO_LAST_M = [
  "Романов",
  "Иванов",
  "Петров",
  "Соколов",
  "Морозов",
  "Волков",
  "Лебедев",
  "Козлов",
  "Новиков",
  "Павлов",
  "Семёнов",
  "Голубев",
  "Виноградов",
  "Богданов",
  "Воробьёв",
  "Фёдоров",
  "Михайлов",
  "Белов",
  "Тарасов",
  "Киселёв",
];
const FIO_LAST_F = [
  "Романова",
  "Иванова",
  "Петрова",
  "Соколова",
  "Волкова",
  "Соловьёва",
  "Лебедева",
  "Козлова",
  "Новикова",
  "Морозова",
  "Павлова",
  "Кузнецова",
  "Попова",
  "Васильева",
  "Смирнова",
];
const FIO_FIRST_M = [
  "Сергей",
  "Александр",
  "Дмитрий",
  "Андрей",
  "Алексей",
  "Иван",
  "Михаил",
  "Николай",
  "Павел",
  "Егор",
  "Артём",
  "Кирилл",
];
const FIO_FIRST_F = [
  "Анна",
  "Елена",
  "Мария",
  "Ольга",
  "Наталья",
  "Татьяна",
  "Екатерина",
  "Ирина",
  "Светлана",
  "Юлия",
  "Анастасия",
  "Дарья",
];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** «Романов Сергей» → «Романов С.» */
export function shortFio(name: string): string {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[1]!.charAt(0).toUpperCase()}.`;
}

function preferredSeedRoles(teamId: string): string[] {
  const catalog = [...ASSIGNMENT_ROLE_CATALOG];
  const n = teamId.toLowerCase();
  const needle = /архитект/.test(n)
    ? "архитект"
    : /бизнес/.test(n)
      ? "бизнес"
      : /тестир|\bqa\b/.test(n)
        ? "тестир"
        : /разраб/.test(n)
          ? "разраб"
          : /аналит/.test(n)
            ? "аналит"
            : "";
  if (needle) {
    const i = catalog.findIndex((r) =>
      needle === "аналит"
        ? r === "аналитик"
        : r.includes(needle)
    );
    if (i > 0) {
      const [hit] = catalog.splice(i, 1);
      catalog.unshift(hit!);
    }
  }
  return catalog;
}

function roleCycleForTeam(
  teamId: string,
  fallbackRoles?: readonly string[]
): string[] {
  const fromFallback = (fallbackRoles ?? [])
    .map((name) => canonicalizeCatalogRole(name))
    .filter((name): name is string => Boolean(name));
  return fromFallback.length ? fromFallback : preferredSeedRoles(teamId);
}

export function makeSeedTeamMembers(teamId: string): TeamMember[] {
  const h0 = hashString(teamId || "team");
  const n = 3 + (h0 % 4);
  const roles = preferredSeedRoles(teamId);
  const out: TeamMember[] = [];
  const used = new Set<string>();
  for (let i = 0; i < n + 8 && out.length < n; i++) {
    const h = hashString(`${teamId}:${i}:${h0}`);
    const female = (h & 1) === 1;
    const last = female
      ? FIO_LAST_F[h % FIO_LAST_F.length]!
      : FIO_LAST_M[(h >>> 3) % FIO_LAST_M.length]!;
    const first = female
      ? FIO_FIRST_F[(h >>> 7) % FIO_FIRST_F.length]!
      : FIO_FIRST_M[(h >>> 11) % FIO_FIRST_M.length]!;
    const name = `${last} ${first}`;
    if (used.has(name)) continue;
    used.add(name);
    out.push({
      id: `p_${teamId}_${out.length}`,
      name,
      role: roles[out.length % roles.length]!,
    });
  }
  return out;
}

/**
 * Parse saved роль—ФИО rows.
 * Missing / invalid → `undefined` (caller may one-shot seed).
 * Empty array is kept (user deleted every row).
 */
export function parseTeamMembers(
  raw: unknown,
  teamId: string,
  fallbackRoles?: readonly string[]
): TeamMember[] | undefined {
  if (raw == null || !Array.isArray(raw)) return undefined;
  const cycle = roleCycleForTeam(teamId, fallbackRoles);
  const out: TeamMember[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    let id = "";
    let name = "";
    let role = "";
    if (typeof row === "string") {
      name = row.trim();
    } else if (row && typeof row === "object") {
      const rec = row as Record<string, unknown>;
      name = String(rec.name ?? rec.fio ?? rec.title ?? "").trim();
      id = String(rec.id ?? "").trim();
      role = String(rec.role ?? rec.roleName ?? rec.job ?? "").trim();
    }
    if (!name) continue;
    const memberId = id || uid("p");
    if (seen.has(memberId)) continue;
    seen.add(memberId);
    const canonical = migrateStoredRoleLabel(role);
    out.push({
      id: memberId,
      name,
      role: canonical || cycle[out.length % cycle.length]!,
    });
  }
  return out;
}

/** Distinct role names, in first-seen order. */
export function uniqueRoleNames(
  names: readonly string[] | undefined
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of names ?? []) {
    const name = migrateStoredRoleLabel(raw);
    if (!name) continue;
    const key = normalizeAssignmentRoleName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Distinct catalog roles present in роль—ФИО rows, in first-seen order. */
export function uniqueRolesFromMembers(
  members: readonly TeamMember[] | undefined
): string[] {
  return uniqueRoleNames(
    (members ?? []).map(
      (m) => canonicalizeCatalogRole(m.role) ?? m.role.trim()
    )
  );
}

export function syncTeamRoster<T extends Team>(team: T): T {
  if (team.members != null) {
    team.roles = uniqueRolesFromMembers(team.members);
  }
  // Drop legacy capacity field — schedule uses SCHEDULE_CAPACITY_PW only.
  delete (team as { capacityPw?: number }).capacityPw;
  return team;
}

/** Catalog of Потребность roles the user can add to a team. */
export const ASSIGNMENT_ROLE_CATALOG = [
  "бизнес-аналитик",
  "архитектор",
  "аналитик",
  "разработчик",
  "тестировщик",
] as const;

/** Default Потребность roles seeded on each new team assignment. */
export const DEFAULT_ASSIGNMENT_ROLE_NAMES = [
  "аналитик",
  "разработчик",
] as const;

/**
 * Exact old catalog labels → current titles.
 * «бизнес аналитик» / «бизнес-аналитик» share a normalize key (hyphen → space).
 */
const LEGACY_ROLE_RENAMES: Record<string, string> = {
  архитектура: "архитектор",
  аналитика: "аналитик",
  разработка: "разработчик",
  тестирование: "тестировщик",
};

/** One role row nested under a team assignment (Потребность). */
export interface AssignmentRole {
  id: string;
  name: string;
  size?: TShirtSize;
  days?: number;
  demandStatus?: AssignmentDemandStatus;
  workStartDate?: string;
  /** Team member id (Планирование исполнитель). */
  assigneeId?: string;
}

export function normalizeAssignmentRoleName(name: string): string {
  const key = name.trim().toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ");
  return LEGACY_ROLE_RENAMES[key] ?? key;
}

/** Stored Команды / Потребность role label after catalog rename. */
export function migrateStoredRoleLabel(name: string): string {
  return canonicalizeCatalogRole(name) ?? name.trim();
}

/** Persist `role` / `roleId` when the whole string was an old catalog label. */
export function migrateStoredRoleId(id: string): string {
  const key = id.trim().toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ");
  return LEGACY_ROLE_RENAMES[key] ?? id;
}

export function assignmentHasRoleName(
  roles: AssignmentRole[] | undefined,
  name: string
): boolean {
  const key = normalizeAssignmentRoleName(name);
  return (roles ?? []).some(
    (r) => normalizeAssignmentRoleName(r.name) === key
  );
}

export function canonicalizeCatalogRole(name: string): string | null {
  const key = normalizeAssignmentRoleName(name);
  if (!key) return null;
  return (
    ASSIGNMENT_ROLE_CATALOG.find(
      (n) => normalizeAssignmentRoleName(n) === key
    ) ?? null
  );
}

export function teamHasRoleName(
  teamRoles: readonly string[] | undefined,
  name: string
): boolean {
  const key = normalizeAssignmentRoleName(name);
  return (teamRoles ?? []).some(
    (r) => normalizeAssignmentRoleName(r) === key
  );
}

/** Remaining catalog roles not yet on the team (Команды settings). */
export function availableTeamSettingsRoles(
  teamRoles: readonly string[] | undefined
): string[] {
  return ASSIGNMENT_ROLE_CATALOG.filter(
    (name) => !teamHasRoleName(teamRoles, name)
  );
}

/** Remaining team-configured roles not yet on a demand assignment. */
export function availableAssignmentRolesForTeam(
  teamRoles: readonly string[] | undefined,
  used: AssignmentRole[] | undefined
): string[] {
  return uniqueRoleNames(teamRoles).filter(
    (name) => !assignmentHasRoleName(used, name)
  );
}

/**
 * Keep demand roles that still exist on the team (Команды роль—ФИО).
 * Drops leftover seeded catalogs (e.g. the old five-role list).
 */
export function filterAssignmentRolesToTeam(
  roles: AssignmentRole[] | undefined,
  teamRoleNames: readonly string[] | undefined
): AssignmentRole[] {
  if (!roles?.length) return [];
  if (!teamRoleNames?.length) return roles;
  const allowed = uniqueRoleNames(teamRoleNames);
  if (!allowed.length) return roles;
  const seen = new Set<string>();
  const out: AssignmentRole[] = [];
  for (const role of roles) {
    if (!teamHasRoleName(allowed, role.name)) continue;
    const key = normalizeAssignmentRoleName(role.name);
    if (seen.has(key)) continue;
    seen.add(key);
    const catalogName =
      allowed.find((n) => normalizeAssignmentRoleName(n) === key) ?? role.name;
    out.push(catalogName === role.name ? role : { ...role, name: catalogName });
  }
  return out;
}

export function availableAssignmentCatalogRoles(
  roles: AssignmentRole[] | undefined
): string[] {
  return availableAssignmentRolesForTeam(ASSIGNMENT_ROLE_CATALOG, roles);
}

/** Unique roles from Команды роль—ФИО rows; empty if the roster has no rows. */
export function resolveTeamRoleNames(
  team: Pick<Team, "members" | "roles"> | undefined
): string[] {
  if (!team) return [];
  if (team.members != null) return uniqueRolesFromMembers(team.members);
  return uniqueRoleNames(team.roles);
}

/** Keep team role lists in sync with роль—ФИО rows (no capacity side effects). */
export function syncTeamRosters<T extends Team>(teams: T[]): T[] {
  for (const team of teams) syncTeamRoster(team);
  return teams;
}

export function parseTeamRoles(raw: unknown): string[] {
  if (raw == null || !Array.isArray(raw)) {
    return [...DEFAULT_ASSIGNMENT_ROLE_NAMES];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    let name = "";
    if (typeof row === "string") name = row;
    else if (row && typeof row === "object") {
      const rec = row as Record<string, unknown>;
      name = String(rec.name ?? rec.title ?? rec.role ?? "");
    }
    const canonical = canonicalizeCatalogRole(name);
    if (!canonical) continue;
    const key = normalizeAssignmentRoleName(canonical);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(canonical);
  }
  return out;
}

export function makeAssignmentRole(
  name: string,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES,
  extras: Partial<Pick<AssignmentRole, "workStartDate" | "assigneeId">> = {}
): AssignmentRole {
  const size: TShirtSize = "M";
  return {
    id: uid("role"),
    name,
    size,
    days: Math.round(sizePlanDays(size, ranges)),
    demandStatus: "draft" as const,
    ...(extras.workStartDate ? { workStartDate: extras.workStartDate } : {}),
    ...(extras.assigneeId ? { assigneeId: extras.assigneeId } : {}),
  };
}

export function makeAssignmentRolesForTeam(
  teamRoleNames: readonly string[] | undefined,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): AssignmentRole[] {
  return uniqueRoleNames(teamRoleNames).map((name) =>
    makeAssignmentRole(name, ranges)
  );
}

export function makeDefaultAssignmentRoles(
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): AssignmentRole[] {
  return makeAssignmentRolesForTeam(DEFAULT_ASSIGNMENT_ROLE_NAMES, ranges);
}

function parseAssignmentRoleRow(row: unknown): AssignmentRole | null {
  let name = "";
  let id = "";
  let size: TShirtSize | undefined;
  let days: number | undefined;
  let demandStatus: AssignmentDemandStatus | undefined;
  let workStartDate: string | undefined;
  let extraAssigneeId = "";
  if (typeof row === "string") {
    name = row.trim();
  } else if (row && typeof row === "object") {
    const rec = row as Record<string, unknown>;
    name = String(rec.name ?? rec.title ?? rec.role ?? "").trim();
    id = String(rec.id ?? "").trim();
    days = parseOptionalDays(rec.days);
    if (rec.size != null) size = parseSize(rec.size);
    else if (days != null) size = nearestSizeFromDays(days);
    demandStatus = parseAssignmentDemandStatus(rec.demandStatus);
    const startRaw = String(rec.workStartDate ?? "").trim();
    if (startRaw) workStartDate = snapToMonday(startRaw);
    extraAssigneeId = String(rec.assigneeId ?? rec.memberId ?? "").trim();
  }
  if (!name) return null;
  name = migrateStoredRoleLabel(name);
  id = id ? migrateStoredRoleId(id) : "";
  if (!name) return null;
  return {
    id: id || uid("role"),
    name,
    ...(size ? { size } : {}),
    ...(days != null ? { days } : {}),
    ...(demandStatus ? { demandStatus } : {}),
    ...(workStartDate ? { workStartDate } : {}),
    ...(extraAssigneeId ? { assigneeId: extraAssigneeId } : {}),
  };
}

/**
 * Missing / invalid roles → undefined (caller seeds via fillAssignmentRoles).
 * Empty array is kept (user deleted every role).
 */
export function parseAssignmentRoles(raw: unknown): AssignmentRole[] | undefined {
  if (raw == null || !Array.isArray(raw)) return undefined;
  if (raw.length === 0) return [];
  const out: AssignmentRole[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const role = parseAssignmentRoleRow(row);
    if (!role || seen.has(role.id)) continue;
    seen.add(role.id);
    out.push(role);
  }
  return out.length ? out : undefined;
}

export function submittedAssignmentRoles(
  a: TeamAssignment,
  item?: WorkItem
): AssignmentRole[] {
  return (a.roles ?? []).filter(
    (r) => resolveRoleDemandStatus(r, a, item) !== "draft"
  );
}

export function roleJobLabel(roleName: string): string {
  const n = roleName.toLowerCase();
  if (n.includes("архитект")) return "Архитектор";
  if (n.includes("бизнес")) return "Бизнес-аналитик";
  if (n.includes("тестир")) return "Тестировщик";
  if (n.includes("разраб")) return "Разработчик";
  if (n.includes("аналит")) return "Аналитик";
  const trimmed = roleName.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function isArchitectureRole(role: AssignmentRole): boolean {
  return /архитект/i.test(role.name) || role.id === "architecture";
}

export function rolePlanDays(
  role: AssignmentRole,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  const days = parseOptionalDays(role.days);
  if (days != null) return days;
  return sizePlanDays(role.size ?? "M", ranges);
}

export function resolveRoleDemandStatus(
  role: AssignmentRole,
  assignment?: TeamAssignment,
  item?: WorkItem
): AssignmentDemandStatus {
  const own = parseAssignmentDemandStatus(role.demandStatus);
  if (own) return own;
  if (assignment) return resolveAssignmentDemandStatus(assignment, item);
  return "draft";
}

function preferRoleIndexByTeamName(
  roles: AssignmentRole[],
  teamName: string
): number {
  const n = teamName.toLowerCase();
  const needle = /архитект/.test(n)
    ? "архитект"
    : /бизнес/.test(n)
      ? "бизнес"
      : /тестир|\bqa\b/.test(n)
        ? "тестир"
        : /разраб/.test(n)
          ? "разраб"
          : /аналит/.test(n)
            ? "аналит"
            : "";
  if (needle) {
    const i = roles.findIndex((r) =>
      needle === "аналит"
        ? normalizeAssignmentRoleName(r.name) === "аналитик"
        : r.name.toLowerCase().includes(needle)
    );
    if (i >= 0) return i;
  }
  return 0;
}

export function syncAssignmentFromRoles(
  a: TeamAssignment,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): TeamAssignment {
  if (!a.roles?.length) return a;
  const days = a.roles.reduce((sum, role) => sum + rolePlanDays(role, ranges), 0);
  const size = nearestSizeFromDays(Math.max(1, days), ranges);
  const starts = a.roles
    .map((r) => r.workStartDate)
    .filter((s): s is string => Boolean(s));
  const workStartDate = starts.length
    ? starts.reduce((min, s) => (s < min ? s : min))
    : a.workStartDate;
  const statuses = a.roles.map((r) => resolveRoleDemandStatus(r, a));
  const demandStatus = statuses.some((s) => s === "pending")
    ? "pending"
    : statuses.length && statuses.every((s) => s === "approved")
      ? "approved"
      : "draft";
  return { ...a, days, size, workStartDate, demandStatus };
}

/** Seed defaults / fill missing role effort from the parent assignment. */
export function fillAssignmentRoles(
  a: TeamAssignment,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES,
  teamName = "",
  teamRoleNames?: readonly string[]
): TeamAssignment {
  let roles = a.roles;
  if (roles == null) {
    roles = uniqueRoleNames(teamRoleNames).map((name) => ({
      id: uid("role"),
      name,
    }));
  } else {
    roles = roles.map((r) => {
      const name = migrateStoredRoleLabel(r.name);
      const id = migrateStoredRoleId(r.id);
      return name === r.name && id === r.id ? r : { ...r, name, id };
    });
    if (teamRoleNames !== undefined && teamRoleNames.length > 0) {
      roles = filterAssignmentRolesToTeam(roles, teamRoleNames);
    }
  }
  if (!roles.length) return { ...a, roles };
  const defaultDays = Math.round(sizePlanDays("M", ranges));
  const hasRoleDays = roles.some((r) => parseOptionalDays(r.days) != null);
  const inheritDays = parseOptionalDays(a.days);
  const inheritStatus = parseAssignmentDemandStatus(a.demandStatus);
  const prefer = preferRoleIndexByTeamName(roles, teamName);
  const nextRoles = roles.map((r, i) => {
    const keepAssignee = r.assigneeId ? { assigneeId: r.assigneeId } : {};
    const days = parseOptionalDays(r.days);
    const status =
      parseAssignmentDemandStatus(r.demandStatus) ?? inheritStatus ?? "draft";
    if (days != null) {
      return {
        ...r,
        days,
        size: r.size ?? nearestSizeFromDays(days, ranges),
        demandStatus: status,
        workStartDate: r.workStartDate || a.workStartDate,
        ...keepAssignee,
      };
    }
    if (!hasRoleDays && i === prefer && inheritDays != null) {
      return {
        ...r,
        days: inheritDays,
        size: a.size,
        demandStatus: inheritStatus ?? status,
        workStartDate: r.workStartDate || a.workStartDate,
        ...keepAssignee,
      };
    }
    return {
      ...r,
      days: defaultDays,
      size: r.size ?? "M",
      demandStatus: status,
      workStartDate: r.workStartDate || a.workStartDate,
      ...keepAssignee,
    };
  });
  return syncAssignmentFromRoles({ ...a, roles: nextRoles }, ranges);
}

export function ensureAssignmentRoles(a: TeamAssignment): TeamAssignment {
  return fillAssignmentRoles(a);
}

/** Work of one initiative for a specific team (own effort → own ETA) */
export interface TeamAssignment {
  teamId: string;
  /** T-shirt estimate → person-weeks via sizeRanges */
  size: TShirtSize;
  /** Planned earliest start for this team (ISO date, Monday) */
  workStartDate: string;
  /**
   * Editable duration in calendar days (Потребность).
   * When set, this is the effort source of truth; `size` is kept in sync.
   */
  days?: number;
  /** Потребность row status; default Черновик. */
  demandStatus?: AssignmentDemandStatus;
  /** Nested roles under this team; seeded on load / add if missing. */
  roles?: AssignmentRole[];
}

export interface WorkItem {
  id: string;
  title: string;
  type: ItemType;
  /**
   * Product / project container name (UI: «Название проекта / продукта», under Тип).
   * Prefer a plain name («Mobile», «ЛК B2B»). Legacy «… backlog · Name» still works.
   */
  backlog: string;
  /** One or more teams; each has its own remaining effort */
  assignments: TeamAssignment[];
  status: ItemStatus;
  /** Заказчик — UI «Заказчик»; stored as owner */
  owner: string;
  /** Исполнитель — empty if unset */
  assignee: string;
  notes?: string;
  /**
   * Explicit portfolio priority (1 = highest). Unique across items.
   * Drives queue order and Gantt dependencies. null only before ensureUniquePriorities.
   */
  manualRank: number | null;
  /** Чистая прибыль (ЧП) за 12 мес., тыс. руб; null = не задано */
  cashFlow12m: number | null;
  /** Чистая прибыль (ЧП) за 24 мес., тыс. руб; null = не задано */
  cashFlow24m: number | null;
  /** ROI за 12 мес., % (15 = 15%); null = не задано */
  roi12m: number | null;
  /** ROI за 24 мес., %; null = не задано */
  roi24m: number | null;
  /** Срок окупаемости, мес.; null = не задано (из «влияния» / Jira later) */
  paybackMonths: number | null;
  /**
   * Дата начала — Jira created (ISO YYYY-MM-DD). Sync fills later; absent/null = «—».
   */
  startDate?: string | null;
  /**
   * Дата завершения базовая — first-set baseline finish (ISO YYYY-MM-DD).
   * With startDate drives «Срок реализации базовый».
   */
  baselineFinishDate?: string | null;
  /** Потребность: «Отправлено» after submit. Absent = черновик. */
  demandStatus?: DemandStatus;
  /**
   * Registry project-card stub: holds project metadata/priority but is not a
   * functionality. Excluded from «N функц.» and nested rows.
   */
  projectAnchor?: boolean;
}

export function ensureItemAssignmentRoles(
  items: WorkItem[],
  teams: Team[] = []
): WorkItem[] {
  const names = new Map(teams.map((t) => [t.id, t.name]));
  const roleNames = new Map(teams.map((t) => [t.id, resolveTeamRoleNames(t)]));
  return items.map((item) => ({
    ...item,
    assignments: item.assignments.map((a) => {
      const teamRoles = roleNames.get(a.teamId);
      return fillAssignmentRoles(
        a,
        DEFAULT_SIZE_RANGES,
        names.get(a.teamId) ?? "",
        teamRoles?.length ? teamRoles : undefined
      );
    }),
  }));
}

export function ensureStateAssignmentRoles<T extends { items: WorkItem[]; teams?: Team[] }>(
  state: T
): T {
  const teams = syncTeamRosters(
    (state.teams ?? []).map((t) => syncTeamRoster({ ...t }))
  );
  return {
    ...state,
    ...(state.teams ? { teams } : {}),
    items: ensureItemAssignmentRoles(state.items, teams),
  };
}

/** Kind of activity-log entry (optional filter / icon hint). */
export type ChangeLogKind =
  | "item"
  | "priority"
  | "team"
  | "catalog"
  | "notes"
  | "settings"
  | "schedule"
  | "system";

export interface ChangeLogEntry {
  id: string;
  /** ISO timestamp */
  at: string;
  /** Human-readable Russian message */
  message: string;
  kind?: ChangeLogKind;
}

/** Cap persisted activity log to avoid localStorage/cloud bloat. */
export const CHANGE_LOG_MAX = 150;

export interface AppState {
  teams: Team[];
  items: WorkItem[];
  /** Planning start date ISO (Monday) */
  startDate: string;
  /** T-shirt size ranges in calendar days (editable in Settings) */
  sizeRanges: SizeRanges;
  /** Заказчики (picker on work items) */
  customers: string[];
  /** Исполнители (picker on work items) */
  executors: string[];
  /** Проекты (Проекты tab → backlog when type=project) */
  projects: string[];
  /** Продукты (Проекты tab → backlog when type=product) */
  products: string[];
  /**
   * Legacy shared workspace notes (UI removed). Kept for cloud/local load
   * compatibility; value is persisted but unused in the app.
   */
  portfolioNotes: string;
  /** In-app журнал изменений (newest first). */
  changeLog: ChangeLogEntry[];
  /**
   * Which portfolio data pack is loaded.
   * `xlsx-prio-2026-10-v4` — таблица приоритезации; `…-rolled-back` — откат.
   */
  portfolioPack?: string;
  /**
   * One-shot: unlink team assignments from all functionalities so they can be
   * re-assigned on Потребность. `"v1"` after apply (`clearedDemandTeams-v1`).
   */
  clearedDemandTeams?: string;
  /**
   * One-shot: demo роль—ФИО rows were written onto teams that had no roster.
   * After `"v1"`, missing members stay empty — never re-seed on load.
   */
  teamRosterSeeded?: string;
  /**
   * After `"tys"`, cashFlow* values are тыс. руб (not legacy млрд).
   * Prevents re-multiplying on every normalize.
   */
  cashFlowUnit?: "tys";
  /**
   * Work-item ids the user deleted. Seed merge must not resurrect these
   * (x001–x063 or later user-created ids).
   */
  deletedItemIds?: string[];
  /**
   * Project / product container names the user removed. Seed merge must not
   * restore those groups or re-add catalog chips.
   */
  deletedProjectKeys?: string[];
  /** ISO time of last local/cloud save. Used so stale remote cannot replace newer local. */
  savedAt?: string;
  version: 3;
}

/** Deduped id / catalog-key list; empty strings dropped. */
export function rememberDeletedIds(
  existing: readonly string[] | undefined,
  ids: Iterable<string>
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...(existing ?? []), ...ids]) {
    const id = String(raw ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function parseIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return rememberDeletedIds([], raw.map((x) => String(x)));
}

function catalogKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Keep user deletions even when a stale cloud snapshot wins load order.
 * Unions local tombstones, drops those items, and strips deleted catalog names.
 */
export function applyLocalDeletionTombstones(
  current: AppState,
  local: AppState | null
): { state: AppState; applied: boolean } {
  const deletedItemIds = rememberDeletedIds(
    current.deletedItemIds,
    local?.deletedItemIds ?? []
  );
  const deletedProjectKeys = rememberDeletedIds(
    current.deletedProjectKeys,
    local?.deletedProjectKeys ?? []
  );
  const drop = new Set(deletedItemIds);
  const deletedProjects = new Set(
    deletedProjectKeys.map((k) => catalogKey(k)).filter(Boolean)
  );
  const items = current.items.filter((item) => !drop.has(item.id));
  const projects = current.projects.filter((p) => !deletedProjects.has(catalogKey(p)));
  const products = current.products.filter((p) => !deletedProjects.has(catalogKey(p)));
  const applied =
    items.length !== current.items.length ||
    deletedItemIds.length !== (current.deletedItemIds ?? []).length ||
    deletedProjectKeys.length !== (current.deletedProjectKeys ?? []).length ||
    projects.length !== current.projects.length ||
    products.length !== current.products.length;
  if (!applied) return { state: current, applied: false };
  return {
    state: {
      ...current,
      items,
      projects,
      products,
      deletedItemIds,
      deletedProjectKeys,
    },
    applied: true,
  };
}

/** True when at least one Команды row has a роль—ФИО seat. */
export function teamCatalogHasRoster(teams: readonly Team[] | undefined): boolean {
  return (teams ?? []).some((t) => (t.members?.length ?? 0) > 0);
}

/**
 * Stamp the roster flag only. Never write demo FIO onto an existing catalog.
 * Empty `teams: []` stays empty — the load path may restore a backup or seed.
 */
export function applySeededTeamRoster(current: AppState): {
  state: AppState;
  applied: boolean;
} {
  if (current.teamRosterSeeded === MIGRATION_SEEDED_TEAM_ROSTER) {
    return { state: current, applied: false };
  }
  return {
    state: { ...current, teamRosterSeeded: MIGRATION_SEEDED_TEAM_ROSTER },
    applied: true,
  };
}

/** Rewrite persisted «архитектура/аналитика/разработка/тестирование» to person titles. */
export function migrateLegacyCatalogRoles(current: AppState): {
  state: AppState;
  applied: boolean;
} {
  let applied = false;
  const teams = current.teams.map((team) => {
    const members = team.members?.map((m) => {
      const role = migrateStoredRoleLabel(m.role);
      if (role !== m.role) applied = true;
      return role === m.role ? m : { ...m, role };
    });
    const roles = uniqueRoleNames(
      members?.length ? members.map((m) => m.role) : team.roles
    );
    if ((team.roles ?? []).some((r, i) => r !== roles[i]) || roles.length !== (team.roles ?? []).length) {
      applied = true;
    }
    return syncTeamRoster({
      ...team,
      ...(members ? { members } : {}),
      roles,
    });
  });
  const items = current.items.map((item) => ({
    ...item,
    assignments: item.assignments.map((a) => {
      if (!a.roles?.length) return a;
      const roles = a.roles.map((r) => {
        const name = migrateStoredRoleLabel(r.name);
        const id = migrateStoredRoleId(r.id);
        if (name !== r.name || id !== r.id) applied = true;
        return name === r.name && id === r.id ? r : { ...r, name, id };
      });
      return { ...a, roles };
    }),
  }));
  if (!applied) return { state: current, applied: false };
  return { state: { ...current, teams, items }, applied: true };
}

/**
 * Seed items only when the live portfolio is empty. Never rewrite type,
 * rank, title, or assignments on rows the user already has.
 */
export function mergeMissingSeedItems(
  current: AppState,
  seedItems: WorkItem[]
): { state: AppState; applied: boolean } {
  if (current.items.length > 0) {
    return { state: current, applied: false };
  }
  const deletedIds = new Set(current.deletedItemIds ?? []);
  const deletedProjects = new Set(
    (current.deletedProjectKeys ?? [])
      .map((k) => catalogKey(k))
      .filter(Boolean)
  );
  const missing = seedItems
    .filter((item) => {
      if (deletedIds.has(item.id)) return false;
      const key = catalogKey(containerNameFromBacklog(item.backlog));
      if (!key || deletedProjects.has(key)) return false;
      return true;
    })
    .map((item) => {
      const clone = structuredClone(item);
      clone.assignments = [];
      return clone;
    });
  if (!missing.length) {
    return { state: current, applied: false };
  }
  const keepCatalog = (names: string[]) =>
    names.filter((n) => !deletedProjects.has(catalogKey(n)));
  return {
    state: {
      ...current,
      items: missing,
      projects: uniqCatalogNames([
        ...keepCatalog(current.projects),
        ...missing
          .filter((item) => item.type === "project")
          .map((item) => containerNameFromBacklog(item.backlog)),
      ]),
      products: uniqCatalogNames([
        ...keepCatalog(current.products),
        ...missing
          .filter((item) => item.type === "product")
          .map((item) => containerNameFromBacklog(item.backlog)),
      ]),
    },
    applied: true,
  };
}

/** Stamp the one-shot flag. Never clear live demand assignments again. */
export function applyClearedDemandTeams(current: AppState): {
  state: AppState;
  applied: boolean;
} {
  if (current.clearedDemandTeams === MIGRATION_CLEARED_DEMAND_TEAMS) {
    return { state: current, applied: false };
  }
  return {
    state: { ...current, clearedDemandTeams: MIGRATION_CLEARED_DEMAND_TEAMS },
    applied: true,
  };
}

export interface V2StateFootprint {
  assignments: number;
  members: number;
  teams: number;
  items: number;
  savedAt: number;
}

export function v2StateFootprint(state: AppState): V2StateFootprint {
  return {
    assignments: state.items.reduce((n, item) => n + item.assignments.length, 0),
    members: state.teams.reduce((n, team) => n + (team.members?.length ?? 0), 0),
    teams: state.teams.length,
    items: state.items.length,
    savedAt: Date.parse(state.savedAt ?? "") || 0,
  };
}

/** True when writing `next` would drop teams, members, items, or assignments. */
export function v2StateWouldShrink(next: AppState, prev: AppState | null): boolean {
  if (!prev) return false;
  const n = v2StateFootprint(next);
  const p = v2StateFootprint(prev);
  return (
    n.assignments < p.assignments ||
    n.members < p.members ||
    n.teams < p.teams ||
    n.items < p.items
  );
}

/** Prefer local when it is newer or holds more user data than remote. */
export function localV2BeatsRemote(local: AppState, remote: AppState): boolean {
  const L = v2StateFootprint(local);
  const R = v2StateFootprint(remote);
  if (L.assignments > R.assignments) return true;
  if (L.members > R.members) return true;
  if (L.savedAt && !R.savedAt) return true;
  if (L.savedAt && R.savedAt && L.savedAt > R.savedAt) return true;
  // Seed-sized empty catalogs must not replace a smaller live v2 workspace.
  if (
    (L.teams > 0 || L.items > 0 || L.members > 0) &&
    R.assignments <= L.assignments &&
    !(R.savedAt > L.savedAt && R.assignments > L.assignments)
  ) {
    return true;
  }
  if (
    R.savedAt > L.savedAt &&
    R.assignments >= L.assignments &&
    R.members >= L.members
  ) {
    return false;
  }
  return true;
}

/**
 * Merge two v2 blobs by id. Never drop the richer side's teams, ranks,
 * role—ФИО, or demand assignments. A richer local does not pick up seed extras.
 */
export function mergeLiveV2States(local: AppState, remote: AppState): AppState {
  if (localV2BeatsRemote(local, remote)) {
    const remoteItems = new Map(remote.items.map((item) => [item.id, item]));
    const items = local.items.map((item) => {
      const other = remoteItems.get(item.id);
      if (!other || item.assignments.length >= other.assignments.length) {
        return item;
      }
      return { ...item, assignments: other.assignments };
    });
    // Keep the live catalog as-is. A larger seed/cloud roster must not
    // replace the user's role—ФИО seats just because it has more rows.
    return {
      ...local,
      items,
      deletedItemIds: rememberDeletedIds(
        local.deletedItemIds,
        remote.deletedItemIds ?? []
      ),
      deletedProjectKeys: rememberDeletedIds(
        local.deletedProjectKeys,
        remote.deletedProjectKeys ?? []
      ),
      clearedDemandTeams: local.clearedDemandTeams ?? remote.clearedDemandTeams,
      teamRosterSeeded: local.teamRosterSeeded ?? remote.teamRosterSeeded,
      cashFlowUnit: local.cashFlowUnit ?? remote.cashFlowUnit,
      portfolioPack: local.portfolioPack ?? remote.portfolioPack,
      savedAt: pickLaterSavedAt(local.savedAt, remote.savedAt),
    };
  }

  const localItems = new Map(local.items.map((item) => [item.id, item]));
  const items = remote.items.map((item) => {
    const mine = localItems.get(item.id);
    if (!mine) return item;
    return {
      ...item,
      assignments:
        mine.assignments.length >= item.assignments.length
          ? mine.assignments
          : item.assignments,
      manualRank: mine.manualRank ?? item.manualRank,
    };
  });
  const remoteIds = new Set(remote.items.map((item) => item.id));
  const extras = local.items.filter((item) => !remoteIds.has(item.id));
  const localTeams = new Map(local.teams.map((team) => [team.id, team]));
  const teams = remote.teams.map((team) => {
    const mine = localTeams.get(team.id);
    if (!mine) return team;
    if ((mine.members?.length ?? 0) >= (team.members?.length ?? 0)) return mine;
    return team;
  });
  const remoteTeamIds = new Set(remote.teams.map((team) => team.id));
  const extraTeams = local.teams.filter((team) => !remoteTeamIds.has(team.id));
  return {
    ...remote,
    items: [...items, ...extras],
    teams: [...teams, ...extraTeams],
    deletedItemIds: rememberDeletedIds(
      remote.deletedItemIds,
      local.deletedItemIds ?? []
    ),
    deletedProjectKeys: rememberDeletedIds(
      remote.deletedProjectKeys,
      local.deletedProjectKeys ?? []
    ),
    clearedDemandTeams: remote.clearedDemandTeams ?? local.clearedDemandTeams,
    teamRosterSeeded: remote.teamRosterSeeded ?? local.teamRosterSeeded,
    cashFlowUnit: remote.cashFlowUnit ?? local.cashFlowUnit,
    portfolioPack: remote.portfolioPack ?? local.portfolioPack,
    savedAt: pickLaterSavedAt(local.savedAt, remote.savedAt),
  };
}

function pickLaterSavedAt(a?: string, b?: string): string | undefined {
  if (a && b) return a >= b ? a : b;
  return a ?? b;
}

/** Prepend a log entry and trim to CHANGE_LOG_MAX. Mutates nothing — returns new array. */
export function prependChangeLog(
  log: ChangeLogEntry[] | undefined,
  message: string,
  kind?: ChangeLogKind
): ChangeLogEntry[] {
  const entry: ChangeLogEntry = {
    id: uid("log"),
    at: new Date().toISOString(),
    message: String(message ?? "").trim() || "Изменение",
    ...(kind ? { kind } : {}),
  };
  return [entry, ...(Array.isArray(log) ? log : [])].slice(0, CHANGE_LOG_MAX);
}

function parseChangeLog(raw: unknown): ChangeLogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ChangeLogEntry[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const message = String(r.message ?? "").trim();
    if (!message) continue;
    const atRaw = String(r.at ?? "");
    const at = Number.isFinite(Date.parse(atRaw))
      ? new Date(atRaw).toISOString()
      : new Date().toISOString();
    const kind = r.kind != null ? String(r.kind) : undefined;
    const known: ChangeLogKind[] = [
      "item",
      "priority",
      "team",
      "catalog",
      "notes",
      "settings",
      "schedule",
      "system",
    ];
    out.push({
      id: String(r.id ?? uid("log")),
      at,
      message,
      ...(kind && (known as string[]).includes(kind)
        ? { kind: kind as ChangeLogKind }
        : {}),
    });
    if (out.length >= CHANGE_LOG_MAX) break;
  }
  return out;
}

/** Unique non-empty catalog names; drops «—»; stable ru sort. */
export function uniqCatalogNames(names: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const n = String(raw ?? "").trim();
    if (!n || n === "—") continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out.sort((a, b) => a.localeCompare(b, "ru"));
}

function parseCatalogNameList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return uniqCatalogNames(raw.map((x) => String(x)));
}

/** Product/project container name from backlog (legacy «… backlog · Name» ok). */
export function containerNameFromBacklog(backlog: string): string {
  const trimmed = backlog.trim();
  if (!trimmed) return "";
  const parts = trimmed
    .split(" · ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2 && /backlog/i.test(parts.slice(0, -1).join(" · "))) {
    return parts[parts.length - 1]!;
  }
  return trimmed;
}

/** One team's slice of an initiative in that team's queue */
export interface ScheduledSlice {
  item: WorkItem;
  teamId: string;
  size: TShirtSize;
  /** Person-weeks of effort (from t-shirt size) */
  estimatePw: number;
  effectiveRank: number;
  /** User-planned earliest start */
  plannedStartDate: string;
  startWeek: number;
  endWeek: number;
  startDate: string;
  endDate: string;
  waitWeeks: number;
  /** True if queue pushed start later than planned */
  delayedByQueue: boolean;
  /** Calendar span of this team's work in weeks */
  durationWeeks: number;
}

/** Initiative-level rollup: done when the slowest team finishes */
export interface ItemSchedule {
  item: WorkItem;
  slices: ScheduledSlice[];
  totalEstimateWeeks: number;
  startWeek: number;
  endWeek: number;
  startDate: string;
  endDate: string;
  waitWeeks: number;
  /** Team id of the slice that drives the overall ETA */
  bottleneckTeamId: string;
}

export interface LoadDemandItem {
  id: string;
  title: string;
  contributionPw: number;
}

export interface TeamLoadWeek {
  week: number;
  weekStart: string;
  usedPw: number;
  capacityPw: number;
  items: LoadDemandItem[];
}

/** Scheduled week load exceeds weekly slot budget (rare after queue merge). */
export function isTeamWeekOverloaded(lw: TeamLoadWeek): boolean {
  return lw.usedPw > lw.capacityPw + 0.001;
}

export function utilizationPct(usedPw: number, capacityPw: number): number {
  if (capacityPw <= 0) return usedPw > 0 ? 100 : 0;
  return Math.round((usedPw / capacityPw) * 100);
}

function finalizeLoadWeeks(weeks: TeamLoadWeek[]) {
  for (const week of weeks) {
    week.usedPw = Math.round(week.usedPw * 1000) / 1000;
    week.items.sort((a, b) => b.contributionPw - a.contributionPw);
    for (const it of week.items) {
      it.contributionPw = Math.round(it.contributionPw * 1000) / 1000;
    }
  }
}

function addLoadContribution(
  slot: TeamLoadWeek,
  item: { id: string; title: string },
  take: number
) {
  slot.usedPw += take;
  const existing = slot.items.find((x) => x.id === item.id);
  if (existing) existing.contributionPw += take;
  else
    slot.items.push({
      id: item.id,
      title: item.title,
      contributionPw: take,
    });
}

/**
 * Weeks where scheduled demand (same intervals as Gantt bars) exceeds weekly budget.
 */
export function scheduledOverloadWeeks(
  load: Record<string, TeamLoadWeek[]>
): Record<string, Set<number>> {
  const result: Record<string, Set<number>> = {};
  for (const [teamId, weeks] of Object.entries(load)) {
    const overloaded = new Set<number>();
    for (const lw of weeks) {
      if (isTeamWeekOverloaded(lw)) overloaded.add(lw.week);
    }
    result[teamId] = overloaded;
  }
  return result;
}

/** @deprecated alias — use LoadDemandItem */
export type ConcurrentDemandItem = LoadDemandItem;

/** @deprecated alias — use TeamLoadWeek */
export type ConcurrentLoadWeek = TeamLoadWeek;

/**
 * Parallel planned load by team/week: each assignment from its workStartDate
 * consumes SCHEDULE_CAPACITY_PW week-by-week without waiting for the queue.
 * Kept for diagnostics; UI load strips use schedulePortfolio load instead.
 */
export function concurrentTeamLoad(
  state: AppState,
  maxWeeks = 52
): Record<string, TeamLoadWeek[]> {
  const ranges = state.sizeRanges ?? DEFAULT_SIZE_RANGES;
  const result: Record<string, TeamLoadWeek[]> = {};
  const cap = SCHEDULE_CAPACITY_PW;

  for (const team of state.teams) {
    const weeks: TeamLoadWeek[] = Array.from({ length: maxWeeks }, (_, w) => ({
      week: w,
      weekStart: addWeeks(state.startDate, w),
      usedPw: 0,
      capacityPw: cap,
      items: [],
    }));

    for (const item of state.items) {
      if (item.status === "done") continue;
      for (const a of item.assignments) {
        if (a.teamId !== team.id) continue;
        const pw = assignmentPlanWeeks(a, ranges);
        let rem = pw;
        let w = weekIndex(state.startDate, a.workStartDate);
        while (rem > 0.001 && w < maxWeeks) {
          const take = Math.min(cap, rem);
          addLoadContribution(weeks[w], item, take);
          rem -= take;
          w += 1;
        }
      }
    }

    finalizeLoadWeeks(weeks);
    result[team.id] = weeks;
  }
  return result;
}

/**
 * Weeks where parallel planned work (each assignment from its workStartDate)
 * would exceed SCHEDULE_CAPACITY_PW before the queue merges slots.
 */
export function concurrentOverloadWeeks(
  state: AppState,
  maxWeeks = 52
): Record<string, Set<number>> {
  return scheduledOverloadWeeks(concurrentTeamLoad(state, maxWeeks));
}

/** Optional finance number; missing / empty / invalid → null. */
export function optionalRubFromRaw(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Optional ISO calendar date (YYYY-MM-DD); missing / invalid → null. */
export function parseOptionalIsoDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = new Date(s + "T12:00:00").getTime();
  return Number.isFinite(t) ? s : null;
}

/**
 * Срок реализации базовый: calendar days between дата начала and
 * дата завершения базовая. null if either side is missing.
 */
export function baselineDurationDays(
  startDate: string | null | undefined,
  baselineFinishDate: string | null | undefined
): number | null {
  const start = parseOptionalIsoDate(startDate);
  const finish = parseOptionalIsoDate(baselineFinishDate);
  if (!start || !finish) return null;
  const ms =
    new Date(finish + "T12:00:00").getTime() -
    new Date(start + "T12:00:00").getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Migrate ЧП into тыс. руб (stored unit after cashFlowUnit === "tys").
 * - |n| ≥ 1000: legacy full ₽ → ÷1000 (e.g. 12_400_000 → 12_400)
 * - else: legacy млрд → ×1_000_000 (e.g. 1.2 → 1_200_000)
 * Call only when AppState.cashFlowUnit is not yet `"tys"`.
 */
export function migrateCashFlowToTys(n: number): number {
  if (Math.abs(n) >= 1000) {
    return Math.round(n / 1000);
  }
  return Math.round(n * 1_000_000 * 10) / 10;
}

/** @deprecated Use migrateCashFlowToTys; kept for any external imports. */
export function migrateCashFlowToMlrd(n: number): number {
  return migrateCashFlowToTys(n);
}

/**
 * Legacy ROI was stored as full ₽. Sensible percents are small; values ≥ 500
 * are dropped as legacy ruble amounts.
 */
export function migrateRoiToPercent(n: number): number | null {
  if (Math.abs(n) >= 500) return null;
  return n;
}

/** Calendar finish of a track: Monday-snapped start + planned days. */
export function trackFinishDate(startIso: string, days: number): string {
  const start = snapToMonday(startIso);
  const span = Math.max(0, days);
  return span > 0 ? addDays(start, span) : start;
}

/**
 * Latest calendar end of one team assignment: max of role bars, else the
 * assignment start + planned days. Not a queue/bottleneck schedule.
 */
export function assignmentFinishDate(
  a: TeamAssignment,
  planStart: string,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string | undefined {
  if (a.roles?.length) {
    let latest: string | undefined;
    for (const role of a.roles) {
      const start = role.workStartDate || a.workStartDate || planStart;
      const end = trackFinishDate(start, rolePlanDays(role, ranges));
      if (!latest || end > latest) latest = end;
    }
    return latest;
  }
  const days = assignmentPlanDays(a, ranges);
  if (!a.workStartDate && days <= 0) return undefined;
  return trackFinishDate(a.workStartDate || planStart, days);
}

/** Earliest planned start among a team assignment’s role/team tracks. */
export function assignmentStartDate(
  a: TeamAssignment,
  planStart: string,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string | undefined {
  if (a.roles?.length) {
    let earliest: string | undefined;
    for (const role of a.roles) {
      const days = rolePlanDays(role, ranges);
      if (days <= 0 && !role.workStartDate && !a.workStartDate) continue;
      const start = role.workStartDate || a.workStartDate || planStart;
      if (!earliest || start < earliest) earliest = start;
    }
    return earliest;
  }
  const days = assignmentPlanDays(a, ranges);
  if (!a.workStartDate && days <= 0) return undefined;
  return a.workStartDate || planStart;
}

/** Latest finish among a functionality’s team/role tracks. */
export function itemFinishDate(
  item: WorkItem,
  planStart: string,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string | undefined {
  let latest: string | undefined;
  for (const a of item.assignments) {
    const end = assignmentFinishDate(a, planStart, ranges);
    if (end && (!latest || end > latest)) latest = end;
  }
  return latest;
}

/** Earliest start among a functionality’s team/role tracks (same source as finish). */
export function itemStartDate(
  item: WorkItem,
  planStart: string,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string | undefined {
  let earliest: string | undefined;
  for (const a of item.assignments) {
    const start = assignmentStartDate(a, planStart, ranges);
    if (start && (!earliest || start < earliest)) earliest = start;
  }
  return earliest;
}

/**
 * Реестр «Дата завершения»: max end date of every functionality’s planned
 * role/team bars in the project. Recomputed from live assignments — not cached.
 */
export function projectFinishDate(
  items: WorkItem[],
  planStart: string,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string | undefined {
  let latest: string | undefined;
  for (const item of items) {
    const end = itemFinishDate(item, planStart, ranges);
    if (end && (!latest || end > latest)) latest = end;
  }
  return latest;
}

/**
 * Реестр «Дата начала»: min start date of planned role/team bars — same
 * schedule source as {@link projectFinishDate}.
 */
export function projectScheduleStartDate(
  items: WorkItem[],
  planStart: string,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string | undefined {
  let earliest: string | undefined;
  for (const item of items) {
    const start = itemStartDate(item, planStart, ranges);
    if (start && (!earliest || start < earliest)) earliest = start;
  }
  return earliest;
}

/** Calendar days for one assignment: sum of roles, else `days` or t-shirt midpoint. */
export function assignmentPlanDays(
  a: TeamAssignment,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  if (Array.isArray(a.roles)) {
    return a.roles.reduce((sum, role) => sum + rolePlanDays(role, ranges), 0);
  }
  const days = parseOptionalDays(a.days);
  if (days != null) return days;
  return sizePlanDays(a.size, ranges);
}

/** Planning effort weeks for one assignment (days / 5, at least 1 week). */
export function assignmentPlanWeeks(
  a: TeamAssignment,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  const weeks = assignmentPlanDays(a, ranges) / WORKING_DAYS_PER_WEEK;
  return Math.max(1, Math.round(weeks * 10) / 10);
}

export function totalEstimateWeeks(
  item: WorkItem,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  return item.assignments.reduce(
    (sum, a) => sum + assignmentPlanWeeks(a, ranges),
    0
  );
}

/** Sum of assignment days (explicit or t-shirt midpoint). */
export function totalEstimateDays(
  item: WorkItem,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  return item.assignments.reduce(
    (sum, a) => sum + assignmentPlanDays(a, ranges),
    0
  );
}

export function itemTeamIds(item: WorkItem): string[] {
  return item.assignments.map((a) => a.teamId);
}

export function hasTeam(item: WorkItem, teamId: string): boolean {
  return item.assignments.some((a) => a.teamId === teamId);
}

export function assignmentFor(
  item: WorkItem,
  teamId: string
): TeamAssignment | undefined {
  return item.assignments.find((a) => a.teamId === teamId);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addWeeks(isoDate: string, weeks: number): string {
  return addDays(isoDate, weeks * 7);
}

/** Add calendar months; clamps day to last day of target month. */
export function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate + "T12:00:00");
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

/** Pick the critical-path slice: latest finish; ties → longer estimate */
export function pickBottleneck(slices: ScheduledSlice[]): ScheduledSlice {
  return slices.reduce((best, cur) => {
    if (cur.endDate !== best.endDate) {
      return cur.endDate > best.endDate ? cur : best;
    }
    if (cur.estimatePw !== best.estimatePw) {
      return cur.estimatePw > best.estimatePw ? cur : best;
    }
    return cur.durationWeeks > best.durationWeeks ? cur : best;
  });
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function mondayOf(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Snap any ISO date to that week's Monday */
export function snapToMonday(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return mondayOf();
  return mondayOf(new Date(iso.slice(0, 10) + "T12:00:00"));
}

/** Week index of date relative to planning start (0 = first week); never negative */
export function weekIndex(planStart: string, dateIso: string): number {
  const a = new Date(snapToMonday(planStart) + "T12:00:00").getTime();
  const b = new Date(snapToMonday(dateIso) + "T12:00:00").getTime();
  return Math.max(0, Math.round((b - a) / (7 * 24 * 3600 * 1000)));
}

/** Sort by explicit priority (1 first); missing ranks fall back to title, then id */
export function sortByPriority(
  items: WorkItem[],
  _ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  return [...items].sort((a, b) => {
    const pa = a.manualRank;
    const pb = b.manualRank;
    if (pa != null && pb != null && pa !== pb) return pa - pb;
    if (pa != null && pb == null) return -1;
    if (pa == null && pb != null) return 1;
    const byTitle = a.title.localeCompare(b.title, "ru");
    if (byTitle !== 0) return byTitle;
    return a.id.localeCompare(b.id);
  });
}

/** Another item already uses this priority number (excluding excludeId) */
export function findPriorityConflict(
  items: WorkItem[],
  priority: number,
  excludeId?: string | null
): WorkItem | undefined {
  return items.find(
    (i) =>
      i.id !== excludeId &&
      i.manualRank != null &&
      i.manualRank === priority
  );
}

/**
 * Move item to target priority and reindex 1..n.
 * Conflict holder and neighbors shift so the list stays contiguous.
 * Example: A=1,B=2,C=3 → move A to 2 → B=1, A=2, C=3.
 */
export function moveItemToPriority(
  items: WorkItem[],
  itemId: string,
  newPriority: number,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  const ordered = sortByPriority(items, ranges);
  const fromIndex = ordered.findIndex((i) => i.id === itemId);
  if (fromIndex < 0) return items;

  const next = [...ordered];
  const [item] = next.splice(fromIndex, 1);
  const target = Math.max(
    0,
    Math.min(next.length, Math.round(newPriority) - 1)
  );
  next.splice(target, 0, item);

  const rankById = new Map(next.map((it, i) => [it.id, i + 1]));
  return items.map((it) => {
    const rank = rankById.get(it.id);
    if (rank == null || it.manualRank === rank) return it;
    return { ...it, manualRank: rank };
  });
}

/** Реестр project key: backlog container name. */
export function projectGroupKey(item: WorkItem): string {
  return containerNameFromBacklog(item.backlog) || "Без проекта";
}

/**
 * Project-card create inserts a stub WorkItem so an empty project appears in
 * Реестр. It must not count as a functionality.
 * Legacy stubs (pre-flag): title mirrors the container and has no teams.
 */
export function isProjectAnchor(item: WorkItem): boolean {
  if (item.projectAnchor) return true;
  const key = projectGroupKey(item);
  if (key === "Без проекта") return false;
  return item.title.trim() === key && item.assignments.length === 0;
}

/** Work items that are real functionalities (not project-card anchors). */
export function functionalityItems(items: WorkItem[]): WorkItem[] {
  return items.filter((it) => !isProjectAnchor(it));
}

/** Project groups in sequential priority order (min item rank, then name). */
export function orderedProjectGroups(
  items: WorkItem[],
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): { key: string; items: WorkItem[] }[] {
  const map = new Map<string, WorkItem[]>();
  for (const it of items) {
    const key = projectGroupKey(it);
    const list = map.get(key);
    if (list) list.push(it);
    else map.set(key, [it]);
  }
  const groups = [...map.entries()].map(([key, grouped]) => ({
    key,
    items: sortByPriority(grouped, ranges),
  }));
  groups.sort((a, b) => {
    const pa = Math.min(...a.items.map((i) => i.manualRank ?? Number.POSITIVE_INFINITY));
    const pb = Math.min(...b.items.map((i) => i.manualRank ?? Number.POSITIVE_INFINITY));
    if (pa !== pb) return pa - pb;
    return a.key.localeCompare(b.key, "ru");
  });
  return groups;
}

/**
 * Functionality priority inside its project: 1..N by global rank order.
 * Project-card anchors are not functionalities and get no number.
 */
export function functionalityPriorityMap(
  items: WorkItem[],
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): Map<string, number> {
  const out = new Map<string, number>();
  for (const g of orderedProjectGroups(items, ranges)) {
    functionalityItems(g.items).forEach((it, i) => out.set(it.id, i + 1));
  }
  return out;
}

/**
 * Move a functionality to position 1..N inside its own project.
 * Project order and other projects stay as they are; global ranks are
 * reindexed 1..n group by group (like moveProjectGroupToPriority).
 */
export function moveFunctionalityWithinProject(
  items: WorkItem[],
  itemId: string,
  newPriority: number,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  const groups = orderedProjectGroups(items, ranges);
  const rankById = new Map<string, number>();
  let rank = 1;
  let found = false;
  for (const g of groups) {
    const fns = functionalityItems(g.items);
    const anchors = g.items.filter((it) => isProjectAnchor(it));
    const from = fns.findIndex((it) => it.id === itemId);
    if (from >= 0) {
      found = true;
      const [moved] = fns.splice(from, 1);
      const target = Math.max(
        0,
        Math.min(fns.length, Math.round(newPriority) - 1)
      );
      fns.splice(target, 0, moved!);
    }
    // Anchors first keep the project's min rank (= its position) stable.
    for (const it of from >= 0 ? [...anchors, ...fns] : g.items) {
      rankById.set(it.id, rank++);
    }
  }
  if (!found) return items;
  return items.map((it) => {
    const r = rankById.get(it.id);
    if (r == null || it.manualRank === r) return it;
    return { ...it, manualRank: r };
  });
}

/**
 * Move a whole project to display priority 1..N.
 * Items inside the group keep their relative order; other groups shift.
 */
export function moveProjectGroupToPriority(
  items: WorkItem[],
  projectKey: string,
  newPriority: number,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  const groups = orderedProjectGroups(items, ranges);
  const from = groups.findIndex((g) => g.key === projectKey);
  if (from < 0) return items;
  const next = [...groups];
  const [group] = next.splice(from, 1);
  if (!group) return items;
  const target = Math.max(
    0,
    Math.min(next.length, Math.round(newPriority) - 1)
  );
  next.splice(target, 0, group);
  const rankById = new Map<string, number>();
  let rank = 1;
  for (const g of next) {
    for (const it of g.items) rankById.set(it.id, rank++);
  }
  return items.map((it) => {
    const r = rankById.get(it.id);
    if (r == null || it.manualRank === r) return it;
    return { ...it, manualRank: r };
  });
}

/**
 * After drag-and-drop among a visible subset: reorder that subset in the
 * global priority list, keep non-visible items in place, reindex 1..n.
 */
export function reorderVisiblePriority(
  items: WorkItem[],
  visibleIdsInNewOrder: string[],
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  if (visibleIdsInNewOrder.length < 2) return items;
  const ordered = sortByPriority(items, ranges);
  const visibleSet = new Set(visibleIdsInNewOrder);
  const byId = new Map(items.map((i) => [i.id, i]));
  const visibleQueue = visibleIdsInNewOrder
    .map((id) => byId.get(id))
    .filter((i): i is WorkItem => Boolean(i));

  let vi = 0;
  const merged: WorkItem[] = [];
  for (const item of ordered) {
    if (visibleSet.has(item.id)) {
      const next = visibleQueue[vi++];
      if (next) merged.push(next);
    } else {
      merged.push(item);
    }
  }
  while (vi < visibleQueue.length) merged.push(visibleQueue[vi++]);

  const rankById = new Map(merged.map((it, i) => [it.id, i + 1]));
  return items.map((it) => {
    const rank = rankById.get(it.id);
    if (rank == null || it.manualRank === rank) return it;
    return { ...it, manualRank: rank };
  });
}

/** Next free priority (max existing + 1, or 1) */
export function nextPriority(items: WorkItem[]): number {
  let max = 0;
  for (const i of items) {
    if (i.manualRank != null && i.manualRank > max) max = i.manualRank;
  }
  return max + 1;
}

/**
 * Ensure every item has a unique integer priority.
 * Keeps valid unique ranks; fills gaps / fixes duplicates by title, then id.
 */
export function ensureUniquePriorities(
  items: WorkItem[],
  _ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  const byStable = [...items].sort((a, b) => {
    const byTitle = a.title.localeCompare(b.title, "ru");
    if (byTitle !== 0) return byTitle;
    return a.id.localeCompare(b.id);
  });

  const used = new Set<number>();
  const kept = new Map<string, number>();

  for (const item of byStable) {
    const r = item.manualRank;
    if (r != null && Number.isFinite(r) && r >= 1 && !used.has(r)) {
      used.add(r);
      kept.set(item.id, r);
    }
  }

  let next = 1;
  const takeNext = () => {
    while (used.has(next)) next += 1;
    const n = next;
    used.add(n);
    next += 1;
    return n;
  };

  return items.map((item) => {
    const rank = kept.get(item.id) ?? takeNext();
    return item.manualRank === rank ? item : { ...item, manualRank: rank };
  });
}

/**
 * How Gantt / queues place work (weekly slot = {@link SCHEDULE_CAPACITY_PW}).
 * - `manual`: fixed workStartDate (overloads visible)
 * - `teamQueue`: Finish-to-Start per team by portfolio priority (legacy auto)
 * - `maxUtilization`: item-level parallel blocks by priority — all teams on one
 *   initiative share a common start; ETA = max of tracks (not serial sum)
 */
export type ScheduleMode = "manual" | "teamQueue" | "maxUtilization";

/** @deprecated use ScheduleMode; kept for callers still passing legacy ids */
export type LegacyScheduleMode =
  | ScheduleMode
  | "auto"
  | "dense"
  | "parallel"
  | "max_util";

export interface ScheduleOptions {
  /**
   * `maxUtilization` (recommended): process items by priority; all assignments
   * of an item share one start week and run in parallel (1 FTE weekly budget).
   * `teamQueue`: strict per-team Finish-to-Start queue by priority.
   * `manual`: fix each assignment at workStartDate; concurrent work may overload.
   * Legacy `"auto"` → `teamQueue`; `"dense"` / `"parallel"` / `"max_util"` → `maxUtilization`.
   */
  mode?: LegacyScheduleMode;
}

export function normalizeScheduleMode(
  mode: LegacyScheduleMode | null | undefined
): ScheduleMode {
  if (mode === "manual") return "manual";
  if (mode === "auto" || mode === "teamQueue") return "teamQueue";
  if (
    mode === "maxUtilization" ||
    mode === "max_util" ||
    mode === "dense" ||
    mode === "parallel"
  ) {
    return "maxUtilization";
  }
  return "maxUtilization";
}

export function isCapacityScheduleMode(mode: ScheduleMode): boolean {
  return mode === "teamQueue" || mode === "maxUtilization";
}

/** True if estimatePw fits in consecutive free capacity from startWeek (no mid-gap skip). */
function canPlaceContiguous(
  weeks: TeamLoadWeek[],
  capacityPw: number,
  startWeek: number,
  estimatePw: number,
  maxWeeks: number
): boolean {
  let remaining = estimatePw;
  let w = startWeek;
  while (remaining > 0.001 && w < maxWeeks) {
    const free = Math.max(0, capacityPw - weeks[w].usedPw);
    if (free <= 0.001) return false;
    remaining -= Math.min(free, remaining);
    if (remaining > 0.001) w += 1;
  }
  return remaining <= 0.001;
}

/**
 * Schedule portfolio work by shared priority field.
 * T-shirt on assignment → person-weeks; weekly budget = {@link SCHEDULE_CAPACITY_PW}
 * (1 FTE) so estimate weeks map 1:1 to calendar weeks without headcount compression.
 *
 * Mode `teamQueue`: later items wait until previous team work finishes (FS), then
 * fill free slots — classic queue arrows on Gantt.
 * Mode `maxUtilization`: process items in priority order; for each item pick a
 * common start week (≥ all planned starts) where every assigned team can run its
 * track contiguously from that week in parallel; consume weekly budget, then next.
 * Does not use a per-team FS cursor that splits one item’s teams across time.
 * Mode `manual`: user dates fixed — effort fills from workStartDate at 1 FTE/week
 * even when weeks already have other work, so overload is visible.
 * Does not mutate stored workStartDate values.
 */
export function schedulePortfolio(
  state: AppState,
  options: ScheduleOptions = {}
): {
  slices: ScheduledSlice[];
  rollups: ItemSchedule[];
  load: Record<string, TeamLoadWeek[]>;
} {
  const mode = normalizeScheduleMode(options.mode ?? "maxUtilization");
  const ranges = state.sizeRanges ?? DEFAULT_SIZE_RANGES;
  const active = state.items.filter((i) => i.status !== "done");
  const ordered = sortByPriority(active, ranges);

  const slices: ScheduledSlice[] = [];
  const load: Record<string, TeamLoadWeek[]> = {};
  const maxWeeks = 52;
  const packCapacity = isCapacityScheduleMode(mode);
  const cap = SCHEDULE_CAPACITY_PW;

  const emptyWeeks = (): TeamLoadWeek[] =>
    Array.from({ length: maxWeeks }, (_, w) => ({
      week: w,
      weekStart: addWeeks(state.startDate, w),
      usedPw: 0,
      capacityPw: cap,
      items: [] as LoadDemandItem[],
    }));

  const placeEffort = (
    weeks: TeamLoadWeek[],
    item: WorkItem,
    startWeek: number,
    estimatePw: number,
    allowSkipBusy: boolean
  ): { endWeek: number; endDate: string; startDate: string } => {
    let remaining = estimatePw;
    let endWeek = startWeek;
    let endDate = addWeeks(state.startDate, startWeek);
    const startDate = addWeeks(state.startDate, startWeek);

    while (remaining > 0.001 && endWeek < maxWeeks) {
      const slot = weeks[endWeek];
      let take: number;
      let offsetInWeek = 0;

      if (mode === "manual") {
        take = Math.min(cap, remaining);
      } else {
        const free = Math.max(0, cap - slot.usedPw);
        if (free <= 0.001) {
          if (!allowSkipBusy) break;
          endWeek += 1;
          continue;
        }
        take = Math.min(free, remaining);
        offsetInWeek = (slot.usedPw / cap) * 7;
      }

      const weekStart = addWeeks(state.startDate, endWeek);
      const daysUsed = (take / Math.max(cap, 0.001)) * 7;
      endDate = addDays(weekStart, offsetInWeek + daysUsed);

      addLoadContribution(slot, item, take);
      remaining -= take;
      if (remaining > 0.001) endWeek += 1;
    }

    return { endWeek, endDate, startDate };
  };

  if (mode === "maxUtilization") {
    for (const team of state.teams) {
      load[team.id] = emptyWeeks();
    }

    ordered.forEach((item, itemIdx) => {
      const tracks = item.assignments
        .map((a) => {
          const team = state.teams.find((t) => t.id === a.teamId);
          if (!team) return null;
          return {
            team,
            size: a.size,
            workStartDate: snapToMonday(a.workStartDate || state.startDate),
            estimatePw: assignmentPlanWeeks(a, ranges),
          };
        })
        .filter((t): t is NonNullable<typeof t> => t != null);

      if (!tracks.length) return;

      const plannedFloor = Math.max(
        ...tracks.map((t) => weekIndex(state.startDate, t.workStartDate))
      );

      let commonStart = plannedFloor;
      while (commonStart < maxWeeks) {
        const allReady = tracks.every((t) =>
          canPlaceContiguous(
            load[t.team.id],
            cap,
            commonStart,
            t.estimatePw,
            maxWeeks
          )
        );
        if (allReady) break;
        commonStart += 1;
      }

      for (const t of tracks) {
        const weeks = load[t.team.id];
        const plannedWeek = weekIndex(state.startDate, t.workStartDate);
        const { endWeek, endDate, startDate } = placeEffort(
          weeks,
          item,
          commonStart,
          t.estimatePw,
          false
        );
        const durationWeeks =
          Math.round((t.estimatePw / cap) * 100) / 100;

        slices.push({
          item,
          teamId: t.team.id,
          size: t.size,
          estimatePw: t.estimatePw,
          effectiveRank: itemIdx + 1,
          plannedStartDate: t.workStartDate,
          startWeek: commonStart,
          endWeek,
          startDate,
          endDate,
          waitWeeks: commonStart,
          delayedByQueue: packCapacity && commonStart > plannedWeek,
          durationWeeks,
        });
      }
    });

    for (const team of state.teams) {
      finalizeLoadWeeks(load[team.id] ?? []);
    }
  } else {
    const byTeam = new Map<
      string,
      {
        item: WorkItem;
        size: TShirtSize;
        workStartDate: string;
        estimatePw: number;
      }[]
    >();
    for (const team of state.teams) byTeam.set(team.id, []);
    for (const item of ordered) {
      for (const a of item.assignments) {
        const list = byTeam.get(a.teamId) ?? [];
        list.push({
          item,
          size: a.size,
          workStartDate: snapToMonday(a.workStartDate || state.startDate),
          estimatePw: assignmentPlanWeeks(a, ranges),
        });
        byTeam.set(a.teamId, list);
      }
    }

    for (const team of state.teams) {
      const queue = byTeam.get(team.id) ?? [];
      const weeks = emptyWeeks();

      let cursor = 0;
      queue.forEach((entry, idx) => {
        const estimatePw = entry.estimatePw;
        const plannedWeek = weekIndex(state.startDate, entry.workStartDate);
        let startWeek: number;

        if (mode === "manual") {
          startWeek = plannedWeek;
        } else {
          // Strict FS: cannot start before previous item in this team's queue ends.
          startWeek = Math.max(cursor, plannedWeek);
          while (
            startWeek < maxWeeks &&
            weeks[startWeek].usedPw >= cap - 0.001
          ) {
            startWeek += 1;
          }
        }

        const { endWeek, endDate, startDate } = placeEffort(
          weeks,
          entry.item,
          startWeek,
          estimatePw,
          mode === "teamQueue"
        );

        const durationWeeks =
          Math.round((estimatePw / cap) * 100) / 100;

        slices.push({
          item: entry.item,
          teamId: team.id,
          size: entry.size,
          estimatePw,
          effectiveRank: idx + 1,
          plannedStartDate: entry.workStartDate,
          startWeek,
          endWeek,
          startDate,
          endDate,
          waitWeeks: startWeek,
          delayedByQueue: packCapacity && startWeek > plannedWeek,
          durationWeeks,
        });

        if (mode === "teamQueue") {
          if (weeks[endWeek] && weeks[endWeek].usedPw >= cap - 0.001) {
            cursor = endWeek + 1;
          } else {
            cursor = endWeek;
          }
        }
      });

      finalizeLoadWeeks(weeks);
      load[team.id] = weeks;
    }
  }

  const byItem = new Map<string, ScheduledSlice[]>();
  for (const s of slices) {
    const list = byItem.get(s.item.id) ?? [];
    list.push(s);
    byItem.set(s.item.id, list);
  }

  const rollups: ItemSchedule[] = [];
  for (const item of ordered) {
    const itemSlices = byItem.get(item.id) ?? [];
    if (!itemSlices.length) continue;
    const bottleneck = pickBottleneck(itemSlices);
    const earliest = itemSlices.reduce((best, cur) =>
      cur.startWeek < best.startWeek ? cur : best
    );
    rollups.push({
      item,
      slices: [...itemSlices].sort((a, b) =>
        a.endDate === b.endDate
          ? b.estimatePw - a.estimatePw
          : a.endDate < b.endDate
            ? 1
            : -1
      ),
      totalEstimateWeeks: totalEstimateWeeks(item, ranges),
      startWeek: earliest.startWeek,
      endWeek: bottleneck.endWeek,
      startDate: earliest.startDate,
      endDate: bottleneck.endDate,
      waitWeeks: earliest.waitWeeks,
      bottleneckTeamId: bottleneck.teamId,
    });
  }

  slices.sort((a, b) => {
    if (a.startWeek !== b.startWeek) return a.startWeek - b.startWeek;
    const ra = a.item.manualRank;
    const rb = b.item.manualRank;
    if (ra != null && rb != null && ra !== rb) return ra - rb;
    const byTitle = a.item.title.localeCompare(b.item.title, "ru");
    if (byTitle !== 0) return byTitle;
    return a.item.id.localeCompare(b.item.id);
  });

  return { slices, rollups, load };
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Migrate legacy items → assignments with per-team workStartDate */
export function normalizeState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.teams) || !Array.isArray(data.items)) return null;

  const planStart = snapToMonday(String(data.startDate ?? mondayOf()));
  const teams: Team[] = (data.teams as unknown[]).map((row) => {
    const t = row as Record<string, unknown>;
    const teamId = String(t.id ?? uid("team"));
    const fallbackRoles = parseTeamRoles(t.roles);
    const members = parseTeamMembers(t.members, teamId, fallbackRoles);
    const roles =
      members != null
        ? uniqueRolesFromMembers(members)
        : uniqueRoleNames(fallbackRoles);
    return syncTeamRoster({
      id: teamId,
      name: String(t.name ?? "Команда"),
      color: String(t.color ?? "#737373"),
      ...(members ? { members } : {}),
      roles,
    });
  });

  const items: WorkItem[] = data.items.map((row) => {
    const r = row as Record<string, unknown>;
    const itemDemand = parseDemandStatus(r.demandStatus);
    let assignments: TeamAssignment[] = [];
    if (Array.isArray(r.assignments) && r.assignments.length) {
      assignments = (r.assignments as Record<string, unknown>[])
        .filter((a) => a && typeof a.teamId === "string")
        .map((a) => {
          const teamId = String(a.teamId);
          const days = parseOptionalDays(a.days);
          const size =
            a.size != null
              ? parseSize(a.size)
              : days != null
                ? nearestSizeFromDays(days)
                : pwToSize(Number(a.estimatePw) || 1);
          const demandStatus =
            parseAssignmentDemandStatus(a.demandStatus) ??
            (itemDemand === "submitted" ? "pending" : undefined);
          const parsedRoles = parseAssignmentRoles(a.roles);
          return {
            teamId,
            size,
            workStartDate: snapToMonday(
              String(
                a.workStartDate ||
                  (r as { workStartDate?: string }).workStartDate ||
                  planStart
              )
            ),
            ...(days != null ? { days } : {}),
            ...(demandStatus ? { demandStatus } : {}),
            ...(parsedRoles ? { roles: parsedRoles } : {}),
          };
        });
    } else if (typeof r.teamId === "string") {
      assignments = [
        {
          teamId: r.teamId,
          size: pwToSize(Number(r.estimatePw) || 1),
          workStartDate: planStart,
          roles: makeAssignmentRolesForTeam(
            teams.find((t) => t.id === r.teamId)?.roles
          ),
        },
      ];
    }

    // Legacy RICE (reach/impact/confidence) and WSJF score fields are ignored if present.
    return {
      id: String(r.id ?? uid("item")),
      title: String(r.title ?? "Без названия"),
      type: r.type === "project" ? "project" : "product",
      backlog: String(r.backlog ?? "Backlog"),
      assignments,
      status: coerceItemStatus(r.status, "staffing"),
      owner: String(r.owner ?? "—"),
      assignee: String(r.assignee ?? ""),
      notes: r.notes != null ? String(r.notes) : undefined,
      manualRank:
        r.manualRank == null || r.manualRank === ""
          ? null
          : Number(r.manualRank),
      cashFlow12m: optionalRubFromRaw(r.cashFlow12m ?? r.chpRub ?? r.chp),
      cashFlow24m: optionalRubFromRaw(r.cashFlow24m ?? r.chp24m),
      roi12m: (() => {
        const raw = optionalRubFromRaw(r.roi12m ?? r.roiRub ?? r.roi);
        return raw == null ? null : migrateRoiToPercent(raw);
      })(),
      roi24m: (() => {
        const raw = optionalRubFromRaw(r.roi24m);
        return raw == null ? null : migrateRoiToPercent(raw);
      })(),
      paybackMonths: optionalRubFromRaw(
        r.paybackMonths ?? r.payback ?? r.okupaemost
      ),
      startDate: parseOptionalIsoDate(r.startDate ?? r.createdAt),
      baselineFinishDate: parseOptionalIsoDate(
        r.baselineFinishDate ?? r.baselineFinish
      ),
      ...(parseDemandStatus(r.demandStatus) === "submitted"
        ? { demandStatus: "submitted" as const }
        : {}),
      ...(r.projectAnchor === true ? { projectAnchor: true as const } : {}),
    };
  });

  const alreadyTys = data.cashFlowUnit === "tys";
  const migratedItems = alreadyTys
    ? items
    : items.map((item) => ({
        ...item,
        cashFlow12m:
          item.cashFlow12m == null
            ? null
            : migrateCashFlowToTys(item.cashFlow12m),
        cashFlow24m:
          item.cashFlow24m == null
            ? null
            : migrateCashFlowToTys(item.cashFlow24m),
      }));

  const parsedRanges = normalizeSizeRanges(data.sizeRanges);
  const filledItems = migratedItems.map((item) => ({
    ...item,
    assignments: item.assignments.map((a) => {
      const team = teams.find((t) => t.id === a.teamId);
      const teamRoles = team ? resolveTeamRoleNames(team) : undefined;
      return fillAssignmentRoles(
        a,
        parsedRanges,
        team?.name ?? "",
        teamRoles?.length ? teamRoles : undefined
      );
    }),
  }));

  let customers = parseCatalogNameList(data.customers);
  let executors = parseCatalogNameList(data.executors);
  let projects = parseCatalogNameList(data.projects);
  let products = parseCatalogNameList(data.products);
  if (data.roles && typeof data.roles === "object") {
    const roles = data.roles as Record<string, unknown>;
    customers = uniqCatalogNames([
      ...customers,
      ...parseCatalogNameList(roles.customers),
    ]);
    executors = uniqCatalogNames([
      ...executors,
      ...parseCatalogNameList(roles.executors),
    ]);
  }

  customers = uniqCatalogNames([
    ...customers,
    ...migratedItems.map((i) => i.owner),
  ]);
  executors = uniqCatalogNames([
    ...executors,
    ...migratedItems.map((i) => i.assignee),
  ]);
  projects = uniqCatalogNames([
    ...projects,
    ...migratedItems
      .filter((i) => i.type === "project")
      .map((i) => containerNameFromBacklog(i.backlog)),
  ]);
  products = uniqCatalogNames([
    ...products,
    ...migratedItems
      .filter((i) => i.type === "product")
      .map((i) => containerNameFromBacklog(i.backlog)),
  ]);

  return {
    version: 3,
    startDate: planStart,
    teams,
    sizeRanges: parsedRanges,
    customers,
    executors,
    projects,
    products,
    portfolioNotes:
      data.portfolioNotes != null ? String(data.portfolioNotes) : "",
    changeLog: parseChangeLog(data.changeLog),
    portfolioPack:
      data.portfolioPack != null && String(data.portfolioPack).trim()
        ? String(data.portfolioPack).trim()
        : undefined,
    clearedDemandTeams:
      data.clearedDemandTeams != null &&
      String(data.clearedDemandTeams).trim()
        ? String(data.clearedDemandTeams).trim()
        : undefined,
    teamRosterSeeded:
      data.teamRosterSeeded != null && String(data.teamRosterSeeded).trim()
        ? String(data.teamRosterSeeded).trim()
        : undefined,
    cashFlowUnit: "tys",
    deletedItemIds: parseIdList(data.deletedItemIds),
    deletedProjectKeys: parseIdList(data.deletedProjectKeys),
    savedAt:
      data.savedAt != null && String(data.savedAt).trim()
        ? String(data.savedAt).trim()
        : undefined,
    items: itemRanksAlreadyUnique(filledItems)
      ? filledItems
      : ensureUniquePriorities(filledItems, parsedRanges),
  };
}

function itemRanksAlreadyUnique(items: WorkItem[]): boolean {
  if (!items.length) return true;
  const used = new Set<number>();
  for (const item of items) {
    const rank = item.manualRank;
    if (rank == null || !Number.isFinite(rank) || rank < 1 || used.has(rank)) {
      return false;
    }
    used.add(rank);
  }
  return used.size === items.length;
}
