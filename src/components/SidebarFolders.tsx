import React, { useState } from 'react';
import { Folder, FolderPlus, Check, ChevronRight, Layers, Tag } from 'lucide-react';
import { DynamicQR } from '../utils/qrLogic';

interface SidebarFoldersProps {
  qrs: DynamicQR[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  folders: string[];
  onCreateFolder: (newFolderName: string) => void;
}

export const SidebarFolders: React.FC<SidebarFoldersProps> = ({
  qrs,
  selectedFolder,
  onSelectFolder,
  folders,
  onCreateFolder,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAdding(false);
    }
  };

  // Calculate count & scans per folder
  const folderMetrics = folders.reduce((acc, folder) => {
    const matching = qrs.filter((q) => q.folder === folder);
    const scans = matching.reduce((sum, q) => sum + (q.totalScans || 0), 0);
    acc[folder] = { count: matching.length, scans };
    return acc;
  }, {} as Record<string, { count: number; scans: number }>);

  const totalAllScans = qrs.reduce((sum, q) => sum + (q.totalScans || 0), 0);

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Campaign Folders</span>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
            title="Create new folder"
            aria-label="Create new campaign folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* All QRs option */}
        <button
          onClick={() => onSelectFolder('all')}
          className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between transition-colors mb-1.5 cursor-pointer ${
            selectedFolder === 'all'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Folder className="w-4 h-4 shrink-0" />
            <span className="truncate">All Campaigns</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums opacity-90 shrink-0">
            <span>{qrs.length}</span>
          </div>
        </button>

        {/* Folder List */}
        <div className="space-y-1 mt-2">
          {folders.map((folder) => {
            const metrics = folderMetrics[folder] || { count: 0, scans: 0 };
            const isSelected = selectedFolder === folder;

            return (
              <button
                key={folder}
                onClick={() => onSelectFolder(folder)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Tag className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate font-medium" title={folder}>{folder}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums opacity-90 shrink-0">
                  <span className="font-semibold">{metrics.count}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    ({metrics.scans.toLocaleString()})
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Add Folder Inline Input */}
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="mt-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Campaign / Folder Name
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Client: Lucciano's"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="mt-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center justify-between text-slate-700 font-semibold">
          <span>Active Scans</span>
          <span className="font-mono tabular-nums text-slate-900">{totalAllScans.toLocaleString()}</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 leading-normal">
          Organize dynamic QRs by client, venue, or marketing campaign for unified tracking.
        </p>
      </div>
    </aside>
  );
};
