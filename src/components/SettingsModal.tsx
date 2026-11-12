import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Globe, Database, Save, RotateCcw, Upload, Download, AlertCircle } from 'lucide-react';
import { PlatformSettings, DynamicQR, ScanRecord } from '../utils/qrLogic';
import { ModalPortal } from './ModalPortal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlatformSettings;
  onSaveSettings: (settings: PlatformSettings) => void;
  qrs: DynamicQR[];
  scans: ScanRecord[];
  onImportData: (qrs: DynamicQR[], scans: ScanRecord[]) => void;
  onResetToDemo: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  qrs,
  scans,
  onImportData,
  onResetToDemo,
}) => {
  const [customDomain, setCustomDomain] = useState(settings.customDomain);
  const [useCustomDomain, setUseCustomDomain] = useState(settings.useCustomDomain);
  const [redirectDelayMs, setRedirectDelayMs] = useState(settings.redirectDelayMs);
  const [savedNotice, setSavedNotice] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomDomain(settings.customDomain);
      setUseCustomDomain(settings.useCustomDomain);
      setRedirectDelayMs(settings.redirectDelayMs);
      setSavedNotice(false);
      setStatusError(null);
      setConfirmingReset(false);
    }
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [isOpen, settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      customDomain: customDomain.trim(),
      useCustomDomain,
      redirectDelayMs: Number(redirectDelayMs),
    });
    setSavedNotice(true);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 650);
  };

  const handleExportJson = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: { ...settings, customDomain, useCustomDomain, redirectDelayMs: Number(redirectDelayMs) },
      qrs,
      scans,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dynoqr-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.qrs && Array.isArray(parsed.qrs)) {
          onImportData(parsed.qrs, parsed.scans || []);
          onClose();
        } else {
          setStatusError('Invalid backup file format: missing "qrs" array.');
        }
      } catch {
        setStatusError('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      ariaLabel="Platform Settings & Custom Domain"
    >
      <div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Platform Settings & Custom Domain</h2>
            <p className="text-xs text-slate-500">
              Configure dynamic gateway routing and backup store
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

        {/* Settings Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Custom Short Domain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Base Gateway Domain</span>
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomDomain}
                  onChange={(e) => setUseCustomDomain(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-[11px] text-slate-600 font-semibold">
                  {useCustomDomain ? 'Custom Domain' : 'Current Origin'}
                </span>
              </label>
            </div>

            {useCustomDomain ? (
              <div>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g. go.link or qr.mydomain.com"
                  className="w-full clay-inset px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono bg-slate-50 border border-slate-200"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Short link previews: <code className="text-blue-600 font-mono font-semibold">https://{customDomain || 'go.link'}/r/slug</code>
                </p>
              </div>
            ) : (
              <div className="clay-inset p-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl">
                Using current origin: <code className="text-blue-600 font-mono font-semibold">{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/r/slug</code>
              </div>
            )}
          </div>

          {/* Redirect Interstitial Delay */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">
              Redirect Transition Speed
            </label>
            <select
              value={redirectDelayMs}
              onChange={(e) => setRedirectDelayMs(Number(e.target.value))}
              className="w-full clay-inset px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="0">Instant 0ms (Production 302 Fast Forward)</option>
              <option value="600">Fast 600ms (Show Branded "Forwarding..." badge)</option>
              <option value="1200">1.2s Interstitial (Safe Preview Mode for live testing)</option>
            </select>
          </div>

          {/* Backup & Restore Data */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Data Storage & JSON Backup</span>
            </label>
            
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportJson}
                className="clay-button-secondary px-3 py-1.5 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <label className="clay-button-secondary px-3 py-1.5 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (!confirmingReset) {
                    setConfirmingReset(true);
                    return;
                  }
                  onResetToDemo();
                  setConfirmingReset(false);
                  onClose();
                }}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors cursor-pointer ${
                  confirmingReset
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{confirmingReset ? 'Confirm Reset?' : 'Reset Demo'}</span>
              </button>
            </div>
            {statusError && (
              <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{statusError}</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {savedNotice ? (
              <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                <Check className="w-4 h-4" /> Settings Saved!
              </span>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="clay-button-secondary px-3.5 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="clay-button-primary px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </ModalPortal>
  );
};
