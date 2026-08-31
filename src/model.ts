export type ItemType = "project" | "product";
export type ItemStatus = "idea" | "ready" | "in_progress" | "blocked" | "done";
export type TShirtSize = "S" | "M" | "L";

export const DEFAULT_SIZE_RANGES: Record<TShirtSize, { min: number; max: number }> = {
  S: { min: 1, max: 2 },
  M: { min: 2, max: 4 },
  L: { min: 4, max: 8 },
};

/** @deprecated use DEFAULT_SIZE_RANGES */
export const SIZE_RANGES = DEFAULT_SIZE_RANGES;

export type SizeRanges = Record<TShirtSize, { min: number; max: number }>;

export function normalizeSizeRanges(raw: unknown): SizeRanges {
  const out: SizeRanges = {
    S: { ...DEFAULT_SIZE_RANGES.S },
    M: { ...DEFAULT_SIZE_RANGES.M },
    L: { ...DEFAULT_SIZE_RANGES.L },
  };
  if (!raw || typeof raw !== "object") return out;
  for (const sz of TSHIRT_SIZES) {
    const row = (raw as Record<string, unknown>)[sz];
    if (!row || typeof row !== "object") continue;
    const rec = row as { min?: unknown; max?: unknown };
    let min = Math.round(Number(rec.min));
    let max = Math.round(Number(rec.max));
    if (!Number.isFinite(min)) min = out[sz].min;
    if (!Number.isFinite(max)) max = out[sz].max;
    min = Math.max(1, min);
    max = Math.max(min, max);
    out[sz] = { min, max };
  }
  // Legacy: ranges stored as calendar days (max > 12) → convert to weeks
  if (out.S.max > 12 || out.M.max > 12 || out.L.max > 12) {
    for (const sz of TSHIRT_SIZES) {
      out[sz] = {
        min: Math.max(1, Math.round(out[sz].min / 7)),
        max: Math.max(1, Math.round(out[sz].max / 7)),
      };
      if (out[sz].max < out[sz].min) out[sz].max = out[sz].min;
    }
  }
  return out;
}

/** Planning effort — midpoint of the size range, in person-weeks */
export function sizePlanWeeks(
  size: TShirtSize,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  const r = ranges[size];
  return Math.round(((r.min + r.max) / 2) * 10) / 10;
}

/** @deprecated use sizePlanWeeks */
export function sizePlanDays(
  size: TShirtSize,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  return sizePlanWeeks(size, ranges) * 7;
}

export function sizeLabel(
  size: TShirtSize,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): string {
  const r = ranges[size];
  return `${size} (${r.min}–${r.max} нед.)`;
}

export function sizeRangesSummary(ranges: SizeRanges): string {
  return TSHIRT_SIZES.map((sz) => sizeLabel(sz, ranges)).join(", ");
}
export const TSHIRT_SIZES: TShirtSize[] = ["S", "M", "L"];

export function parseSize(raw: unknown): TShirtSize {
  const s = String(raw ?? "").toUpperCase();
  if (s === "S" || s === "M" || s === "L") return s;
  return "M";
}

/** Legacy person-week estimate → t-shirt size */
export function pwToSize(estimatePw: number, capacityPw = 3): TShirtSize {
  const weeks = estimatePw / Math.max(capacityPw, 0.5);
  if (weeks <= 2) return "S";
  if (weeks <= 4) return "M";
  return "L";
}

export interface Team {
  id: string;
  name: string;
  /** Person-weeks available per calendar week */
  capacityPw: number;
  color: string;
}

/** Work of one initiative for a specific team (own effort → own ETA) */
export interface TeamAssignment {
  teamId: string;
  /** T-shirt estimate → person-weeks via sizeRanges */
  size: TShirtSize;
  /** Planned earliest start for this team (ISO date, Monday) */
  workStartDate: string;
}

export interface WorkItem {
  id: string;
  title: string;
  type: ItemType;
  /** Original backlog / stream name */
  backlog: string;
  /** One or more teams; each has its own remaining effort */
  assignments: TeamAssignment[];
  status: ItemStatus;
  owner: string;
  /** Business Value 1–10 */
  businessValue: number;
  /** Time Criticality 1–10 */
  timeCriticality: number;
  /** Risk Reduction / Opportunity Enablement 1–10 */
  riskReduction: number;
  /** Job size 1–10 (higher = larger) */
  jobSize: number;
  notes?: string;
  /**
   * Explicit portfolio priority (1 = highest). Unique across items.
   * Drives queue order and Gantt dependencies. null only before ensureUniquePriorities.
   */
  manualRank: number | null;
}

export interface AppState {
  teams: Team[];
  items: WorkItem[];
  /** Planning start date ISO (Monday) */
  startDate: string;
  /** T-shirt size ranges in weeks (editable in Settings) */
  sizeRanges: SizeRanges;
  version: 3;
}

/** One team's slice of an initiative in that team's queue */
export interface ScheduledSlice {
  item: WorkItem;
  teamId: string;
  size: TShirtSize;
  /** Person-weeks of effort (from t-shirt size) */
  estimatePw: number;
  wsjf: number;
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
  wsjf: number;
  totalEstimateWeeks: number;
  startWeek: number;
  endWeek: number;
  startDate: string;
  endDate: string;
  waitWeeks: number;
  /** Team id of the slice that drives the overall ETA */
  bottleneckTeamId: string;
}

export interface TeamLoadWeek {
  week: number;
  weekStart: string;
  usedPw: number;
  capacityPw: number;
  items: string[];
}

/** Scheduled week load exceeds team capacity (should not happen after queue merge). */
export function isTeamWeekOverloaded(lw: TeamLoadWeek): boolean {
  return lw.usedPw > lw.capacityPw + 0.001;
}

export function utilizationPct(usedPw: number, capacityPw: number): number {
  if (capacityPw <= 0) return usedPw > 0 ? 100 : 0;
  return Math.round((usedPw / capacityPw) * 100);
}

/**
 * Weeks where parallel planned work (each assignment from its workStartDate)
 * would exceed team capacity before the queue merges slots.
 */
export function concurrentOverloadWeeks(
  state: AppState,
  maxWeeks = 52
): Record<string, Set<number>> {
  const ranges = state.sizeRanges ?? DEFAULT_SIZE_RANGES;
  const result: Record<string, Set<number>> = {};

  for (const team of state.teams) {
    const used = Array.from({ length: maxWeeks }, () => 0);
    for (const item of state.items) {
      if (item.status === "done") continue;
      for (const a of item.assignments) {
        if (a.teamId !== team.id) continue;
        const pw = sizePlanWeeks(a.size, ranges);
        let rem = pw;
        let w = weekIndex(state.startDate, a.workStartDate);
        while (rem > 0.001 && w < maxWeeks) {
          const take = Math.min(team.capacityPw, rem);
          used[w] += take;
          rem -= take;
          w += 1;
        }
      }
    }
    const overloaded = new Set<number>();
    used.forEach((pw, w) => {
      if (pw > team.capacityPw + 0.001) overloaded.add(w);
    });
    result[team.id] = overloaded;
  }
  return result;
}

export function wsjf(item: WorkItem): number {
  const costOfDelay =
    item.businessValue + item.timeCriticality + item.riskReduction;
  return Math.round((costOfDelay / Math.max(item.jobSize, 0.5)) * 100) / 100;
}

export function totalEstimateWeeks(
  item: WorkItem,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  return item.assignments.reduce(
    (sum, a) => sum + sizePlanWeeks(a.size, ranges),
    0
  );
}

/** @deprecated use totalEstimateWeeks */
export function totalEstimateDays(
  item: WorkItem,
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): number {
  return totalEstimateWeeks(item, ranges) * 7;
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

/** Sort by explicit priority (1 first); missing ranks fall back to WSJF */
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
    const dw = wsjf(b) - wsjf(a);
    if (dw !== 0) return dw;
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
 * Keeps valid unique ranks; fills gaps / fixes duplicates by WSJF order.
 */
export function ensureUniquePriorities(
  items: WorkItem[],
  ranges: SizeRanges = DEFAULT_SIZE_RANGES
): WorkItem[] {
  const byWsjf = [...items].sort((a, b) => {
    const dw = wsjf(b) - wsjf(a);
    if (dw !== 0) return dw;
    return totalEstimateWeeks(a, ranges) - totalEstimateWeeks(b, ranges);
  });

  const used = new Set<number>();
  const kept = new Map<string, number>();

  for (const item of byWsjf) {
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
 * Schedule each team's work independently by shared priority field.
 * T-shirt on assignment → person-weeks; team capacityPw = person-weeks per calendar week.
 */
export function schedulePortfolio(state: AppState): {
  slices: ScheduledSlice[];
  rollups: ItemSchedule[];
  load: Record<string, TeamLoadWeek[]>;
} {
  const ranges = state.sizeRanges ?? DEFAULT_SIZE_RANGES;
  const active = state.items.filter((i) => i.status !== "done");
  const ordered = sortByPriority(active, ranges);

  const byTeam = new Map<
    string,
    { item: WorkItem; size: TShirtSize; workStartDate: string }[]
  >();
  for (const team of state.teams) byTeam.set(team.id, []);
  for (const item of ordered) {
    for (const a of item.assignments) {
      const list = byTeam.get(a.teamId) ?? [];
      list.push({
        item,
        size: a.size,
        workStartDate: snapToMonday(a.workStartDate || state.startDate),
      });
      byTeam.set(a.teamId, list);
    }
  }

  const slices: ScheduledSlice[] = [];
  const load: Record<string, TeamLoadWeek[]> = {};
  const maxWeeks = 52;

  for (const team of state.teams) {
    const queue = byTeam.get(team.id) ?? [];
    const weeks: TeamLoadWeek[] = Array.from({ length: maxWeeks }, (_, w) => ({
      week: w,
      weekStart: addWeeks(state.startDate, w),
      usedPw: 0,
      capacityPw: team.capacityPw,
      items: [],
    }));

    let cursor = 0;
    queue.forEach((entry, idx) => {
      const estimatePw = sizePlanWeeks(entry.size, ranges);
      const plannedWeek = weekIndex(state.startDate, entry.workStartDate);
      let startWeek = Math.max(cursor, plannedWeek);

      while (
        startWeek < maxWeeks &&
        weeks[startWeek].usedPw >= team.capacityPw - 0.001
      ) {
        startWeek += 1;
      }

      let remaining = estimatePw;
      let endWeek = startWeek;
      let endDate = addWeeks(state.startDate, startWeek);
      const startDate = addWeeks(state.startDate, startWeek);

      while (remaining > 0.001 && endWeek < maxWeeks) {
        const slot = weeks[endWeek];
        const free = Math.max(0, team.capacityPw - slot.usedPw);
        if (free <= 0.001) {
          endWeek += 1;
          continue;
        }
        const take = Math.min(free, remaining);
        const weekStart = addWeeks(state.startDate, endWeek);
        const daysUsed = (take / team.capacityPw) * 7;
        const offsetInWeek = (slot.usedPw / team.capacityPw) * 7;
        endDate = addDays(weekStart, offsetInWeek + daysUsed);

        slot.usedPw += take;
        if (!slot.items.includes(entry.item.id)) {
          slot.items.push(entry.item.id);
        }
        remaining -= take;
        if (remaining > 0.001) endWeek += 1;
      }

      const durationWeeks =
        team.capacityPw > 0
          ? Math.round((estimatePw / team.capacityPw) * 100) / 100
          : estimatePw;

      slices.push({
        item: entry.item,
        teamId: team.id,
        size: entry.size,
        estimatePw,
        wsjf: wsjf(entry.item),
        effectiveRank: idx + 1,
        plannedStartDate: entry.workStartDate,
        startWeek,
        endWeek,
        startDate,
        endDate,
        waitWeeks: startWeek,
        delayedByQueue: startWeek > plannedWeek,
        durationWeeks,
      });

      cursor = endWeek;
      if (weeks[cursor] && weeks[cursor].usedPw >= team.capacityPw - 0.001) {
        cursor = endWeek + 1;
      } else {
        cursor = endWeek;
      }
    });

    load[team.id] = weeks;
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
      wsjf: wsjf(item),
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
    return b.wsjf - a.wsjf;
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
    const legacyCap = Number(t.capacityPw);
    const fromPw = Number.isFinite(legacyCap) && legacyCap > 0 ? legacyCap : null;
    const fromShirt =
      t.capacity != null
        ? ({ S: 2, M: 3.5, L: 5 } as Record<TShirtSize, number>)[
            parseSize(t.capacity)
          ]
        : null;
    return {
      id: String(t.id ?? uid("team")),
      name: String(t.name ?? "Команда"),
      color: String(t.color ?? "#737373"),
      capacityPw: fromPw ?? fromShirt ?? 3,
    };
  });
  const teamCap = new Map(teams.map((t) => [t.id, t.capacityPw]));

  const items: WorkItem[] = data.items.map((row) => {
    const r = row as Record<string, unknown>;
    let assignments: TeamAssignment[] = [];
    if (Array.isArray(r.assignments) && r.assignments.length) {
      assignments = (r.assignments as Record<string, unknown>[])
        .filter((a) => a && typeof a.teamId === "string")
        .map((a) => {
          const teamId = String(a.teamId);
          const cap = teamCap.get(teamId) ?? 3;
          const size =
            a.size != null
              ? parseSize(a.size)
              : pwToSize(Number(a.estimatePw) || 1, cap);
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
          };
        });
    } else if (typeof r.teamId === "string") {
      assignments = [
        {
          teamId: r.teamId,
          size: pwToSize(Number(r.estimatePw) || 1, teamCap.get(r.teamId) ?? 3),
          workStartDate: planStart,
        },
      ];
    }
    if (!assignments.length && teams[0]) {
      assignments = [
        { teamId: teams[0].id, size: "M", workStartDate: planStart },
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
      businessValue: Number(r.businessValue) || 5,
      timeCriticality: Number(r.timeCriticality) || 5,
      riskReduction: Number(r.riskReduction) || 5,
      jobSize: Number(r.jobSize) || 5,
      notes: r.notes != null ? String(r.notes) : undefined,
      manualRank:
        r.manualRank == null || r.manualRank === ""
          ? null
          : Number(r.manualRank),
    };
  });

  const parsedRanges = normalizeSizeRanges(data.sizeRanges);
  return {
    version: 3,
    startDate: planStart,
    teams,
    sizeRanges: parsedRanges,
    items: ensureUniquePriorities(items, parsedRanges),
  };
}
