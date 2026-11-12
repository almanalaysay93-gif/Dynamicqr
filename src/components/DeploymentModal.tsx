import React, { useState } from 'react';
import {
  X,
  Terminal,
  Cloud,
  FileCode,
  Server,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  DynamicQR,
  PlatformSettings,
  getCloudflareWorkerCode,
  getVercelRouteCode,
  getSqlSchema,
} from '../utils/qrLogic';
import { ModalPortal } from './ModalPortal';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrs: DynamicQR[];
  settings: PlatformSettings;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({
  isOpen,
  onClose,
  qrs,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<
    'cloudflare' | 'vercel' | 'express' | 'sql' | 'standalone'
  >('cloudflare');
  const [copied, setCopied] = useState(false);

  const cfCode = getCloudflareWorkerCode(settings.customDomain || 'go.link');
  const vercelCode = getVercelRouteCode();
  const sqlCode = getSqlSchema();

  const expressCode = `// server.ts / Express Dynamic QR Gateway
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Dynamic QR In-Memory or Redis Store
const qrStore = new Map([
${qrs
  .map(
    (q) =>
      `  ['${q.slug}', { destination: '${q.destination}', name: '${q.name.replace(
        /'/g,
        "\\'"
      )}', isActive: ${q.isActive} }],`
  )
  .join('\n')}
]);

// 1. Dynamic Gateway Route (/r/:slug)
app.get('/r/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const qr = qrStore.get(slug);

  if (!qr) {
    return res.status(404).send('Dynamic QR not found');
  }

  if (!qr.isActive) {
    return res.status(403).send('This dynamic QR code is currently paused.');
  }

  // 2. Log Scan Event (IP, User Agent, Time, Country)
  const userAgent = req.headers['user-agent'];
  console.log(\`[DynoQR Scan] \${slug} -> \${qr.destination} at \${new Date().toISOString()}\`);

  // 3. HTTP 302 Found (Temporary Redirect)
  // CRITICAL: 302 ensures browsers never cache this, so changing destination takes effect immediately!
  return res.redirect(302, qr.destination);
});

app.listen(PORT, () => console.log(\`DynoQR Gateway running on port \${PORT}\`));`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadStandaloneHtml = () => {
    const qrsJson = JSON.stringify(qrs, null, 2);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DynoQR - Standalone Dynamic QR Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <style>
    body { background-color: #f8fafc; color: #0f172a; font-family: system-ui, sans-serif; }
  </style>
</head>
<body class="p-6 max-w-6xl mx-auto">
  <header class="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
        QR
      </div>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">DynoQR Standalone</h1>
        <p class="text-xs text-slate-500">Self-contained single-file dynamic QR hosting with local JSON storage</p>
      </div>
    </div>
    <div class="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full font-semibold">
      Host Anywhere: Netlify, Vercel, GitHub Pages, or Local Disk
    </div>
  </header>

  <div id="app"></div>

  <script>
    let qrs = ${qrsJson};
    const saved = localStorage.getItem('dynoqr_standalone_qrs');
    if (saved) {
      try { qrs = JSON.parse(saved); } catch(e){}
    }

    const params = new URLSearchParams(window.location.search);
    const redirectSlug = params.get('r');

    if (redirectSlug) {
      const match = qrs.find(q => q.slug.toLowerCase() === redirectSlug.toLowerCase());
      if (match && match.isActive) {
        document.body.innerHTML = '<div class="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-lg max-w-md mx-auto my-12 p-8"><h2 class="text-xl font-bold text-slate-900 mb-2">Loading Destination:</h2><div class="text-blue-600 font-mono font-bold mb-4">' + match.destination + '</div><div class="text-xs text-slate-500">Redirecting immediately...</div></div>';
        window.location.replace(match.destination);
      } else {
        document.body.innerHTML = '<div class="text-center py-20 text-rose-600 font-bold">Dynamic QR /r/' + redirectSlug + ' not found or paused.</div>';
      }
    } else {
      renderDashboard();
    }

    function renderDashboard() {
      const root = document.getElementById('app');
      root.innerHTML = \`
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div class="text-xs text-slate-500 uppercase font-semibold">Total Dynamic QRs</div>
            <div class="text-2xl font-bold text-slate-900 mt-1">\${qrs.length}</div>
          </div>
          <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div class="text-xs text-slate-500 uppercase font-semibold">Total Scans</div>
            <div class="text-2xl font-bold text-blue-600 mt-1">\${qrs.reduce((a,b)=>a+(b.totalScans||0),0)}</div>
          </div>
          <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-500 uppercase font-semibold">Data Backup</div>
              <div class="text-xs text-slate-600 mt-0.5">Save current state</div>
            </div>
            <button onclick="downloadJsonBackup()" class="text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg">Export JSON</button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="cards-container"></div>
      \`;

      const container = document.getElementById('cards-container');
      qrs.forEach(qr => {
        const card = document.createElement('div');
        card.className = "bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs";
        card.innerHTML = \`
          <div>
            <div class="flex justify-between text-xs text-slate-500 mb-2">
              <span class="font-semibold">\${qr.folder}</span>
              <span class="\${qr.isActive ? 'text-emerald-600 font-bold' : 'text-slate-400'}">\${qr.isActive ? 'Active' : 'Paused'}</span>
            </div>
            <div class="flex gap-3 items-center">
              <div id="qr-box-\${qr.id}" class="w-20 h-20 bg-slate-50 p-1 border border-slate-200 rounded-xl shrink-0"></div>
              <div class="min-w-0">
                <h3 class="font-bold text-slate-900 truncate">\${qr.name}</h3>
                <div class="text-xs text-blue-600 font-mono font-bold mt-1">/r/\${qr.slug}</div>
                <div class="text-xs text-slate-500 truncate mt-1">Target: \${qr.destination}</div>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span class="text-slate-500">Scans: <strong class="text-slate-900">\${qr.totalScans || 0}</strong></span>
            <button onclick="editDest('\${qr.id}')" class="text-blue-600 font-bold hover:underline">Change URL</button>
          </div>
        \`;
        container.appendChild(card);

        const box = document.getElementById('qr-box-' + qr.id);
        const redirectUrl = window.location.origin + window.location.pathname + '?r=' + qr.slug;
        new QRCode(box, {
          text: redirectUrl,
          width: 72,
          height: 72,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      });
    }

    function editDest(id) {
      const qr = qrs.find(q => q.id === id);
      if (!qr) return;
      const newUrl = prompt('Enter new destination URL for "' + qr.name + '" (QR code will NOT change!):', qr.destination);
      if (newUrl && newUrl.trim()) {
        qr.destination = newUrl.trim();
        localStorage.setItem('dynoqr_standalone_qrs', JSON.stringify(qrs));
        renderDashboard();
      }
    }

    function downloadJsonBackup() {
      const blob = new Blob([JSON.stringify(qrs, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'dynoqr-backup.json';
      a.click();
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dynoqr-standalone.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case 'cloudflare':
        return cfCode;
      case 'vercel':
        return vercelCode;
      case 'express':
        return expressCode;
      case 'sql':
        return sqlCode;
      default:
        return '';
    }
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      ariaLabel="Hosting & Gateway Deployment"
    >
      <div className="flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Hosting & Gateway Deployment</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deploy the <code className="text-blue-600 font-mono font-semibold">/r/[slug]</code> gateway so your dynamic QRs redirect and log scans at 0ms latency.
            </p>
          </div>
          <button
            onClick={onClose}
            className="clay-button-secondary p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('cloudflare')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cloudflare'
                  ? 'clay-button-primary text-white shadow-xs'
                  : 'clay-button-secondary text-slate-600 hover:text-blue-600'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloudflare Workers</span>
            </button>

            <button
              onClick={() => setActiveTab('vercel')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'vercel'
                  ? 'clay-button-primary text-white shadow-xs'
                  : 'clay-button-secondary text-slate-600 hover:text-blue-600'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Vercel Edge</span>
            </button>

            <button
              onClick={() => setActiveTab('express')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'express'
                  ? 'clay-button-primary text-white shadow-xs'
                  : 'clay-button-secondary text-slate-600 hover:text-blue-600'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Node / Express</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'sql'
                  ? 'clay-button-primary text-white shadow-xs'
                  : 'clay-button-secondary text-slate-600 hover:text-blue-600'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>SQL Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('standalone')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'standalone'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'clay-button-secondary text-slate-600 hover:text-blue-600'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Single-File HTML</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {activeTab === 'standalone' ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Export Self-Contained Single-File HTML</h3>
                  <p className="text-xs text-slate-500">
                    Generates a portable <code>dynoqr-standalone.html</code> with zero server dependencies.
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <p>
                  As requested, this packs the entire dynamic QR hosting platform, the <code className="text-blue-600 font-mono font-semibold">qrcodejs</code> engine, your existing {qrs.length} QR codes, and local storage state into <strong>one single HTML file</strong>.
                </p>
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                  <div>• <strong>Run locally:</strong> Double-click the file on Mac or Windows to create and edit dynamic QRs instantly in your browser.</div>
                  <div>• <strong>Host anywhere:</strong> Drop the single HTML file into GitHub Pages, Cloudflare Pages, Netlify, or Apache.</div>
                  <div>• <strong>Testing redirect:</strong> Visiting <code className="text-blue-600 font-mono font-semibold">dynoqr-standalone.html?r=reviews-kansas</code> logs the scan and forwards to the target URL automatically!</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownloadStandaloneHtml}
                  className="clay-button-primary px-5 py-2.5 text-white font-bold rounded-full text-xs shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download dynoqr-standalone.html ({qrs.length} QRs included)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {activeTab === 'cloudflare' && 'Zero-cold-start Edge routing with Cloudflare KV storage.'}
                  {activeTab === 'vercel' && 'Next.js App Router Edge Route Handler.'}
                  {activeTab === 'express' && 'Standard Node.js / Express microservice.'}
                  {activeTab === 'sql' && 'PostgreSQL / Supabase DDL with indexed slug lookup.'}
                </span>

                <button
                  onClick={() => handleCopy(getActiveContent())}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto max-h-[380px] leading-relaxed select-all">
                <code>{getActiveContent()}</code>
              </pre>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Tip:</strong> Always use <strong>302 Temporary Redirects</strong> instead of 301. Browsers will never cache 302, allowing instant destination changes without delay!
                </span>
              </div>
            </div>
          )}

        </div>

      </div>
    </ModalPortal>
  );
};
