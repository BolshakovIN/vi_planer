export type PdfCaptureOptions = {
  orientation?: "portrait" | "landscape";
  backgroundColor?: string;
  /** Page margin from edges in mm (default 8). */
  marginMm?: number;
};

/** Expand scroll/sticky layout so html2canvas can paint full tab content. */
function prepareCaptureLayout(root: HTMLElement): () => void {
  const restores: Array<() => void> = [];

  const prevX = window.scrollX;
  const prevY = window.scrollY;
  window.scrollTo(0, 0);
  restores.push(() => window.scrollTo(prevX, prevY));

  const nodes = [
    root,
    ...Array.from(
      root.querySelectorAll<HTMLElement>(
        ".timeline, .table-scroll, .table-scroll-wrap, .table-scroll-top, .portfolio-thead-scroll, .panel, .gantt-layout, .gantt-rows",
      ),
    ),
  ];

  for (const el of nodes) {
    const prev = {
      overflow: el.style.overflow,
      overflowX: el.style.overflowX,
      overflowY: el.style.overflowY,
      width: el.style.width,
      height: el.style.height,
      maxHeight: el.style.maxHeight,
      position: el.style.position,
      top: el.style.top,
    };
    const sw = el.scrollWidth;
    const sh = el.scrollHeight;
    el.style.overflow = "visible";
    el.style.overflowX = "visible";
    el.style.overflowY = "visible";
    el.style.maxHeight = "none";
    if (sw > el.clientWidth + 1) el.style.width = `${sw}px`;
    if (sh > el.clientHeight + 1) el.style.height = `${sh}px`;
    restores.push(() => {
      el.style.overflow = prev.overflow;
      el.style.overflowX = prev.overflowX;
      el.style.overflowY = prev.overflowY;
      el.style.width = prev.width;
      el.style.height = prev.height;
      el.style.maxHeight = prev.maxHeight;
      el.style.position = prev.position;
      el.style.top = prev.top;
    });
  }

  root
    .querySelectorAll<HTMLElement>(".panel-sticky, .portfolio-sticky")
    .forEach((el) => {
      const prevPos = el.style.position;
      const prevTop = el.style.top;
      el.style.position = "static";
      el.style.top = "auto";
      restores.push(() => {
        el.style.position = prevPos;
        el.style.top = prevTop;
      });
    });

  return () => {
    for (let i = restores.length - 1; i >= 0; i--) restores[i]();
  };
}

function waitTwoFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Capture a DOM node as a colour PDF and trigger download. */
export async function downloadElementPdf(
  element: HTMLElement,
  filename: string,
  title: string,
  options: PdfCaptureOptions = {},
): Promise<void> {
  // Bundled deps — no CDN (works behind corporate proxy)
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const orientation = options.orientation ?? "landscape";
  const backgroundColor = options.backgroundColor ?? "#f4f4f4";

  const restore = prepareCaptureLayout(element);
  await waitTwoFrames();

  try {
    const canvas = await html2canvas(element, {
      scale: Math.min(2, window.devicePixelRatio || 2),
      useCORS: true,
      allowTaint: true,
      backgroundColor,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(element.scrollWidth, element.clientWidth),
      windowHeight: Math.max(element.scrollHeight, element.clientHeight),
      onclone: (_doc, cloned) => {
        cloned.style.overflow = "visible";
        cloned.style.opacity = "1";
        cloned.style.left = "0";
        cloned.style.top = "0";
        cloned.style.position = "static";
        cloned
          .querySelectorAll<HTMLElement>(
            ".timeline, .table-scroll, .table-scroll-wrap, .table-scroll-top, .portfolio-thead-scroll, .panel, .panel-sticky, .portfolio-sticky, .gantt-layout, .gantt-rows",
          )
          .forEach((el) => {
            el.style.overflow = "visible";
            el.style.overflowX = "visible";
            el.style.overflowY = "visible";
            el.style.maxHeight = "none";
            if (
              el.classList.contains("panel-sticky") ||
              el.classList.contains("portfolio-sticky")
            ) {
              el.style.position = "static";
              el.style.top = "auto";
            }
          });
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = options.marginMm ?? 8;
    const headerH = title ? 8 : 0;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2 - headerH;
    const imgWmm = usableW;
    const imgHmm = (canvas.height * imgWmm) / canvas.width;

    let heightLeft = imgHmm;
    let position = margin + headerH;
    let page = 0;

    while (heightLeft > 0) {
      if (page > 0) pdf.addPage();

      if (page === 0 && title) {
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(title, margin, margin + 4);
      }

      pdf.addImage(imgData, "PNG", margin, position, imgWmm, imgHmm);

      const pageUsable = page === 0 ? usableH : pageH - margin * 2;
      heightLeft -= pageUsable;
      position -= pageUsable;
      page += 1;
      if (page > 60) break;
    }

    pdf.save(filename);
  } finally {
    restore();
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function isTableSeparator(line: string): boolean {
  const t = line.trim();
  return t.includes("-") && /^[\s|:-]+$/.test(t);
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

/** Lightweight Markdown → HTML for the requirements doc (headings, lists, tables, bold). */
export function markdownToSimpleHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let inUl = false;
  let inOl = false;
  let inPara = false;

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  const closePara = () => {
    if (inPara) {
      out.push("</p>");
      inPara = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      closePara();
      closeLists();
      i += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      closePara();
      closeLists();
      out.push("<hr/>");
      i += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      closePara();
      closeLists();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (trimmed.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      closePara();
      closeLists();
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes("|")) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      out.push("<table><thead><tr>");
      for (const h of headers) out.push(`<th>${inlineMd(h)}</th>`);
      out.push("</tr></thead><tbody>");
      for (const row of rows) {
        out.push("<tr>");
        for (let c = 0; c < headers.length; c++) {
          out.push(`<td>${inlineMd(row[c] ?? "")}</td>`);
        }
        out.push("</tr>");
      }
      out.push("</tbody></table>");
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(trimmed);
    if (ul) {
      closePara();
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inlineMd(ul[1])}</li>`);
      i += 1;
      continue;
    }

    const ol = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ol) {
      closePara();
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inlineMd(ol[1])}</li>`);
      i += 1;
      continue;
    }

    closeLists();
    if (!inPara) {
      out.push("<p>");
      inPara = true;
      out.push(inlineMd(trimmed));
    } else {
      out.push(`<br/>${inlineMd(trimmed)}`);
    }
    i += 1;
  }

  closePara();
  closeLists();
  return out.join("\n");
}

/** Off-screen capture width (px). Scaled to A4 usable width (210mm − 2×20mm). */
const REQ_PDF_CAPTURE_WIDTH_PX = 900;

const REQ_PDF_STYLES = `
  .req-pdf-root {
    box-sizing: border-box;
    width: ${REQ_PDF_CAPTURE_WIDTH_PX}px;
    padding: 8px 0 16px;
    background: #ffffff;
    color: #0f172a;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 13.5px;
    line-height: 1.5;
  }
  .req-pdf-root * { box-sizing: border-box; }
  .req-pdf-root h1 {
    font-size: 22px;
    line-height: 1.25;
    margin: 0 0 12px;
    font-weight: 700;
  }
  .req-pdf-root h2 {
    font-size: 16px;
    margin: 22px 0 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid #cbd5e1;
    font-weight: 700;
  }
  .req-pdf-root h3 {
    font-size: 13.5px;
    margin: 16px 0 6px;
    font-weight: 700;
  }
  .req-pdf-root p { margin: 0 0 10px; }
  .req-pdf-root ul, .req-pdf-root ol { margin: 0 0 10px; padding-left: 1.35em; }
  .req-pdf-root li { margin: 0 0 4px; }
  .req-pdf-root hr {
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 18px 0;
  }
  .req-pdf-root strong { font-weight: 700; }
  .req-pdf-root code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.92em;
    background: #f1f5f9;
    padding: 0.1em 0.35em;
    border-radius: 3px;
  }
  .req-pdf-root table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 14px;
    font-size: 11.5px;
  }
  .req-pdf-root th, .req-pdf-root td {
    border: 1px solid #cbd5e1;
    padding: 5px 7px;
    text-align: left;
    vertical-align: top;
  }
  .req-pdf-root th { background: #f1f5f9; font-weight: 650; }
`;

/**
 * Render Markdown as an off-screen HTML document, capture with html2canvas,
 * and download a multi-page portrait A4 PDF (Cyrillic-safe via canvas).
 */
export async function downloadMarkdownAsPdf(
  markdown: string,
  filename: string,
): Promise<void> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${REQ_PDF_CAPTURE_WIDTH_PX}px`,
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  });
  host.innerHTML = `<style>${REQ_PDF_STYLES}</style><div class="req-pdf-root">${markdownToSimpleHtml(markdown)}</div>`;
  document.body.appendChild(host);

  try {
    await waitTwoFrames();
    const root = host.querySelector<HTMLElement>(".req-pdf-root");
    if (!root) throw new Error("Requirements PDF root missing");
    await downloadElementPdf(root, filename, "", {
      orientation: "portrait",
      backgroundColor: "#ffffff",
      marginMm: 20,
    });
  } finally {
    host.remove();
  }
}

/** Structured portfolio report (not a live-UI screenshot). */
export type PlanerReportMetric = {
  label: string;
  value: string;
  hint?: string;
};

export type PlanerReportRow = {
  priority: string;
  type: string;
  title: string;
  teams: string;
  status: string;
  cashFlow: string;
  roi: string;
  estimate: string;
  eta: string;
};

export type PlanerReportTeam = {
  name: string;
  roster: string;
};

export type PlanerReportData = {
  generatedAt: string;
  planStart: string;
  scheduleModeLabel: string;
  scheduleModeHint: string;
  metrics: PlanerReportMetric[];
  portfolioRows: PlanerReportRow[];
  teams: PlanerReportTeam[];
};

/** Capture width for landscape A4 report (readable table). */
const REPORT_PDF_CAPTURE_WIDTH_PX = 1280;

const REPORT_PDF_STYLES = `
  .report-pdf-root {
    box-sizing: border-box;
    width: ${REPORT_PDF_CAPTURE_WIDTH_PX}px;
    padding: 4px 0 20px;
    background: #ffffff;
    color: #1a1a1a;
    font-family: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 12.5px;
    line-height: 1.45;
  }
  .report-pdf-root * { box-sizing: border-box; }
  .report-pdf-brand {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 3px solid #d60000;
    margin-bottom: 14px;
  }
  .report-pdf-brand h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #1a1a1a;
  }
  .report-pdf-brand .meta {
    margin: 0;
    font-size: 12px;
    color: #737373;
    text-align: right;
  }
  .report-pdf-root h2 {
    margin: 18px 0 8px;
    font-size: 14px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .report-pdf-lead {
    margin: 0 0 12px;
    color: #737373;
    font-size: 12px;
  }
  .report-pdf-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin: 0 0 8px;
  }
  .report-pdf-metric {
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 8px 10px;
    background: #fafafa;
  }
  .report-pdf-metric .k {
    font-size: 10px;
    color: #737373;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .report-pdf-metric .v {
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .report-pdf-metric .h {
    margin-top: 2px;
    font-size: 10px;
    color: #737373;
  }
  .report-pdf-note {
    margin: 0 0 14px;
    padding: 8px 10px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    background: #fff;
    font-size: 11.5px;
    color: #37474f;
  }
  .report-pdf-note strong { color: #1a1a1a; }
  .report-pdf-root table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 14px;
    font-size: 10.5px;
  }
  .report-pdf-root th,
  .report-pdf-root td {
    border: 1px solid #e0e0e0;
    padding: 5px 6px;
    text-align: left;
    vertical-align: top;
  }
  .report-pdf-root th {
    background: #f5f5f5;
    font-weight: 650;
    font-size: 10px;
    white-space: nowrap;
  }
  .report-pdf-root td.num {
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }
  .report-pdf-root td.prio {
    text-align: center;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .report-pdf-empty {
    color: #737373;
    font-style: italic;
    margin: 0 0 12px;
  }
  .report-pdf-foot {
    margin-top: 8px;
    font-size: 10px;
    color: #737373;
  }
`;

function reportEscape(text: string): string {
  return escapeHtml(text);
}

function buildPlanerReportHtml(data: PlanerReportData): string {
  const metrics = data.metrics
    .map(
      (m) => `
      <div class="report-pdf-metric">
        <div class="k">${reportEscape(m.label)}</div>
        <div class="v">${reportEscape(m.value)}</div>
        ${m.hint ? `<div class="h">${reportEscape(m.hint)}</div>` : ""}
      </div>`,
    )
    .join("");

  const rows =
    data.portfolioRows.length === 0
      ? ""
      : data.portfolioRows
          .map(
            (r) => `
      <tr>
        <td class="prio">${reportEscape(r.priority)}</td>
        <td>${reportEscape(r.type)}</td>
        <td>${reportEscape(r.title)}</td>
        <td>${reportEscape(r.teams)}</td>
        <td>${reportEscape(r.status)}</td>
        <td class="num">${reportEscape(r.cashFlow)}</td>
        <td class="num">${reportEscape(r.roi)}</td>
        <td class="num">${reportEscape(r.estimate)}</td>
        <td class="num">${reportEscape(r.eta)}</td>
      </tr>`,
          )
          .join("");

  const teamRows =
    data.teams.length === 0
      ? `<p class="report-pdf-empty">Команды не заданы</p>`
      : `<table>
        <thead>
          <tr><th>Команда</th><th>Состав</th></tr>
        </thead>
        <tbody>
          ${data.teams
            .map(
              (t) =>
                `<tr><td>${reportEscape(t.name)}</td><td class="num">${reportEscape(t.roster)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>`;

  return `
    <div class="report-pdf-brand">
      <h1>VI Planer</h1>
      <p class="meta">Отчёт по портфелю<br/>${reportEscape(data.generatedAt)}</p>
    </div>
    <p class="report-pdf-lead">
      Сводка функциональностей, метрик и команд. Старт планирования: <strong>${reportEscape(data.planStart)}</strong>.
    </p>
    <h2>Сводка</h2>
    <div class="report-pdf-metrics">${metrics}</div>
    <div class="report-pdf-note">
      <strong>Режим планирования:</strong> ${reportEscape(data.scheduleModeLabel)}
      — ${reportEscape(data.scheduleModeHint)}
    </div>
    <h2>Портфель функциональностей</h2>
    ${
      data.portfolioRows.length === 0
        ? `<p class="report-pdf-empty">Нет элементов в портфеле</p>`
        : `<table>
        <thead>
          <tr>
            <th>Приоритет</th>
            <th>Тип</th>
            <th>Функциональность</th>
            <th>Команды</th>
            <th>Статус</th>
            <th>ЧП, млрд ₽</th>
            <th>ROI, %</th>
            <th>Маечная оценка</th>
            <th>Дата завершения</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
    }
    <h2>Команды</h2>
    ${teamRows}
    <p class="report-pdf-foot">VI Planer · документ сформирован автоматически · не скриншот интерфейса</p>
  `;
}

/**
 * Build a dedicated report HTML (off-screen), capture to multi-page landscape A4 PDF.
 * Cyrillic-safe via html2canvas (same approach as requirements PDF).
 */
export async function downloadPlanerReportPdf(
  data: PlanerReportData,
  filename: string,
): Promise<void> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${REPORT_PDF_CAPTURE_WIDTH_PX}px`,
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  });
  host.innerHTML = `<style>${REPORT_PDF_STYLES}</style><div class="report-pdf-root">${buildPlanerReportHtml(data)}</div>`;
  document.body.appendChild(host);

  try {
    await waitTwoFrames();
    const root = host.querySelector<HTMLElement>(".report-pdf-root");
    if (!root) throw new Error("Report PDF root missing");
    await downloadElementPdf(root, filename, "", {
      orientation: "landscape",
      backgroundColor: "#ffffff",
      marginMm: 12,
    });
  } finally {
    host.remove();
  }
}

/** Schematic Gantt PDF (project → functionality → bars), not a live-UI screenshot. */
export type GanttPdfTeamLegend = {
  name: string;
  color: string;
};

export type GanttPdfBar = {
  label: string;
  color: string;
  startWeek: number;
  endWeek: number;
};

export type GanttPdfFn = {
  title: string;
  bars: GanttPdfBar[];
};

export type GanttPdfProject = {
  title: string;
  priority: string;
  functions: GanttPdfFn[];
};

export type GanttPdfWeekTick = {
  index: number;
  weekLabel: string;
  dateLabel: string;
  showLabel: boolean;
};

export type GanttPdfMonthBand = {
  label: string;
  startWeek: number;
  weekCount: number;
};

export type GanttPdfData = {
  generatedAt: string;
  planStart: string;
  weeks: number;
  monthBands: GanttPdfMonthBand[];
  weekTicks: GanttPdfWeekTick[];
  teams: GanttPdfTeamLegend[];
  projects: GanttPdfProject[];
};

const GANTT_PDF_CAPTURE_WIDTH_PX = 1400;

const GANTT_PDF_STYLES = `
  .gantt-pdf-root {
    box-sizing: border-box;
    width: ${GANTT_PDF_CAPTURE_WIDTH_PX}px;
    padding: 4px 0 16px;
    background: #ffffff;
    color: #1c2126;
    font-family: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 12px;
    line-height: 1.4;
  }
  .gantt-pdf-root * { box-sizing: border-box; }
  .gantt-pdf-brand {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 3px solid #d60000;
    margin-bottom: 12px;
  }
  .gantt-pdf-brand h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .gantt-pdf-brand .meta {
    margin: 0;
    font-size: 12px;
    color: #737373;
    text-align: right;
  }
  .gantt-pdf-lead {
    margin: 0 0 10px;
    color: #737373;
    font-size: 12px;
  }
  .gantt-pdf-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
  }
  .gantt-pdf-legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #484f55;
  }
  .gantt-pdf-swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .gantt-pdf-chart {
    border: 1px solid #e5e7e8;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .gantt-pdf-row {
    display: grid;
    grid-template-columns: minmax(220px, 28%) 1fr;
    align-items: stretch;
    min-height: 28px;
    border-bottom: 1px solid #eef0f1;
  }
  .gantt-pdf-row:last-child { border-bottom: none; }
  .gantt-pdf-axis-row {
    min-height: 36px;
    background: #fafbfb;
    border-bottom: 1px solid #e5e7e8;
  }
  .gantt-pdf-months-row {
    min-height: 22px;
    background: #f5f6f7;
    border-bottom: 1px solid #e5e7e8;
  }
  .gantt-pdf-label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 4px 12px;
  }
  .gantt-pdf-head-label {
    font-size: 10px;
    font-weight: 600;
    color: #93999e;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .gantt-pdf-months,
  .gantt-pdf-weeks,
  .gantt-pdf-track {
    position: relative;
    min-width: 0;
    display: flex;
    align-items: stretch;
  }
  .gantt-pdf-months { align-items: center; }
  .gantt-pdf-month {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 10px;
    font-weight: 600;
    color: #737373;
    border-right: 1px solid #e5e7e8;
    text-transform: capitalize;
  }
  .gantt-pdf-month:last-child { border-right: none; }
  .gantt-pdf-week {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 1px;
    padding: 2px 0 2px 2px;
    font-variant-numeric: tabular-nums;
    border-right: 1px solid #eef0f1;
  }
  .gantt-pdf-week:last-child { border-right: none; }
  .gantt-pdf-week .w {
    font-size: 9px;
    font-weight: 650;
    color: #484f55;
    line-height: 1.1;
  }
  .gantt-pdf-week .d {
    font-size: 8px;
    color: #93999e;
    line-height: 1.1;
  }
  .gantt-pdf-week.is-quiet .w,
  .gantt-pdf-week.is-quiet .d { visibility: hidden; }
  .gantt-pdf-project {
    background: #f7f8f9;
    min-height: 30px;
  }
  .gantt-pdf-project .gantt-pdf-label {
    font-size: 13px;
    font-weight: 700;
    color: #1c2126;
  }
  .gantt-pdf-prio {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 4px;
    background: #fae0e0;
    color: #d60000;
    font-size: 10px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
  .gantt-pdf-fn {
    background: #fff;
    min-height: 26px;
  }
  .gantt-pdf-fn .gantt-pdf-label {
    padding-left: 22px;
    font-size: 12px;
    font-weight: 500;
    color: #37474f;
  }
  .gantt-pdf-bar-row .gantt-pdf-label {
    padding-left: 34px;
    font-size: 11px;
    color: #484f55;
  }
  .gantt-pdf-track {
    background-image: linear-gradient(
      90deg,
      transparent 0,
      transparent calc(var(--week-pct) - 1px),
      #eef0f1 calc(var(--week-pct) - 1px),
      #eef0f1 var(--week-pct)
    );
    background-size: var(--week-pct) 100%;
  }
  .gantt-pdf-bar {
    position: absolute;
    top: 6px;
    bottom: 6px;
    border-radius: 4px;
    color: #fff;
    font-size: 9px;
    font-weight: 600;
    line-height: 1.2;
    padding: 0 6px;
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  }
  .gantt-pdf-empty {
    margin: 0;
    padding: 28px 16px;
    text-align: center;
    color: #737373;
    font-style: italic;
  }
  .gantt-pdf-foot {
    margin-top: 12px;
    font-size: 10px;
    color: #737373;
  }
`;

function buildGanttSchematicHtml(data: GanttPdfData): string {
  const weekPct = `${100 / Math.max(1, data.weeks)}%`;
  const legend =
    data.teams.length === 0
      ? ""
      : `<ul class="gantt-pdf-legend">${data.teams
          .map(
            (t) =>
              `<li><span class="gantt-pdf-swatch" style="background:${escapeHtml(t.color)}"></span>${escapeHtml(t.name)}</li>`,
          )
          .join("")}</ul>`;

  const months = data.monthBands
    .map((m) => {
      const width = (m.weekCount / Math.max(1, data.weeks)) * 100;
      return `<div class="gantt-pdf-month" style="width:${width}%">${escapeHtml(m.label)}</div>`;
    })
    .join("");

  const weeks = data.weekTicks
    .map((t) => {
      const quiet = t.showLabel ? "" : " is-quiet";
      return `<div class="gantt-pdf-week${quiet}" style="width:${weekPct}">
        <span class="w">${escapeHtml(t.weekLabel)}</span>
        <span class="d">${escapeHtml(t.dateLabel)}</span>
      </div>`;
    })
    .join("");

  const body =
    data.projects.length === 0
      ? `<p class="gantt-pdf-empty">Нет назначений на шкале. Поставьте роли на таймлайн во вкладке «Планирование».</p>`
      : data.projects
          .map((project) => {
            const prio = project.priority
              ? `<span class="gantt-pdf-prio">${escapeHtml(project.priority)}</span>`
              : "";
            const projectRow = `<div class="gantt-pdf-row gantt-pdf-project">
              <div class="gantt-pdf-label">${prio}<span>${escapeHtml(project.title)}</span></div>
              <div class="gantt-pdf-track" style="--week-pct:${weekPct}"></div>
            </div>`;
            const fnBlocks = project.functions
              .map((fn) => {
                const fnRow = `<div class="gantt-pdf-row gantt-pdf-fn">
                  <div class="gantt-pdf-label">${escapeHtml(fn.title)}</div>
                  <div class="gantt-pdf-track" style="--week-pct:${weekPct}"></div>
                </div>`;
                const barRows = fn.bars
                  .map((bar) => {
                    const left =
                      (Math.max(0, bar.startWeek) / Math.max(1, data.weeks)) *
                      100;
                    const span = Math.max(1, bar.endWeek - bar.startWeek + 1);
                    const width = (span / Math.max(1, data.weeks)) * 100;
                    return `<div class="gantt-pdf-row gantt-pdf-bar-row">
                      <div class="gantt-pdf-label">${escapeHtml(bar.label)}</div>
                      <div class="gantt-pdf-track" style="--week-pct:${weekPct}">
                        <div class="gantt-pdf-bar" style="left:${left}%;width:${Math.max(width, 2.2)}%;background:${escapeHtml(bar.color)}" title="${escapeHtml(bar.label)}">${escapeHtml(bar.label)}</div>
                      </div>
                    </div>`;
                  })
                  .join("");
                return `${fnRow}${barRows}`;
              })
              .join("");
            return `${projectRow}${fnBlocks}`;
          })
          .join("");

  return `
    <div class="gantt-pdf-brand">
      <h1>VI Planer</h1>
      <p class="meta">Гант · ресурсный план<br/>${escapeHtml(data.generatedAt)}</p>
    </div>
    <p class="gantt-pdf-lead">
      Старт шкалы: <strong>${escapeHtml(data.planStart)}</strong>
      · горизонт <strong>${data.weeks} нед.</strong>
      · схема проект → функциональность → назначения
    </p>
    ${legend}
    <div class="gantt-pdf-chart">
      <div class="gantt-pdf-row gantt-pdf-months-row">
        <div class="gantt-pdf-label gantt-pdf-head-label">Месяц</div>
        <div class="gantt-pdf-months">${months}</div>
      </div>
      <div class="gantt-pdf-row gantt-pdf-axis-row">
        <div class="gantt-pdf-label gantt-pdf-head-label">Проект / функциональность</div>
        <div class="gantt-pdf-weeks">${weeks}</div>
      </div>
      ${body}
    </div>
    <p class="gantt-pdf-foot">VI Planer · схематичный экспорт Ганта · не скриншот интерфейса</p>
  `;
}

/**
 * Build a calm schematic Gantt HTML (off-screen) and download landscape A4 PDF.
 */
export async function downloadGanttSchematicPdf(
  data: GanttPdfData,
  filename: string,
): Promise<void> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${GANTT_PDF_CAPTURE_WIDTH_PX}px`,
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  });
  host.innerHTML = `<style>${GANTT_PDF_STYLES}</style><div class="gantt-pdf-root">${buildGanttSchematicHtml(data)}</div>`;
  document.body.appendChild(host);

  try {
    await waitTwoFrames();
    const root = host.querySelector<HTMLElement>(".gantt-pdf-root");
    if (!root) throw new Error("Gantt PDF root missing");
    await downloadElementPdf(root, filename, "", {
      orientation: "landscape",
      backgroundColor: "#ffffff",
      marginMm: 10,
    });
  } finally {
    host.remove();
  }
}
