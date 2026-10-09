import type { AppState, AssignmentDemandStatus } from "../src/model.ts";
import {
  V2_CLOUD_ROW_ID,
  V2_LOCAL_STATE_KEY,
  V2_API_STATE_PATH,
} from "../src/v2Store.ts";

const store = new Map<string, string>();
(globalThis as { localStorage?: Storage }).localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
} as Storage;

const {
  normalizeState,
  applyClearedDemandTeams,
  applySeededTeamRoster,
  mergeMissingSeedItems,
  v2StateFootprint,
  rememberDeletedIds,
} = await import("../src/model.ts");
const { SEED } = await import("../src/seed.ts");
const { applyCurrentPortfolioPack, hydrateV2State, saveState, loadState } =
  await import("../src/storage.ts");

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) fail(message);
}

assert(V2_LOCAL_STATE_KEY === "vi-planer-v2", "v2 local key drifted");
assert(V2_CLOUD_ROW_ID === "v2", "v2 cloud id drifted");
assert(V2_API_STATE_PATH === "/api/state/v2", "v2 API path drifted");

function userState(): AppState {
  const state = normalizeState({
    version: 3,
    startDate: "2026-10-01",
    savedAt: "2026-10-03T01:00:00.000Z",
    portfolioPack: "xlsx-prio-2026-10-v4",
    teams: [
      {
        id: "crm",
        name: "CRM",
        color: "#d60000",
        members: [
          { id: "p1", name: "Иванов Иван", role: "аналитик" },
          { id: "p2", name: "Петров Пётр", role: "разработчик" },
        ],
      },
    ],
    items: [
      {
        id: "x001",
        title: "Кастомная фича",
        type: "project",
        backlog: "CRM",
        status: "staffing",
        owner: "A",
        assignee: "",
        reach: 100,
        impact: 1,
        confidence: 0.8,
        manualRank: 42,
        cashFlow12m: null,
        roi12m: null,
        assignments: [
          {
            teamId: "crm",
            size: "M",
            workStartDate: "2026-10-05",
            days: 10,
            demandStatus: "pending" as AssignmentDemandStatus,
            roles: [
              {
                id: "r1",
                name: "аналитик",
                days: 4,
                demandStatus: "pending" as AssignmentDemandStatus,
              },
              {
                id: "r2",
                name: "разработчик",
                days: 6,
                demandStatus: "draft" as AssignmentDemandStatus,
              },
            ],
          },
        ],
      },
    ],
    sizeRanges: SEED.sizeRanges,
    customers: [],
    executors: [],
    projects: ["CRM"],
    products: [],
    portfolioNotes: "",
    changeLog: [],
  });
  if (!state) fail("user fixture failed to normalize");
  return state;
}

function expectUserData(state: AppState, label: string) {
  const item = state.items.find((row) => row.id === "x001");
  assert(item, `${label}: x001 missing`);
  assert(item.manualRank === 42, `${label}: rank wiped (${item.manualRank})`);
  assert(item.assignments.length === 1, `${label}: assignments wiped`);
  assert(item.assignments[0].teamId === "crm", `${label}: team assignment lost`);
  const roles = item.assignments[0].roles ?? [];
  assert(
    roles.some((r) => r.name === "аналитик"),
    `${label}: role аналитик lost`
  );
  assert(
    roles.some((r) => r.name === "разработчик"),
    `${label}: role разработчик lost`
  );
  const team = state.teams.find((t) => t.id === "crm");
  assert(team, `${label}: CRM team missing`);
  assert((team.members?.length ?? 0) === 2, `${label}: FIO roster wiped`);
  assert(
    team.members?.some((m) => m.name === "Иванов Иван" && m.role === "аналитик"),
    `${label}: FIO/role pair lost`
  );
}

const local = userState();
expectUserData(local, "fixture");

const persisted = normalizeState(JSON.parse(JSON.stringify(local)));
assert(persisted, "persist snapshot failed to normalize");
expectUserData(persisted, "persist→normalize");

store.set(V2_LOCAL_STATE_KEY, JSON.stringify(persisted));
saveState({
  ...persisted,
  items: persisted.items.map((item) => ({
    ...item,
    assignments: item.assignments.map((a) => ({
      ...a,
      roles: (a.roles ?? []).map((r) =>
        r.id === "r1" ? { ...r, demandStatus: "approved" as const } : r
      ),
    })),
  })),
});
assert(store.has(V2_LOCAL_STATE_KEY), "saveState must write local key");
const afterSave = JSON.parse(store.get(V2_LOCAL_STATE_KEY)!);
const approvedRole = afterSave.items[0].assignments[0].roles.find(
  (r: { id: string }) => r.id === "r1"
);
assert(approvedRole?.demandStatus === "approved", "approved status not saved");

const staleRemote = structuredClone(SEED);
staleRemote.savedAt = "2026-09-01T00:00:00.000Z";
staleRemote.items = staleRemote.items.map((item) => ({
  ...item,
  assignments: [],
}));
staleRemote.clearedDemandTeams = undefined;
staleRemote.teamRosterSeeded = undefined;
staleRemote.portfolioPack = "xlsx-prio-2026-10-v3";

const loaded = hydrateV2State(persisted, staleRemote);
expectUserData(loaded, "hydrate vs stale seed");
assert(
  v2StateFootprint(loaded).assignments >= 1,
  "hydrate dropped assignment footprint"
);

const noFlag = { ...persisted, clearedDemandTeams: undefined };
expectUserData(applyClearedDemandTeams(noFlag).state, "clearedDemandTeams stamp");

const oldPack = { ...persisted, portfolioPack: "xlsx-prio-2026-10-v3" };
expectUserData(
  applyCurrentPortfolioPack(oldPack).state,
  "pack apply auto-load"
);

const roster = applySeededTeamRoster({
  ...persisted,
  teamRosterSeeded: undefined,
});
expectUserData(roster.state, "team roster re-seed");

const merged = mergeMissingSeedItems(persisted, SEED.items);
expectUserData(merged.state, "mergeMissingSeedItems");
assert(merged.state.items.length === 1, "mergeMissingSeedItems added seed rows");

const withTombstone = {
  ...persisted,
  deletedItemIds: rememberDeletedIds(persisted.deletedItemIds, ["x002"]),
  items: persisted.items,
};
const resurrect = mergeMissingSeedItems(withTombstone, SEED.items);
assert(
  !resurrect.state.items.some((i) => i.id === "x002"),
  "tombstone x002 must not resurrect from seed"
);

store.clear();
store.set(V2_LOCAL_STATE_KEY, JSON.stringify(persisted));
const booted = await loadState();
expectUserData(booted, "loadState from local");

console.log("ok: persist keeps assignments, ranks, teams, roles");
