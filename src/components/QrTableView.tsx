import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Edit2,
  BarChart3,
  Download,
  Printer,
  Trash2,
  Play,
} from 'lucide-react';
import { DynamicQR, PlatformSettings, buildShortLink, formatShortLinkDisplay } from '../utils/qrLogic';
import { downloadQrPng, printQrStandSheet } from '../utils/qrRenderer';

interface QrTableViewProps {
  qrs: DynamicQR[];
  settings: PlatformSettings;
  onEditDestination: (qr: DynamicQR) => void;
  onOpenAnalytics: (qr: DynamicQR) => void;
  onToggleActive: (qrId: string) => void;
  onDelete: (qrId: string) => void;
  onSimulateScan: (qr: DynamicQR) => void;
}

export const QrTableView: React.FC<QrTableViewProps> = ({
  qrs,
  settings,
  onEditDestination,
  onOpenAnalytics,
  onToggleActive,
  onDelete,
  onSimulateScan,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const basePath = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : '/'
  ).replace(/\/+$/, '');

  const handleCopy = (qr: DynamicQR) => {
    const link = buildShortLink(qr.slug, settings, `${window.location.origin}${basePath}`, qr.destination);
    navigator.clipboard.writeText(link);
    setCopiedId(qr.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="clay-card overflow-hidden shadow-xs border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">QR Name</th>
              <th className="py-3.5 px-4">Short Gateway</th>
              <th className="py-3.5 px-4">Campaign / Folder</th>
              <th className="py-3.5 px-4">Current Destination</th>
              <th className="py-3.5 px-4 text-right">Scans</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {qrs.map((qr) => {
              const shortLink = buildShortLink(
                qr.slug,
                settings,
                `${window.location.origin}${basePath}`,
                qr.destination
              );
              const isCopied = copiedId === qr.id;
              const localRedirectHref = `${basePath}/r/${qr.slug}?to=${encodeURIComponent(qr.destination)}`;

              return (
                <tr key={qr.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Status Toggle */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qr.isActive}
                        onChange={() => onToggleActive(qr.id)}
                        className="sr-only peer"
                        aria-label={`Toggle ${qr.name}`}
                      />
                      <div className="w-7 h-3.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </td>

                  {/* QR Name */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[180px] truncate">
                    <div className="flex items-center gap-2">
                      <span className="truncate" title={qr.name}>{qr.name}</span>
                    </div>
                  </td>

                  {/* Short Link */}
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditDestination(qr)}
                        className="hover:underline cursor-pointer text-left"
                        title="Click to edit short link or destination"
                      >
                        {formatShortLinkDisplay(qr.slug, settings)}
                      </button>
                      <button
                        onClick={() => handleCopy(qr)}
                        className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                        title="Copy short link"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={localRedirectHref}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded"
                        title="Open redirect"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>

                  {/* Campaign */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium max-w-[140px] truncate">
                    {qr.folder}
                  </td>

                  {/* Destination */}
                  <td className="py-3.5 px-4 text-slate-600 max-w-[240px] truncate">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-slate-700 text-[11px]" title={qr.destination}>{qr.destination}</span>
                      <button
                        onClick={() => onEditDestination(qr)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded shrink-0 cursor-pointer"
                        title="Change Destination URL"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Scans */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {qr.totalScans.toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSimulateScan(qr)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Test scan"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Scan</span>
                      </button>
                      <button
                        onClick={() => onOpenAnalytics(qr)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => downloadQrPng(shortLink, qr.slug, 1024, qr.styling)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Download PNG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => printQrStandSheet(qr.name, shortLink, qr.destination, qr.styling)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Print Stand Sheet"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(qr.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete QR"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
