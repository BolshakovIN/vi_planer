/**
 * Jira read-only integration stubs.
 * Live REST calls are gated on JIRA_URL + session PAT (not yet wired).
 */

export type JiraStatusCode = "not_configured" | "disabled" | "ready";

export type JiraIntegrationStatus = {
  /** Machine-readable gate: not_configured until JIRA_URL (+ enabled flag). */
  status: JiraStatusCode;
  configured: boolean;
  enabled: boolean;
  mode: "read_only";
  jiraUrl: string | null;
  sessionAuth: "personal_pat";
  writeBack: false;
  message: string;
  endpoints: {
    status: string;
    session: string;
    syncPreview: string;
  };
};

export type JiraSyncPreviewItem = {
  jiraKey: string;
  summary: string;
  projectName: string;
  functionalityName: string | null;
  status: string | null;
  assignee: string | null;
  targetStart: string | null;
  targetEnd: string | null;
};

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export function jiraConfigured(): boolean {
  return Boolean(env("JIRA_URL"));
}

export function jiraEnabled(): boolean {
  const v = env("JIRA_ENABLED").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function getJiraStatus(): JiraIntegrationStatus {
  const url = env("JIRA_URL").replace(/\/$/, "") || null;
  const configured = Boolean(url);
  const enabled = configured && jiraEnabled();
  const status: JiraStatusCode = !configured
    ? "not_configured"
    : !enabled
      ? "disabled"
      : "ready";
  let message: string;
  if (status === "not_configured") {
    message =
      "Задайте JIRA_URL в .env (и JIRA_ENABLED=1). PAT не хранится на диске — только в сессии.";
  } else if (status === "disabled") {
    message =
      "JIRA_URL задан, но JIRA_ENABLED выключен. Включите флаг, чтобы открыть sync-preview.";
  } else {
    message =
      "Backend готов принимать PAT и проксировать read-only Jira REST. Live sync ещё не подключён.";
  }
  return {
    status,
    configured,
    enabled,
    mode: "read_only",
    jiraUrl: url,
    sessionAuth: "personal_pat",
    writeBack: false,
    message,
    endpoints: {
      status: "GET /api/jira/status",
      session: "POST /api/jira/session · DELETE /api/jira/session",
      syncPreview: "GET /api/jira/sync-preview",
    },
  };
}

/** Placeholder mapping contract — no live Jira call yet. */
export function getSyncPreviewStub(): {
  ok: false;
  reason: string;
  mapping: Record<string, string>;
  items: JiraSyncPreviewItem[];
} {
  return {
    ok: false,
    reason: jiraEnabled()
      ? "Live Jira REST ещё не подключён — сначала POST /api/jira/session с PAT."
      : "Интеграция выключена (нужны JIRA_URL и JIRA_ENABLED=1).",
    mapping: {
      project: "Issue type «Проект» / контейнер VI Planer project",
      functionality: "Issue type «Функциональность» → WorkItem",
      jiraKey: "issue.key → колонка Реестра",
      status: "status.name → ItemStatus (маппинг таблицей)",
      assignee: "assignee → роль/исполнитель (опционально)",
      targetStart: "customfield Target start → workStartDate",
      targetEnd: "customfield Target end → baseline/actual finish",
    },
    items: [],
  };
}
