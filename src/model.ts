export type ItemType = "project" | "product";
export type ItemStatus = "idea" | "ready" | "in_progress" | "blocked" | "done";
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

/** Legacy person-week estimate → nearest t-shirt by planning midpoint. */
export function pwToSize(
  estimatePw: number,
  _capacityPw = 3,
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
 * Calendar weeks a size occupies at a team's capacity (same fill rule as schedule).
 */
export function calendarWeeksForSize(
  size: TShirtSize,
  capacityPw: number,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  const pw = sizePlanWeeks(size, ranges);
  const cap = Math.max(capacityPw, 0.001);
  return Math.max(1, Math.ceil(pw / cap - 1e-9));
}

/**
 * Map a dragged/resized Gantt span (inclusive calendar weeks) to the nearest t-shirt
 * for that team's capacity — used when the user edits bar length on the timeline.
 */
export function nearestSizeForCalendarWeeks(
  calendarWeeks: number,
  capacityPw: number,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): TShirtSize {
  const target = Math.max(1, Math.round(calendarWeeks));
  const estimatePw = target * Math.max(capacityPw, 0.001);
  return nearestSizeForEstimatePw(estimatePw, ranges);
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
  /** Person-weeks available per calendar week (derived: row count). */
  capacityPw: number;
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
  const needle = /архитектур/.test(n)
    ? "архитектур"
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
    const i = catalog.findIndex((r) => r.includes(needle));
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
    const canonical = canonicalizeCatalogRole(role) ?? role;
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
    const name = raw.trim();
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
  team.roles = uniqueRolesFromMembers(team.members);
  team.capacityPw = team.members?.length ?? 0;
  return team;
}

/** Catalog of Потребность roles the user can add to a team. */
export const ASSIGNMENT_ROLE_CATALOG = [
  "бизнес аналитик",
  "архитектура",
  "аналитика",
  "разработка",
  "тестирование",
] as const;

/** Default Потребность roles seeded on each new team assignment. */
export const DEFAULT_ASSIGNMENT_ROLE_NAMES = [
  "аналитика",
  "разработка",
] as const;

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
  return name.trim().toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ");
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
  if (teamRoleNames === undefined) return roles;
  const allowed = uniqueRoleNames(teamRoleNames);
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

/**
 * Silent capacity for queues/Gantt: 1 чел·нед per роль—ФИО row.
 * Not shown on the Команды tab.
 */
export function computedTeamCapacityPw(
  team: Pick<Team, "members" | "roles">
): number {
  return team.members?.length ?? 0;
}

export function applyComputedTeamCapacities<T extends Team>(teams: T[]): T[] {
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
  if (n.includes("архитектур")) return "Архитектор";
  if (n.includes("бизнес")) return "Бизнес-аналитик";
  if (n.includes("тестир")) return "Тестировщик";
  if (n.includes("разраб")) return "Разработчик";
  if (n.includes("аналит")) return "Аналитик";
  const trimmed = roleName.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function isArchitectureRole(role: AssignmentRole): boolean {
  return /архитектур/i.test(role.name) || role.id === "architecture";
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
  const needle = /архитектур/.test(n)
    ? "архитектур"
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
    const i = roles.findIndex((r) => r.name.toLowerCase().includes(needle));
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
  } else if (teamRoleNames !== undefined) {
    roles = filterAssignmentRolesToTeam(roles, teamRoleNames);
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
  /** RICE Reach — how many users/period */
  reach: number;
  /** RICE Impact — 0.25 / 0.5 / 1 / 2 / 3 */
  impact: RiceImpact;
  /** RICE Confidence — 0–1 (UI may show %) */
  confidence: number;
  notes?: string;
  /**
   * Explicit portfolio priority (1 = highest). Unique across items.
   * Drives queue order and Gantt dependencies. null only before ensureUniquePriorities.
   */
  manualRank: number | null;
  /** Чистая прибыль (ЧП) за 12 мес., млрд ₽; null = не задано */
  cashFlow12m: number | null;
  /** ROI за 12 мес., % (15 = 15%); null = не задано */
  roi12m: number | null;
  /** Потребность: «Отправлено» after submit. Absent = черновик. */
  demandStatus?: DemandStatus;
}

export function ensureItemAssignmentRoles(
  items: WorkItem[],
  teams: Team[] = []
): WorkItem[] {
  const names = new Map(teams.map((t) => [t.id, t.name]));
  const roleNames = new Map(teams.map((t) => [t.id, resolveTeamRoleNames(t)]));
  return items.map((item) => ({
    ...item,
    assignments: item.assignments.map((a) =>
      fillAssignmentRoles(
        a,
        DEFAULT_SIZE_RANGES,
        names.get(a.teamId) ?? "",
        roleNames.get(a.teamId)
      )
    ),
  }));
}

export function ensureStateAssignmentRoles<T extends { items: WorkItem[]; teams?: Team[] }>(
  state: T
): T {
  const teams = applyComputedTeamCapacities(
    (state.teams ?? []).map((t) => {
      const members = t.members != null ? t.members : [];
      return syncTeamRoster({ ...t, members });
    })
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
  /** Заказчики (Roles → picker Заказчик) */
  customers: string[];
  /** Исполнители (Roles → picker Исполнитель) */
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
  /** Demo monitoring tab (layout A, labelled «Мониторинг»); default shown. */
  demoVariantA: boolean;
  /** Retired second demo tab; always hidden. Kept for load compatibility. */
  demoVariantB: boolean;
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
   * Work-item ids the user deleted. Seed merge must not resurrect these
   * (x001–x063 or later user-created ids).
   */
  deletedItemIds?: string[];
  /**
   * Project / product container names the user removed. Seed merge must not
   * restore those groups or re-add catalog chips.
   */
  deletedProjectKeys?: string[];
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

/** Persist flag: team rows removed from every functionality (catalog stays). */
export const CLEARED_DEMAND_TEAMS_V1 = "v1";

/** Persist flag: Команды role—ФИО catalog was seeded once (`teamRosterSeeded-v1`). */
export const SEEDED_TEAM_ROSTER_V1 = "v1";

/** True when at least one Команды row has a роль—ФИО seat. */
export function teamCatalogHasRoster(teams: readonly Team[] | undefined): boolean {
  return (teams ?? []).some((t) => (t.members?.length ?? 0) > 0);
}

/**
 * One-shot demo roster for teams that never saved `members`.
 * After the flag is set, empty/missing rows stay empty (user catalog).
 * Missing flag + empty members is a wipe (e.g. v1 blob) — re-seed FIO.
 */
export function applySeededTeamRoster(current: AppState): {
  state: AppState;
  applied: boolean;
} {
  if (current.teamRosterSeeded === SEEDED_TEAM_ROSTER_V1) {
    const teams = applyComputedTeamCapacities(
      current.teams.map((t) =>
        syncTeamRoster({ ...t, members: t.members ?? [] })
      )
    );
    return { state: { ...current, teams }, applied: false };
  }
  const teams = applyComputedTeamCapacities(
    current.teams.map((t) =>
      syncTeamRoster({
        ...t,
        members:
          t.members != null && t.members.length > 0
            ? t.members
            : makeSeedTeamMembers(t.id),
      })
    )
  );
  return {
    state: { ...current, teams, teamRosterSeeded: SEEDED_TEAM_ROSTER_V1 },
    applied: true,
  };
}

/**
 * Restore seed PROJECT groups the user never had. Does not resurrect
 * user-deleted functionalities (`deletedItemIds`) or deleted project chips
 * (`deletedProjectKeys`). Never copies seed team assignments onto rows.
 */
export function mergeMissingSeedItems(
  current: AppState,
  seedItems: WorkItem[]
): { state: AppState; applied: boolean } {
  const seedById = new Map(seedItems.map((item) => [item.id, item]));
  const have = new Set(current.items.map((item) => item.id));
  const deletedIds = new Set(current.deletedItemIds ?? []);
  const deletedProjects = new Set(
    (current.deletedProjectKeys ?? [])
      .map((k) => catalogKey(k))
      .filter(Boolean)
  );
  const liveProjectKeys = new Set(
    current.items
      .map((item) => catalogKey(containerNameFromBacklog(item.backlog)))
      .filter(Boolean)
  );

  let typeFixed = 0;
  const kept = current.items.map((item) => {
    const src = seedById.get(item.id);
    if (!src || item.type === src.type) return item;
    typeFixed += 1;
    return { ...item, type: src.type };
  });

  const missing = seedItems
    .filter((item) => {
      if (have.has(item.id) || deletedIds.has(item.id)) return false;
      const key = catalogKey(containerNameFromBacklog(item.backlog));
      if (!key || deletedProjects.has(key)) return false;
      // User already has this project — do not fill in deleted siblings.
      if (liveProjectKeys.has(key)) return false;
      return true;
    })
    .map((item) => {
      const clone = structuredClone(item);
      clone.assignments = [];
      return clone;
    });

  if (!missing.length && !typeFixed) {
    return { state: current, applied: false };
  }

  const items = ensureUniquePriorities(
    [...kept, ...missing],
    current.sizeRanges
  );
  const message = missing.length
    ? `Восстановлены ${missing.length} проектов из таблицы приоритезации`
    : `Тип ${typeFixed} записей возвращён к проектному портфелю`;

  const keepCatalog = (names: string[]) =>
    names.filter((n) => !deletedProjects.has(catalogKey(n)));

  return {
    state: {
      ...current,
      items,
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
      changeLog: prependChangeLog(current.changeLog, message, "system"),
    },
    applied: true,
  };
}

/** Wipe item.assignments once; Команды role—ФИО catalog is untouched. */
export function applyClearedDemandTeams(current: AppState): {
  state: AppState;
  applied: boolean;
} {
  if (current.clearedDemandTeams === CLEARED_DEMAND_TEAMS_V1) {
    return { state: current, applied: false };
  }
  const hadTeams = current.items.some((item) => item.assignments.length > 0);
  return {
    state: {
      ...current,
      items: hadTeams
        ? current.items.map((item) =>
            item.assignments.length ? { ...item, assignments: [] } : item
          )
        : current.items,
      clearedDemandTeams: CLEARED_DEMAND_TEAMS_V1,
      ...(hadTeams
        ? {
            changeLog: prependChangeLog(
              current.changeLog,
              "Сняты назначения команд со всех функциональностей — назначьте заново на вкладке «Потребность»",
              "system"
            ),
          }
        : {}),
    },
    applied: true,
  };
}

/** Persist flags for demo monitoring (A shown by default; B retired / hidden). */
export function parseDemoVariantShown(
  data: Record<string, unknown>,
  which: "A" | "B"
): boolean {
  if (which === "B") return false;
  const key = "demoVariantA";
  const raw = data[key];
  if (raw === false || raw === 0 || raw === "false") return false;
  if (raw === true || raw === 1 || raw === "true") return true;
  const hidden = data.hiddenDemoVariants;
  if (Array.isArray(hidden)) {
    return !hidden.map((x) => String(x).toUpperCase()).includes(which);
  }
  return true;
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
  rice: number;
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
  rice: number;
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

/** Scheduled week load exceeds team capacity (rare after queue merge). */
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
 * Weeks where scheduled demand (same intervals as Gantt bars) exceeds capacity.
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
 * consumes capacity week-by-week without waiting for the queue.
 * Kept for diagnostics; UI capacity strips use schedulePortfolio load instead.
 */
export function concurrentTeamLoad(
  state: AppState,
  maxWeeks = 52
): Record<string, TeamLoadWeek[]> {
  const ranges = state.sizeRanges ?? DEFAULT_SIZE_RANGES;
  const result: Record<string, TeamLoadWeek[]> = {};

  for (const team of state.teams) {
    const weeks: TeamLoadWeek[] = Array.from({ length: maxWeeks }, (_, w) => ({
      week: w,
      weekStart: addWeeks(state.startDate, w),
      usedPw: 0,
      capacityPw: team.capacityPw,
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
          const take = Math.min(team.capacityPw, rem);
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
 * would exceed team capacity before the queue merges slots.
 */
export function concurrentOverloadWeeks(
  state: AppState,
  maxWeeks = 52
): Record<string, Set<number>> {
  return scheduledOverloadWeeks(concurrentTeamLoad(state, maxWeeks));
}

/** Standard RICE impact scale (Intercom / product ops). */
export const RICE_IMPACT_OPTIONS = [0.25, 0.5, 1, 2, 3] as const;
export type RiceImpact = (typeof RICE_IMPACT_OPTIONS)[number];

export const RICE_IMPACT_LABELS: Record<RiceImpact, string> = {
  0.25: "Минимальное",
  0.5: "Низкое",
  1: "Среднее",
  2: "Высокое",
  3: "Огромное",
};

/** Map legacy WSJF Business Value (1–10) → RICE Impact. */
export function impactFromBusinessValue(bv: number): RiceImpact {
  if (bv <= 2) return 0.25;
  if (bv <= 4) return 0.5;
  if (bv <= 6) return 1;
  if (bv <= 8) return 2;
  return 3;
}

export function parseRiceImpact(
  raw: unknown,
  fallback: RiceImpact = 1
): RiceImpact {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  for (const opt of RICE_IMPACT_OPTIONS) {
    if (Math.abs(n - opt) < 0.001) return opt;
  }
  return fallback;
}

/** Accept 0–1 or 0–100; clamp to 0–1. */
export function parseRiceConfidence(
  raw: unknown,
  fallback = 0.8
): number {
  let n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  if (n > 1) n = n / 100;
  return Math.round(Math.min(1, Math.max(0, n)) * 100) / 100;
}

/**
 * RICE Effort = sum of t-shirt person-weeks (replaces WSJF Job Size).
 * Denominator never below 0.5.
 */
export function riceEffortWeeks(
  item: WorkItem,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  return Math.max(totalEstimateWeeks(item, ranges), 0.5);
}

/** RICE = (Reach × Impact × Confidence) / Effort (чел·нед по маечной оценке). */
export function rice(
  item: WorkItem,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  const score =
    (item.reach * item.impact * item.confidence) /
    riceEffortWeeks(item, ranges);
  return Math.round(score * 100) / 100;
}

/**
 * Migrate legacy WSJF fields → RICE when reach/impact/confidence absent.
 * - businessValue → impact (buckets)
 * - reach → 100 (no WSJF analogue)
 * - confidence → clamp((TC+RR)/20, 0.5..1)
 * - jobSize dropped; Effort = t-shirt weeks
 */
export function riceFieldsFromRaw(
  r: Record<string, unknown>
): Pick<WorkItem, "reach" | "impact" | "confidence"> {
  const hasRice =
    r.reach != null || r.impact != null || r.confidence != null;
  if (hasRice) {
    return {
      reach: Math.max(0, Number(r.reach) || 100),
      impact: parseRiceImpact(r.impact, 1),
      confidence: parseRiceConfidence(r.confidence, 0.8),
    };
  }
  const bv = Number(r.businessValue) || 5;
  const tc = Number(r.timeCriticality) || 5;
  const rr = Number(r.riskReduction) || 5;
  return {
    reach: 100,
    impact: impactFromBusinessValue(bv),
    confidence: Math.max(0.5, parseRiceConfidence((tc + rr) / 20, 0.8)),
  };
}

/** Optional finance number; missing / empty / invalid → null. */
export function optionalRubFromRaw(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Legacy ЧП was stored as full ₽ (demo values in the millions). Values ≥ 1000
 * are remapped to млрд ₽ on the same demo scale (÷10⁷ → e.g. 12.4M → 1.2).
 */
export function migrateCashFlowToMlrd(n: number): number {
  if (Math.abs(n) >= 1000) {
    return Math.round((n / 10_000_000) * 10) / 10;
  }
  return n;
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

/** Sort by explicit priority (1 first); missing ranks fall back to RICE */
export function sortByPriority(
  items: WorkItem[],
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  return [...items].sort((a, b) => {
    const pa = a.manualRank;
    const pb = b.manualRank;
    if (pa != null && pb != null && pa !== pb) return pa - pb;
    if (pa != null && pb == null) return -1;
    if (pa == null && pb != null) return 1;
    const dr = rice(b, ranges) - rice(a, ranges);
    if (dr !== 0) return dr;
    return totalEstimateWeeks(a, ranges) - totalEstimateWeeks(b, ranges);
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
 * Keeps valid unique ranks; fills gaps / fixes duplicates by RICE order.
 */
export function ensureUniquePriorities(
  items: WorkItem[],
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  const byRice = [...items].sort((a, b) => {
    const dr = rice(b, ranges) - rice(a, ranges);
    if (dr !== 0) return dr;
    return totalEstimateWeeks(a, ranges) - totalEstimateWeeks(b, ranges);
  });

  const used = new Set<number>();
  const kept = new Map<string, number>();

  for (const item of byRice) {
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
 * How Gantt / queues place work relative to team capacity.
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
   * of an item share one start week and run in parallel (respecting capacity).
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
 * T-shirt on assignment → person-weeks; team capacityPw = person-weeks per calendar week.
 *
 * Mode `teamQueue`: later items wait until previous team work finishes (FS), then
 * fill free slots — classic queue arrows on Gantt.
 * Mode `maxUtilization`: process items in priority order; for each item pick a
 * common start week (≥ all planned starts) where every assigned team can run its
 * track contiguously from that week in parallel; consume capacity, then next item.
 * Does not use a per-team FS cursor that splits one item’s teams across time.
 * Mode `manual`: user dates fixed — effort fills from workStartDate at capacityPw
 * rate even when weeks already have other work, so overload is visible.
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

  const emptyWeeks = (team: Team): TeamLoadWeek[] =>
    Array.from({ length: maxWeeks }, (_, w) => ({
      week: w,
      weekStart: addWeeks(state.startDate, w),
      usedPw: 0,
      capacityPw: team.capacityPw,
      items: [] as LoadDemandItem[],
    }));

  const placeEffort = (
    weeks: TeamLoadWeek[],
    team: Team,
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
        take = Math.min(team.capacityPw, remaining);
      } else {
        const free = Math.max(0, team.capacityPw - slot.usedPw);
        if (free <= 0.001) {
          if (!allowSkipBusy) break;
          endWeek += 1;
          continue;
        }
        take = Math.min(free, remaining);
        offsetInWeek = (slot.usedPw / team.capacityPw) * 7;
      }

      const weekStart = addWeeks(state.startDate, endWeek);
      const daysUsed = (take / Math.max(team.capacityPw, 0.001)) * 7;
      endDate = addDays(weekStart, offsetInWeek + daysUsed);

      addLoadContribution(slot, item, take);
      remaining -= take;
      if (remaining > 0.001) endWeek += 1;
    }

    return { endWeek, endDate, startDate };
  };

  if (mode === "maxUtilization") {
    for (const team of state.teams) {
      load[team.id] = emptyWeeks(team);
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
            t.team.capacityPw,
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
          t.team,
          item,
          commonStart,
          t.estimatePw,
          false
        );
        const durationWeeks =
          t.team.capacityPw > 0
            ? Math.round((t.estimatePw / t.team.capacityPw) * 100) / 100
            : t.estimatePw;

        slices.push({
          item,
          teamId: t.team.id,
          size: t.size,
          estimatePw: t.estimatePw,
          rice: rice(item, ranges),
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
      const weeks = emptyWeeks(team);

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
            weeks[startWeek].usedPw >= team.capacityPw - 0.001
          ) {
            startWeek += 1;
          }
        }

        const { endWeek, endDate, startDate } = placeEffort(
          weeks,
          team,
          entry.item,
          startWeek,
          estimatePw,
          mode === "teamQueue"
        );

        const durationWeeks =
          team.capacityPw > 0
            ? Math.round((estimatePw / team.capacityPw) * 100) / 100
            : estimatePw;

        slices.push({
          item: entry.item,
          teamId: team.id,
          size: entry.size,
          estimatePw,
          rice: rice(entry.item, ranges),
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
          if (weeks[endWeek] && weeks[endWeek].usedPw >= team.capacityPw - 0.001) {
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
      rice: rice(item, ranges),
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
    return b.rice - a.rice;
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
    const roles = uniqueRolesFromMembers(members);
    return syncTeamRoster({
      id: teamId,
      name: String(t.name ?? "Команда"),
      color: String(t.color ?? "#737373"),
      ...(members ? { members } : {}),
      roles,
      capacityPw: members?.length ?? 0,
    });
  });
  const teamCap = new Map(teams.map((t) => [t.id, t.capacityPw]));

  const items: WorkItem[] = data.items.map((row) => {
    const r = row as Record<string, unknown>;
    const itemDemand = parseDemandStatus(r.demandStatus);
    let assignments: TeamAssignment[] = [];
    if (Array.isArray(r.assignments) && r.assignments.length) {
      assignments = (r.assignments as Record<string, unknown>[])
        .filter((a) => a && typeof a.teamId === "string")
        .map((a) => {
          const teamId = String(a.teamId);
          const cap = teamCap.get(teamId) ?? 3;
          const days = parseOptionalDays(a.days);
          const size =
            a.size != null
              ? parseSize(a.size)
              : days != null
                ? nearestSizeFromDays(days)
                : pwToSize(Number(a.estimatePw) || 1, cap);
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
          size: pwToSize(Number(r.estimatePw) || 1, teamCap.get(r.teamId) ?? 3),
          workStartDate: planStart,
          roles: makeAssignmentRolesForTeam(
            teams.find((t) => t.id === r.teamId)?.roles
          ),
        },
      ];
    }

    return {
      id: String(r.id ?? uid("item")),
      title: String(r.title ?? "Без названия"),
      type: r.type === "project" ? "project" : "product",
      backlog: String(r.backlog ?? "Backlog"),
      assignments,
      status: (["idea", "ready", "in_progress", "blocked", "done"].includes(
        String(r.status)
      )
        ? r.status
        : "idea") as ItemStatus,
      owner: String(r.owner ?? "—"),
      assignee: String(r.assignee ?? ""),
      ...riceFieldsFromRaw(r),
      notes: r.notes != null ? String(r.notes) : undefined,
      manualRank:
        r.manualRank == null || r.manualRank === ""
          ? null
          : Number(r.manualRank),
      cashFlow12m: (() => {
        const raw = optionalRubFromRaw(
          r.cashFlow12m ?? r.chpRub ?? r.chp
        );
        return raw == null ? null : migrateCashFlowToMlrd(raw);
      })(),
      roi12m: (() => {
        const raw = optionalRubFromRaw(r.roi12m ?? r.roiRub ?? r.roi);
        return raw == null ? null : migrateRoiToPercent(raw);
      })(),
      ...(parseDemandStatus(r.demandStatus) === "submitted"
        ? { demandStatus: "submitted" as const }
        : {}),
    };
  });

  const parsedRanges = normalizeSizeRanges(data.sizeRanges);
  const filledItems = items.map((item) => ({
    ...item,
    assignments: item.assignments.map((a) => {
      const team = teams.find((t) => t.id === a.teamId);
      return fillAssignmentRoles(
        a,
        parsedRanges,
        team?.name ?? "",
        team ? resolveTeamRoleNames(team) : undefined
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

  customers = uniqCatalogNames([...customers, ...items.map((i) => i.owner)]);
  executors = uniqCatalogNames([...executors, ...items.map((i) => i.assignee)]);
  projects = uniqCatalogNames([
    ...projects,
    ...items
      .filter((i) => i.type === "project")
      .map((i) => containerNameFromBacklog(i.backlog)),
  ]);
  products = uniqCatalogNames([
    ...products,
    ...items
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
    demoVariantA: parseDemoVariantShown(data, "A"),
    demoVariantB: false,
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
    deletedItemIds: parseIdList(data.deletedItemIds),
    deletedProjectKeys: parseIdList(data.deletedProjectKeys),
    items: ensureUniquePriorities(filledItems, parsedRanges),
  };
}
