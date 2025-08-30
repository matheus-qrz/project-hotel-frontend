"use client";

import QRCode from "qrcode";

// Tipos públicos do util
export interface QrItem {
  label: string; // ex.: "Mesa 1"
  url: string;   // URL final do QR
}

export interface BuildQrPdfOptions {
  restaurantName?: string;
  filename?: string;     // ex.: qrcodes-Restaurante.pdf
  cols?: number;         // colunas por página (A4)
  rows?: number;         // linhas por página (A4)
  marginMm?: number;     // margem
  gapMm?: number;        // espaço entre células
  showBaseUrl?: boolean; // exibir host sob o label
  baseUrl?: string;      // base forçada (senão deriva da url)
}

/**
 * Gera um PDF A4 em grade com os QRs (sem capturar DOM).
 * Leve e estável em mobile.
 */
export async function buildQrPdf(items: QrItem[], opts: BuildQrPdfOptions = {}) {
  const { jsPDF } = await import("jspdf");

  const restaurantName = opts.restaurantName ?? "Restaurante";
  const filename = opts.filename ?? `qrcodes-${restaurantName}.pdf`;
  const cols = opts.cols ?? 3;
  const rows = opts.rows ?? 4;
  const margin = opts.marginMm ?? 12;
  const gap = opts.gapMm ?? 4;
  const showBaseUrl = opts.showBaseUrl ?? true;

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const headerH = 10;

  const colW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const rowH = (pageH - margin * 2 - headerH - gap * (rows - 1)) / rows;
  const qrSide = Math.min(colW, rowH) - 12; // espaço p/ textos

  const drawHeader = () => {
    doc.setFontSize(14);
    doc.text(`${restaurantName} — QR Codes`, margin, margin + 6);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString(), pageW - margin, margin + 6, { align: "right" });
  };

  drawHeader();

  for (let i = 0; i < items.length; i++) {
    const idxInPage = i % (cols * rows);
    if (idxInPage === 0 && i > 0) {
      doc.addPage();
      drawHeader();
    }

    const c = idxInPage % cols;
    const r = Math.floor(idxInPage / cols);
    const x = margin + c * (colW + gap);
    const y = margin + headerH + r * (rowH + gap);

    // Gera imagem do QR direto (sem DOM)
    const dataUrl = await QRCode.toDataURL(items[i].url, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    // QR centralizado
    const imgX = x + (colW - qrSide) / 2;
    const imgY = y + 6;
    doc.addImage(dataUrl, "PNG", imgX, imgY, qrSide, qrSide);

    // Rótulos
    doc.setFontSize(12);
    doc.text(items[i].label, x + colW / 2, imgY + qrSide + 5, { align: "center" });

    if (showBaseUrl) {
      doc.setFontSize(8);
      const base = opts.baseUrl ?? safeBase(items[i].url);
      doc.text(base, x + colW / 2, imgY + qrSide + 10, {
        align: "center",
        maxWidth: colW,
      });
    }

    // cede respiro ao main thread (mobile)
    await delay(0);
  }

  doc.save(filename);
}

/**
 * Abre uma janela com grid simples para impressão dos QRs.
 * Não usa JSX/React; monta HTML string.
 */
export async function openPrintWindow(
  items: QrItem[],
  opts: { title?: string; qrSizePx?: number } = {},
) {
  const title = opts.title ?? "QR Codes";
  const qrSize = opts.qrSizePx ?? 200;

  const images: string[] = [];
  for (const it of items) {
    const d = await QRCode.toDataURL(it.url, {
      width: qrSize,
      margin: 1,
      errorCorrectionLevel: "M",
    });
    images.push(d);
    await delay(0);
  }

  const w = typeof window !== "undefined" ? window.open("", "_blank") : null;
  if (!w) return;

  w.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .qr-wrapper { border: 1px solid #eee; padding: 12px; text-align: center; border-radius: 8px; }
          .restaurant-name { font-weight: 600; margin-bottom: 4px; }
          .table-number { font-size: 14px; margin: 6px 0 10px; }
          @media print {
            .grid { grid-template-columns: repeat(3, 1fr); }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align:center; margin-bottom: 12px;">
          <h1 style="margin:0 0 8px;">${escapeHtml(title)}</h1>
          <button onclick="window.print()">Imprimir QR Codes</button>
        </div>
        <div class="grid">
          ${images
            .map(
              (src, i) => `
            <div class="qr-wrapper">
              <div class="restaurant-name">${escapeHtml(title)}</div>
              <div class="table-number">Mesa ${i + 1}</div>
              <img src="${src}" width="${qrSize}" height="${qrSize}" />
              <div style="font-size:12px; color:#555; margin-top:6px;">
                Escaneie para fazer seu pedido
              </div>
            </div>`,
            )
            .join("")}
        </div>
      </body>
    </html>
  `);

  w.document.close();
}

// ===== helpers locais (sem JSX) =====
function safeBase(url: string): string {
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return url;
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>\"']/g, (m) => {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#039;";
      default: return m;
    }
  });
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
