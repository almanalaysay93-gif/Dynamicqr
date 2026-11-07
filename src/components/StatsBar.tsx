import React from 'react';
import { QrCode, Eye, CheckCircle2, TrendingUp, Smartphone, ArrowUpRight } from 'lucide-react';
import { DynamicQR, ScanRecord, calculateStats } from '../utils/qrLogic';

interface StatsBarProps {
  qrs: DynamicQR[];
  scans: ScanRecord[];
  onSelectQr?: (qr: DynamicQR) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ qrs, scans, onSelectQr }) => {
  const stats = calculateStats(qrs, scans);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      
      {/* Metric 1: Total QRs Hosted */}
      <div className="clay-card-flat bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Total QRs Hosted</span>
          <QrCode className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
            {stats.totalQrs}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            dynamic codes
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{stats.activeQrs} active</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{stats.inactiveQrs} paused</span>
        </div>
      </div>

      {/* Metric 2: Total Scans Across All QRs */}
      <div className="clay-card-flat bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Total Scans Logged</span>
          <Eye className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-600 font-mono tabular-nums">
            {stats.totalScans.toLocaleString()}
          </span>
          <span className="text-xs text-emerald-600 font-bold flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            Live
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-100">
          <span>{scans.length} events logged</span>
        </div>
      </div>

      {/* Metric 3: Active Routing Status */}
      <div className="clay-card-flat bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Device Traffic</span>
          <Smartphone className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
            {Math.round(((stats.deviceCounts['Mobile'] || 1) / (scans.length || 1)) * 100)}%
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Mobile camera
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100">
          <span>Mobile: {stats.deviceCounts['Mobile'] || 0}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Desktop: {stats.deviceCounts['Desktop'] || 0}</span>
        </div>
      </div>

      {/* Metric 4: Top Performing QR */}
      <div className="clay-card-flat bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Top Performing QR</span>
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </div>
        {stats.topQr ? (
          <div>
            <div className="text-sm font-bold text-slate-900 truncate" title={stats.topQr.name}>
              {stats.topQr.name}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-blue-600 font-mono tabular-nums">
                {stats.topQr.totalScans.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">/r/{stats.topQr.slug}</span>
            </div>
            {onSelectQr && (
              <button
                onClick={() => onSelectQr(stats.topQr!)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 pt-2 border-t border-slate-100 w-full cursor-pointer"
              >
                <span>View analytics</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400">No scans recorded yet</div>
        )}
      </div>

    </div>
  );
};
