import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Edit2,
  BarChart3,
  Download,
  Printer,
  CopyCheck,
  Trash2,
  MoreVertical,
  Play,
  FileCode,
  Tag,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicQR, PlatformSettings, buildShortLink, formatShortLinkDisplay } from '../utils/qrLogic';
import { generateQrDataUrl, downloadQrPng, downloadQrSvg, printQrStandSheet } from '../utils/qrRenderer';
import { ModalPortal } from './ModalPortal';

interface QrCardProps {
  qr: DynamicQR;
  settings: PlatformSettings;
  onEditDestination: (qr: DynamicQR) => void;
  onOpenAnalytics: (qr: DynamicQR) => void;
  onToggleActive: (qrId: string) => void;
  onDuplicate: (qr: DynamicQR) => void;
  onDelete: (qrId: string) => void;
  onSimulateScan: (qr: DynamicQR) => void;
}

export const QrCard: React.FC<QrCardProps> = ({
  qr,
  settings,
  onEditDestination,
  onOpenAnalytics,
  onToggleActive,
  onDuplicate,
  onDelete,
  onSimulateScan,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const basePath = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : '/'
  ).replace(/\/+$/, '');
  const localRedirectHref = `${basePath}/r/${qr.slug}`;

  const shortLink = buildShortLink(
    qr.slug,
    settings,
    typeof window !== 'undefined' ? `${window.location.origin}${basePath}` : 'http://localhost:3000'
  );

  useEffect(() => {
    if (!showMenu) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  useEffect(() => {
    let active = true;
    generateQrDataUrl(shortLink, {
      width: 240,
      margin: 1,
      fgColor: qr.styling?.fgColor || '#0F172A',
      bgColor: qr.styling?.bgColor || '#FFFFFF',
      errorCorrectionLevel: qr.styling?.correctionLevel || 'H',
      centerLogo: qr.styling?.centerLogo,
    }).then((url) => {
      if (active) setQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [shortLink, qr.styling]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`clay-card p-5 sm:p-6 flex flex-col justify-between relative group bg-white border border-slate-200 ${
        !qr.isActive ? 'opacity-75 bg-slate-50/80' : ''
      } ${showMenu ? 'z-30' : 'z-0'}`}
    >
      <div>
        {/* Top Header: Folder Chip & Status Toggle */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 truncate">
            <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{qr.folder}</span>
          </span>

          {/* Status Toggle */}
          <button
            onClick={() => onToggleActive(qr.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              qr.isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                qr.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{qr.isActive ? 'Active' : 'Paused'}</span>
          </button>
        </div>

        {/* Tactile QR Graphic + Metadata */}
        <div className="flex gap-4 sm:gap-5 items-start">
          {/* Sunken Clay Well for QR Stamp */}
          <div
            onClick={() => setIsZoomed(true)}
            className="clay-inset p-2 shrink-0 rounded-2xl cursor-pointer group/qr hover:scale-105 transition-transform bg-slate-100 border border-slate-200"
            title="Click to zoom & test scan with camera"
          >
            <div className="w-20 h-20 sm:w-22 sm:h-22 bg-white p-1 rounded-xl shadow-xs overflow-hidden relative">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR for ${qr.name}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
              )}
              <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover/qr:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold">
                Zoom
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate" title={qr.name}>
              {qr.name}
            </h3>

            {/* Short Link Pill */}
            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onEditDestination(qr)}
                className="text-xs font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 shadow-xs truncate max-w-[170px] cursor-pointer transition-colors"
                title="Click to edit short link or destination"
              >
                {formatShortLinkDisplay(qr.slug, settings)}
              </button>
              <button
                onClick={handleCopy}
                className="clay-button-secondary p-1.5 text-slate-600 hover:text-blue-600 cursor-pointer"
                title="Copy short link"
                aria-label="Copy short link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={localRedirectHref}
                target="_blank"
                rel="noreferrer"
                className="clay-button-secondary p-1.5 text-slate-600 hover:text-blue-600"
                title="Open short link redirect"
                aria-label="Open short link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Target URL with quick swap */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-bold uppercase tracking-wider">Destination</span>
                <button
                  onClick={() => onEditDestination(qr)}
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
              <div
                onClick={() => onEditDestination(qr)}
                className="text-xs text-slate-700 font-mono truncate mt-0.5 hover:text-blue-600 cursor-pointer"
                title={qr.destination}
              >
                {qr.destination}
              </div>
            </div>
          </div>
        </div>

        {/* Scan Counter Ribbon */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Total Scans:</span>
            <span className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
              {qr.totalScans.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => onOpenAnalytics(qr)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 py-1 px-2.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Action Strip */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSimulateScan(qr)}
            className="clay-button-primary px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Simulate Phone Camera Scan"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Test Scan</span>
          </button>

          <button
            onClick={() => downloadQrPng(shortLink, qr.slug, 1024, qr.styling)}
            className="clay-button-secondary p-2 text-slate-700 hover:text-blue-600 cursor-pointer"
            title="Download HD PNG"
            aria-label="Download PNG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => downloadQrSvg(shortLink, qr.slug, qr.styling)}
            className="clay-button-secondary p-2 text-slate-700 hover:text-blue-600 cursor-pointer"
            title="Download Vector SVG"
            aria-label="Download SVG"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => printQrStandSheet(qr.name, shortLink, qr.destination, qr.styling)}
            className="clay-button-secondary p-2 text-slate-700 hover:text-blue-600 cursor-pointer"
            title="Print Tabletop Sheet / PDF"
            aria-label="Print Tabletop Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* More Options */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="clay-button-secondary p-2 text-slate-500 hover:text-slate-800 cursor-pointer"
            aria-label="More options"
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 6 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 bottom-full mb-1.5 w-44 clay-modal p-1.5 z-40 text-xs text-slate-700 shadow-xl border border-slate-200 bg-white origin-bottom-right"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate(qr);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                >
                  <CopyCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Duplicate QR</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(qr.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete QR</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enlarge Zoom Modal (Portaled to body so card hover transform never traps it) */}
      <ModalPortal
        isOpen={isZoomed}
        onClose={() => setIsZoomed(false)}
        maxWidthClass="max-w-sm"
        ariaLabel={`Zoomed QR for ${qr.name}`}
      >
        <div className="p-6 sm:p-7 text-center space-y-4 relative">
          <button
            onClick={() => setIsZoomed(false)}
            className="clay-button-secondary p-2 text-slate-400 hover:text-slate-700 absolute top-4 right-4 cursor-pointer"
            aria-label="Close zoom preview"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pr-6 pl-6">
            <h3 className="text-lg font-bold text-slate-900 truncate" title={qr.name}>
              {qr.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Point your phone camera to scan off the screen!
            </p>
          </div>

          <div className="clay-inset p-3 inline-block bg-slate-50 border border-slate-200">
            <img
              src={qrDataUrl}
              alt={qr.name}
              className="w-56 h-56 mx-auto bg-white p-2 rounded-xl shadow-xs"
            />
          </div>

          <div className="text-xs font-mono text-blue-600 bg-blue-50 border border-blue-100 p-2 rounded-xl select-all font-semibold break-all">
            {shortLink}
          </div>

          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => downloadQrPng(shortLink, qr.slug, 2048, qr.styling)}
              className="clay-button-primary px-4 py-2 text-white text-xs font-bold cursor-pointer"
            >
              Download 2K PNG
            </button>
            <button
              onClick={() => setIsZoomed(false)}
              className="clay-button-secondary px-4 py-2 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
