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
): Promise<void> {
  // Bundled deps — no CDN (works behind corporate proxy)
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const restore = prepareCaptureLayout(element);
  await waitTwoFrames();

  try {
    const canvas = await html2canvas(element, {
      scale: Math.min(2, window.devicePixelRatio || 2),
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#f4f4f4",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(element.scrollWidth, element.clientWidth),
      windowHeight: Math.max(element.scrollHeight, element.clientHeight),
      onclone: (_doc, cloned) => {
        cloned.style.overflow = "visible";
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
  } finally {
    restore();
  }
}
