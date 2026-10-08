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
  type PriorityLogEntry,
  sanitizeLinks,
  sortPriorityLog,
  PRIORITY_LOG_MAX,
  snapToMonday,
  addDays,
  addWeeks,
  addMonths,
  ensureUniquePriorities,
  findPriorityConflict,
  nextPriority,
  moveItemToPriority,
  reorderVisiblePriority,
  orderedProjectGroups,
  moveProjectGroupToPriority,
  moveFunctionalityWithinProject,
  functionalityPriorityMap,
  projectGroupKey,
  functionalityItems,
  TeamLoadWeek,
  Team,
  scheduledOverloadWeeks,
  isTeamWeekOverloaded,
  utilizationPct,
  nearestSizeFromDays,
  SCHEDULE_CAPACITY_PW,
  assignmentPlanDays,
  assignmentPlanWeeks,
  itemFinishDate,
  itemStartDate,
  projectFinishDate,
  projectScheduleStartDate,
  baselineDurationDays,
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
  syncTeamRosters,
  syncTeamRoster,
  AssignmentRole,
  fillAssignmentRoles,
  rolePlanDays,
  roleTimelineDays,
  roleIsUnderPlan,
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
import { V2_UI_TAB_KEY } from "./v2Store";
import {
  downloadMarkdownAsPdf,
  downloadPlanerReportPdf,
  downloadGanttSchematicPdf,
  type PlanerReportData,
  type GanttPdfData,
} from "./pdfExport";

/** Release / deploy stamp in the header (DD.MM.YYYY) */
const RELEASE_UPDATED = "08.10.2026";

type Tab =
  | "portfolio"
  | "demand"
  | "planning"
  | "timeline"
  | "timelineFact"
  | "demoA"
  | "demoB"
  | "capacity"
  | "changelog"
  | "settings";
type SortKey = "priority" | "eta" | "cashFlow" | "roi";
type SortDir = "asc" | "desc";
type GanttScale = "week" | "month" | "quarter";
type GanttDepthMonths = 3 | 6 | 9 | 12;
/** Max tree level shown on Gantt (project … assignee). */
type GanttTreeLevel = "project" | "fn" | "team" | "role";

const TAB_LABELS: Record<Tab, string> = {
  portfolio: "Реестр",
  timeline: "Гантт (План)",
  timelineFact: "Гантт (Факт)",
  demand: "Потребность",
  planning: "Планирование",
  demoA: "Мониторинг",
  demoB: "Мониторинг",
  capacity: "Команды",
  changelog: "Журнал",
  settings: "Настройки",
};

/** Soft UI gates removed — everyone can use all features. */
function currentCan(_permission?: string, _teamId?: string): boolean {
  return true;
}

function canAccessTab(_tab: Tab): boolean {
  return true;
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
  timelineFact:
    '<rect x="2" y="3" width="7.6" height="2.3" rx="0.6"/><rect x="4.2" y="6.85" width="9.8" height="2.3" rx="0.6"/><rect x="3.1" y="10.7" width="6.2" height="2.3" rx="0.6"/><path d="M11.2 11.2l1.1 1.1 2.2-2.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  demoA:
    '<rect x="2.2" y="2.4" width="11.6" height="8.1" rx="1.3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6.6 10.5v2.2h2.8v-2.2M5.2 13.2h5.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  demoB:
    '<rect x="2.2" y="2.4" width="11.6" height="8.1" rx="1.3" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6.6 10.5v2.2h2.8v-2.2M5.2 13.2h5.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
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
  const quiet =
    id === "capacity" || id === "changelog" || id === "settings";
  const cls = ["tab", extraClass, ui.tab === id ? "active" : ""]
    .filter(Boolean)
    .join(" ");
  return `<button type="button" class="${cls}" data-tab="${id}">${tabIconHtml(id, quiet)}${escapeHtml(TAB_LABELS[id])}</button>`;
}

/** Legacy deep-link / tab ids: `teams`/`queuesTest` → Реестр; `jiraApi` → Настройки. */
function normalizeTab(tab: string | undefined | null): Tab {
  if (tab === "teams" || tab === "queuesTest") return "portfolio";
  if (tab === "roles") return "capacity";
  if (tab === "projects") return "portfolio";
  if (tab === "jiraApi") return "settings";
  if (
    tab === "portfolio" ||
    tab === "demand" ||
    tab === "planning" ||
    tab === "timeline" ||
    tab === "timelineFact" ||
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
  if ((ui.tab as string) === "jiraApi") ui.tab = "settings";
  if ((ui.tab as string) === "queuesTest" || (ui.tab as string) === "teams") {
    ui.tab = "portfolio";
  }
  if (!canAccessTab(ui.tab)) {
    const fallback: Tab[] = [
      "portfolio",
      "timeline",
      "timelineFact",
      "demand",
      "planning",
      "demoA",
      "capacity",
      "changelog",
      "settings",
    ];
    ui.tab = fallback.find((t) => canAccessTab(t)) ?? "portfolio";
  }
  if (ui.tab !== prev) writeStoredUiTab(ui.tab);
}

interface UiState {
  /** Журнал: priority-change reasons or the general activity log. */
  journalView: "priority" | "all";
  /** Журнал → приоритеты: project filter ("" = all). */
  journalProject: string;
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
  /** Gantt axis unit: week ticks or month bands */
  ganttScale: GanttScale;
  /** Gantt display depth: 3 / 6 / 9 / 12 months */
  ganttDepthMonths: GanttDepthMonths;
  /** Gantt hierarchy cutoff: project … role/assignee */
  ganttTreeLevel: GanttTreeLevel;
  /** Гантт/факт — independent of Гантт filters/collapse */
  ganttFactScale: GanttScale;
  ganttFactDepthMonths: GanttDepthMonths;
  ganttFactTreeLevel: GanttTreeLevel;
  ganttFactCollapsedProjects: Record<string, true>;
  ganttFactCollapsedItems: Record<string, true>;
  ganttFactCollapsedTeams: Record<string, true>;
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
  /** Expanded project keys in Реестр (show nested functionalities) */
  portfolioExpandedProjects: Record<string, true>;
  /** Selected catalog teams on Планирование (Моя команда) */
  planTeamIds: string[];
  /** True when the user cleared the team filter (empty ≠ default first team). */
  planTeamFilterCleared: boolean;
  /** Last-clicked team chip (stronger highlight) */
  planFocusTeamId: string | null;
  /** Планирование: show only person-conflict rows */
  planConflictsOnly: boolean;
  planCollapsedProjects: Record<string, true>;
  planCollapsedItems: Record<string, true>;
  ganttCollapsedProjects: Record<string, true>;
  ganttCollapsedItems: Record<string, true>;
  /** Collapsed team rows under a Gantt functionality (`itemId:teamId`). */
  ganttCollapsedTeams: Record<string, true>;
  /**
   * Inline timeline placement. `days` = scheduled length (may differ from plan);
   * plan days are never overwritten from this form.
   */
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
    hint: "Старты = даты в карточке; параллельная работа может пересекаться по неделям.",
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
  journalView: "priority",
  journalProject: "",
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
  ganttScale: "week",
  ganttDepthMonths: 6,
  ganttTreeLevel: "role",
  ganttFactScale: "week",
  ganttFactDepthMonths: 6,
  ganttFactTreeLevel: "role",
  ganttFactCollapsedProjects: {},
  ganttFactCollapsedItems: {},
  ganttFactCollapsedTeams: {},
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
  portfolioExpandedProjects: {},
  planTeamIds: [],
  planTeamFilterCleared: false,
  planFocusTeamId: null,
  planConflictsOnly: false,
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

/** Team chip with size estimate for Реестр. `moreCount` — свёрнутый «+N» у правого края. */
function teamChipWithEstimateHtml(
  a: TeamAssignment,
  moreCount = 0
): string {
  const t = teamById(a.teamId);
  const name = t?.name ?? a.teamId;
  const size = a.size;
  const weeks = assignmentPlanWeeks(a, szRanges());
  const tip = `${name} · ${size} · ~${weeks} чел·нед`;
  const more =
    moreCount > 0
      ? `<span class="portfolio-teams-more">+${moreCount}</span>`
      : "";
  return `<span class="team-chip team-chip-with-est" aria-label="${escapeAttr(tip)}">
    <span class="team-chip-name">
      <span class="team-dot" style="background:${t?.color ?? "#93999e"}"></span>
      <span class="team-chip-text">${escapeHtml(name)}</span>
    </span>
    <span class="team-chip-estimate">
      <span class="team-chip-est-text">(${escapeHtml(size)} · ~${weeks}н)</span>${more}
    </span>
  </span>`;
}

/** Реестр: one team → chip; several → only «люди N команд», all teams + estimates on click. */
function teamsCellHtml(item: WorkItem): string {
  const assigns = item.assignments;
  if (!assigns.length) return `<span class="muted">—</span>`;
  if (assigns.length === 1) {
    return `<div class="portfolio-teams is-single">${teamChipWithEstimateHtml(assigns[0]!)}</div>`;
  }
  const ranges = szRanges();
  let totalWeeks = 0;
  const rows = assigns
    .map((a) => {
      const t = teamById(a.teamId);
      const weeks = assignmentPlanWeeks(a, ranges);
      totalWeeks += weeks;
      return `<li class="teams-pop-li teams-pop-li-est"><span class="team-dot" style="background:${t?.color ?? "#93999e"}"></span><span class="teams-pop-name">${escapeHtml(t?.name ?? a.teamId)}</span><span class="teams-pop-size">${escapeHtml(a.size)}</span><span class="teams-pop-weeks">~${weeks} чел·нед</span></li>`;
    })
    .join("");
  const names = assigns.map((a) => teamById(a.teamId)?.name ?? a.teamId);
  const n = assigns.length;
  const n10 = n % 10;
  const n100 = n % 100;
  const word =
    n10 === 1 && n100 !== 11
      ? "команда"
      : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)
        ? "команды"
        : "команд";
  const pop = teamsPopHtml({
    count: n,
    countLabel: `${n} ${word}`,
    aria: `Команды и оценки: ${names.join(", ")}`,
    head: `Команды и оценки (${assigns.length})`,
    listHtml: `<ul class="teams-pop-list teams-pop-list-est">${rows}</ul><div class="teams-pop-total"><span>Итого</span><span>~${totalWeeks} чел·нед</span></div>`,
  });
  return `<div class="portfolio-teams has-pop">${pop}</div>`;
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
    if (ui.sortKey === "cashFlow") {
      cmp = compareNullableNum(a.cashFlow12m, b.cashFlow12m, dir);
    } else if (ui.sortKey === "roi") {
      cmp = compareNullableNum(a.roi12m, b.roi12m, dir);
    } else {
      const ea = byId.get(a.id)?.endDate ?? "9999-99-99";
      const eb = byId.get(b.id)?.endDate ?? "9999-99-99";
      cmp = (ea < eb ? -1 : ea > eb ? 1 : 0) * dir;
    }
    if (cmp !== 0) return cmp;
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
const GANTT_SCALE_KEY = "vi-planer-gantt-scale";
const GANTT_DEPTH_KEY = "vi-planer-gantt-depth";
const GANTT_TREE_LEVEL_KEY = "vi-planer-gantt-tree-level";
/** Independent from Гантт — Гантт/факт view prefs */
const GANTT_FACT_SCALE_KEY = "vi-planer-gantt-fact-scale";
const GANTT_FACT_DEPTH_KEY = "vi-planer-gantt-fact-depth";
const GANTT_FACT_TREE_LEVEL_KEY = "vi-planer-gantt-fact-tree-level";
const GANTT_DEPTH_OPTIONS: GanttDepthMonths[] = [3, 6, 9, 12];
/** Max weeks for 12‑month horizon (~52–53). */
const GANTT_WEEKS_MAX = 56;
const GANTT_TREE_LEVEL_OPTIONS: {
  id: GanttTreeLevel;
  label: string;
  head: string;
}[] = [
  {
    id: "project",
    label: "Проект",
    head: "Проект",
  },
  {
    id: "fn",
    label: "Проект → функциональность",
    head: "Проект / функциональность",
  },
  {
    id: "team",
    label: "Проект → функциональность → команда",
    head: "Проект / функциональность / команда",
  },
  {
    id: "role",
    label: "Проект → функциональность → команда → исполнитель",
    head: "Проект / функциональность / команда / исполнитель",
  },
];
const MONTH_SHORT_RU = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

function normalizeGanttScale(raw: string | null | undefined): GanttScale {
  if (raw === "month" || raw === "quarter") return raw;
  return "week";
}

function normalizeGanttDepth(raw: string | number | null | undefined): GanttDepthMonths {
  const n = typeof raw === "number" ? raw : Number(raw);
  return (GANTT_DEPTH_OPTIONS as number[]).includes(n)
    ? (n as GanttDepthMonths)
    : 6;
}

function loadGanttScale(): GanttScale {
  try {
    return normalizeGanttScale(localStorage.getItem(GANTT_SCALE_KEY));
  } catch {
    return "week";
  }
}

function saveGanttScale(scale: GanttScale): void {
  try {
    localStorage.setItem(GANTT_SCALE_KEY, scale);
  } catch {
    /* ignore */
  }
}

function loadGanttDepth(): GanttDepthMonths {
  try {
    return normalizeGanttDepth(localStorage.getItem(GANTT_DEPTH_KEY));
  } catch {
    return 6;
  }
}

function saveGanttDepth(depth: GanttDepthMonths): void {
  try {
    localStorage.setItem(GANTT_DEPTH_KEY, String(depth));
  } catch {
    /* ignore */
  }
}

function normalizeGanttTreeLevel(
  raw: string | null | undefined
): GanttTreeLevel {
  if (raw === "project" || raw === "fn" || raw === "team" || raw === "role") {
    return raw;
  }
  return "role";
}

function loadGanttTreeLevel(): GanttTreeLevel {
  try {
    return normalizeGanttTreeLevel(localStorage.getItem(GANTT_TREE_LEVEL_KEY));
  } catch {
    return "role";
  }
}

function saveGanttTreeLevel(level: GanttTreeLevel): void {
  try {
    localStorage.setItem(GANTT_TREE_LEVEL_KEY, level);
  } catch {
    /* ignore */
  }
}

function loadGanttFactScale(): GanttScale {
  try {
    return normalizeGanttScale(localStorage.getItem(GANTT_FACT_SCALE_KEY));
  } catch {
    return "week";
  }
}

function saveGanttFactScale(scale: GanttScale): void {
  try {
    localStorage.setItem(GANTT_FACT_SCALE_KEY, scale);
  } catch {
    /* ignore */
  }
}

function loadGanttFactDepth(): GanttDepthMonths {
  try {
    return normalizeGanttDepth(localStorage.getItem(GANTT_FACT_DEPTH_KEY));
  } catch {
    return 6;
  }
}

function saveGanttFactDepth(depth: GanttDepthMonths): void {
  try {
    localStorage.setItem(GANTT_FACT_DEPTH_KEY, String(depth));
  } catch {
    /* ignore */
  }
}

function loadGanttFactTreeLevel(): GanttTreeLevel {
  try {
    return normalizeGanttTreeLevel(
      localStorage.getItem(GANTT_FACT_TREE_LEVEL_KEY)
    );
  } catch {
    return "role";
  }
}

function saveGanttFactTreeLevel(level: GanttTreeLevel): void {
  try {
    localStorage.setItem(GANTT_FACT_TREE_LEVEL_KEY, level);
  } catch {
    /* ignore */
  }
}

function ganttTreeLevelMeta(level: GanttTreeLevel = ui.ganttTreeLevel) {
  return (
    GANTT_TREE_LEVEL_OPTIONS.find((o) => o.id === level) ??
    GANTT_TREE_LEVEL_OPTIONS[GANTT_TREE_LEVEL_OPTIONS.length - 1]!
  );
}

function ganttTreeLevelFilterHtml(
  level: GanttTreeLevel,
  dataAttr = "gantt-tree-level"
): string {
  const current = ganttTreeLevelMeta(level);
  const items = GANTT_TREE_LEVEL_OPTIONS.map(
    (o) =>
      `<button type="button" class="gantt-tree-opt${o.id === level ? " is-active" : ""}" data-${dataAttr}="${o.id}" role="option" aria-selected="${o.id === level ? "true" : "false"}">${escapeHtml(o.label)}</button>`
  ).join("");
  return `
    <div class="gantt-seg gantt-tree-filter" role="group" aria-label="Вложенность">
      <span class="gantt-seg-label">Вложенность</span>
      <details class="gantt-tree-picker">
        <summary class="gantt-seg-select gantt-tree-summary" aria-label="Вложенность дерева Гантта">
          <span class="gantt-tree-summary-text">${escapeHtml(current.label)}</span>
        </summary>
        <div class="gantt-tree-menu" role="listbox" aria-label="Уровень вложенности">${items}</div>
      </details>
    </div>`;
}

/** Weeks covering planStart .. planStart + depth months. */
function ganttHorizonWeeks(depth: GanttDepthMonths = ui.ganttDepthMonths): number {
  const end = addMonths(state.startDate, depth);
  const weeks = weekIndex(state.startDate, end) + 1;
  return Math.max(4, Math.min(GANTT_WEEKS_MAX, weeks));
}

/** Independent horizon for Мониторинг (not tied to Gantt depth). */
const DEMO_HORIZON_WEEKS = 16;

function formatMonthShortRu(iso: string): string {
  const m = Number(iso.slice(5, 7)) - 1;
  const y = iso.slice(2, 4);
  return `${MONTH_SHORT_RU[m] ?? "—"} ’${y}`;
}

type GanttAxisBand = {
  startWeek: number;
  endWeek: number;
  label: string;
};

function ganttAxisBandsByKey(
  planStart: string,
  weeks: number,
  keyOf: (iso: string) => string,
  labelOf: (iso: string) => string
): GanttAxisBand[] {
  const bands: GanttAxisBand[] = [];
  let w = 0;
  while (w < weeks) {
    const monday = addWeeks(planStart, w);
    const key = keyOf(monday);
    let end = w;
    while (end + 1 < weeks && keyOf(addWeeks(planStart, end + 1)) === key) {
      end += 1;
    }
    bands.push({
      startWeek: w,
      endWeek: end,
      label: labelOf(monday),
    });
    w = end + 1;
  }
  return bands;
}

function ganttMonthBands(planStart: string, weeks: number): GanttAxisBand[] {
  return ganttAxisBandsByKey(
    planStart,
    weeks,
    (iso) => iso.slice(0, 7),
    formatMonthShortRu
  );
}

function formatQuarterRu(iso: string): string {
  const m = Number(iso.slice(5, 7));
  const q = Math.ceil(m / 3);
  const y = iso.slice(2, 4);
  const romans = ["I", "II", "III", "IV"] as const;
  return `${romans[q - 1] ?? "—"} кв. ’${y}`;
}

function ganttQuarterBands(planStart: string, weeks: number): GanttAxisBand[] {
  return ganttAxisBandsByKey(
    planStart,
    weeks,
    (iso) => {
      const y = iso.slice(0, 4);
      const q = Math.ceil(Number(iso.slice(5, 7)) / 3);
      return `${y}-Q${q}`;
    },
    formatQuarterRu
  );
}

function ganttScaleBands(
  planStart: string,
  weeks: number,
  scale: GanttScale
): GanttAxisBand[] | null {
  if (scale === "month") return ganttMonthBands(planStart, weeks);
  if (scale === "quarter") return ganttQuarterBands(planStart, weeks);
  return null;
}

function ganttScaleToggleHtml(
  scale: GanttScale,
  dataAttr = "gantt-scale"
): string {
  return `
    <div class="gantt-seg" role="group" aria-label="Диапазон">
      <span class="gantt-seg-label">Диапазон</span>
      <div class="gantt-seg-btns">
        <button type="button" class="gantt-seg-btn${scale === "week" ? " is-active" : ""}" data-${dataAttr}="week">Неделя</button>
        <button type="button" class="gantt-seg-btn${scale === "month" ? " is-active" : ""}" data-${dataAttr}="month">Месяц</button>
        <button type="button" class="gantt-seg-btn${scale === "quarter" ? " is-active" : ""}" data-${dataAttr}="quarter">Квартал</button>
      </div>
    </div>`;
}

function ganttDepthToggleHtml(
  depth: GanttDepthMonths,
  dataAttr = "gantt-depth"
): string {
  const btns = GANTT_DEPTH_OPTIONS.map(
    (m) =>
      `<button type="button" class="gantt-seg-btn${depth === m ? " is-active" : ""}" data-${dataAttr}="${m}">${m} мес.</button>`
  ).join("");
  return `
    <div class="gantt-seg" role="group" aria-label="Глубина">
      <span class="gantt-seg-label">Глубина</span>
      <div class="gantt-seg-btns">${btns}</div>
    </div>`;
}

/** Compact plan-start date control for Гантт / Планирование toolbars. */
function planStartCtrlHtml(editable = currentCan("settings.plan")): string {
  const disabled = editable ? "" : " disabled";
  return `
    <label class="gantt-seg plan-start-ctrl plan-start-anchor" title="Якорь шкалы недель (округляется к понедельнику)">
      <span class="gantt-seg-label">Старт планирования</span>
      <input
        type="date"
        class="plan-start-date-input gantt-plan-start-input"
        value="${state.startDate}"
        aria-label="Старт планирования"
        ${disabled}
      />
    </label>`;
}

type PortfolioCol =
  | "priority"
  | "title"
  | "jira"
  | "teams"
  | "status"
  | "cashFlow"
  | "roi"
  | "payback"
  | "startDate"
  | "eta"
  | "baselineDuration";

type HideablePortfolioCol = Exclude<PortfolioCol, "priority" | "title">;

const HIDEABLE_PORTFOLIO_COLS: HideablePortfolioCol[] = [
  "jira",
  "teams",
  "status",
  "cashFlow",
  "roi",
  "payback",
  "startDate",
  "eta",
  "baselineDuration",
];

const ALL_PORTFOLIO_COLS: PortfolioCol[] = [
  "priority",
  "title",
  "jira",
  "teams",
  "status",
  "cashFlow",
  "roi",
  "payback",
  "startDate",
  "eta",
  "baselineDuration",
];

const PORTFOLIO_COL_LABELS: Record<PortfolioCol, string> = {
  priority: "Приоритет",
  title: "Проект",
  jira: "Jira",
  teams: "Команды и оценки",
  status: "Статус",
  cashFlow: "ЧП, тыс. руб, 12 мес",
  roi: "ROI, %, 12 мес",
  payback: "Срок окупаемости",
  startDate: "Дата начала",
  eta: "Дата завершения",
  baselineDuration: "Срок реализации",
};

/** Narrow metric cols; keep finance compact so the table does not explode horizontally. */
const PORTFOLIO_COL_DEFAULTS: Record<PortfolioCol, number> = {
  priority: 96,
  title: 280,
  jira: 88,
  teams: 260,
  status: 130,
  cashFlow: 110,
  roi: 96,
  payback: 110,
  startDate: 120,
  eta: 168,
  baselineDuration: 120,
};

/** Labels used only for min-width measurement (stacked unit lines must not widen cols). */
const PORTFOLIO_COL_MEASURE_LABELS: Partial<Record<PortfolioCol, string>> = {
  cashFlow: "ЧП, тыс. руб",
  roi: "ROI, %",
  payback: "Окупаемость",
  baselineDuration: "Срок баз.",
};

function loadColWidths(): Partial<Record<PortfolioCol, number>> {
  try {
    const raw = localStorage.getItem(COL_WIDTH_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    // Drop legacy WSJF / RICE column widths.
    if (parsed.wsjf != null) delete parsed.wsjf;
    if (parsed.rice != null) delete parsed.rice;
    // Drop prior finance defaults so 12/24 stacked column widths apply.
    let migrated = false;
    for (const key of ["cashFlow", "roi"] as const) {
      if (parsed[key] === 110 || parsed[key] === 84 || parsed[key] === 76) {
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

function loadHiddenCols(): HideablePortfolioCol[] {
  try {
    const raw = localStorage.getItem(COL_VISIBILITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c) => c !== "wsjf" && c !== "rice" && c !== "estimate")
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

function colPixelWidth(col: PortfolioCol): number {
  const stored = loadColWidths()[col];
  const min = measureColMinWidth(measureLabelForCol(col), col);
  return Math.max(min, stored ?? PORTFOLIO_COL_DEFAULTS[col]);
}

function colWidthStyle(col: PortfolioCol): string {
  const min = measureColMinWidth(measureLabelForCol(col), col);
  const width = colPixelWidth(col);
  return `width:${width}px;min-width:${min}px`;
}

/**
 * Sum of visible column widths — keep thead/body tables the same pixel width.
 * `override` supplies live drag widths not yet written to localStorage.
 */
function portfolioTablePixelWidth(
  override?: Partial<Record<PortfolioCol, number>>
): number {
  return ALL_PORTFOLIO_COLS.filter((col) => isColVisible(col)).reduce(
    (sum, col) => sum + (override?.[col] ?? colPixelWidth(col)),
    0
  );
}

function portfolioTableWidthStyle(): string {
  const w = portfolioTablePixelWidth();
  return `width:${w}px;min-width:${w}px`;
}

function syncPortfolioTableWidths(
  override?: Partial<Record<PortfolioCol, number>>
): void {
  const w = portfolioTablePixelWidth(override);
  document
    .querySelectorAll<HTMLTableElement>(
      ".portfolio-thead-table, .portfolio-body-table"
    )
    .forEach((table) => {
      table.style.width = `${w}px`;
      table.style.minWidth = `${w}px`;
    });
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
    eta: "eta",
    cashFlow: "cashFlow",
    roi: "roi",
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
    ${resizableTh("Jira", "jira", "jira-cell")}
    ${resizableTh("Команды и оценки", "teams")}
    ${resizableTh("Статус", "status", "status-cell")}
    ${resizableTh("ЧП, тыс. руб", "cashFlow", "finance-cell", "cashFlow", "12 мес")}
    ${resizableTh("ROI, %", "roi", "finance-cell", "roi", "12 мес")}
    ${resizableTh("Срок окупаемости", "payback", "finance-cell")}
    ${resizableTh("Дата начала", "startDate", "eta-cell")}
    ${sortHeader("Дата завершения", "eta", "eta-cell")}
    ${resizableTh("Срок реализации", "baselineDuration", "eta-cell", undefined, "дни")}
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
    // priority: 1 first; ETA: sooner first; ЧП/ROI: larger first
    ui.sortDir =
      key === "cashFlow" || key === "roi" ? "desc" : "asc";
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
    const demandWeeks = teamQueuePw(slices, t.id);
    return demandWeeks > 8 * SCHEDULE_CAPACITY_PW;
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
        <div><span class="cols-help-k">Проект</span> — клик по названию раскрывает функциональности; по строке — карточка проекта</div>
        <div><span class="cols-help-k">Jira</span> — ключ задачи (пока заглушка)</div>
        <div><span class="cols-help-k">Команды и оценки</span> — команда + майка и ~чел·нед; первая + «+N», клик раскрывает список</div>
        <div><span class="cols-help-k">Статус</span> — стадия готовности</div>
        <div><span class="cols-help-k">ЧП, тыс. руб, 12 мес</span> — чистая прибыль (сумма по проекту); клик по заголовку — сортировка</div>
        <div><span class="cols-help-k">ROI, %, 12 мес</span> — ROI; клик по заголовку — сортировка</div>
        <div><span class="cols-help-k">Срок окупаемости</span> — из вкладки «влияние»; только чтение, мес.</div>
        <div><span class="cols-help-k">Дата начала</span> — самая ранняя дата среди назначений (как дата завершения, из плана)</div>
        <div><span class="cols-help-k">Дата завершения</span> — самая поздняя дата среди функциональностей и баров ролей</div>
        <div><span class="cols-help-k">Срок реализации</span> — календарные дни между датой начала и датой завершения; только чтение</div>
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

/** Nulls/non-finite always last; dir applies only to real numbers. */
function compareNullableNum(
  a: number | null | undefined,
  b: number | null | undefined,
  dir: number,
): number {
  const aOk = a != null && Number.isFinite(a);
  const bOk = b != null && Number.isFinite(b);
  if (!aOk && !bOk) return 0;
  if (!aOk) return 1;
  if (!bOk) return -1;
  return (a! - b!) * dir;
}

/** Project ЧП 12м: sum of item cashFlow12m. */
function projectCashFlow12m(items: WorkItem[]): number | null {
  const vals = items
    .map((it) => it.cashFlow12m)
    .filter((n): n is number => n != null && Number.isFinite(n));
  return vals.length ? vals.reduce((s, n) => s + n, 0) : null;
}

/** Project ROI 12м: single shared value, else null (cell shows «—»). */
function projectRoi12m(items: WorkItem[]): number | null {
  const rois = [
    ...new Set(
      items
        .map((it) => it.roi12m)
        .filter((n): n is number => n != null && Number.isFinite(n))
    ),
  ];
  return rois.length === 1 ? rois[0]! : null;
}

/** Project срок окупаемости: single shared value, else null. */
function projectPaybackMonths(items: WorkItem[]): number | null {
  const vals = [
    ...new Set(
      items
        .map((it) => it.paybackMonths)
        .filter((n): n is number => n != null && Number.isFinite(n))
    ),
  ];
  return vals.length === 1 ? vals[0]! : null;
}

function formatIsoDateOrDash(iso: string | null | undefined): string {
  if (!iso) return "—";
  return formatDate(iso);
}

/** Срок реализации: calendar days between schedule start and finish. */
function formatDurationDaysCell(
  start: string | null | undefined,
  finish: string | null | undefined
): string {
  const days = baselineDurationDays(start, finish);
  return days == null ? "—" : String(days);
}

function projectPrioMap(): Map<string, number> {
  return new Map(
    orderedProjectGroups(state.items, szRanges()).map((g, i) => [g.key, i + 1])
  );
}

function prioBadgeHtml(
  prio: number | string | null | undefined,
  title = "Приоритет проекта",
  extraClass = ""
): string {
  const cls = ["prio-mini", extraClass].filter(Boolean).join(" ");
  return `<span class="${cls}" title="${escapeAttr(title)}">${prio ?? "—"}</span>`;
}

function teamRosterFactLabel(team: Team): string {
  const people = team.members?.length ?? 0;
  const roles = resolveTeamRoleNames(team).length;
  return `${people} чел. · ${roles} рол.`;
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
  const financeDir = ui.sortDir === "asc" ? 1 : -1;
  const groups = groupByProjectKey(visible).sort((a, b) => {
    if (ui.sortKey === "cashFlow") {
      const cmp = compareNullableNum(
        projectCashFlow12m(a.items),
        projectCashFlow12m(b.items),
        financeDir,
      );
      if (cmp !== 0) return cmp;
      return a.title.localeCompare(b.title, "ru");
    }
    if (ui.sortKey === "roi") {
      const cmp = compareNullableNum(
        projectRoi12m(a.items),
        projectRoi12m(b.items),
        financeDir,
      );
      if (cmp !== 0) return cmp;
      return a.title.localeCompare(b.title, "ru");
    }
    const ia = Math.min(...a.items.map((it) => order.get(it.id) ?? 9999));
    const ib = Math.min(...b.items.map((it) => order.get(it.id) ?? 9999));
    return ia - ib;
  });
  const ranges = szRanges();
  const prioByKey = new Map(
    orderedProjectGroups(state.items, ranges).map((g, i) => [g.key, i + 1])
  );
  const projectCount = Math.max(1, prioByKey.size);
  const fnPrio = functionalityPriorityMap(state.items, ranges);

  const rows = groups
    .map((g) => {
      const prio = prioByKey.get(g.key) ?? 1;
      const assigns = uniqueAssignments(g.items);
      const teamItem: WorkItem = { ...g.items[0], assignments: assigns };
      const cash12 = projectCashFlow12m(g.items);
      const roi12 = projectRoi12m(g.items);
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
      const startIso =
        projectScheduleStartDate(g.items, state.startDate, ranges) ?? null;
      const finish = projectFinishDate(g.items, state.startDate, ranges);
      const finishWait = finish
        ? weekIndex(state.startDate, finish)
        : 0;
      const expanded = Boolean(ui.portfolioExpandedProjects[g.key]);
      const fnItems = functionalityItems(g.items);
      const fnCount = fnItems.length;
      const projectRow = `
        <tr class="clickable portfolio-row-project${expanded ? " is-expanded" : ""}" data-project-card="${escapeAttr(g.key)}" data-row-id="${escapeAttr(g.key)}" title="Открыть карточку проекта">
          <td${tdAttrs("priority", "prio-cell")} data-stop-edit>
            <input class="prio-input" type="number" min="1" max="${projectCount}" step="1" value="${prio}" data-project-prio="${escapeAttr(g.key)}" data-project-prio-now="${prio}" data-stop-edit aria-label="Приоритет проекта" />
          </td>
          <td${tdAttrs("title", "title-cell")}>
            <div class="portfolio-title-wrap">
              <button type="button" class="portfolio-expand-btn" data-portfolio-toggle="${escapeAttr(g.key)}" aria-expanded="${expanded ? "true" : "false"}" title="${expanded ? "Свернуть функциональности" : "Показать функциональности"}" data-stop-edit>
                <span class="portfolio-expand-chevron" aria-hidden="true"></span>
              </button>
              <button type="button" class="portfolio-project-name" data-portfolio-toggle="${escapeAttr(g.key)}" aria-expanded="${expanded ? "true" : "false"}" data-stop-edit>
                <span class="name">${escapeHtml(g.title)}</span>
                <span class="meta portfolio-fn-count">${fnCount} функц.</span>
              </button>
            </div>
          </td>
          <td${tdAttrs("jira", "jira-cell muted")}>todo</td>
          <td${tdAttrs("teams", "teams-cell")}>${teamsCellHtml(teamItem)}</td>
          <td${tdAttrs("status", "status-cell")} data-stop-edit>
            <select class="status-select ${statusClass}" data-project-status="${escapeAttr(g.key)}" data-status-was="${statusVal}" data-stop-edit aria-label="Статус проекта">${statusOpts}</select>
          </td>
          <td${tdAttrs("cashFlow", "finance-cell mono metric-num")}>${formatTys(cash12)}</td>
          <td${tdAttrs("roi", "finance-cell mono metric-num")}>${formatPercent(roi12)}</td>
          <td${tdAttrs("payback", "finance-cell mono metric-num")}>${formatPaybackMonths(projectPaybackMonths(g.items))}</td>
          <td${tdAttrs("startDate", "mono eta-cell")}>${formatIsoDateOrDash(startIso)}</td>
          <td${tdAttrs("eta", `mono eta-cell ${finish && finishWait > 4 ? "eta-late" : "eta-good"}`)}>
            ${finish ? `<span class="eta-final">${formatDate(finish)}</span>` : "—"}
          </td>
          <td${tdAttrs("baselineDuration", "mono eta-cell")}>${formatDurationDaysCell(startIso, finish)}</td>
        </tr>
      `;
      if (!expanded) return projectRow;

      const childRows = sortByPriority(fnItems, ranges)
        .map((it) => {
          const itPrio = fnPrio.get(it.id) ?? 1;
          const itStart = itemStartDate(it, state.startDate, ranges) ?? null;
          const itFinish = itemFinishDate(it, state.startDate, ranges);
          const itWait = itFinish ? weekIndex(state.startDate, itFinish) : 0;
          return `
        <tr class="portfolio-row-fn" data-fn-parent="${escapeAttr(g.key)}" data-edit="${escapeAttr(it.id)}" title="Открыть функциональность">
          <td${tdAttrs("priority", "prio-cell portfolio-fn-prio")} data-stop-edit>
            <input class="prio-input prio-input-fn" type="number" min="1" max="${Math.max(1, fnCount)}" step="1" value="${itPrio}" data-fn-prio="${escapeAttr(it.id)}" data-fn-prio-now="${itPrio}" data-stop-edit aria-label="Приоритет функциональности в проекте" title="Приоритет функциональности в проекте" />
          </td>
          <td${tdAttrs("title", "title-cell portfolio-fn-title")}>
            <div class="name">${escapeHtml(it.title)}</div>
          </td>
          <td${tdAttrs("jira", "jira-cell muted")}>todo</td>
          <td${tdAttrs("teams", "teams-cell")}>${teamsCellHtml(it)}</td>
          <td${tdAttrs("status", "status-cell")}>
            <span class="status-pill badge-status-${it.status}">${statusLabel(it.status)}</span>
          </td>
          <td${tdAttrs("cashFlow", "finance-cell mono metric-num")}>${formatTys(it.cashFlow12m)}</td>
          <td${tdAttrs("roi", "finance-cell mono metric-num")}>${formatPercent(it.roi12m)}</td>
          <td${tdAttrs("payback", "finance-cell mono metric-num")}>${formatPaybackMonths(it.paybackMonths)}</td>
          <td${tdAttrs("startDate", "mono eta-cell")}>${formatIsoDateOrDash(itStart)}</td>
          <td${tdAttrs("eta", `mono eta-cell ${itFinish && itWait > 4 ? "eta-late" : "eta-good"}`)}>
            ${itFinish ? `<span class="eta-final">${formatDate(itFinish)}</span>` : "—"}
          </td>
          <td${tdAttrs("baselineDuration", "mono eta-cell")}>${formatDurationDaysCell(itStart, itFinish)}</td>
        </tr>
      `;
        })
        .join("");

      return projectRow + childRows;
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
          <table class="portfolio-table portfolio-thead-table" style="${portfolioTableWidthStyle()}">
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
          <table class="portfolio-table portfolio-body-table" style="${portfolioTableWidthStyle()}">
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
              "schedule"
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

let ganttTreePickerOutsideBound = false;

/** Close «Вложенность» details when clicking outside. */
function bindGanttTreePickerOutsideClose() {
  if (ganttTreePickerOutsideBound) return;
  ganttTreePickerOutsideBound = true;
  document.addEventListener(
    "pointerdown",
    (e) => {
      const t = e.target as Node | null;
      document
        .querySelectorAll<HTMLDetailsElement>(".gantt-tree-picker[open]")
        .forEach((el) => {
          if (t && !el.contains(t)) el.open = false;
        });
    },
    true
  );
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
  syncTeamRosters(state.teams);
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

function linkLabel(href: string): string {
  try {
    const u = new URL(href);
    const path = u.pathname === "/" ? "" : u.pathname;
    const s = `${u.hostname}${path}`;
    return s.length > 48 ? `${s.slice(0, 45)}…` : s;
  } catch {
    return href;
  }
}

function priorityJournalHtml(): string {
  const all = state.priorityLog ?? [];
  const projects = [...new Set(all.map((e) => e.projectTitle))].sort((a, b) =>
    a.localeCompare(b, "ru")
  );
  const filter = projects.includes(ui.journalProject) ? ui.journalProject : "";
  const entries = filter ? all.filter((e) => e.projectTitle === filter) : all;
  const rows = entries
    .map((e) => {
      const up = e.to < e.from;
      const dir = e.to === e.from ? "" : up ? "повышен" : "понижен";
      const links = e.links.length
        ? `<ul class="prio-log-links">${e.links
            .map(
              (l) =>
                `<li><a href="${escapeAttr(l)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr(l)}">${escapeHtml(linkLabel(l))}</a></li>`
            )
            .join("")}</ul>`
        : `<span class="muted">—</span>`;
      return `<tr>
        <td class="mono prio-log-date">${escapeHtml(formatDate(e.date))}</td>
        <td class="prio-log-project">${escapeHtml(e.projectTitle)}</td>
        <td class="prio-log-move">
          <span class="prio-mini">${e.from}</span><span class="prio-log-arrow">→</span><span class="prio-mini prio-mini-to">${e.to}</span>
          ${dir ? `<span class="prio-log-dir ${up ? "is-up" : "is-down"}">${dir}</span>` : ""}
        </td>
        <td class="prio-log-comment">${escapeHtml(e.comment) || `<span class="muted">—</span>`}</td>
        <td class="prio-log-links-cell">${links}</td>
        <td class="mono meta prio-log-at">${escapeHtml(formatLogAt(e.at))}</td>
      </tr>`;
    })
    .join("");
  const table = entries.length
    ? `<div class="prio-log-scroll"><table class="prio-log-table">
        <thead><tr>
          <th>Дата изменения</th><th>Проект</th><th>Приоритет</th><th>Причина</th><th>Материалы</th><th>Записано</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`
    : `<p class="change-log-empty meta">${
        all.length
          ? "Нет изменений по выбранному проекту."
          : "Пока нет записей. Когда в Реестре меняется приоритет проекта, здесь появится запись с датой, причиной и ссылками."
      }</p>`;
  return `
    <div class="prio-log-toolbar">
      <div class="gantt-seg prio-log-filter" role="group" aria-label="Фильтр по проекту">
        <span class="gantt-seg-label">Проект</span>
        <select id="journalProject" class="prio-log-filter-select" aria-label="Фильтр по проекту">
          <option value="">Все проекты</option>
          ${projects
            .map(
              (p) =>
                `<option value="${escapeAttr(p)}"${p === filter ? " selected" : ""}>${escapeHtml(p)}</option>`
            )
            .join("")}
        </select>
      </div>
      <span class="meta">${entries.length} ${entries.length === 1 ? "запись" : entries.length >= 2 && entries.length <= 4 ? "записи" : "записей"}</span>
    </div>
    ${table}`;
}

function journalHtml(): string {
  const view = ui.journalView;
  const seg = (id: "priority" | "all", label: string) =>
    `<button type="button" class="gantt-seg-btn${view === id ? " is-active" : ""}" data-journal-view="${id}" aria-pressed="${view === id ? "true" : "false"}">${label}</button>`;
  const switcher = `<div class="gantt-seg" role="group" aria-label="Раздел журнала">
      <div class="gantt-seg-btns">${seg("priority", "Приоритеты проектов")}${seg("all", "Все изменения")}</div>
    </div>`;
  if (view === "all") return changeLogHtml(switcher);
  return `
    <div class="panel panel-sticky-host change-log-panel prio-log-panel">
      <div class="panel-sticky">
        <div class="panel-header">
          <div>
            <h2>Журнал</h2>
            <p class="panel-desc meta">
              Изменения приоритета проектов: дата, причина и материалы. Синхронизируется вместе с данными.
            </p>
          </div>
          <div class="toolbar">${switcher}</div>
        </div>
      </div>
      ${priorityJournalHtml()}
    </div>`;
}

function changeLogHtml(switcher = ""): string {
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
            <h2>Журнал</h2>
            <p class="panel-desc meta">
              Последние действия с портфелем (до ${CHANGE_LOG_MAX} записей). Синхронизируется вместе с данными.
            </p>
          </div>
          <div class="toolbar">${switcher}</div>
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
  return DEMO_HORIZON_WEEKS;
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
          const title = `Н${idx + 1}: ${lw.usedPw.toFixed(1)} чел·нед (${pct}%)`;
          return `<span class="demo-heat-cell" title="${escapeAttr(title)}" style="background:${demoHeatColor(pct)};border-color:${demoHeatBorder(pct)}"></span>`;
        })
        .join("");
      const tone = demoLoadTone(row.avgPct);
      return `
        <tr>
          <td>
            <strong>${escapeHtml(row.team.name)}</strong>
            <div class="meta">${escapeHtml(teamRosterFactLabel(row.team))}</div>
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
          <div class="hint">пик &gt; 100% или пересечение работ на неделе</div>
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
  if (status === "partial") return "need-st-partial";
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
  const ranges = szRanges();
  const planDays = rolePlanDays(role, ranges);
  const under = roleIsUnderPlan(role, ranges);
  const onTimeline = Boolean(rolePlacedOnTimeline(a.teamId, role));
  const factDays = onTimeline ? roleTimelineDays(role, ranges) : null;
  const ratio = `${planDays}/${factDays ?? "—"}`;
  const ratioTip = under
    ? `На таймлайне меньше плана: ${factDays} из ${planDays} дн.`
    : "План / на таймлайне";
  const st = resolveRoleDemandStatus(role, a);
  const editKey = `${item.id}:${a.teamId}:${role.id}`;
  const editing = ui.needDaysEdit === editKey;
  const daysCell = editing
    ? `<span class="need-plan-fact${under ? " is-under-plan" : ""}" title="${escapeAttr(ratioTip)}"><input type="number" class="need-days-input" min="1" step="1" inputmode="numeric" value="${planDays}" data-need-days="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}" aria-label="Дни плана" /> / ${factDays ?? "—"}</span>`
    : `<button type="button" class="need-row-days-val need-plan-fact${under ? " is-under-plan" : ""}" data-need-edit-days="${editKey}" title="${escapeAttr(`${ratioTip}. Нажмите, чтобы изменить план`)}">${ratio}</button>`;
  const statusOpts = ASSIGNMENT_DEMAND_STATUSES.map(
    (s) =>
      `<option value="${s}"${s === st ? " selected" : ""}>${ASSIGNMENT_DEMAND_LABELS[s]}</option>`
  ).join("");
  const action =
    st === "draft"
      ? `<button type="button" class="btn btn-primary need-send-btn" data-need-send="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}">Отправить</button>`
      : `<button type="button" class="btn need-change-btn" data-need-revert="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}">Изменить</button>`;
  const statusDisabled = under
    ? ` disabled title="${escapeAttr("Пока на таймлайне меньше плана — статус «Частично согласовано»")}"`
    : "";
  return `<div class="need-row need-role-row${under ? " is-under-plan" : ""}">
    <span class="need-row-left">
      <span class="need-role-name">${escapeHtml(role.name)}</span>
      <span class="need-row-days">${daysCell}</span>
    </span>
    <span class="need-row-right">
      <select class="need-st-select ${demandStatusClass(st)}" data-need-status="${item.id}" data-team="${a.teamId}" data-role="${escapeAttr(role.id)}"${statusDisabled}>${statusOpts}</select>
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

function demandFnHtml(item: WorkItem, fnPrio?: Map<string, number>): string {
  const ranges = szRanges();
  const planDays = totalEstimateDays(item, ranges);
  const factDays = agreedRolePlanDays(item.assignments, ranges);
  const fnUnder = assignsHaveUnderPlan(item.assignments, ranges);
  const ratio = `${planDays}/${factDays || "—"}`;
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
        <span class="need-fn-title">${prioBadgeHtml(fnPrio?.get(item.id), "Приоритет функциональности (меняется в Реестре)", "prio-mini-fn")}${escapeHtml(item.title)}</span>
      </span>
      <span class="need-fn-actions">
        <span class="need-fn-req need-plan-fact${fnUnder ? " is-under-plan" : ""}" title="${fnUnder ? "На таймлайне меньше плана из Потребности" : "План / на таймлайне"}">${ratio}</span>
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
    const needRanges = szRanges();
    const totalDays = items.reduce(
      (s, it) => s + totalEstimateDays(it, needRanges),
      0
    );
    const roleEntries = items.flatMap((it) =>
      it.assignments.flatMap((a) => {
        const teamRoles = resolveTeamRoleNames(teamById(a.teamId));
        const roles = filterAssignmentRolesToTeam(a.roles, teamRoles);
        return (roles.length ? roles : [null]).map((role) => ({ it, a, role }));
      })
    );
    let pendingCount = 0;
    let partialCount = 0;
    let approvedCount = 0;
    for (const x of roleEntries) {
      const st = x.role
        ? resolveRoleDemandStatus(x.role, x.a, x.it)
        : resolveAssignmentDemandStatus(x.a, x.it);
      if (st === "pending") pendingCount += 1;
      else if (st === "partial") partialCount += 1;
      else if (st === "approved") approvedCount += 1;
    }
    const open = !ui.needCollapsedProjects[selectedGroup.key];
    const fnPrio = functionalityPriorityMap(state.items, needRanges);
    const fns = items.map((it) => demandFnHtml(it, fnPrio)).join("");
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
        <div class="need-stat"><div class="label">Частично согласовано</div><div class="value is-partial">${partialCount}</div></div>
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

/** Days on timeline for placed roles (may be less than Потребность plan). */
function agreedRolePlanDays(
  assigns: TeamAssignment[],
  ranges: SizeRanges
): number {
  return assigns.reduce((sum, a) => {
    return (
      sum +
      planningDemandRoles(a).reduce((roleSum, role) => {
        if (!rolePlacedOnTimeline(a.teamId, role)) return roleSum;
        return roleSum + roleTimelineDays(role, ranges);
      }, 0)
    );
  }, 0);
}

function assignsHaveUnderPlan(
  assigns: TeamAssignment[],
  ranges: SizeRanges
): boolean {
  return assigns.some((a) =>
    planningDemandRoles(a).some((role) => roleIsUnderPlan(role, ranges))
  );
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
  _teamId: string,
  assigneeId: string | undefined,
  memberName: string
): string {
  // Prefer global member id (ids are unique across teams). Do not scope by
  // teamId — the same person on two teams must still collide.
  if (assigneeId) return `id:${assigneeId}`;
  // Full name before short FIO: «Морозова Екатерина» ≠ «Морозова Елена».
  const full = memberName.trim().toLowerCase();
  if (full) return `name:${full}`;
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
        const days = roleTimelineDays(role, ranges);
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

function planTrackBg(weeks: number, scale: GanttScale = "week"): string {
  const bands = ganttScaleBands(state.startDate, weeks, scale);
  if (bands) {
    if (bands.length <= 1) return "transparent";
    const stops: string[] = ["transparent 0"];
    for (const band of bands.slice(1)) {
      const pct = (band.startWeek / weeks) * 100;
      stops.push(
        `transparent ${pct}%`,
        `var(--line) ${pct}%`,
        `var(--line) calc(${pct}% + 1px)`,
        `transparent calc(${pct}% + 1px)`
      );
    }
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }
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
  conflictWeeks?: Map<number, PlanWeekPersonConflict[]>,
  scale: GanttScale = "week"
): string {
  const bands = ganttScaleBands(state.startDate, weeks, scale);
  if (bands) {
    return bands
      .map((band) => {
        const span = band.endWeek - band.startWeek + 1;
        const width = (span / weeks) * 100;
        const start = addWeeks(state.startDate, band.startWeek);
        const end = addWeeks(state.startDate, band.endWeek);
        const [, sm, sd] = start.split("-");
        const [, em, ed] = end.split("-");
        const range =
          band.startWeek === band.endWeek
            ? `${sd}.${sm}`
            : `${sd}.${sm}–${ed}.${em}`;
        return `<div class="plan-axis-tick plan-axis-tick-month" style="width:${width}%" title="${escapeAttr(band.label)}"><span>${escapeHtml(band.label)}</span><span>${range}</span></div>`;
      })
      .join("");
  }
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
function planPersonConflictAriaLabel(
  placeKey: string,
  placements: readonly PlanPersonPlacement[]
): string {
  const self = placements.find((p) => p.key === placeKey);
  const parts = planConflictCounterparts(placeKey, placements).map(
    (p) =>
      `${planPlacementDisplayTitle(p)} ${planWeekRangeLabel(p.startWeek, p.endWeek)}`
  );
  if (!self?.personKey || !parts.length) return "Пересечение по исполнителю";
  return `Пересечение · ${planWeekRangeLabel(self.startWeek, self.endWeek)}. ${self.memberName}: ${parts.join("; ")}`;
}

/** Structured tip HTML for a person-conflict mark — same classes as week-header tips. */
function planPersonConflictTipHtml(
  placeKey: string,
  placements: readonly PlanPersonPlacement[]
): string {
  const self = placements.find((p) => p.key === placeKey);
  const others = planConflictCounterparts(placeKey, placements);
  if (!self?.personKey) {
    return `<div class="plan-conflict-tip-title">Пересечение по исполнителю</div>`;
  }
  const listed = [self, ...others];
  const startWeek = Math.min(...listed.map((p) => p.startWeek));
  const endWeek = Math.max(...listed.map((p) => p.endWeek));
  const title = `Пересечение · ${planWeekRangeLabel(startWeek, endWeek)}`;
  const projects = listed
    .map(
      (p) =>
        `<div class="plan-conflict-tip-proj">• ${escapeHtml(planWeekConflictProjectLine(p))} · ${escapeHtml(planWeekRangeLabel(p.startWeek, p.endWeek))}</div>`
    )
    .join("");
  return `<div class="plan-conflict-tip-title">${escapeHtml(title)}</div><div class="plan-conflict-tip-group"><div class="plan-conflict-tip-person">${escapeHtml(self.memberName)}</div>${projects}</div>`;
}

function planConflictMarkHtml(
  ariaLabel = "Пересечение по исполнителю",
  tipHtml?: string
): string {
  const label = escapeAttr(ariaLabel);
  const tip = tipHtml ?? escapeHtml(ariaLabel);
  // CSS tip (not native title): appears immediately; survives overflow:hidden ancestors via fixed JS
  return `<span class="plan-conflict-mark" tabindex="0" aria-label="${label}">${PLAN_CONFLICT_MARK_SVG}<span class="plan-conflict-tip" role="tooltip">${tip}</span></span>`;
}

const TEAMS_POP_SVG = `<svg class="teams-pop-ico" viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="6.1" cy="5.1" r="2"/><path d="M2.6 12.4c.2-2.5 1.6-3.6 3.5-3.6s3.3 1.1 3.5 3.6"/><circle cx="11.1" cy="5.6" r="1.55"/><path d="M9.3 12.4c.15-1.7 1.1-2.5 2.2-2.5 1.15 0 2.05.8 2.2 2.5"/></svg>`;

/**
 * Планирование: icon on a functionality when teams outside the current
 * filter also work on it; hover/focus shows every involved team.
 */
function planFnTeamsMarkHtml(item: WorkItem, selectedSet: Set<string>): string {
  const teams = item.assignments
    .map((a) => ({ team: teamById(a.teamId), id: a.teamId }))
    .filter((x): x is { team: Team; id: string } => Boolean(x.team));
  const others = teams.filter((x) => !selectedSet.has(x.id));
  if (!others.length) return "";
  const rows = teams
    .map(({ team, id }) => {
      const mine = selectedSet.has(id);
      return `<li class="teams-pop-li${mine ? " is-mine" : ""}"><span class="team-dot" style="background:${team.color}"></span><span>${escapeHtml(team.name)}</span>${mine ? `<span class="teams-pop-tag">в фильтре</span>` : ""}</li>`;
    })
    .join("");
  return teamsPopHtml({
    count: others.length,
    aria: `Команды функциональности: ${teams.map((x) => x.team.name).join(", ")}`,
    head: `Команды в функциональности (${teams.length})`,
    listHtml: `<ul class="teams-pop-list">${rows}</ul>`,
  });
}

/**
 * Icon «люди +N»; click opens a popup (fixed-positioned like conflict tips).
 * Behaviour is bound in bindTeamsPopups().
 */
function teamsPopHtml(o: {
  count: number;
  /** Text next to the icon; default «+N». */
  countLabel?: string;
  aria: string;
  head: string;
  listHtml: string;
}): string {
  return `<span class="teams-pop" role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="false" aria-label="${escapeAttr(o.aria)}" data-stop-edit>${TEAMS_POP_SVG}<span class="teams-pop-n">${escapeHtml(o.countLabel ?? `+${o.count}`)}</span><span class="plan-conflict-tip teams-pop-tip" role="dialog" data-stop-edit><span class="teams-pop-head">${escapeHtml(o.head)}</span>${o.listHtml}</span></span>`;
}

function treeExpandControlsHtml(scope: "plan" | "gantt" | "gantt-fact"): string {
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

function setGanttFactTreeExpanded(expanded: boolean) {
  if (expanded) {
    ui.ganttFactCollapsedProjects = {};
    ui.ganttFactCollapsedItems = {};
    ui.ganttFactCollapsedTeams = {};
  } else {
    ui.ganttFactCollapsedProjects = collectDatasetKeys(
      "[data-gantt-fact-project]",
      "ganttFactProject"
    );
    ui.ganttFactCollapsedItems = collectDatasetKeys(
      "[data-gantt-fact-fn]",
      "ganttFactFn"
    );
    ui.ganttFactCollapsedTeams = collectDatasetKeys(
      "[data-gantt-fact-team]",
      "ganttFactTeam"
    );
  }
  render();
}

const PLAN_DURATION_CHIPS = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60];

function planDurationWeeks(days: number): number {
  return Math.max(1, Math.ceil(days / WORKING_DAYS_PER_WEEK - 1e-9));
}

/** Duration chips for timeline placement (plan itself stays on Потребность). */
function planScheduleDurationOptions(planDays: number): number[] {
  const plan = Math.max(1, Math.round(planDays));
  const opts = new Set(PLAN_DURATION_CHIPS);
  opts.add(plan);
  return [...opts].sort((a, b) => a - b);
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
  const planDays = role ? rolePlanDays(role, szRanges()) : form.days;
  const durs = planScheduleDurationOptions(planDays)
    .map((d) => {
      const on = form.days === d;
      const under = d < planDays;
      const tip =
        under
          ? `Меньше плана (${planDays} дн.) — план в Потребности не меняется`
          : d > planDays
            ? `Больше плана (${planDays} дн.) — план в Потребности не меняется`
            : "Полный план из Потребности";
      return `<button type="button" class="plan-chip${on ? " is-on" : ""}${under ? " is-under" : ""}" data-plan-form-days="${d}" title="${escapeAttr(tip)}">${d}</button>`;
    })
    .join("");
  const title = editing
    ? `Изменить назначение на таймлайне: ${escapeHtml(item.title)}`
    : `Новая задача на таймлайн: ${escapeHtml(item.title)}`;
  const underHint =
    form.days < planDays
      ? `<p class="plan-task-under-hint">На таймлайне ${form.days} дн. · план ${planDays} дн. (Потребность не меняется)</p>`
      : form.days > planDays
        ? `<p class="plan-task-under-hint is-muted">На таймлайне ${form.days} дн. · план ${planDays} дн. (Потребность не меняется)</p>`
        : `<p class="plan-task-under-hint is-muted">План ${planDays} дн. — меняется только в Потребности. Можно поставить меньше или больше.</p>`;
  return `<div class="plan-task-form">
    <div class="plan-task-form-title">${title}</div>
    <div class="plan-task-label">Исполнитель</div>
    <div class="plan-chips">${people || `<span class="meta">Добавьте строки роль — ФИО на вкладке «Команды»</span>`}</div>
    <div class="plan-task-label">Дата старта</div>
    <div class="plan-chips">${starts}</div>
    <div class="plan-task-label">На таймлайне, рабочих дней</div>
    <div class="plan-chips">${durs}</div>
    ${underHint}
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

function planTrackHtml(
  inner: string,
  weeks: number,
  scale: GanttScale = "week"
): string {
  return `<div class="plan-track" style="background:${planTrackBg(weeks, scale)}">${inner}</div>`;
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
        const days = roleTimelineDays(role, ranges);
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

type GanttBoardView = {
  title: string;
  rootClass: string;
  scale: GanttScale;
  depth: GanttDepthMonths;
  treeLevel: GanttTreeLevel;
  collapsedProjects: Record<string, true>;
  collapsedItems: Record<string, true>;
  collapsedTeams: Record<string, true>;
  attrProject: string;
  attrFn: string;
  attrTeam: string;
  treeScope: "gantt" | "gantt-fact";
  scaleAttr: string;
  depthAttr: string;
  treeLevelAttr: string;
};

function ganttPlanHtml(): string {
  return ganttBoardHtml({
    title: "Гантт — итоговый ресурсный план",
    rootClass: "gantt-page",
    scale: ui.ganttScale,
    depth: ui.ganttDepthMonths,
    treeLevel: ui.ganttTreeLevel,
    collapsedProjects: ui.ganttCollapsedProjects,
    collapsedItems: ui.ganttCollapsedItems,
    collapsedTeams: ui.ganttCollapsedTeams,
    attrProject: "gantt-project",
    attrFn: "gantt-fn",
    attrTeam: "gantt-team",
    treeScope: "gantt",
    scaleAttr: "gantt-scale",
    depthAttr: "gantt-depth",
    treeLevelAttr: "gantt-tree-level",
  });
}

/** Same board as Гантт, fully independent filters/collapse/prefs. */
function ganttFactHtml(): string {
  return ganttBoardHtml({
    title: "Гантт/факт — итоговый ресурсный план",
    rootClass: "gantt-page gantt-fact-page",
    scale: ui.ganttFactScale,
    depth: ui.ganttFactDepthMonths,
    treeLevel: ui.ganttFactTreeLevel,
    collapsedProjects: ui.ganttFactCollapsedProjects,
    collapsedItems: ui.ganttFactCollapsedItems,
    collapsedTeams: ui.ganttFactCollapsedTeams,
    attrProject: "gantt-fact-project",
    attrFn: "gantt-fact-fn",
    attrTeam: "gantt-fact-team",
    treeScope: "gantt-fact",
    scaleAttr: "gantt-fact-scale",
    depthAttr: "gantt-fact-depth",
    treeLevelAttr: "gantt-fact-tree-level",
  });
}

function ganttBoardHtml(view: GanttBoardView): string {
  /** Resource-intersection UI belongs on Планирование only. */
  const showConflicts = false;
  const scale = view.scale;
  const treeLevel = view.treeLevel;
  const treeMeta = ganttTreeLevelMeta(treeLevel);
  const showFn = treeLevel !== "project";
  const showTeam = treeLevel === "team" || treeLevel === "role";
  const showRole = treeLevel === "role";
  const weeks = ganttHorizonWeeks(view.depth);
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
  const conflictCount = 0;

  const body = groups.length
    ? groups
        .map((g) => {
          const open = !view.collapsedProjects[g.key];
          const projectSpans: { startWeek: number; endWeek: number }[] = [];
          const fnRows = g.items
            .map((item) => {
              const fnOpen = !view.collapsedItems[item.id];
              const assigns = item.assignments;
              const itemSpans: { startWeek: number; endWeek: number }[] = [];
              const itemTeamColors: string[] = [];
              const teamBlocks = assigns
                .map((a) => {
                  const team = teamById(a.teamId);
                  const roles = planningDemandRoles(a);
                  const conflict = false;
                  if (!roles.length) return "";
                  const teamKey = `${item.id}:${a.teamId}`;
                  const teamOpen = !view.collapsedTeams[teamKey];
                  const teamColor = team?.color ?? "#484f55";
                  const teamSpans: { startWeek: number; endWeek: number }[] =
                    [];
                  const roleRows = roles
                    .map((role) => {
                      const member = teamMemberById(a.teamId, role.assigneeId);
                      const days = member
                        ? roleTimelineDays(role, ranges)
                        : rolePlanDays(role, ranges);
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
                      if (!showRole) return "";
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
                        ${planTrackHtml(bar, weeks, scale)}
                      </div>`;
                    })
                    .join("");
                  if (teamSpans.length) {
                    itemSpans.push(...teamSpans);
                    if (!itemTeamColors.includes(teamColor)) {
                      itemTeamColors.push(teamColor);
                    }
                  }
                  if (!showTeam) return "";
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
                  const teamLabel = escapeHtml(team?.name ?? a.teamId);
                  if (!showRole) {
                    return `<div class="plan-row plan-exec-row plan-team-flat">
                      <div class="plan-cell">
                        <span class="plan-exec-name">${teamLabel}</span>
                      </div>
                      ${planTrackHtml(teamBar, weeks, scale)}
                    </div>`;
                  }
                  return `<details class="plan-team" data-${view.attrTeam}="${escapeAttr(teamKey)}"${teamOpen ? " open" : ""}>
                    <summary class="plan-row plan-exec-row plan-team-sum">
                      <div class="plan-cell">
                        <span class="plan-exec-name">${teamLabel}</span>
                      </div>
                      ${planTrackHtml(teamBar, weeks, scale)}
                    </summary>
                    ${roleRows}
                  </details>`;
                })
                .join("");
              if (itemSpans.length) {
                projectSpans.push(...itemSpans);
              }
              if (!showFn) return "";
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
              const fnTitle = escapeHtml(item.title);
              if (!showTeam) {
                return `<div class="plan-row plan-fn-flat">
                  <div class="plan-cell">
                    <span class="plan-fn-title">${fnTitle}</span>
                  </div>
                  ${planTrackHtml(fnBar, weeks, scale)}
                </div>`;
              }
              return `<details class="plan-fn" data-${view.attrFn}="${item.id}"${fnOpen ? " open" : ""}>
                <summary class="plan-row plan-fn-sum">
                  <div class="plan-cell">
                    <span class="plan-fn-title">${fnTitle}</span>
                  </div>
                  ${planTrackHtml(fnBar, weeks, scale)}
                </summary>
                ${teamBlocks || `<div class="plan-row plan-team-row"><div class="plan-cell"><span class="plan-exec-name">Команда не назначена</span></div>${planTrackHtml("", weeks, scale)}</div>`}
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
          const projectHead = `
            <div class="plan-cell">
              <span class="plan-project-title">${prioBadgeHtml(prioMap.get(g.key))}${escapeHtml(g.title)}</span>
              <span class="plan-project-meta">${g.items.length} функц.</span>
            </div>
            ${planTrackHtml(projectBar, weeks, scale)}`;
          if (!showFn) {
            return `<div class="plan-row plan-project-sum plan-project-flat" data-${view.attrProject}="${escapeAttr(g.key)}">${projectHead}</div>`;
          }
          return `<details class="plan-project" data-${view.attrProject}="${escapeAttr(g.key)}"${open ? " open" : ""}>
            <summary class="plan-row plan-project-sum">${projectHead}</summary>
            ${fnRows}
          </details>`;
        })
        .join("")
    : `<div class="plan-empty meta">Нет проектов. Добавьте их в Реестре и назначьте команды в Потребности.</div>`;

  return `
    <div class="${view.rootClass}">
      <div class="panel-header need-page-head gantt-page-head">
        <h2>${escapeHtml(view.title)}</h2>
        <div class="gantt-view-ctrls">
          ${planStartCtrlHtml()}
          ${ganttTreeLevelFilterHtml(treeLevel, view.treeLevelAttr)}
          ${ganttScaleToggleHtml(scale, view.scaleAttr)}
          ${ganttDepthToggleHtml(view.depth, view.depthAttr)}
          ${showFn ? treeExpandControlsHtml(view.treeScope) : ""}
        </div>
      </div>
      <div class="need-stats gantt-stats">
        <div class="need-stat"><div class="label">Всего проектов</div><div class="value">${groups.length}</div></div>
        <div class="need-stat"><div class="label">Расположено</div><div class="value">${placedKeys.size}</div></div>
        <div class="need-stat"><div class="label">Задач</div><div class="value">${bars.length}</div></div>
        <div class="need-stat"><div class="label">Исполнителей</div><div class="value">${assignees.size}</div></div>
        <div class="need-stat"><div class="label">Горизонт</div><div class="value">${view.depth} мес. · ${weeks} нед.</div></div>
        ${
          showConflicts
            ? `<div class="need-stat"><div class="label">Конфликтов ресурса</div><div class="value${conflictCount ? " is-pending" : ""}">${conflictCount}</div></div>`
            : ""
        }
      </div>
      <div class="plan-board gantt-board">
        <div class="plan-row plan-board-head">
          <div class="plan-cell plan-head-label">${escapeHtml(treeMeta.head)}</div>
          <div class="plan-axis">${planAxisHtml(weeks, undefined, scale)}</div>
        </div>
        ${body}
      </div>
    </div>
  `;
}

function planningHtml(
  rollups: ItemSchedule[],
  _slices: ScheduledSlice[]
): string {
  const weeks = PLAN_WEEKS;
  const selected = planSelectedTeamIds();
  const selectedSet = new Set(selected);
  const focusId = planFocusTeamId(selected);
  const ranges = szRanges();
  const prioMap = projectPrioMap();
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
  /** Bars with person-overlap (same keys as hatch / triangle marks). */
  const conflictCount = personConflictKeys.size;
  const conflictsOnly = ui.planConflictsOnly;

  const bodyHtml = groups.length
    ? groups
        .map((g) => {
          const open = conflictsOnly || !ui.planCollapsedProjects[g.key];
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
              const fnUnder = assignsHaveUnderPlan(assigns, ranges);
              const fnOpen = conflictsOnly || !ui.planCollapsedItems[item.id];
              const execRows = assigns
                .map((a) => {
                  const team = teamById(a.teamId);
                  const roles = planningDemandRoles(a);
                  if (!roles.length) return "";
                  const roleRows = roles
                    .map((role) => {
                      const member = rolePlacedOnTimeline(a.teamId, role);
                      const onTimeline = Boolean(member);
                      const planDays = rolePlanDays(role, ranges);
                      const days = onTimeline
                        ? roleTimelineDays(role, ranges)
                        : planDays;
                      const under = roleIsUnderPlan(role, ranges);
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
                      if (conflictsOnly && !personConflict) return "";
                      const conflictAria = personConflict
                        ? planPersonConflictAriaLabel(placeKey, personPlacements)
                        : "";
                      const conflictTipHtml = personConflict
                        ? planPersonConflictTipHtml(placeKey, personPlacements)
                        : "";
                      const label = member
                        ? `${shortFio(member.name)} · ${days} дн.${under ? ` (план ${planDays})` : ""}`
                        : `${role.name} · ${planDays} дн.`;
                      const barTitle = personConflict
                        ? `${label} — ${conflictAria}`
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
                      const roleDays = `${planDays}/${onTimeline ? days : "—"}`;
                      const rowCls = [
                        " plan-role-row",
                        personConflict ? " is-person-conflict" : "",
                        under ? " is-under-plan" : "",
                      ].join("");
                      return `${planTaskFormHtml(item, a.teamId, role.id)}<div class="plan-row${rowCls}">
                        <div class="plan-cell">
                          <span class="plan-exec-name plan-fio-name">${leftLabel}${personConflict ? planConflictMarkHtml(conflictAria, conflictTipHtml) : ""}</span>
                          <span class="plan-fn-days plan-role-days${under ? " is-under-plan" : ""}" title="${under ? `На таймлайне меньше плана: ${days} из ${planDays} дн.` : "План / на таймлайне"}">${roleDays}</span>
                          ${planPlaceOpenBtnHtml(item.id, a.teamId, role.id, onTimeline)}
                        </div>
                        ${planTrackHtml(bar, weeks)}
                      </div>`;
                    })
                    .join("");
                  if (conflictsOnly && !roleRows) return "";
                  const head = `<div class="plan-row plan-exec-row plan-team-row">
                    <div class="plan-cell">
                      <span class="plan-exec-name"><span class="team-dot" style="background:${team?.color ?? "#93999e"}"></span>${escapeHtml(team?.name ?? a.teamId)}</span>
                    </div>
                    ${planTrackHtml("", weeks)}
                  </div>`;
                  return `${head}${roleRows}`;
                })
                .join("");
              if (conflictsOnly && !execRows) return "";
              const fnBar =
                itemSlices.length === 0
                  ? `<div class="plan-bar-empty"></div>`
                  : "";
              const otherTeamsHtml = planFnTeamsMarkHtml(item, selectedSet);
              return `<details class="plan-fn" data-plan-fn="${item.id}"${fnOpen ? " open" : ""}>
                <summary class="plan-row plan-fn-sum">
                  <div class="plan-cell">
                    <span class="plan-fn-title">${escapeHtml(item.title)}</span>
                    ${otherTeamsHtml}
                    <span class="plan-fn-days${fnUnder ? " is-under-plan" : ""}" title="${fnUnder ? "На таймлайне меньше плана из Потребности" : "План / на таймлайне"}">${req}/${agreed || "—"}</span>
                  </div>
                  ${planTrackHtml(fnBar, weeks)}
                </summary>
                ${execRows}
              </details>`;
            })
            .join("");
          if (conflictsOnly && !fnRows) return "";
          return `<details class="plan-project" data-plan-project="${escapeAttr(g.key)}"${open ? " open" : ""}>
            <summary class="plan-row plan-project-sum">
              <div class="plan-cell">
                <span class="plan-project-title">${prioBadgeHtml(prioMap.get(g.key))}${escapeHtml(g.title)}</span>
                <span class="plan-project-meta">${g.items.length} функц.</span>
              </div>
              ${planTrackHtml("", weeks)}
            </summary>
            ${fnRows}
          </details>`;
        })
        .join("")
    : "";

  const body = bodyHtml
    ? bodyHtml
    : selected.length === 0
      ? `<div class="plan-empty meta">Команды не выбраны. Отметьте команду сверху или нажмите «Выбрать все».</div>`
      : conflictsOnly
        ? `<div class="plan-empty meta">Нет пересечений по исполнителям у выбранных команд.</div>`
        : `<div class="plan-empty meta">Нет проектов у выбранных команд. Отметьте команду сверху или назначьте её на вкладке «Потребность».</div>`;

  return `
    <div class="plan-page">
      <div class="panel-header need-page-head gantt-page-head plan-page-head">
        <h2>Планирование потребности</h2>
        <div class="gantt-view-ctrls">
          ${planStartCtrlHtml()}
          <div class="gantt-seg" role="group" aria-label="Фильтр команд">
            <span class="gantt-seg-label">Фильтр</span>
            <div class="gantt-seg-btns plan-team-filter-actions">
              <button type="button" class="gantt-seg-btn${conflictsOnly ? " is-active" : ""}" data-plan-conflicts-only title="Показать только пересечения по исполнителям" aria-pressed="${conflictsOnly ? "true" : "false"}">Конфликты</button>
              <button type="button" class="gantt-seg-btn" data-plan-teams-clear>Сбросить</button>
              <button type="button" class="gantt-seg-btn" data-plan-teams-all>Все</button>
            </div>
          </div>
          ${treeExpandControlsHtml("plan")}
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
      return planningHtml(rollups, slices);
    case "timeline":
      return ganttPlanHtml();
    case "timelineFact":
      return ganttFactHtml();
    case "demoA":
      return demoVariantAHtml(load, overflowByTeam);
    case "demoB":
      return demoVariantBHtml(load, overflowByTeam);
    case "capacity":
      return capacityHtml();
    case "changelog":
      return journalHtml();
    case "settings":
      return settingsHtml(rollups);
  }
}

/** Proposal + live backend status for read-only Jira integration (no stack compare). */
function jiraApiHtml(): string {
  return `
    <div class="api-page">
      <header class="settings-page-head">
        <h3 class="settings-section-title">Jira API <span class="tab-demo-mark">*демо</span></h3>
        <p class="settings-page-lead">
          Практичный путь: backend проксирует Jira REST, SPA только читает уже смапленные данные.
          Токен в браузер не попадает. Запись в Jira не делаем.
        </p>
      </header>

      <div class="panel api-status-panel">
        <div class="panel-header">
          <h3 class="settings-section-title">Статус backend</h3>
          <button type="button" class="btn" id="jiraApiRefreshBtn">Обновить</button>
        </div>
        <div class="api-status-body" id="jiraApiStatus">
          <p class="meta">Загрузка <span class="mono">GET /api/jira/status</span>…</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="settings-section-title">Архитектура</h3>
        </div>
        <ol class="api-steps">
          <li>Пользователь вводит <strong>Personal Access Token</strong> только в backend-сессию (память процесса).</li>
          <li>Backend ходит в Jira Server/DC REST от имени пользователя (read-only).</li>
          <li>Ответ маппится в проекты / функциональности / key / status / даты.</li>
          <li>SPA забирает preview/sync через <span class="mono">/api/jira/*</span>; планирование и Гантт остаются в VI Planer.</li>
        </ol>
        <p class="settings-help">
          На GitHub Pages без своего API live-Jira недоступна: нужен backend в корпсети/VPN
          (<span class="mono">npm run dev</span> уже проксирует <span class="mono">/api → :8787</span>).
        </p>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="settings-section-title">Эндпоинты</h3>
        </div>
        <table class="api-endpoint-table">
          <thead>
            <tr><th>Метод</th><th>Путь</th><th>Назначение</th></tr>
          </thead>
          <tbody>
            <tr>
              <td class="mono">GET</td>
              <td class="mono">/api/jira/status</td>
              <td>Конфиг: <span class="mono">not_configured</span> / disabled / ready</td>
            </tr>
            <tr>
              <td class="mono">POST</td>
              <td class="mono">/api/jira/session</td>
              <td>Принять PAT в память (stub → 501)</td>
            </tr>
            <tr>
              <td class="mono">DELETE</td>
              <td class="mono">/api/jira/session</td>
              <td>Стереть сессию</td>
            </tr>
            <tr>
              <td class="mono">GET</td>
              <td class="mono">/api/jira/sync-preview</td>
              <td>Плоский список issues → маппинг в портфель (stub)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="settings-section-title">Маппинг Jira → VI Planer</h3>
        </div>
        <table class="api-endpoint-table">
          <thead>
            <tr><th>Jira</th><th>VI Planer</th></tr>
          </thead>
          <tbody>
            <tr><td>Тип «Проект» / контейнер</td><td>Проект в Реестре</td></tr>
            <tr><td>Тип «Функциональность»</td><td>WorkItem (функциональность)</td></tr>
            <tr><td><span class="mono">issue.key</span></td><td>Колонка Jira</td></tr>
            <tr><td><span class="mono">status.name</span></td><td>Статус (таблица соответствий)</td></tr>
            <tr><td>Target start / end</td><td>Старт / baseline·actual finish</td></tr>
            <tr><td><span class="mono">assignee</span> / Team</td><td>Опционально → Потребность / команды</td></tr>
          </tbody>
        </table>
        <p class="settings-help">
          Иерархия Parent Link + Epic Link + «является дочерней» — как в корп. Jira;
          без Structure sync на первом этапе.
        </p>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="settings-section-title">MVP по фазам</h3>
        </div>
        <ol class="api-steps">
          <li><strong>Сейчас</strong> — секция в Настройках + stubs статуса/сессии/preview; env <span class="mono">JIRA_URL</span>, <span class="mono">JIRA_ENABLED</span>.</li>
          <li><strong>Сессия</strong> — in-memory PAT + cookie; проверка <span class="mono">/myself</span>.</li>
          <li><strong>Sync-preview</strong> — JQL/поиск → список для Реестра без автозаписи.</li>
          <li><strong>Импорт</strong> — по подтверждению создать/обновить проекты и функциональности + key.</li>
          <li><strong>Не в MVP</strong> — write-back в Jira, webhooks, двусторонний sync.</li>
        </ol>
      </div>
    </div>
  `;
}

function settingsHtml(rollups: ItemSchedule[]): string {
  const r = state.sizeRanges;
  const active = state.items.filter((i) => i.status !== "done");
  const ends = rollups.map((s) => s.endWeek);
  const horizon = ends.length ? Math.max(...ends) + 1 : 0;
  const canSizes = currentCan("settings.sizes");
  const canPack = currentCan("settings.portfolioPack");

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
        <p class="settings-page-lead">Маечные оценки, интеграции и исходный портфель.</p>
      </header>
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
      ${jiraApiHtml()}
    </div>
  `;
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
              <label for="p_cashFlow12m">ЧП (12 мес., тыс. руб)</label>
              <input id="p_cashFlow12m" type="number" step="0.1" inputmode="decimal" placeholder="напр. 1200" value="${cash}" />
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
      notes: "",
      manualRank: nextPriority(state.items),
      cashFlow12m: null,
      cashFlow24m: null,
      roi12m: null,
      roi24m: null,
      paybackMonths: null,
    } satisfies WorkItem);

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
                <label>ЧП (12 мес., тыс. руб)</label>
                <input id="f_cashFlow12m" type="number" step="0.1" inputmode="decimal" placeholder="напр. 1200" title="Чистая прибыль за 12 мес. в тыс. руб" value="${draft.cashFlow12m == null ? "" : draft.cashFlow12m}" />
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
          <div class="modal-section">
            <div class="modal-section-title">Приоритет</div>
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

/** ETA from plan+estimate only (no other backlog items stealing the weekly slot) */
function planOnlyEnd(a: TeamAssignment): { start: string; end: string; weeks: number } {
  const estimatePw = assignmentPlanWeeks(a, szRanges());
  const weeks = Math.round((estimatePw / SCHEDULE_CAPACITY_PW) * 100) / 100;
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

/** ЧП in тыс. руб; null/empty → em dash. */
function formatTys(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
}

/** @deprecated alias — ЧП now тыс. руб */
function formatMlrd(n: number | null | undefined): string {
  return formatTys(n);
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

/** Срок окупаемости, мес.; null → em dash. */
function formatPaybackMonths(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const s = n.toLocaleString("ru-RU", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
  return `${s} мес.`;
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
  const cap = slot?.capacityPw ?? SCHEDULE_CAPACITY_PW;
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
    <div class="overload-load mono">Загрузка <strong>${used.toFixed(1)}</strong> чел·нед (слот ${cap}/нед)</div>
    <p class="overload-why">По расписанию (те же интервалы, что полоски Gantt) на этой неделе пересекаются работы команды сверх недельного слота.</p>
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
      const top = (slot?.items ?? [])
        .slice(0, 3)
        .map((it) => escapeHtml(it.title))
        .join(", ");
      return `
        <div class="overload-axis-row">
          <div class="overload-pop-head">
            <span class="team-dot" style="background:${team.color}"></span>
            <strong>${escapeHtml(team.name)}</strong>
            <span class="mono">${used.toFixed(1)} чел·нед</span>
          </div>
          ${top ? `<div class="meta">${top}${(slot?.items.length ?? 0) > 3 ? "…" : ""}</div>` : ""}
        </div>`;
    })
    .join("");

  return `
    <div class="meta">${overloadWeekLabel(week)}</div>
    <p class="overload-why">На этой неделе работы пересекаются по расписанию у ${teams.length}&nbsp;${
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
  if (mark.hasAttribute("aria-expanded")) mark.setAttribute("aria-expanded", "false");
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

let teamsPopOutsideBound = false;

/** Планирование: team list opens on click (not hover); one at a time. */
function bindTeamsPopups() {
  document.querySelectorAll<HTMLElement>(".teams-pop").forEach((mark) => {
    const tip = mark.querySelector<HTMLElement>(".plan-conflict-tip");
    if (!tip) return;
    const toggle = () => {
      const isOpen = mark.classList.contains("is-tip-open");
      hideOpenPlanConflictTip();
      if (!isOpen) {
        placePlanConflictTip(mark, tip);
        mark.setAttribute("aria-expanded", "true");
      }
    };
    // Icon sits inside <summary>: never toggle the functionality row.
    mark.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (tip.contains(e.target as Node)) return; // clicks inside the list keep it open
      toggle();
    });
    mark.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      } else if (e.key === "Escape") {
        hideOpenPlanConflictTip();
      }
    });
  });
  if (teamsPopOutsideBound) return;
  teamsPopOutsideBound = true;
  // pointerdown (capture), not click: table rows swallow their click events,
  // so a click on another row would never reach a document click listener.
  document.addEventListener(
    "pointerdown",
    (e) => {
      const open = planConflictTipOpen;
      if (!open || !open.mark.classList.contains("teams-pop")) return;
      if (open.mark.contains(e.target as Node)) return;
      hideOpenPlanConflictTip();
    },
    true
  );
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = planConflictTipOpen;
    if (open?.mark.classList.contains("teams-pop")) hideOpenPlanConflictTip();
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

function todayIsoLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

type PriorityReason = { date: string; comment: string; links: string[] };

/**
 * Окно «Причина изменения приоритета проекта»: дата, комментарий, ссылки.
 * Built on document.body (outside render()) so it can sit over the project card.
 */
function openPriorityReasonModal(o: {
  projectTitle: string;
  from: number;
  to: number;
  onSave: (r: PriorityReason) => void;
  onCancel: () => void;
}) {
  document.querySelector("#prioReasonModal")?.remove();
  closeAppPop();
  const wrap = document.createElement("div");
  wrap.className = "modal-backdrop prio-reason-backdrop";
  wrap.id = "prioReasonModal";
  wrap.setAttribute("data-stop-edit", "");
  wrap.innerHTML = `
    <div class="modal prio-reason-modal" role="dialog" aria-modal="true" aria-labelledby="prioReasonTitle">
      <div class="modal-head">
        <h3 id="prioReasonTitle">Изменение приоритета проекта</h3>
      </div>
      <div class="modal-body">
        <div class="prio-reason-summary">
          <span class="prio-reason-project">${escapeHtml(o.projectTitle)}</span>
          <span class="prio-reason-move"><span class="prio-mini">${o.from}</span>→<span class="prio-mini prio-mini-to">${o.to}</span></span>
        </div>
        <div class="field">
          <label for="prioReasonDate">Дата изменения</label>
          <input id="prioReasonDate" type="date" value="${todayIsoLocal()}" required />
        </div>
        <div class="field">
          <label for="prioReasonComment">Причина изменения <span class="prio-reason-req">*</span></label>
          <textarea id="prioReasonComment" rows="4" placeholder="Почему меняется приоритет: решение комитета, новые вводные, риски…"></textarea>
        </div>
        <div class="field">
          <label for="prioReasonLinks">Ссылки на материалы</label>
          <textarea id="prioReasonLinks" rows="3" placeholder="https://… — по одной ссылке в строке"></textarea>
          <div class="meta">Протокол, презентация, задача в Jira и т.п. Необязательно.</div>
        </div>
        <div class="prio-reason-error" id="prioReasonError" role="alert" hidden></div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn" id="prioReasonCancel">Отмена</button>
        <button type="button" class="btn btn-primary" id="prioReasonSave">Сохранить</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const $ = <T extends HTMLElement>(id: string) => wrap.querySelector<T>(`#${id}`)!;
  const dateEl = $<HTMLInputElement>("prioReasonDate");
  const commentEl = $<HTMLTextAreaElement>("prioReasonComment");
  const linksEl = $<HTMLTextAreaElement>("prioReasonLinks");
  const errEl = $<HTMLDivElement>("prioReasonError");
  let done = false;
  const close = () => {
    wrap.remove();
    document.removeEventListener("keydown", onKey, true);
  };
  const cancel = () => {
    if (done) return;
    done = true;
    close();
    o.onCancel();
  };
  const showErr = (msg: string, focus: HTMLElement) => {
    errEl.textContent = msg;
    errEl.hidden = false;
    focus.focus();
  };
  const save = () => {
    if (done) return;
    const date = dateEl.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showErr("Укажите дату изменения.", dateEl);
      return;
    }
    const comment = commentEl.value.trim();
    if (!comment) {
      showErr("Опишите причину изменения приоритета.", commentEl);
      return;
    }
    const rawLinks = linksEl.value
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    const links = sanitizeLinks(rawLinks);
    if (links.length !== rawLinks.length) {
      const bad = rawLinks.filter((x) => !sanitizeLinks([x]).length);
      showErr(
        `Не похоже на ссылку: ${bad.slice(0, 2).join(", ")}. Ссылки должны начинаться с http:// или https://`,
        linksEl
      );
      return;
    }
    done = true;
    close();
    o.onSave({ date, comment, links });
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      cancel();
    }
  };
  document.addEventListener("keydown", onKey, true);
  $("prioReasonCancel").addEventListener("click", cancel);
  $("prioReasonSave").addEventListener("click", save);
  wrap.addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target === wrap) cancel();
  });
  wrap.addEventListener("pointerdown", (e) => e.stopPropagation());
  commentEl.focus();
}

function recordPriorityChange(
  projectKey: string,
  projectTitle: string,
  from: number,
  to: number,
  r: PriorityReason
) {
  const entry: PriorityLogEntry = {
    id: uid("prio"),
    at: new Date().toISOString(),
    date: r.date,
    projectKey,
    projectTitle,
    from,
    to,
    comment: r.comment,
    links: r.links,
  };
  state.priorityLog = sortPriorityLog([entry, ...(state.priorityLog ?? [])]).slice(
    0,
    PRIORITY_LOG_MAX
  );
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

/** Full portfolio schedule is heavy — skip on tabs that don't display it. */
function tabNeedsSchedule(tab: Tab): boolean {
  return (
    tab === "portfolio" ||
    tab === "planning" ||
    tab === "demoA" ||
    tab === "demoB" ||
    tab === "settings"
  );
}

function render() {
  closePrioPop();
  closeColPickerOutside();
  closeOverloadPop();
  ensureVisibleTab();
  syncTeamRosters(state.teams);
  let slices: ScheduledSlice[] = [];
  let rollups: ItemSchedule[] = [];
  let load: Record<string, TeamLoadWeek[]> = {};
  let overflowByTeam: Record<string, Set<number>> = {};
  if (tabNeedsSchedule(ui.tab)) {
    ({ slices, rollups, load } = scheduleState());
    overflowByTeam = scheduledOverloadWeeks(load);
    lastScheduledLoad = load;
    lastOverflowByTeam = overflowByTeam;
  }
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
          ${editionSwitcherHtml()}
          <span class="release-stamp" title="Дата релиза">updated ${RELEASE_UPDATED}</span>
          <span class="sync-badge" id="syncStatus" data-status="${getSyncStatus()}">${syncStatusLabel(getSyncStatus())}</span>
          <button class="btn" id="exportPdfBtn">${ui.tab === "timeline" || ui.tab === "timelineFact" ? "Экспорт Гантта" : "Экспорт PDF"}</button>
        </div>
        <p class="subtitle">
          Единый портфель проектов и продуктов: сквозной приоритет, несколько команд на функциональность
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
        ${tabButtonHtml("timelineFact")}
        ${tabButtonHtml("demoA")}
        ${tabButtonHtml("capacity", "tab-end")}
        ${tabButtonHtml("settings")}
        ${tabButtonHtml("changelog")}
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
      manualRank: null,
      cashFlow12m: null,
      cashFlow24m: null,
      roi12m: null,
      roi24m: null,
      paybackMonths: null,
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
    notes: val("f_notes").trim(),
    manualRank: priority,
    cashFlow12m: optionalNum("f_cashFlow12m"),
    cashFlow24m: optionalNum("f_cashFlow24m"),
    roi12m: optionalNum("f_roi12m"),
    roi24m: optionalNum("f_roi24m"),
    paybackMonths: optionalNum("f_paybackMonths"),
  };
}

function optionalNum(id: string): number | null {
  const el = document.querySelector<HTMLInputElement>(`#${id}`);
  const raw = el?.value?.trim() ?? "";
  if (!raw) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
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
    notes: "",
    manualRank: nextPriority(state.items),
    cashFlow12m: null,
    cashFlow24m: null,
    roi12m: null,
    roi24m: null,
    paybackMonths: null,
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
    let cancelled = false;
    const commit = () => {
      if (cancelled) return;
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
      const prevDays = role
        ? rolePlanDays(role, szRanges())
        : assignmentPlanDays(assign, szRanges());
      if (days === prevDays) {
        ui.needDaysEdit = null;
        render();
        return;
      }
      const size = nearestSizeFromDays(days, szRanges());
      const team = teamById(teamId);
      if (roleId && role) {
        patchDemandRole(itemId, teamId, roleId, (r) => {
          const next: AssignmentRole = { ...r, days, size };
          if (next.scheduledDays != null && next.scheduledDays === days) {
            delete next.scheduledDays;
          }
          return next;
        });
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
    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelled = true;
        ui.needDaysEdit = null;
        render();
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
    ui.planConflictsOnly = false;
    render();
  });
  root.querySelector("[data-plan-teams-all]")?.addEventListener("click", () => {
    ui.planTeamIds = state.teams.map((t) => t.id);
    ui.planTeamFilterCleared = false;
    ui.planFocusTeamId = ui.planTeamIds[0] ?? null;
    render();
  });
  root
    .querySelector("[data-plan-conflicts-only]")
    ?.addEventListener("click", () => {
      ui.planConflictsOnly = !ui.planConflictsOnly;
      render();
    });

  const openTaskForm = (itemId: string, teamId: string, roleId: string) => {
    const item = state.items.find((i) => i.id === itemId);
    const assign = item?.assignments.find((a) => a.teamId === teamId);
    const role = assign?.roles?.find((r) => r.id === roleId);
    if (!item || !assign || !role) return;
    const planDays = rolePlanDays(role, szRanges());
    const timelineDays = role.assigneeId
      ? roleTimelineDays(role, szRanges())
      : planDays;
    const options = planScheduleDurationOptions(planDays);
    const days = options.includes(timelineDays)
      ? timelineDays
      : options.reduce((best, d) =>
          Math.abs(d - timelineDays) < Math.abs(best - timelineDays) ? d : best
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
      days,
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
      const raw = Number(btn.dataset.planFormDays) || ui.planTaskForm.days;
      ui.planTaskForm = {
        ...ui.planTaskForm,
        days: Math.max(1, Math.round(raw)),
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
    const item = state.items.find((i) => i.id === form.itemId);
    const assign = item?.assignments.find((a) => a.teamId === form.teamId);
    const role = assign?.roles?.find((r) => r.id === form.roleId);
    const planDays = role ? rolePlanDays(role, szRanges()) : form.days;
    const scheduled = Math.max(1, Math.round(form.days));
    // Plan days/size stay on Потребность; timeline sets scheduledDays + partial/approved.
    patchDemandRole(form.itemId, form.teamId, form.roleId, (r) => {
      const next: AssignmentRole = {
        ...r,
        assigneeId: form.memberId || undefined,
        workStartDate: snapToMonday(start),
        demandStatus: scheduled < planDays ? "partial" : "approved",
      };
      if (scheduled === planDays) delete next.scheduledDays;
      else next.scheduledDays = scheduled;
      return next;
    });
    const member = teamMemberById(form.teamId, form.memberId ?? undefined);
    const deltaNote =
      scheduled < planDays
        ? ` (меньше плана ${planDays} дн.)`
        : scheduled > planDays
          ? ` (больше плана ${planDays} дн.)`
          : "";
    logChange(
      `Планирование «${item?.title ?? form.itemId}»: ${member ? shortFio(member.name) : "исполнитель"} — ${scheduled} дн. на таймлайне${deltaNote}`,
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
  const root = document.querySelector(".gantt-page:not(.gantt-fact-page)");
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

function bindGanttFactTab() {
  const root = document.querySelector(".gantt-fact-page");
  if (!root) return;

  root
    .querySelector("[data-tree-expand='gantt-fact']")
    ?.addEventListener("click", () => setGanttFactTreeExpanded(true));
  root
    .querySelector("[data-tree-collapse='gantt-fact']")
    ?.addEventListener("click", () => setGanttFactTreeExpanded(false));

  root
    .querySelectorAll<HTMLDetailsElement>("[data-gantt-fact-project]")
    .forEach((el) => {
      el.addEventListener("toggle", () => {
        const key = el.dataset.ganttFactProject;
        if (!key) return;
        if (el.open) delete ui.ganttFactCollapsedProjects[key];
        else ui.ganttFactCollapsedProjects[key] = true;
      });
    });
  root
    .querySelectorAll<HTMLDetailsElement>("[data-gantt-fact-fn]")
    .forEach((el) => {
      el.addEventListener("toggle", () => {
        const id = el.dataset.ganttFactFn;
        if (!id) return;
        if (el.open) delete ui.ganttFactCollapsedItems[id];
        else ui.ganttFactCollapsedItems[id] = true;
      });
    });
  root
    .querySelectorAll<HTMLDetailsElement>("[data-gantt-fact-team]")
    .forEach((el) => {
      el.addEventListener("toggle", () => {
        const key = el.dataset.ganttFactTeam;
        if (!key) return;
        if (el.open) delete ui.ganttFactCollapsedTeams[key];
        else ui.ganttFactCollapsedTeams[key] = true;
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
      notes: "",
      manualRank: nextPriority(state.items),
      cashFlow12m: draft.cashFlow12m,
      cashFlow24m: null,
      roi12m: draft.roi12m,
      roi24m: null,
      paybackMonths: null,
      projectAnchor: true,
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

  const applyEdit = (opts: {
    confirmStatus: boolean;
    confirmPrio: boolean;
    reason?: PriorityReason;
  }) => {
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
      const nowPrio = projectPrioMap().get(nextKey) ?? draft.priority;
      if (opts.reason) {
        recordPriorityChange(nextKey, draft.name, prevPrio, nowPrio, opts.reason);
      }
      logChange(
        `Приоритет проекта «${draft.name}»: #${prevPrio} → #${nowPrio}${
          opts.reason ? `. Причина: ${opts.reason.comment}` : ""
        }`,
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

  let reason: PriorityReason | undefined;
  const run = (confirmStatus: boolean, confirmPrio: boolean) => {
    applyEdit({ confirmStatus, confirmPrio, reason });
  };

  if (prioChanged && rankInput) {
    const maxPrio = Math.max(1, projectPrioMap().size);
    openPriorityReasonModal({
      projectTitle: group.title,
      from: prevPrio,
      to: Math.min(draft.priority, maxPrio),
      onCancel: () => undefined,
      onSave: (r) => {
        reason = r;
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
    });
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
  syncTeamRosters(state.teams);
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

function bindJiraApiTab() {
  if (ui.tab !== "settings") return;
  const box = document.querySelector("#jiraApiStatus");
  if (!box) return;

  const paint = (html: string) => {
    box.innerHTML = html;
  };

  const load = async () => {
    paint(`<p class="meta">Загрузка <span class="mono">GET /api/jira/status</span>…</p>`);
    try {
      const res = await fetch("/api/jira/status", { cache: "no-store" });
      const data = (await res.json()) as {
        status?: string;
        configured?: boolean;
        enabled?: boolean;
        jiraUrl?: string | null;
        message?: string;
        mode?: string;
        writeBack?: boolean;
      };
      const code = String(data.status ?? "not_configured");
      const tone =
        code === "ready" ? "is-ready" : code === "disabled" ? "is-warn" : "is-muted";
      paint(`
        <div class="api-status-row">
          <span class="api-status-pill ${tone}">${escapeHtml(code)}</span>
          <span class="meta">${escapeHtml(data.message ?? "")}</span>
        </div>
        <dl class="api-status-dl">
          <div><dt>Jira URL</dt><dd class="mono">${escapeHtml(data.jiraUrl || "—")}</dd></div>
          <div><dt>configured</dt><dd class="mono">${data.configured ? "true" : "false"}</dd></div>
          <div><dt>enabled</dt><dd class="mono">${data.enabled ? "true" : "false"}</dd></div>
          <div><dt>mode</dt><dd class="mono">${escapeHtml(String(data.mode ?? "read_only"))}</dd></div>
          <div><dt>writeBack</dt><dd class="mono">${data.writeBack ? "true" : "false"}</dd></div>
        </dl>
      `);
    } catch {
      paint(`
        <div class="api-status-row">
          <span class="api-status-pill is-muted">unreachable</span>
          <span class="meta">Backend не ответил. Запустите API на :8787 (<span class="mono">npm run dev</span> / <span class="mono">dev:api</span>).</span>
        </div>
      `);
    }
  };

  document.querySelector("#jiraApiRefreshBtn")?.addEventListener("click", () => {
    void load();
  });
  void load();
}

function bindUiRest() {
  bindJiraApiTab();

  document.querySelector("#brandHomeBtn")?.addEventListener("click", () => {
    setActiveTab("portfolio");
    render();
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
  bindGanttFactTab();

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
  bindTeamsPopups();

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
      const toggle = t.closest<HTMLElement>("[data-portfolio-toggle]");
      if (toggle) {
        e.preventDefault();
        e.stopPropagation();
        const key = toggle.dataset.portfolioToggle;
        if (!key) return;
        if (ui.portfolioExpandedProjects[key]) {
          delete ui.portfolioExpandedProjects[key];
        } else {
          ui.portfolioExpandedProjects[key] = true;
        }
        render();
        return;
      }
      if (isPortfolioStatusChrome(t)) return;
      if (
        t.closest(
          "[data-stop-edit], .prio-input, .prio-edit, .status-select, .status-cell, #appConfirmPop, .drag-handle"
        )
      )
        return;
      const fnRow = t.closest<HTMLTableRowElement>("[data-edit]");
      if (fnRow?.dataset.edit) {
        if (!currentCan("portfolio.edit")) return;
        ui.editingId = fnRow.dataset.edit;
        ui.creating = false;
        ui.editingProjectKey = null;
        ui.creatingProject = false;
        render();
        return;
      }
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
      const max = Number(input.max) || priority;
      const target = Math.min(priority, max);
      input.value = String(target);
      if (target === now) return;
      confirming = true;
      openPriorityReasonModal({
        projectTitle: title,
        from: now,
        to: target,
        onSave: (reason) => {
          confirming = false;
          state.items = moveProjectGroupToPriority(
            state.items,
            key,
            target,
            szRanges()
          );
          recordPriorityChange(key, title, now, target, reason);
          logChange(
            `Приоритет проекта «${title}»: #${now} → #${target}. Причина: ${reason.comment}`,
            "priority"
          );
          persist();
        },
        onCancel: () => {
          confirming = false;
          revert();
        },
      });
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

  document.querySelectorAll<HTMLInputElement>("[data-fn-prio]").forEach((input) => {
    const itemId = input.dataset.fnPrio ?? "";
    let confirming = false;
    const revert = () => {
      input.value = input.dataset.fnPrioNow ?? "1";
    };
    const commit = () => {
      if (confirming) return;
      const raw = Number(input.value);
      const now = Number(input.dataset.fnPrioNow);
      if (!Number.isFinite(raw) || raw < 1) {
        revert();
        return;
      }
      const max = Number(input.max) || 1;
      const priority = Math.min(max, Math.round(raw));
      input.value = String(priority);
      if (priority === now) return;
      armSuppressPortfolioRowEdit();
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return;
      const project = projectGroupKey(item);
      confirming = true;
      askPrioConfirm(
        input,
        `Сменить приоритет функциональности «${escapeHtml(item.title)}» в проекте «${escapeHtml(project)}» на <span class="accent">${priority}</span>?`,
        () => {
          confirming = false;
          state.items = moveFunctionalityWithinProject(
            state.items,
            itemId,
            priority,
            szRanges()
          );
          logChange(
            `Приоритет функциональности «${item.title}» (${project}): #${now} → #${priority}`,
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
      if (
        key === "eta" ||
        key === "priority" ||
        key === "cashFlow" ||
        key === "roi"
      )
        toggleSort(key);
    });
  });

  bindPortfolioColResize();
  bindPortfolioTableScroll();
  bindStickyTabsOffset();
  bindPlanStartDate();
  bindGanttTreePickerOutsideClose();

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

  document.querySelectorAll<HTMLButtonElement>("[data-gantt-scale]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = normalizeGanttScale(btn.dataset.ganttScale);
      if (next === ui.ganttScale) return;
      ui.ganttScale = next;
      saveGanttScale(next);
      render();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-gantt-depth]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = normalizeGanttDepth(btn.dataset.ganttDepth);
      if (next === ui.ganttDepthMonths) return;
      ui.ganttDepthMonths = next;
      saveGanttDepth(next);
      render();
    });
  });
  document
    .querySelectorAll<HTMLButtonElement>("[data-gantt-tree-level]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = normalizeGanttTreeLevel(btn.dataset.ganttTreeLevel);
        if (next === ui.ganttTreeLevel) return;
        ui.ganttTreeLevel = next;
        saveGanttTreeLevel(next);
        render();
      });
    });

  document
    .querySelectorAll<HTMLButtonElement>("[data-gantt-fact-scale]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = normalizeGanttScale(btn.dataset.ganttFactScale);
        if (next === ui.ganttFactScale) return;
        ui.ganttFactScale = next;
        saveGanttFactScale(next);
        render();
      });
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-gantt-fact-depth]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = normalizeGanttDepth(btn.dataset.ganttFactDepth);
        if (next === ui.ganttFactDepthMonths) return;
        ui.ganttFactDepthMonths = next;
        saveGanttFactDepth(next);
        render();
      });
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-gantt-fact-tree-level]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = normalizeGanttTreeLevel(btn.dataset.ganttFactTreeLevel);
        if (next === ui.ganttFactTreeLevel) return;
        ui.ganttFactTreeLevel = next;
        saveGanttFactTreeLevel(next);
        render();
      });
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

  document.querySelectorAll<HTMLButtonElement>("[data-journal-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.dataset.journalView === "all" ? "all" : "priority";
      if (ui.journalView === v) return;
      ui.journalView = v;
      render();
    });
  });
  document
    .querySelector<HTMLSelectElement>("#journalProject")
    ?.addEventListener("change", (e) => {
      ui.journalProject = (e.currentTarget as HTMLSelectElement).value;
      render();
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
  syncPortfolioTableWidths({ [col]: width });
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
    const demandWeeks = teamQueuePw(slices, t.id);
    return demandWeeks > 8 * SCHEDULE_CAPACITY_PW;
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
      roster: teamRosterFactLabel(t),
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
  const depth =
    ui.tab === "timelineFact" ? ui.ganttFactDepthMonths : ui.ganttDepthMonths;
  const weeks = Math.max(
    4,
    Math.min(GANTT_WEEKS_MAX, Math.max(ganttHorizonWeeks(depth), contentWeeks))
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
  const exportGantt = ui.tab === "timeline" || ui.tab === "timelineFact";
  const filename = exportGantt
    ? ui.tab === "timelineFact"
      ? `VI-Planer-gantt-fact-${stamp}.pdf`
      : `VI-Planer-gantt-${stamp}.pdf`
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
  ui.ganttScale = loadGanttScale();
  ui.ganttDepthMonths = loadGanttDepth();
  ui.ganttTreeLevel = loadGanttTreeLevel();
  ui.ganttFactScale = loadGanttFactScale();
  ui.ganttFactDepthMonths = loadGanttFactDepth();
  ui.ganttFactTreeLevel = loadGanttFactTreeLevel();
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
