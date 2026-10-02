#!/usr/bin/env node
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const worktree = join(root, ".worktrees", "v1");
const outDir = join(root, "dist-pages-v1");
const commit = "refs/heads/v1";
const base = "/vi_planer/v1/";

const EDITION_CSS = `
.edition-switch {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--line);
  border-radius: 999px;
  overflow: hidden;
  background: var(--surface-2);
  flex: 0 0 auto;
}
.edition-switch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--muted);
  text-decoration: none;
  background: transparent;
}
.edition-switch-btn:hover {
  color: var(--ink);
  background: var(--row-hover);
}
.edition-switch-btn.is-on {
  color: #fff;
  background: var(--accent);
}
.edition-switch-btn.is-on:hover {
  color: #fff;
  background: var(--accent-hover);
}
`;

const SWITCHER_HTML = `<div class="top-actions">
          <nav class="edition-switch no-print" aria-label="Версия интерфейса">
            <a class="edition-switch-btn is-on" href="./" data-edition="v1" onclick="try{localStorage.setItem('vi-planer-edition','v1')}catch(e){}">v1</a>
            <a class="edition-switch-btn" href="../" data-edition="v2" onclick="try{localStorage.setItem('vi-planer-edition','v2')}catch(e){}">v2</a>
          </nav>`;

function sh(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

function patchSwitcher() {
  const mainPath = join(worktree, "src/main.ts");
  let main = readFileSync(mainPath, "utf8");
  if (!main.includes("edition-switch")) {
    const marker = `<div class="top-actions">`;
    if (!main.includes(marker)) {
      throw new Error("v1 top-actions marker not found");
    }
    main = main.replace(marker, SWITCHER_HTML);
    writeFileSync(mainPath, main);
  }
  const cssPath = join(worktree, "src/styles.css");
  let css = readFileSync(cssPath, "utf8");
  if (!css.includes(".edition-switch {")) {
    writeFileSync(cssPath, `${css}\n${EDITION_CSS}\n`);
  }
}

/** Keep frozen v1 on `vi-planer-v3` / Supabase `main`. Do not read v2 keys. */
function patchStorageIsolation() {
  const storagePath = join(worktree, "src/storage.ts");
  let src = readFileSync(storagePath, "utf8");
  const from = `    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem("vi-planer-v2") ??
      localStorage.getItem("vi-planer-v1");`;
  const to = `    const raw = localStorage.getItem(STORAGE_KEY);`;
  if (src.includes(from)) {
    src = src.replace(from, to);
  } else if (!src.includes("const raw = localStorage.getItem(STORAGE_KEY);")) {
    throw new Error("v1 storage fallback block not found");
  }
  writeFileSync(storagePath, src);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(root, ".worktrees"), { recursive: true });

try {
  sh("git worktree remove --force .worktrees/v1");
} catch {
  rmSync(worktree, { recursive: true, force: true });
}

sh(`git worktree add --detach .worktrees/v1 ${commit}`);
patchSwitcher();
patchStorageIsolation();

for (const name of [".env.local", ".env"]) {
  const src = join(root, name);
  if (existsSync(src)) {
    cpSync(src, join(worktree, name), { force: true });
  }
}

const nm = join(worktree, "node_modules");
if (!existsSync(nm)) {
  symlinkSync(join(root, "node_modules"), nm);
}

mkdirSync(outDir, { recursive: true });
const env = {
  ...process.env,
  VITE_BASE_PATH: base,
};
execSync(`npx vite build --outDir "${outDir}" --emptyOutDir`, {
  cwd: worktree,
  stdio: "inherit",
  env,
});

try {
  sh("git worktree remove --force .worktrees/v1");
} catch {
  /* keep dist even if cleanup fails */
}

if (!existsSync(join(outDir, "index.html"))) {
  throw new Error("v1 Pages build did not produce index.html");
}

cpSync(join(root, "public/favicon.svg"), join(outDir, "favicon.svg"), {
  force: true,
});
