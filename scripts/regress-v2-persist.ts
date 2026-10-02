import type { AppState } from "../src/model.ts";

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

const { normalizeState, applyClearedDemandTeams, applySeededTeamRoster, mergeMissingSeedItems, v2StateFootprint } =
  await import("../src/model.ts");
const { SEED } = await import("../src/seed.ts");
const { applyCurrentPortfolioPack, hydrateV2State } = await import("../src/storage.ts");

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) fail(message);
}

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
        status: "ready",
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
            roles: [
              { id: "r1", name: "аналитик", days: 4 },
              { id: "r2", name: "разработчик", days: 6 },
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
    demoVariantA: true,
    demoVariantB: false,
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

console.log("ok: v2 persist keeps assignments, ranks, teams, roles");
