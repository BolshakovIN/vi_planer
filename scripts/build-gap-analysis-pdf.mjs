#!/usr/bin/env node
/**
 * Renders content/gap-analysis/gap.html to A4 PDF via Chrome headless.
 * Usage: node scripts/build-gap-analysis-pdf.mjs
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = join(root, "content/gap-analysis/gap.html");
const mdSrc = join(root, "docs/VI-Planer-gap-analysis.md");
const outPublic = join(root, "public/VI-Planer-gap-analysis.pdf");
const outDocs = join(root, "docs/VI-Planer-gap-analysis.pdf");
const outPublicMd = join(root, "public/VI-Planer-gap-analysis.md");

const chromeCandidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "google-chrome",
  "chromium",
  "chromium-browser",
].filter(Boolean);

function findChrome() {
  for (const bin of chromeCandidates) {
    const probe = spawnSync(bin, ["--version"], { encoding: "utf8" });
    if (probe.status === 0) return bin;
  }
  return null;
}

if (!existsSync(htmlPath)) {
  console.error("Missing gap HTML:", htmlPath);
  process.exit(1);
}

const chrome = findChrome();
if (!chrome) {
  console.error("Chrome/Chromium not found. Set CHROME_PATH.");
  process.exit(1);
}

mkdirSync(dirname(outPublic), { recursive: true });

const fileUrl = pathToFileURL(htmlPath).href;
const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${outPublic}`,
  "--print-to-pdf-no-header",
  fileUrl,
];

console.log("Generating gap-analysis PDF with", chrome);
const result = spawnSync(chrome, args, { encoding: "utf8" });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "Chrome failed");
  process.exit(result.status ?? 1);
}

if (!existsSync(outPublic)) {
  console.error("PDF was not created:", outPublic);
  process.exit(1);
}

mkdirSync(dirname(outDocs), { recursive: true });
copyFileSync(outPublic, outDocs);

if (existsSync(mdSrc)) {
  writeFileSync(outPublicMd, readFileSync(mdSrc));
  console.log("Synced", outPublicMd);
}

console.log("Wrote", outPublic);
console.log("Copied", outDocs);
