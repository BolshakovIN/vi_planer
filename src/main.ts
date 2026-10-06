import "./styles.css";
import {
  AppState,
  ItemSchedule,
  ScheduledSlice,
  WorkItem,
  ItemStatus,
  ITEM_STATUSES,
  coerceItemStatus,
  ItemType,
  TeamAssignment,
  formatDate,
  schedulePortfolio,
  ScheduleMode,
  isCapacityScheduleMode,
  normalizeScheduleMode,
  sortByPriority,
  totalEstimateWeeks,
  sizePlanWeeks,
  sizePlanDays,
  sizeLabel,
  sizePillCaption,
  sizeRangesSummary,
  parseSize,
  TSHIRT_SIZES,
  TShirtSize,
  SizeRanges,
  normalizeSizeRanges,
  hasTeam,
  uid,
  rice,
  riceEffortWeeks,
  parseRiceImpact,
  RICE_IMPACT_OPTIONS,
  RICE_IMPACT_LABELS,
  RiceImpact,
  snapToMonday,
  addDays,
  addWeeks,
  ensureUniquePriorities,
  findPriorityConflict,
  nextPriority,
  moveItemToPriority,
  reorderVisiblePriority,
  orderedProjectGroups,
  moveProjectGroupToPriority,
  projectGroupKey,
  TeamLoadWeek,
  Team,
  scheduledOverloadWeeks,
  isTeamWeekOverloaded,
  utilizationPct,
  nearestSizeForCalendarWeeks,
  nearestSizeFromDays,
  calendarWeeksForSize,
  assignmentPlanDays,
  assignmentPlanWeeks,
  itemFinishDate,
  projectFinishDate,
  totalEstimateDays,
  uniqCatalogNames,
  containerNameFromBacklog,
  ChangeLogKind,
  CHANGE_LOG_MAX,
  prependChangeLog,
  AssignmentDemandStatus,
  ASSIGNMENT_DEMAND_STATUSES,
  ASSIGNMENT_DEMAND_LABELS,
  resolveAssignmentDemandStatus,
  makeAssignmentRole,
  makeAssignmentRolesForTeam,
  availableAssignmentRolesForTeam,
  filterAssignmentRolesToTeam,
  resolveTeamRoleNames,
  ASSIGNMENT_ROLE_CATALOG,
  canonicalizeCatalogRole,
  normalizeAssignmentRoleName,
  teamHasRoleName,
  assignmentHasRoleName,
  computedTeamCapacityPw,
  applyComputedTeamCapacities,
  syncTeamRoster,
  AssignmentRole,
  fillAssignmentRoles,
  rolePlanDays,
  resolveRoleDemandStatus,
  isArchitectureRole,
  submittedAssignmentRoles,
  roleJobLabel,
  shortFio,
  TeamMember,
  MIGRATION_SEEDED_TEAM_ROSTER,
  ensureStateAssignmentRoles,
  weekIndex,
  WORKING_DAYS_PER_WEEK,
  rememberDeletedIds,
  AppRole,
  AppPermission,
  APP_ROLES,
  APP_ROLE_LABELS,
  canApp,
  collectAppPeople,
  findRoleAssignment,
  parseAppRole,
  resolveAppRole,
  resolveLeadTeamIds,
  upsertRoleAssignment,
} from "./model";
import { SEED, PORTFOLIO_PACK_ID } from "./seed";
import {
  loadState,
  saveState,
  getSyncStatus,
  onSyncStatusChange,
  syncStatusLabel,
  hasPortfolioPackBackup,
  applyCurrentPortfolioPack,
  rollbackPortfolioPack,
} from "./storage";
import { V2_UI_TAB_KEY, V2_CURRENT_USER_KEY } from "./v2Store";
import {
  downloadMarkdownAsPdf,
  downloadPlanerReportPdf,
  downloadGanttSchematicPdf,
  type PlanerReportData,
  type GanttPdfData,
} from "./pdfExport";

/** Release / deploy stamp in the header (DD.MM.YYYY) */
const RELEASE_UPDATED = "03.10.2026";

type Tab =
  | "portfolio"
  | "demand"
  | "planning"
  | "timeline"
  | "queuesTest"
  | "demoA"
  | "demoB"
  | "capacity"
  | "changelog"
  | "settings";
type SortKey = "priority" | "rice" | "estimate" | "eta";
type SortDir = "asc" | "desc";
type GanttBarDragMode = "move" | "resize-left" | "resize-right";

const TAB_LABELS: Record<Tab, string> = {
  portfolio: "Реестр",
  demand: "Потребность",
  planning: "Планирование",
  timeline: "Гант",
  queuesTest: "Очередь команд",
  demoA: "Мониторинг",
  demoB: "Мониторинг",
  capacity: "Команды",
  changelog: "Журнал",
  settings: "Настройки",
};

const TAB_APP_PERMISSION: Partial<Record<Tab, AppPermission>> = {
  portfolio: "tab.portfolio",
  demand: "tab.demand",
  planning: "tab.planning",
  timeline: "tab.timeline",
  queuesTest: "tab.queuesTest",
  demoA: "tab.demoA",
  capacity: "tab.capacity",
  changelog: "tab.changelog",
  settings: "tab.settings",
};

function readStoredCurrentUserId(): string {
  try {
    return String(localStorage.getItem(V2_CURRENT_USER_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

function writeStoredCurrentUserId(personId: string) {
  try {
    const id = personId.trim();
    if (!id) localStorage.removeItem(V2_CURRENT_USER_KEY);
    else localStorage.setItem(V2_CURRENT_USER_KEY, id);
  } catch {
    /* quota / private mode */
  }
}

function appPeopleDirectory() {
  return collectAppPeople(state.teams, state.roleAssignments);
}

function ensureCurrentUserId(): string {
  const people = appPeopleDirectory();
  if (!people.length) return "";
  const stored = readStoredCurrentUserId();
  if (stored && people.some((p) => p.id === stored)) return stored;
  const pm = (state.roleAssignments ?? []).find((a) => a.role === "pm_pmo");
  const fallback =
    (pm && people.find((p) => p.id === pm.personId)?.id) || people[0]!.id;
  writeStoredCurrentUserId(fallback);
  return fallback;
}

function currentAppRole(): AppRole {
  return resolveAppRole(state.roleAssignments, ensureCurrentUserId());
}

function currentLeadTeamIds(): string[] {
  const personId = ensureCurrentUserId();
  const person = appPeopleDirectory().find((p) => p.id === personId);
  return resolveLeadTeamIds(
    findRoleAssignment(state.roleAssignments, personId),
    person
  );
}

function currentCan(
  permission: AppPermission,
  teamId?: string
): boolean {
  return canApp(currentAppRole(), permission, {
    teamId,
    leadTeamIds: currentLeadTeamIds(),
  });
}

function canAccessTab(tab: Tab): boolean {
  if (tab === "demoB") return canAccessTab("portfolio");
  const perm = TAB_APP_PERMISSION[tab];
  if (!perm) return true;
  return currentCan(perm);
}

const TAB_ICON_SVG: Record<Tab, string> = {
  portfolio:
    '<rect x="2" y="3.1" width="2" height="2" rx="0.4"/><rect x="5.5" y="3.1" width="8.5" height="2" rx="0.4"/><rect x="2" y="7" width="2" height="2" rx="0.4"/><rect x="5.5" y="7" width="8.5" height="2" rx="0.4"/><rect x="2" y="10.9" width="2" height="2" rx="0.4"/><rect x="5.5" y="10.9" width="8.5" height="2" rx="0.4"/>',
  demand:
    '<path d="M4.4 2.5h5.1L11.8 4.9v8.6H4.4V2.5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M9.4 2.5V5h2.4M6.4 7.8h3.4M6.4 10.2h2.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  planning:
    '<rect x="2.4" y="3.4" width="11.2" height="10.2" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2.4 6.4h11.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5.4 2.3v2.4M10.6 2.3v2.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  timeline:
    '<rect x="2" y="3" width="7.6" height="2.3" rx="0.6"/><rect x="4.2" y="6.85" width="9.8" height="2.3" rx="0.6"/><rect x="3.1" y="10.7" width="6.2" height="2.3" rx="0.6"/>',
  demoA:
    '<rect x="2.2" y="2.4" width="11.6" height="8.1" rx="1.3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6.6 10.5v2.2h2.8v-2.2M5.2 13.2h5.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  demoB:
    '<rect x="2.2" y="2.4" width="11.6" height="8.1" rx="1.3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6.6 10.5v2.2h2.8v-2.2M5.2 13.2h5.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  queuesTest:
    '<circle cx="3.4" cy="7.2" r="1.35"/><circle cx="8" cy="7.2" r="1.35"/><circle cx="12.6" cy="7.2" r="1.35"/><path d="M2.2 11.1h11.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  capacity:
    '<circle cx="6.1" cy="5.1" r="2"/><path d="M2.6 12.4c.2-2.5 1.6-3.6 3.5-3.6s3.3 1.1 3.5 3.6"/><circle cx="11.1" cy="5.6" r="1.55"/><path d="M9.3 12.4c.15-1.7 1.1-2.5 2.2-2.5 1.15 0 2.05.8 2.2 2.5"/>',
  changelog:
    '<path d="M3.6 2.6h8.8v10.8H4.4c-1 0-1.8-.8-1.8-1.8V4.3c0-.9.8-1.7 1-1.7z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.4 5.8h4M6.4 8.2h4M6.4 10.6h2.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>',
  settings:
    '<path d="M3 5.2h10M3 10.8h10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="6.2" cy="5.2" r="1.55"/><circle cx="10.1" cy="10.8" r="1.55"/>',
};

function tabIconHtml(tab: Tab, quiet = false): string {
  return `<span class="tab-ico${quiet ? " tab-ico-quiet" : ""}" aria-hidden="true"><svg viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" focusable="false">${TAB_ICON_SVG[tab]}</svg></span>`;
}

function tabButtonHtml(id: Tab, extraClass = ""): string {
  if (!canAccessTab(id)) return "";
  const quiet = id === "capacity" || id === "changelog" || id === "settings";
  const cls = ["tab", extraClass, ui.tab === id ? "active" : ""]
    .filter(Boolean)
    .join(" ");
  return `<button type="button" class="${cls}" data-tab="${id}">${tabIconHtml(id, quiet)}${escapeHtml(TAB_LABELS[id])}</button>`;
}

/** Legacy deep-link / tab ids: `teams` → Очередь команд. */
function normalizeTab(tab: string | undefined | null): Tab {
  if (tab === "teams") return "queuesTest";
  if (tab === "roles") return "capacity";
  if (tab === "projects") return "portfolio";
  if (
    tab === "portfolio" ||
    tab === "demand" ||
    tab === "planning" ||
    tab === "timeline" ||
    tab === "queuesTest" ||
    tab === "demoA" ||
    tab === "demoB" ||
    tab === "capacity" ||
    tab === "changelog" ||
    tab === "settings"
  ) {
    return tab;
  }
  return "portfolio";
}

function readStoredUiTab(): Tab {
  try {
    return normalizeTab(localStorage.getItem(V2_UI_TAB_KEY));
  } catch {
    return "portfolio";
  }
}

function writeStoredUiTab(tab: Tab) {
  try {
    localStorage.setItem(V2_UI_TAB_KEY, tab);
  } catch {
    /* quota / private mode */
  }
}

/** Switch tabs and remember the choice across reloads (v2 store key only). */
function setActiveTab(next: string | undefined | null) {
  const tab = normalizeTab(next);
  if (tab !== "demand") {
    ui.needAddItemId = null;
    ui.needAddRoleKey = null;
    ui.needCreatingFn = false;
  }
  if (tab !== "planning") {
    ui.planTaskForm = null;
  }
  ui.tab = tab;
  writeStoredUiTab(tab);
}

function ensureVisibleTab() {
  const prev = ui.tab;
  // Variant B retired — bounce leftover demoB bookmarks to portfolio.
  if (ui.tab === "demoB") ui.tab = "portfolio";
  if ((ui.tab as string) === "roles") ui.tab = "capacity";
  if (!canAccessTab(ui.tab)) {
    const fallback: Tab[] = [
      "portfolio",
      "timeline",
      "demoA",
      "changelog",
      "demand",
      "planning",
      "capacity",
      "settings",
    ];
    ui.tab = fallback.find((t) => canAccessTab(t)) ?? "portfolio";
  }
  if (ui.tab !== prev) writeStoredUiTab(ui.tab);
}

interface UiState {
  tab: Tab;
  typeFilter: "all" | ItemType;
  teamFilter: string;
  statusFilter: "all" | ItemStatus;
  query: string;
  sortKey: SortKey;
  sortDir: SortDir;
  editingId: string | null;
  creating: boolean;
  /** Реестр project card (group key); null when closed */
  editingProjectKey: string | null;
  creatingProject: boolean;
  /** Gantt horizon in weeks */
  ganttWeeks: number;
  /**
   * Gantt / Очередь / Мониторинг schedule mode — see SCHEDULE_MODE_META.
   * Controlled by the two toggle buttons (none active → `manual`).
   * Shared via localStorage `vi-planer-schedule-mode`.
   */
  scheduleMode: ScheduleMode;
  hiddenCols: HideablePortfolioCol[];
  colPickerOpen: boolean;
  /** Selected functionality on Потребность (legacy detail; optional) */
  needItemId: string | null;
  /** Single-select project chip; null = pick a project */
  needProjectKey: string | null;
  /** Functionality whose «+ Добавить команду» picker is open (Потребность) */
  needAddItemId: string | null;
  /** Name prompt for «+ Функциональность» on the selected project */
  needCreatingFn: boolean;
  /** `${itemId}:${teamId}` whose «+ Роль» picker is open */
  needAddRoleKey: string | null;
  /** `${itemId}:${teamId}:${roleId}` while days input is shown */
  needDaysEdit: string | null;
  needCollapsedProjects: Record<string, true>;
  needCollapsedItems: Record<string, true>;
  /** Selected catalog teams on Планирование (Моя команда) */
  planTeamIds: string[];
  /** True when the user cleared the team filter (empty ≠ default first team). */
  planTeamFilterCleared: boolean;
  /** Last-clicked team chip (stronger highlight) */
  planFocusTeamId: string | null;
  planCollapsedProjects: Record<string, true>;
  planCollapsedItems: Record<string, true>;
  ganttCollapsedProjects: Record<string, true>;
  ganttCollapsedItems: Record<string, true>;
  /** Collapsed team rows under a Gantt functionality (`itemId:teamId`). */
  ganttCollapsedTeams: Record<string, true>;
  /** Inline «Новая задача на таймлайн» */
  planTaskForm: {
    itemId: string;
    teamId: string;
    roleId: string;
    memberId: string | null;
    startWeek: number;
    days: number;
  } | null;
}

const SCHEDULE_MODE_META: Record<
  ScheduleMode,
  { label: string; hint: string }
> = {
  manual: {
    label: "Как задано",
    hint: "Старты = даты в карточке; возможны перегрузки ёмкости.",
  },
  teamQueue: {
    label: "Последовательная утилизация ресурса",
    hint: "FS-очередь по приоритету внутри команды; следующая работа ждёт конца предыдущей.",
  },
  maxUtilization: {
    label: "Максимальная утилизация ресурса",
    hint: "Все команды одной функциональности стартуют вместе; дата завершения = max по командам.",
  },
};

const ui: UiState = {
  tab: "portfolio",
  typeFilter: "all",
  teamFilter: "all",
  statusFilter: "all",
  query: "",
  sortKey: "priority",
  sortDir: "asc",
  editingId: null,
  creating: false,
  editingProjectKey: null,
  creatingProject: false,
  ganttWeeks: 16,
  scheduleMode: "teamQueue",
  hiddenCols: [],
  colPickerOpen: false,
  needItemId: null,
  needProjectKey: null,
  needAddItemId: null,
  needCreatingFn: false,
  needAddRoleKey: null,
  needDaysEdit: null,
  needCollapsedProjects: {},
  needCollapsedItems: {},
  planTeamIds: [],
  planTeamFilterCleared: false,
  planFocusTeamId: null,
  planCollapsedProjects: {},
  planCollapsedItems: {},
  ganttCollapsedProjects: {},
  ganttCollapsedItems: {},
  ganttCollapsedTeams: {},
  planTaskForm: null,
};

let state: AppState = ensureStateAssignmentRoles(structuredClone(SEED));
/** Latest scheduled load snapshot for overload explain popovers (same weeks as Gantt) */
let lastScheduledLoad: Record<string, TeamLoadWeek[]> = {};
let lastOverflowByTeam: Record<string, Set<number>> = {};
let overloadHoverTimer: number | null = null;
let overloadPinned = false;

/** Ignore [data-edit] row clicks after inline status change (native <select> fires click after change). */
let suppressPortfolioRowEditUntil = 0;
let suppressPortfolioRowEditCleanup: (() => void) | null = null;
/** Removes confirm-dialog listeners; cleared in closeAppPop so they never leak. */
let activeConfirmTeardown: (() => void) | null = null;

function isPortfolioStatusChrome(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(".status-select, .status-cell, [data-status-id]")
  );
}

function armSuppressPortfolioRowEdit() {
  ui.editingId = null;
  ui.creating = false;
  suppressPortfolioRowEditUntil = performance.now() + 800;
  suppressPortfolioRowEditCleanup?.();
  const swallow = (e: Event) => {
    if (performance.now() >= suppressPortfolioRowEditUntil) {
      suppressPortfolioRowEditCleanup?.();
      return;
    }
    const t = e.target;
    if (!(t instanceof Element)) return;
    // Let inline controls and the confirm pop keep working; only block row opens.
    if (
      t.closest(
        ".prio-input, .status-select, #appConfirmPop, [data-stop-edit]"
      )
    ) {
      return;
    }
    if (t.closest("[data-project-card], [data-edit]")) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };
  document.addEventListener("click", swallow, true);
  document.addEventListener("pointerup", swallow, true);
  const tid = window.setTimeout(() => {
    document.removeEventListener("click", swallow, true);
    document.removeEventListener("pointerup", swallow, true);
    if (suppressPortfolioRowEditCleanup === cleanup) {
      suppressPortfolioRowEditCleanup = null;
    }
  }, 800);
  const cleanup = () => {
    window.clearTimeout(tid);
    document.removeEventListener("click", swallow, true);
    document.removeEventListener("pointerup", swallow, true);
    suppressPortfolioRowEditCleanup = null;
  };
  suppressPortfolioRowEditCleanup = cleanup;
}

/** Append a Russian activity-log entry (newest first, capped). */
function logChange(message: string, kind?: ChangeLogKind) {
  state.changeLog = prependChangeLog(state.changeLog, message, kind);
}

function formatLogAt(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function changeLogKindLabel(kind?: ChangeLogKind): string {
  switch (kind) {
    case "item":
      return "Функциональность";
    case "priority":
      return "Приоритет";
    case "team":
      return "Команда";
    case "catalog":
      return "Справочник";
    case "notes":
      return "Заметки";
    case "settings":
      return "Настройки";
    case "schedule":
      return "Расписание";
    case "system":
      return "Система";
    default:
      return "Изменение";
  }
}

function catalogKindRu(
  kind: "customers" | "executors" | "projects" | "products"
): string {
  switch (kind) {
    case "customers":
      return "заказчик";
    case "executors":
      return "исполнитель";
    case "projects":
      return "проект";
    case "products":
      return "продукт";
  }
}

function summarizeItemUpdate(prev: WorkItem, next: WorkItem): string {
  const bits: string[] = [];
  if (prev.title !== next.title) bits.push(`название «${prev.title}»→«${next.title}»`);
  if (prev.status !== next.status)
    bits.push(`статус ${statusLabel(prev.status)}→${statusLabel(next.status)}`);
  if (prev.manualRank !== next.manualRank)
    bits.push(`приоритет #${prev.manualRank ?? "—"}→#${next.manualRank ?? "—"}`);
  const prevTeams = prev.assignments
    .map((a) => teamById(a.teamId)?.name ?? a.teamId)
    .sort()
    .join(", ");
  const nextTeams = next.assignments
    .map((a) => teamById(a.teamId)?.name ?? a.teamId)
    .sort()
    .join(", ");
  if (prevTeams !== nextTeams) bits.push(`команды: ${nextTeams || "—"}`);
  const sizeChanged = (() => {
    const map = new Map(prev.assignments.map((a) => [a.teamId, a]));
    for (const a of next.assignments) {
      const p = map.get(a.teamId);
      if (!p || p.size !== a.size || p.workStartDate !== a.workStartDate || p.days !== a.days)
        return true;
    }
    return prev.assignments.length !== next.assignments.length;
  })();
  if (sizeChanged && prevTeams === nextTeams) bits.push("оценки/старты команд");
  if (bits.length === 0) return `Обновлена «${next.title}»`;
  return `Обновлена «${next.title}»: ${bits.slice(0, 3).join("; ")}`;
}

function szRanges(): SizeRanges {
  return state.sizeRanges;
}

function teamById(id: string) {
  return state.teams.find((t) => t.id === id);
}

function teamAssignmentRoles(team: Team | undefined): AssignmentRole[] {
  return makeAssignmentRolesForTeam(resolveTeamRoleNames(team), szRanges());
}

function fillTeamDemandRoles(
  a: TeamAssignment,
  team: Team | undefined
): TeamAssignment {
  return fillAssignmentRoles(
    a,
    szRanges(),
    team?.name ?? "",
    resolveTeamRoleNames(team)
  );
}

/** Drop demand roles that are no longer in this team's Команды rows. */
function syncDemandRolesToTeam(team: Team) {
  const names = resolveTeamRoleNames(team);
  state.items = state.items.map((item) => ({
    ...item,
    assignments: item.assignments.map((a) =>
      a.teamId === team.id
        ? fillAssignmentRoles(a, szRanges(), team.name, names)
        : a
    ),
  }));
}

function teamCapacityStripHtml(
  team: Team,
  loadWeeks: TeamLoadWeek[],
  overflowWeeks: Set<number>,
  horizonWeeks: number
): string {
  const weekPct = 100 / horizonWeeks;
  const cells = Array.from({ length: horizonWeeks }, (_, w) => {
    const lw = loadWeeks[w];
    const used = lw?.usedPw ?? 0;
    const cap = team.capacityPw;
    const pct = utilizationPct(used, cap);
    const isOverflow =
      overflowWeeks.has(w) || (lw != null && isTeamWeekOverloaded(lw));
    const cls = [
      "cap-cell",
      isOverflow ? "cap-cell-overflow" : pct >= 99 ? "cap-cell-full" : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (isOverflow) {
      return `<button type="button" class="${cls}" style="width:${weekPct}%" data-overload-team="${escapeAttr(team.id)}" data-overload-week="${w}" aria-label="Перегруз Н${w + 1}: расшифровка"><span style="height:${Math.min(100, pct)}%"></span></button>`;
    }
    const title = `Н${w + 1}: ${used.toFixed(1)}/${cap} чел·нед`;
    return `<div class="${cls}" style="width:${weekPct}%" title="${escapeAttr(title)}"><span style="height:${Math.min(100, pct)}%"></span></div>`;
  }).join("");
  return `<div class="cap-strip" style="--team-color:${team.color}">${cells}</div>`;
}

function statusLabel(s: ItemStatus): string {
  const map: Record<ItemStatus, string> = {
    staffing: "Комплектуется",
    in_progress: "В работе",
    paused: "На паузе",
    done: "Завершен",
  };
  return map[s];
}

/** Unified project status when all child items agree; else undefined. */
function projectGroupStatus(items: readonly WorkItem[]): ItemStatus | undefined {
  const statuses = [...new Set(items.map((it) => it.status))];
  return statuses.length === 1 ? statuses[0] : undefined;
}

function rollupById(rollups: ItemSchedule[]): Map<string, ItemSchedule> {
  return new Map(rollups.map((r) => [r.item.id, r]));
}

function sizesSummary(item: WorkItem): string {
  return item.assignments.map((a) => a.size).join(" + ");
}

function teamQueuePw(slices: ScheduledSlice[], teamId: string): number {
  return slices
    .filter((s) => s.teamId === teamId)
    .reduce((sum, s) => sum + s.estimatePw, 0);
}

function sizeSelectOptions(selected: TShirtSize): string {
  return TSHIRT_SIZES.map(
    (sz) =>
      `<option value="${sz}" ${selected === sz ? "selected" : ""}>${sizeLabel(sz, szRanges())}</option>`
  ).join("");
}

function teamsLabel(item: WorkItem): string {
  return item.assignments
    .map((a) => {
      const t = teamById(a.teamId);
      return t?.name ?? a.teamId;
    })
    .join(", ");
}

function teamsCellHtml(item: WorkItem): string {
  const chips = item.assignments
    .map((a) => {
      const t = teamById(a.teamId);
      const name = t?.name ?? a.teamId;
      return `<span class="team-chip" title="${escapeAttr(name)}"><span class="team-chip-name"><span class="team-dot" style="background:${t?.color ?? "#94a3b8"}"></span><span class="team-chip-text">${escapeHtml(name)}</span></span></span>`;
    })
    .join("");
  return `<div class="teams-stack">${chips}</div>`;
}

function filteredItems(rollups: ItemSchedule[]): WorkItem[] {
  const q = ui.query.trim().toLowerCase();
  const byId = rollupById(rollups);
  const filtered = state.items.filter((item) => {
    if (item.type !== "project") return false;
    if (ui.teamFilter !== "all" && !hasTeam(item, ui.teamFilter)) return false;
    if (ui.statusFilter !== "all" && item.status !== ui.statusFilter)
      return false;
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.backlog.toLowerCase().includes(q) ||
      item.owner.toLowerCase().includes(q) ||
      item.assignee.toLowerCase().includes(q) ||
      teamsLabel(item).toLowerCase().includes(q)
    );
  });

  if (ui.sortKey === "priority") {
    const ordered = sortByPriority(filtered);
    return ui.sortDir === "asc" ? ordered : [...ordered].reverse();
  }

  const dir = ui.sortDir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    let cmp = 0;
    if (ui.sortKey === "rice") {
      cmp = rice(a, szRanges()) - rice(b, szRanges());
    } else if (ui.sortKey === "estimate") {
      cmp = totalEstimateWeeks(a, szRanges()) - totalEstimateWeeks(b, szRanges());
    } else {
      const ea = byId.get(a.id)?.endDate ?? "9999-99-99";
      const eb = byId.get(b.id)?.endDate ?? "9999-99-99";
      cmp = ea < eb ? -1 : ea > eb ? 1 : 0;
    }
    if (cmp !== 0) return cmp * dir;
    return a.title.localeCompare(b.title, "ru");
  });
}

const COL_WIDTH_KEY = "vi-planer-col-widths";
const COL_VISIBILITY_KEY = "vi-planer-col-hidden";
const SCHEDULE_MODE_KEY = "vi-planer-schedule-mode";
/** Legacy: separate “optimize” checkbox; migrated into SCHEDULE_MODE_KEY */
const SCHEDULE_MODE_ENABLED_KEY = "vi-planer-schedule-mode-enabled";
/** Legacy boolean toggle; migrated once into SCHEDULE_MODE_KEY */
const AUTO_CAPACITY_SCHEDULE_KEY = "vi-planer-auto-capacity-schedule";
const GANTT_LABEL_COL_KEY = "vi-planer-gantt-label-col";
const GANTT_LABEL_COL_DEFAULT = 240;
const GANTT_LABEL_COL_MIN = 160;
const GANTT_LABEL_COL_MAX = 480;

type PortfolioCol =
  | "priority"
  | "title"
  | "teams"
  | "status"
  | "rice"
  | "cashFlow"
  | "roi"
  | "estimate"
  | "eta";

type HideablePortfolioCol = Exclude<PortfolioCol, "priority" | "title">;

const HIDEABLE_PORTFOLIO_COLS: HideablePortfolioCol[] = [
  "teams",
  "status",
  "rice",
  "cashFlow",
  "roi",
  "estimate",
  "eta",
];

const ALL_PORTFOLIO_COLS: PortfolioCol[] = [
  "priority",
  "title",
  "teams",
  "status",
  "rice",
  "cashFlow",
  "roi",
  "estimate",
  "eta",
];

const PORTFOLIO_COL_LABELS: Record<PortfolioCol, string> = {
  priority: "Приоритет",
  title: "Проект",
  teams: "Команды",
  status: "Статус",
  rice: "RICE",
  cashFlow: "ЧП, млрд ₽",
  roi: "ROI, %",
  estimate: "Маечная оценка",
  eta: "Дата завершения",
};

/** Narrow metric cols; keep finance compact so the table does not explode horizontally. */
const PORTFOLIO_COL_DEFAULTS: Record<PortfolioCol, number> = {
  priority: 96,
  title: 280,
  teams: 220,
  status: 130,
  rice: 72,
  cashFlow: 84,
  roi: 76,
  estimate: 120,
  eta: 168,
};

/** Labels used only for min-width measurement (stacked unit lines must not widen cols). */
const PORTFOLIO_COL_MEASURE_LABELS: Partial<Record<PortfolioCol, string>> = {
  cashFlow: "ЧП",
  roi: "ROI, %",
};

function loadColWidths(): Partial<Record<PortfolioCol, number>> {
  try {
    const raw = localStorage.getItem(COL_WIDTH_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    if (parsed.wsjf != null && parsed.rice == null) {
      parsed.rice = parsed.wsjf;
      delete parsed.wsjf;
    }
    // Drop exact prior finance defaults (110) from full-₽ era so new narrow defaults apply.
    let migrated = false;
    for (const key of ["cashFlow", "roi"] as const) {
      if (parsed[key] === 110) {
        delete parsed[key];
        migrated = true;
      }
    }
    if (migrated) {
      localStorage.setItem(COL_WIDTH_KEY, JSON.stringify(parsed));
    }
    return parsed as Partial<Record<PortfolioCol, number>>;
  } catch {
    return {};
  }
}

function saveColWidths(widths: Partial<Record<PortfolioCol, number>>) {
  localStorage.setItem(COL_WIDTH_KEY, JSON.stringify(widths));
}

function resetColWidths() {
  localStorage.removeItem(COL_WIDTH_KEY);
}

function loadGanttLabelColWidth(): number {
  try {
    const raw = localStorage.getItem(GANTT_LABEL_COL_KEY);
    if (!raw) return GANTT_LABEL_COL_DEFAULT;
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n)) return GANTT_LABEL_COL_DEFAULT;
    return Math.max(
      GANTT_LABEL_COL_MIN,
      Math.min(GANTT_LABEL_COL_MAX, n)
    );
  } catch {
    return GANTT_LABEL_COL_DEFAULT;
  }
}

function saveGanttLabelColWidth(width: number) {
  const clamped = Math.max(
    GANTT_LABEL_COL_MIN,
    Math.min(GANTT_LABEL_COL_MAX, Math.round(width))
  );
  localStorage.setItem(GANTT_LABEL_COL_KEY, String(clamped));
}

function applyGanttLabelColWidth(width: number) {
  const clamped = Math.max(
    GANTT_LABEL_COL_MIN,
    Math.min(GANTT_LABEL_COL_MAX, Math.round(width))
  );
  const px = `${clamped}px`;
  document.documentElement.style.setProperty("--gantt-label-col", px);
  document
    .querySelectorAll<HTMLElement>(".gantt-layout")
    .forEach((el) => el.style.setProperty("--gantt-label-col", px));
}

function loadHiddenCols(): HideablePortfolioCol[] {
  try {
    const raw = localStorage.getItem(COL_VISIBILITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((c) => (c === "wsjf" ? "rice" : c))
      .filter((c): c is HideablePortfolioCol =>
        HIDEABLE_PORTFOLIO_COLS.includes(c as HideablePortfolioCol),
      );
  } catch {
    return [];
  }
}

function saveHiddenCols(hidden: HideablePortfolioCol[]) {
  localStorage.setItem(COL_VISIBILITY_KEY, JSON.stringify(hidden));
}

function loadScheduleMode(): ScheduleMode {
  try {
    const raw = localStorage.getItem(SCHEDULE_MODE_KEY);
    let mode: ScheduleMode | null = null;
    if (
      raw === "manual" ||
      raw === "teamQueue" ||
      raw === "maxUtilization" ||
      raw === "dense" ||
      raw === "parallel" ||
      raw === "max_util" ||
      raw === "auto"
    ) {
      mode = normalizeScheduleMode(raw);
    } else {
      const legacy = localStorage.getItem(AUTO_CAPACITY_SCHEDULE_KEY);
      if (legacy === "1") mode = "teamQueue";
      else if (legacy === "0") mode = "manual";
    }
    if (mode == null) mode = "teamQueue";
    if (mode === "maxUtilization") mode = "teamQueue";

    // Former Gantt checkbox: off forced «Как задано» regardless of Settings mode.
    const enabledRaw = localStorage.getItem(SCHEDULE_MODE_ENABLED_KEY);
    if (enabledRaw === "0") return "manual";
    return mode;
  } catch {
    /* ignore */
  }
  return "teamQueue";
}

function saveScheduleMode(mode: ScheduleMode) {
  localStorage.setItem(SCHEDULE_MODE_KEY, mode);
  try {
    localStorage.removeItem(SCHEDULE_MODE_ENABLED_KEY);
  } catch {
    /* ignore */
  }
  syncLegacyAutoCapacityKey();
}

function syncLegacyAutoCapacityKey() {
  localStorage.setItem(
    AUTO_CAPACITY_SCHEDULE_KEY,
    isCapacityScheduleMode(activeScheduleMode()) ? "1" : "0"
  );
}

function setScheduleMode(mode: ScheduleMode) {
  const next = normalizeScheduleMode(mode);
  const prev = activeScheduleMode();
  ui.scheduleMode = next;
  saveScheduleMode(ui.scheduleMode);
  if (prev !== next) {
    logChange(
      `Режим расписания: «${SCHEDULE_MODE_META[prev].label}» → «${SCHEDULE_MODE_META[next].label}»`,
      "schedule"
    );
    // Mode lives in UI localStorage; still persist so the journal syncs.
    saveState(state);
  }
}

/** Effective mode for scheduling (Gantt / Очередь / ETA). */
function activeScheduleMode(): ScheduleMode {
  const mode = normalizeScheduleMode(ui.scheduleMode);
  return mode === "maxUtilization" ? "teamQueue" : mode;
}

function scheduleState(stateOverride?: AppState) {
  return schedulePortfolio(stateOverride ?? state, {
    mode: activeScheduleMode(),
  });
}


function isColVisible(col: PortfolioCol): boolean {
  if (col === "priority" || col === "title") return true;
  return !ui.hiddenCols.includes(col);
}

function visiblePortfolioColCount(): number {
  return ALL_PORTFOLIO_COLS.filter(isColVisible).length;
}

function setColVisible(col: HideablePortfolioCol, visible: boolean) {
  const next = visible
    ? ui.hiddenCols.filter((c) => c !== col)
    : ui.hiddenCols.includes(col)
      ? ui.hiddenCols
      : [...ui.hiddenCols, col];
  ui.hiddenCols = next;
  saveHiddenCols(next);
  render();
}

const colMinWidthCache: Partial<Record<PortfolioCol, number>> = {};

function measureLabelForCol(col: PortfolioCol): string {
  return PORTFOLIO_COL_MEASURE_LABELS[col] ?? PORTFOLIO_COL_LABELS[col];
}

function measureColMinWidth(label: string, col?: PortfolioCol): number {
  if (col && colMinWidthCache[col] != null) return colMinWidthCache[col]!;
  const probe = document.createElement("span");
  probe.textContent = label;
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:ViSans,Arial,sans-serif;padding:0;";
  document.body.appendChild(probe);
  const w = Math.ceil(probe.getBoundingClientRect().width);
  probe.remove();
  // padding of th (12+12) + resize grip room + sort arrow slack
  const min = Math.max(56, w + 36);
  if (col) colMinWidthCache[col] = min;
  return min;
}

function colWidthStyle(col: PortfolioCol): string {
  const stored = loadColWidths()[col];
  const min = measureColMinWidth(measureLabelForCol(col), col);
  const width = Math.max(min, stored ?? PORTFOLIO_COL_DEFAULTS[col]);
  return `width:${width}px;min-width:${min}px`;
}

function resizableTh(
  label: string,
  col: PortfolioCol,
  extraClass = "",
  dataSort?: SortKey,
  unit?: string,
): string {
  const active = dataSort != null && ui.sortKey === dataSort;
  const arrow =
    !active || !dataSort ? "" : ui.sortDir === "asc" ? " ↑" : " ↓";
  const sortCls = dataSort
    ? `sortable ${active ? "sorted" : ""}`
    : "";
  const hiddenCls = isColVisible(col) ? "" : " col-hidden";
  const sortAttr = dataSort ? ` data-sort="${dataSort}"` : "";
  const titleAttr = dataSort ? ` title="Сортировать"` : "";
  const stackCls = unit ? " th-label-stack" : "";
  const labelHtml = unit
    ? `<span class="th-stack">${label}${arrow}</span><span class="th-unit">${unit}</span>`
    : `${label}${arrow}`;
  return `<th class="resizable-th ${sortCls}${hiddenCls} ${extraClass}" data-col="${col}"${sortAttr}${titleAttr} style="${colWidthStyle(col)}"><span class="th-label${stackCls}">${labelHtml}</span><span class="col-resize" data-col-resize="${col}" title="Изменить ширину"></span></th>`;
}

function sortHeader(label: string, key: SortKey, extraClass = ""): string {
  const colMap: Partial<Record<SortKey, PortfolioCol>> = {
    priority: "priority",
    rice: "rice",
    estimate: "estimate",
    eta: "eta",
  };
  const col = colMap[key];
  if (!col) {
    const active = ui.sortKey === key;
    const arrow = !active ? "" : ui.sortDir === "asc" ? " ↑" : " ↓";
    return `<th class="sortable ${active ? "sorted" : ""}" data-sort="${key}" title="Сортировать">${label}${arrow}</th>`;
  }
  return resizableTh(label, col, extraClass, key);
}

function portfolioColgroupHtml(): string {
  return `<colgroup>${ALL_PORTFOLIO_COLS.map((col) => {
    const hiddenCls = isColVisible(col) ? "" : ' class="col-hidden"';
    return `<col${hiddenCls} data-col="${col}" style="${colWidthStyle(col)}" />`;
  }).join("")}</colgroup>`;
}

function portfolioTheadCellsHtml(): string {
  return `
    ${sortHeader("Приоритет", "priority", "prio-cell")}
    ${resizableTh("Проект", "title", "title-cell")}
    ${resizableTh("Команды", "teams")}
    ${resizableTh("Статус", "status", "status-cell")}
    ${sortHeader("RICE", "rice", "rice-cell")}
    ${resizableTh("ЧП", "cashFlow", "finance-cell", undefined, "млрд ₽")}
    ${resizableTh("ROI, %", "roi", "finance-cell")}
    ${sortHeader("Маечная оценка", "estimate", "estimate-cell")}
    ${sortHeader("Дата завершения", "eta")}
  `;
}

function portfolioColPickerHtml(): string {
  return `
    <details class="col-picker" ${ui.colPickerOpen ? "open" : ""}>
      <summary class="btn col-picker-toggle">Колонки</summary>
      <div class="col-picker-menu">
        ${HIDEABLE_PORTFOLIO_COLS.map(
          (col) => `
          <label class="col-picker-item">
            <input
              type="checkbox"
              class="col-visibility"
              data-col="${col}"
              ${isColVisible(col) ? "checked" : ""}
            />
            ${escapeHtml(PORTFOLIO_COL_LABELS[col])}
          </label>`,
        ).join("")}
      </div>
    </details>
  `;
}

let colPickerOutsideCleanup: (() => void) | null = null;

function closeColPickerOutside() {
  colPickerOutsideCleanup?.();
}

function bindColPickerOutsideClose(colPicker: HTMLDetailsElement) {
  closeColPickerOutside();
  const onDoc = (ev: MouseEvent) => {
    const t = ev.target as Node;
    if (colPicker.contains(t)) return;
    closeColPickerOutside();
    ui.colPickerOpen = false;
    // Close in place — do NOT render() on mousedown. A full re-render destroys
    // the click target before click fires, so «+ Добавить» / «Экспорт PDF»
    // appear dead while the column picker is open.
    colPicker.open = false;
  };
  const cleanup = () => {
    document.removeEventListener("mousedown", onDoc);
    colPickerOutsideCleanup = null;
  };
  colPickerOutsideCleanup = cleanup;
  window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
}

function tdAttrs(col: PortfolioCol, extraClass = ""): string {
  const cls = [extraClass, isColVisible(col) ? "" : "col-hidden"]
    .filter(Boolean)
    .join(" ");
  return ` data-col="${col}"${cls ? ` class="${cls}"` : ""}`;
}

function toggleSort(key: SortKey) {
  if (ui.sortKey === key) {
    ui.sortDir = ui.sortDir === "asc" ? "desc" : "asc";
  } else {
    ui.sortKey = key;
    // priority: 1 first (asc); RICE: high first (desc); estimate/ETA: smaller/sooner first
    ui.sortDir = key === "rice" ? "desc" : "asc";
  }
  render();
}

function metricsHtml(_rollups: ItemSchedule[], slices: ScheduledSlice[]): string {
  const active = state.items.filter((i) => i.status !== "done");
  const products = active.filter((i) => i.type === "product").length;
  const projects = active.filter((i) => i.type === "project").length;
  const multi = active.filter((i) => i.assignments.length > 1).length;
  const finishes = active
    .map((item) => itemFinishDate(item, state.startDate, szRanges()))
    .filter((iso): iso is string => Boolean(iso));
  const horizon = finishes.length
    ? Math.max(...finishes.map((iso) => weekIndex(state.startDate, iso))) + 1
    : 0;
  const overloaded = state.teams.filter((t) => {
    const demandDays = teamQueuePw(slices, t.id);
    return demandDays > t.capacityPw * 8;
  }).length;

  return `
    <div class="metrics">
      <div class="metric">
        <div class="label">Активных в едином портфеле</div>
        <div class="value">${active.length}</div>
        <div class="hint">${products} продуктов · ${projects} проектов · ${multi} кросс-командных</div>
      </div>
      <div class="metric">
        <div class="label">Горизонт портфеля</div>
        <div class="value">${horizon} нед.</div>
        <div class="hint">до самой поздней даты завершения</div>
      </div>
      <div class="metric">
        <div class="label">Команд под риском</div>
        <div class="value">${overloaded}</div>
        <div class="hint">очередь длиннее 8 недель</div>
      </div>
      <label
        class="metric metric-plan-start plan-start-anchor"
        title="Изменить старт планирования"
      >
        <div class="label">Старт планирования</div>
        <div class="value">${formatDate(state.startDate)}</div>
        <div class="hint">якорь шкалы Gantt (пн) · нажмите, чтобы изменить</div>
        <input
          type="date"
          class="plan-start-date-input metric-plan-start-input"
          value="${state.startDate}"
          aria-label="Старт планирования"
        />
      </label>
    </div>
  `;
}

/**
 * Product/project name stored in `backlog` (Реестр column «Проект»).
 * Uses the full trimmed field; legacy «… backlog · Name» keeps the last segment.
 */
function productProjectName(backlog: string): string {
  return containerNameFromBacklog(backlog);
}

function columnsHelpHtml(): string {
  return `
    <details class="callout callout-cols agenda">
      <summary class="agenda-summary">Адженда</summary>
      <div class="cols-help">
        <div><span class="cols-help-k">Приоритет</span> — сквозной ранг проекта (1…N; 1 = выше). Смена — после подтверждения</div>
        <div><span class="cols-help-k">Проект</span> — контейнер плана; функциональности смотрите на вкладке «Потребность»</div>
        <div><span class="cols-help-k">Команды</span> — кто задействован в проекте</div>
        <div><span class="cols-help-k">Статус</span> — стадия готовности</div>
        <div><span class="cols-help-k">RICE</span> — сумма RICE по работам проекта</div>
        <div><span class="cols-help-k">ЧП, млрд ₽</span> — чистая прибыль за 12 мес. (сумма по проекту)</div>
        <div><span class="cols-help-k">ROI, %</span> — ROI за 12 мес.</div>
        <div><span class="cols-help-k">Маечная оценка</span> — XS / S / M / L / XL / XXL (дни в Настройках)</div>
        <div><span class="cols-help-k">Дата завершения</span> — самая поздняя дата среди функциональностей и баров ролей</div>
      </div>
    </details>
  `;
}

function groupByProjectKey(
  items: WorkItem[]
): { key: string; title: string; items: WorkItem[] }[] {
  const map = new Map<string, WorkItem[]>();
  for (const it of items) {
    const key = projectGroupKey(it);
    const list = map.get(key);
    if (list) list.push(it);
    else map.set(key, [it]);
  }
  return [...map.entries()].map(([key, grouped]) => ({
    key,
    title: key,
    items: grouped,
  }));
}

function projectPrioMap(): Map<string, number> {
  return new Map(
    orderedProjectGroups(state.items, szRanges()).map((g, i) => [g.key, i + 1])
  );
}

function prioBadgeHtml(prio: number | string | undefined): string {
  return `<span class="prio-mini" title="Приоритет проекта">${prio ?? "—"}</span>`;
}

function teamCapacityFactLabel(team: Team): string {
  const people = team.members?.length ?? 0;
  const roles = resolveTeamRoleNames(team).length;
  const cap = computedTeamCapacityPw(team);
  return `${cap} чел·нед/нед · ${people} чел. · ${roles} рол.`;
}

function uniqueAssignments(items: WorkItem[]): TeamAssignment[] {
  const seen = new Set<string>();
  const out: TeamAssignment[] = [];
  for (const it of items) {
    for (const a of it.assignments) {
      if (seen.has(a.teamId)) continue;
      seen.add(a.teamId);
      out.push(a);
    }
  }
  return out;
}

function portfolioHtml(rollups: ItemSchedule[], _slices: ScheduledSlice[]): string {
  const visible = filteredItems(rollups);
  const order = new Map(visible.map((it, i) => [it.id, i]));
  const groups = groupByProjectKey(visible).sort((a, b) => {
    const ia = Math.min(...a.items.map((it) => order.get(it.id) ?? 9999));
    const ib = Math.min(...b.items.map((it) => order.get(it.id) ?? 9999));
    return ia - ib;
  });
  const prioByKey = new Map(
    orderedProjectGroups(state.items, szRanges()).map((g, i) => [g.key, i + 1])
  );
  const projectCount = Math.max(1, prioByKey.size);

  const rows = groups
    .map((g) => {
      const prio = prioByKey.get(g.key) ?? 1;
      const assigns = uniqueAssignments(g.items);
      const teamItem: WorkItem = { ...g.items[0], assignments: assigns };
      const score = g.items.reduce((s, it) => s + rice(it, szRanges()), 0);
      const total = g.items.reduce(
        (s, it) => s + totalEstimateWeeks(it, szRanges()),
        0
      );
      const sizes = [...new Set(assigns.map((a) => a.size))].join(" + ");
      const cashVals = g.items
        .map((it) => it.cashFlow12m)
        .filter((n): n is number => n != null && Number.isFinite(n));
      const cash = cashVals.length
        ? cashVals.reduce((s, n) => s + n, 0)
        : null;
      const rois = [
        ...new Set(
          g.items
            .map((it) => it.roi12m)
            .filter((n): n is number => n != null && Number.isFinite(n))
        ),
      ];
      const statuses = [...new Set(g.items.map((it) => it.status))];
      const statusVal = statuses.length === 1 ? statuses[0] : "";
      const statusOpts = [
        statusVal
          ? ""
          : `<option value="" selected disabled>несколько</option>`,
        ...ITEM_STATUSES.map(
          (s) =>
            `<option value="${s}"${s === statusVal ? " selected" : ""}>${statusLabel(s)}</option>`
        ),
      ].join("");
      const statusClass = statusVal ? `badge-status-${statusVal}` : "";
      const finish = projectFinishDate(g.items, state.startDate, szRanges());
      const finishWait = finish
        ? weekIndex(state.startDate, finish)
        : 0;
      return `
        <tr class="clickable" data-project-card="${escapeAttr(g.key)}" data-row-id="${escapeAttr(g.key)}" title="Открыть карточку проекта">
          <td${tdAttrs("priority", "prio-cell")} data-stop-edit>
            <input class="prio-input" type="number" min="1" max="${projectCount}" step="1" value="${prio}" data-project-prio="${escapeAttr(g.key)}" data-project-prio-now="${prio}" data-stop-edit aria-label="Приоритет проекта" />
          </td>
          <td${tdAttrs("title", "title-cell")}>
            <div class="name">${escapeHtml(g.title)}</div>
          </td>
          <td${tdAttrs("teams", "teams-cell")}>${teamsCellHtml(teamItem)}</td>
          <td${tdAttrs("status", "status-cell")} data-stop-edit>
            <select class="status-select ${statusClass}" data-project-status="${escapeAttr(g.key)}" data-status-was="${statusVal}" data-stop-edit aria-label="Статус проекта">${statusOpts}</select>
          </td>
          <td${tdAttrs("rice", "rice-cell mono metric-num")}>${Math.round(score * 10) / 10}</td>
          <td${tdAttrs("cashFlow", "finance-cell mono metric-num")}>${formatMlrd(cash)}</td>
          <td${tdAttrs("roi", "finance-cell mono metric-num")}>${
            rois.length === 1 ? formatPercent(rois[0]) : "—"
          }</td>
          <td${tdAttrs("estimate", "estimate-cell mono metric-num")}>
            <span class="size-badge">${sizes || "—"}</span>
            <div class="meta">~${total} чел·нед</div>
          </td>
          <td${tdAttrs("eta", `mono eta-cell ${finish && finishWait > 4 ? "eta-late" : "eta-good"}`)}>
            ${finish ? `<span class="eta-final">${formatDate(finish)}</span>` : "—"}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="portfolio-aux">
    ${columnsHelpHtml()}
    </div>
    <div class="panel portfolio-panel">
      <div class="portfolio-sticky">
        <div class="panel-header">
          <h2>Реестр проектов</h2>
          <div class="filters">
            <input id="q" placeholder="Поиск…" value="${escapeAttr(ui.query)}" />
            <select id="teamFilter">
              <option value="all">Все команды</option>
              ${state.teams
                .map(
                  (t) =>
                    `<option value="${t.id}" ${ui.teamFilter === t.id ? "selected" : ""}>${escapeHtml(t.name)}</option>`
                )
                .join("")}
            </select>
            <select id="statusFilter">
              <option value="all">Все статусы</option>
              ${ITEM_STATUSES.map(
                  (s) =>
                    `<option value="${s}" ${ui.statusFilter === s ? "selected" : ""}>${statusLabel(s)}</option>`
                )
                .join("")}
            </select>
            ${portfolioColPickerHtml()}
            <button class="btn" id="resetFilters" title="Сбросить фильтры, сортировку и колонки">Сбросить фильтры</button>
            ${
              currentCan("portfolio.edit")
                ? `<button class="btn btn-primary" id="addItem">+ Добавить</button>`
                : ""
            }
          </div>
        </div>
        <div class="table-scroll-top" aria-hidden="true"><div class="table-scroll-top-inner"></div></div>
        <div class="portfolio-thead-scroll">
          <table class="portfolio-table portfolio-thead-table">
            ${portfolioColgroupHtml()}
            <thead>
              <tr>
                ${portfolioTheadCellsHtml()}
              </tr>
            </thead>
          </table>
        </div>
      </div>
      <div class="table-scroll-wrap">
        <div class="table-scroll">
          <table class="portfolio-table portfolio-body-table">
            ${portfolioColgroupHtml()}
            <tbody id="portfolioBody">
              ${rows || `<tr><td colspan="${visiblePortfolioColCount()}" class="empty">Нет проектов по фильтру</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/** Portfolio priority + when the team can pick up the task */
function queuesTestHtml(
  slices: ScheduledSlice[],
  load: Record<string, TeamLoadWeek[]>,
  overflowByTeam: Record<string, Set<number>>
): string {
  const planStart = state.startDate;
  const horizon = 12;
  const mode = activeScheduleMode();
  const packing = isCapacityScheduleMode(mode);
  const prioMap = projectPrioMap();
  const cards = state.teams
    .map((team) => {
      const queue = slices
        .filter((s) => s.teamId === team.id)
        .sort((a, b) => {
          const pa = a.item.manualRank ?? 9999;
          const pb = b.item.manualRank ?? 9999;
          if (pa !== pb) return pa - pb;
          return a.effectiveRank - b.effectiveRank;
        });
      const demand = queue.reduce((sum, s) => sum + s.estimatePw, 0);
      const weeksToClear = team.capacityPw > 0 ? demand / team.capacityPw : 0;
      const freeFrom = queue.length
        ? queue[queue.length - 1].endDate
        : planStart;

      const items =
        queue
          .map((s, idx) => {
            const prio =
              prioMap.get(demandProjectKey(s.item)) ?? s.item.manualRank ?? "—";
            const blockedBy =
              idx > 0
                ? queue[idx - 1]
                : null;
            let takeReason = "может взять сразу (очередь свободна)";
            let takeClass = "take-now";
            if (s.startDate > s.plannedStartDate) {
              takeReason =
                mode === "teamQueue" && blockedBy
                  ? `ждёт очередь: после #${blockedBy.item.manualRank ?? "?"} «${blockedBy.item.title}»`
                  : "сдвиг из‑за загрузки очереди";
              takeClass = "take-queue";
            } else if (s.startDate > planStart) {
              takeReason = packing
                ? `ждёт плановый старт ${formatDate(s.plannedStartDate)}`
                : `плановый старт ${formatDate(s.plannedStartDate)}`;
              takeClass = "take-plan";
            } else if (!packing) {
              takeReason = "по заданной дате старта (без сдвига очереди)";
            }
            const others = s.item.assignments
              .filter((a) => a.teamId !== team.id)
              .map((a) => teamById(a.teamId)?.name ?? a.teamId);

            return `
            <div class="queue-item queue-item-test">
              <div class="prio-mini prio-mini-lg">${prio}</div>
              <div class="queue-item-body">
                <div class="queue-item-title">
                  <span class="badge badge-${s.item.type}">${s.item.type === "product" ? "П" : "Пр"}</span>
                  ${escapeHtml(s.item.title)}
                </div>
                <div class="take-line ${takeClass}">
                  <strong>Может взять с ${formatDate(s.startDate)}</strong>
                  <span class="meta"> · ${escapeHtml(takeReason)}</span>
                </div>
                <div class="meta">
                  ${s.size} (${s.estimatePw} чел·нед) · план ${formatDate(s.plannedStartDate)} · до ${formatDate(s.endDate)}
                  ${others.length ? ` · ещё: ${others.map(escapeHtml).join(", ")}` : ""}
                </div>
                <div class="take-bar" title="Окно работы в горизонте 12 нед.">
                  <span class="take-bar-fill" style="left:${(s.startWeek / 12) * 100}%;width:${Math.max(3, ((s.endWeek - s.startWeek + 1) / 12) * 100)}%;background:${team.color}"></span>
                </div>
              </div>
              <div class="mono queue-item-dates">
                <div class="meta">старт</div>
                <div>${formatDate(s.startDate)}</div>
                <div class="meta" style="margin-top:6px">конец</div>
                <div>${formatDate(s.endDate)}</div>
              </div>
            </div>
          `;
          })
          .join("") || `<div class="empty">Очередь пуста — команда свободна с ${formatDate(planStart)}</div>`;

      return `
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${team.color}"></span>${escapeHtml(team.name)}</h3>
              <div class="meta">Ёмкость ${escapeHtml(teamCapacityFactLabel(team))} · спрос ${demand.toFixed(1)} · ~${weeksToClear.toFixed(1)} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${formatDate(freeFrom)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          <div class="cap-strip-wrap">
            <div class="cap-strip-label meta">Загрузка по расписанию (эксп.) — красный = перегруз ёмкости; наведите или нажмите</div>
            ${teamCapacityStripHtml(
              team,
              load[team.id] ?? [],
              overflowByTeam[team.id] ?? new Set(),
              horizon
            )}
          </div>
          ${items}
        </div>
      `;
    })
    .join("");

  return `
    <div class="callout">
      Цифра — приоритет из Портфеля (1 = выше).
      ${
        mode === "teamQueue"
          ? "Режим «Последовательная утилизация ресурса»: «Может взять с …» — после FS-предшественника и не раньше планового старта."
          : "Режим «Как задано»: даты = заданные старты; параллельная работа может перегрузить ёмкость."
      }
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel panel-sticky-host">
      <div class="panel-sticky">
        <div class="panel-header">
          <h2>Очередь команд — когда команда может взять задачу</h2>
        </div>
      </div>
      ${cards}
    </div>
  `;
}

/**
 * Elegant FS curve: always exit RIGHT of pred bar first, then soft S/C into
 * succ from the left. Never doubles back through the source bar. Tight /
 * reverse (dx ≤ 0) still leaves eastward via a short stub, then elbows down.
 * routeBias fans sibling queue links.
 */
function ganttDepPathD(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  routeBias = 0,
  xMax = 52
): string {
  const clampX = (x: number) =>
    Math.min(xMax - 0.04, Math.max(0.04, x));
  const x1c = clampX(x1);
  const x2c = clampX(x2);
  const dy = y2 - y1;
  const dx = x2c - x1c;
  const absDy = Math.abs(dy);
  const fan = Math.max(-0.55, Math.min(0.55, routeBias * 0.14));

  // Same row: straight or a soft horizontal bow
  if (absDy < 0.02) {
    if (Math.abs(fan) < 0.03) {
      return `M ${x1c} ${y1} H ${x2c}`;
    }
    const midX = (x1c + x2c) / 2;
    return `M ${x1c} ${y1} Q ${midX} ${y1 + fan * 0.55}, ${x2c} ${y2}`;
  }

  // Short rightward exit clears the source bar without a balloon loop.
  // Scale slightly with |dy| so tall spans stay graceful, but stay modest.
  const exitStub = Math.max(0.32, Math.min(0.72, 0.28 + absDy * 0.1));
  const entryStub = Math.max(0.32, Math.min(0.9, 0.28 + absDy * 0.14));

  let c1x: number;
  let c2x: number;

  if (dx > exitStub + entryStub + 0.45) {
    // Forward in time: balanced S with long horizontal tangents
    const r = Math.min(Math.max(exitStub, absDy * 0.5 + 0.35), dx * 0.42);
    c1x = x1c + r + fan;
    c2x = x2c - r + fan;
  } else {
    // Overlap / reverse / tight: stub east of source, then elbow down-left
    // into the successor (western approach). Keep exit short to avoid the
    // exaggerated rightward loop that large elegance pulls produced.
    c1x = x1c + exitStub + fan * 0.3;
    const reverseSpan = Math.max(0, x1c - x2c);
    const entryPull =
      entryStub + Math.min(0.85, reverseSpan * 0.18 + absDy * 0.12);
    c2x = x2c - entryPull + fan * 0.3;
  }

  // Hard guarantees: first control east of start, second west of end.
  // (clampX alone can collapse a stub near the chart edge.)
  if (c1x < x1c + 0.28) c1x = x1c + 0.28;
  if (c2x > x2c - 0.28) c2x = x2c - 0.28;

  // Preserve eastward exit after clamp (clamp alone can pin c1 on x1 near
  // the right chart edge). Fall back to an explicit L-stub when no room.
  const roomRight = xMax - 0.04 - x1c;
  const c1Out = Math.min(xMax - 0.04, Math.max(x1c + 0.28, clampX(c1x)));
  const c2Out = clampX(Math.min(x2c - 0.28, c2x));

  if (c1Out <= x1c + 0.05 || roomRight < 0.22) {
    const stubX = Math.min(
      xMax - 0.04,
      x1c + Math.max(0.12, Math.min(exitStub, roomRight * 0.9))
    );
    return `M ${x1c} ${y1} L ${stubX} ${y1} C ${stubX} ${y1}, ${c2Out} ${y2}, ${x2c} ${y2}`;
  }

  return `M ${x1c} ${y1} C ${c1Out} ${y1}, ${c2Out} ${y2}, ${x2c} ${y2}`;
}

function clientPointToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/**
 * Snap queue FS arrows to real bar edges (right of pred → left of succ),
 * using DOM rects mapped into the stretched SVG viewBox. Arrowheads are
 * drawn in user space sized by screen pixels so preserveAspectRatio=none
 * does not distort marker tips away from the bar.
 */
function layoutGanttDepArrows() {
  const svg = document.querySelector<SVGSVGElement>(".gantt-dep-layer");
  if (!svg) return;
  const vb = svg.viewBox.baseVal;
  const weeks = vb.width || 1;
  const rows = vb.height || 1;
  const svgRect = svg.getBoundingClientRect();
  if (svgRect.width < 2 || svgRect.height < 2) return;

  const tipW = Math.min(0.55, Math.max(0.12, 7 / (svgRect.width / weeks)));
  const tipH = Math.min(0.55, Math.max(0.1, 8 / (svgRect.height / rows)));
  const heads = svg.querySelector(".gantt-dep-heads");
  if (heads) heads.replaceChildren();

  svg.querySelectorAll<SVGPathElement>("path.gantt-dep-link").forEach((path) => {
    const fromItem = path.dataset.fromItem;
    const fromTeam = path.dataset.fromTeam;
    const toItem = path.dataset.toItem;
    const toTeam = path.dataset.toTeam;
    const bias = Number(path.dataset.bias || 0);
    if (!fromItem || !fromTeam || !toItem || !toTeam) return;

    const fromBar = document.querySelector<HTMLElement>(
      `.gantt-bar[data-item-id="${fromItem}"][data-team-id="${fromTeam}"]`
    );
    const toBar = document.querySelector<HTMLElement>(
      `.gantt-bar[data-item-id="${toItem}"][data-team-id="${toTeam}"]`
    );
    if (!fromBar || !toBar) {
      path.setAttribute("visibility", "hidden");
      return;
    }
    path.removeAttribute("visibility");

    const fr = fromBar.getBoundingClientRect();
    const tr = toBar.getBoundingClientRect();
    if (fr.width < 1 || tr.width < 1) return;

    const p1 = clientPointToSvg(svg, fr.right, fr.top + fr.height / 2);
    const p2 = clientPointToSvg(svg, tr.left, tr.top + tr.height / 2);
    if (!p1 || !p2) return;

    // Path ends just before the tip apex so the head sits on the bar's left edge
    const endX = p2.x - tipW * 0.95;
    path.setAttribute("d", ganttDepPathD(p1.x, p1.y, endX, p2.y, bias, weeks));

    if (!heads) return;
    const color = path.getAttribute("stroke") || "#64748b";
    const poly = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    const half = tipH / 2;
    poly.setAttribute(
      "points",
      `${p2.x},${p2.y} ${p2.x - tipW},${p2.y - half} ${p2.x - tipW},${p2.y + half}`
    );
    poly.setAttribute("fill", color);
    poly.setAttribute("fill-opacity", "0.92");
    heads.appendChild(poly);
  });
}

function syncPlanStartInputs(value: string) {
  document
    .querySelectorAll<HTMLInputElement>(".plan-start-date-input")
    .forEach((el) => {
      el.value = value;
    });
}

function bindPlanStartDate() {
  document
    .querySelectorAll<HTMLInputElement>(".plan-start-date-input")
    .forEach((input) => {
      const anchor =
        input.closest<HTMLElement>(".plan-start-anchor") ?? input;

      input.addEventListener("change", () => {
        const next = snapToMonday(input.value || state.startDate);
        syncPlanStartInputs(next);
        if (next === state.startDate) return;

        askAppConfirm(
          anchor,
          `Сменить старт планирования на <span class="accent">${formatDate(next)}</span> (пн)?<br/><span class="meta">Шкала недель сдвинется; абсолютные даты работ сохранятся.</span>`,
          () => {
            const prev = state.startDate;
            state.startDate = next;
            logChange(
              `Старт планирования: ${formatDate(prev)} → ${formatDate(next)}`,
              "settings"
            );
            persist();
          },
          () => {
            syncPlanStartInputs(state.startDate);
          },
          {
            wide: true,
            yesLabel: "Сменить",
            noLabel: "Отмена",
          }
        );
      });
    });
}

function bindGanttDepArrowLayout() {
  const rows = document.querySelector<HTMLElement>(".gantt-rows");
  if (!rows) return;

  const snap = () => layoutGanttDepArrows();
  requestAnimationFrame(() => requestAnimationFrame(snap));

  const ro = new ResizeObserver(() => snap());
  ro.observe(rows);
  const svg = rows.querySelector(".gantt-dep-layer");
  if (svg) ro.observe(svg);
}

function bindGanttLabelResize() {
  const handle = document.querySelector<HTMLElement>("[data-gantt-label-resize]");
  const layout = document.querySelector<HTMLElement>(".gantt-layout");
  if (!handle || !layout) return;

  applyGanttLabelColWidth(loadGanttLabelColWidth());

  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startW =
      parseFloat(
        getComputedStyle(layout).getPropertyValue("--gantt-label-col")
      ) || loadGanttLabelColWidth();
    const pointerId = e.pointerId;
    handle.setPointerCapture(pointerId);
    document.body.classList.add("col-resizing");
    layout.classList.add("gantt-label-resizing");

    const onMove = (ev: PointerEvent) => {
      applyGanttLabelColWidth(startW + (ev.clientX - startX));
    };

    const onUp = (ev: PointerEvent) => {
      handle.releasePointerCapture(pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      document.body.classList.remove("col-resizing");
      layout.classList.remove("gantt-label-resizing");

      const finalW =
        parseFloat(
          getComputedStyle(layout).getPropertyValue("--gantt-label-col")
        ) || loadGanttLabelColWidth();
      saveGanttLabelColWidth(finalW);
      applyGanttLabelColWidth(finalW);
      layoutGanttDepArrows();
      void ev;
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  });
}

let ganttLabelTipTimer: number | null = null;
let ganttLabelTipCleanup: (() => void) | null = null;

function closeGanttLabelTip() {
  if (ganttLabelTipTimer != null) {
    window.clearTimeout(ganttLabelTipTimer);
    ganttLabelTipTimer = null;
  }
  if (ganttLabelTipCleanup) {
    ganttLabelTipCleanup();
    ganttLabelTipCleanup = null;
  }
  document.querySelector("#ganttLabelTip")?.remove();
  document
    .querySelectorAll(".gantt-label-tip-open")
    .forEach((el) => el.classList.remove("gantt-label-tip-open"));
}

function placeGanttLabelTip(anchor: HTMLElement, pop: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + popRect.width > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - popRect.width - 8);
  }
  if (top + popRect.height > window.innerHeight - 8) {
    top = Math.max(8, rect.top - popRect.height - 8);
  }
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

function showGanttLabelTip(anchor: HTMLElement) {
  const title = anchor.dataset.tipTitle?.trim() || "";
  if (!title) return;

  closeGanttLabelTip();
  anchor.classList.add("gantt-label-tip-open");

  const product = anchor.dataset.tipProduct?.trim() || "";
  const eta = anchor.dataset.tipEta?.trim() || "";
  const owner = anchor.dataset.tipOwner?.trim() || "";
  const assignee = anchor.dataset.tipAssignee?.trim() || "";
  const note = anchor.dataset.tipNote?.trim() || "";

  const metaBits: string[] = [];
  if (product) metaBits.push(escapeHtml(product));
  if (eta) metaBits.push(`Дата завершения ${escapeHtml(eta)}`);

  const peopleBits: string[] = [];
  if (owner) peopleBits.push(`Заказчик: ${escapeHtml(owner)}`);
  if (assignee) peopleBits.push(`Исполнитель: ${escapeHtml(assignee)}`);

  const pop = document.createElement("div");
  pop.id = "ganttLabelTip";
  pop.className = "gantt-label-tip";
  pop.setAttribute("role", "tooltip");
  pop.innerHTML = `
    <div class="gantt-label-tip-title">${escapeHtml(title)}</div>
    ${
      metaBits.length
        ? `<div class="gantt-label-tip-meta">${metaBits.join(" · ")}</div>`
        : ""
    }
    ${
      peopleBits.length
        ? `<div class="gantt-label-tip-owner">${peopleBits.join(" · ")}</div>`
        : ""
    }
    ${
      note
        ? `<div class="gantt-label-tip-note">${escapeHtml(note)}</div>`
        : ""
    }
  `;
  document.body.appendChild(pop);
  placeGanttLabelTip(anchor, pop);

  const onScroll = () => placeGanttLabelTip(anchor, pop);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);
  ganttLabelTipCleanup = () => {
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onScroll);
  };
}

function bindGanttLabelTips() {
  closeGanttLabelTip();
  document
    .querySelectorAll<HTMLElement>("[data-gantt-label-tip]")
    .forEach((label) => {
      label.addEventListener("pointerenter", () => {
        if (ganttLabelTipTimer != null) {
          window.clearTimeout(ganttLabelTipTimer);
          ganttLabelTipTimer = null;
        }
        ganttLabelTipTimer = window.setTimeout(() => {
          ganttLabelTipTimer = null;
          showGanttLabelTip(label);
        }, 300);
      });
      label.addEventListener("pointerleave", () => {
        if (ganttLabelTipTimer != null) {
          window.clearTimeout(ganttLabelTipTimer);
          ganttLabelTipTimer = null;
        }
        closeGanttLabelTip();
      });
    });
}

function applyGanttBarPreview(
  bar: HTMLElement,
  startWeek: number,
  endWeek: number,
  weeks: number
) {
  const span = Math.max(1, endWeek - startWeek + 1);
  const left = (startWeek / weeks) * 100;
  const width = (span / weeks) * 100;
  bar.style.left = `${left}%`;
  bar.style.width = `${Math.max(width, 2.5)}%`;
  bar.dataset.startWeek = String(startWeek);
  bar.dataset.endWeek = String(endWeek);
}

function bindGanttBarEdit() {
  if (!currentCan("gantt.edit")) return;
  const weeks = Math.max(4, Math.min(52, Math.round(ui.ganttWeeks) || 16));

  document.querySelectorAll<HTMLElement>(".gantt-bar").forEach((bar) => {
    bar.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const itemId = bar.dataset.itemId;
      const teamId = bar.dataset.teamId;
      if (!itemId || !teamId) return;

      const track = bar.closest<HTMLElement>(".gantt-track");
      if (!track) return;

      const handle = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-gantt-handle]"
      );
      const mode: GanttBarDragMode =
        handle?.dataset.ganttHandle === "left"
          ? "resize-left"
          : handle?.dataset.ganttHandle === "right"
            ? "resize-right"
            : "move";

      const originStart = Number(bar.dataset.startWeek);
      const originEnd = Number(bar.dataset.endWeek);
      if (!Number.isFinite(originStart) || !Number.isFinite(originEnd)) return;

      e.preventDefault();
      e.stopPropagation();
      closeAppPop();
      closeOverloadPop();

      const startClientX = e.clientX;
      const trackRect0 = track.getBoundingClientRect();
      const weekWidth = trackRect0.width / weeks;
      let previewStart = originStart;
      let previewEnd = originEnd;
      let moved = false;

      bar.classList.add("gantt-bar-dragging");
      document.body.classList.add("gantt-dragging");
      try {
        bar.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        const delta = Math.round((ev.clientX - startClientX) / weekWidth);
        if (delta !== 0) moved = true;

        const duration = originEnd - originStart + 1;
        if (mode === "move") {
          previewStart = Math.max(
            0,
            Math.min(weeks - duration, originStart + delta)
          );
          previewEnd = previewStart + duration - 1;
        } else if (mode === "resize-right") {
          previewStart = originStart;
          previewEnd = Math.max(
            originStart,
            Math.min(weeks - 1, originEnd + delta)
          );
        } else {
          previewEnd = originEnd;
          previewStart = Math.max(
            0,
            Math.min(originEnd, originStart + delta)
          );
        }
        applyGanttBarPreview(bar, previewStart, previewEnd, weeks);
        layoutGanttDepArrows();
      };

      const cleanupDrag = () => {
        bar.classList.remove("gantt-bar-dragging");
        document.body.classList.remove("gantt-dragging");
        bar.removeEventListener("pointermove", onMove);
        bar.removeEventListener("pointerup", onUp);
        bar.removeEventListener("pointercancel", onUp);
        try {
          bar.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      };

      const restoreVisual = () => {
        applyGanttBarPreview(bar, originStart, originEnd, weeks);
        layoutGanttDepArrows();
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        cleanupDrag();

        if (
          !moved ||
          (previewStart === originStart && previewEnd === originEnd)
        ) {
          restoreVisual();
          return;
        }

        const item = state.items.find((i) => i.id === itemId);
        const assign = item?.assignments.find((a) => a.teamId === teamId);
        const team = teamById(teamId);
        if (!item || !assign || !team) {
          restoreVisual();
          return;
        }

        const oldStart = addWeeks(state.startDate, originStart);
        const oldEnd = addWeeks(state.startDate, originEnd);
        const newStart = addWeeks(state.startDate, previewStart);
        const newEnd = addWeeks(state.startDate, previewEnd);
        const newSpan = previewEnd - previewStart + 1;
        const oldSize = assign.size;
        const newSize =
          mode === "move"
            ? oldSize
            : nearestSizeForCalendarWeeks(
                newSpan,
                team.capacityPw,
                szRanges()
              );
        const scheduledSpan = calendarWeeksForSize(
          newSize,
          team.capacityPw,
          szRanges()
        );
        const sizeChanged = newSize !== oldSize;

        // Keep preview at the snapped edit; cancel restores.
        applyGanttBarPreview(bar, previewStart, previewEnd, weeks);
        bar.classList.add("gantt-bar-confirm");

        const actionLabel =
          mode === "move"
            ? "Переместить"
            : "Изменить длительность";
        const sizeLine = sizeChanged
          ? `Оценка: <span class="accent">${oldSize}</span> (${sizePlanWeeks(oldSize, szRanges())} чел·нед) → <span class="accent">${newSize}</span> (${sizePlanWeeks(newSize, szRanges())} чел·нед)${
              scheduledSpan !== newSpan
                ? `<br/><span class="meta">после сохранения полоска ≈ ${scheduledSpan} нед. по маечной оценке ${newSize}</span>`
                : ""
            }`
          : `Оценка: <span class="accent">${oldSize}</span> (без изменений)`;
        const autoNote = isCapacityScheduleMode(activeScheduleMode())
          ? `<br/><span class="meta">Режим переключится на «Как задано», чтобы даты сохранились.</span>`
          : "";

        const text = `${actionLabel} «<strong>${escapeHtml(team.name)}</strong>» — ${escapeHtml(item.title)}?<br/>
Период: <span class="accent">${formatDate(oldStart)}–${formatDate(oldEnd)}</span> → <span class="accent">${formatDate(newStart)}–${formatDate(newEnd)}</span><br/>
${sizeLine}${autoNote}`;

        askAppConfirm(
          bar,
          text,
          () => {
            state.items = state.items.map((it) => {
              if (it.id !== itemId) return it;
              return {
                ...it,
                assignments: it.assignments.map((a) => {
                  if (a.teamId !== teamId) return a;
                  return {
                    ...a,
                    workStartDate: snapToMonday(newStart),
                    size: newSize,
                    ...(a.days != null
                      ? { days: Math.round(sizePlanDays(newSize, szRanges())) }
                      : {}),
                  };
                }),
              };
            });
            if (isCapacityScheduleMode(activeScheduleMode())) {
              setScheduleMode("manual");
            }
            const sizePart = sizeChanged
              ? `, оценка ${oldSize}→${newSize}`
              : "";
            logChange(
              `Gantt «${item.title}» / ${team.name}: ${formatDate(oldStart)}–${formatDate(oldEnd)} → ${formatDate(newStart)}–${formatDate(newEnd)}${sizePart}`,
              "schedule"
            );
            persist();
          },
          () => {
            restoreVisual();
            bar.classList.remove("gantt-bar-confirm");
          },
          {
            wide: true,
            anchorClass: "gantt-bar-confirm",
            yesLabel: "ОК",
            noLabel: "Отмена",
          }
        );
      };

      bar.addEventListener("pointermove", onMove);
      bar.addEventListener("pointerup", onUp);
      bar.addEventListener("pointercancel", onUp);
    });
  });
}

const TEAM_COLORS = [
  "#d60000",
  "#455a64",
  "#737373",
  "#c62828",
  "#e65100",
  "#1a1a1a",
  "#8d6e63",
  "#546e7a",
  "#b71c1c",
  "#f57c00",
  "#00695c",
  "#2e7d32",
  "#37474f",
  "#1a237e",
  "#827717",
  "#00838f",
  "#1565c0",
  "#bf360c",
  "#33691e",
  "#263238",
];

/** Draft color for the «new team» row (palette pick before save). */
let draftNewTeamColor: string | null = null;

function nextTeamColor(): string {
  const used = new Set(state.teams.map((t) => t.color));
  return (
    TEAM_COLORS.find((c) => !used.has(c)) ??
    TEAM_COLORS[state.teams.length % TEAM_COLORS.length]
  );
}

function newTeamColor(): string {
  return draftNewTeamColor ?? nextTeamColor();
}

function teamColorBtnHtml(
  color: string,
  opts: { teamId?: string; id?: string; disabled?: boolean }
): string {
  const dataTeam = opts.teamId
    ? ` data-team-color="${escapeAttr(opts.teamId)}"`
    : ` data-new-team-color`;
  const idAttr = opts.id ? ` id="${escapeAttr(opts.id)}"` : "";
  const disabled = opts.disabled ? " disabled" : "";
  return `
    <button
      type="button"
      class="team-color-btn"${idAttr}${dataTeam}${disabled}
      aria-label="Цвет команды"
      title="Выбрать цвет"
      aria-haspopup="dialog"
    ><span class="team-dot" style="background:${escapeAttr(color)}"></span></button>
  `;
}

function closeTeamColorPop() {
  document.querySelectorAll(".team-color-btn.is-open").forEach((el) => {
    el.classList.remove("is-open");
    el.setAttribute("aria-expanded", "false");
  });
  document.querySelector("#teamColorPop")?.remove();
}

function openTeamColorPicker(
  anchor: HTMLElement,
  currentColor: string,
  onSelect: (color: string) => void
) {
  closeAppPop();
  closeTeamColorPop();
  closeOverloadPop();

  anchor.classList.add("is-open");
  anchor.setAttribute("aria-expanded", "true");

  const pop = document.createElement("div");
  pop.id = "teamColorPop";
  pop.className = "team-color-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", "Палитра цветов команды");
  pop.innerHTML = `
    <div class="team-color-palette">
      ${TEAM_COLORS.map((c) => {
        const selected = c.toLowerCase() === currentColor.toLowerCase();
        return `<button
          type="button"
          class="team-color-swatch${selected ? " is-selected" : ""}"
          data-pick-color="${escapeAttr(c)}"
          style="background:${escapeAttr(c)}"
          title="${escapeAttr(c)}"
          aria-label="Цвет ${escapeAttr(c)}"
          aria-pressed="${selected ? "true" : "false"}"
        ></button>`;
      }).join("")}
    </div>
  `;
  document.body.appendChild(pop);

  const place = () => {
    const rect = anchor.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + popRect.width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - popRect.width - 8);
    }
    if (top + popRect.height > window.innerHeight - 8) {
      top = Math.max(8, rect.top - popRect.height - 6);
    }
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  };
  place();

  const onScroll = () => place();
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);

  const cleanup = () => {
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onScroll);
    document.removeEventListener("mousedown", onDoc, true);
    document.removeEventListener("keydown", onKey, true);
  };

  const finish = () => {
    cleanup();
    closeTeamColorPop();
  };

  const onDoc = (e: MouseEvent) => {
    const t = e.target as Node;
    if (pop.contains(t) || anchor.contains(t)) return;
    finish();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      finish();
    }
  };
  document.addEventListener("mousedown", onDoc, true);
  document.addEventListener("keydown", onKey, true);

  pop.querySelectorAll<HTMLButtonElement>("[data-pick-color]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const color = btn.dataset.pickColor!;
      finish();
      onSelect(color);
    });
  });
}

function catalogRoleOptionsHtml(selected: string): string {
  const sel = canonicalizeCatalogRole(selected) ?? selected.trim();
  const names: string[] = [...ASSIGNMENT_ROLE_CATALOG];
  if (sel && !names.some((n) => normalizeAssignmentRoleName(n) === normalizeAssignmentRoleName(sel))) {
    names.unshift(sel);
  }
  return names
    .map(
      (name) =>
        `<option value="${escapeAttr(name)}"${
          sel && normalizeAssignmentRoleName(name) === normalizeAssignmentRoleName(sel)
            ? " selected"
            : ""
        }>${escapeHtml(name)}</option>`
    )
    .join("");
}

function fioSuggestions(): string[] {
  const names: string[] = [];
  for (const t of state.teams) {
    for (const m of t.members ?? []) names.push(m.name);
  }
  return uniqCatalogNames([...names, ...state.executors]);
}

function teamsManageHtml(): string {
  applyComputedTeamCapacities(state.teams);
  const suggest = fioSuggestions();
  const canCreate = currentCan("teams.create");
  const datalist = `<datalist id="fio-suggest">${suggest
    .map((n) => `<option value="${escapeAttr(n)}"></option>`)
    .join("")}</datalist>`;
  const rows = state.teams
    .map((t) => {
      const canEdit = currentCan("teams.manage", t.id);
      const members = t.members ?? [];
      const seatRows = members
        .map(
          (m) => `
          <div class="team-roster-row">
            <select
              class="team-roster-role"
              data-team-row-role="${t.id}"
              data-person-id="${escapeAttr(m.id)}"
              aria-label="Роль"
              ${canEdit ? "" : "disabled"}
            >${catalogRoleOptionsHtml(m.role)}</select>
            <input
              class="team-roster-fio"
              type="text"
              list="fio-suggest"
              data-team-row-fio="${t.id}"
              data-person-id="${escapeAttr(m.id)}"
              value="${escapeAttr(m.name)}"
              aria-label="ФИО"
              ${canEdit ? "" : "disabled"}
            />
            ${
              canEdit
                ? `<button type="button" class="need-role-del" data-team-row-del="${t.id}" data-person-id="${escapeAttr(m.id)}" title="Удалить строку" aria-label="Удалить строку">×</button>`
                : `<span class="team-roster-del-spacer" aria-hidden="true"></span>`
            }
          </div>`
        )
        .join("");
      return `
      <div class="team-manage-card" data-team-row="${t.id}">
        <div class="capacity-row">
          ${teamColorBtnHtml(t.color, { teamId: t.id, disabled: !canEdit })}
          <input
            class="team-name-input"
            type="text"
            data-team-name="${t.id}"
            value="${escapeAttr(t.name)}"
            aria-label="Название команды"
            ${canEdit ? "" : "disabled"}
          />
          ${
            canCreate
              ? `<button
            type="button"
            class="btn btn-ghost team-delete-btn"
            data-team-delete="${t.id}"
            title="Удалить команду"
            ${state.teams.length <= 1 ? "disabled" : ""}
          >Удалить</button>`
              : ""
          }
        </div>
        <div class="team-roster">
          <div class="team-roster-head" aria-hidden="true"><span>Роль</span><span>ФИО</span></div>
          ${seatRows || `<div class="meta team-roster-empty">Нет строк — добавьте роль и ФИО</div>`}
          ${
            canEdit
              ? `<div class="team-roster-row team-roster-add">
            <select class="team-roster-role" data-team-row-role-new="${t.id}" aria-label="Новая роль">
              <option value="">Роль</option>
              ${catalogRoleOptionsHtml("")}
            </select>
            <input
              class="team-roster-fio"
              type="text"
              list="fio-suggest"
              data-team-row-fio-new="${t.id}"
              placeholder="ФИО"
              aria-label="Новое ФИО"
            />
            <button type="button" class="btn btn-primary" data-team-row-add="${t.id}">+ Строка</button>
          </div>`
              : `<p class="meta team-roster-readonly">Только просмотр — нет прав на правку этой команды.</p>`
          }
        </div>
      </div>`;
    })
    .join("");

  return `
    <div class="callout">
      Каждая строка — <strong>роль — ФИО</strong> (должностная роль в команде, не доступ в приложении).
      В Потребности доступны роли, которые есть в команде.
      ${canCreate ? "Новую команду добавляете ниже и назначаете на вкладке «Потребность»." : ""}
    </div>
    ${datalist}
    <div class="panel panel-sticky-host">
      <div class="panel-sticky">
        <div class="panel-header">
          <h2>Команды</h2>
        </div>
      </div>
      <div id="teamsManageList">
        ${rows || `<div class="empty">Нет команд — добавьте первую ниже</div>`}
      </div>
      ${
        canCreate
          ? `<div class="team-add-bar" id="teamAddBar">
        ${teamColorBtnHtml(newTeamColor(), { id: "newTeamColorBtn" })}
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">+ Команда</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
      </div>`
          : ""
      }
    </div>
  `;
}

function capacityHtml(): string {
  return `<div class="settings-stack">${teamsManageHtml()}</div>`;
}

type CatalogKind = "customers" | "executors" | "projects" | "products";

/** Strict select from a catalog list; keeps orphan value once if missing. */
function catalogSelectHtml(
  id: string,
  names: string[],
  selected: string,
  emptyLabel = "—"
): string {
  const sel = selected.trim();
  const meaningful = Boolean(sel && sel !== "—");
  const inList = meaningful && names.some((n) => n === sel);
  const orphan =
    meaningful && !inList
      ? `<option value="${escapeAttr(sel)}" selected>${escapeHtml(sel)}</option>`
      : "";
  const opts = names
    .map(
      (n) =>
        `<option value="${escapeAttr(n)}" ${n === sel ? "selected" : ""}>${escapeHtml(n)}</option>`
    )
    .join("");
  return `
    <select id="${id}">
      <option value="" ${!meaningful ? "selected" : ""}>${escapeHtml(emptyLabel)}</option>
      ${orphan}
      ${opts}
    </select>
  `;
}

function backlogNamesForType(type: ItemType): string[] {
  return uniqCatalogNames(
    state.items
      .filter((i) => i.type === type)
      .map((i) => productProjectName(i.backlog))
  );
}

function refillBacklogSelect(type: ItemType, keep: string) {
  const sel = document.querySelector<HTMLSelectElement>("#f_backlog");
  if (!sel) return;
  const names = backlogNamesForType(type);
  const keepVal = keep.trim();
  const ok = Boolean(keepVal && names.includes(keepVal));
  const tmp = document.createElement("div");
  tmp.innerHTML = catalogSelectHtml("f_backlog", names, ok ? keepVal : "");
  const next = tmp.querySelector("select");
  if (next) sel.innerHTML = next.innerHTML;
}

function changeLogHtml(): string {
  const entries = state.changeLog ?? [];
  const rows =
    entries.length === 0
      ? `<li class="change-log-empty meta">Пока нет записей — изменения портфеля появятся здесь.</li>`
      : entries
          .map(
            (e) => `
        <li class="change-log-item">
          <time class="change-log-at mono" datetime="${escapeAttr(e.at)}">${escapeHtml(formatLogAt(e.at))}</time>
          <span class="change-log-kind meta">${escapeHtml(changeLogKindLabel(e.kind))}</span>
          <span class="change-log-msg">${escapeHtml(e.message)}</span>
        </li>`
          )
          .join("");

  return `
    <div class="panel panel-sticky-host change-log-panel">
      <div class="panel-sticky">
        <div class="panel-header">
          <div>
            <h2>Журнал изменений</h2>
            <p class="meta" style="margin:4px 0 0">
              Последние действия с портфелем (до ${CHANGE_LOG_MAX} записей). Синхронизируется вместе с данными.
            </p>
          </div>
          <div class="toolbar">
            <button type="button" class="btn" id="clearChangeLogBtn" ${
              entries.length && currentCan("changelog.clear") ? "" : "disabled"
            } ${currentCan("changelog.clear") ? "" : 'title="Очищать журнал может только PM/PMO"'}>Очистить</button>
          </div>
        </div>
      </div>
      <ol class="change-log-list">${rows}</ol>
    </div>
  `;
}

type DemoTone = "good" | "warn" | "bad";

function demoCompletenessTone(pct: number): DemoTone {
  if (pct >= 80) return "good";
  if (pct >= 50) return "warn";
  return "bad";
}

function demoLoadTone(pct: number): DemoTone {
  if (pct > 100) return "bad";
  if (pct >= 85) return "warn";
  return "good";
}

function demoHasOwner(item: WorkItem): boolean {
  const o = item.owner.trim();
  return Boolean(o && o !== "—");
}

function demoHasAssignee(item: WorkItem): boolean {
  return Boolean(item.assignee.trim());
}

function demoMedian(nums: number[]): number {
  if (!nums.length) return 1;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function demoHorizonWeeks(): number {
  return Math.max(4, Math.min(52, Math.round(ui.ganttWeeks) || 16));
}

interface DemoCompletenessRow {
  key: string;
  name: string;
  type: ItemType;
  items: number;
  withTeam: number;
  withAssignee: number;
  withOwner: number;
  uniqueTeams: number;
  typicalTeams: number;
  pct: number;
}

interface DemoTeamLoadRow {
  team: Team;
  avgPct: number;
  peakPct: number;
  overloadWeeks: number;
  demandPw: number;
  weeks: TeamLoadWeek[];
}

function demoMonitoringData(
  load: Record<string, TeamLoadWeek[]>,
  overflowByTeam: Record<string, Set<number>>
): {
  horizon: number;
  active: WorkItem[];
  completeness: DemoCompletenessRow[];
  overallPct: number;
  withoutAssignee: number;
  withoutOwner: number;
  teams: DemoTeamLoadRow[];
  avgLoadPct: number;
  overloadTeams: number;
} {
  const ganttH = demoHorizonWeeks();
  let lastBusy = 0;
  for (const weeks of Object.values(load)) {
    for (const lw of weeks) {
      if (lw.usedPw > 0.001) lastBusy = Math.max(lastBusy, lw.week);
    }
  }
  const horizon = Math.max(4, Math.min(ganttH, (lastBusy || ganttH - 1) + 1));
  const active = state.items.filter((i) => i.status !== "done");
  const groups = new Map<string, WorkItem[]>();
  for (const item of active) {
    const name = productProjectName(item.backlog) || "Без названия";
    const key = `${item.type}:${name.toLowerCase()}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const completeness: DemoCompletenessRow[] = [...groups.entries()]
    .map(([key, items]) => {
      const first = items[0]!;
      const name = productProjectName(first.backlog) || "Без названия";
      const withTeam = items.filter((i) => i.assignments.length > 0).length;
      const withAssignee = items.filter(demoHasAssignee).length;
      const withOwner = items.filter(demoHasOwner).length;
      const teamIds = new Set<string>();
      for (const i of items) {
        for (const a of i.assignments) teamIds.add(a.teamId);
      }
      const typicalTeams = Math.max(
        1,
        Math.round(demoMedian(items.map((i) => i.assignments.length)))
      );
      const filled = withTeam + withAssignee + withOwner;
      const pct = items.length
        ? Math.round((filled / (items.length * 3)) * 100)
        : 100;
      return {
        key,
        name,
        type: first.type,
        items: items.length,
        withTeam,
        withAssignee,
        withOwner,
        uniqueTeams: teamIds.size,
        typicalTeams,
        pct,
      };
    })
    .sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name, "ru"));

  const factorTotal = active.length * 3;
  const factorFilled = active.reduce(
    (sum, i) =>
      sum +
      (i.assignments.length > 0 ? 1 : 0) +
      (demoHasOwner(i) ? 1 : 0) +
      (demoHasAssignee(i) ? 1 : 0),
    0
  );
  const overallPct = factorTotal
    ? Math.round((factorFilled / factorTotal) * 100)
    : 100;
  const withoutAssignee = active.filter((i) => !demoHasAssignee(i)).length;
  const withoutOwner = active.filter((i) => !demoHasOwner(i)).length;

  const teams: DemoTeamLoadRow[] = state.teams.map((team) => {
    const weeks = (load[team.id] ?? []).slice(0, horizon);
    const overflow = overflowByTeam[team.id] ?? new Set<number>();
    let peak = 0;
    let sum = 0;
    let overloadWeeks = 0;
    let demandPw = 0;
    for (const lw of weeks) {
      const pct = utilizationPct(lw.usedPw, lw.capacityPw);
      peak = Math.max(peak, pct);
      sum += pct;
      demandPw += lw.usedPw;
      if (overflow.has(lw.week) || isTeamWeekOverloaded(lw)) overloadWeeks += 1;
    }
    const avgPct = weeks.length ? Math.round(sum / weeks.length) : 0;
    return {
      team,
      avgPct,
      peakPct: peak,
      overloadWeeks,
      demandPw: Math.round(demandPw * 10) / 10,
      weeks,
    };
  });
  teams.sort((a, b) => b.avgPct - a.avgPct);

  const avgLoadPct = teams.length
    ? Math.round(teams.reduce((s, t) => s + t.avgPct, 0) / teams.length)
    : 0;
  const overloadTeams = teams.filter(
    (t) => t.overloadWeeks > 0 || t.peakPct > 100
  ).length;

  return {
    horizon,
    active,
    completeness,
    overallPct,
    withoutAssignee,
    withoutOwner,
    teams,
    avgLoadPct,
    overloadTeams,
  };
}

function demoBarRowHtml(
  name: string,
  sub: string,
  pct: number,
  tone: DemoTone
): string {
  const width = Math.max(0, Math.min(100, pct));
  return `
    <div class="demo-row demo-tone-${tone}">
      <div class="demo-row-name" title="${escapeAttr(name)}">
        ${escapeHtml(name)}
        <span class="demo-row-sub">${escapeHtml(sub)}</span>
      </div>
      <div class="demo-row-pct mono">${pct}%</div>
      <div class="demo-fill" aria-hidden="true"><span style="width:${width}%"></span></div>
    </div>`;
}

function demoPageHeadHtml(blurb: string): string {
  return `
    <div class="demo-page-head">
      <p class="meta">${blurb}</p>
    </div>`;
}

function demoVariantAHtml(
  load: Record<string, TeamLoadWeek[]>,
  overflowByTeam: Record<string, Set<number>>
): string {
  const data = demoMonitoringData(load, overflowByTeam);
  const completeRows =
    data.completeness
      .map((row) => {
        const typeRu = row.type === "project" ? "проект" : "продукт";
        const sub = `${typeRu} · ${row.items} функц. · команд ${row.uniqueTeams} (типично ~${row.typicalTeams}) · исп. ${row.withAssignee}/${row.items}`;
        return demoBarRowHtml(row.name, sub, row.pct, demoCompletenessTone(row.pct));
      })
      .join("") || `<div class="empty">Нет активных функциональностей</div>`;

  const loadRows =
    data.teams
      .map((row) => {
        const sub = `пик ${row.peakPct}% · перегруз ${row.overloadWeeks} нед. · ${row.demandPw} чел·нед за ${data.horizon} нед.`;
        return demoBarRowHtml(
          row.team.name,
          sub,
          row.avgPct,
          demoLoadTone(row.avgPct)
        );
      })
      .join("") || `<div class="empty">Нет команд</div>`;

  return `
    <div class="demo-page">
      ${demoPageHeadHtml(
        "Демо-макет мониторинга (как в похожих продуктах): загрузка слева, комплектация справа. Цифры из текущего портфеля и расписания; комплектация — доля функц. с командой, заказчиком и исполнителем."
      )}
      <div class="demo-a-grid">
        <div class="panel demo-card">
          <div class="panel-header">
            <div>
              <h2>Загрузка команд</h2>
              <p class="demo-card-hint">Средняя утилизация за ${data.horizon} нед. (горизонт Gantt). Зелёный &lt; 85%, жёлтый 85–100%, красный — перегруз.</p>
            </div>
          </div>
          <div class="demo-card-body">${loadRows}</div>
        </div>
        <div class="panel demo-card">
          <div class="panel-header">
            <div>
              <h2>Комплектация проектов / функциональностей</h2>
              <p class="demo-card-hint">Портфель: ${data.overallPct}% · без исполнителя: ${data.withoutAssignee} · без заказчика: ${data.withoutOwner}</p>
            </div>
          </div>
          <div class="demo-card-body">${completeRows}</div>
        </div>
      </div>
    </div>`;
}

function demoHeatColor(pct: number): string {
  if (pct <= 0) return "var(--surface-2)";
  if (pct <= 70) return "var(--good-soft)";
  if (pct <= 100) return "var(--warn-soft)";
  return "var(--bad-soft)";
}

function demoHeatBorder(pct: number): string {
  if (pct > 100) return "var(--bad)";
  if (pct >= 85) return "var(--warn)";
  if (pct > 0) return "var(--good)";
  return "var(--line)";
}

function demoVariantBHtml(
  load: Record<string, TeamLoadWeek[]>,
  overflowByTeam: Record<string, Set<number>>
): string {
  const data = demoMonitoringData(load, overflowByTeam);
  const heatRows = data.teams
    .map((row) => {
      const cells = row.weeks
        .map((lw, idx) => {
          const pct = utilizationPct(lw.usedPw, lw.capacityPw);
          const title = `Н${idx + 1}: ${lw.usedPw.toFixed(1)}/${lw.capacityPw} чел·нед (${pct}%)`;
          return `<span class="demo-heat-cell" title="${escapeAttr(title)}" style="background:${demoHeatColor(pct)};border-color:${demoHeatBorder(pct)}"></span>`;
        })
        .join("");
      const tone = demoLoadTone(row.avgPct);
      return `
        <tr>
          <td>
            <strong>${escapeHtml(row.team.name)}</strong>
            <div class="meta">${escapeHtml(teamCapacityFactLabel(row.team))}</div>
          </td>
          <td>
            <div class="demo-heat-cells" style="--demo-weeks:${data.horizon}">${cells}</div>
          </td>
          <td class="num demo-tone-${tone}"><strong>${row.avgPct}%</strong></td>
          <td class="num">${row.peakPct}%</td>
          <td class="num">${row.overloadWeeks}</td>
        </tr>`;
    })
    .join("");

  const comboRows = data.completeness
    .map((row) => {
      const typeRu = row.type === "project" ? "Проект" : "Продукт";
      const gap =
        row.withAssignee < row.items
          ? `без исп. ${row.items - row.withAssignee}`
          : "исполнители есть";
      return `
        <tr>
          <td>
            <strong>${escapeHtml(row.name)}</strong>
            <div class="type-tag">${typeRu} · ${row.items} функц.</div>
          </td>
          <td class="num demo-tone-${demoCompletenessTone(row.pct)}"><strong>${row.pct}%</strong></td>
          <td class="num">${row.uniqueTeams} / ~${row.typicalTeams}</td>
          <td>${escapeHtml(gap)}</td>
          <td class="num">${row.withOwner}/${row.items}</td>
        </tr>`;
    })
    .join("");

  return `
    <div class="demo-page">
      ${demoPageHeadHtml(
        "Другой макет тех же метрик: KPI-полоса, тепловая карта загрузки по неделям и сводная таблица комплектации. Демо: комплектация ≈ команда + заказчик + исполнитель."
      )}
      <div class="demo-kpis">
        <div class="demo-kpi demo-tone-${demoCompletenessTone(data.overallPct)}">
          <div class="label">Комплектация портфеля</div>
          <div class="value">${data.overallPct}%</div>
          <div class="hint">${data.active.length} активных функц. · демо-оценка</div>
        </div>
        <div class="demo-kpi demo-tone-${demoLoadTone(data.avgLoadPct)}">
          <div class="label">Средняя загрузка</div>
          <div class="value">${data.avgLoadPct}%</div>
          <div class="hint">по командам за ${data.horizon} нед.</div>
        </div>
        <div class="demo-kpi demo-tone-${data.overloadTeams ? "bad" : "good"}">
          <div class="label">Команд с перегрузом</div>
          <div class="value">${data.overloadTeams}</div>
          <div class="hint">пик &gt; 100% или недели сверх ёмкости</div>
        </div>
        <div class="demo-kpi demo-tone-${data.withoutAssignee ? "warn" : "good"}">
          <div class="label">Без исполнителя</div>
          <div class="value">${data.withoutAssignee}</div>
          <div class="hint">без заказчика: ${data.withoutOwner}</div>
        </div>
      </div>
      <div class="panel demo-card">
        <div class="panel-header">
          <div>
            <h2>Тепловая карта загрузки</h2>
            <p class="demo-card-hint">Недели 1–${data.horizon} слева направо. Цвет ячейки: свободно / в норме / плотно / перегруз.</p>
          </div>
        </div>
        <div class="demo-heat-wrap">
          <table class="demo-heat-table">
            <thead>
              <tr>
                <th>Команда</th>
                <th>Горизонт</th>
                <th class="num">Ср.</th>
                <th class="num">Пик</th>
                <th class="num">Перегруз, нед.</th>
              </tr>
            </thead>
            <tbody>${heatRows || `<tr><td colspan="5" class="empty">Нет команд</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      <div class="panel demo-card">
        <div class="panel-header">
          <div>
            <h2>Сводка комплектации</h2>
            <p class="demo-card-hint">Команд: факт / типично (медиана назначений на функц. в этом контейнере).</p>
          </div>
        </div>
        <table class="demo-combo-table">
          <thead>
            <tr>
              <th>Проект / продукт</th>
              <th class="num">Компл.</th>
              <th class="num">Команд</th>
              <th>Исполнители</th>
              <th class="num">Заказчик</th>
            </tr>
          </thead>
          <tbody>${comboRows || `<tr><td colspan="5" class="empty">Нет активных функциональностей</td></tr>`}</tbody>
        </table>
      </div>
    </div>`;
}

function demandProjectItems(): WorkItem[] {
  return sortByPriority(
    state.items.filter((i) => i.type === "project"),
    szRanges()
  );
}

function demandProjectKey(item: WorkItem): string {
  return productProjectName(item.backlog) || "Без проекта";
}

function demandGroupedItems(): { key: string; title: string; items: WorkItem[] }[] {
  return groupByProjectKey(demandProjectItems());
}

function demandStatusClass(status: AssignmentDemandStatus): string {
  if (status === "pending") return "need-st-pending";
  if (status === "approved") return "need-st-approved";
  return "need-st-draft";
}

function newDemandAssignment(teamId: string): TeamAssignment {
  const team = teamById(teamId);
  return fillTeamDemandRoles(
    {
      teamId,
      size: "M",
      workStartDate: state.startDate,
      demandStatus: "draft",
      roles: teamAssignmentRoles(team),
    },
    team
  );
}

function titleRu(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function demandRoleRowHtml(
  item: WorkItem,
  a: TeamAssignment,
  role: AssignmentRole
): string {
  const days = rolePlanDays(role, szRanges());
  const st = resolveRoleDemandStatus(role, a);
  const editKey = `${item.id}:${a.teamId}:${role.id}`;
  const editing = ui.needDaysEdit === editKey;
  const daysCell = editing
    ? `<input type="number" class="need-days-input" min="1" step="1" inputmode="numeric" value="${days}" data-need-days="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}" aria-label="Дни" /> <span class="meta">дн.</span>`
    : `<span class="need-row-days-val">${days} дн.</span>`;
  const statusOpts = ASSIGNMENT_DEMAND_STATUSES.map(
    (s) =>
      `<option value="${s}"${s === st ? " selected" : ""}>${ASSIGNMENT_DEMAND_LABELS[s]}</option>`
  ).join("");
  const action =
    st === "draft"
      ? `<button type="button" class="btn btn-primary need-send-btn" data-need-send="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}">Отправить</button>`
      : `<button type="button" class="btn need-change-btn" data-need-revert="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}">Изменить</button>`;
  return `<div class="need-row need-role-row">
    <span class="need-row-left">
      <span class="need-role-name">${escapeHtml(role.name)}</span>
      <span class="need-row-days">${daysCell}</span>
    </span>
    <span class="need-row-right">
      <select class="need-st-select ${demandStatusClass(st)}" data-need-status="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}">${statusOpts}</select>
      <button type="button" class="need-edit-days" data-need-edit-days="${editKey}">Изменить дни</button>
      ${action}
      <button type="button" class="need-role-del" data-need-role-del="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}" title="Удалить роль" aria-label="Удалить роль ${escapeAttr(role.name)}">×</button>
    </span>
  </div>`;
}

function demandAssignRowHtml(item: WorkItem, a: TeamAssignment): string {
  const t = teamById(a.teamId);
  const teamRoles = resolveTeamRoleNames(t);
  const roles = filterAssignmentRolesToTeam(a.roles, teamRoles);
  const available = availableAssignmentRolesForTeam(teamRoles, roles);
  const roleKey = `${item.id}:${a.teamId}`;
  const pickerOpen = ui.needAddRoleKey === roleKey;
  const addRoleBtn = available.length
    ? `<div class="need-add-wrap">
        <button type="button" class="btn need-add-btn" data-need-add-role-open="${item.id}" data-team="${a.teamId}">+ Роль</button>
        ${
          pickerOpen
            ? `<div class="need-add-menu" role="menu">
                ${available
                  .map(
                    (name) =>
                      `<button type="button" class="need-add-option" data-need-add-role="${item.id}" data-team="${a.teamId}" data-role-name="${escapeAttr(name)}">${escapeHtml(name)}</button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>`
    : "";
  const emptyHint = teamRoles.length
    ? `<p class="need-fn-empty meta">Ролей нет. Нажмите «+ Роль».</p>`
    : `<p class="need-fn-empty meta">У команды нет ролей. Добавьте строки «роль — ФИО» на вкладке «Команды».</p>`;
  const rolesHtml = roles.length
    ? `<div class="need-roles">${roles.map((role) => demandRoleRowHtml(item, a, role)).join("")}</div>`
    : emptyHint;
  return `<div class="need-assign">
    <div class="need-team-head">
      <span class="need-assign-name"><span class="team-dot" style="background:${t?.color ?? "#93999e"}"></span>${escapeHtml(t?.name ?? a.teamId)}</span>
      <span class="need-team-actions">
        ${addRoleBtn}
        <button type="button" class="need-team-x" data-need-remove-team="${item.id}" data-team="${a.teamId}" title="Удалить команду" aria-label="Удалить команду">×</button>
      </span>
    </div>
    ${rolesHtml}
  </div>`;
}

function patchDemandItem(
  itemId: string,
  fn: (item: WorkItem) => WorkItem
) {
  state.items = state.items.map((it) => (it.id === itemId ? fn(it) : it));
}

function assignmentsTeamKey(assignments: TeamAssignment[]): string {
  return assignments
    .map((a) => a.teamId)
    .sort()
    .join(",");
}

function withDemandTeams(
  item: WorkItem,
  nextAssignments: TeamAssignment[]
): WorkItem {
  const teamsChanged =
    assignmentsTeamKey(item.assignments) !== assignmentsTeamKey(nextAssignments);
  if (!teamsChanged) return { ...item, assignments: nextAssignments };
  const { demandStatus: _cleared, ...rest } = item;
  return { ...rest, assignments: nextAssignments };
}

function demandFnHtml(item: WorkItem): string {
  const days = totalEstimateDays(item, szRanges());
  const open = !ui.needCollapsedItems[item.id];
  const used = new Set(item.assignments.map((a) => a.teamId));
  const unused = state.teams.filter((t) => !used.has(t.id));
  const pickerOpen = ui.needAddItemId === item.id;
  const addBtn = unused.length
    ? `<div class="need-add-wrap">
        <button type="button" class="btn need-add-btn" data-need-add-open="${item.id}">+ Добавить команду</button>
        ${
          pickerOpen
            ? `<div class="need-add-menu" role="menu">
                ${unused
                  .map(
                    (t) =>
                      `<button type="button" class="need-add-option" data-need-add="${item.id}" data-team="${t.id}"><span class="team-dot" style="background:${t.color}"></span>${escapeHtml(t.name)}</button>`
                  )
                  .join("")}
              </div>`
            : ""
        }
      </div>`
    : "";
  const body = item.assignments.length
    ? item.assignments.map((a) => demandAssignRowHtml(item, a)).join("")
    : `<p class="need-fn-empty meta">Команда ещё не назначена. Нажмите «+ Добавить команду», затем «Отправить».</p>`;
  return `<details class="need-fn" data-need-fn="${item.id}"${open ? " open" : ""}>
    <summary class="need-fn-sum">
        <span class="need-fn-left">
        <span class="need-fn-title">${escapeHtml(item.title)}</span>
      </span>
      <span class="need-fn-actions">
        <span class="need-fn-req">запрошено ${days} дн.</span>
        ${addBtn}
        <button type="button" class="need-fn-x" data-need-del-fn="${item.id}" title="Удалить функциональность" aria-label="Удалить функциональность ${escapeAttr(item.title)}">×</button>
      </span>
    </summary>
    <div class="need-fn-body">${body}</div>
  </details>`;
}

function demandSelectedGroup():
  | { key: string; title: string; items: WorkItem[] }
  | undefined {
  const selectedKey = ui.needProjectKey;
  if (!selectedKey) return undefined;
  return (
    demandGroupedItems().find((g) => g.key === selectedKey) ?? {
      key: selectedKey,
      title: selectedKey,
      items: [],
    }
  );
}

function demandProjectBacklog(
  group: { key: string; items: WorkItem[] }
): string {
  const existing = group.items.find((it) => it.backlog.trim())?.backlog;
  if (existing) return existing;
  return group.key === "Без проекта" ? "" : group.key;
}

function demandHtml(): string {
  const allGroups = demandGroupedItems();
  const selectedKey = ui.needProjectKey;
  const selectedGroup = demandSelectedGroup();
  const chipGroups =
    selectedGroup && !allGroups.some((g) => g.key === selectedGroup.key)
      ? [...allGroups, selectedGroup]
      : allGroups;

  const prioMap = projectPrioMap();
  const projectChips = chipGroups
    .map((g) => {
      const on = selectedKey === g.key;
      const prio = prioMap.get(g.key);
      return `<button type="button" class="need-project-chip${on ? " is-on" : ""}" data-need-project-chip="${escapeAttr(g.key)}" title="${escapeAttr(on ? "Снять выбор" : "Показать проект")}">${prioBadgeHtml(prio)}${escapeHtml(g.title)}</button>`;
    })
    .join("");

  let body = `<div class="need-hint meta">Выберите проект сверху, чтобы увидеть функциональности и назначить команды.</div>`;

  if (selectedGroup) {
    const items = selectedGroup.items;
    const fnCount = items.length;
    const totalDays = items.reduce(
      (s, it) => s + totalEstimateDays(it, szRanges()),
      0
    );
    const roleEntries = items.flatMap((it) =>
      it.assignments.flatMap((a) => {
        const teamRoles = resolveTeamRoleNames(teamById(a.teamId));
        const roles = filterAssignmentRolesToTeam(a.roles, teamRoles);
        return (roles.length ? roles : [null]).map((role) => ({ it, a, role }));
      })
    );
    const pendingCount = roleEntries.filter((x) =>
      x.role
        ? resolveRoleDemandStatus(x.role, x.a, x.it) === "pending"
        : resolveAssignmentDemandStatus(x.a, x.it) === "pending"
    ).length;
    const approvedCount = roleEntries.filter((x) =>
      x.role
        ? resolveRoleDemandStatus(x.role, x.a, x.it) === "approved"
        : resolveAssignmentDemandStatus(x.a, x.it) === "approved"
    ).length;
    const open = !ui.needCollapsedProjects[selectedGroup.key];
    const fns = items.map((it) => demandFnHtml(it)).join("");
    const tree = `<details class="need-project" data-need-project="${escapeAttr(selectedGroup.key)}"${open ? " open" : ""}>
      <summary class="need-project-sum">
        <span class="need-project-title">${prioBadgeHtml(prioMap.get(selectedGroup.key))}${escapeHtml(selectedGroup.title)}</span>
        <span class="need-project-meta">${items.length} функц. · ${totalDays} дн.</span>
        <span class="need-project-actions">
          <button type="button" class="btn need-add-btn" data-need-add-fn title="Добавить функциональность">+ Функциональность</button>
        </span>
      </summary>
      <div class="need-project-body">${fns || `<p class="meta">Нет функциональностей</p>`}</div>
    </details>`;

    body = `
      <div class="need-stats">
        <div class="need-stat"><div class="label">Функциональностей</div><div class="value">${fnCount}</div></div>
        <div class="need-stat"><div class="label">Запрошено дней</div><div class="value">${totalDays}</div></div>
        <div class="need-stat"><div class="label">На согласовании</div><div class="value is-pending">${pendingCount}</div></div>
        <div class="need-stat"><div class="label">Согласовано</div><div class="value is-approved">${approvedCount}</div></div>
      </div>
      <div class="need-tree">${tree}</div>
    `;
  }

  return `
    <div class="need-page">
      <div class="panel-header need-page-head">
        <div>
          <h2>Потребность по проекту</h2>
          <p class="meta">Выберите один проект. Назначьте команды через «+ Добавить команду» и подтвердите «Отправить».</p>
        </div>
      </div>
      <div class="need-projects" aria-label="Проекты">${projectChips || `<span class="meta">Нет проектов</span>`}</div>
      ${body}
      ${ui.needCreatingFn ? needFnCreateModalHtml() : ""}
    </div>
  `;
}

function needFnCreateModalHtml(): string {
  const project = demandSelectedGroup()?.title ?? "";
  return `
    <div class="modal-backdrop" id="needFnModal">
      <div class="modal modal-compact" role="dialog" aria-modal="true" aria-labelledby="needFnModalTitle">
        <div class="modal-head">
          <h3 id="needFnModalTitle">Новая функциональность</h3>
        </div>
        <div class="modal-body">
          <div class="field">
            <label for="need_fn_title">Название</label>
            <input id="need_fn_title" type="text" autocomplete="off" placeholder="Название функциональности" />
            ${project ? `<div class="meta">Проект: ${escapeHtml(project)}</div>` : ""}
          </div>
        </div>
        <div class="modal-foot need-fn-modal-foot">
          <button type="button" class="btn" id="needFnCancel">Отмена</button>
          <button type="button" class="btn btn-primary" id="needFnCreate">Создать</button>
        </div>
      </div>
    </div>
  `;
}

const PLAN_WEEKS = 12;

function planSelectedTeamIds(): string[] {
  const known = new Set(state.teams.map((t) => t.id));
  const picked = ui.planTeamIds.filter((id) => known.has(id));
  if (picked.length) return picked;
  if (ui.planTeamFilterCleared) return [];
  return state.teams[0] ? [state.teams[0].id] : [];
}

function planFocusTeamId(selected: string[]): string | null {
  if (ui.planFocusTeamId && selected.includes(ui.planFocusTeamId)) {
    return ui.planFocusTeamId;
  }
  return selected[0] ?? null;
}

/** Confirmed (= has FIO / assignee on timeline) role days for selected assignments. */
function agreedRolePlanDays(
  assigns: TeamAssignment[],
  ranges: SizeRanges
): number {
  return assigns.reduce((sum, a) => {
    return (
      sum +
      planningDemandRoles(a).reduce((roleSum, role) => {
        if (!rolePlacedOnTimeline(a.teamId, role)) return roleSum;
        return roleSum + rolePlanDays(role, ranges);
      }, 0)
    );
  }, 0);
}

function planConflictWeeks(
  teamId: string,
  overflowByTeam: Record<string, Set<number>>,
  weeks: number
): number {
  const set = overflowByTeam[teamId];
  if (!set) return 0;
  let n = 0;
  for (const w of set) {
    if (w >= 0 && w < weeks) n++;
  }
  return n;
}

/** Inclusive week ranges intersect (same model as plan bars). */
function planWeeksOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

type PlanPersonPlacement = {
  /** `${itemId}:${teamId}:${roleId}` */
  key: string;
  /** Stable person key: member id, else normalized short FIO. */
  personKey: string;
  /** Short FIO for tips / labels. */
  memberName: string;
  projectTitle: string;
  itemTitle: string;
  startWeek: number;
  endWeek: number;
};

/** Person whose bars cover the same week (2+ placements). */
type PlanWeekPersonConflict = {
  personKey: string;
  personName: string;
  placements: PlanPersonPlacement[];
};

function planPersonKey(
  teamId: string,
  assigneeId: string | undefined,
  memberName: string
): string {
  if (assigneeId) return `id:${teamId}:${assigneeId}`;
  const fio = shortFio(memberName).trim().toLowerCase();
  return fio ? `fio:${fio}` : "";
}

function planPlacementKey(
  itemId: string,
  teamId: string,
  roleId: string
): string {
  return `${itemId}:${teamId}:${roleId}`;
}

/** Keys of placements whose person overlaps another bar in time. */
function findPersonConflictKeys(
  placements: readonly PlanPersonPlacement[]
): Set<string> {
  const byPerson = new Map<string, PlanPersonPlacement[]>();
  for (const p of placements) {
    if (!p.personKey) continue;
    const list = byPerson.get(p.personKey);
    if (list) list.push(p);
    else byPerson.set(p.personKey, [p]);
  }
  const conflict = new Set<string>();
  for (const list of byPerson.values()) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        if (
          planWeeksOverlap(a.startWeek, a.endWeek, b.startWeek, b.endWeek)
        ) {
          conflict.add(a.key);
          conflict.add(b.key);
        }
      }
    }
  }
  return conflict;
}

/**
 * Weeks where 2+ bars of the same person overlap (intersection only,
 * not the full span of either bar).
 */
function findPersonConflictWeeks(
  placements: readonly PlanPersonPlacement[],
  weeks: number
): Map<number, PlanWeekPersonConflict[]> {
  const byPerson = new Map<string, PlanPersonPlacement[]>();
  for (const p of placements) {
    if (!p.personKey) continue;
    const list = byPerson.get(p.personKey);
    if (list) list.push(p);
    else byPerson.set(p.personKey, [p]);
  }
  const byWeek = new Map<number, PlanWeekPersonConflict[]>();
  for (const [personKey, list] of byPerson) {
    if (list.length < 2) continue;
    const personName = list[0]!.memberName;
    for (let w = 0; w < weeks; w++) {
      const covering = list.filter(
        (p) => p.startWeek <= w && w <= p.endWeek
      );
      if (covering.length < 2) continue;
      const entry: PlanWeekPersonConflict = {
        personKey,
        personName,
        placements: covering,
      };
      const arr = byWeek.get(w);
      if (arr) arr.push(entry);
      else byWeek.set(w, [entry]);
    }
  }
  return byWeek;
}

function collectPlanPersonPlacements(
  items: readonly WorkItem[],
  teamFilter: Set<string> | null,
  ranges: SizeRanges
): PlanPersonPlacement[] {
  const out: PlanPersonPlacement[] = [];
  for (const item of items) {
    if (item.status === "done") continue;
    for (const a of item.assignments) {
      if (teamFilter && !teamFilter.has(a.teamId)) continue;
      for (const role of planningDemandRoles(a)) {
        const member = teamMemberById(a.teamId, role.assigneeId);
        if (!member) continue;
        const days = rolePlanDays(role, ranges);
        const startWeek = weekIndex(
          state.startDate,
          role.workStartDate || a.workStartDate
        );
        out.push({
          key: planPlacementKey(item.id, a.teamId, role.id),
          personKey: planPersonKey(a.teamId, role.assigneeId, member.name),
          memberName: shortFio(member.name),
          projectTitle: projectGroupKey(item),
          itemTitle: item.title,
          startWeek,
          endWeek: startWeek + planDurationWeeks(days) - 1,
        });
      }
    }
  }
  return out;
}

function planTrackBg(weeks: number): string {
  const weekPct = 100 / weeks;
  return `repeating-linear-gradient(90deg, transparent 0, transparent calc(${weekPct}% - 1px), var(--line) calc(${weekPct}% - 1px), var(--line) ${weekPct}%)`;
}

/** e.g. `Н4 (12.10–18.10)` — Monday through Sunday of that plan week. */
function planWeekMonSunLabel(week: number): string {
  const monday = addWeeks(state.startDate, week);
  const sunday = addDays(monday, 6);
  const short = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}.${m}`;
  };
  return `Н${week + 1} (${short(monday)}–${short(sunday)})`;
}

function planWeekConflictProjectLine(p: PlanPersonPlacement): string {
  if (p.itemTitle && p.itemTitle !== p.projectTitle) {
    return `${p.projectTitle} · ${p.itemTitle}`;
  }
  return p.projectTitle;
}

/** Structured tip HTML for a conflict week header cell. */
function planWeekConflictTipHtml(
  week: number,
  groups: readonly PlanWeekPersonConflict[]
): string {
  const title = `Пересечение · ${planWeekMonSunLabel(week)}`;
  const blocks = groups
    .map((g) => {
      const projects = g.placements
        .map(
          (p) =>
            `<div class="plan-conflict-tip-proj">• ${escapeHtml(planWeekConflictProjectLine(p))}</div>`
        )
        .join("");
      return `<div class="plan-conflict-tip-group"><div class="plan-conflict-tip-person">${escapeHtml(g.personName)}</div>${projects}</div>`;
    })
    .join("");
  return `<div class="plan-conflict-tip-title">${escapeHtml(title)}</div>${blocks}`;
}

function planWeekConflictAriaLabel(
  week: number,
  groups: readonly PlanWeekPersonConflict[]
): string {
  const people = groups
    .map((g) => {
      const projects = g.placements
        .map((p) => planWeekConflictProjectLine(p))
        .join(", ");
      return `${g.personName}: ${projects}`;
    })
    .join("; ");
  return `Пересечение · ${planWeekMonSunLabel(week)}. ${people}`;
}

function planAxisHtml(
  weeks: number,
  conflictWeeks?: Map<number, PlanWeekPersonConflict[]>
): string {
  const weekPct = 100 / weeks;
  return Array.from({ length: weeks }, (_, w) => {
    const monday = addWeeks(state.startDate, w);
    const [, m, d] = monday.split("-");
    const groups = conflictWeeks?.get(w);
    if (groups?.length) {
      const tip = planWeekConflictTipHtml(w, groups);
      const aria = escapeAttr(planWeekConflictAriaLabel(w, groups));
      return `<div class="plan-axis-tick is-conflict-week" style="width:${weekPct}%" tabindex="0" aria-label="${aria}"><span>Н${w + 1}</span><span>${d}.${m}</span><span class="plan-conflict-tip" role="tooltip">${tip}</span></div>`;
    }
    return `<div class="plan-axis-tick" style="width:${weekPct}%"><span>Н${w + 1}</span><span>${d}.${m}</span></div>`;
  }).join("");
}

/** Diagonal expand-all: arrows point outward (NW / SE). */
const TREE_EXPAND_SVG = `<svg class="tree-expand-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M7 3.5H3.5V7M3.5 3.5 7.2 7.2M9 12.5h3.5V9M12.5 12.5 8.8 8.8"/></svg>`;

/** Diagonal collapse-all: arrows point inward toward center. */
const TREE_COLLAPSE_SVG = `<svg class="tree-expand-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M3.5 3.5H7V7M3.5 3.5 7.2 7.2M12.5 12.5H9V9M12.5 12.5 8.8 8.8"/></svg>`;

/** White-filled warning triangle, red stroke + «!» — person conflict mark on plan role rows. */
const PLAN_CONFLICT_MARK_SVG = `<svg class="plan-conflict-mark-ico" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false"><path fill="var(--surface, #fff)" stroke="var(--accent)" stroke-width="1.2" stroke-linejoin="round" d="M7.14 1.7c.37-.66 1.35-.66 1.72 0l6.12 10.95c.38.68-.1 1.55-.86 1.55H1.88c-.76 0-1.24-.87-.86-1.55L7.14 1.7z"/><path fill="var(--accent)" d="M7.4 5.15h1.2v4.25H7.4zm0 5.25h1.2v1.35H7.4z"/></svg>`;

/** Axis-style short date `dd.mm` for a plan week Monday. */
function planWeekShortDate(week: number): string {
  const monday = addWeeks(state.startDate, week);
  const [, m, d] = monday.split("-");
  return `${d}.${m}`;
}

/** e.g. `Н4–Н5 (12.10–19.10)` or `Н4 (12.10)` when single week. */
function planWeekRangeLabel(startWeek: number, endWeek: number): string {
  const weeks =
    startWeek === endWeek
      ? `Н${startWeek + 1}`
      : `Н${startWeek + 1}–Н${endWeek + 1}`;
  const dates =
    startWeek === endWeek
      ? planWeekShortDate(startWeek)
      : `${planWeekShortDate(startWeek)}–${planWeekShortDate(endWeek)}`;
  return `${weeks} (${dates})`;
}

function planPlacementDisplayTitle(p: PlanPersonPlacement): string {
  if (p.itemTitle && p.itemTitle !== p.projectTitle) {
    return `«${p.projectTitle}» · ${p.itemTitle}`;
  }
  return `«${p.projectTitle}»`;
}

/** Overlapping placements for the same person (excluding self). */
function planConflictCounterparts(
  placeKey: string,
  placements: readonly PlanPersonPlacement[]
): PlanPersonPlacement[] {
  const self = placements.find((p) => p.key === placeKey);
  if (!self?.personKey) return [];
  return placements.filter(
    (p) =>
      p.key !== placeKey &&
      p.personKey === self.personKey &&
      planWeeksOverlap(self.startWeek, self.endWeek, p.startWeek, p.endWeek)
  );
}

/**
 * Tooltip listing conflicting projects/weeks, e.g.
 * `Пересечение: «Сайт ЛК» · Функция A Н4–Н5 (12.10–19.10); «Активные продажи» Н4–Н8 (12.10–09.11)`
 */
function planPersonConflictTooltip(
  placeKey: string,
  placements: readonly PlanPersonPlacement[]
): string {
  const parts = planConflictCounterparts(placeKey, placements).map(
    (p) =>
      `${planPlacementDisplayTitle(p)} ${planWeekRangeLabel(p.startWeek, p.endWeek)}`
  );
  if (!parts.length) return "Пересечение по исполнителю";
  return `Пересечение: ${parts.join("; ")}`;
}

function planConflictMarkHtml(
  title = "Пересечение по исполнителю"
): string {
  const label = escapeAttr(title);
  const tip = escapeHtml(title);
  // CSS tip (not native title): appears immediately; survives overflow:hidden ancestors via fixed JS
  return `<span class="plan-conflict-mark" tabindex="0" aria-label="${label}">${PLAN_CONFLICT_MARK_SVG}<span class="plan-conflict-tip" role="tooltip">${tip}</span></span>`;
}

function treeExpandControlsHtml(scope: "plan" | "gantt"): string {
  return `<div class="tree-expand-controls" role="group" aria-label="Свернуть или развернуть дерево">
    <button type="button" class="tree-expand-btn" data-tree-expand="${scope}" title="Развернуть все" aria-label="Развернуть все">${TREE_EXPAND_SVG}</button>
    <button type="button" class="tree-expand-btn" data-tree-collapse="${scope}" title="Свернуть все" aria-label="Свернуть все">${TREE_COLLAPSE_SVG}</button>
  </div>`;
}

function collectDatasetKeys(
  selector: string,
  attr: string
): Record<string, true> {
  const out: Record<string, true> = {};
  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const key = el.dataset[attr];
    if (key) out[key] = true;
  });
  return out;
}

function setPlanTreeExpanded(expanded: boolean) {
  if (expanded) {
    ui.planCollapsedProjects = {};
    ui.planCollapsedItems = {};
  } else {
    ui.planCollapsedProjects = collectDatasetKeys(
      "[data-plan-project]",
      "planProject"
    );
    ui.planCollapsedItems = collectDatasetKeys("[data-plan-fn]", "planFn");
  }
  render();
}

function setGanttTreeExpanded(expanded: boolean) {
  if (expanded) {
    ui.ganttCollapsedProjects = {};
    ui.ganttCollapsedItems = {};
    ui.ganttCollapsedTeams = {};
  } else {
    ui.ganttCollapsedProjects = collectDatasetKeys(
      "[data-gantt-project]",
      "ganttProject"
    );
    ui.ganttCollapsedItems = collectDatasetKeys("[data-gantt-fn]", "ganttFn");
    ui.ganttCollapsedTeams = collectDatasetKeys(
      "[data-gantt-team]",
      "ganttTeam"
    );
  }
  render();
}

const PLAN_DURATION_CHIPS = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60];

function planDurationWeeks(days: number): number {
  return Math.max(1, Math.ceil(days / WORKING_DAYS_PER_WEEK - 1e-9));
}

function planChipDate(iso: string): string {
  const months = [
    "янв",
    "фев",
    "мар",
    "апр",
    "мая",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек",
  ];
  const parts = iso.split("-");
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return `${d} ${months[m - 1] ?? ""}`;
}

function teamMemberById(teamId: string, memberId?: string): TeamMember | undefined {
  if (!memberId) return undefined;
  return teamById(teamId)?.members?.find((m) => m.id === memberId);
}

/** On timeline = role has a resolved assignee (plan bar shown). */
function rolePlacedOnTimeline(
  teamId: string,
  role: AssignmentRole
): TeamMember | undefined {
  return teamMemberById(teamId, role.assigneeId);
}

/** Role row label: approved = role + surname; unapproved = role only. */
function planRoleLeftLabel(
  role: AssignmentRole,
  member: TeamMember | undefined
): string {
  if (!member) return escapeHtml(role.name);
  return `${escapeHtml(role.name)} <span class="plan-fio-label">${escapeHtml(shortFio(member.name))}</span>`;
}

function planPlaceOpenBtnHtml(
  itemId: string,
  teamId: string,
  roleId: string,
  onTimeline: boolean
): string {
  if (onTimeline) {
    return `<button type="button" class="btn plan-place-btn plan-place-btn-edit" data-plan-task-open="${itemId}" data-team="${teamId}" data-role="${escapeAttr(roleId)}" title="Изменить назначение на таймлайне">Изменить</button>`;
  }
  return `<button type="button" class="btn btn-primary plan-place-btn" data-plan-task-open="${itemId}" data-team="${teamId}" data-role="${escapeAttr(roleId)}" title="Поставить на таймлайн">Поставить на таймлайн</button>`;
}

function planTaskFormHtml(item: WorkItem, teamId: string, roleId: string): string {
  const form = ui.planTaskForm;
  if (
    !form ||
    form.itemId !== item.id ||
    form.teamId !== teamId ||
    form.roleId !== roleId
  ) {
    return "";
  }
  const team = teamById(teamId);
  const assign = item.assignments.find((a) => a.teamId === teamId);
  const role = assign?.roles?.find((r) => r.id === roleId);
  const editing = role ? Boolean(rolePlacedOnTimeline(teamId, role)) : false;
  const job = roleJobLabel(role?.name ?? "");
  const allPeople = team?.members ?? [];
  const roleKey = role?.name ? normalizeAssignmentRoleName(role.name) : "";
  const matched = roleKey
    ? allPeople.filter(
        (m) => normalizeAssignmentRoleName(m.role) === roleKey
      )
    : allPeople;
  const peopleSrc = matched.length ? matched : allPeople;
  const people = peopleSrc
    .map((m) => {
      const on = form.memberId === m.id;
      return `<button type="button" class="plan-chip${on ? " is-on" : ""}" data-plan-form-member="${escapeAttr(m.id)}">${escapeHtml(shortFio(m.name))} · ${escapeHtml(job)}</button>`;
    })
    .join("");
  const starts = Array.from({ length: PLAN_WEEKS }, (_, w) => {
    const on = form.startWeek === w;
    return `<button type="button" class="plan-chip${on ? " is-on" : ""}" data-plan-form-week="${w}">${planChipDate(addWeeks(state.startDate, w))}</button>`;
  }).join("");
  const durs = PLAN_DURATION_CHIPS.map((d) => {
    const on = form.days === d;
    return `<button type="button" class="plan-chip${on ? " is-on" : ""}" data-plan-form-days="${d}">${d}</button>`;
  }).join("");
  const title = editing
    ? `Изменить назначение на таймлайне: ${escapeHtml(item.title)}`
    : `Новая задача на таймлайн: ${escapeHtml(item.title)}`;
  return `<div class="plan-task-form">
    <div class="plan-task-form-title">${title}</div>
    <div class="plan-task-label">Исполнитель</div>
    <div class="plan-chips">${people || `<span class="meta">Добавьте строки роль — ФИО на вкладке «Команды»</span>`}</div>
    <div class="plan-task-label">Дата старта</div>
    <div class="plan-chips">${starts}</div>
    <div class="plan-task-label">Длительность, рабочих дней</div>
    <div class="plan-chips">${durs}</div>
    <div class="plan-task-actions">
      <button type="button" class="btn btn-primary" data-plan-form-submit>Поставить на таймлайн</button>
      <button type="button" class="btn" data-plan-form-cancel>Отмена</button>
    </div>
  </div>`;
}

function planBarHtml(
  startWeek: number,
  endWeek: number,
  weeks: number,
  color: string,
  label: string,
  conflict: boolean,
  data?: { itemId: string; teamId: string; roleId?: string }
): string {
  const left = (Math.max(0, startWeek) / weeks) * 100;
  const span = Math.max(1, endWeek - startWeek + 1);
  const width = (span / weeks) * 100;
  const attrs = data
    ? ` data-plan-bar data-item="${escapeAttr(data.itemId)}" data-team="${escapeAttr(data.teamId)}"${
        data.roleId ? ` data-role="${escapeAttr(data.roleId)}"` : ""
      } data-start-week="${startWeek}" data-end-week="${endWeek}"`
    : "";
  return `<div class="plan-bar${conflict ? " is-conflict" : ""}"${attrs} style="left:${left}%;width:${Math.max(width, 3)}%;background:${color}" title="${escapeAttr(label)}">${escapeHtml(label)}</div>`;
}

/** Min start … max end across child placements; null if none. */
function planAggregateSpan(
  spans: readonly { startWeek: number; endWeek: number }[]
): { startWeek: number; endWeek: number } | null {
  if (!spans.length) return null;
  let startWeek = spans[0]!.startWeek;
  let endWeek = spans[0]!.endWeek;
  for (let i = 1; i < spans.length; i++) {
    const s = spans[i]!;
    if (s.startWeek < startWeek) startWeek = s.startWeek;
    if (s.endWeek > endWeek) endWeek = s.endWeek;
  }
  return { startWeek, endWeek };
}

type GanttBarLevel = "project" | "fn" | "team" | "role";

/** Soft aggregate / role bar for Gantt hierarchy (no drag handles, minimal label). */
function ganttLevelBarHtml(
  startWeek: number,
  endWeek: number,
  weeks: number,
  color: string,
  level: GanttBarLevel,
  title: string,
  conflict = false
): string {
  const left = (Math.max(0, startWeek) / weeks) * 100;
  const span = Math.max(1, endWeek - startWeek + 1);
  const width = (span / weeks) * 100;
  const cls = `plan-bar plan-bar-${level}${conflict ? " is-conflict" : ""}`;
  return `<div class="${cls}" style="left:${left}%;width:${Math.max(width, 3)}%;background:${color}" title="${escapeAttr(title)}"></div>`;
}

function ganttProjectBarColor(status?: ItemStatus): string {
  switch (status) {
    case "staffing":
      return "color-mix(in srgb, var(--status-staffing) 44%, transparent)";
    case "in_progress":
      return "color-mix(in srgb, var(--status-in-progress) 48%, transparent)";
    case "paused":
      return "color-mix(in srgb, var(--status-paused) 40%, transparent)";
    case "done":
      return "color-mix(in srgb, var(--status-done) 42%, transparent)";
    default:
      return "color-mix(in srgb, var(--status-paused) 32%, transparent)";
  }
}

function ganttFnBarColor(teamColors: readonly string[]): string {
  if (teamColors.length === 1) {
    return `color-mix(in srgb, ${teamColors[0]} 48%, transparent)`;
  }
  if (teamColors.length > 1) {
    return "color-mix(in srgb, #6b7280 52%, transparent)";
  }
  return "color-mix(in srgb, #6b7280 48%, transparent)";
}

function ganttTeamBarColor(teamColor: string): string {
  return `color-mix(in srgb, ${teamColor} 72%, transparent)`;
}

function planTrackHtml(inner: string, weeks: number): string {
  return `<div class="plan-track" style="background:${planTrackBg(weeks)}">${inner}</div>`;
}

type GanttRoleBar = {
  item: WorkItem;
  teamId: string;
  role: AssignmentRole;
  memberName: string;
  days: number;
  startWeek: number;
  endWeek: number;
};

function planningDemandRoles(a: TeamAssignment): AssignmentRole[] {
  const sent = submittedAssignmentRoles(a);
  if (sent.length) return sent;
  const team = teamById(a.teamId);
  return filterAssignmentRolesToTeam(a.roles, resolveTeamRoleNames(team));
}

function collectGanttRoleBars(ranges = szRanges()): GanttRoleBar[] {
  const out: GanttRoleBar[] = [];
  for (const item of demandProjectItems()) {
    if (item.status === "done") continue;
    for (const a of item.assignments) {
      for (const role of planningDemandRoles(a)) {
        const member = teamMemberById(a.teamId, role.assigneeId);
        if (!member) continue;
        const days = rolePlanDays(role, ranges);
        const startWeek = weekIndex(
          state.startDate,
          role.workStartDate || a.workStartDate
        );
        out.push({
          item,
          teamId: a.teamId,
          role,
          memberName: member.name,
          days,
          startWeek,
          endWeek: startWeek + planDurationWeeks(days) - 1,
        });
      }
    }
  }
  return out;
}

function ganttPlanHtml(overflowByTeam: Record<string, Set<number>>): string {
  const weeks = Math.max(4, Math.min(52, Math.round(ui.ganttWeeks) || 16));
  ui.ganttWeeks = weeks;
  const ranges = szRanges();
  const bars = collectGanttRoleBars(ranges);
  const prioMap = projectPrioMap();
  const items = sortByPriority(
    demandProjectItems().filter((it) => it.status !== "done"),
    ranges
  );
  const groups = groupByProjectKey(items).sort((a, b) => {
    const pa = prioMap.get(a.key) ?? 9999;
    const pb = prioMap.get(b.key) ?? 9999;
    return pa - pb;
  });
  const placedKeys = new Set(bars.map((b) => demandProjectKey(b.item)));
  const assignees = new Set(bars.map((b) => `${b.teamId}:${b.role.assigneeId}`));
  const conflictCount = state.teams.reduce(
    (n, t) => n + planConflictWeeks(t.id, overflowByTeam, weeks),
    0
  );

  const body = groups.length
    ? groups
        .map((g) => {
          const open = !ui.ganttCollapsedProjects[g.key];
          const projectSpans: { startWeek: number; endWeek: number }[] = [];
          const fnRows = g.items
            .map((item) => {
              const fnOpen = !ui.ganttCollapsedItems[item.id];
              const assigns = item.assignments;
              const itemSpans: { startWeek: number; endWeek: number }[] = [];
              const itemTeamColors: string[] = [];
              const execRows = assigns
                .map((a) => {
                  const team = teamById(a.teamId);
                  const roles = planningDemandRoles(a);
                  const conflict =
                    planConflictWeeks(a.teamId, overflowByTeam, weeks) > 0;
                  if (!roles.length) return "";
                  const teamKey = `${item.id}:${a.teamId}`;
                  const teamOpen = !ui.ganttCollapsedTeams[teamKey];
                  const teamColor = team?.color ?? "#484f55";
                  const teamSpans: { startWeek: number; endWeek: number }[] =
                    [];
                  const roleRows = roles
                    .map((role) => {
                      const member = teamMemberById(a.teamId, role.assigneeId);
                      const days = rolePlanDays(role, ranges);
                      const startWeek = weekIndex(
                        state.startDate,
                        role.workStartDate || a.workStartDate
                      );
                      const endWeek = startWeek + planDurationWeeks(days) - 1;
                      const left = member
                        ? `${shortFio(member.name)} · ${days} дн.`
                        : `${role.name} · ${days} дн.`;
                      if (member) {
                        teamSpans.push({ startWeek, endWeek });
                      }
                      const bar = member
                        ? ganttLevelBarHtml(
                            startWeek,
                            endWeek,
                            weeks,
                            teamColor,
                            "role",
                            `${role.name} · ${planWeekRangeLabel(startWeek, endWeek)}`,
                            conflict
                          )
                        : `<div class="plan-bar-empty"></div>`;
                      return `<div class="plan-row plan-role-row">
                        <div class="plan-cell">
                          <span class="plan-exec-name plan-fio-name">${escapeHtml(left)}${conflict && member ? planConflictMarkHtml("Конфликт ресурса") : ""}</span>
                        </div>
                        ${planTrackHtml(bar, weeks)}
                      </div>`;
                    })
                    .join("");
                  if (teamSpans.length) {
                    itemSpans.push(...teamSpans);
                    if (!itemTeamColors.includes(teamColor)) {
                      itemTeamColors.push(teamColor);
                    }
                  }
                  const teamAgg = planAggregateSpan(teamSpans);
                  const teamBar = teamAgg
                    ? ganttLevelBarHtml(
                        teamAgg.startWeek,
                        teamAgg.endWeek,
                        weeks,
                        ganttTeamBarColor(teamColor),
                        "team",
                        `${team?.name ?? a.teamId} · ${planWeekRangeLabel(teamAgg.startWeek, teamAgg.endWeek)}`,
                        conflict
                      )
                    : "";
                  return `<details class="plan-team" data-gantt-team="${escapeAttr(teamKey)}"${teamOpen ? " open" : ""}>
                    <summary class="plan-row plan-exec-row plan-team-sum">
                      <div class="plan-cell">
                        <span class="plan-exec-name">${escapeHtml(team?.name ?? a.teamId)}</span>
                      </div>
                      ${planTrackHtml(teamBar, weeks)}
                    </summary>
                    ${roleRows}
                  </details>`;
                })
                .join("");
              if (itemSpans.length) {
                projectSpans.push(...itemSpans);
              }
              const fnAgg = planAggregateSpan(itemSpans);
              const fnBar = fnAgg
                ? ganttLevelBarHtml(
                    fnAgg.startWeek,
                    fnAgg.endWeek,
                    weeks,
                    ganttFnBarColor(itemTeamColors),
                    "fn",
                    `${item.title} · ${planWeekRangeLabel(fnAgg.startWeek, fnAgg.endWeek)}`
                  )
                : "";
              return `<details class="plan-fn" data-gantt-fn="${item.id}"${fnOpen ? " open" : ""}>
                <summary class="plan-row plan-fn-sum">
                  <div class="plan-cell">
                    <span class="plan-fn-title">${escapeHtml(item.title)}</span>
                  </div>
                  ${planTrackHtml(fnBar, weeks)}
                </summary>
                ${execRows || `<div class="plan-row plan-team-row"><div class="plan-cell"><span class="plan-exec-name">Команда не назначена</span></div>${planTrackHtml("", weeks)}</div>`}
              </details>`;
            })
            .join("");
          const projectAgg = planAggregateSpan(projectSpans);
          const projectStatus = projectGroupStatus(g.items);
          const projectBar = projectAgg
            ? ganttLevelBarHtml(
                projectAgg.startWeek,
                projectAgg.endWeek,
                weeks,
                ganttProjectBarColor(projectStatus),
                "project",
                `${g.title}${projectStatus ? ` · ${statusLabel(projectStatus)}` : ""} · ${planWeekRangeLabel(projectAgg.startWeek, projectAgg.endWeek)}`
              )
            : "";
          return `<details class="plan-project" data-gantt-project="${escapeAttr(g.key)}"${open ? " open" : ""}>
            <summary class="plan-row plan-project-sum">
              <div class="plan-cell">
                <span class="plan-project-title">${prioBadgeHtml(prioMap.get(g.key))}${escapeHtml(g.title)}</span>
                <span class="plan-project-meta">${g.items.length} функц.</span>
              </div>
              ${planTrackHtml(projectBar, weeks)}
            </summary>
            ${fnRows}
          </details>`;
        })
        .join("")
    : `<div class="plan-empty meta">Нет проектов. Добавьте их в Реестре и назначьте команды в Потребности.</div>`;

  return `
    <div class="gantt-page">
      <div class="panel-header need-page-head">
        <div>
          <h2>Гант — итоговый ресурсный план</h2>
          <p class="meta">Проект → функциональность → команда → роль. Полоски — назначения с вкладки «Планирование».</p>
        </div>
        <div class="gantt-head-actions">
          ${treeExpandControlsHtml("gantt")}
          <div class="gantt-weeks-ctrl-right">
            <label for="ganttWeeks">Горизонт</label>
            <input id="ganttWeeks" type="range" min="4" max="52" step="1" value="${weeks}" />
            <span class="mono" id="ganttWeeksLabel">${weeks} нед.</span>
          </div>
        </div>
      </div>
      <div class="need-stats gantt-stats">
        <div class="need-stat"><div class="label">Всего проектов</div><div class="value">${groups.length}</div></div>
        <div class="need-stat"><div class="label">Расположено</div><div class="value">${placedKeys.size}</div></div>
        <div class="need-stat"><div class="label">Задач</div><div class="value">${bars.length}</div></div>
        <div class="need-stat"><div class="label">Исполнителей</div><div class="value">${assignees.size}</div></div>
        <div class="need-stat"><div class="label">Конфликтов ресурса</div><div class="value${conflictCount ? " is-pending" : ""}">${conflictCount}</div></div>
      </div>
      <div class="plan-board gantt-board">
        <div class="plan-row plan-board-head">
          <div class="plan-cell plan-head-label">Проект / функциональность / команда / роль</div>
          <div class="plan-axis">${planAxisHtml(weeks)}</div>
        </div>
        ${body}
      </div>
    </div>
  `;
}

function planningHtml(
  rollups: ItemSchedule[],
  _slices: ScheduledSlice[],
  overflowByTeam: Record<string, Set<number>>
): string {
  const weeks = PLAN_WEEKS;
  const selected = planSelectedTeamIds();
  const selectedSet = new Set(selected);
  const focusId = planFocusTeamId(selected);
  const ranges = szRanges();
  const byItem = new Map(rollups.map((r) => [r.item.id, r]));

  const chips = state.teams
    .map((t) => {
      const on = selectedSet.has(t.id);
      const focus = t.id === focusId;
      return `<button type="button" class="plan-team-chip${on ? " is-on" : ""}${focus ? " is-focus" : ""}" data-plan-team="${escapeAttr(t.id)}" title="${escapeAttr(on ? "Скрыть команду" : "Показать команду")}">
        <span class="team-dot${on ? "" : " is-hollow"}" style="${on ? `background:${t.color}` : `border-color:${t.color}`}"></span>${escapeHtml(t.name)}
      </button>`;
    })
    .join("");

  const items = sortByPriority(
    demandProjectItems().filter((it) =>
      it.assignments.some((a) => selectedSet.has(a.teamId))
    ),
    ranges
  );
  const groups = groupByProjectKey(items);
  const selectedAssigns = items.flatMap((it) =>
    it.assignments
      .filter((a) => selectedSet.has(a.teamId))
      .map((a) => ({ item: it, a }))
  );
  const requestedDays = selectedAssigns.reduce(
    (s, x) => s + assignmentPlanDays(x.a, ranges),
    0
  );
  const agreedDays = agreedRolePlanDays(
    selectedAssigns.map((x) => x.a),
    ranges
  );
  const capacityConflictWeeks = selected.reduce(
    (n, id) => n + planConflictWeeks(id, overflowByTeam, weeks),
    0
  );
  const personPlacements = collectPlanPersonPlacements(
    items,
    selectedSet,
    ranges
  );
  const personConflictKeys = findPersonConflictKeys(personPlacements);
  const personConflictWeeks = findPersonConflictWeeks(
    personPlacements,
    weeks
  );
  const conflictCount = personConflictKeys.size || capacityConflictWeeks;

  const body = groups.length
    ? groups
        .map((g) => {
          const open = !ui.planCollapsedProjects[g.key];
          const fnRows = g.items
            .map((item) => {
              const assigns = item.assignments.filter((a) =>
                selectedSet.has(a.teamId)
              );
              const req = assigns.reduce(
                (s, a) => s + assignmentPlanDays(a, ranges),
                0
              );
              const roll = byItem.get(item.id);
              const itemSlices = (roll?.slices ?? []).filter((s) =>
                selectedSet.has(s.teamId)
              );
              const agreed = agreedRolePlanDays(assigns, ranges);
              const fnOpen = !ui.planCollapsedItems[item.id];
              const execRows = assigns
                .map((a) => {
                  const team = teamById(a.teamId);
                  const roles = planningDemandRoles(a);
                  if (!roles.length) return "";
                  const head = `<div class="plan-row plan-exec-row plan-team-row">
                    <div class="plan-cell">
                      <span class="plan-exec-name"><span class="team-dot" style="background:${team?.color ?? "#93999e"}"></span>${escapeHtml(team?.name ?? a.teamId)}</span>
                    </div>
                    ${planTrackHtml("", weeks)}
                  </div>`;
                  const roleRows = roles
                    .map((role) => {
                      const member = rolePlacedOnTimeline(a.teamId, role);
                      const onTimeline = Boolean(member);
                      const days = rolePlanDays(role, ranges);
                      const startWeek = weekIndex(
                        state.startDate,
                        role.workStartDate || a.workStartDate
                      );
                      const endWeek = startWeek + planDurationWeeks(days) - 1;
                      const placeKey = planPlacementKey(
                        item.id,
                        a.teamId,
                        role.id
                      );
                      const personConflict = personConflictKeys.has(placeKey);
                      const conflictTip = personConflict
                        ? planPersonConflictTooltip(placeKey, personPlacements)
                        : "";
                      const label = member
                        ? `${shortFio(member.name)} · ${days} дн.`
                        : `${role.name} · ${days} дн.`;
                      const barTitle = personConflict
                        ? `${label} — ${conflictTip}`
                        : label;
                      const bar = member
                        ? planBarHtml(
                            startWeek,
                            endWeek,
                            weeks,
                            team?.color ?? "#484f55",
                            barTitle,
                            personConflict,
                            {
                              itemId: item.id,
                              teamId: a.teamId,
                              roleId: role.id,
                            }
                          )
                        : `<button type="button" class="plan-bar-empty" data-plan-task-open="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}" title="Поставить на таймлайн"></button>`;
                      const leftLabel = planRoleLeftLabel(role, member);
                      const rowCls = personConflict
                        ? " plan-role-row is-person-conflict"
                        : " plan-role-row";
                      return `${planTaskFormHtml(item, a.teamId, role.id)}<div class="plan-row${rowCls}">
                        <div class="plan-cell">
                          <span class="plan-exec-name plan-fio-name">${leftLabel}${personConflict ? planConflictMarkHtml(conflictTip) : ""}</span>
                          ${planPlaceOpenBtnHtml(item.id, a.teamId, role.id, onTimeline)}
                        </div>
                        ${planTrackHtml(bar, weeks)}
                      </div>`;
                    })
                    .join("");
                  return `${head}${roleRows}`;
                })
                .join("");
              const fnBar =
                itemSlices.length === 0
                  ? `<div class="plan-bar-empty"></div>`
                  : "";
              return `<details class="plan-fn" data-plan-fn="${item.id}"${fnOpen ? " open" : ""}>
                <summary class="plan-row plan-fn-sum">
                  <div class="plan-cell">
                    <span class="plan-fn-title">${escapeHtml(item.title)}</span>
                    <span class="plan-fn-days">${req}/${agreed || "—"}</span>
                  </div>
                  ${planTrackHtml(fnBar, weeks)}
                </summary>
                ${execRows}
              </details>`;
            })
            .join("");
          return `<details class="plan-project" data-plan-project="${escapeAttr(g.key)}"${open ? " open" : ""}>
            <summary class="plan-row plan-project-sum">
              <div class="plan-cell">
                <span class="plan-project-title">${prioBadgeHtml(projectPrioMap().get(g.key))}${escapeHtml(g.title)}</span>
                <span class="plan-project-meta">${g.items.length} функц.</span>
              </div>
              ${planTrackHtml("", weeks)}
            </summary>
            ${fnRows}
          </details>`;
        })
        .join("")
    : selected.length === 0
      ? `<div class="plan-empty meta">Команды не выбраны. Отметьте команду сверху или нажмите «Выбрать все».</div>`
      : `<div class="plan-empty meta">Нет проектов у выбранных команд. Отметьте команду сверху или назначьте её на вкладке «Потребность».</div>`;

  return `
    <div class="plan-page">
      <div class="panel-header need-page-head">
        <div>
          <h2>Планирование потребности</h2>
          <p class="meta">У тимлида несколько проектов с запросом на ресурс. Слева — проекты по функциональностям, справа — шкала назначений.</p>
        </div>
        <div class="plan-head-actions">
          ${treeExpandControlsHtml("plan")}
          <div class="plan-team-filter-actions">
            <button type="button" class="plan-team-filter-btn" data-plan-teams-clear>Сбросить фильтр</button>
            <button type="button" class="plan-team-filter-btn is-primary" data-plan-teams-all>Выбрать все</button>
          </div>
        </div>
      </div>
      <div class="plan-teams">
        <span class="plan-teams-label">Моя команда</span>
        <div class="plan-team-chips" aria-label="Команды">${chips || `<span class="meta">Нет команд</span>`}</div>
      </div>
      <div class="need-stats plan-stats">
        <div class="need-stat"><div class="label">Проектов команды</div><div class="value">${groups.length}</div></div>
        <div class="need-stat"><div class="label">Функциональностей</div><div class="value">${items.length}</div></div>
        <div class="need-stat"><div class="label">Запрошено / согласовано дней</div><div class="value">${requestedDays} <span class="plan-stat-sep">/</span> ${agreedDays}</div></div>
        <div class="need-stat"><div class="label">Конфликтов ресурса</div><div class="value${conflictCount ? " is-pending" : ""}">${conflictCount}</div></div>
      </div>
      <div class="plan-board">
        <div class="plan-row plan-board-head">
          <div class="plan-cell plan-head-label">Проекты и функциональности</div>
          <div class="plan-axis">${planAxisHtml(weeks, personConflictWeeks)}</div>
        </div>
        ${body}
      </div>
    </div>
  `;
}

function tabContentHtml(
  rollups: ItemSchedule[],
  slices: ScheduledSlice[],
  load: Record<string, TeamLoadWeek[]>,
  overflowByTeam: Record<string, Set<number>>
): string {
  switch (ui.tab) {
    case "portfolio":
      return portfolioHtml(rollups, slices);
    case "demand":
      return demandHtml();
    case "planning":
      return planningHtml(rollups, slices, overflowByTeam);
    case "queuesTest":
      return queuesTestHtml(slices, load, overflowByTeam);
    case "timeline":
      return ganttPlanHtml(overflowByTeam);
    case "demoA":
      return demoVariantAHtml(load, overflowByTeam);
    case "demoB":
      return demoVariantBHtml(load, overflowByTeam);
    case "capacity":
      return capacityHtml();
    case "changelog":
      return changeLogHtml();
    case "settings":
      return settingsHtml(rollups);
  }
}

function settingsHtml(rollups: ItemSchedule[]): string {
  const r = state.sizeRanges;
  const active = state.items.filter((i) => i.status !== "done");
  const ends = rollups.map((s) => s.endWeek);
  const horizon = ends.length ? Math.max(...ends) + 1 : 0;
  const canPlan = currentCan("settings.plan");
  const canSizes = currentCan("settings.sizes");
  const canPack = currentCan("settings.portfolioPack");
  const canRoles = currentCan("settings.appRoles");

  const rows = TSHIRT_SIZES.map(
    (sz) => `
    <div class="size-range-row">
      <div class="size-range-label">
        <span class="size-badge size-badge-lg">${sz}</span>
        <span class="size-range-caption">${sizePillCaption(sz, r)}</span>
      </div>
      <label class="size-range-field">
        <span class="settings-label">от, дн.</span>
        <input
          type="number"
          id="set_${sz}_min"
          class="set-range"
          data-size="${sz}"
          data-bound="min"
          min="1"
          step="1"
          value="${r[sz].min}"
          ${canSizes ? "" : "disabled"}
        />
      </label>
      <label class="size-range-field">
        <span class="settings-label">до, дн.</span>
        <input
          type="number"
          id="set_${sz}_max"
          class="set-range"
          data-size="${sz}"
          data-bound="max"
          min="1"
          step="1"
          value="${r[sz].max}"
          ${canSizes ? "" : "disabled"}
        />
      </label>
      <div class="size-range-plan">
        <span class="settings-label">для плана</span>
        <strong class="mono settings-plan-value" data-plan="${sz}">${sizePlanDays(sz, r)} дн. → ${sizePlanWeeks(sz, r)} нед.</strong>
      </div>
    </div>
  `
  ).join("");

  return `
    <div class="settings-stack">
      <header class="settings-page-head">
        <h2 class="settings-page-title">Настройки</h2>
        <p class="settings-page-lead">Параметры планирования, ролевая модель и исходный портфель.</p>
      </header>
      ${appRolesSettingsHtml(canRoles)}
      ${
        canPlan
          ? `<div class="panel">
        <div class="panel-header">
          <h3 class="settings-section-title">Старт планирования</h3>
        </div>
        <div class="settings-plan-start">
          <label class="settings-plan-start-field plan-start-anchor">
            <span class="settings-label">Дата (понедельник)</span>
            <input
              type="date"
              class="plan-start-date-input settings-plan-start-input"
              value="${state.startDate}"
              aria-label="Старт планирования"
            />
          </label>
          <p class="settings-help settings-plan-start-hint">
            Якорь шкалы недель Gantt. При смене шкала сдвигается; абсолютные даты работ сохраняются.
            Дата округляется к понедельнику.
          </p>
        </div>
      </div>`
          : ""
      }
      ${
        canSizes
          ? `<div class="panel panel-sticky-host">
        <div class="panel-sticky">
          <div class="panel-header">
            <h3 class="settings-section-title">Маечная оценка (XS–XXL)</h3>
            <button type="button" class="btn" id="resetSizeRanges">Сбросить по умолчанию</button>
          </div>
        </div>
        <p class="settings-help settings-size-ranges-hint">
          Сколько дней заложено в оценке. Для плана берётся середина диапазона и делится на 5 рабочих дней (не меньше 1 нед.).
          Изменения сразу перестраивают дату реализации и Gantt.
        </p>
        <div class="size-ranges-grid">${rows}</div>
        <div class="settings-preview" id="settingsSchedPreview">
          <div class="settings-preview-caption">Сейчас в плане</div>
          <div class="settings-preview-row">
            <span class="settings-preview-key">Горизонт портфеля</span>
            <strong class="mono settings-preview-value" id="settingsHorizon">${horizon} нед.</strong>
          </div>
          <div class="settings-preview-row">
            <span class="settings-preview-key">Активных функциональностей</span>
            <strong class="mono settings-preview-value">${active.length}</strong>
          </div>
          <div class="settings-preview-row">
            <span class="settings-preview-key">Шкала маечной оценки</span>
            <strong class="settings-preview-value" id="settingsRangesSummary">${sizeRangesSummary(r)}</strong>
          </div>
        </div>
      </div>`
          : ""
      }
      ${
        canPack
          ? `<div class="panel">
        <div class="panel-header">
          <h3 class="settings-section-title">Портфель из таблицы</h3>
        </div>
        <div class="settings-panel-body">
          <p class="settings-help">
            Текущий набор: приоритезация доп. проектов, старт у всех
            <strong>01.10.2026</strong>, оценка — из таблицы (XS–XXL как в исходнике).
            ${
              state.portfolioPack === PORTFOLIO_PACK_ID
                ? "Пакет загружен."
                : state.portfolioPack?.endsWith("rolled-back")
                  ? "Сейчас показаны данные до загрузки (откат)."
                  : "Пакет ещё не применялся к этим данным."
            }
          </p>
          <div class="settings-pack-actions">
            <button type="button" class="btn" id="rollbackPrioBtn" ${
              hasPortfolioPackBackup() ? "" : "disabled"
            }>Откатить загрузку</button>
            <button type="button" class="btn" id="reapplyPrioBtn">Загрузить таблицу снова</button>
          </div>
        </div>
      </div>`
          : ""
      }
    </div>
  `;
}

function appRolesSettingsHtml(canEdit: boolean): string {
  const people = appPeopleDirectory();
  const teamOpts = (selected: readonly string[]) =>
    state.teams
      .map(
        (t) =>
          `<option value="${escapeAttr(t.id)}" ${
            selected.includes(t.id) ? "selected" : ""
          }>${escapeHtml(t.name)}</option>`
      )
      .join("");

  const bodyRows = people
    .map((p) => {
      const assignment = findRoleAssignment(state.roleAssignments, p.id);
      const role = assignment?.role ?? "employee";
      const leadTeams =
        role === "team_lead"
          ? resolveLeadTeamIds(assignment, p)
          : [];
      const roleOpts = APP_ROLES.map(
        (r) =>
          `<option value="${r}" ${r === role ? "selected" : ""}>${escapeHtml(
            APP_ROLE_LABELS[r]
          )}</option>`
      ).join("");
      const teamCell =
        role === "team_lead"
          ? `<select
              class="app-role-teams"
              data-app-role-teams="${escapeAttr(p.id)}"
              multiple
              size="${Math.min(3, Math.max(1, state.teams.length))}"
              aria-label="Команды тимлида"
              ${canEdit ? "" : "disabled"}
            >${teamOpts(leadTeams)}</select>`
          : `<span class="app-role-teams-na meta">—</span>`;
      return `
        <tr data-app-person="${escapeAttr(p.id)}">
          <td class="app-role-fio">
            <div class="app-role-name">${escapeHtml(p.name)}</div>
            <div class="meta">${
              p.teamIds.length
                ? escapeHtml(
                    p.teamIds
                      .map(
                        (id) =>
                          state.teams.find((t) => t.id === id)?.name ?? id
                      )
                      .join(", ")
                  )
                : "вне команд"
            }</div>
          </td>
          <td>
            <select
              class="app-role-select"
              data-app-role="${escapeAttr(p.id)}"
              aria-label="Роль приложения"
              ${canEdit ? "" : "disabled"}
            >${roleOpts}</select>
          </td>
          <td class="app-role-teams-cell">${teamCell}</td>
        </tr>`;
    })
    .join("");

  return `
    <div class="panel">
      <div class="panel-header">
        <h3 class="settings-section-title">Ролевая модель</h3>
      </div>
      <div class="settings-panel-body app-roles-body">
        <p class="settings-help">
          Кто пользуется планировщиком — отдельно от должностных ролей в «Командах»
          (аналитик, разработчик и т.п.). Назначения хранятся в общем состоянии;
          «Текущий пользователь» в шапке — только для демонстрации прав на этом устройстве.
        </p>
        <div class="app-role-matrix" role="note">
          <div class="settings-label">Права по умолчанию</div>
          <ul class="app-role-matrix-list">
            <li><strong>PM/PMO</strong> — полный доступ: реестр, потребность, планирование, гант, команды, настройки и назначения ролей.</li>
            <li><strong>Тимлид</strong> — потребность / план / гант и правка своих команд; параметры плана без загрузки портфеля и без назначения ролей.</li>
            <li><strong>Сотрудник</strong> — просмотр реестра, ганта, мониторинга и журнала.</li>
          </ul>
        </div>
        ${
          people.length
            ? `<div class="app-roles-table-wrap">
          <table class="app-roles-table">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Роль</th>
                <th>Команды тимлида</th>
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`
            : `<p class="meta">Нет людей в командах — добавьте ФИО на вкладке «Команды».</p>`
        }
        ${
          canEdit
            ? ""
            : `<p class="settings-help">Назначать роли может только PM/PMO. Сейчас: ${escapeHtml(
                APP_ROLE_LABELS[currentAppRole()]
              )}.</p>`
        }
      </div>
    </div>
  `;
}

function currentUserSwitcherHtml(): string {
  const people = appPeopleDirectory();
  const currentId = ensureCurrentUserId();
  const role = currentAppRole();
  if (!people.length) {
    return `<label class="current-user-switch no-print" title="Нет людей в справочнике">
      <span class="current-user-label">Я</span>
      <span class="current-user-empty meta">—</span>
    </label>`;
  }
  const opts = people
    .map((p) => {
      const r = resolveAppRole(state.roleAssignments, p.id);
      return `<option value="${escapeAttr(p.id)}" ${
        p.id === currentId ? "selected" : ""
      }>${escapeHtml(p.name)} · ${escapeHtml(APP_ROLE_LABELS[r])}</option>`;
    })
    .join("");
  return `<label class="current-user-switch no-print" title="Текущий пользователь (демо прав)">
    <span class="current-user-label">Я</span>
    <select id="currentUserSelect" class="current-user-select" aria-label="Текущий пользователь">
      ${opts}
    </select>
    <span class="current-user-role">${escapeHtml(APP_ROLE_LABELS[role])}</span>
  </label>`;
}

function readSizeRangesFromInputs(): SizeRanges | null {
  const draft: Partial<SizeRanges> = {};
  for (const sz of TSHIRT_SIZES) {
    const minEl = document.querySelector<HTMLInputElement>(`#set_${sz}_min`);
    const maxEl = document.querySelector<HTMLInputElement>(`#set_${sz}_max`);
    if (!minEl || !maxEl) return null;
    draft[sz] = {
      min: Math.round(Number(minEl.value)),
      max: Math.round(Number(maxEl.value)),
    };
  }
  return normalizeSizeRanges(draft);
}

function patchSettingsPreview(rollups: ItemSchedule[]) {
  const r = state.sizeRanges;
  for (const sz of TSHIRT_SIZES) {
    document
      .querySelector(`[data-plan="${sz}"]`)
      ?.replaceChildren(
        document.createTextNode(
          `${sizePlanDays(sz, r)} дн. → ${sizePlanWeeks(sz, r)} нед.`
        )
      );
  }
  const ends = rollups.map((s) => s.endWeek);
  const horizon = ends.length ? Math.max(...ends) + 1 : 0;
  const horizonEl = document.querySelector("#settingsHorizon");
  if (horizonEl) horizonEl.textContent = `${horizon} нед.`;
  const summaryEl = document.querySelector("#settingsSchedPreview #settingsRangesSummary");
  if (summaryEl) summaryEl.textContent = sizeRangesSummary(r);
}

let sizeRangesRenderTimer: ReturnType<typeof setTimeout> | undefined;

function applySizeRangesFromInputs() {
  const next = readSizeRangesFromInputs();
  if (!next) return;
  state.sizeRanges = next;
  saveState(state);
  const { rollups } = scheduleState();
  patchSettingsPreview(rollups);

  const focused = document.activeElement as HTMLInputElement | null;
  const focusId = focused?.classList.contains("set-range") ? focused.id : null;

  clearTimeout(sizeRangesRenderTimer);
  sizeRangesRenderTimer = setTimeout(() => {
    render();
    if (focusId) {
      const el = document.querySelector<HTMLInputElement>(`#${focusId}`);
      el?.focus();
      el?.select();
    }
  }, 200);
}

function projectCardGroup(key: string | null):
  | { key: string; title: string; items: WorkItem[] }
  | undefined {
  if (!key) return undefined;
  return groupByProjectKey(state.items).find((g) => g.key === key);
}

function projectCardHtml(): string {
  const creating = ui.creatingProject;
  const group = creating ? undefined : projectCardGroup(ui.editingProjectKey);
  const items = group?.items ?? [];
  const name = creating ? "" : (group?.title ?? ui.editingProjectKey ?? "");
  const statuses = [...new Set(items.map((it) => it.status))];
  const status = statuses.length === 1 ? statuses[0]! : items[0]?.status ?? "staffing";
  const prioMap = projectPrioMap();
  const prio =
    (group ? prioMap.get(group.key) : undefined) ??
    Math.max(1, prioMap.size + 1);
  const cashVals = items
    .map((it) => it.cashFlow12m)
    .filter((n): n is number => n != null && Number.isFinite(n));
  const cash = cashVals.length ? cashVals.reduce((s, n) => s + n, 0) : "";
  const rois = [
    ...new Set(
      items
        .map((it) => it.roi12m)
        .filter((n): n is number => n != null && Number.isFinite(n))
    ),
  ];
  const roi = rois.length === 1 ? rois[0] : "";
  const projectCount = Math.max(1, prioMap.size + (creating ? 1 : 0));
  return `
    <div class="modal-backdrop" id="projectCardModal">
      <div class="modal modal-compact modal-project-card" role="dialog" aria-modal="true" aria-labelledby="projectCardTitle">
        <div class="modal-head">
          <h3 id="projectCardTitle">${creating ? "Новый проект" : "Карточка проекта"}</h3>
          <div class="modal-head-actions">
            <button type="button" class="btn" id="closeProjectCard2">Отмена</button>
            <button type="button" class="btn btn-ghost" id="closeProjectCard">Закрыть</button>
            <button type="button" class="btn btn-primary" id="saveProjectCard">Сохранить</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="field">
            <label for="p_name">Название проекта</label>
            <input id="p_name" type="text" value="${escapeAttr(name)}" autocomplete="off" />
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="p_status">Статус</label>
              <select id="p_status">
                ${ITEM_STATUSES.map(
                  (s) =>
                    `<option value="${s}"${s === status ? " selected" : ""}>${statusLabel(s)}</option>`
                ).join("")}
              </select>
            </div>
            <div class="field">
              <label for="p_rank">Приоритет (1 = выше)</label>
              <input id="p_rank" type="number" min="1" max="${projectCount}" step="1" value="${prio}" />
              <div class="meta">Смена приоритета — после подтверждения.</div>
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="p_cashFlow12m">ЧП (12 мес., млрд ₽)</label>
              <input id="p_cashFlow12m" type="number" step="0.1" inputmode="decimal" placeholder="напр. 1,2" value="${cash}" />
            </div>
            <div class="field">
              <label for="p_roi12m">ROI (12 мес., %)</label>
              <input id="p_roi12m" type="number" step="0.1" inputmode="decimal" placeholder="напр. 15" value="${roi}" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function editorHtml(item: WorkItem | null): string {
  const draft: WorkItem =
    item ??
    ({
      id: "",
      title: "",
      type: "project",
      backlog: "",
      assignments: [],
      status: "staffing",
      owner: "",
      assignee: "",
      reach: 100,
      impact: 1,
      confidence: 0.8,
      notes: "",
      manualRank: nextPriority(state.items),
      cashFlow12m: null,
      roi12m: null,
    } satisfies WorkItem);

  const score = rice(draft, szRanges());
  const effort = riceEffortWeeks(draft, szRanges());
  const confPct = Math.round(draft.confidence * 100);
  const selected = new Set(draft.assignments.map((a) => a.teamId));
  const sizeMap = new Map(
    draft.assignments.map((a) => [a.teamId, a.size])
  );
  const startMap = new Map(
    draft.assignments.map((a) => [a.teamId, a.workStartDate])
  );

  const preview = previewScheduleFor(draft);
  const previewHtml = preview
    ? formatLiveEtaHtml(preview, draft.assignments)
    : `<div class="meta">Отметьте команду, чтобы увидеть расчёт даты реализации</div>`;

  const teamRows = state.teams
    .map((t) => {
      const on = selected.has(t.id);
      const sz = sizeMap.get(t.id) ?? "M";
      const start = startMap.get(t.id) ?? state.startDate;
      return `
        <div class="team-assign-row${on ? " is-on" : ""}">
          <label class="team-assign-pick">
            <input type="checkbox" class="f_team_check" data-team="${t.id}" ${on ? "checked" : ""} />
            <span class="team-dot" style="background:${t.color}" aria-hidden="true"></span>
            <span class="team-assign-name">${escapeHtml(t.name)}</span>
          </label>
          <div class="team-assign-field">
            <select class="f_team_size" data-team="${t.id}" ${on ? "" : "disabled"} aria-label="Маечная оценка">${sizeSelectOptions(sz)}</select>
          </div>
          <div class="team-assign-field">
            <input type="date" class="f_team_start" data-team="${t.id}" value="${start}" ${on ? "" : "disabled"} aria-label="Старт работы" />
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="modal-backdrop" id="modal">
      <div class="modal modal-wide">
        <div class="modal-head">
          <h3>${item ? "Карточка функциональности" : "Новая функциональность"}</h3>
          <div class="modal-head-actions">
            <button class="btn" id="closeModal2">Отмена</button>
            <button class="btn btn-ghost" id="closeModal">Закрыть</button>
            <button class="btn btn-primary" id="saveItem">Сохранить</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="modal-section modal-meta-fields">
            <div class="modal-section-title">Основные данные</div>
            <p class="meta modal-entity-hint">Функциональность — задачи → бизнес-результат с эффектом; живёт в продукте или проекте.</p>
            <div class="field">
              <label>Функциональность</label>
              <input id="f_title" value="${escapeAttr(draft.title)}" />
            </div>
            <div class="grid-2">
              <div class="field">
                <label>Тип</label>
                <select id="f_type">
                  <option value="product" ${draft.type === "product" ? "selected" : ""}>Продукт</option>
                  <option value="project" ${draft.type === "project" ? "selected" : ""}>Проект</option>
                </select>
              </div>
              <div class="field">
                <label>Название проекта / продукта</label>
                ${catalogSelectHtml(
                  "f_backlog",
                  backlogNamesForType(draft.type),
                  productProjectName(draft.backlog) || draft.backlog
                )}
                <div class="meta">Список из существующих проектов и продуктов в Реестре.</div>
              </div>
              <div class="field">
                <label>Статус</label>
                <select id="f_status">
                  ${ITEM_STATUSES.map(
                      (s) =>
                        `<option value="${s}" ${draft.status === s ? "selected" : ""}>${statusLabel(s)}</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="field">
                <label>Заказчик</label>
                ${catalogSelectHtml("f_owner", state.customers, draft.owner)}
              </div>
              <div class="field">
                <label>Исполнитель</label>
                ${catalogSelectHtml("f_assignee", state.executors, draft.assignee)}
              </div>
            </div>
            <div class="grid-2 finance-row">
              <div class="field">
                <label>ЧП (12 мес., млрд ₽)</label>
                <input id="f_cashFlow12m" type="number" step="0.1" inputmode="decimal" placeholder="напр. 1,2" title="Чистая прибыль за 12 мес. в млрд ₽" value="${draft.cashFlow12m == null ? "" : draft.cashFlow12m}" />
              </div>
              <div class="field">
                <label>ROI (12 мес., %)</label>
                <input id="f_roi12m" type="number" step="0.1" inputmode="decimal" placeholder="напр. 15" title="ROI за 12 мес. в процентах (15 = 15%)" value="${draft.roi12m == null ? "" : draft.roi12m}" />
              </div>
            </div>
          </div>
          <div class="modal-section modal-teams-block">
            <div class="field">
              <label>Команды: маечная оценка и дата старта (отдельно по каждой)</label>
              <div class="team-assign-list" id="teamAssignList">
                <div class="team-assign-head" aria-hidden="true">
                  <span class="team-assign-pick">Команда</span>
                  <span class="team-assign-field">Маечная оценка</span>
                  <span class="team-assign-field">Старт работы</span>
                </div>
                ${teamRows}
              </div>
              <div class="meta">${sizeRangesSummary(szRanges())}. Итого ~<strong class="mono" id="liveTotalEst">${totalEstimateWeeks(draft, szRanges())}</strong> чел·нед. Старт — не раньше указанной даты; если очередь занята, сдвинется позже.</div>
            </div>
          </div>
          <details class="callout modal-section live-eta-details" id="liveEtaBox">
            <summary class="live-eta-summary">
              <strong>Расчёт даты завершения</strong>
              <span class="eta-final mono live-eta-summary-date" id="liveEtaSummaryDate">${preview ? formatDate(preview.endDate) : ""}</span>
            </summary>
            <div id="liveEta" class="live-eta-body">${previewHtml}</div>
          </details>
          <div class="modal-section modal-rice-block">
            <div class="modal-section-title">Приоритизация RICE</div>
            <div class="score-grid">
              <div class="score-box"><div class="k">Охват</div><div class="v"><input id="f_reach" type="number" min="0" step="1" value="${draft.reach}" title="Пользователей / период" style="width:72px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
              <div class="score-box"><div class="k">Влияние</div><div class="v"><select id="f_impact" title="Сила эффекта" style="width:auto;text-align:center;border:none;background:transparent;font:inherit;font-weight:700">${RICE_IMPACT_OPTIONS.map(
                (v) =>
                  `<option value="${v}" ${draft.impact === v ? "selected" : ""}>${v} · ${RICE_IMPACT_LABELS[v]}</option>`
              ).join("")}</select></div></div>
              <div class="score-box"><div class="k">Уверенность, %</div><div class="v"><input id="f_conf" type="number" min="0" max="100" step="5" value="${confPct}" title="0–100%" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
              <div class="score-box"><div class="k">Трудозатраты</div><div class="v mono" id="liveEffort" title="Сумма чел·нед по маечной оценке">${effort}</div></div>
            </div>
            <div class="callout rice-formula">RICE = (Охват × Влияние × Уверенность) / Трудозатраты → <strong class="mono" id="liveRice">${score}</strong></div>
            <div class="grid-2">
              <div class="field">
                <label>Приоритет (уникальный, 1 = выше)</label>
                <input id="f_rank" type="number" min="1" step="1" value="${draft.manualRank ?? nextPriority(state.items)}" />
                <div class="meta">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
              </div>
              <div class="field">
                <label>Заметки</label>
                <textarea id="f_notes">${escapeHtml(draft.notes ?? "")}</textarea>
              </div>
            </div>
          </div>
        </div>
        ${item && currentCan("portfolio.delete") ? `<div class="modal-foot">
          <button class="btn" id="deleteItem" style="color:var(--bad)">Удалить</button>
        </div>` : ""}
      </div>
    </div>
  `;
}

function previewScheduleFor(draft: WorkItem): ItemSchedule | null {
  const assignments = draft.assignments.length
    ? draft.assignments
    : readAssignments();
  if (!assignments.length) return null;
  const id = draft.id || "__draft__";
  const item: WorkItem = { ...draft, id, assignments };
  const items = state.items.some((i) => i.id === id)
    ? state.items.map((i) => (i.id === id ? item : i))
    : [...state.items, item];
  const { rollups } = scheduleState({ ...state, items });
  return rollups.find((r) => r.item.id === id) ?? null;
}

/** ETA from plan+estimate only (no other backlog items stealing capacity) */
function planOnlyEnd(a: TeamAssignment): { start: string; end: string; weeks: number } {
  const team = teamById(a.teamId);
  const cap = team?.capacityPw || 1;
  const estimatePw = assignmentPlanWeeks(a, szRanges());
  const weeks = Math.round((estimatePw / cap) * 100) / 100;
  const start = snapToMonday(a.workStartDate || state.startDate);
  const end = addDays(start, weeks * 7);
  return { start, end, weeks };
}

function formatLiveEtaHtml(
  preview: ItemSchedule,
  assignments: TeamAssignment[]
): string {
  const planByTeam = new Map(assignments.map((a) => [a.teamId, a]));
  const lines = preview.slices
    .map((s) => {
      const t = teamById(s.teamId);
      const assign = planByTeam.get(s.teamId);
      const plan = assign
        ? snapToMonday(assign.workStartDate)
        : s.plannedStartDate;
      const solo = assign ? planOnlyEnd(assign) : null;
      const crit =
        s.teamId === preview.bottleneckTeamId
          ? ' <span class="meta">← критический путь</span>'
          : "";
      const shiftNote =
        s.startDate > plan
          ? ` <span class="meta">(план ${formatDate(plan)}, очередь сдвинула на ${formatDate(s.startDate)})</span>`
          : s.startDate < plan
            ? ` <span class="meta">(ждём план ${formatDate(plan)})</span>`
            : "";
      const soloNote = solo
        ? `<div class="meta" style="margin-left:0;margin-top:2px">от вашей даты старта без чужой очереди: ${formatDate(solo.start)} → <span class="mono">${formatDate(solo.end)}</span></div>`
        : "";
      return `<div style="margin-bottom:8px"><strong>${escapeHtml(t?.name ?? s.teamId)}</strong>: <span class="mono">${formatDate(s.startDate)} → ${formatDate(s.endDate)}</span> <span class="meta">(${s.size} · ${s.estimatePw} чел·нед ≈ ${s.durationWeeks} нед.)</span>${shiftNote}${crit}${soloNote}</div>`;
    })
    .join("");

  const planOnlyMax = assignments
    .map((a) => planOnlyEnd(a).end)
    .reduce((a, b) => (a > b ? a : b), "0000-00-00");

  const modeNote =
    activeScheduleMode() === "manual"
      ? `Дата завершения по заданным стартам = <span class="eta-final mono">${formatDate(preview.endDate)}</span>`
      : `Дата завершения с учётом очереди команды = <span class="eta-final mono">${formatDate(preview.endDate)}</span>`;

  return (
    lines +
    `<div class="eta-final-line">${modeNote}</div>` +
    `<div class="meta">Дата завершения только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${formatDate(planOnlyMax)}</strong> — меняется сразу при смене даты</div>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** ЧП in млрд ₽; null/empty → em dash. E.g. 1.2 → «1,2» */
function formatMlrd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

/** ROI as percent; null/empty → em dash. E.g. 15 → «15%» */
function formatPercent(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const s = n.toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
  return `${s}%`;
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replaceAll("'", "&#39;");
}

function closeAppPop() {
  const teardown = activeConfirmTeardown;
  activeConfirmTeardown = null;
  teardown?.();
  document
    .querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask")
    .forEach((el) => {
      el.classList.remove("prio-ask");
    });
  document
    .querySelectorAll(".confirm-ask, .gantt-bar-confirm, .prio-row-confirm")
    .forEach((el) => {
      el.classList.remove("confirm-ask", "gantt-bar-confirm", "prio-row-confirm");
    });
  document.querySelector("#appConfirmPop")?.remove();
  closeTeamColorPop();
}

function closePrioPop() {
  closeAppPop();
}

function closeOverloadPop() {
  if (overloadHoverTimer != null) {
    window.clearTimeout(overloadHoverTimer);
    overloadHoverTimer = null;
  }
  overloadPinned = false;
  document.querySelectorAll(".overload-ask").forEach((el) => {
    el.classList.remove("overload-ask");
  });
  document.querySelector("#overloadExplainPop")?.remove();
}

function overloadWeekLabel(week: number): string {
  const monday = addWeeks(state.startDate, week);
  return `Н${week + 1} (${formatDate(monday)})`;
}

function overloadExplainBodyHtml(
  team: Team,
  week: number,
  slot: TeamLoadWeek | undefined
): string {
  const used = slot?.usedPw ?? 0;
  const cap = slot?.capacityPw ?? team.capacityPw;
  const items = slot?.items ?? [];
  const itemList =
    items.length > 0
      ? `<ul class="overload-items">${items
          .map(
            (it) =>
              `<li><span class="overload-item-title">${escapeHtml(it.title)}</span> <span class="meta mono">${it.contributionPw.toFixed(1)} чел·нед</span></li>`
          )
          .join("")}</ul>`
      : `<p class="meta">Нет детализации функциональностей за эту неделю.</p>`;

  return `
    <div class="overload-pop-head">
      <span class="team-dot" style="background:${team.color}"></span>
      <strong>${escapeHtml(team.name)}</strong>
    </div>
    <div class="meta">${overloadWeekLabel(week)}</div>
    <div class="overload-load mono">Загрузка <strong>${used.toFixed(1)}</strong> / ${cap} чел·нед</div>
    <p class="overload-why">По расписанию (те же интервалы, что полоски Gantt) спрос команды на этой неделе превышает ёмкость (${cap} чел·нед/нед).</p>
    <div class="overload-contrib-label meta">Вклад функциональностей</div>
    ${itemList}
  `;
}

function overloadAxisBodyHtml(week: number): string {
  const teams = state.teams.filter((t) => lastOverflowByTeam[t.id]?.has(week));
  if (!teams.length) {
    return `<p class="meta">На ${overloadWeekLabel(week)} перегруза нет.</p>`;
  }
  const rows = teams
    .map((team) => {
      const slot = lastScheduledLoad[team.id]?.[week];
      const used = slot?.usedPw ?? 0;
      const cap = slot?.capacityPw ?? team.capacityPw;
      const top = (slot?.items ?? [])
        .slice(0, 3)
        .map((it) => escapeHtml(it.title))
        .join(", ");
      return `
        <div class="overload-axis-row">
          <div class="overload-pop-head">
            <span class="team-dot" style="background:${team.color}"></span>
            <strong>${escapeHtml(team.name)}</strong>
            <span class="mono">${used.toFixed(1)}/${cap}</span>
          </div>
          ${top ? `<div class="meta">${top}${(slot?.items.length ?? 0) > 3 ? "…" : ""}</div>` : ""}
        </div>`;
    })
    .join("");

  return `
    <div class="meta">${overloadWeekLabel(week)}</div>
    <p class="overload-why">На этой неделе загрузка по расписанию превышает ёмкость у ${teams.length}&nbsp;${
      teams.length === 1 ? "команды" : "команд"
    }.</p>
    ${rows}
  `;
}

function placeOverloadPop(anchor: HTMLElement, pop: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  let left = rect.left + rect.width / 2 - popRect.width / 2;
  let top = rect.bottom + 8;
  if (left < 8) left = 8;
  if (left + popRect.width > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - popRect.width - 8);
  }
  if (top + popRect.height > window.innerHeight - 8) {
    top = Math.max(8, rect.top - popRect.height - 8);
  }
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
}

function showOverloadExplain(
  anchor: HTMLElement,
  opts: { teamId?: string; week: number; pin?: boolean }
) {
  const week = opts.week;
  const teamId = opts.teamId;
  const body =
    teamId != null
      ? (() => {
          const team = teamById(teamId);
          if (!team) return null;
          return overloadExplainBodyHtml(
            team,
            week,
            lastScheduledLoad[teamId]?.[week]
          );
        })()
      : overloadAxisBodyHtml(week);
  if (body == null) return;

  closeOverloadPop();
  if (opts.pin) overloadPinned = true;
  anchor.classList.add("overload-ask");

  const pop = document.createElement("div");
  pop.id = "overloadExplainPop";
  pop.className = "overload-explain-pop";
  pop.setAttribute("data-stop-edit", "");
  pop.innerHTML = `
    <div class="overload-explain-body">${body}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn btn-primary" data-overload-close>Понятно</button>
    </div>
  `;
  document.body.appendChild(pop);
  placeOverloadPop(anchor, pop);

  const onScroll = () => placeOverloadPop(anchor, pop);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);

  const cleanup = () => {
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onScroll);
    document.removeEventListener("mousedown", onDoc, true);
    window.removeEventListener("keydown", onKey);
  };

  const dismiss = () => {
    cleanup();
    closeOverloadPop();
  };

  const onDoc = (e: MouseEvent) => {
    const t = e.target as Node;
    if (pop.contains(t) || anchor.contains(t)) return;
    dismiss();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") dismiss();
  };

  document.addEventListener("mousedown", onDoc, true);
  window.addEventListener("keydown", onKey);
  pop.querySelector("[data-overload-close]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dismiss();
  });

  pop.addEventListener("mouseenter", () => {
    if (overloadHoverTimer != null) {
      window.clearTimeout(overloadHoverTimer);
      overloadHoverTimer = null;
    }
  });
  pop.addEventListener("mouseleave", () => {
    if (overloadPinned) return;
    overloadHoverTimer = window.setTimeout(() => dismiss(), 180);
  });
}

let planConflictTipOpen: { mark: HTMLElement; tip: HTMLElement } | null =
  null;
let planConflictTipDismissBound = false;

function hideOpenPlanConflictTip() {
  if (!planConflictTipOpen) return;
  const { mark, tip } = planConflictTipOpen;
  clearPlanConflictTip(mark, tip);
}

function ensurePlanConflictTipDismissListeners() {
  if (planConflictTipDismissBound) return;
  planConflictTipDismissBound = true;
  // Capture scroll from nested overflow containers (plan board, etc.).
  window.addEventListener("scroll", hideOpenPlanConflictTip, true);
  window.addEventListener("resize", hideOpenPlanConflictTip);
}

/**
 * Position conflict tip with position:fixed so overflow:hidden / sticky
 * ancestors cannot clip it. Prefer the side with more viewport room
 * (sticky week headers usually open below into the grid), then clamp.
 */
function placePlanConflictTip(mark: HTMLElement, tip: HTMLElement) {
  const margin = 8;
  const gap = 8;

  tip.classList.add("is-fixed");
  tip.style.left = "0px";
  tip.style.top = "0px";
  tip.style.right = "auto";
  tip.style.bottom = "auto";
  tip.style.maxHeight = "";
  tip.style.overflowY = "";
  // Open before measuring so visibility/opacity don't zero out the box.
  mark.classList.add("is-tip-open");

  const markRect = mark.getBoundingClientRect();
  let tipRect = tip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxH = Math.max(48, vh - margin * 2);
  if (tipRect.height > maxH) {
    tip.style.maxHeight = `${maxH}px`;
    tip.style.overflowY = "auto";
    tipRect = tip.getBoundingClientRect();
  }

  let left = markRect.left + markRect.width / 2 - tipRect.width / 2;
  left = Math.max(margin, Math.min(left, vw - tipRect.width - margin));

  const spaceAbove = markRect.top - margin;
  const spaceBelow = vh - markRect.bottom - margin;
  const need = tipRect.height + gap;
  const belowFits = spaceBelow >= need;
  const aboveFits = spaceAbove >= need;

  let top: number;
  // Prefer below when it fits and has at least as much room (sticky axis).
  if (belowFits && (!aboveFits || spaceBelow >= spaceAbove)) {
    top = markRect.bottom + gap;
  } else if (aboveFits) {
    top = markRect.top - tipRect.height - gap;
  } else if (spaceBelow >= spaceAbove) {
    top = Math.max(
      margin,
      Math.min(markRect.bottom + gap, vh - tipRect.height - margin)
    );
  } else {
    top = Math.max(margin, markRect.top - tipRect.height - gap);
  }

  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
  planConflictTipOpen = { mark, tip };
  ensurePlanConflictTipDismissListeners();
}

function clearPlanConflictTip(mark: HTMLElement, tip: HTMLElement) {
  mark.classList.remove("is-tip-open");
  tip.classList.remove("is-fixed");
  tip.style.left = "";
  tip.style.top = "";
  tip.style.right = "";
  tip.style.bottom = "";
  tip.style.maxHeight = "";
  tip.style.overflowY = "";
  if (planConflictTipOpen?.mark === mark) planConflictTipOpen = null;
}

function bindPlanConflictTips() {
  hideOpenPlanConflictTip();
  document
    .querySelectorAll<HTMLElement>(
      ".plan-conflict-mark, .plan-axis-tick.is-conflict-week"
    )
    .forEach((mark) => {
      const tip = mark.querySelector<HTMLElement>(".plan-conflict-tip");
      if (!tip) return;
      const show = () => placePlanConflictTip(mark, tip);
      const hide = () => clearPlanConflictTip(mark, tip);
      mark.addEventListener("mouseenter", show);
      mark.addEventListener("mouseleave", hide);
      mark.addEventListener("focus", show);
      mark.addEventListener("blur", hide);
    });
}

function bindOverloadExplain() {
  const openFromEl = (el: HTMLElement, pin: boolean) => {
    const weekRaw = el.dataset.overloadWeek;
    if (weekRaw == null || weekRaw === "") return;
    const week = Number(weekRaw);
    if (!Number.isFinite(week)) return;
    const teamId = el.dataset.overloadTeam;
    showOverloadExplain(el, {
      week,
      teamId: teamId || undefined,
      pin,
    });
  };

  document
    .querySelectorAll<HTMLElement>("[data-overload-week]")
    .forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openFromEl(el, true);
      });
      el.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        openFromEl(el, true);
      });
      el.addEventListener("mouseenter", () => {
        if (overloadPinned) return;
        if (overloadHoverTimer != null) {
          window.clearTimeout(overloadHoverTimer);
          overloadHoverTimer = null;
        }
        openFromEl(el, false);
      });
      el.addEventListener("mouseleave", () => {
        if (overloadPinned) return;
        overloadHoverTimer = window.setTimeout(() => {
          const pop = document.querySelector("#overloadExplainPop");
          if (pop?.matches(":hover")) return;
          closeOverloadPop();
        }, 180);
      });
    });
}

function confirmPopHtml(
  textHtml: string,
  labels?: { yes?: string; no?: string }
): string {
  const no = labels?.no ?? "Нет";
  const yes = labels?.yes ?? "Да";
  return `
    <div class="prio-confirm-text">${textHtml}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-confirm-no>${escapeHtml(no)}</button>
      <button type="button" class="btn btn-primary" data-confirm-yes>${escapeHtml(yes)}</button>
    </div>
  `;
}

function askAppConfirm(
  anchor: HTMLElement,
  textHtml: string,
  onYes: () => void,
  onNo: () => void = () => undefined,
  opts?: {
    anchorClass?: string;
    wide?: boolean;
    yesLabel?: string;
    noLabel?: string;
  }
) {
  closeAppPop();
  anchor.classList.add(opts?.anchorClass ?? "confirm-ask");

  const pop = document.createElement("div");
  pop.id = "appConfirmPop";
  pop.className = `prio-confirm prio-confirm-float${opts?.wide ? " prio-confirm-wide" : ""}`;
  pop.setAttribute("data-stop-edit", "");
  pop.innerHTML = confirmPopHtml(textHtml, {
    yes: opts?.yesLabel,
    no: opts?.noLabel,
  });
  document.body.appendChild(pop);

  const place = () => {
    const rect = anchor.getBoundingClientRect();
    const popRect = pop.getBoundingClientRect();
    let left = rect.right + 8;
    let top = rect.top + rect.height / 2 - popRect.height / 2;
    if (left + popRect.width > window.innerWidth - 8) {
      left = Math.max(8, rect.left - popRect.width - 8);
    }
    top = Math.max(8, Math.min(top, window.innerHeight - popRect.height - 8));
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  };
  place();

  let settled = false;
  const onScroll = () => place();
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    finishNo();
  };
  const onDoc = (e: MouseEvent) => {
    const t = e.target as Node;
    if (pop.contains(t) || anchor.contains(t)) return;
    finishNo();
  };

  const removeConfirmListeners = () => {
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onScroll);
    window.removeEventListener("keydown", onKey, true);
    document.removeEventListener("mousedown", onDoc, true);
  };
  /** Drop listeners; if dialog was replaced/closed unsettled, run onNo (clears confirming). */
  activeConfirmTeardown = () => {
    removeConfirmListeners();
    if (settled) return;
    settled = true;
    onNo();
  };

  const finishNo = () => {
    if (settled) return;
    settled = true;
    activeConfirmTeardown = null;
    removeConfirmListeners();
    closeAppPop();
    onNo();
  };
  const finishYes = () => {
    if (settled) return;
    settled = true;
    activeConfirmTeardown = null;
    removeConfirmListeners();
    closeAppPop();
    onYes();
  };

  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);
  window.addEventListener("keydown", onKey, true);
  document.addEventListener("mousedown", onDoc, true);

  pop.querySelector("[data-confirm-yes]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    finishYes();
  });
  pop.querySelector("[data-confirm-no]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    finishNo();
  });
}

function countTeamUsage(teamId: string): number {
  return state.items.filter((i) =>
    i.assignments.some((a) => a.teamId === teamId)
  ).length;
}

function removeTeam(teamId: string) {
  const team = teamById(teamId);
  const name = team?.name ?? teamId;
  state.teams = state.teams.filter((t) => t.id !== teamId);
  state.items = state.items
    .map((item) => ({
      ...item,
      assignments: item.assignments.filter((a) => a.teamId !== teamId),
    }))
    .filter((item) => item.assignments.length > 0);
  if (ui.teamFilter === teamId) ui.teamFilter = "all";
  logChange(`Удалена команда «${name}»`, "team");
  persist();
}

function confirmDeleteTeam(teamId: string, anchor: HTMLElement) {
  const team = teamById(teamId);
  if (!team) return;
  if (state.teams.length <= 1) {
    askAppConfirm(
      anchor,
      "Нельзя удалить последнюю команду.",
      () => undefined,
      () => undefined,
      { wide: true }
    );
    return;
  }
  const n = countTeamUsage(teamId);
  const text =
    n > 0
      ? `Удалить «<strong>${escapeHtml(team.name)}</strong>»?<br/>Снимется с <span class="accent">${n}</span> функциональностей. Карточки без команд тоже удалятся.`
      : `Удалить «<strong>${escapeHtml(team.name)}</strong>»?`;
  askAppConfirm(anchor, text, () => removeTeam(teamId), () => undefined, {
    wide: true,
  });
}

function askPrioConfirm(
  anchor: HTMLElement,
  textHtml: string,
  onYes: () => void,
  onNo: () => void
) {
  askAppConfirm(anchor, textHtml, onYes, onNo, { anchorClass: "prio-ask" });
}

/** Row drag only when sorted by priority — other sorts never rewrite ranks */
function bindPortfolioDrag() {
  if (!currentCan("portfolio.edit")) return;
  if (ui.sortKey !== "priority") return;
  const body = document.querySelector("#portfolioBody");
  if (!body) return;

  let dragId: string | null = null;
  let activePointer: number | null = null;
  let pendingRestore: (() => void) | null = null;

  const clearMarks = () => {
    body
      .querySelectorAll(".is-dragging, .drag-over")
      .forEach((el) => el.classList.remove("is-dragging", "drag-over"));
  };

  const abortPendingConfirm = () => {
    if (!pendingRestore) return;
    const restore = pendingRestore;
    pendingRestore = null;
    closeAppPop();
    restore();
  };

  const applyDomOrder = (order: string[]) => {
    for (const id of order) {
      const row = body.querySelector(`tr[data-row-id="${CSS.escape(id)}"]`);
      if (row) body.appendChild(row);
    }
  };

  const applyPrioInputs = (items: typeof state.items) => {
    for (const it of items) {
      const input = body.querySelector<HTMLInputElement>(
        `.prio-input[data-prio-id="${CSS.escape(it.id)}"]`
      );
      if (input && it.manualRank != null) input.value = String(it.manualRank);
    }
  };

  const requestReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = Array.from(
      body.querySelectorAll<HTMLTableRowElement>("tr[data-row-id]")
    ).map((r) => r.dataset.rowId!);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0 || from === to) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, fromId);
    if (next.every((id, i) => id === ids[i])) return;

    const orderForRanks =
      ui.sortDir === "asc" ? next : [...next].reverse();
    const nextItems = reorderVisiblePriority(
      state.items,
      orderForRanks,
      szRanges()
    );
    const anyChange = state.items.some((i) => {
      const n = nextItems.find((x) => x.id === i.id);
      return n != null && n.manualRank !== i.manualRank;
    });
    if (!anyChange) return;

    const moved = state.items.find((i) => i.id === fromId);
    const nextMoved = nextItems.find((i) => i.id === fromId);
    const fromRow = body.querySelector<HTMLTableRowElement>(
      `tr[data-row-id="${CSS.escape(fromId)}"]`
    );
    if (!moved || !nextMoved || !fromRow) return;

    abortPendingConfirm();

    applyDomOrder(next);
    applyPrioInputs(nextItems);

    const restoreVisual = () => {
      applyDomOrder(ids);
      applyPrioInputs(state.items);
      fromRow.classList.remove("prio-row-confirm");
    };

    pendingRestore = restoreVisual;
    fromRow.classList.add("prio-row-confirm");

    const oldRank = moved.manualRank ?? "—";
    const newRank = nextMoved.manualRank ?? "—";
    const shifted = state.items
      .filter((i) => i.id !== fromId)
      .map((i) => {
        const n = nextItems.find((x) => x.id === i.id);
        if (!n || n.manualRank === i.manualRank) return null;
        return `#${i.manualRank ?? "—"}→#${n.manualRank ?? "—"} «${escapeHtml(i.title)}»`;
      })
      .filter((x): x is string => Boolean(x));
    const shiftNote =
      shifted.length > 0
        ? `<br/><span class="meta">Сдвинутся: ${shifted.slice(0, 4).join("; ")}${
            shifted.length > 4 ? ` и ещё ${shifted.length - 4}` : ""
          }</span>`
        : "";
    const text = `Изменить приоритет «<strong>${escapeHtml(moved.title)}</strong>»?<br/>
<span class="accent">#${oldRank}</span> → <span class="accent">#${newRank}</span>${shiftNote}`;

    askAppConfirm(
      fromRow,
      text,
      () => {
        pendingRestore = null;
        state.items = nextItems;
        ui.sortKey = "priority";
        logChange(
          `Приоритет «${moved.title}»: #${oldRank} → #${newRank}`,
          "priority"
        );
        persist();
      },
      () => {
        pendingRestore = null;
        restoreVisual();
      },
      {
        wide: true,
        anchorClass: "prio-row-confirm",
        yesLabel: "ОК",
        noLabel: "Отмена",
      }
    );
  };

  body.querySelectorAll<HTMLElement>("[data-drag-handle]").forEach((handle) => {
    const row = handle.closest<HTMLTableRowElement>("tr[data-row-id]");
    if (!row) return;

    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      abortPendingConfirm();
      dragId = row.dataset.rowId ?? null;
      activePointer = e.pointerId;
      handle.setPointerCapture(e.pointerId);
      clearMarks();
      row.classList.add("is-dragging");
      document.body.classList.add("prio-dragging");
    });

    handle.addEventListener("pointermove", (e) => {
      if (dragId == null || e.pointerId !== activePointer) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const over = el?.closest<HTMLTableRowElement>("tr[data-row-id]");
      body
        .querySelectorAll(".drag-over")
        .forEach((r) => r.classList.remove("drag-over"));
      if (over && over.dataset.rowId !== dragId) over.classList.add("drag-over");
    });

    const endDrag = (e: PointerEvent) => {
      if (dragId == null || e.pointerId !== activePointer) return;
      const fromId = dragId;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const over = el?.closest<HTMLTableRowElement>("tr[data-row-id]");
      const toId = over?.dataset.rowId;
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      clearMarks();
      document.body.classList.remove("prio-dragging");
      dragId = null;
      activePointer = null;
      if (toId) requestReorder(fromId, toId);
    };

    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
  });
}

function brandMarkSrc(): string {
  const base = import.meta.env.BASE_URL || "./";
  return new URL("vi-mark.png", new URL(base, window.location.href)).href;
}

/**
 * Navigation only — this bundle is always v2 and never shares localStorage
 * or cloud rows with the frozen `/v1/` build.
 */
function editionSwitcherHtml(): string {
  const base = import.meta.env.BASE_URL || "./";
  const v1Href = new URL("v1/", new URL(base, window.location.href)).pathname;
  const v2Href = base.endsWith("/") ? base : `${base}/`;
  return `<nav class="edition-switch no-print" aria-label="Версия интерфейса">
    <a class="edition-switch-btn" href="${v1Href}" data-edition="v1">v1</a>
    <a class="edition-switch-btn is-on" href="${v2Href}" data-edition="v2" aria-current="page">v2</a>
  </nav>`;
}

function render() {
  closePrioPop();
  closeColPickerOutside();
  closeOverloadPop();
  ensureVisibleTab();
  applyComputedTeamCapacities(state.teams);
  const { slices, rollups, load } = scheduleState();
  const overflowByTeam = scheduledOverloadWeeks(load);
  lastScheduledLoad = load;
  lastOverflowByTeam = overflowByTeam;
  const root = document.querySelector("#app");
  if (!root) return;

  const editing =
    ui.editingId != null
      ? state.items.find((i) => i.id === ui.editingId) ?? null
      : null;

  root.innerHTML = `
    <div class="app-shell">
      <div class="topbar">
        <div class="topbar-brand">
          <button type="button" class="brand-home" id="brandHomeBtn" title="На главную">
            <span class="brand-mark" aria-hidden="true">
              <img class="brand-mark-img" src="${brandMarkSrc()}" alt="" width="30" height="30" />
            </span>
            <span class="brand-word">VI Planer</span>
          </button>
        </div>
        <div class="top-actions">
          ${currentUserSwitcherHtml()}
          ${editionSwitcherHtml()}
          <span class="release-stamp" title="Дата релиза">updated ${RELEASE_UPDATED}</span>
          <span class="sync-badge" id="syncStatus" data-status="${getSyncStatus()}">${syncStatusLabel(getSyncStatus())}</span>
          <button class="btn" id="exportPdfBtn">${ui.tab === "timeline" ? "Экспорт Ганта" : "Экспорт PDF"}</button>
        </div>
        <p class="subtitle">
          Единый портфель проектов и продуктов: сквозной RICE, несколько команд на функциональность
          со своими оценками и датой реализации (bottleneck).
        </p>
      </div>
      <div id="pdfCapture">
      <div class="print-only print-doc-header" id="pdfDocHeader">
        <h1>VI Planer — ${TAB_LABELS[ui.tab]}</h1>
        <p>Старт портфеля: ${state.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      <div class="tabs no-print">
        ${tabButtonHtml("portfolio")}
        ${tabButtonHtml("demand")}
        ${tabButtonHtml("planning")}
        ${tabButtonHtml("timeline")}
        ${tabButtonHtml("demoA")}
        ${tabButtonHtml("queuesTest")}
        ${tabButtonHtml("capacity", "tab-end")}
        ${tabButtonHtml("changelog")}
        ${tabButtonHtml("settings")}
      </div>
      ${ui.tab === "portfolio" ? metricsHtml(rollups, slices) : ""}
      <div class="tab-print-root" id="tabPrintRoot">
      ${tabContentHtml(rollups, slices, load, overflowByTeam)}
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <a class="req-dl-btn" id="downloadPresBtn" href="#" title="Скачать презентацию (PDF)">Презентация PDF</a>
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования (PDF)">Требования PDF (BR / UC / FR / NFR)</button>
    </div>
    ${ui.creating || editing ? editorHtml(editing) : ""}
    ${ui.creatingProject || ui.editingProjectKey ? projectCardHtml() : ""}
  `;

  bind();
}

function readAssignments(): TeamAssignment[] {
  const checks = Array.from(
    document.querySelectorAll<HTMLInputElement>(".f_team_check")
  );
  const current = ui.editingId
    ? state.items.find((i) => i.id === ui.editingId)
    : null;
  const assignments: TeamAssignment[] = [];
  for (const check of checks) {
    if (!check.checked) continue;
    const teamId = check.dataset.team!;
    const sizeInput = document.querySelector<HTMLSelectElement>(
      `.f_team_size[data-team="${teamId}"]`
    );
    const startInput = document.querySelector<HTMLInputElement>(
      `.f_team_start[data-team="${teamId}"]`
    );
    const size = parseSize(sizeInput?.value);
    const workStartDate = snapToMonday(
      startInput?.value || state.startDate
    );
    const existing = current?.assignments.find((a) => a.teamId === teamId);
    const next: TeamAssignment = { teamId, size, workStartDate };
    if (existing?.days != null) {
      next.days =
        existing.size === size
          ? existing.days
          : Math.round(sizePlanDays(size, szRanges()));
    }
    if (existing?.demandStatus) next.demandStatus = existing.demandStatus;
    const team = teamById(teamId);
    next.roles = existing?.roles ?? teamAssignmentRoles(team);
    assignments.push(fillTeamDemandRoles(next, team));
  }
  return assignments;
}

function refreshLiveEta() {
  const liveEst = document.querySelector("#liveTotalEst");
  const liveEta = document.querySelector("#liveEta");
  const liveEtaSummaryDate = document.querySelector("#liveEtaSummaryDate");
  const assignments = readAssignments();
  if (liveEst) {
    liveEst.textContent = String(
      assignments.reduce((s, a) => s + assignmentPlanWeeks(a, szRanges()), 0) || 0
    );
  }
  if (!liveEta) return;
  if (!assignments.length) {
    liveEta.innerHTML =
      '<div class="meta">Отметьте команду, чтобы увидеть расчёт даты реализации</div>';
    if (liveEtaSummaryDate) liveEtaSummaryDate.textContent = "";
    return;
  }
  const base =
    (ui.editingId
      ? state.items.find((i) => i.id === ui.editingId)
      : null) ??
    ({
      id: "__draft__",
      title: "Черновик",
      type: "product",
      backlog: "",
      assignments,
      status: "staffing",
      owner: "—",
      assignee: "",
      reach: 100,
      impact: 1,
      confidence: 0.8,
      manualRank: null,
      cashFlow12m: null,
      roi12m: null,
    } satisfies WorkItem);
  const draft: WorkItem = {
    ...base,
    id: ui.editingId || "__draft__",
    assignments,
    title:
      document.querySelector<HTMLInputElement>("#f_title")?.value.trim() ||
      base.title,
    type:
      (document.querySelector<HTMLSelectElement>("#f_type")
        ?.value as ItemType) || base.type,
    status: coerceItemStatus(
      document.querySelector<HTMLSelectElement>("#f_status")?.value,
      base.status
    ),
    reach: Number(
      document.querySelector<HTMLInputElement>("#f_reach")?.value
    ) || base.reach,
    impact: (Number(
      document.querySelector<HTMLSelectElement>("#f_impact")?.value
    ) || base.impact) as RiceImpact,
    confidence: (() => {
      const raw = Number(
        document.querySelector<HTMLInputElement>("#f_conf")?.value
      );
      if (!Number.isFinite(raw)) return base.confidence;
      return Math.min(1, Math.max(0, raw > 1 ? raw / 100 : raw));
    })(),
    manualRank: (() => {
      const raw = document.querySelector<HTMLInputElement>("#f_rank")?.value;
      const n = Math.round(Number(raw));
      return Number.isFinite(n) && n >= 1 ? n : (base.manualRank ?? nextPriority(state.items));
    })(),
  };
  const preview = previewScheduleFor(draft);
  if (!preview) {
    liveEta.innerHTML = '<div class="meta">Нет расчёта</div>';
    if (liveEtaSummaryDate) liveEtaSummaryDate.textContent = "";
    return;
  }
  if (liveEtaSummaryDate) {
    liveEtaSummaryDate.textContent = formatDate(preview.endDate);
  }
  liveEta.innerHTML = formatLiveEtaHtml(preview, assignments);
}

function readForm(): Omit<WorkItem, "id"> | null {
  const num = (id: string, fallback: number) => {
    const el = document.querySelector<HTMLInputElement>(`#${id}`);
    const v = Number(el?.value);
    return Number.isFinite(v) ? v : fallback;
  };
  const val = (id: string) =>
    document.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >(`#${id}`)?.value ?? "";

  const assignments = readAssignments();
  if (!assignments.length) {
    alert("Выберите хотя бы одну команду");
    return null;
  }

  const rankRaw = val("f_rank").trim();
  const priority = Math.max(1, Math.round(Number(rankRaw) || nextPriority(state.items)));
  const type = val("f_type") as ItemType;
  const ownerRaw = val("f_owner").trim();
  const assigneeRaw = val("f_assignee").trim();
  const backlogRaw = val("f_backlog").trim();
  if (ownerRaw && ownerRaw !== "—") {
    state.customers = uniqCatalogNames([...state.customers, ownerRaw]);
  }
  if (assigneeRaw) {
    state.executors = uniqCatalogNames([...state.executors, assigneeRaw]);
  }
  if (backlogRaw) {
    if (type === "project") {
      state.projects = uniqCatalogNames([...state.projects, backlogRaw]);
    } else {
      state.products = uniqCatalogNames([...state.products, backlogRaw]);
    }
  }
  return {
    title: val("f_title").trim() || "Без названия",
    type,
    backlog: backlogRaw,
    assignments,
    status: coerceItemStatus(val("f_status"), "staffing"),
    owner: ownerRaw || "—",
    assignee: assigneeRaw,
    reach: Math.max(0, num("f_reach", 100)),
    impact: parseRiceImpact(num("f_impact", 1), 1),
    confidence: clamp(num("f_conf", 80), 0, 100) / 100,
    notes: val("f_notes").trim(),
    manualRank: priority,
    cashFlow12m: optionalNum("f_cashFlow12m"),
    roi12m: optionalNum("f_roi12m"),
  };
}

function optionalNum(id: string): number | null {
  const el = document.querySelector<HTMLInputElement>(`#${id}`);
  const raw = el?.value?.trim() ?? "";
  if (!raw) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function createDemandFunctionality(rawTitle: string) {
  const title = titleRu(rawTitle.trim());
  const group = demandSelectedGroup();
  if (!title || !group) return false;
  const item: WorkItem = {
    id: uid("item"),
    title,
    type: "project",
    backlog: demandProjectBacklog(group),
    assignments: [],
    status: "staffing",
    owner: "",
    assignee: "",
    reach: 100,
    impact: 1,
    confidence: 0.8,
    notes: "",
    manualRank: nextPriority(state.items),
    cashFlow12m: null,
    roi12m: null,
  };
  state.items.push(item);
  state.items = ensureUniquePriorities(state.items, szRanges());
  delete ui.needCollapsedProjects[group.key];
  delete ui.needCollapsedItems[item.id];
  ui.needCreatingFn = false;
  logChange(`Создана функциональность «${title}»`, "item");
  persist();
  return true;
}

function forgetWorkItemIds(ids: Iterable<string>) {
  state.deletedItemIds = rememberDeletedIds(state.deletedItemIds, ids);
}

function forgetProjectKey(name: string) {
  const key = name.trim();
  if (!key) return;
  state.deletedProjectKeys = rememberDeletedIds(state.deletedProjectKeys, [key]);
}

function deleteDemandFunctionality(itemId: string) {
  const prev = state.items.find((i) => i.id === itemId);
  if (!prev) return;
  state.items = state.items.filter((i) => i.id !== itemId);
  forgetWorkItemIds([itemId]);
  delete ui.needCollapsedItems[itemId];
  if (ui.needItemId === itemId) ui.needItemId = null;
  if (ui.needAddItemId === itemId) ui.needAddItemId = null;
  if (ui.needAddRoleKey?.startsWith(`${itemId}:`)) ui.needAddRoleKey = null;
  logChange(
    `Удалена функциональность «${prev.title}» (#${prev.manualRank ?? "—"})`,
    "item"
  );
  persist();
}

function confirmDeleteDemandFunctionality(itemId: string, anchor: HTMLElement) {
  const item = state.items.find((i) => i.id === itemId);
  if (!item) return;
  askAppConfirm(
    anchor,
    `Удалить функциональность «<strong>${escapeHtml(item.title)}</strong>» и все назначения команд?`,
    () => deleteDemandFunctionality(itemId),
    () => undefined,
    { wide: true, yesLabel: "Удалить", noLabel: "Отмена" }
  );
}

function addDemandTeam(itemId: string, teamId: string) {
  const item = state.items.find((i) => i.id === itemId);
  const team = teamById(teamId);
  if (!item || !team || hasTeam(item, teamId)) return;
  patchDemandItem(itemId, (it) =>
    withDemandTeams(it, [...it.assignments, newDemandAssignment(teamId)])
  );
  ui.needAddItemId = null;
  ui.needAddRoleKey = null;
  logChange(
    `Потребность «${item.title}»: добавлена команда «${team.name}»`,
    "team"
  );
  persist();
}

function addDemandRole(itemId: string, teamId: string, roleName: string) {
  const item = state.items.find((i) => i.id === itemId);
  const team = teamById(teamId);
  const assign = item?.assignments.find((a) => a.teamId === teamId);
  const name = canonicalizeCatalogRole(roleName) ?? roleName.trim();
  if (!item || !assign || !name) return;
  const teamRoles = resolveTeamRoleNames(team);
  if (!teamHasRoleName(teamRoles, name) || assignmentHasRoleName(assign.roles, name)) {
    return;
  }
  const role = makeAssignmentRole(name, szRanges(), {
    workStartDate: assign.workStartDate,
  });
  patchDemandAssignment(itemId, teamId, (a) =>
    fillTeamDemandRoles({ ...a, roles: [...(a.roles ?? []), role] }, team)
  );
  ui.needAddRoleKey = null;
  logChange(
    `Потребность «${item.title}»: ${team?.name ?? teamId} — добавлена роль «${name}»`,
    "team"
  );
  persist();
}

function removeDemandTeam(itemId: string, teamId: string) {
  const item = state.items.find((i) => i.id === itemId);
  const team = teamById(teamId);
  if (!item || !item.assignments.some((a) => a.teamId === teamId)) return;
  patchDemandItem(itemId, (it) =>
    withDemandTeams(
      it,
      it.assignments.filter((a) => a.teamId !== teamId)
    )
  );
  logChange(
    `Потребность «${item.title}»: снята команда «${team?.name ?? teamId}»`,
    "team"
  );
  persist();
}

function patchDemandRole(
  itemId: string,
  teamId: string,
  roleId: string,
  fn: (role: AssignmentRole) => AssignmentRole
) {
  const team = teamById(teamId);
  patchDemandAssignment(itemId, teamId, (a) =>
    fillTeamDemandRoles(
      {
        ...a,
        roles: (a.roles ?? []).map((r) => (r.id === roleId ? fn(r) : r)),
      },
      team
    )
  );
}

function removeDemandRole(itemId: string, teamId: string, roleId: string) {
  const item = state.items.find((i) => i.id === itemId);
  const team = teamById(teamId);
  if (!item) return;
  const assign = item.assignments.find((a) => a.teamId === teamId);
  const role = assign?.roles?.find((r) => r.id === roleId);
  if (!assign || !role) return;
  const nextRoles = (assign.roles ?? []).filter((r) => r.id !== roleId);
  if (!nextRoles.length) {
    patchDemandItem(itemId, (it) =>
      withDemandTeams(
        it,
        it.assignments.filter((a) => a.teamId !== teamId)
      )
    );
    logChange(
      `Потребность «${item.title}»: снята команда «${team?.name ?? teamId}» (последняя роль)`,
      "team"
    );
  } else {
    patchDemandAssignment(itemId, teamId, (a) =>
      fillTeamDemandRoles({ ...a, roles: nextRoles }, team)
    );
    logChange(
      `Потребность «${item.title}»: ${team?.name ?? teamId} — удалена роль «${role.name}»`,
      "team"
    );
  }
  persist();
}

function confirmRemoveDemandRole(
  itemId: string,
  teamId: string,
  roleId: string,
  anchor: HTMLElement
) {
  const item = state.items.find((i) => i.id === itemId);
  const assign = item?.assignments.find((a) => a.teamId === teamId);
  const role = assign?.roles?.find((r) => r.id === roleId);
  const teamName = teamById(teamId)?.name ?? teamId;
  if (!role) return;
  const roleTitle = isArchitectureRole(role)
    ? "Архитектор"
    : titleRu(role.name);
  const text = `Удалить роль «<strong>${escapeHtml(roleTitle)}</strong>» у команды «${escapeHtml(teamName)}»?`;
  askAppConfirm(
    anchor,
    text,
    () => removeDemandRole(itemId, teamId, roleId),
    () => undefined,
    { wide: true, yesLabel: "Удалить", noLabel: "Отмена" }
  );
}

function confirmRemoveDemandTeam(
  itemId: string,
  teamId: string,
  anchor: HTMLElement
) {
  const team = teamById(teamId);
  const name = team?.name ?? teamId;
  askAppConfirm(
    anchor,
    `Удалить команду «<strong>${escapeHtml(name)}</strong>» и все её роли?`,
    () => removeDemandTeam(itemId, teamId),
    () => undefined,
    { wide: true, yesLabel: "Удалить", noLabel: "Отмена" }
  );
}

function patchDemandAssignment(
  itemId: string,
  teamId: string,
  fn: (a: TeamAssignment) => TeamAssignment
) {
  patchDemandItem(itemId, (it) => ({
    ...it,
    assignments: it.assignments.map((a) => (a.teamId === teamId ? fn(a) : a)),
  }));
}

function bindDemandTab() {
  const root = document.querySelector(".need-page");
  if (!root) return;

  root.querySelectorAll<HTMLButtonElement>("[data-need-project-chip]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.needProjectChip ?? "";
      ui.needProjectKey = ui.needProjectKey === key ? null : key;
      ui.needAddItemId = null;
      ui.needAddRoleKey = null;
      ui.needCreatingFn = false;
      render();
    });
  });

  root.querySelectorAll(".need-add-wrap, .need-fn-actions, .need-project-actions").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  root.querySelector<HTMLButtonElement>("[data-need-add-fn]")?.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      ui.needCreatingFn = true;
      ui.needAddItemId = null;
      ui.needAddRoleKey = null;
      render();
    }
  );

  const fnTitleInput = root.querySelector<HTMLInputElement>("#need_fn_title");
  const closeNeedFnModal = () => {
    ui.needCreatingFn = false;
    render();
  };
  const submitNeedFnModal = () => {
    const name = fnTitleInput?.value ?? "";
    if (!name.trim()) {
      fnTitleInput?.focus();
      return;
    }
    createDemandFunctionality(name);
  };
  root.querySelector("#needFnCancel")?.addEventListener("click", closeNeedFnModal);
  root.querySelector("#needFnCreate")?.addEventListener("click", submitNeedFnModal);
  root.querySelector("#needFnModal")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "needFnModal") closeNeedFnModal();
  });
  fnTitleInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitNeedFnModal();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeNeedFnModal();
    }
  });
  fnTitleInput?.focus();

  root.querySelectorAll<HTMLButtonElement>("[data-need-add-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = btn.dataset.needAddOpen ?? null;
      ui.needAddItemId = ui.needAddItemId === itemId ? null : itemId;
      ui.needAddRoleKey = null;
      render();
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = btn.dataset.needAdd;
      const teamId = btn.dataset.team;
      if (!itemId || !teamId) return;
      addDemandTeam(itemId, teamId);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-add-role-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = btn.dataset.needAddRoleOpen;
      const teamId = btn.dataset.team;
      if (!itemId || !teamId) return;
      const key = `${itemId}:${teamId}`;
      ui.needAddRoleKey = ui.needAddRoleKey === key ? null : key;
      ui.needAddItemId = null;
      render();
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-add-role]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = btn.dataset.needAddRole;
      const teamId = btn.dataset.team;
      const roleName = btn.dataset.roleName;
      if (!itemId || !teamId || !roleName) return;
      addDemandRole(itemId, teamId, roleName);
    });
  });

  root.querySelectorAll<HTMLDetailsElement>("[data-need-project]").forEach((el) => {
    el.addEventListener("toggle", () => {
      const key = el.dataset.needProject;
      if (!key) return;
      if (el.open) delete ui.needCollapsedProjects[key];
      else ui.needCollapsedProjects[key] = true;
    });
  });

  root.querySelectorAll<HTMLDetailsElement>("[data-need-fn]").forEach((el) => {
    el.addEventListener("toggle", () => {
      const id = el.dataset.needFn;
      if (!id) return;
      if (el.open) delete ui.needCollapsedItems[id];
      else ui.needCollapsedItems[id] = true;
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-edit-days]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.dataset.needEditDays ?? null;
      ui.needDaysEdit = ui.needDaysEdit === key ? null : key;
      render();
    });
  });

  root.querySelectorAll<HTMLInputElement>("[data-need-days]").forEach((input) => {
    const commit = () => {
      const itemId = input.dataset.needDays;
      const teamId = input.dataset.team;
      const roleId = input.dataset.role;
      if (!itemId || !teamId) return;
      const item = state.items.find((i) => i.id === itemId);
      const assign = item?.assignments.find((a) => a.teamId === teamId);
      const role = roleId
        ? assign?.roles?.find((r) => r.id === roleId)
        : undefined;
      if (!item || !assign) return;
      const raw = Math.round(Number(input.value));
      const fallback = role
        ? rolePlanDays(role, szRanges())
        : assignmentPlanDays(assign, szRanges());
      const days = Number.isFinite(raw) && raw >= 1 ? raw : fallback;
      input.value = String(days);
      if (role && role.days === days) {
        ui.needDaysEdit = null;
        render();
        return;
      }
      const size = nearestSizeFromDays(days, szRanges());
      const team = teamById(teamId);
      if (roleId && role) {
        patchDemandRole(itemId, teamId, roleId, (r) => ({ ...r, days, size }));
        logChange(
          `Потребность «${item.title}»: ${team?.name ?? teamId} / ${role.name} — ${days} дн.`,
          "team"
        );
      } else {
        patchDemandAssignment(itemId, teamId, (a) => ({ ...a, days, size }));
        logChange(
          `Потребность «${item.title}»: ${team?.name ?? teamId} — ${days} дн.`,
          "team"
        );
      }
      ui.needDaysEdit = null;
      persist();
    };
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });
    input.focus();
    input.select();
  });

  root.querySelectorAll<HTMLSelectElement>("[data-need-status]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const itemId = sel.dataset.needStatus;
      const teamId = sel.dataset.team;
      const roleId = sel.dataset.role;
      const next = sel.value as AssignmentDemandStatus;
      if (!itemId || !teamId) return;
      if (!ASSIGNMENT_DEMAND_STATUSES.includes(next)) return;
      const item = state.items.find((i) => i.id === itemId);
      if (roleId) {
        patchDemandRole(itemId, teamId, roleId, (r) => ({
          ...r,
          demandStatus: next,
        }));
      } else {
        patchDemandAssignment(itemId, teamId, (a) => ({
          ...a,
          demandStatus: next,
        }));
      }
      logChange(
        `Потребность «${item?.title ?? itemId}»: ${ASSIGNMENT_DEMAND_LABELS[next]}`,
        "team"
      );
      persist();
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-send]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const itemId = btn.dataset.needSend;
      const teamId = btn.dataset.team;
      const roleId = btn.dataset.role;
      if (!itemId || !teamId) return;
      const item = state.items.find((i) => i.id === itemId);
      const team = teamById(teamId);
      const assign = item?.assignments.find((a) => a.teamId === teamId);
      const hit = roleId
        ? assign?.roles?.some((r) => r.id === roleId)
        : false;
      if (roleId && hit) {
        patchDemandRole(itemId, teamId, roleId, (r) => ({
          ...r,
          demandStatus: "pending",
        }));
      } else {
        patchDemandAssignment(itemId, teamId, (a) =>
          fillTeamDemandRoles(
            {
              ...a,
              demandStatus: "pending",
              roles: (a.roles ?? []).map((r) => ({
                ...r,
                demandStatus: "pending" as const,
              })),
            },
            team
          )
        );
      }
      logChange(
        `Отправлена потребность: «${item?.title ?? itemId}»`,
        "item"
      );
      persist();
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-revert]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const itemId = btn.dataset.needRevert;
      const teamId = btn.dataset.team;
      const roleId = btn.dataset.role;
      if (!itemId || !teamId) return;
      if (roleId) {
        patchDemandRole(itemId, teamId, roleId, (r) => ({
          ...r,
          demandStatus: "draft",
        }));
      } else {
        patchDemandAssignment(itemId, teamId, (a) => ({
          ...a,
          demandStatus: "draft",
        }));
      }
      persist();
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-role-del]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = btn.dataset.needRoleDel;
      const teamId = btn.dataset.team;
      const roleId = btn.dataset.role;
      if (!itemId || !teamId || !roleId) return;
      confirmRemoveDemandRole(itemId, teamId, roleId, btn);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-remove-team]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = btn.dataset.needRemoveTeam;
      const teamId = btn.dataset.team;
      if (!itemId || !teamId) return;
      confirmRemoveDemandTeam(itemId, teamId, btn);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-need-del-fn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = btn.dataset.needDelFn;
      if (!itemId) return;
      confirmDeleteDemandFunctionality(itemId, btn);
    });
  });
}

function bindPlanningTab() {
  const root = document.querySelector(".plan-page");
  if (!root) return;

  root
    .querySelector("[data-tree-expand='plan']")
    ?.addEventListener("click", () => setPlanTreeExpanded(true));
  root
    .querySelector("[data-tree-collapse='plan']")
    ?.addEventListener("click", () => setPlanTreeExpanded(false));

  root.querySelectorAll<HTMLButtonElement>("[data-plan-team]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.planTeam;
      if (!id) return;
      const current = planSelectedTeamIds();
      const has = current.includes(id);
      const next = has
        ? current.filter((x) => x !== id)
        : [...current, id];
      ui.planTeamIds = next;
      ui.planTeamFilterCleared = next.length === 0;
      ui.planFocusTeamId = next.length ? id : null;
      render();
    });
  });

  root.querySelector("[data-plan-teams-clear]")?.addEventListener("click", () => {
    ui.planTeamIds = [];
    ui.planTeamFilterCleared = true;
    ui.planFocusTeamId = null;
    render();
  });
  root.querySelector("[data-plan-teams-all]")?.addEventListener("click", () => {
    ui.planTeamIds = state.teams.map((t) => t.id);
    ui.planTeamFilterCleared = false;
    ui.planFocusTeamId = ui.planTeamIds[0] ?? null;
    render();
  });

  const openTaskForm = (itemId: string, teamId: string, roleId: string) => {
    const item = state.items.find((i) => i.id === itemId);
    const assign = item?.assignments.find((a) => a.teamId === teamId);
    const role = assign?.roles?.find((r) => r.id === roleId);
    if (!item || !assign || !role) return;
    const days = rolePlanDays(role, szRanges());
    const nearest = PLAN_DURATION_CHIPS.reduce((best, d) =>
      Math.abs(d - days) < Math.abs(best - days) ? d : best
    );
    const members = teamById(teamId)?.members ?? [];
    const roleKey = normalizeAssignmentRoleName(role.name);
    const byId = role.assigneeId
      ? members.find((m) => m.id === role.assigneeId)
      : undefined;
    const byRole = members.find(
      (m) => normalizeAssignmentRoleName(m.role) === roleKey
    );
    ui.planTaskForm = {
      itemId,
      teamId,
      roleId,
      memberId: byId?.id ?? byRole?.id ?? members[0]?.id ?? null,
      startWeek: weekIndex(
        state.startDate,
        role.workStartDate || assign.workStartDate
      ),
      days: PLAN_DURATION_CHIPS.includes(days) ? days : nearest,
    };
    render();
  };

  root.querySelectorAll<HTMLElement>("[data-plan-task-open]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = el.dataset.planTaskOpen;
      const teamId = el.dataset.team;
      const roleId = el.dataset.role;
      if (!itemId || !teamId || !roleId) return;
      openTaskForm(itemId, teamId, roleId);
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-plan-form-member]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!ui.planTaskForm) return;
      ui.planTaskForm = { ...ui.planTaskForm, memberId: btn.dataset.planFormMember ?? null };
      render();
    });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-plan-form-week]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!ui.planTaskForm) return;
      ui.planTaskForm = {
        ...ui.planTaskForm,
        startWeek: Number(btn.dataset.planFormWeek) || 0,
      };
      render();
    });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-plan-form-days]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!ui.planTaskForm) return;
      ui.planTaskForm = {
        ...ui.planTaskForm,
        days: Number(btn.dataset.planFormDays) || ui.planTaskForm.days,
      };
      render();
    });
  });
  root.querySelector(".plan-task-form")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  root.querySelector("[data-plan-form-cancel]")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    ui.planTaskForm = null;
    render();
  });
  root.querySelector("[data-plan-form-submit]")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const form = ui.planTaskForm;
    if (!form?.memberId) return;
    const start = addWeeks(state.startDate, form.startWeek);
    const size = nearestSizeFromDays(form.days, szRanges());
    patchDemandRole(form.itemId, form.teamId, form.roleId, (r) => ({
      ...r,
      assigneeId: form.memberId || undefined,
      demandStatus: form.memberId ? "approved" : r.demandStatus,
      workStartDate: snapToMonday(start),
      days: form.days,
      size,
    }));
    const item = state.items.find((i) => i.id === form.itemId);
    const member = teamMemberById(form.teamId, form.memberId ?? undefined);
    logChange(
      `Планирование «${item?.title ?? form.itemId}»: ${member ? shortFio(member.name) : "исполнитель"} — ${form.days} дн.`,
      "schedule"
    );
    ui.planTaskForm = null;
    persist();
  });

  bindPlanBarDrag(root);

  root.querySelectorAll<HTMLDetailsElement>("[data-plan-project]").forEach((el) => {
    el.addEventListener("toggle", () => {
      const key = el.dataset.planProject;
      if (!key) return;
      if (el.open) delete ui.planCollapsedProjects[key];
      else ui.planCollapsedProjects[key] = true;
    });
  });

  root.querySelectorAll<HTMLDetailsElement>("[data-plan-fn]").forEach((el) => {
    el.addEventListener("toggle", () => {
      const id = el.dataset.planFn;
      if (!id) return;
      if (el.open) delete ui.planCollapsedItems[id];
      else ui.planCollapsedItems[id] = true;
    });
  });
}

function bindGanttTab() {
  const root = document.querySelector(".gantt-page");
  if (!root) return;

  root
    .querySelector("[data-tree-expand='gantt']")
    ?.addEventListener("click", () => setGanttTreeExpanded(true));
  root
    .querySelector("[data-tree-collapse='gantt']")
    ?.addEventListener("click", () => setGanttTreeExpanded(false));

  root.querySelectorAll<HTMLDetailsElement>("[data-gantt-project]").forEach((el) => {
    el.addEventListener("toggle", () => {
      const key = el.dataset.ganttProject;
      if (!key) return;
      if (el.open) delete ui.ganttCollapsedProjects[key];
      else ui.ganttCollapsedProjects[key] = true;
    });
  });
  root.querySelectorAll<HTMLDetailsElement>("[data-gantt-fn]").forEach((el) => {
    el.addEventListener("toggle", () => {
      const id = el.dataset.ganttFn;
      if (!id) return;
      if (el.open) delete ui.ganttCollapsedItems[id];
      else ui.ganttCollapsedItems[id] = true;
    });
  });
  root.querySelectorAll<HTMLDetailsElement>("[data-gantt-team]").forEach((el) => {
    el.addEventListener("toggle", () => {
      const key = el.dataset.ganttTeam;
      if (!key) return;
      if (el.open) delete ui.ganttCollapsedTeams[key];
      else ui.ganttCollapsedTeams[key] = true;
    });
  });
}

function applyPlanBarPreview(
  bar: HTMLElement,
  startWeek: number,
  endWeek: number,
  weeks: number
) {
  const span = Math.max(1, endWeek - startWeek + 1);
  const left = (startWeek / weeks) * 100;
  const width = (span / weeks) * 100;
  bar.style.left = `${left}%`;
  bar.style.width = `${Math.max(width, 3)}%`;
  bar.dataset.startWeek = String(startWeek);
  bar.dataset.endWeek = String(endWeek);
}

function bindPlanBarDrag(root: Element) {
  if (!currentCan("planning.edit")) return;
  root.querySelectorAll<HTMLElement>("[data-plan-bar]").forEach((bar) => {
    bar.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const track = bar.closest<HTMLElement>(".plan-track");
      if (!track) return;
      const itemId = bar.dataset.item;
      const teamId = bar.dataset.team;
      const roleId = bar.dataset.role;
      if (!itemId || !teamId) return;
      const weeks = PLAN_WEEKS;
      const originStart = Number(bar.dataset.startWeek);
      const originEnd = Number(bar.dataset.endWeek);
      if (!Number.isFinite(originStart) || !Number.isFinite(originEnd)) return;
      const span = Math.max(1, originEnd - originStart + 1);
      let previewStart = originStart;
      const grab = bar.getBoundingClientRect();
      const grabOffset = e.clientX - grab.left;
      bar.classList.add("is-dragging");
      document.body.classList.add("plan-dragging");
      try {
        bar.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        const rect = track.getBoundingClientRect();
        const weekW = rect.width / weeks;
        let start = Math.round((ev.clientX - grabOffset - rect.left) / weekW);
        start = Math.max(0, Math.min(weeks - span, start));
        previewStart = start;
        applyPlanBarPreview(bar, start, start + span - 1, weeks);
      };

      const cleanup = () => {
        bar.classList.remove("is-dragging");
        document.body.classList.remove("plan-dragging");
        bar.removeEventListener("pointermove", onMove);
        bar.removeEventListener("pointerup", onUp);
        bar.removeEventListener("pointercancel", onUp);
        try {
          bar.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== e.pointerId) return;
        cleanup();
        if (previewStart === originStart) return;
        const newStart = snapToMonday(addWeeks(state.startDate, previewStart));
        if (roleId) {
          patchDemandRole(itemId, teamId, roleId, (r) => ({
            ...r,
            workStartDate: newStart,
          }));
        } else {
          patchDemandAssignment(itemId, teamId, (a) => ({
            ...a,
            workStartDate: newStart,
          }));
        }
        const item = state.items.find((i) => i.id === itemId);
        const team = teamById(teamId);
        logChange(
          `Планирование «${item?.title ?? itemId}» / ${team?.name ?? teamId}: старт ${formatDate(newStart)}`,
          "schedule"
        );
        persist();
      };

      bar.addEventListener("pointermove", onMove);
      bar.addEventListener("pointerup", onUp);
      bar.addEventListener("pointercancel", onUp);
    });
  });
}

function closeProjectCard() {
  ui.creatingProject = false;
  ui.editingProjectKey = null;
}

function readProjectCardDraft(): {
  name: string;
  status: ItemStatus;
  priority: number;
  cashFlow12m: number | null;
  roi12m: number | null;
} | null {
  const name = document.querySelector<HTMLInputElement>("#p_name")?.value.trim() ?? "";
  if (!name) {
    document.querySelector<HTMLInputElement>("#p_name")?.focus();
    return null;
  }
  const statusRaw = document.querySelector<HTMLSelectElement>("#p_status")?.value ?? "";
  const status = ITEM_STATUSES.includes(statusRaw as ItemStatus)
    ? (statusRaw as ItemStatus)
    : coerceItemStatus(statusRaw, "staffing");
  const rankRaw = Number(document.querySelector<HTMLInputElement>("#p_rank")?.value);
  const priority = Number.isFinite(rankRaw) && rankRaw >= 1 ? Math.round(rankRaw) : 1;
  return {
    name,
    status,
    priority,
    cashFlow12m: optionalNum("p_cashFlow12m"),
    roi12m: optionalNum("p_roi12m"),
  };
}

function applyProjectFinance(items: WorkItem[], cash: number | null, roi: number | null) {
  if (!items.length) return;
  const firstId = items[0]!.id;
  state.items = state.items.map((it) => {
    if (!items.some((g) => g.id === it.id)) return it;
    if (it.id === firstId) return { ...it, cashFlow12m: cash, roi12m: roi };
    return { ...it, cashFlow12m: null, roi12m: roi };
  });
}

function saveProjectCard() {
  const draft = readProjectCardDraft();
  if (!draft) return;
  const rankInput = document.querySelector<HTMLInputElement>("#p_rank");
  const statusSel = document.querySelector<HTMLSelectElement>("#p_status");

  const applyCreate = () => {
    const key = draft.name;
    if (groupByProjectKey(state.items).some((g) => g.key === key)) {
      ui.creatingProject = false;
      ui.editingProjectKey = key;
      applyEdit({ confirmStatus: true, confirmPrio: true });
      return;
    }
    const item: WorkItem = {
      id: uid("item"),
      title: draft.name,
      type: "project",
      backlog: draft.name,
      assignments: [],
      status: draft.status,
      owner: "",
      assignee: "",
      reach: 100,
      impact: 1,
      confidence: 0.8,
      notes: "",
      manualRank: nextPriority(state.items),
      cashFlow12m: draft.cashFlow12m,
      roi12m: draft.roi12m,
    };
    state.projects = uniqCatalogNames([...state.projects, draft.name]);
    state.items = [...state.items, item];
    state.items = moveProjectGroupToPriority(
      state.items,
      projectGroupKey(item),
      draft.priority,
      szRanges()
    );
    logChange(`Добавлен проект «${draft.name}»`, "catalog");
    closeProjectCard();
    persist();
  };

  const applyEdit = (opts: { confirmStatus: boolean; confirmPrio: boolean }) => {
    const key = ui.editingProjectKey;
    if (!key) return;
    const group = projectCardGroup(key);
    if (!group) return;
    const prevName = group.title;
    const prevStatus = [...new Set(group.items.map((it) => it.status))];
    const wasStatus = prevStatus.length === 1 ? prevStatus[0]! : "";
    const prevPrio = projectPrioMap().get(key) ?? 1;

    if (draft.name !== prevName) {
      state.items = state.items.map((it) =>
        projectGroupKey(it) === key ? { ...it, backlog: draft.name } : it
      );
      state.projects = uniqCatalogNames([
        ...state.projects.map((p) => (p === prevName ? draft.name : p)),
        draft.name,
      ]);
      if (ui.needProjectKey === key) ui.needProjectKey = draft.name;
      ui.editingProjectKey = draft.name;
      logChange(`Проект «${prevName}» → «${draft.name}»`, "catalog");
    }

    const nextKey = ui.editingProjectKey ?? draft.name;
    const members = projectCardGroup(nextKey)?.items ?? group.items;
    applyProjectFinance(members, draft.cashFlow12m, draft.roi12m);

    if (opts.confirmStatus && draft.status !== wasStatus) {
      state.items = state.items.map((it) =>
        projectGroupKey(it) === nextKey ? { ...it, status: draft.status } : it
      );
      logChange(
        `Статус проекта «${draft.name}»: ${
          wasStatus ? statusLabel(wasStatus as ItemStatus) : "несколько"
        } → ${statusLabel(draft.status)}`,
        "item"
      );
    }

    if (opts.confirmPrio && draft.priority !== prevPrio) {
      state.items = moveProjectGroupToPriority(
        state.items,
        nextKey,
        draft.priority,
        szRanges()
      );
      logChange(
        `Приоритет проекта «${draft.name}»: #${prevPrio} → #${draft.priority}`,
        "priority"
      );
    }

    closeProjectCard();
    persist();
  };

  if (ui.creatingProject) {
    applyCreate();
    return;
  }

  const key = ui.editingProjectKey;
  const group = projectCardGroup(key);
  if (!group) return;
  const prevStatus = [...new Set(group.items.map((it) => it.status))];
  const wasStatus = prevStatus.length === 1 ? prevStatus[0]! : "";
  const prevPrio = projectPrioMap().get(group.key) ?? 1;
  const statusChanged = draft.status !== wasStatus;
  const prioChanged = draft.priority !== prevPrio;

  const run = (confirmStatus: boolean, confirmPrio: boolean) => {
    applyEdit({ confirmStatus, confirmPrio });
  };

  if (prioChanged && rankInput) {
    askPrioConfirm(
      rankInput,
      `Сменить приоритет проекта «${escapeHtml(group.title)}» на <span class="accent">${draft.priority}</span>?`,
      () => {
        if (statusChanged && statusSel) {
          askAppConfirm(
            statusSel,
            `Сменить статус проекта «${escapeHtml(draft.name)}» на «<strong>${escapeHtml(statusLabel(draft.status))}</strong>»?`,
            () => run(true, true),
            () => undefined,
            { wide: true, yesLabel: "Да", noLabel: "Отмена" }
          );
          return;
        }
        run(false, true);
      },
      () => undefined
    );
    return;
  }

  if (statusChanged && statusSel) {
    askAppConfirm(
      statusSel,
      `Сменить статус проекта «${escapeHtml(group.title)}» на «<strong>${escapeHtml(statusLabel(draft.status))}</strong>»?`,
      () => run(true, false),
      () => undefined,
      { wide: true, yesLabel: "Да", noLabel: "Отмена" }
    );
    return;
  }

  run(false, false);
}

/** Write every user mutation to the isolated v2 store (local + cloud row `v2`). */
function persist() {
  applyComputedTeamCapacities(state.teams);
  if (!state.teamRosterSeeded) state.teamRosterSeeded = MIGRATION_SEEDED_TEAM_ROSTER;
  state = ensureStateAssignmentRoles(state);
  saveState(state);
  render();
}

function bind() {
  // Critical actions first so a later bind helper throw cannot orphan these buttons.
  document.querySelector("#addItem")?.addEventListener("click", () => {
    if (!currentCan("portfolio.edit")) return;
    ui.creating = false;
    ui.editingId = null;
    ui.creatingProject = true;
    ui.editingProjectKey = null;
    render();
  });
  document.querySelector("#exportPdfBtn")?.addEventListener("click", () => {
    void exportPortfolioReportPdf();
  });

  try {
    bindUiRest();
  } catch (err) {
    console.error("UI bind failed after critical handlers", err);
  }
}

function bindUiRest() {
  document.querySelector("#brandHomeBtn")?.addEventListener("click", () => {
    setActiveTab("portfolio");
    render();
  });

  document.querySelector("#currentUserSelect")?.addEventListener("change", (e) => {
    const sel = e.currentTarget as HTMLSelectElement;
    writeStoredCurrentUserId(sel.value);
    render();
  });

  document.querySelectorAll<HTMLSelectElement>("[data-app-role]").forEach((sel) => {
    sel.addEventListener("change", () => {
      if (!currentCan("settings.appRoles")) return;
      const personId = sel.dataset.appRole;
      if (!personId) return;
      const person = appPeopleDirectory().find((p) => p.id === personId);
      const role = parseAppRole(sel.value);
      if (!role) return;
      const prev = findRoleAssignment(state.roleAssignments, personId);
      const teamIds =
        role === "team_lead"
          ? prev?.teamIds?.length
            ? prev.teamIds
            : person?.teamIds?.slice(0, 1) ?? []
          : undefined;
      state.roleAssignments = upsertRoleAssignment(state.roleAssignments, {
        personId,
        personName: person?.name ?? prev?.personName ?? personId,
        role,
        ...(teamIds?.length ? { teamIds } : {}),
      });
      logChange(
        `Роль приложения: ${person?.name ?? personId} → ${APP_ROLE_LABELS[role]}`,
        "settings"
      );
      persist();
    });
  });

  document.querySelectorAll<HTMLSelectElement>("[data-app-role-teams]").forEach((sel) => {
    sel.addEventListener("change", () => {
      if (!currentCan("settings.appRoles")) return;
      const personId = sel.dataset.appRoleTeams;
      if (!personId) return;
      const person = appPeopleDirectory().find((p) => p.id === personId);
      const prev = findRoleAssignment(state.roleAssignments, personId);
      const role = prev?.role ?? "team_lead";
      if (role !== "team_lead") return;
      const teamIds = Array.from(sel.selectedOptions).map((o) => o.value);
      state.roleAssignments = upsertRoleAssignment(state.roleAssignments, {
        personId,
        personName: person?.name ?? prev?.personName ?? personId,
        role: "team_lead",
        teamIds,
      });
      logChange(
        `Тимлид ${person?.name ?? personId}: команды ${
          teamIds
            .map((id) => state.teams.find((t) => t.id === id)?.name ?? id)
            .join(", ") || "—"
        }`,
        "settings"
      );
      persist();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveTab(btn.dataset.tab);
      render();
    });
  });

  bindDemandTab();
  bindPlanningTab();
  bindGanttTab();

  document.querySelectorAll<HTMLInputElement>(".set-range").forEach((input) => {
    input.addEventListener("input", () => applySizeRangesFromInputs());
  });
  document.querySelector("#resetSizeRanges")?.addEventListener("click", () => {
    state.sizeRanges = normalizeSizeRanges(undefined);
    logChange(
      `Маечная оценка сброшена: ${sizeRangesSummary(state.sizeRanges)}`,
      "settings"
    );
    persist();
  });

  const q = document.querySelector<HTMLInputElement>("#q");
  q?.addEventListener("input", () => {
    ui.query = q.value;
  });
  q?.addEventListener("change", () => render());

  const typeFilter = document.querySelector<HTMLSelectElement>("#typeFilter");
  typeFilter?.addEventListener("change", () => {
    ui.typeFilter = typeFilter.value as UiState["typeFilter"];
    render();
  });
  const teamFilter = document.querySelector<HTMLSelectElement>("#teamFilter");
  teamFilter?.addEventListener("change", () => {
    ui.teamFilter = teamFilter.value;
    render();
  });
  const statusFilter =
    document.querySelector<HTMLSelectElement>("#statusFilter");
  statusFilter?.addEventListener("change", () => {
    ui.statusFilter = statusFilter.value as UiState["statusFilter"];
    render();
  });

  document
    .querySelectorAll<HTMLButtonElement>("[data-schedule-mode]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = normalizeScheduleMode(
          btn.dataset.scheduleMode as ScheduleMode
        );
        if (!isCapacityScheduleMode(next)) return;
        setScheduleMode(activeScheduleMode() === next ? "manual" : next);
        render();
      });
    });

  bindOverloadExplain();
  bindPlanConflictTips();

  document.querySelector("#resetFilters")?.addEventListener("click", () => {
    ui.typeFilter = "all";
    ui.teamFilter = "all";
    ui.statusFilter = "all";
    ui.query = "";
    ui.sortKey = "priority";
    ui.sortDir = "asc";
    ui.hiddenCols = [];
    saveHiddenCols([]);
    resetColWidths();
    render();
  });

  const colPicker = document.querySelector<HTMLDetailsElement>(".col-picker");
  colPicker?.addEventListener("toggle", () => {
    ui.colPickerOpen = colPicker.open;
    if (colPicker.open) {
      bindColPickerOutsideClose(colPicker);
    } else {
      closeColPickerOutside();
    }
  });
  if (ui.colPickerOpen && colPicker) {
    bindColPickerOutsideClose(colPicker);
  }
  document.querySelectorAll<HTMLInputElement>(".col-visibility").forEach((check) => {
    check.addEventListener("change", () => {
      const col = check.dataset.col as HideablePortfolioCol | undefined;
      if (!col) return;
      setColVisible(col, check.checked);
    });
  });

  const portfolioBody = document.querySelector("#portfolioBody");
  if (portfolioBody) {
    portfolioBody.addEventListener("click", (e) => {
      if (performance.now() < suppressPortfolioRowEditUntil) return;
      if (document.querySelector("#appConfirmPop")) return;
      const t = e.target as HTMLElement;
      if (isPortfolioStatusChrome(t)) return;
      if (
        t.closest(
          "[data-stop-edit], .prio-input, .prio-edit, .status-select, .status-cell, #appConfirmPop, .drag-handle"
        )
      )
        return;
      if (!currentCan("portfolio.edit")) return;
      const projectRow = t.closest<HTMLTableRowElement>("[data-project-card]");
      if (projectRow) {
        ui.creatingProject = false;
        ui.editingProjectKey = projectRow.dataset.projectCard ?? null;
        ui.creating = false;
        ui.editingId = null;
        render();
        return;
      }
      const row = t.closest<HTMLTableRowElement>("[data-edit]");
      if (!row) return;
      ui.editingId = row.dataset.edit ?? null;
      ui.creating = false;
      render();
    });
  }

  bindPortfolioDrag();

  document.querySelectorAll<HTMLInputElement>(".prio-input").forEach((input) => {
    if (!currentCan("portfolio.edit")) {
      input.disabled = true;
      return;
    }
    const itemId = input.dataset.prioId;
    if (!itemId) return;
    let confirming = false;
    const revert = () => {
      const item = state.items.find((i) => i.id === itemId);
      input.value = String(item?.manualRank ?? 1);
    };
    const commit = () => {
      if (confirming) return;
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return;
      const raw = Number(input.value);
      if (!Number.isFinite(raw) || raw < 1) {
        revert();
        return;
      }
      const priority = Math.round(raw);
      input.value = String(priority);
      if (priority === item.manualRank) return;

      const conflict = findPriorityConflict(state.items, priority, itemId);
      const text = conflict
        ? `Сменить на <span class="accent">${priority}</span>?<br/>«${escapeHtml(conflict.title)}» сдвинется вверх.`
        : `Сменить приоритет на <span class="accent">${priority}</span>?`;

      confirming = true;
      askPrioConfirm(
        input,
        text,
        () => {
          confirming = false;
          state.items = moveItemToPriority(state.items, itemId, priority, szRanges());
          logChange(
            `Приоритет «${item.title}»: #${item.manualRank ?? "—"} → #${priority}`,
            "priority"
          );
          persist();
        },
        () => {
          confirming = false;
          revert();
        }
      );
    };
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("mousedown", (e) => e.stopPropagation());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        confirming = false;
        closePrioPop();
        revert();
        input.blur();
      }
    });
    input.addEventListener("change", commit);
  });

  document.querySelectorAll<HTMLInputElement>("[data-project-prio]").forEach((input) => {
    const key = input.dataset.projectPrio ?? "";
    let confirming = false;
    const revert = () => {
      input.value = input.dataset.projectPrioNow ?? "1";
    };
    const commit = () => {
      if (confirming) return;
      const raw = Number(input.value);
      const now = Number(input.dataset.projectPrioNow);
      if (!Number.isFinite(raw) || raw < 1) {
        revert();
        return;
      }
      const priority = Math.round(raw);
      input.value = String(priority);
      if (priority === now) return;
      armSuppressPortfolioRowEdit();
      const group = groupByProjectKey(state.items).find((g) => g.key === key);
      const title = group?.title ?? key;
      confirming = true;
      askPrioConfirm(
        input,
        `Сменить приоритет проекта «${escapeHtml(title)}» на <span class="accent">${priority}</span>?`,
        () => {
          confirming = false;
          state.items = moveProjectGroupToPriority(
            state.items,
            key,
            priority,
            szRanges()
          );
          logChange(
            `Приоритет проекта «${title}»: #${now} → #${priority}`,
            "priority"
          );
          persist();
        },
        () => {
          confirming = false;
          revert();
        }
      );
    };
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("mousedown", (e) => e.stopPropagation());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        confirming = false;
        closePrioPop();
        revert();
        input.blur();
      }
    });
    input.addEventListener("change", commit);
  });

  document.querySelectorAll<HTMLSelectElement>("[data-project-status]").forEach((sel) => {
    if (!currentCan("portfolio.edit")) {
      sel.disabled = true;
      return;
    }
    const stop = (e: Event) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    sel.addEventListener("click", stop, true);
    sel.addEventListener("mousedown", stop, true);
    sel.addEventListener("pointerdown", stop, true);
    sel.addEventListener("change", () => {
      const key = sel.dataset.projectStatus ?? "";
      const next = sel.value as ItemStatus;
      const was = sel.dataset.statusWas ?? "";
      if (!ITEM_STATUSES.includes(next)) {
        sel.value = was;
        return;
      }
      if (next === was) return;
      armSuppressPortfolioRowEdit();
      const group = groupByProjectKey(state.items).find((g) => g.key === key);
      const title = group?.title ?? key;
      askAppConfirm(
        sel,
        `Сменить статус проекта «${escapeHtml(title)}» на «<strong>${escapeHtml(statusLabel(next))}</strong>»?`,
        () => {
          state.items = state.items.map((it) =>
            it.type === "project" && demandProjectKey(it) === key
              ? { ...it, status: next }
              : it
          );
          logChange(
            `Статус проекта «${title}»: ${was ? statusLabel(was as ItemStatus) : "несколько"} → ${statusLabel(next)}`,
            "item"
          );
          persist();
        },
        () => {
          sel.value = was;
          sel.className = `status-select${was ? ` badge-status-${was}` : ""}`;
        },
        { wide: true, yesLabel: "Да", noLabel: "Отмена" }
      );
    });
  });

  document.querySelectorAll<HTMLSelectElement>(".status-select").forEach((sel) => {
    if (sel.dataset.projectStatus) return;
    if (!currentCan("portfolio.edit")) {
      sel.disabled = true;
      return;
    }
    const stop = (e: Event) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    sel.addEventListener("click", stop, true);
    sel.addEventListener("mousedown", stop, true);
    sel.addEventListener("pointerdown", stop, true);
    sel.addEventListener("pointerup", stop, true);
    sel.addEventListener("change", () => {
      const itemId = sel.dataset.statusId;
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return;
      const next = sel.value as ItemStatus;
      if (!ITEM_STATUSES.includes(next) || next === item.status) return;
      const prev = item.status;
      item.status = next;
      sel.className = `status-select badge-status-${next}`;
      logChange(
        `Статус «${item.title}»: ${statusLabel(prev)} → ${statusLabel(next)}`,
        "item"
      );
      armSuppressPortfolioRowEdit();
      saveState(state);
      window.setTimeout(() => {
        ui.editingId = null;
        ui.creating = false;
        render();
      }, 0);
    });
  });

  document.querySelectorAll<HTMLTableCellElement>("[data-sort]").forEach((th) => {
    th.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("[data-col-resize]")) return;
      e.stopPropagation();
      const key = th.dataset.sort as SortKey | undefined;
      if (key === "rice" || key === "estimate" || key === "eta" || key === "priority")
        toggleSort(key);
    });
  });

  bindPortfolioColResize();
  bindPortfolioTableScroll();
  bindStickyTabsOffset();
  bindGanttDepArrowLayout();
  bindGanttLabelResize();
  bindGanttLabelTips();
  bindGanttBarEdit();
  bindPlanStartDate();

  const close = () => {
    ui.creating = false;
    ui.editingId = null;
    closeProjectCard();
    render();
  };
  document.querySelector("#closeModal")?.addEventListener("click", close);
  document.querySelector("#closeModal2")?.addEventListener("click", close);
  document.querySelector("#modal")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "modal") close();
  });
  document.querySelector("#closeProjectCard")?.addEventListener("click", close);
  document.querySelector("#closeProjectCard2")?.addEventListener("click", close);
  document.querySelector("#projectCardModal")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "projectCardModal") close();
  });
  document.querySelector("#saveProjectCard")?.addEventListener("click", () => {
    saveProjectCard();
  });

  document.querySelectorAll<HTMLInputElement>(".f_team_check").forEach((check) => {
    check.addEventListener("change", () => {
      const teamId = check.dataset.team!;
      const row = check.closest(".team-assign-row");
      row?.classList.toggle("is-on", check.checked);
      const size = document.querySelector<HTMLSelectElement>(
        `.f_team_size[data-team="${teamId}"]`
      );
      const start = document.querySelector<HTMLInputElement>(
        `.f_team_start[data-team="${teamId}"]`
      );
      if (size) size.disabled = !check.checked;
      if (start) start.disabled = !check.checked;
      refreshLiveEta();
    });
  });

  // Delegation: date picker reliably fires change; also catch input/keyup
  const teamList = document.querySelector("#teamAssignList");
  const onTeamField = (e: Event) => {
    const el = e.target as HTMLElement | null;
    if (!el) return;
    if (
      el.classList.contains("f_team_size") ||
      el.classList.contains("f_team_start") ||
      el.classList.contains("f_team_check")
    ) {
      refreshLiveEta();
    }
  };
  teamList?.addEventListener("input", onTeamField);
  teamList?.addEventListener("change", onTeamField);
  teamList?.addEventListener("keyup", onTeamField);
  document.querySelector("#saveItem")?.addEventListener("click", () => {
    const data = readForm();
    if (!data) return;
    const priority = data.manualRank ?? nextPriority(state.items);
    const rankInput = document.querySelector<HTMLInputElement>("#f_rank");

    const applyCreate = () => {
      const conflict = findPriorityConflict(state.items, priority, null);
      if (conflict) {
        const id = uid("item");
        state.items = [
          ...state.items,
          { ...data, id, manualRank: state.items.length + 1 },
        ];
        state.items = moveItemToPriority(state.items, id, priority, szRanges());
      } else {
        state.items.push({ ...data, id: uid("item"), manualRank: priority });
        state.items = ensureUniquePriorities(state.items, szRanges());
      }
      logChange(
        `Создана функциональность «${data.title}» (#${priority})`,
        "item"
      );
      ui.creating = false;
      ui.editingId = null;
      persist();
    };

    const applyEdit = () => {
      if (!ui.editingId) return;
      const idx = state.items.findIndex((i) => i.id === ui.editingId);
      if (idx < 0) return;
      const prev = state.items[idx];
      let next: WorkItem;
      if (priority !== prev.manualRank) {
        state.items[idx] = { ...prev, ...data, manualRank: prev.manualRank };
        state.items = moveItemToPriority(state.items, ui.editingId, priority, szRanges());
        next =
          state.items.find((i) => i.id === ui.editingId) ?? {
            ...prev,
            ...data,
            manualRank: priority,
          };
      } else {
        next = { ...prev, ...data };
        state.items[idx] = next;
      }
      logChange(summarizeItemUpdate(prev, next), "item");
      ui.creating = false;
      ui.editingId = null;
      persist();
    };

    if (ui.creating) {
      const conflict = findPriorityConflict(state.items, priority, null);
      if (conflict && rankInput) {
        askPrioConfirm(
          rankInput,
          `Занять <span class="accent">${priority}</span>?<br/>«${escapeHtml(conflict.title)}» сдвинется вверх.`,
          applyCreate,
          () => undefined
        );
        return;
      }
      applyCreate();
      return;
    }

    if (ui.editingId) {
      const prev = state.items.find((i) => i.id === ui.editingId);
      if (prev && priority !== prev.manualRank && rankInput) {
        const conflict = findPriorityConflict(
          state.items,
          priority,
          ui.editingId
        );
        askPrioConfirm(
          rankInput,
          conflict
            ? `Сменить на <span class="accent">${priority}</span>?<br/>«${escapeHtml(conflict.title)}» сдвинется вверх.`
            : `Сменить приоритет на <span class="accent">${priority}</span>?`,
          applyEdit,
          () => undefined
        );
        return;
      }
      applyEdit();
    }
  });

  document.querySelector("#deleteItem")?.addEventListener("click", () => {
    if (!ui.editingId) return;
    const prev = state.items.find((i) => i.id === ui.editingId);
    state.items = state.items.filter((i) => i.id !== ui.editingId);
    forgetWorkItemIds([ui.editingId]);
    if (prev) {
      logChange(
        `Удалена функциональность «${prev.title}» (#${prev.manualRank ?? "—"})`,
        "item"
      );
    }
    ui.editingId = null;
    persist();
  });

  const refreshLiveRice = () => {
    const live = document.querySelector("#liveRice");
    const liveEffort = document.querySelector("#liveEffort");
    if (!live && !liveEffort) return;
    const assignments = readAssignments();
    const base =
      (ui.editingId
        ? state.items.find((i) => i.id === ui.editingId)
        : null) ??
      ({
        id: "x",
        title: "",
        type: "product" as ItemType,
        backlog: "",
        assignments,
        status: "staffing" as ItemStatus,
        owner: "",
        assignee: "",
        reach: 100,
        impact: 1 as RiceImpact,
        confidence: 0.8,
        manualRank: null,
        cashFlow12m: null,
        roi12m: null,
      } satisfies WorkItem);
    const confRaw = Number(
      document.querySelector<HTMLInputElement>("#f_conf")?.value
    );
    const item: WorkItem = {
      ...base,
      id: "x",
      assignments: assignments.length ? assignments : base.assignments,
      reach: Math.max(
        0,
        Number(document.querySelector<HTMLInputElement>("#f_reach")?.value) ||
          base.reach
      ),
      impact: parseRiceImpact(
        document.querySelector<HTMLSelectElement>("#f_impact")?.value,
        base.impact
      ),
      confidence: Number.isFinite(confRaw)
        ? Math.min(1, Math.max(0, confRaw > 1 ? confRaw / 100 : confRaw))
        : base.confidence,
      manualRank: null,
    };
    if (live) live.textContent = String(rice(item, szRanges()));
    if (liveEffort)
      liveEffort.textContent = String(riceEffortWeeks(item, szRanges()));
  };

  ["f_reach", "f_impact", "f_conf"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", refreshLiveRice);
    document.querySelector(`#${id}`)?.addEventListener("change", refreshLiveRice);
  });
  teamList?.addEventListener("input", refreshLiveRice);
  teamList?.addEventListener("change", refreshLiveRice);

  const ganttWeeks = document.querySelector<HTMLInputElement>("#ganttWeeks");
  ganttWeeks?.addEventListener("input", () => {
    const n = Math.max(4, Math.min(52, Number(ganttWeeks.value) || 16));
    ui.ganttWeeks = n;
    const label = document.querySelector("#ganttWeeksLabel");
    if (label) label.textContent = `${n} нед.`;
  });
  ganttWeeks?.addEventListener("change", () => {
    ui.ganttWeeks = Math.max(4, Math.min(52, Number(ganttWeeks.value) || 16));
    render();
  });

  document.querySelectorAll<HTMLInputElement>("[data-team-name]").forEach((input) => {
    const commitName = () => {
      const id = input.dataset.teamName!;
      const team = state.teams.find((t) => t.id === id);
      if (!team) return;
      const name = input.value.trim() || team.name;
      input.value = name;
      if (name === team.name) return;
      const prev = team.name;
      team.name = name;
      logChange(`Команда переименована: «${prev}» → «${name}»`, "team");
      persist();
    };
    input.addEventListener("change", commitName);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });
  });

  document.querySelectorAll<HTMLSelectElement>("[data-team-row-role]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const teamId = sel.dataset.teamRowRole!;
      if (!currentCan("teams.manage", teamId)) return;
      const personId = sel.dataset.personId!;
      const team = state.teams.find((t) => t.id === teamId);
      const person = team?.members?.find((m) => m.id === personId);
      const role = canonicalizeCatalogRole(sel.value) ?? sel.value.trim();
      if (!team || !person || !role) return;
      if (person.role === role) return;
      person.role = role;
      syncTeamRoster(team);
      syncDemandRolesToTeam(team);
      logChange(`Команда «${team.name}»: роль «${role}»`, "team");
      persist();
    });
  });

  document.querySelectorAll<HTMLInputElement>("[data-team-row-fio]").forEach((input) => {
    const commit = () => {
      const teamId = input.dataset.teamRowFio!;
      if (!currentCan("teams.manage", teamId)) return;
      const personId = input.dataset.personId!;
      const team = state.teams.find((t) => t.id === teamId);
      const person = team?.members?.find((m) => m.id === personId);
      if (!team || !person) return;
      const name = input.value.trim() || person.name;
      input.value = name;
      if (name === person.name) return;
      person.name = name;
      logChange(`Команда «${team.name}»: ФИО обновлено`, "team");
      persist();
    };
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-team-row-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const teamId = btn.dataset.teamRowDel!;
      if (!currentCan("teams.manage", teamId)) return;
      const personId = btn.dataset.personId!;
      const team = state.teams.find((t) => t.id === teamId);
      const person = team?.members?.find((m) => m.id === personId);
      if (!team?.members || !person) return;
      askAppConfirm(
        btn,
        `Удалить «<strong>${escapeHtml(person.role)}</strong> — ${escapeHtml(person.name)}» у команды «${escapeHtml(team.name)}»?`,
        () => {
          team.members = (team.members ?? []).filter((m) => m.id !== personId);
          syncTeamRoster(team);
          syncDemandRolesToTeam(team);
          logChange(
            `Команда «${team.name}»: удалена строка ${person.role} — ${person.name}`,
            "team"
          );
          persist();
        },
        () => undefined,
        { wide: true, yesLabel: "Удалить", noLabel: "Отмена" }
      );
    });
  });

  const addTeamRow = (teamId: string) => {
    if (!currentCan("teams.manage", teamId)) return;
    const team = state.teams.find((t) => t.id === teamId);
    const roleSel = document.querySelector<HTMLSelectElement>(
      `[data-team-row-role-new="${CSS.escape(teamId)}"]`
    );
    const fioInput = document.querySelector<HTMLInputElement>(
      `[data-team-row-fio-new="${CSS.escape(teamId)}"]`
    );
    const role = canonicalizeCatalogRole(roleSel?.value ?? "") ?? "";
    const name = fioInput?.value.trim() || "";
    if (!team) return;
    if (!role) {
      roleSel?.focus();
      return;
    }
    if (!name) {
      fioInput?.focus();
      return;
    }
    team.members = [
      ...(team.members ?? []),
      { id: uid("p"), name, role },
    ];
    syncTeamRoster(team);
    syncDemandRolesToTeam(team);
    logChange(`Команда «${team.name}»: ${role} — ${name}`, "team");
    persist();
  };

  document.querySelectorAll<HTMLButtonElement>("[data-team-row-add]").forEach((btn) => {
    btn.addEventListener("click", () => addTeamRow(btn.dataset.teamRowAdd!));
  });
  document.querySelectorAll<HTMLInputElement>("[data-team-row-fio-new]").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addTeamRow(input.dataset.teamRowFioNew ?? "");
    });
  });

  document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>("[data-tab-jump]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveTab(btn.dataset.tabJump);
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-team-delete]").forEach(
    (btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!currentCan("teams.create")) return;
        const id = btn.dataset.teamDelete!;
        confirmDeleteTeam(id, btn);
      });
    }
  );

  const isCatalogKind = (k: string | undefined): k is CatalogKind =>
    k === "customers" ||
    k === "executors" ||
    k === "projects" ||
    k === "products";

  document.querySelectorAll<HTMLInputElement>("[data-catalog-name]").forEach((input) => {
    const commit = () => {
      const kind = input.dataset.catalogName;
      const idx = Number(input.dataset.catalogIdx);
      if (!isCatalogKind(kind)) return;
      if (!Number.isFinite(idx) || idx < 0 || idx >= state[kind].length) return;
      const prev = state[kind][idx]!;
      const next = input.value.trim();
      if (!next) {
        input.value = prev;
        return;
      }
      if (next === prev) return;
      const list = [...state[kind]];
      list[idx] = next;
      state[kind] = uniqCatalogNames(list);
      if (kind === "customers") {
        state.items = state.items.map((it) =>
          it.owner === prev ? { ...it, owner: next } : it
        );
      } else if (kind === "executors") {
        state.items = state.items.map((it) =>
          it.assignee === prev ? { ...it, assignee: next } : it
        );
      } else if (kind === "projects") {
        state.items = state.items.map((it) =>
          it.type === "project" && productProjectName(it.backlog) === prev
            ? { ...it, backlog: next }
            : it
        );
      } else {
        state.items = state.items.map((it) =>
          it.type === "product" && productProjectName(it.backlog) === prev
            ? { ...it, backlog: next }
            : it
        );
      }
      logChange(
        `${catalogKindRu(kind)}: «${prev}» → «${next}»`,
        "catalog"
      );
      persist();
    };
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-catalog-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.catalogDelete;
      const idx = Number(btn.dataset.catalogIdx);
      if (!isCatalogKind(kind)) return;
      if (!Number.isFinite(idx) || idx < 0 || idx >= state[kind].length) return;
      const removed = state[kind][idx]!;
      state[kind] = state[kind].filter((_, i) => i !== idx);
      if (kind === "customers") {
        state.items = state.items.map((it) =>
          it.owner === removed ? { ...it, owner: "—" } : it
        );
      } else if (kind === "executors") {
        state.items = state.items.map((it) =>
          it.assignee === removed ? { ...it, assignee: "" } : it
        );
      } else if (kind === "projects") {
        const matching = state.items.filter(
          (it) =>
            it.type === "project" && productProjectName(it.backlog) === removed
        );
        forgetWorkItemIds(matching.map((it) => it.id));
        forgetProjectKey(removed);
        state.items = state.items.map((it) =>
          it.type === "project" && productProjectName(it.backlog) === removed
            ? { ...it, backlog: "" }
            : it
        );
      } else {
        const matching = state.items.filter(
          (it) =>
            it.type === "product" && productProjectName(it.backlog) === removed
        );
        forgetWorkItemIds(matching.map((it) => it.id));
        forgetProjectKey(removed);
        state.items = state.items.map((it) =>
          it.type === "product" && productProjectName(it.backlog) === removed
            ? { ...it, backlog: "" }
            : it
        );
      }
      logChange(`Удалён ${catalogKindRu(kind)} «${removed}»`, "catalog");
      persist();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-catalog-add]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.catalogAdd;
      if (!isCatalogKind(kind)) return;
      const input = document.querySelector<HTMLInputElement>(`#newCatalog_${kind}`);
      const name = input?.value.trim() || "";
      if (!name) {
        input?.focus();
        return;
      }
      state[kind] = uniqCatalogNames([...state[kind], name]);
      if (input) input.value = "";
      logChange(`Добавлен ${catalogKindRu(kind)} «${name}»`, "catalog");
      persist();
    });
  });

  document.querySelectorAll<HTMLInputElement>("[id^='newCatalog_']").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const kind = input.id.replace("newCatalog_", "");
      document
        .querySelector<HTMLButtonElement>(`[data-catalog-add="${kind}"]`)
        ?.click();
    });
  });

  document.querySelector<HTMLSelectElement>("#f_type")?.addEventListener("change", (e) => {
    const type = (e.target as HTMLSelectElement).value as ItemType;
    const cur = document.querySelector<HTMLSelectElement>("#f_backlog")?.value ?? "";
    refillBacklogSelect(type, cur);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-team-color]").forEach(
    (btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.teamColor!;
        const team = state.teams.find((t) => t.id === id);
        if (!team) return;
        if (btn.classList.contains("is-open")) {
          closeTeamColorPop();
          return;
        }
        openTeamColorPicker(btn, team.color, (color) => {
          if (team.color === color) return;
          team.color = color;
          logChange(`Цвет команды «${team.name}» изменён`, "team");
          persist();
        });
      });
    }
  );

  document
    .querySelector<HTMLButtonElement>("[data-new-team-color]")
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.currentTarget as HTMLButtonElement;
      if (btn.classList.contains("is-open")) {
        closeTeamColorPop();
        return;
      }
      openTeamColorPicker(btn, newTeamColor(), (color) => {
        draftNewTeamColor = color;
        const dot = btn.querySelector<HTMLElement>(".team-dot");
        if (dot) dot.style.background = color;
      });
    });

  const createTeam = () => {
    if (!currentCan("teams.create")) return;
    const nameInput = document.querySelector<HTMLInputElement>("#newTeamName");
    const name = nameInput?.value.trim() || "";
    if (!name) {
      nameInput?.focus();
      return;
    }
    const id = uid("team");
    const members: TeamMember[] = [];
    state.teams.push(
      syncTeamRoster({
        id,
        name,
        color: newTeamColor(),
        members,
        roles: [],
        capacityPw: 0,
      })
    );
    draftNewTeamColor = null;
    if (nameInput) nameInput.value = "";
    logChange(`Добавлена команда «${name}»`, "team");
    persist();
  };

  document.querySelector("#cancelNewTeam")?.addEventListener("click", () => {
    const nameInput = document.querySelector<HTMLInputElement>("#newTeamName");
    if (nameInput) nameInput.value = "";
    draftNewTeamColor = null;
    const btn = document.querySelector<HTMLButtonElement>("[data-new-team-color]");
    const dot = btn?.querySelector<HTMLElement>(".team-dot");
    if (dot) dot.style.background = nextTeamColor();
    nameInput?.focus();
  });

  document.querySelector("#saveNewTeam")?.addEventListener("click", createTeam);
  document
    .querySelector<HTMLInputElement>("#newTeamName")
    ?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        createTeam();
      }
    });

  document.querySelector("#downloadReqsBtn")?.addEventListener("click", () => {
    void downloadRequirementsDoc();
  });

  const presBtn = document.querySelector<HTMLAnchorElement>("#downloadPresBtn");
  if (presBtn) {
    const base = import.meta.env.BASE_URL || "./";
    presBtn.href = new URL(
      "VI-Planer-presentation.pdf",
      new URL(base, window.location.href),
    ).href;
    presBtn.setAttribute("download", "VI-Planer-presentation.pdf");
  }

  document.querySelector("#rollbackPrioBtn")?.addEventListener("click", (e) => {
    const btn = e.currentTarget as HTMLElement;
    askAppConfirm(
      btn,
      "Вернуть портфель, который был до загрузки таблицы?",
      () => {
        const restored = rollbackPortfolioPack();
        if (!restored) return;
        state = restored;
        persist();
      },
      () => undefined
    );
  });

  document.querySelector("#reapplyPrioBtn")?.addEventListener("click", (e) => {
    const btn = e.currentTarget as HTMLElement;
    askAppConfirm(
      btn,
      "Заменить текущий портфель таблицей приоритезации (01.10.2026)?",
      () => {
        const { state: next } = applyCurrentPortfolioPack(state, { force: true });
        state = next;
        persist();
      },
      () => undefined
    );
  });

  document.querySelector("#clearChangeLogBtn")?.addEventListener("click", (e) => {
    if (!currentCan("changelog.clear")) return;
    const btn = e.currentTarget as HTMLElement;
    askAppConfirm(
      btn,
      "Очистить журнал изменений?",
      () => {
        state.changeLog = [];
        persist();
      },
      () => undefined
    );
  });
}

function bindStickyTabsOffset() {
  const tabs = document.querySelector<HTMLElement>(".tabs");
  if (!tabs) return;

  const sync = () => {
    document.documentElement.style.setProperty(
      "--tabs-sticky-h",
      `${tabs.offsetHeight}px`
    );
  };

  sync();
  const ro = new ResizeObserver(sync);
  ro.observe(tabs);
  window.addEventListener("resize", sync);
}

function applyPortfolioColWidth(col: PortfolioCol, width: number, min: number) {
  document
    .querySelectorAll<HTMLElement>(
      `.portfolio-thead-table th[data-col="${col}"], .portfolio-table col[data-col="${col}"]`
    )
    .forEach((el) => {
      el.style.width = `${width}px`;
      el.style.minWidth = `${min}px`;
    });
}

function bindPortfolioTableScroll() {
  const panel = document.querySelector<HTMLElement>(".portfolio-panel");
  const wrap = document.querySelector<HTMLElement>(".table-scroll-wrap");
  if (!panel || !wrap) return;

  const top = panel.querySelector<HTMLElement>(".table-scroll-top");
  const head = panel.querySelector<HTMLElement>(".portfolio-thead-scroll");
  const main = wrap.querySelector<HTMLElement>(".table-scroll");
  const inner = panel.querySelector<HTMLElement>(".table-scroll-top-inner");
  const table =
    wrap.querySelector<HTMLTableElement>(".portfolio-body-table") ??
    wrap.querySelector<HTMLTableElement>(".portfolio-table");
  if (!top || !main || !inner || !table) return;

  const scrollers = [top, main, head].filter(Boolean) as HTMLElement[];
  let syncing = false;

  const setAllScrollLeft = (from: HTMLElement) => {
    const left = from.scrollLeft;
    for (const el of scrollers) {
      if (el !== from) el.scrollLeft = left;
    }
  };

  const update = () => {
    inner.style.width = `${table.offsetWidth}px`;
    const needsScroll = table.offsetWidth > main.clientWidth + 1;
    top.style.display = needsScroll ? "" : "none";
    if (needsScroll && !syncing) {
      syncing = true;
      setAllScrollLeft(main);
      syncing = false;
    }
  };

  const onScroll = (ev: Event) => {
    if (syncing) return;
    syncing = true;
    setAllScrollLeft(ev.currentTarget as HTMLElement);
    syncing = false;
  };

  update();
  for (const el of scrollers) el.addEventListener("scroll", onScroll);

  const ro = new ResizeObserver(update);
  ro.observe(table);
  ro.observe(main);
  window.addEventListener("resize", update);
}

function bindPortfolioColResize() {
  const table = document.querySelector<HTMLTableElement>(".portfolio-thead-table");
  if (!table) return;

  table.querySelectorAll<HTMLElement>("[data-col-resize]").forEach((handle) => {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const col = handle.dataset.colResize as PortfolioCol | undefined;
      if (!col) return;
      const th = handle.closest<HTMLTableCellElement>("th");
      if (!th) return;

      const min = measureColMinWidth(measureLabelForCol(col), col);
      const startX = e.clientX;
      const startW = th.getBoundingClientRect().width;
      const pointerId = e.pointerId;
      handle.setPointerCapture(pointerId);
      document.body.classList.add("col-resizing");

      const onMove = (ev: PointerEvent) => {
        const next = Math.max(min, Math.round(startW + (ev.clientX - startX)));
        applyPortfolioColWidth(col, next, min);
      };

      const onUp = (ev: PointerEvent) => {
        handle.releasePointerCapture(pointerId);
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
        handle.removeEventListener("pointercancel", onUp);
        document.body.classList.remove("col-resizing");

        const finalW = Math.max(min, Math.round(th.getBoundingClientRect().width));
        const widths = loadColWidths();
        widths[col] = finalW;
        saveColWidths(widths);
        applyPortfolioColWidth(col, finalW, min);
        void ev;
      };

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onUp);
    });
  });
}

async function downloadRequirementsDoc() {
  const btn = document.querySelector<HTMLButtonElement>("#downloadReqsBtn");
  const prevLabel = btn?.textContent ?? "Требования PDF (BR / UC / FR / NFR)";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "PDF…";
  }

  const base = import.meta.env.BASE_URL || "./";
  const url = new URL(
    "VI-Planer-requirements.md",
    new URL(base, window.location.href),
  ).href;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const markdown = await res.text();
    await downloadMarkdownAsPdf(markdown, "VI-Planer-requirements.pdf");
  } catch (err) {
    console.error(err);
    alert("Не удалось создать PDF требований");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  }
}

function buildPlanerReportData(
  rollups: ItemSchedule[],
  slices: ScheduledSlice[],
): PlanerReportData {
  const active = state.items.filter((i) => i.status !== "done");
  const products = active.filter((i) => i.type === "product").length;
  const projects = active.filter((i) => i.type === "project").length;
  const multi = active.filter((i) => i.assignments.length > 1).length;
  const ends = rollups.map((s) => s.endWeek);
  const horizon = ends.length ? Math.max(...ends) + 1 : 0;
  const overloaded = state.teams.filter((t) => {
    const demandDays = teamQueuePw(slices, t.id);
    return demandDays > t.capacityPw * 8;
  }).length;
  const mode = activeScheduleMode();
  const modeMeta = SCHEDULE_MODE_META[mode];
  const items = filteredItems(rollups);

  const portfolioRows = items.map((item) => {
    const container = productProjectName(item.backlog);
    const typeLabel =
      item.type === "product"
        ? container
          ? `Продукт · ${container}`
          : "Продукт"
        : container
          ? `Проект · ${container}`
          : "Проект";
    const teamBits = item.assignments
      .map((a) => {
        const t = teamById(a.teamId);
        return t?.name ?? a.teamId;
      })
      .join(", ");
    return {
      priority: String(item.manualRank ?? "—"),
      type: typeLabel,
      title: item.title,
      teams: teamBits || "—",
      status: statusLabel(item.status),
      rice: String(rice(item, szRanges())),
      cashFlow: formatMlrd(item.cashFlow12m),
      roi: formatPercent(item.roi12m),
      estimate: `${sizesSummary(item)} (~${totalEstimateWeeks(item, szRanges())} чел·нед)`,
      eta: (() => {
        const finish = itemFinishDate(item, state.startDate, szRanges());
        return finish ? formatDate(finish) : "—";
      })(),
    };
  });

  return {
    generatedAt: new Date().toLocaleString("ru-RU"),
    planStart: formatDate(state.startDate),
    scheduleModeLabel: modeMeta.label,
    scheduleModeHint: modeMeta.hint,
    metrics: [
      {
        label: "Активных в портфеле",
        value: String(active.length),
        hint: `${products} продуктов · ${projects} проектов · ${multi} кросс-командных`,
      },
      {
        label: "Горизонт портфеля",
        value: `${horizon} нед.`,
        hint: "до закрытия (по bottleneck-команде)",
      },
      {
        label: "Команд под риском",
        value: String(overloaded),
        hint: "очередь длиннее 8 недель",
      },
      {
        label: "Старт планирования",
        value: formatDate(state.startDate),
        hint: "якорь шкалы Gantt (пн)",
      },
    ],
    portfolioRows,
    teams: state.teams.map((t) => ({
      name: t.name,
      capacity: `${t.capacityPw} чел·нед/нед`,
    })),
  };
}

function ganttPdfWeekLabelStep(weeks: number): number {
  if (weeks <= 16) return 1;
  if (weeks <= 28) return 2;
  return 4;
}

function buildGanttPdfData(): GanttPdfData {
  const ranges = szRanges();
  const bars = collectGanttRoleBars(ranges);
  const contentWeeks =
    bars.length === 0
      ? 0
      : Math.max(...bars.map((b) => b.endWeek)) + 1;
  const weeks = Math.max(
    4,
    Math.min(52, Math.max(Math.round(ui.ganttWeeks) || 16, contentWeeks))
  );
  const prioMap = projectPrioMap();
  const step = ganttPdfWeekLabelStep(weeks);

  const weekTicks = Array.from({ length: weeks }, (_, w) => {
    const monday = addWeeks(state.startDate, w);
    const [, m, d] = monday.split("-");
    const showLabel = w === 0 || w === weeks - 1 || w % step === 0;
    return {
      index: w,
      weekLabel: `Н${w + 1}`,
      dateLabel: `${d}.${m}`,
      showLabel,
    };
  });

  const monthBands: GanttPdfData["monthBands"] = [];
  for (let w = 0; w < weeks; w++) {
    const monday = addWeeks(state.startDate, w);
    const label = new Date(`${monday}T12:00:00`).toLocaleDateString("ru-RU", {
      month: "short",
      year: "numeric",
    });
    const last = monthBands[monthBands.length - 1];
    if (last && last.label === label) last.weekCount += 1;
    else monthBands.push({ label, startWeek: w, weekCount: 1 });
  }

  const barsByItem = new Map<string, typeof bars>();
  for (const bar of bars) {
    const list = barsByItem.get(bar.item.id);
    if (list) list.push(bar);
    else barsByItem.set(bar.item.id, [bar]);
  }

  const items = sortByPriority(
    demandProjectItems().filter(
      (it) => it.status !== "done" && barsByItem.has(it.id)
    ),
    ranges
  );
  const groups = groupByProjectKey(items).sort((a, b) => {
    const pa = prioMap.get(a.key) ?? 9999;
    const pb = prioMap.get(b.key) ?? 9999;
    return pa - pb;
  });

  const teamIds = new Set(bars.map((b) => b.teamId));
  const teams = state.teams
    .filter((t) => teamIds.has(t.id))
    .map((t) => ({ name: t.name, color: t.color }));

  const projects = groups.map((g) => ({
    title: g.title,
    priority: String(prioMap.get(g.key) ?? ""),
    functions: g.items.map((item) => {
      const itemBars = barsByItem.get(item.id) ?? [];
      return {
        title: item.title,
        bars: itemBars.map((b) => {
          const team = teamById(b.teamId);
          return {
            label: `${shortFio(b.memberName)} · ${b.role.name}`,
            color: team?.color ?? "#484f55",
            startWeek: b.startWeek,
            endWeek: b.endWeek,
          };
        }),
      };
    }),
  }));

  return {
    generatedAt: new Date().toLocaleString("ru-RU"),
    planStart: formatDate(state.startDate),
    weeks,
    monthBands,
    weekTicks,
    teams,
    projects,
  };
}

async function exportPortfolioReportPdf() {
  const btn = document.querySelector<HTMLButtonElement>("#exportPdfBtn");
  const prevLabel = btn?.textContent ?? "Экспорт PDF";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "PDF…";
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const exportGantt = ui.tab === "timeline";
  const filename = exportGantt
    ? `VI-Planer-gantt-${stamp}.pdf`
    : `VI-Planer-report-${stamp}.pdf`;

  try {
    if (exportGantt) {
      await downloadGanttSchematicPdf(buildGanttPdfData(), filename);
    } else {
      const { slices, rollups } = scheduleState();
      const data = buildPlanerReportData(rollups, slices);
      await downloadPlanerReportPdf(data, filename);
    }
  } catch (err) {
    console.error(err);
    alert("Не удалось создать PDF. Попробуйте ещё раз или обновите страницу.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  }
}

async function bootstrap() {
  state = ensureStateAssignmentRoles(await loadState());
  ui.hiddenCols = loadHiddenCols();
  ui.scheduleMode = loadScheduleMode();
  saveScheduleMode(ui.scheduleMode);
  ui.tab = readStoredUiTab();
  ensureVisibleTab();
  const ranked = ensureUniquePriorities(state.items, szRanges());
  const ranksChanged = ranked.some(
    (item, i) => item.manualRank !== state.items[i]?.manualRank
  );
  state = { ...state, items: ranked };
  if (ranksChanged) saveState(state);
  onSyncStatusChange((status) => {
    const el = document.querySelector<HTMLElement>("#syncStatus");
    if (!el) return;
    el.dataset.status = status;
    el.textContent = syncStatusLabel(status);
  });
  render();
}

bootstrap();
