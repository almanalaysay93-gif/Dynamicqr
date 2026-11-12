import React, { useRef } from 'react';
import {
  X,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  ExternalLink,
  Play,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DynamicQR, ScanRecord, PlatformSettings, buildShortLink } from '../utils/qrLogic';
import { ModalPortal } from './ModalPortal';

interface QrAnalyticsModalProps {
  qr: DynamicQR | null;
  isOpen: boolean;
  onClose: () => void;
  scans: ScanRecord[];
  settings: PlatformSettings;
  onSimulateScan: (qr: DynamicQR) => void;
  onToggleActive: (qrId: string) => void;
}

export const QrAnalyticsModal: React.FC<QrAnalyticsModalProps> = ({
  qr,
  isOpen,
  onClose,
  scans,
  settings,
  onSimulateScan,
  onToggleActive,
}) => {
  const lastQrRef = useRef<DynamicQR | null>(qr);
  if (qr) {
    lastQrRef.current = qr;
  }
  const activeQr = qr || lastQrRef.current;

  const basePath = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : '/'
  ).replace(/\/+$/, '');

  const shortLink = activeQr
    ? buildShortLink(
        activeQr.slug,
        settings,
        typeof window !== 'undefined' ? `${window.location.origin}${basePath}` : 'http://localhost:3000',
        activeQr.destination
      )
    : '';

  // Filter scans specifically for this QR
  const qrScans = activeQr
    ? scans.filter((s) => s.qrId === activeQr.id || s.slug === activeQr.slug)
    : [];

  // Device counts
  const deviceCounts = { Mobile: 0, Desktop: 0, Tablet: 0 };
  const cityCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};

  qrScans.forEach((s) => {
    deviceCounts[s.device] = (deviceCounts[s.device] || 0) + 1;
    cityCounts[s.city] = (cityCounts[s.city] || 0) + 1;
    osCounts[s.os] = (osCounts[s.os] || 0) + 1;
  });

  const totalRecorded = qrScans.length;
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <ModalPortal
      isOpen={isOpen && Boolean(activeQr)}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      ariaLabel={activeQr ? `Analytics for ${activeQr.name}` : 'QR Analytics'}
    >
      {activeQr && (
        <div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{activeQr.name}</h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                activeQr.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {activeQr.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-blue-600 font-mono font-semibold mt-0.5">
              Short Link: {shortLink} · Folder: {activeQr.folder}
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

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Quick Action & Destination Banner */}
          <div className="clay-card-flat p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 border border-slate-200">
            <div className="space-y-1 min-w-0">
              <span className="text-slate-500 block font-bold uppercase tracking-wider text-[10px]">Target Destination:</span>
              <a
                href={activeQr.destination}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-800 font-mono font-semibold flex items-center gap-1.5 truncate"
                title={activeQr.destination}
              >
                <span className="truncate">{activeQr.destination}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onSimulateScan(activeQr)}
                className="clay-button-primary px-3.5 py-2 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Scan</span>
              </button>
              <button
                onClick={() => onToggleActive(activeQr.id)}
                className="clay-button-secondary px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 cursor-pointer"
              >
                {activeQr.isActive ? 'Pause QR' : 'Activate QR'}
              </button>
            </div>
          </div>

          {/* Key KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="clay-inset p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Scans</span>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
                {activeQr.totalScans.toLocaleString()}
              </div>
            </div>

            <div className="clay-inset p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Mobile Camera</span>
              <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums mt-1">
                {totalRecorded > 0 ? Math.round((deviceCounts.Mobile / totalRecorded) * 100) : 85}%
              </div>
            </div>

            <div className="clay-inset p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Primary OS</span>
              <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {Object.entries(osCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'iOS'}
              </div>
            </div>

            <div className="clay-inset p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Created</span>
              <div className="text-sm font-semibold text-slate-800 mt-2">
                {new Date(activeQr.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Device & Location Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Devices */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Device Breakdown</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mobile Phone</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-900 font-bold">
                    {deviceCounts.Mobile} ({totalRecorded > 0 ? Math.round((deviceCounts.Mobile / totalRecorded) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{
                      width: `${totalRecorded > 0 ? (deviceCounts.Mobile / totalRecorded) * 100 : 0}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    <span>Desktop / Laptop</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-900 font-bold">
                    {deviceCounts.Desktop} ({totalRecorded > 0 ? Math.round((deviceCounts.Desktop / totalRecorded) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-400 h-full rounded-full"
                    style={{
                      width: `${totalRecorded > 0 ? (deviceCounts.Desktop / totalRecorded) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Top Geographic Locations</span>
              </div>

              <div className="space-y-2 text-xs">
                {topCities.length > 0 ? (
                  topCities.map(([city, count]) => (
                    <div key={city} className="flex items-center justify-between text-slate-700">
                      <span>{city}</span>
                      <span className="font-mono tabular-nums text-blue-600 font-bold">
                        {count} scans
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs py-2">No location scans recorded yet</div>
                )}
              </div>
            </div>

          </div>

          {/* Recent Scan History Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Recent Scan Stream</span>
              </span>
              <span className="text-[11px] text-slate-500 font-semibold">
                {qrScans.length} events logged
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-xs">
              {qrScans.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-semibold">
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">Device / OS</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3">Target Forwarded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                    {qrScans.slice(0, 15).map((scan) => (
                      <tr key={scan.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 whitespace-nowrap text-slate-500">
                          {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-900 font-sans font-medium">
                          {scan.device} · {scan.os}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap font-sans">
                          {scan.city}, {scan.countryCode}
                        </td>
                        <td className="py-2 px-3 truncate max-w-[200px] text-blue-600">
                          {scan.destinationForwarded}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No scan logs yet. Click "Simulate Scan" above to test logging!
                </div>
              )}
            </div>
          </div>

        </div>
        </div>
      )}
    </ModalPortal>
  );
};
