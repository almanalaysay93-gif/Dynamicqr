import React, { useEffect, useState, useMemo } from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, ArrowLeft, QrCode, Loader2 } from 'lucide-react';
import {
  DynamicQR,
  ScanRecord,
  PlatformSettings,
  createScanEvent,
  normalizeDestinationUrl,
} from '../utils/qrLogic';

interface RedirectScreenProps {
  slug: string;
  targetOverride?: string | null;
  qrs: DynamicQR[];
  settings?: PlatformSettings;
  onLogScan: (scan: ScanRecord, qrId: string, syncedDestination?: string) => void;
  onBackToDashboard: () => void;
}

export const RedirectScreen: React.FC<RedirectScreenProps> = ({
  slug,
  targetOverride,
  qrs,
  settings,
  onLogScan,
  onBackToDashboard,
}) => {
  const [logged, setLogged] = useState(false);

  const cleanSlug = slug.toLowerCase().trim();

  const matchedQr = useMemo(() => {
    // 1. Prioritize exact current slug match before falling back to previousSlugs
    const exactMatch = qrs.find((q) => q.slug.toLowerCase() === cleanSlug);
    const prevMatch =
      exactMatch ||
      qrs.find(
        (q) => q.previousSlugs && q.previousSlugs.some((ps) => ps.toLowerCase() === cleanSlug)
      );

    // 2. If QR scan URL contains ?to=<destination>, override stale device localStorage
    const overrideCheck = targetOverride ? normalizeDestinationUrl(targetOverride) : null;
    const validOverrideUrl = overrideCheck?.valid ? overrideCheck.url : null;

    if (prevMatch) {
      if (validOverrideUrl && prevMatch.destination !== validOverrideUrl) {
        return {
          ...prevMatch,
          destination: validOverrideUrl,
        };
      }
      return prevMatch;
    }

    // 3. If scanned on a separate device (phone) that doesn't have this custom QR in its localStorage yet
    if (validOverrideUrl) {
      return {
        id: `qr-remote-${cleanSlug}`,
        name: cleanSlug,
        slug: cleanSlug,
        folder: 'Default',
        destination: validOverrideUrl,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalScans: 0,
      } satisfies DynamicQR;
    }

    return undefined;
  }, [qrs, cleanSlug, targetOverride]);

  const delayMs = Math.max(0, settings?.redirectDelayMs ?? 0);

  useEffect(() => {
    if (!matchedQr || !matchedQr.isActive) return;

    if (!logged) {
      const scanEvent = createScanEvent(matchedQr, {
        referrer:
          typeof document !== 'undefined' && document.referrer
            ? document.referrer
            : 'Direct Dynamic QR Scan',
      });
      onLogScan(scanEvent, matchedQr.id, matchedQr.destination);
      setLogged(true);
    }

    const performRedirect = () => {
      try {
        if (window.top && window.top !== window) {
          try {
            window.top.location.href = matchedQr.destination;
          } catch {
            window.location.replace(matchedQr.destination);
          }
        } else {
          window.location.replace(matchedQr.destination);
        }
      } catch {
        try {
          window.location.href = matchedQr.destination;
        } catch (e2) {
          console.warn('Direct redirect blocked by sandbox iframe', e2);
        }
      }
    };

    if (delayMs === 0) {
      performRedirect();
      return;
    }

    const timer = window.setTimeout(performRedirect, delayMs);
    return () => window.clearTimeout(timer);
  }, [matchedQr, logged, delayMs, onLogScan]);

  if (!matchedQr) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Dynamic QR Not Found</h2>
          <p className="text-xs text-slate-500">
            No active dynamic QR code is registered under <code className="text-rose-600 font-mono font-bold">/r/{slug}</code>.
          </p>
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to DynoQR Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  if (!matchedQr.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">QR Campaign Paused</h2>
          <p className="text-xs text-slate-500">
            The owner of <strong className="text-slate-800">{matchedQr.name}</strong> (<code className="text-amber-600 font-mono font-bold">/r/{matchedQr.slug}</code>) has temporarily paused this dynamic link.
          </p>
          <button
            onClick={onBackToDashboard}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to DynoQR Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full clay-card p-6 sm:p-8 text-center space-y-5 shadow-xl border border-slate-200 bg-white">
        
        {/* Dynamic gateway logo & loading animation */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/40">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Scan Logged</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Loading Site Immediately...
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic QR: <span className="text-slate-800 font-semibold">{matchedQr.name}</span>
          </p>
        </div>

        {/* Immediate Destination Indicator */}
        <div className="clay-inset p-3.5 text-xs text-left space-y-1 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            Redirecting to:
          </div>
          <div className="text-blue-600 font-mono text-xs font-semibold break-all truncate">
            {matchedQr.destination}
          </div>
        </div>

        {/* Immediate redirection message */}
        <p className="text-[11px] text-slate-400">
          Transferring your browser directly to destination...
        </p>

        {/* Subtle fallback in case browser sandbox prohibits automated script redirects */}
        <div className="space-y-3 pt-1">
          <div className="text-[11px] text-slate-500">
            <span>Taking too long? </span>
            <a
              href={matchedQr.destination}
              target="_top"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-700 font-bold underline inline-flex items-center gap-0.5"
            >
              <span>Click to open directly</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onBackToDashboard}
            className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            ← Back to DynoQR Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
