import React, { useState } from 'react';
import { ArrowRight, Sparkles, ChevronRight, Eye, QrCode, TrendingUp, Smartphone } from 'lucide-react';
import { DynamicQR, ScanRecord, calculateStats } from '../utils/qrLogic';

interface ExplanationBannerProps {
  qrs: DynamicQR[];
  scans: ScanRecord[];
}

export const ExplanationBanner: React.FC<ExplanationBannerProps> = ({ qrs, scans }) => {
  const [showDemo, setShowDemo] = useState(false);
  const [activeTarget, setActiveTarget] = useState<'kansas' | 'luccianos'>('kansas');

  const stats = calculateStats(qrs, scans);

  return (
    <div className="clay-card p-5 sm:p-6 mb-6 relative overflow-hidden bg-white border border-slate-200">
      
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Dynamic QR Hosting · Zero Reprinting</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            One Printed QR Code. Change Where It Goes Anytime.
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Encodes your permanent short gateway <code className="bg-slate-100 px-2 py-0.5 rounded-lg text-blue-700 font-mono text-xs border border-slate-200 font-semibold">/r/{'{slug}'}</code>. When customers scan, it logs analytics and redirects instantly. Switch targets from Google Reviews to menus without reprinting physical table cards or stickers.
          </p>
        </div>

        {/* Metric Pills */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <div className="clay-card-flat px-3.5 py-2 flex items-center gap-2.5 bg-white border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Hosted QRs</div>
              <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">{stats.totalQrs} Dynamic</div>
            </div>
          </div>

          <div className="clay-card-flat px-3.5 py-2 flex items-center gap-2.5 bg-white border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Scans</div>
              <div className="text-sm font-bold text-blue-600 font-mono tabular-nums">{stats.totalScans.toLocaleString()}</div>
            </div>
          </div>

          <button
            onClick={() => setShowDemo(!showDemo)}
            className="clay-button-secondary px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 self-center cursor-pointer"
          >
            <span>{showDemo ? 'Close Guide' : 'How It Works'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDemo ? 'rotate-90' : ''}`} />
          </button>
        </div>

      </div>

      {/* Interactive Quick Swap Demonstration */}
      {showDemo && (
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="clay-inset p-3.5 space-y-1.5 bg-rose-50/60 border border-rose-200 text-slate-700">
            <div className="font-bold text-rose-700 flex items-center gap-1.5">
              <span>✕ Classic Static QR (Wasteful & Rigid)</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Encodes direct link e.g. <code className="text-rose-700 font-semibold">milocal.com/carta</code>. When the link breaks or your promotion changes, <strong>you must throw away and reprint every table stand, flyer, and sticker</strong>.
            </p>
          </div>

          <div className="clay-card-flat p-3.5 space-y-2 border border-blue-200 bg-blue-50/40">
            <div className="font-bold text-blue-900 flex items-center justify-between">
              <span>✓ DynoQR Dynamic Redirect</span>
              <span className="text-[10px] text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                Live Simulator
              </span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              QR encodes short link <code className="text-blue-700 font-mono font-semibold">/r/reviews-kansas</code>. Click below to test live swap:
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setActiveTarget('kansas')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  activeTarget === 'kansas'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:text-blue-600'
                }`}
              >
                Target: Kansas Reviews
              </button>
              <button
                onClick={() => setActiveTarget('luccianos')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  activeTarget === 'luccianos'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:text-blue-600'
                }`}
              >
                Target: Lucciano's Palermo
              </button>
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate pt-1 border-t border-blue-100">
              Current destination: <span className="text-slate-900 font-semibold">{activeTarget === 'kansas' ? 'https://maps.google.com/?q=Kansas+Reviews' : 'https://instagram.com/luccianos_palermo_soho'}</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
