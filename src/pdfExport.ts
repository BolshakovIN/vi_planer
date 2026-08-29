type Html2CanvasFn = (
  element: HTMLElement,
  options?: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

type JsPdfCtor = new (options?: Record<string, unknown>) => {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setFontSize: (n: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  text: (t: string, x: number, y: number) => void;
  addPage: () => void;
  addImage: (
    data: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  save: (filename: string) => void;
};

declare global {
  interface Window {
    html2canvas?: Html2CanvasFn;
    jspdf?: { jsPDF: JsPdfCtor };
  }
}

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[data-pdf-lib="${src}"]`,
  );
  if (existing) {
    return existing.dataset.loaded === "1"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () =>
            reject(new Error(`Failed to load ${src}`)),
          );
        });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.pdfLib = src;
    s.onload = () => {
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function ensurePdfLibs(): Promise<{
  html2canvas: Html2CanvasFn;
  jsPDF: JsPdfCtor;
}> {
  if (!window.html2canvas) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
    );
  }
  if (!window.jspdf?.jsPDF) {
    await loadScript(
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js",
    );
  }
  const html2canvas = window.html2canvas;
  const jsPDF = window.jspdf?.jsPDF;
  if (!html2canvas || !jsPDF) {
    throw new Error("PDF libraries failed to load");
  }
  return { html2canvas, jsPDF };
}

/** Capture a DOM node as a colour PDF and trigger download. */
export async function downloadElementPdf(
  element: HTMLElement,
  filename: string,
  title: string,
): Promise<void> {
  const { html2canvas, jsPDF } = await ensurePdfLibs();

  const canvas = await html2canvas(element, {
    scale: Math.min(2, window.devicePixelRatio || 2),
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#f4f4f4",
    logging: false,
    windowWidth: Math.max(element.scrollWidth, element.clientWidth),
    windowHeight: Math.max(element.scrollHeight, element.clientHeight),
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const headerH = 8;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2 - headerH;
  const imgWmm = usableW;
  const imgHmm = (canvas.height * imgWmm) / canvas.width;

  let heightLeft = imgHmm;
  let position = margin + headerH;
  let page = 0;

  while (heightLeft > 0) {
    if (page > 0) pdf.addPage();

    if (page === 0) {
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text(title, margin, margin + 4);
    }

    pdf.addImage(imgData, "PNG", margin, position, imgWmm, imgHmm);

    const pageUsable = page === 0 ? usableH : pageH - margin * 2;
    heightLeft -= pageUsable;
    position -= pageUsable;
    page += 1;
    if (page > 40) break;
  }

  pdf.save(filename);
}
