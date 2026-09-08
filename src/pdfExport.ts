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
        ".timeline, .table-scroll, .table-scroll-wrap, .table-scroll-top, .panel, .gantt-layout, .gantt-rows",
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
            ".timeline, .table-scroll, .table-scroll-wrap, .table-scroll-top, .panel, .panel-sticky, .portfolio-sticky, .gantt-layout, .gantt-rows",
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
