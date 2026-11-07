import React, { useState } from 'react';
import { Layers, FolderPlus, Check, X, Tag } from 'lucide-react';
import { DynamicQR } from '../utils/qrLogic';

interface CampaignBarProps {
  qrs: DynamicQR[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  folders: string[];
  onCreateFolder: (newFolderName: string) => void;
}

export const CampaignBar: React.FC<CampaignBarProps> = ({
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

  // Metrics per folder
  const folderCounts = folders.reduce((acc, f) => {
    acc[f] = qrs.filter((q) => q.folder === f).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        
        {/* All Campaigns button */}
        <button
          onClick={() => onSelectFolder('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            selectedFolder === 'all'
              ? 'clay-button-primary text-white shadow-xs'
              : 'clay-button-secondary text-slate-700 hover:text-blue-600 bg-white border border-slate-200'
          }`}
        >
          <span>All Campaigns</span>
          <span className="ml-1.5 opacity-80 font-mono">({qrs.length})</span>
        </button>

        {/* Folders */}
        {folders.map((folder) => {
          const isSelected = selectedFolder === folder;
          const count = folderCounts[folder] || 0;

          return (
            <button
              key={folder}
              onClick={() => onSelectFolder(folder)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'clay-button-primary text-white shadow-xs'
                  : 'clay-button-secondary text-slate-700 hover:text-blue-600 bg-white border border-slate-200'
              }`}
            >
              <Tag className="w-3 h-3 opacity-70" />
              <span>{folder}</span>
              <span className="opacity-80 font-mono">({count})</span>
            </button>
          );
        })}

        {/* Add Folder Pill */}
        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="flex items-center gap-1.5 shrink-0 bg-white px-3 py-1 rounded-full border border-blue-400 shadow-xs">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Shop 2"
              className="bg-transparent text-xs text-slate-900 placeholder-slate-400 px-1 py-0.5 focus:outline-none w-28"
              autoFocus
            />
            <button
              type="submit"
              className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
              aria-label="Confirm folder"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3.5 py-2 rounded-full text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ New Folder</span>
          </button>
        )}

      </div>
    </div>
  );
};
