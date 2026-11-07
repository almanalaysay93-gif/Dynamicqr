import QRCode from 'qrcode';
import { CenterLogoConfig } from './qrLogic';

export interface QrRenderOptions {
  width?: number;
  margin?: number;
  fgColor?: string;
  bgColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  centerLogo?: CenterLogoConfig;
}

const PRESET_SVGS: Record<string, string> = {
  google: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>`,
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>`,
  whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366">
    <path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.95 11.95 0 0 0 5.85 1.51h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-.1.25-6.42-3.48-8.43zM12.06 21.92h-.01a9.92 9.92 0 0 1-5.06-1.39l-.36-.22-3.76.99 1-3.66-.24-.38a9.92 9.92 0 0 1-1.52-5.29c0-5.48 4.46-9.94 9.95-9.94a9.88 9.88 0 0 1 7.03 2.92 9.88 9.88 0 0 1 2.91 7.02c0 5.49-4.46 9.95-9.95 9.95zm5.45-7.46c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
  </svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`,
  restaurant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/>
    <path d="M15 11v11"/>
    <path d="M6 2v20"/>
    <path d="M9 2c0 2.76-1.34 5-3 5s-3-2.24-3-5"/>
  </svg>`,
  shop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
    <path d="M3 6h18"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>`,
};

/**
 * Loads an image from a URL or SVG string
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Draws rounded rectangle on 2D canvas context
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Generates high-res DataURL for <img> tags with optional center logo
 */
export async function generateQrDataUrl(
  text: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const {
    width = 320,
    margin = 2,
    fgColor = '#0F172A',
    bgColor = '#FFFFFF',
    errorCorrectionLevel = 'H',
    centerLogo,
  } = options;

  const hasLogo = centerLogo && centerLogo.type !== 'none';
  // Force High error correction when embedding a logo so QR remains 100% scan-reliable
  const effectiveEcc = hasLogo ? 'H' : errorCorrectionLevel;

  // In browser environments with canvas support
  if (typeof document !== 'undefined' && document.createElement) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = width;

      await QRCode.toCanvas(canvas, text, {
        width,
        margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: effectiveEcc,
      });

      if (hasLogo) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Center badge sizing: 22% of total QR width
          const badgeSize = Math.floor(width * 0.22);
          const bx = (width - badgeSize) / 2;
          const by = (width - badgeSize) / 2;
          const radius = Math.floor(badgeSize * 0.24);

          // Draw white quiet container badge
          ctx.save();
          roundRect(ctx, bx, by, badgeSize, badgeSize, radius);
          ctx.fillStyle = centerLogo.bgColor || '#FFFFFF';
          ctx.fill();

          // Subtle clean border
          ctx.lineWidth = Math.max(1.5, Math.floor(width * 0.005));
          ctx.strokeStyle = '#E2E8F0';
          ctx.stroke();

          // Draw logo icon or custom image
          let imageSource = '';
          if (centerLogo.type === 'custom' && centerLogo.customUrl) {
            imageSource = centerLogo.customUrl;
          } else if (PRESET_SVGS[centerLogo.type]) {
            imageSource = `data:image/svg+xml;utf8,${encodeURIComponent(PRESET_SVGS[centerLogo.type])}`;
          }

          if (imageSource) {
            try {
              const iconImg = await loadImage(imageSource);
              const iconPadding = Math.floor(badgeSize * 0.18);
              const iconSize = badgeSize - iconPadding * 2;
              ctx.drawImage(iconImg, bx + iconPadding, by + iconPadding, iconSize, iconSize);
            } catch {
              // If custom image failed to load, draw a crisp blue circle indicator
              ctx.fillStyle = '#2563EB';
              ctx.beginPath();
              ctx.arc(width / 2, width / 2, badgeSize * 0.25, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          ctx.restore();
        }
      }

      return canvas.toDataURL('image/png');
    } catch (err) {
      console.warn('Canvas QR render failed, falling back to standard toDataURL', err);
    }
  }

  // Fallback
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: effectiveEcc,
    });
  } catch (err) {
    console.error('Failed to generate QR data URL', err);
    return '';
  }
}

/**
 * Generates raw SVG string for crisp vector printing and SVG download
 */
export async function generateQrSvgString(
  text: string,
  options: QrRenderOptions = {}
): Promise<string> {
  const {
    width = 400,
    margin = 2,
    fgColor = '#0F172A',
    bgColor = '#FFFFFF',
    errorCorrectionLevel = 'H',
    centerLogo,
  } = options;

  const hasLogo = centerLogo && centerLogo.type !== 'none';
  const effectiveEcc = hasLogo ? 'H' : errorCorrectionLevel;

  try {
    let svg = await QRCode.toString(text, {
      type: 'svg',
      width,
      margin,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: effectiveEcc,
    });

    // If center logo requested, inject the centered logo overlay into SVG
    if (hasLogo && svg.includes('</svg>')) {
      const badgeSize = Math.floor(width * 0.22);
      const bx = (width - badgeSize) / 2;
      const by = (width - badgeSize) / 2;
      const radius = Math.floor(badgeSize * 0.24);

      let innerContent = '';
      if (centerLogo.type === 'custom' && centerLogo.customUrl) {
        innerContent = `<image href="${centerLogo.customUrl}" x="${bx + badgeSize * 0.18}" y="${by + badgeSize * 0.18}" width="${badgeSize * 0.64}" height="${badgeSize * 0.64}"/>`;
      } else if (PRESET_SVGS[centerLogo.type]) {
        // Embed the preset svg
        const presetRaw = PRESET_SVGS[centerLogo.type];
        const innerMatch = presetRaw.replace(/<\?xml.*?\?>/i, '').replace(/<svg[^>]*>|<\/svg>/gi, '');
        innerContent = `<g transform="translate(${bx + badgeSize * 0.18}, ${by + badgeSize * 0.18}) scale(${(badgeSize * 0.64) / 24})">${innerMatch}</g>`;
      }

      const overlay = `
        <rect x="${bx}" y="${by}" width="${badgeSize}" height="${badgeSize}" rx="${radius}" fill="${centerLogo.bgColor || '#FFFFFF'}" stroke="#E2E8F0" stroke-width="1.5" />
        ${innerContent}
      </svg>`;

      svg = svg.replace('</svg>', overlay);
    }

    return svg;
  } catch (err) {
    console.error('Failed to generate QR SVG', err);
    return '';
  }
}

/**
 * Triggers client-side download of PNG image at specified resolution
 */
export async function downloadQrPng(
  text: string,
  fileName: string,
  size = 1024,
  options: QrRenderOptions = {}
) {
  const dataUrl = await generateQrDataUrl(text, {
    ...options,
    width: size,
    margin: 2,
  });

  if (!dataUrl) return;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${fileName.replace(/[^a-z0-9_-]/gi, '_')}-qr-${size}px.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Triggers client-side download of SVG vector file
 */
export async function downloadQrSvg(
  text: string,
  fileName: string,
  options: QrRenderOptions = {}
) {
  const svgString = await generateQrSvgString(text, options);
  if (!svgString) return;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName.replace(/[^a-z0-9_-]/gi, '_')}-vector-qr.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a print-ready acrylic table stand / poster sheet in a printable window
 */
export async function printQrStandSheet(
  qrName: string,
  shortLink: string,
  destination: string,
  options: QrRenderOptions = {}
) {
  const dataUrl = await generateQrDataUrl(shortLink, {
    ...options,
    width: 600,
    margin: 1,
    errorCorrectionLevel: 'H',
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Dynamic QR - ${qrName}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 90vh;
      color: #0f172a;
      background: #f8fafc;
    }
    .card {
      border: 2px dashed #93c5fd;
      border-radius: 28px;
      padding: 48px;
      text-align: center;
      max-width: 440px;
      width: 100%;
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.1), 0 8px 10px -6px rgba(37, 99, 235, 0.05);
    }
    .badge {
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 4px 14px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 8px 0;
      line-height: 1.2;
      color: #0f172a;
    }
    .subtitle {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 28px;
    }
    .qr-frame {
      display: inline-block;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      margin-bottom: 24px;
    }
    .qr-frame img {
      width: 260px;
      height: 260px;
      display: block;
    }
    .scan-cue {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }
    .short-link {
      font-family: monospace;
      font-size: 14px;
      font-weight: 600;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      padding: 8px 16px;
      border-radius: 8px;
      display: inline-block;
      margin-bottom: 16px;
    }
    .footer-note {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 12px;
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }
    @media print {
      body { padding: 0; background: white; }
      .card { border: 1px solid #94a3b8; box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Scan with Camera</div>
    <h1>${qrName}</h1>
    <div class="subtitle">Point your mobile camera to open instantly</div>
    
    <div class="qr-frame">
      <img src="${dataUrl}" alt="${qrName}" />
    </div>

    <div class="scan-cue">Instant Dynamic Gateway</div>
    <div class="short-link">${shortLink}</div>
    
    <div class="footer-note">
      Powered by DynoQR Dynamic Redirects · Target: ${destination}
    </div>
  </div>

  <div class="no-print" style="margin-top: 24px;">
    <button onclick="window.print()" style="padding: 12px 24px; font-size: 14px; font-weight: 700; background: #2563eb; color: white; border: none; border-radius: 9999px; cursor: pointer; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
      Print Now / Save as PDF
    </button>
  </div>
</body>
</html>
  `);
  printWindow.document.close();
}
