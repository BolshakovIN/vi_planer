#!/usr/bin/env node
/**
 * Regenerates docs/COMMITS.md from git history.
 * Safe to run after `rm -rf docs` in Pages deploy — call it after copying dist.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outPath = join(root, "docs", "COMMITS.md");

function sh(cmd) {
  return execSync(cmd, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trimEnd();
}

function table(logCmd) {
  const body = sh(logCmd);
  return body ? `${body}\n` : "";
}

const generatedAt = new Date().toLocaleString("ru-RU", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

const masterTable = table(
  "git log master --date=short --pretty=format:'| `%h` | %ad | %an | %s |'"
);
const allTable = table(
  "git log --all --date=short --pretty=format:'| `%h` | %ad | %an | %D | %s |'"
);

const md = `# История коммитов VI Planer

Сгенерировано: ${generatedAt}

Обновляется скриптом \`npm run docs:commits\` (также в конце \`deploy:pages\` / \`deploy:pages:shared\`).

## master (текущая линия)

| Hash | Дата | Автор | Сообщение |
|------|------|-------|-----------|
${masterTable}
## Все коммиты (все ветки, уникальные, новые сверху)

| Hash | Дата | Автор | Ветки/теги | Сообщение |
|------|------|-------|------------|-----------|
${allTable}`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, md, "utf8");
console.log(`Wrote ${outPath}`);
