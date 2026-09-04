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
