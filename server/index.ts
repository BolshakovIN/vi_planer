import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getState, getUpdatedAt, setState } from "./db.ts";
import { normalizeState } from "../src/model.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 8787);

const app = express();
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/state", (_req, res) => {
  res.json({ state: getState(), updatedAt: getUpdatedAt() });
});

app.put("/api/state", (req, res) => {
  const normalized = normalizeState(req.body);
  if (!normalized) {
    res.status(400).json({ error: "Invalid state payload" });
    return;
  }
  const updatedAt = setState(normalized);
  res.json({ ok: true, updatedAt });
});

app.use(express.static(distDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, host, () => {
  console.log(`VI Planer listening on http://${host}:${port}`);
});
