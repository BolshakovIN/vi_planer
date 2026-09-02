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
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
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

app.get("/api/state", async (_req, res) => {
  try {
    const state = await getState();
    const updatedAt = await getUpdatedAt();
    res.json({ state, updatedAt });
  } catch (err) {
    console.error("GET /api/state failed:", err);
    res.status(500).json({ error: "Failed to load state" });
  }
});

app.put("/api/state", async (req, res) => {
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
});

app.use(express.static(distDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

await initDb();

app.listen(port, host, () => {
  console.log(`VI Planer listening on http://${host}:${port}`);
});
