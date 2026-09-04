import "./styles.css";
import {
  AppState,
  ItemSchedule,
  ScheduledSlice,
  WorkItem,
  ItemStatus,
  ItemType,
  TeamAssignment,
  formatDate,
  schedulePortfolio,
  ScheduleMode,
  sortByPriority,
  totalEstimateWeeks,
  sizePlanWeeks,
  sizeLabel,
  sizeRangesSummary,
  parseSize,
  TSHIRT_SIZES,
  TShirtSize,
  SizeRanges,
  normalizeSizeRanges,
  hasTeam,
  uid,
  wsjf,
  normalizeState,
  snapToMonday,
  addDays,
  addWeeks,
  ensureUniquePriorities,
  findPriorityConflict,
  nextPriority,
  moveItemToPriority,
  reorderVisiblePriority,
  TeamLoadWeek,
  Team,
  scheduledOverloadWeeks,
  isTeamWeekOverloaded,
  utilizationPct,
} from "./model";
import { SEED } from "./seed";
import {
  loadState,
  saveState,
  getSyncStatus,
  onSyncStatusChange,
  syncStatusLabel,
} from "./storage";
import { downloadElementPdf } from "./pdfExport";

type Tab = "portfolio" | "teams" | "timeline" | "capacity" | "queuesTest" | "settings";
type SortKey = "priority" | "wsjf" | "estimate" | "eta";
type SortDir = "asc" | "desc";

const TAB_LABELS: Record<Tab, string> = {
  portfolio: "Портфель",
  teams: "Очереди команд",
  queuesTest: "Очереди (тест)",
  timeline: "Сроки / Gantt",
  capacity: "Команды",
  settings: "Настройки",
};

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
  /** Gantt horizon in weeks */
  ganttWeeks: number;
  /** Experimental per-team capacity / overload visualization */
  showTeamLoad: boolean;
  /**
   * When true: schedulePortfolio auto mode (queue by priority + capacity).
   * When false: keep user workStartDates (manual) so overload is visible.
   */
  autoCapacitySchedule: boolean;
  hiddenCols: HideablePortfolioCol[];
  colPickerOpen: boolean;
}

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
  ganttWeeks: 16,
  showTeamLoad: false,
  autoCapacitySchedule: false,
  hiddenCols: [],
  colPickerOpen: false,
};

let state: AppState = structuredClone(SEED);
/** Latest scheduled load snapshot for overload explain popovers (same weeks as Gantt) */
let lastScheduledLoad: Record<string, TeamLoadWeek[]> = {};
let lastOverflowByTeam: Record<string, Set<number>> = {};
let overloadHoverTimer: number | null = null;
let overloadPinned = false;

function szRanges(): SizeRanges {
  return state.sizeRanges;
}

function teamById(id: string) {
  return state.teams.find((t) => t.id === id);
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
    idea: "Идея",
    ready: "Готово к работе",
    in_progress: "В работе",
    blocked: "Блокер",
    done: "Готово",
  };
  return map[s];
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
      const tip = `${name} ${a.size} · старт ${formatDate(a.workStartDate)}`;
      return `<span class="team-chip" title="${escapeAttr(tip)}"><span class="team-chip-name"><span class="team-dot" style="background:${t?.color ?? "#94a3b8"}"></span><span class="team-chip-text">${escapeHtml(name)}</span></span><span class="team-chip-estimate"><span class="size-badge mono">${a.size}</span><span class="mono muted-inline">старт ${formatDate(a.workStartDate)}</span></span></span>`;
    })
    .join("");
  return `<div class="teams-stack">${chips}</div>`;
}

function filteredItems(rollups: ItemSchedule[]): WorkItem[] {
  const q = ui.query.trim().toLowerCase();
  const byId = rollupById(rollups);
  const filtered = state.items.filter((item) => {
    if (ui.typeFilter !== "all" && item.type !== ui.typeFilter) return false;
    if (ui.teamFilter !== "all" && !hasTeam(item, ui.teamFilter)) return false;
    if (ui.statusFilter !== "all" && item.status !== ui.statusFilter)
      return false;
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.backlog.toLowerCase().includes(q) ||
      item.owner.toLowerCase().includes(q) ||
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
    if (ui.sortKey === "wsjf") {
      cmp = wsjf(a) - wsjf(b);
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
const SHOW_TEAM_LOAD_KEY = "vi-planer-show-team-load";
const AUTO_CAPACITY_SCHEDULE_KEY = "vi-planer-auto-capacity-schedule";

type PortfolioCol =
  | "priority"
  | "type"
  | "title"
  | "teams"
  | "status"
  | "wsjf"
  | "estimate"
  | "eta";

type HideablePortfolioCol = Exclude<PortfolioCol, "priority" | "title">;

const HIDEABLE_PORTFOLIO_COLS: HideablePortfolioCol[] = [
  "type",
  "teams",
  "status",
  "wsjf",
  "estimate",
  "eta",
];

const ALL_PORTFOLIO_COLS: PortfolioCol[] = [
  "priority",
  "type",
  "title",
  "teams",
  "status",
  "wsjf",
  "estimate",
  "eta",
];

const PORTFOLIO_COL_LABELS: Record<PortfolioCol, string> = {
  priority: "Приоритет",
  type: "Тип",
  title: "Инициатива / исходный бэклог",
  teams: "Команды (майка · старт)",
  status: "Статус",
  wsjf: "WSJF",
  estimate: "Оценка, майки",
  eta: "ETA",
};

const PORTFOLIO_COL_DEFAULTS: Record<PortfolioCol, number> = {
  priority: 96,
  type: 88,
  title: 260,
  teams: 220,
  status: 130,
  wsjf: 72,
  estimate: 120,
  eta: 140,
};

function loadColWidths(): Partial<Record<PortfolioCol, number>> {
  try {
    const raw = localStorage.getItem(COL_WIDTH_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<Record<PortfolioCol, number>>;
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
    return parsed.filter((c): c is HideablePortfolioCol =>
      HIDEABLE_PORTFOLIO_COLS.includes(c as HideablePortfolioCol),
    );
  } catch {
    return [];
  }
}

function saveHiddenCols(hidden: HideablePortfolioCol[]) {
  localStorage.setItem(COL_VISIBILITY_KEY, JSON.stringify(hidden));
}

function loadShowTeamLoad(): boolean {
  try {
    return localStorage.getItem(SHOW_TEAM_LOAD_KEY) === "1";
  } catch {
    return false;
  }
}

function saveShowTeamLoad(show: boolean) {
  localStorage.setItem(SHOW_TEAM_LOAD_KEY, show ? "1" : "0");
}

function loadAutoCapacitySchedule(): boolean {
  try {
    return localStorage.getItem(AUTO_CAPACITY_SCHEDULE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveAutoCapacitySchedule(on: boolean) {
  localStorage.setItem(AUTO_CAPACITY_SCHEDULE_KEY, on ? "1" : "0");
}

function activeScheduleMode(): ScheduleMode {
  return ui.autoCapacitySchedule ? "auto" : "manual";
}

function scheduleState(stateOverride?: AppState) {
  return schedulePortfolio(stateOverride ?? state, {
    mode: activeScheduleMode(),
  });
}

function showTeamLoadToggleHtml(): string {
  return `
    <label class="team-load-toggle">
      <input type="checkbox" id="showTeamLoad" ${ui.showTeamLoad ? "checked" : ""} />
      Показать загрузку команд
    </label>`;
}

function autoCapacityToggleHtml(): string {
  return `
    <label class="team-load-toggle" title="Выкл: даты старта как заданы (видны перегрузки). Вкл: сдвиг по приоритету и ёмкости команд.">
      <input type="checkbox" id="autoCapacitySchedule" ${ui.autoCapacitySchedule ? "checked" : ""} />
      Автоматически сдвигать по ёмкости
    </label>`;
}

function scheduleTogglesHtml(): string {
  return `<div class="schedule-toggles">${showTeamLoadToggleHtml()}${autoCapacityToggleHtml()}</div>`;
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

function measureColMinWidth(label: string, col?: PortfolioCol): number {
  if (col && colMinWidthCache[col] != null) return colMinWidthCache[col]!;
  const probe = document.createElement("span");
  probe.textContent = label;
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:nowrap;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-family:IBM Plex Sans,system-ui,sans-serif;padding:0;";
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
  const min = measureColMinWidth(PORTFOLIO_COL_LABELS[col], col);
  const width = Math.max(min, stored ?? PORTFOLIO_COL_DEFAULTS[col]);
  return `width:${width}px;min-width:${min}px`;
}

function resizableTh(
  label: string,
  col: PortfolioCol,
  extraClass = "",
  dataSort?: SortKey,
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
  return `<th class="resizable-th ${sortCls}${hiddenCls} ${extraClass}" data-col="${col}"${sortAttr}${titleAttr} style="${colWidthStyle(col)}"><span class="th-label">${label}${arrow}</span><span class="col-resize" data-col-resize="${col}" title="Изменить ширину"></span></th>`;
}

function sortHeader(label: string, key: SortKey, extraClass = ""): string {
  const colMap: Partial<Record<SortKey, PortfolioCol>> = {
    priority: "priority",
    wsjf: "wsjf",
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
    render();
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
    // priority: 1 first (asc); WSJF: high first (desc); estimate/ETA: smaller/sooner first
    ui.sortDir = key === "wsjf" ? "desc" : "asc";
  }
  render();
}

function metricsHtml(rollups: ItemSchedule[], slices: ScheduledSlice[]): string {
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
        <div class="hint">до закрытия (по bottleneck-команде)</div>
      </div>
      <div class="metric">
        <div class="label">Команд под риском</div>
        <div class="value">${overloaded}</div>
        <div class="hint">очередь длиннее 8 недель</div>
      </div>
      <div class="metric">
        <div class="label">Старт планирования</div>
        <div class="value" style="font-size:18px">${formatDate(state.startDate)}</div>
        <div class="hint">понедельник текущей недели</div>
      </div>
    </div>
  `;
}

function columnsHelpHtml(): string {
  return `
    <details class="callout callout-cols agenda">
      <summary class="agenda-summary">Адженда</summary>
      <div class="cols-help">
        <div><span class="cols-help-k">Приоритет</span> — сквозной ранг (1 = выше); тяните строку за ⋮⋮, чтобы переставить. Сортировка других колонок приоритет не меняет</div>
        <div><span class="cols-help-k">Тип</span> — проект или продукт</div>
        <div><span class="cols-help-k">Инициатива</span> — название, исходный бэклог и владелец</div>
        <div><span class="cols-help-k">Команды</span> — кто делает, майка (S/M/L) и план старта</div>
        <div><span class="cols-help-k">Статус</span> — стадия готовности</div>
        <div><span class="cols-help-k">WSJF</span> — (BV + TC + RR) / Job Size</div>
        <div><span class="cols-help-k">Оценка</span> — майки S / M / L (недели в Настройках)</div>
        <div><span class="cols-help-k">ETA</span> — дата готовности (когда закончила последняя команда)</div>
      </div>
    </details>
  `;
}

function portfolioHtml(rollups: ItemSchedule[], _slices: ScheduledSlice[]): string {
  const byId = rollupById(rollups);
  const visible = filteredItems(rollups);
  const canDrag = ui.sortKey === "priority";

  const rows = visible
    .map((item) => {
      const r = byId.get(item.id);
      const score = wsjf(item);
      const total = totalEstimateWeeks(item, szRanges());
      const prio = item.manualRank ?? "—";
      const etaMeta = r
        ? `<div class="eta-teams">${r.slices
            .map((s) => {
              const t = teamById(s.teamId);
              const color = t?.color ?? "#64748b";
              return `<div class="eta-team"><span class="eta-team-name" style="color:${color}">${escapeHtml(t?.name ?? s.teamId)}</span>: ${formatDate(s.startDate)}→${formatDate(s.endDate)}</div>`;
            })
            .join("")}</div>`
        : "";
      return `
        <tr class="clickable ${canDrag ? "row-draggable" : ""}" data-edit="${item.id}" data-row-id="${item.id}">
          <td${tdAttrs("priority", "prio-cell")}>
            <div class="prio-edit" data-stop-edit>
              ${
                canDrag
                  ? `<span class="drag-handle" data-drag-handle title="Перетащить для смены приоритета" role="button" tabindex="0" aria-label="Перетащить">⋮⋮</span>`
                  : ""
              }
              <input
                class="prio-input"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                data-prio-id="${item.id}"
                value="${prio}"
                title="Приоритет (1 = выше)"
                aria-label="Приоритет"
              />
            </div>
          </td>
          <td${tdAttrs("type", "type-cell")}>
            <span class="badge badge-${item.type}">${item.type === "product" ? "Продукт" : "Проект"}</span>
            ${item.assignments.length > 1 ? `<div class="type-team-count">${item.assignments.length} команды</div>` : ""}
          </td>
          <td${tdAttrs("title", "title-cell")}>
            <div class="name">${escapeHtml(item.title)}</div>
            <div class="meta">${escapeHtml(item.backlog)} · ${escapeHtml(item.owner)}</div>
          </td>
          <td${tdAttrs("teams", "teams-cell")}>${teamsCellHtml(item)}</td>
          <td${tdAttrs("status", "status-cell")}><span class="badge badge-status-${item.status}">${statusLabel(item.status)}</span></td>
          <td${tdAttrs("wsjf", "wsjf-cell mono metric-num")}>${score}</td>
          <td${tdAttrs("estimate", "estimate-cell mono metric-num")}>
            <span class="size-badge">${sizesSummary(item)}</span>
            <div class="meta">~${total} чел·нед</div>
          </td>
          <td${tdAttrs("eta", `mono eta-cell ${r && r.waitWeeks > 4 ? "eta-late" : "eta-good"}`)}>
            ${r ? `<span class="eta-final">${formatDate(r.endDate)}</span>` : "—"}
            ${etaMeta}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    ${columnsHelpHtml()}
    <div class="panel portfolio-panel">
      <div class="portfolio-sticky">
        <div class="panel-header">
          <h2>Единый портфель (проекты + продукты)</h2>
          <div class="filters">
            <input id="q" placeholder="Поиск…" value="${escapeAttr(ui.query)}" />
            <select id="typeFilter">
              <option value="all" ${ui.typeFilter === "all" ? "selected" : ""}>Все типы</option>
              <option value="product" ${ui.typeFilter === "product" ? "selected" : ""}>Продукты</option>
              <option value="project" ${ui.typeFilter === "project" ? "selected" : ""}>Проекты</option>
            </select>
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
              ${(["idea", "ready", "in_progress", "blocked", "done"] as ItemStatus[])
                .map(
                  (s) =>
                    `<option value="${s}" ${ui.statusFilter === s ? "selected" : ""}>${statusLabel(s)}</option>`
                )
                .join("")}
            </select>
            ${portfolioColPickerHtml()}
            <button class="btn" id="resetFilters" title="Сбросить фильтры, сортировку и колонки">Сбросить фильтры</button>
            <button class="btn btn-primary" id="addItem">+ Инициатива</button>
          </div>
        </div>
        <div class="table-scroll-top" aria-hidden="true"><div class="table-scroll-top-inner"></div></div>
      </div>
      ${
        canDrag
          ? ""
          : `<p class="sort-prio-hint">Сейчас сортировка не по приоритету — перестановка строк отключена, приоритеты не меняются. Верните сортировку по «Приоритет», чтобы двигать строки.</p>`
      }
      <div class="table-scroll-wrap">
        <div class="table-scroll">
          <table class="portfolio-table">
            <thead>
              <tr>
                ${sortHeader("Приоритет", "priority", "prio-cell")}
                ${resizableTh("Тип", "type", "type-cell")}
                ${resizableTh("Инициатива / исходный бэклог", "title", "title-cell")}
                ${resizableTh("Команды (оценка · старт)", "teams")}
                ${resizableTh("Статус", "status", "status-cell")}
                ${sortHeader("WSJF", "wsjf", "wsjf-cell")}
                ${sortHeader("Оценка, майки", "estimate", "estimate-cell")}
                ${sortHeader("ETA", "eta")}
              </tr>
            </thead>
            <tbody id="portfolioBody">
              ${rows || `<tr><td colspan="${visiblePortfolioColCount()}" class="empty">Нет элементов по фильтру</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function teamsHtml(
  slices: ScheduledSlice[],
  load: Record<string, TeamLoadWeek[]>,
  overflowByTeam: Record<string, Set<number>>
): string {
  const horizon = 12;
  const cards = state.teams
    .map((team) => {
      const queue = slices
        .filter((s) => s.teamId === team.id)
        .sort((a, b) => a.effectiveRank - b.effectiveRank);
      const demand = queue.reduce((sum, s) => sum + s.estimatePw, 0);
      const weeksToClear = team.capacityPw > 0 ? demand / team.capacityPw : 0;
      const util8 = Math.min(
        100,
        Math.round(
          (queue
            .filter((s) => s.startWeek < 8)
            .reduce((sum, s) => {
              const overlap = Math.min(s.endWeek + 1, 8) - s.startWeek;
              return (
                sum +
                Math.max(0, overlap) *
                  (s.estimatePw / Math.max(1, s.endWeek - s.startWeek + 1))
              );
            }, 0) /
            (team.capacityPw * 8)) *
            100
        )
      );

      return `
        <div class="team-card">
          <div class="team-card-head">
            <div>
              <h3><span class="team-dot" style="background:${team.color}"></span>${escapeHtml(team.name)}</h3>
              <div class="meta">Ёмкость ${team.capacityPw} чел·нед/нед · спрос ${demand.toFixed(1)} · ~${weeksToClear.toFixed(1)} нед. до очистки</div>
            </div>
            <div class="mono" style="font-weight:700">${util8}% / 8 нед.</div>
          </div>
          <div class="bar"><span style="width:${Math.min(100, util8)}%;background:${team.color}"></span></div>
          ${
            ui.showTeamLoad
              ? `<div class="cap-strip-wrap">
            <div class="cap-strip-label meta">Загрузка по расписанию (эксп.) — красный = перегруз ёмкости; наведите или нажмите</div>
            ${teamCapacityStripHtml(
              team,
              load[team.id] ?? [],
              overflowByTeam[team.id] ?? new Set(),
              horizon
            )}
          </div>`
              : ""
          }
          ${queue
            .map((s) => {
              const others = s.item.assignments.length - 1;
              return `
            <div class="queue-item">
              <div class="rank">${s.effectiveRank}</div>
              <div>
                <div><span class="badge badge-${s.item.type}">${s.item.type === "product" ? "П" : "Пр"}</span> ${escapeHtml(s.item.title)}</div>
                <div class="meta">WSJF ${s.wsjf} · ${s.size} (${s.estimatePw} чел·нед) · план ${formatDate(s.plannedStartDate)}${s.delayedByQueue ? " → сдвиг" : ""}${others > 0 ? ` · ещё ${others} ком.` : ""}</div>
              </div>
              <div class="mono" style="text-align:right">
                ${formatDate(s.startDate)} →<br/>${formatDate(s.endDate)}
              </div>
            </div>
          `;
            })
            .join("") || `<div class="empty">Очередь пуста</div>`}
        </div>
      `;
    })
    .join("");

  return `
    <div class="panel panel-sticky-host">
      <div class="panel-sticky">
        <div class="panel-header">
          <h2>Сквозной приоритет по командам</h2>
          ${scheduleTogglesHtml()}
        </div>
      </div>
      ${cards}
    </div>
  `;
}

/** Test view: portfolio priority + when the team can pick up the task */
function queuesTestHtml(
  slices: ScheduledSlice[],
  load: Record<string, TeamLoadWeek[]>,
  overflowByTeam: Record<string, Set<number>>
): string {
  const planStart = state.startDate;
  const horizon = 12;
  const auto = ui.autoCapacitySchedule;
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
            const prio = s.item.manualRank ?? "—";
            const blockedBy =
              idx > 0
                ? queue[idx - 1]
                : null;
            let takeReason = "может взять сразу (очередь свободна)";
            let takeClass = "take-now";
            if (s.startDate > s.plannedStartDate) {
              takeReason = blockedBy
                ? `ждёт очередь: после #${blockedBy.item.manualRank ?? "?"} «${blockedBy.item.title}»`
                : "сдвиг из‑за загрузки очереди";
              takeClass = "take-queue";
            } else if (s.startDate > planStart) {
              takeReason = auto
                ? `ждёт плановый старт ${formatDate(s.plannedStartDate)}`
                : `плановый старт ${formatDate(s.plannedStartDate)}`;
              takeClass = "take-plan";
            } else if (!auto) {
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
              <div class="meta">Ёмкость ${team.capacityPw} чел·нед/нед · спрос ${demand.toFixed(1)} · ~${weeksToClear.toFixed(1)} нед. до очистки</div>
              <div class="take-free">Очередь закрывается / слот после всего: <strong>${formatDate(freeFrom)}</strong></div>
            </div>
            <div class="mono" style="font-weight:600;text-align:right;font-size:12px;color:var(--muted)">
              по приоритету<br/>портфеля
            </div>
          </div>
          ${
            ui.showTeamLoad
              ? `<div class="cap-strip-wrap">
            <div class="cap-strip-label meta">Загрузка по расписанию (эксп.) — красный = перегруз ёмкости; наведите или нажмите</div>
            ${teamCapacityStripHtml(
              team,
              load[team.id] ?? [],
              overflowByTeam[team.id] ?? new Set(),
              horizon
            )}
          </div>`
              : ""
          }
          ${items}
        </div>
      `;
    })
    .join("");

  return `
    <div class="callout">
      <strong>Тест:</strong> цифра — приоритет из Портфеля (1 = выше).
      ${
        auto
          ? "«Может взять с …» — фактическая дата с учётом очереди и планового старта."
          : "Сейчас без автосдвига: даты = заданные старты; параллельная работа может перегрузить ёмкость."
      }
      Полоска — окно работы в ближайшие 12 недель.
    </div>
    <div class="panel panel-sticky-host">
      <div class="panel-sticky">
        <div class="panel-header">
          <h2>Очереди (тест) — когда команда может взять задачу</h2>
          ${scheduleTogglesHtml()}
        </div>
      </div>
      ${cards}
    </div>
  `;
}

function timelineHtml(
  rollups: ItemSchedule[],
  slices: ScheduledSlice[],
  load: Record<string, TeamLoadWeek[]>,
  overflowByTeam: Record<string, Set<number>>
): string {
  const needed = Math.max(4, ...rollups.map((s) => s.endWeek + 2), 4);
  const weeks = Math.max(4, Math.min(52, Math.round(ui.ganttWeeks) || 16));
  ui.ganttWeeks = weeks;
  const ordered = sortByPriority(state.items.filter((i) => i.status !== "done"));
  const visible = ordered
    .map((item) => {
      const r = rollups.find((x) => x.item.id === item.id);
      return r ? { item, r } : null;
    })
    .filter((x): x is { item: (typeof ordered)[number]; r: ItemSchedule } => !!x);
  const rowIndex = new Map(visible.map(({ item }, i) => [item.id, i]));
  const n = Math.max(1, visible.length);
  const weekPct = 100 / weeks;
  const trackBg = `repeating-linear-gradient(90deg, #f5f5f5 0, #f5f5f5 calc(${weekPct}% - 1px), #e0e0e0 calc(${weekPct}% - 1px), #e0e0e0 ${weekPct}%)`;

  // Same-team queue deps: only meaningful when auto capacity queue shifts work
  const depPaths: string[] = [];
  const depMarkers: string[] = [];
  if (ui.autoCapacitySchedule) {
    state.teams.forEach((team, teamIdx) => {
      const queue = slices
        .filter((s) => s.teamId === team.id)
        .sort((a, b) => a.effectiveRank - b.effectiveRank);
      if (queue.length < 2) return;

      const markerId = `arrow-${team.id}`;
      depMarkers.push(`
      <marker id="${markerId}" markerWidth="0.28" markerHeight="0.28" refX="0.22" refY="0.14" orient="auto" markerUnits="userSpaceOnUse">
        <polygon points="0 0, 0.28 0.14, 0 0.28" fill="${team.color}" fill-opacity="0.95" />
      </marker>
    `);

      for (let i = 1; i < queue.length; i++) {
        const prev = queue[i - 1];
        const curr = queue[i];
        const y1 = (rowIndex.get(prev.item.id) ?? 0) + 0.5;
        const y2 = (rowIndex.get(curr.item.id) ?? 0) + 0.5;
        const x1 = Math.min(weeks - 0.05, prev.endWeek + 0.92);
        const x2 = Math.min(weeks - 0.05, Math.max(0.08, curr.startWeek + 0.02));
        const dx = x2 - x1;
        const lane = ((teamIdx % 4) - 1.5) * 0.08;

        // Gentle S-curve: control points stay near each endpoint's Y
        // (avoids the "shared midX" loop that stretches under preserveAspectRatio=none)
        const bulge = Math.max(0.35, Math.abs(dx) * 0.45) + Math.abs(lane);
        const c1x = x1 + (dx >= 0 ? bulge : -bulge * 0.35) + lane;
        const c2x = x2 - (dx >= 0 ? bulge : -bulge * 0.35) + lane;
        const d =
          Math.abs(y1 - y2) < 0.02
            ? `M ${x1} ${y1} H ${x2}`
            : `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;

        depPaths.push(
          `<path d="${d}" fill="none" stroke="${team.color}" stroke-width="0.05" stroke-opacity="0.65" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#${markerId})" />`
        );
      }
    });
  }

  const BAR_H = 20;
  const BAR_GAP = 3;
  const TRACK_PAD = 6;

  /** Pack overlapping team bars into vertical lanes within one item row */
  const packBarLanes = (itemSlices: ScheduledSlice[]) => {
    const sorted = [...itemSlices].sort(
      (a, b) => a.startWeek - b.startWeek || a.endWeek - b.endWeek
    );
    const laneEnds: number[] = [];
    return sorted.map((slice) => {
      let lane = laneEnds.findIndex((end) => end < slice.startWeek);
      if (lane < 0) {
        lane = laneEnds.length;
        laneEnds.push(slice.endWeek);
      } else {
        laneEnds[lane] = slice.endWeek;
      }
      return { slice, lane };
    });
  };

  const rowLaneCounts = visible.map(({ r }) => {
    const packed = packBarLanes(r.slices);
    return packed.length ? Math.max(...packed.map((p) => p.lane)) + 1 : 1;
  });
  const maxLanes = Math.max(1, ...rowLaneCounts);
  // Equal row height keeps dep SVG Y mapping (0..n) aligned with DOM rows
  const trackH =
    TRACK_PAD * 2 + maxLanes * BAR_H + Math.max(0, maxLanes - 1) * BAR_GAP;
  const rowH = Math.max(58, trackH);

  const rowsHtml = visible
    .map(({ item, r }) => {
      const depHint = ui.autoCapacitySchedule
        ? (() => {
            const preds = r.slices
              .map((s) => {
                const teamQueue = slices
                  .filter((x) => x.teamId === s.teamId)
                  .sort((a, b) => a.effectiveRank - b.effectiveRank);
                const idx = teamQueue.findIndex((x) => x.item.id === item.id);
                if (idx <= 0) return null;
                const pred = teamQueue[idx - 1];
                const t = teamById(s.teamId);
                return `#${pred.item.manualRank} (${t?.name ?? s.teamId})`;
              })
              .filter(Boolean);
            const uniqPreds = [...new Set(preds)];
            return uniqPreds.length
              ? `<div class="meta gantt-dep-meta">после ${uniqPreds.join(", ")}</div>`
              : `<div class="meta gantt-dep-meta">старт очереди</div>`;
          })()
        : `<div class="meta gantt-dep-meta">как задано · без сдвига очереди</div>`;

      const packed = packBarLanes(r.slices);
      const bars = packed
        .map(({ slice: s, lane: barLane }) => {
          const team = teamById(s.teamId);
          const left = (s.startWeek / weeks) * 100;
          const width =
            (Math.max(1, s.endWeek - s.startWeek + 1) / weeks) * 100;
          const isBot = s.teamId === r.bottleneckTeamId;
          const top = TRACK_PAD + barLane * (BAR_H + BAR_GAP);
          const teamOverflow = overflowByTeam[s.teamId] ?? new Set();
          const barOverload = Array.from(
            { length: Math.max(1, s.endWeek - s.startWeek + 1) },
            (_, i) => s.startWeek + i
          ).some((w) => teamOverflow.has(w));
          const overloadCls = barOverload ? " gantt-bar-overload" : "";
          const title = `${team?.name ?? ""}: ${formatDate(s.startDate)} → ${formatDate(s.endDate)}${barOverload ? " · перегруз ёмкости" : ""}`;
          return `<div class="gantt-bar ${isBot ? "gantt-bot" : ""}${overloadCls}" style="left:${left}%;width:${Math.max(width, 2.5)}%;top:${top}px;height:${BAR_H}px;background:${team?.color ?? "#64748b"}" title="${escapeAttr(title)}">${escapeHtml(team?.name ?? "")}</div>`;
        })
        .join("");

      return `
      <div class="gantt-row" style="--gantt-row-h:${rowH}px;--gantt-track-h:${trackH}px">
        <div class="gantt-label">
          <div class="name"><span class="prio-mini">${item.manualRank ?? "—"}</span> ${escapeHtml(item.title)}</div>
          <div class="meta">${item.type === "product" ? "Продукт" : "Проект"} · ETA ${formatDate(r.endDate)}</div>
          ${depHint}
        </div>
        <div class="gantt-track gantt-track-multi" style="background:${trackBg}">${bars}</div>
      </div>`;
    })
    .join("");

  const tickStep =
    weeks <= 12 ? 1 : weeks <= 24 ? 2 : weeks <= 36 ? 3 : 4;
  const anyOverflowWeek = (w: number) =>
    state.teams.some((t) => overflowByTeam[t.id]?.has(w));

  const axisTicks = Array.from({ length: weeks }, (_, w) => {
    const show = w % tickStep === 0 || w === weeks - 1;
    const isOverflow = ui.showTeamLoad && anyOverflowWeek(w);
    const overflowCls = isOverflow ? " gantt-axis-tick-overflow" : "";
    const overloadAttrs = isOverflow
      ? ` data-overload-week="${w}" role="button" tabindex="0" aria-label="Перегруз Н${w + 1}: расшифровка"`
      : "";
    if (!show) {
      return `<div class="gantt-axis-tick gantt-axis-tick-empty${overflowCls}" style="width:${weekPct}%"${overloadAttrs}></div>`;
    }
    const monday = addWeeks(state.startDate, w);
    const [, m, d] = monday.split("-");
    return `<div class="gantt-axis-tick${overflowCls}" style="width:${weekPct}%"${overloadAttrs}>
      <span class="gantt-axis-w">Н${w + 1}</span>
      <span class="gantt-axis-d">${d}.${m}</span>
    </div>`;
  }).join("");

  const capacityRows = state.teams
    .map((team) => {
      const teamOverflow = overflowByTeam[team.id] ?? new Set();
      const hasOverflow = [...teamOverflow].some((w) => w < weeks);
      return `
        <div class="gantt-cap-row">
          <div class="gantt-cap-label">
            <span class="team-dot" style="background:${team.color}"></span>
            ${escapeHtml(team.name)}
            ${hasOverflow ? '<span class="cap-overflow-badge">перегруз</span>' : ""}
          </div>
          ${teamCapacityStripHtml(team, load[team.id] ?? [], teamOverflow, weeks)}
        </div>`;
    })
    .join("");

  return `
    <div class="panel panel-sticky-host">
      <div class="panel-sticky">
        <div class="panel-header">
          <h2>Сроки и зависимости по приоритету</h2>
          <div class="gantt-weeks-ctrl">
            ${scheduleTogglesHtml()}
            <div class="gantt-weeks-ctrl-right">
              <label for="ganttWeeks">Горизонт</label>
              <input id="ganttWeeks" type="range" min="4" max="52" step="1" value="${weeks}" />
              <span class="mono" id="ganttWeeksLabel">${weeks} нед.</span>
              ${
                needed > weeks
                  ? `<span class="meta">часть работ за горизонтом (нужно ~${needed})</span>`
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
      <div class="timeline">
        ${
          visible.length
            ? `<div class="gantt-layout">
          <div class="gantt-axis-row">
            <div class="gantt-axis-spacer">
              <span class="meta">нед. с ${formatDate(state.startDate)}</span>
            </div>
            <div class="gantt-axis">${axisTicks}</div>
          </div>
          <div class="gantt-rows">
            <svg class="gantt-dep-layer" viewBox="0 0 ${weeks} ${n}" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                ${depMarkers.join("")}
              </defs>
              ${depPaths.join("")}
            </svg>
            ${rowsHtml}
          </div>
          ${
            ui.showTeamLoad
              ? `<div class="gantt-capacity-block">
            <div class="gantt-capacity-head meta">Загрузка команд по расписанию (эксперимент) — те же недели, что полоски Gantt; красный = перегруз ёмкости</div>
            <div class="gantt-capacity-rows">${capacityRows}</div>
          </div>`
              : ""
          }
        </div>`
            : `<div class="empty">Нет активных инициатив</div>`
        }
      </div>
      <p class="footer-note" style="padding:0 16px 16px;margin:0">${
        ui.autoCapacitySchedule
          ? "Шкала — недели от старта планирования (понедельник). Стрелки — зависимости очереди команды. ETA инициативы = конец bottleneck-полоски."
          : "Шкала — недели от старта планирования (понедельник). Даты полосок = заданные старты (без сдвига по ёмкости). ETA = конец bottleneck-полоски; параллельная работа может перегрузить команду."
      }${
        ui.showTeamLoad
          ? " Красная подсветка — загрузка команды по расписанию (как на Gantt) выше ёмкости в эту неделю."
          : ""
      }</p>
    </div>
  `;
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
];

function nextTeamColor(): string {
  const used = new Set(state.teams.map((t) => t.color));
  return (
    TEAM_COLORS.find((c) => !used.has(c)) ??
    TEAM_COLORS[state.teams.length % TEAM_COLORS.length]
  );
}

function settingsHtml(rollups: ItemSchedule[]): string {
  const r = state.sizeRanges;
  const active = state.items.filter((i) => i.status !== "done");
  const ends = rollups.map((s) => s.endWeek);
  const horizon = ends.length ? Math.max(...ends) + 1 : 0;

  const rows = TSHIRT_SIZES.map(
    (sz) => `
    <div class="size-range-row">
      <div class="size-range-label"><span class="size-badge size-badge-lg">${sz}</span></div>
      <label class="size-range-field">
        <span class="meta">от, нед.</span>
        <input
          type="number"
          id="set_${sz}_min"
          class="set-range"
          data-size="${sz}"
          data-bound="min"
          min="1"
          step="1"
          value="${r[sz].min}"
        />
      </label>
      <label class="size-range-field">
        <span class="meta">до, нед.</span>
        <input
          type="number"
          id="set_${sz}_max"
          class="set-range"
          data-size="${sz}"
          data-bound="max"
          min="1"
          step="1"
          value="${r[sz].max}"
        />
      </label>
      <div class="size-range-plan">
        <span class="meta">для плана</span>
        <strong class="mono" data-plan="${sz}">${sizePlanWeeks(sz, r)} нед.</strong>
      </div>
    </div>
  `
  ).join("");

  return `
    <div class="callout">
      Диапазоны майок — <strong>сколько недель</strong> заложено в оценке проекта (S / M / L). Для плана берётся середина диапазона.
      Изменения сразу перестраивают ETA и Gantt.
    </div>
    <div class="panel panel-sticky-host">
      <div class="panel-sticky">
        <div class="panel-header">
          <h2>Майки (S / M / L)</h2>
          <button type="button" class="btn" id="resetSizeRanges">Сбросить по умолчанию</button>
        </div>
      </div>
      <div class="size-ranges-grid">${rows}</div>
      <div class="settings-preview" id="settingsSchedPreview">
        <div><span class="meta">Сейчас в плане</span></div>
        <div class="settings-preview-row">
          <span>Горизонт портфеля</span>
          <strong class="mono" id="settingsHorizon">${horizon} нед.</strong>
        </div>
        <div class="settings-preview-row">
          <span>Активных инициатив</span>
          <strong class="mono">${active.length}</strong>
        </div>
        <div class="settings-preview-row">
          <span>Шкала майок</span>
          <strong id="settingsRangesSummary">${sizeRangesSummary(r)}</strong>
        </div>
      </div>
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
      ?.replaceChildren(document.createTextNode(`${sizePlanWeeks(sz, r)} нед.`));
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

function capacityHtml(): string {
  const rows = state.teams
    .map(
      (t) => `
      <div class="capacity-row" data-team-row="${t.id}">
        <span class="team-dot" style="background:${t.color}"></span>
        <input
          class="team-name-input"
          type="text"
          data-team-name="${t.id}"
          value="${escapeAttr(t.name)}"
          aria-label="Название команды"
        />
        <label class="team-capacity-field">
          <span class="meta">Ёмкость, чел·нед/нед</span>
          <div class="team-capacity-slider">
            <input type="range" min="1" max="8" step="0.5" value="${t.capacityPw}" data-cap="${t.id}" />
            <span class="mono capacity-label" data-cap-label="${t.id}">${t.capacityPw}</span>
          </div>
        </label>
        <button
          type="button"
          class="btn btn-ghost team-delete-btn"
          data-team-delete="${t.id}"
          title="Удалить команду"
          ${state.teams.length <= 1 ? "disabled" : ""}
        >Удалить</button>
      </div>
    `
    )
    .join("");

  return `
    <div class="callout">
      <strong>Ёмкость</strong> — сколько человеко-недель команда может отдать за календарную неделю.
      Оценки инициатив задаются майками (недели — в <a href="#" data-tab-jump="settings">Настройках</a>).
    </div>
    <div class="panel panel-sticky-host">
      <div class="panel-sticky">
        <div class="panel-header">
          <h2>Команды</h2>
        </div>
      </div>
      <div id="teamsManageList">
        ${rows || `<div class="empty">Нет команд — добавьте первую ниже</div>`}
      </div>
      <div class="team-add-bar" id="teamAddBar">
        <span class="team-dot" id="newTeamDot" style="background:${nextTeamColor()}"></span>
        <input id="newTeamName" type="text" placeholder="Название новой команды" />
        <button class="btn btn-primary" id="saveNewTeam">+ Команда</button>
        <button class="btn" id="cancelNewTeam">Отмена</button>
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
      type: "product",
      backlog: "Product backlog",
      assignments: [
        {
          teamId: state.teams[0]?.id ?? "",
          size: "M",
          workStartDate: state.startDate,
        },
      ],
      status: "idea",
      owner: "",
      businessValue: 5,
      timeCriticality: 5,
      riskReduction: 5,
      jobSize: 5,
      notes: "",
      manualRank: nextPriority(state.items),
    } satisfies WorkItem);

  const score = wsjf(draft);
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
    : `<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>`;

  const teamRows = state.teams
    .map((t) => {
      const on = selected.has(t.id);
      const sz = sizeMap.get(t.id) ?? "M";
      const start = startMap.get(t.id) ?? state.startDate;
      return `
        <div class="team-assign-row">
          <label class="team-assign-check">
            <input type="checkbox" class="f_team_check" data-team="${t.id}" ${on ? "checked" : ""} />
            <span class="team-dot" style="background:${t.color}"></span>
            <span class="team-assign-name">${escapeHtml(t.name)}</span>
          </label>
          <label class="team-assign-field">
            <span class="meta">Майка</span>
            <select class="f_team_size" data-team="${t.id}" ${on ? "" : "disabled"}>${sizeSelectOptions(sz)}</select>
          </label>
          <label class="team-assign-field">
            <span class="meta">Старт работы</span>
            <input type="date" class="f_team_start" data-team="${t.id}" value="${start}" ${on ? "" : "disabled"} />
          </label>
        </div>
      `;
    })
    .join("");

  return `
    <div class="modal-backdrop" id="modal">
      <div class="modal modal-wide">
        <div class="modal-head">
          <h3>${item ? "Карточка инициативы" : "Новая инициатива"}</h3>
          <div class="modal-head-actions">
            <button class="btn" id="closeModal2">Отмена</button>
            <button class="btn btn-ghost" id="closeModal">Закрыть</button>
            <button class="btn btn-primary" id="saveItem">Сохранить</button>
          </div>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>Название</label>
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
              <label>Исходный бэклог</label>
              <input id="f_backlog" value="${escapeAttr(draft.backlog)}" />
            </div>
            <div class="field">
              <label>Статус</label>
              <select id="f_status">
                ${(["idea", "ready", "in_progress", "blocked", "done"] as ItemStatus[])
                  .map(
                    (s) =>
                      `<option value="${s}" ${draft.status === s ? "selected" : ""}>${statusLabel(s)}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="field">
              <label>Владелец</label>
              <input id="f_owner" value="${escapeAttr(draft.owner)}" />
            </div>
          </div>
          <div class="field">
            <label>Команды: майка и дата старта (отдельно по каждой)</label>
            <div class="team-assign-list" id="teamAssignList">${teamRows}</div>
            <div class="meta" style="margin-top:6px">${sizeRangesSummary(szRanges())}. Итого ~<strong class="mono" id="liveTotalEst">${totalEstimateWeeks(draft, szRanges())}</strong> чел·нед. Старт — не раньше указанной даты; если очередь занята, сдвинется позже.</div>
          </div>
          <div class="callout" style="margin:0" id="liveEtaBox">
            <strong>Пересчёт ETA</strong> (с учётом очереди и стартов)
            <div id="liveEta" style="margin-top:8px;font-size:13px;color:var(--ink)">${previewHtml}</div>
          </div>
          <div class="score-grid">
            <div class="score-box"><div class="k">Business Value</div><div class="v"><input id="f_bv" type="number" min="1" max="10" value="${draft.businessValue}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Time Criticality</div><div class="v"><input id="f_tc" type="number" min="1" max="10" value="${draft.timeCriticality}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Risk / Opportunity</div><div class="v"><input id="f_rr" type="number" min="1" max="10" value="${draft.riskReduction}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
            <div class="score-box"><div class="k">Job Size</div><div class="v"><input id="f_js" type="number" min="1" max="10" value="${draft.jobSize}" style="width:64px;text-align:center;border:none;background:transparent;font:inherit;font-weight:700" /></div></div>
          </div>
          <div class="callout" style="margin:0">WSJF = (BV + TC + RR) / Job Size → <strong class="mono" id="liveWsjf">${score}</strong></div>
          <div class="grid-2">
            <div class="field">
              <label>Приоритет (уникальный, 1 = выше)</label>
              <input id="f_rank" type="number" min="1" step="1" value="${draft.manualRank ?? nextPriority(state.items)}" />
              <div class="meta" style="margin-top:6px">При занятом номере очередь пересоберётся после подтверждения рядом с полем.</div>
            </div>
            <div class="field">
              <label>Заметки</label>
              <textarea id="f_notes">${escapeHtml(draft.notes ?? "")}</textarea>
            </div>
          </div>
        </div>
        ${item ? `<div class="modal-foot">
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
  const estimatePw = sizePlanWeeks(a.size, szRanges());
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

  const modeNote = ui.autoCapacitySchedule
    ? `ETA с учётом очереди = <span class="eta-final mono">${formatDate(preview.endDate)}</span>`
    : `ETA по заданным стартам = <span class="eta-final mono">${formatDate(preview.endDate)}</span>`;

  return (
    lines +
    `<div class="eta-final-line">${modeNote}</div>` +
    `<div class="meta">ETA только от ваших стартов/оценок (без чужого бэклога) = <strong class="mono">${formatDate(planOnlyMax)}</strong> — меняется сразу при смене даты</div>`
  );
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replaceAll("'", "&#39;");
}

function closeAppPop() {
  document
    .querySelectorAll(".prio-input.prio-ask, #f_rank.prio-ask")
    .forEach((el) => {
      el.classList.remove("prio-ask");
    });
  document.querySelectorAll(".confirm-ask").forEach((el) => {
    el.classList.remove("confirm-ask");
  });
  document.querySelector("#appConfirmPop")?.remove();
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
      : `<p class="meta">Нет детализации инициатив за эту неделю.</p>`;

  return `
    <div class="overload-pop-head">
      <span class="team-dot" style="background:${team.color}"></span>
      <strong>${escapeHtml(team.name)}</strong>
    </div>
    <div class="meta">${overloadWeekLabel(week)}</div>
    <div class="overload-load mono">Загрузка <strong>${used.toFixed(1)}</strong> / ${cap} чел·нед</div>
    <p class="overload-why">По расписанию (те же интервалы, что полоски Gantt) спрос команды на этой неделе превышает ёмкость (${cap} чел·нед/нед).</p>
    <div class="overload-contrib-label meta">Вклад инициатив</div>
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
  if (!ui.showTeamLoad) return;

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

function bindOverloadExplain() {
  if (!ui.showTeamLoad) return;

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

function confirmPopHtml(textHtml: string): string {
  return `
    <div class="prio-confirm-text">${textHtml}</div>
    <div class="prio-confirm-actions">
      <button type="button" class="btn" data-confirm-no>Нет</button>
      <button type="button" class="btn btn-primary" data-confirm-yes>Да</button>
    </div>
  `;
}

function askAppConfirm(
  anchor: HTMLElement,
  textHtml: string,
  onYes: () => void,
  onNo: () => void = () => undefined,
  opts?: { anchorClass?: string; wide?: boolean }
) {
  closeAppPop();
  anchor.classList.add(opts?.anchorClass ?? "confirm-ask");

  const pop = document.createElement("div");
  pop.id = "appConfirmPop";
  pop.className = `prio-confirm prio-confirm-float${opts?.wide ? " prio-confirm-wide" : ""}`;
  pop.setAttribute("data-stop-edit", "");
  pop.innerHTML = confirmPopHtml(textHtml);
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

  const onScroll = () => place();
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);

  const cleanup = () => {
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onScroll);
    document.removeEventListener("mousedown", onDoc, true);
  };

  const finishNo = () => {
    cleanup();
    closeAppPop();
    onNo();
  };
  const finishYes = () => {
    cleanup();
    closeAppPop();
    onYes();
  };

  const onDoc = (e: MouseEvent) => {
    const t = e.target as Node;
    if (pop.contains(t) || anchor.contains(t)) return;
    finishNo();
  };
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
  state.teams = state.teams.filter((t) => t.id !== teamId);
  state.items = state.items
    .map((item) => ({
      ...item,
      assignments: item.assignments.filter((a) => a.teamId !== teamId),
    }))
    .filter((item) => item.assignments.length > 0);
  if (ui.teamFilter === teamId) ui.teamFilter = "all";
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
  const cap = `${team.capacityPw} чел·нед/нед`;
  const text =
    n > 0
      ? `Удалить «<strong>${escapeHtml(team.name)}</strong>» (${cap}/нед)?<br/>Снимется с <span class="accent">${n}</span> инициатив. Карточки без команд тоже удалятся.`
      : `Удалить «<strong>${escapeHtml(team.name)}</strong>» (${cap}/нед)?`;
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
  if (ui.sortKey !== "priority") return;
  const body = document.querySelector("#portfolioBody");
  if (!body) return;

  let dragId: string | null = null;
  let activePointer: number | null = null;

  const clearMarks = () => {
    body
      .querySelectorAll(".is-dragging, .drag-over")
      .forEach((el) => el.classList.remove("is-dragging", "drag-over"));
  };

  const applyReorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const ids = Array.from(
      body.querySelectorAll<HTMLTableRowElement>("tr[data-row-id]")
    ).map((r) => r.dataset.rowId!);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, fromId);

    const orderForRanks =
      ui.sortDir === "asc" ? next : [...next].reverse();
    state.items = reorderVisiblePriority(state.items, orderForRanks, szRanges());
    ui.sortKey = "priority";
    persist();
  };

  body.querySelectorAll<HTMLElement>("[data-drag-handle]").forEach((handle) => {
    const row = handle.closest<HTMLTableRowElement>("tr[data-row-id]");
    if (!row) return;

    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
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
      if (toId) applyReorder(fromId, toId);
    };

    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
  });
}

function render() {
  closePrioPop();
  closeResetPop();
  closeColPickerOutside();
  closeOverloadPop();
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
          <h1>VI Planer</h1>
        </div>
        <div class="top-actions">
          <span class="sync-badge" id="syncStatus" data-status="${getSyncStatus()}">${syncStatusLabel(getSyncStatus())}</span>
          <button class="btn" id="exportPdfBtn">Экспорт PDF</button>
          <button class="btn" id="exportBtn">Экспорт JSON</button>
          <button class="btn" id="importBtn">Импорт JSON</button>
          <button class="btn" id="resetBtn">Сбросить демо</button>
        </div>
        <p class="subtitle">
          Единый портфель проектов и продуктов: сквозной WSJF, несколько команд на инициативу
          со своими оценками и ETA, bottleneck-срок готовности.
        </p>
      </div>
      <div id="pdfCapture">
      <div class="print-only print-doc-header" id="pdfDocHeader">
        <h1>VI Planer — ${TAB_LABELS[ui.tab]}</h1>
        <p>Старт портфеля: ${state.startDate} · Экспорт: ${new Date().toLocaleString("ru-RU")}</p>
      </div>
      ${metricsHtml(rollups, slices)}
      <div class="tabs no-print">
        <button class="tab ${ui.tab === "portfolio" ? "active" : ""}" data-tab="portfolio">Портфель</button>
        <button class="tab ${ui.tab === "teams" ? "active" : ""}" data-tab="teams">Очереди команд</button>
        <button class="tab ${ui.tab === "queuesTest" ? "active" : ""}" data-tab="queuesTest">Очереди (тест)</button>
        <button class="tab ${ui.tab === "timeline" ? "active" : ""}" data-tab="timeline">Сроки / Gantt</button>
        <button class="tab ${ui.tab === "capacity" ? "active" : ""}" data-tab="capacity">Команды</button>
        <button class="tab tab-settings ${ui.tab === "settings" ? "active" : ""}" data-tab="settings">Настройки</button>
      </div>
      <div class="tab-print-root" id="tabPrintRoot">
      ${
        ui.tab === "portfolio"
          ? portfolioHtml(rollups, slices)
          : ui.tab === "teams"
            ? teamsHtml(slices, load, overflowByTeam)
            : ui.tab === "queuesTest"
              ? queuesTestHtml(slices, load, overflowByTeam)
              : ui.tab === "timeline"
                ? timelineHtml(rollups, slices, load, overflowByTeam)
                : ui.tab === "settings"
                  ? settingsHtml(rollups)
                  : capacityHtml()
      }
      </div>
      </div>
    </div>
    <div class="page-foot no-print">
      <button type="button" class="req-dl-btn" id="downloadReqsBtn" title="Скачать требования">Требования (BR / UC / FR / NFR)</button>
    </div>
    ${ui.creating || editing ? editorHtml(editing) : ""}
    <input type="file" id="fileInput" accept="application/json,.json" hidden />
  `;

  bind();
}

function readAssignments(): TeamAssignment[] {
  const checks = Array.from(
    document.querySelectorAll<HTMLInputElement>(".f_team_check")
  );
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
    assignments.push({ teamId, size, workStartDate });
  }
  return assignments;
}

function refreshLiveEta() {
  const liveEst = document.querySelector("#liveTotalEst");
  const liveEta = document.querySelector("#liveEta");
  const assignments = readAssignments();
  if (liveEst) {
    liveEst.textContent = String(
      assignments.reduce((s, a) => s + sizePlanWeeks(a.size, szRanges()), 0) || 0
    );
  }
  if (!liveEta) return;
  if (!assignments.length) {
    liveEta.innerHTML =
      '<div class="meta">Отметьте команду, чтобы увидеть расчёт ETA</div>';
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
      backlog: "Backlog",
      assignments,
      status: "ready",
      owner: "—",
      businessValue: 5,
      timeCriticality: 5,
      riskReduction: 5,
      jobSize: 5,
      manualRank: null,
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
    status:
      (document.querySelector<HTMLSelectElement>("#f_status")
        ?.value as ItemStatus) || base.status,
    businessValue: Number(
      document.querySelector<HTMLInputElement>("#f_bv")?.value
    ) || base.businessValue,
    timeCriticality: Number(
      document.querySelector<HTMLInputElement>("#f_tc")?.value
    ) || base.timeCriticality,
    riskReduction: Number(
      document.querySelector<HTMLInputElement>("#f_rr")?.value
    ) || base.riskReduction,
    jobSize: Number(
      document.querySelector<HTMLInputElement>("#f_js")?.value
    ) || base.jobSize,
    manualRank: (() => {
      const raw = document.querySelector<HTMLInputElement>("#f_rank")?.value;
      const n = Math.round(Number(raw));
      return Number.isFinite(n) && n >= 1 ? n : (base.manualRank ?? nextPriority(state.items));
    })(),
  };
  const preview = previewScheduleFor(draft);
  if (!preview) {
    liveEta.innerHTML = '<div class="meta">Нет расчёта</div>';
    return;
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
  return {
    title: val("f_title").trim() || "Без названия",
    type: val("f_type") as ItemType,
    backlog: val("f_backlog").trim() || "Backlog",
    assignments,
    status: val("f_status") as ItemStatus,
    owner: val("f_owner").trim() || "—",
    businessValue: clamp(num("f_bv", 5), 1, 10),
    timeCriticality: clamp(num("f_tc", 5), 1, 10),
    riskReduction: clamp(num("f_rr", 5), 1, 10),
    jobSize: clamp(num("f_js", 5), 1, 10),
    notes: val("f_notes").trim(),
    manualRank: priority,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function persist() {
  saveState(state);
  render();
}

function bind() {
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      ui.tab = btn.dataset.tab as Tab;
      render();
    });
  });

  document.querySelectorAll<HTMLInputElement>(".set-range").forEach((input) => {
    input.addEventListener("input", () => applySizeRangesFromInputs());
  });
  document.querySelector("#resetSizeRanges")?.addEventListener("click", () => {
    state.sizeRanges = normalizeSizeRanges(undefined);
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
    .querySelector<HTMLInputElement>("#showTeamLoad")
    ?.addEventListener("change", (e) => {
      ui.showTeamLoad = (e.target as HTMLInputElement).checked;
      saveShowTeamLoad(ui.showTeamLoad);
      render();
    });

  document
    .querySelector<HTMLInputElement>("#autoCapacitySchedule")
    ?.addEventListener("change", (e) => {
      ui.autoCapacitySchedule = (e.target as HTMLInputElement).checked;
      saveAutoCapacitySchedule(ui.autoCapacitySchedule);
      render();
    });

  bindOverloadExplain();

  document.querySelector("#addItem")?.addEventListener("click", () => {
    ui.creating = true;
    ui.editingId = null;
    render();
  });

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

  document.querySelectorAll<HTMLTableRowElement>("[data-edit]").forEach((row) => {
    row.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      if (
        t.closest(
          "[data-stop-edit], .prio-input, .prio-edit, #appConfirmPop, .drag-handle"
        )
      )
        return;
      ui.editingId = row.dataset.edit ?? null;
      ui.creating = false;
      render();
    });
  });

  bindPortfolioDrag();

  document.querySelectorAll<HTMLInputElement>(".prio-input").forEach((input) => {
    const itemId = input.dataset.prioId!;
    const revert = () => {
      const item = state.items.find((i) => i.id === itemId);
      input.value = String(item?.manualRank ?? 1);
    };
    const commit = () => {
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

      askPrioConfirm(
        input,
        text,
        () => {
          state.items = moveItemToPriority(state.items, itemId, priority, szRanges());
          persist();
        },
        revert
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
        closePrioPop();
        revert();
        input.blur();
      }
    });
    input.addEventListener("change", commit);
  });

  document.querySelectorAll<HTMLTableCellElement>("[data-sort]").forEach((th) => {
    th.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("[data-col-resize]")) return;
      e.stopPropagation();
      const key = th.dataset.sort as SortKey | undefined;
      if (key === "wsjf" || key === "estimate" || key === "eta" || key === "priority")
        toggleSort(key);
    });
  });

  bindPortfolioColResize();
  bindPortfolioTableScroll();
  bindStickyTabsOffset();

  const close = () => {
    ui.creating = false;
    ui.editingId = null;
    render();
  };
  document.querySelector("#closeModal")?.addEventListener("click", close);
  document.querySelector("#closeModal2")?.addEventListener("click", close);
  document.querySelector("#modal")?.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).id === "modal") close();
  });

  document.querySelectorAll<HTMLInputElement>(".f_team_check").forEach((check) => {
    check.addEventListener("change", () => {
      const teamId = check.dataset.team!;
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
      ui.creating = false;
      ui.editingId = null;
      persist();
    };

    const applyEdit = () => {
      if (!ui.editingId) return;
      const idx = state.items.findIndex((i) => i.id === ui.editingId);
      if (idx < 0) return;
      const prev = state.items[idx];
      if (priority !== prev.manualRank) {
        state.items[idx] = { ...prev, ...data, manualRank: prev.manualRank };
        state.items = moveItemToPriority(state.items, ui.editingId, priority, szRanges());
      } else {
        state.items[idx] = { ...prev, ...data };
      }
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
    state.items = state.items.filter((i) => i.id !== ui.editingId);
    ui.editingId = null;
    persist();
  });

  ["f_bv", "f_tc", "f_rr", "f_js"].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener("input", () => {
      const live = document.querySelector("#liveWsjf");
      if (!live) return;
      const draft = readForm();
      if (!draft) return;
      live.textContent = String(wsjf({ ...draft, id: "x", manualRank: null }));
    });
  });

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
      team.name = name;
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

  document.querySelectorAll<HTMLInputElement>("[data-cap]").forEach((input) => {
    input.addEventListener("input", () => {
      const id = input.dataset.cap!;
      const team = state.teams.find((t) => t.id === id);
      if (!team) return;
      team.capacityPw = Number(input.value);
      saveState(state);
      const label = document.querySelector(`[data-cap-label="${id}"]`);
      if (label) label.textContent = String(team.capacityPw);
    });
    input.addEventListener("change", () => render());
  });

  document.querySelectorAll<HTMLButtonElement>("[data-tab-jump]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      ui.tab = btn.dataset.tabJump as Tab;
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-team-delete]").forEach(
    (btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.teamDelete!;
        confirmDeleteTeam(id, btn);
      });
    }
  );

  const createTeam = () => {
    const nameInput = document.querySelector<HTMLInputElement>("#newTeamName");
    const name = nameInput?.value.trim() || "";
    if (!name) {
      nameInput?.focus();
      return;
    }
    state.teams.push({
      id: uid("team"),
      name,
      capacityPw: 3,
      color: nextTeamColor(),
    });
    if (nameInput) nameInput.value = "";
    persist();
  };

  document.querySelector("#cancelNewTeam")?.addEventListener("click", () => {
    const nameInput = document.querySelector<HTMLInputElement>("#newTeamName");
    if (nameInput) nameInput.value = "";
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

  document.querySelector("#exportPdfBtn")?.addEventListener("click", () => {
    void exportCurrentTabPdf();
  });

  document.querySelector("#downloadReqsBtn")?.addEventListener("click", () => {
    void downloadRequirementsDoc();
  });

  document.querySelector("#exportBtn")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vi-planer-${state.startDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector("#importBtn")?.addEventListener("click", () => {
    document.querySelector<HTMLInputElement>("#fileInput")?.click();
  });

  document
    .querySelector<HTMLInputElement>("#fileInput")
    ?.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const normalized = normalizeState(JSON.parse(text));
        if (!normalized) {
          alert("Неверный формат файла");
          return;
        }
        state = normalized;
        persist();
      } catch {
        alert("Не удалось прочитать JSON");
      }
    });

  document.querySelector("#resetBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    askResetConfirm(e.currentTarget as HTMLElement);
  });
}

function closeResetPop() {
  document.querySelector("#resetPop")?.remove();
  document.querySelector("#resetBtn")?.classList.remove("reset-ask");
}

function askResetConfirm(anchor: HTMLElement) {
  closeResetPop();
  closePrioPop();
  anchor.classList.add("reset-ask");

  const pop = document.createElement("div");
  pop.id = "resetPop";
  pop.className = "reset-confirm";
  pop.innerHTML = `
    <div class="reset-confirm-text">Сбросить к демо?<br>Текущие данные пропадут.</div>
    <div class="reset-confirm-actions">
      <button type="button" class="btn" id="resetCancelBtn">Нет</button>
      <button type="button" class="btn btn-danger" id="resetConfirmBtn">Да</button>
    </div>
  `;
  document.body.appendChild(pop);

  const place = () => {
    const r = anchor.getBoundingClientRect();
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    let left = r.right - pw;
    let top = r.bottom + 6;
    if (left < 8) left = 8;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    if (top + ph > window.innerHeight - 8) top = r.top - ph - 6;
    pop.style.left = `${Math.max(8, left)}px`;
    pop.style.top = `${Math.max(8, top)}px`;
  };
  place();

  const onScroll = () => place();
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onScroll);

  const cleanup = () => {
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onScroll);
    window.removeEventListener("keydown", onKey);
    document.removeEventListener("mousedown", onDoc);
  };

  const onKey = (ev: KeyboardEvent) => {
    if (ev.key !== "Escape") return;
    cleanup();
    closeResetPop();
  };

  const onDoc = (ev: MouseEvent) => {
    const t = ev.target as Node;
    if (pop.contains(t) || anchor.contains(t)) return;
    cleanup();
    closeResetPop();
  };

  pop.querySelector("#resetCancelBtn")?.addEventListener("click", () => {
    cleanup();
    closeResetPop();
  });

  pop.querySelector("#resetConfirmBtn")?.addEventListener("click", () => {
    cleanup();
    closeResetPop();
    state = structuredClone(SEED);
    persist();
  });

  window.addEventListener("keydown", onKey);
  window.setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
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

function bindPortfolioTableScroll() {
  const panel = document.querySelector<HTMLElement>(".portfolio-panel");
  const wrap = document.querySelector<HTMLElement>(".table-scroll-wrap");
  if (!panel || !wrap) return;

  const top = panel.querySelector<HTMLElement>(".table-scroll-top");
  const main = wrap.querySelector<HTMLElement>(".table-scroll");
  const inner = panel.querySelector<HTMLElement>(".table-scroll-top-inner");
  const table = wrap.querySelector<HTMLTableElement>(".portfolio-table");
  if (!top || !main || !inner || !table) return;

  let syncing = false;

  const update = () => {
    inner.style.width = `${table.offsetWidth}px`;
    const needsScroll = table.offsetWidth > main.clientWidth + 1;
    top.style.display = needsScroll ? "" : "none";
    if (needsScroll && !syncing) {
      syncing = true;
      top.scrollLeft = main.scrollLeft;
      syncing = false;
    }
  };

  const syncFromMain = () => {
    if (syncing) return;
    syncing = true;
    top.scrollLeft = main.scrollLeft;
    syncing = false;
  };

  const syncFromTop = () => {
    if (syncing) return;
    syncing = true;
    main.scrollLeft = top.scrollLeft;
    syncing = false;
  };

  update();
  main.addEventListener("scroll", syncFromMain);
  top.addEventListener("scroll", syncFromTop);

  const ro = new ResizeObserver(update);
  ro.observe(table);
  ro.observe(main);
  window.addEventListener("resize", update);
}

function bindPortfolioColResize() {
  const table = document.querySelector<HTMLTableElement>(".portfolio-table");
  if (!table) return;

  table.querySelectorAll<HTMLElement>("[data-col-resize]").forEach((handle) => {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const col = handle.dataset.colResize as PortfolioCol | undefined;
      if (!col) return;
      const th = handle.closest<HTMLTableCellElement>("th");
      if (!th) return;

      const min = measureColMinWidth(PORTFOLIO_COL_LABELS[col], col);
      const startX = e.clientX;
      const startW = th.getBoundingClientRect().width;
      const pointerId = e.pointerId;
      handle.setPointerCapture(pointerId);
      document.body.classList.add("col-resizing");

      const onMove = (ev: PointerEvent) => {
        const next = Math.max(min, Math.round(startW + (ev.clientX - startX)));
        th.style.width = `${next}px`;
        th.style.minWidth = `${min}px`;
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
        th.style.width = `${finalW}px`;
        void ev;
      };

      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
      handle.addEventListener("pointercancel", onUp);
    });
  });
}

async function downloadRequirementsDoc() {
  const base = import.meta.env.BASE_URL || "./";
  const url = new URL(
    "VI-Planer-requirements.md",
    new URL(base, window.location.href),
  ).href;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const text = await res.text();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = "VI-Planer-requirements.md";
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error(err);
    alert("Не удалось скачать файл требований");
  }
}

async function exportCurrentTabPdf() {
  const btn = document.querySelector<HTMLButtonElement>("#exportPdfBtn");
  const capture = document.querySelector<HTMLElement>("#pdfCapture");
  if (!capture) {
    alert("Не удалось найти содержимое для экспорта");
    return;
  }

  const prevLabel = btn?.textContent ?? "Экспорт PDF";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "PDF…";
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const title = `VI Planer — ${TAB_LABELS[ui.tab]} · ${stamp}`;
  const filename = `VI-Planer-${TAB_LABELS[ui.tab]}-${stamp}.pdf`.replaceAll(
    " ",
    "_",
  );

  document.body.classList.add("pdf-capturing");

  try {
    await downloadElementPdf(capture, filename, title);
  } catch (err) {
    console.error(err);
    alert("Не удалось создать PDF. Проверьте интернет (нужны библиотеки с CDN).");
  } finally {
    document.body.classList.remove("pdf-capturing");
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevLabel;
    }
  }
}

async function bootstrap() {
  state = await loadState();
  ui.hiddenCols = loadHiddenCols();
  ui.showTeamLoad = loadShowTeamLoad();
  ui.autoCapacitySchedule = loadAutoCapacitySchedule();
  const before = state.items.map((i) => i.manualRank).join(",");
  state = { ...state, items: ensureUniquePriorities(state.items, szRanges()) };
  const after = state.items.map((i) => i.manualRank).join(",");
  if (before !== after) saveState(state);
  onSyncStatusChange((status) => {
    const el = document.querySelector<HTMLElement>("#syncStatus");
    if (!el) return;
    el.dataset.status = status;
    el.textContent = syncStatusLabel(status);
  });
  render();
}

bootstrap();
