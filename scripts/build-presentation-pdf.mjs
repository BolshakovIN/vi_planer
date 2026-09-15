#!/usr/bin/env node
/**
 * Renders content/presentation/slides.html to a landscape PDF via Chrome headless.
 * Usage: node scripts/build-presentation-pdf.mjs
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = join(root, "content/presentation/slides.html");
const outPublic = join(root, "public/VI-Planer-presentation.pdf");
const outDocs = join(root, "docs/VI-Planer-presentation.pdf");

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
  console.error("Missing slides HTML:", htmlPath);
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

console.log("Generating PDF with", chrome);
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
console.log("Wrote", outPublic);
console.log("Copied", outDocs);
