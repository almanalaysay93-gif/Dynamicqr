import React from 'react';
import { QrCode, Plus, Settings, Download } from 'lucide-react';

interface TopNavProps {
  onOpenCreate: () => void;
  onOpenSettings: () => void;
  onOpenGoogleBusiness?: () => void;
  onOpenDeployment?: () => void;
  onExportCsv?: () => void;
  totalQrs?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenCreate,
  onOpenSettings,
  onOpenGoogleBusiness,
  onExportCsv,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          
          {/* Brand Mark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 border border-white/40">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                DynoQR
                <span className="hidden sm:inline-flex text-[11px] font-semibold tracking-normal px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
                  Dynamic Hosting
                </span>
              </span>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {onOpenGoogleBusiness && (
              <button
                onClick={onOpenGoogleBusiness}
                className="clay-button-secondary px-3 sm:px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Create Google Business Profile Review QR"
              >
                <span className="w-4 h-4 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-black border border-blue-200 shrink-0">G</span>
                <span className="hidden md:inline">Google Review QR</span>
              </button>
            )}

            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="clay-button-secondary p-2.5 text-slate-600 hover:text-blue-600 cursor-pointer"
                title="Export All QRs to CSV"
                aria-label="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="clay-button-secondary p-2.5 text-slate-600 hover:text-blue-600 cursor-pointer"
              title="Settings & Base Domain"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Primary CTA */}
            <button
              onClick={onOpenCreate}
              className="clay-button-primary px-4 py-2.5 text-xs font-bold text-white flex items-center gap-1.5 tracking-wide whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Dynamic QR</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
