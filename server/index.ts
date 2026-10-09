import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getState,
  getStorageMode,
  getUpdatedAt,
  initDb,
  pingDb,
  setState,
} from "./db.ts";
import { getJiraStatus, getSyncPreviewStub } from "./jira.ts";
import { normalizeState } from "../src/model.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");
const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 8787);
const corsOrigin = process.env.CORS_ORIGIN;

const app = express();
app.use(express.json({ limit: "12mb" }));

if (corsOrigin) {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

app.get("/api/health", async (_req, res) => {
  const dbOk = await pingDb();
  res.status(dbOk ? 200 : 503).json({
    ok: dbOk,
    storage: getStorageMode(),
  });
});

async function readStateHandler(
  _req: express.Request,
  res: express.Response
) {
  try {
    const state = await getState();
    const updatedAt = await getUpdatedAt();
    res.json({ state, updatedAt });
  } catch (err) {
    console.error("GET /api/state failed:", err);
    res.status(500).json({ error: "Failed to load state" });
  }
}

async function writeStateHandler(
  req: express.Request,
  res: express.Response
) {
  const normalized = normalizeState(req.body);
  if (!normalized) {
    res.status(400).json({ error: "Invalid state payload" });
    return;
  }
  try {
    const updatedAt = await setState(normalized);
    res.json({ ok: true, updatedAt });
  } catch (err) {
    console.error("PUT /api/state failed:", err);
    res.status(500).json({ error: "Failed to save state" });
  }
}

app.get("/api/state", readStateHandler);
app.put("/api/state", writeStateHandler);
app.get("/api/state/v2", readStateHandler);
app.put("/api/state/v2", writeStateHandler);

/** Jira read-only integration (stubs until PAT session + REST are wired). */
app.get("/api/jira/status", (_req, res) => {
  res.json(getJiraStatus());
});

app.post("/api/jira/session", (req, res) => {
  const token = String(
    (req.body as { token?: unknown } | undefined)?.token ?? ""
  ).trim();
  if (!token) {
    res.status(400).json({ ok: false, error: "token required" });
    return;
  }
  if (!jiraConfiguredGate()) {
    res.status(503).json({
      ok: false,
      error: "Jira not configured (set JIRA_URL and JIRA_ENABLED=1)",
    });
    return;
  }
  // PAT must stay in-memory only — not persisted yet (session store TODO).
  res.status(501).json({
    ok: false,
    error: "Session store not implemented yet",
    hint: "Next: in-memory session keyed by cookie; never write PAT to disk/logs.",
  });
});

app.delete("/api/jira/session", (_req, res) => {
  res.json({ ok: true, cleared: false, hint: "No active session store yet" });
});

app.get("/api/jira/sync-preview", (_req, res) => {
  const preview = getSyncPreviewStub();
  res.status(preview.ok ? 200 : 503).json(preview);
});

function jiraConfiguredGate(): boolean {
  return getJiraStatus().enabled;
}

app.use(express.static(distDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

await initDb();

app.listen(port, host, () => {
  console.log(`VI Planer listening on http://${host}:${port}`);
});
