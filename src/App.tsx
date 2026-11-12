import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  QrCode,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  DynamicQR,
  ScanRecord,
  PlatformSettings,
  CenterLogoConfig,
  getInitialDemoQrs,
  getInitialDemoScans,
  filterQrs,
  exportQrsToCsv,
  createScanEvent,
  generateSlug,
} from './utils/qrLogic';
import { TopNav } from './components/TopNav';
import { CampaignBar } from './components/CampaignBar';
import { QrCard } from './components/QrCard';
import { QrTableView } from './components/QrTableView';
import { CreateQrModal } from './components/CreateQrModal';
import { EditDestinationModal } from './components/EditDestinationModal';
import { QrAnalyticsModal } from './components/QrAnalyticsModal';
import { DeploymentModal } from './components/DeploymentModal';
import { SettingsModal } from './components/SettingsModal';
import { RedirectScreen } from './components/RedirectScreen';
import { GoogleBusinessModal } from './components/GoogleBusinessModal';
import { ModalPortal } from './components/ModalPortal';

const STORAGE_KEY_QRS = 'dynoqr_hosted_qrs_v1';
const STORAGE_KEY_SCANS = 'dynoqr_scan_logs_v1';
const STORAGE_KEY_SETTINGS = 'dynoqr_settings_v1';
const STORAGE_KEY_FOLDERS = 'dynoqr_custom_folders_v1';

export default function App() {
  const [redirectSlug, setRedirectSlug] = useState<string | null>(null);
  const [redirectTargetOverride, setRedirectTargetOverride] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const toParam = searchParams.get('to') || searchParams.get('u') || searchParams.get('dest');
      if (toParam) {
        setRedirectTargetOverride(toParam);
      }

      const match = path.match(/\/r\/([a-zA-Z0-9_-]+)\/?$/);
      if (match && match[1]) {
        setRedirectSlug(match[1]);
        return;
      }
      const querySlug = searchParams.get('r');
      if (querySlug) {
        setRedirectSlug(querySlug);
      }
    }
  }, []);

  // Main Persistent State
  const [qrs, setQrs] = useState<DynamicQR[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_QRS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load QRs from localStorage', e);
    }
    return getInitialDemoQrs();
  });

  const [scans, setScans] = useState<ScanRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCANS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load Scans from localStorage', e);
    }
    return getInitialDemoScans();
  });

  const [settings, setSettings] = useState<PlatformSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load Settings from localStorage', e);
    }
    return {
      customDomain: 'go.link',
      useCustomDomain: false,
      defaultFolder: 'Default',
      autoLogSimulations: true,
      redirectDelayMs: 600,
    };
  });

  const [customFolders, setCustomFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FOLDERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Save to localStorage & sync across browser tabs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_QRS, JSON.stringify(qrs));
    } catch (e) {}
  }, [qrs]);

  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_QRS && e.newValue) {
        try {
          setQrs(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify(scans));
    } catch (e) {}
  }, [scans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(customFolders));
    } catch (e) {}
  }, [customFolders]);

  // View state & filters
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'scans' | 'name'>('recent');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGoogleBusinessOpen, setIsGoogleBusinessOpen] = useState(false);
  const [isDeploymentOpen, setIsDeploymentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<DynamicQR | null>(null);
  const [analyticsQr, setAnalyticsQr] = useState<DynamicQR | null>(null);
  const [deletingQrId, setDeletingQrId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Derived folder list combining QR folders + user-created custom folders
  const folders = useMemo(() => {
    const set = new Set<string>(customFolders);
    qrs.forEach((q) => {
      if (q.folder) set.add(q.folder);
    });
    return Array.from(set).sort();
  }, [qrs, customFolders]);

  // Keep analytics modal synced with live QR state (totalScans, isActive, destination)
  const liveAnalyticsQr = useMemo(() => {
    if (!analyticsQr) return null;
    return qrs.find((q) => q.id === analyticsQr.id) || analyticsQr;
  }, [qrs, analyticsQr]);

  const deletingQrTarget = useMemo(() => {
    if (!deletingQrId) return null;
    return qrs.find((q) => q.id === deletingQrId) || null;
  }, [qrs, deletingQrId]);

  // Filtered and sorted QRs
  const filteredQrs = useMemo(() => {
    let result = filterQrs(qrs, {
      folder: selectedFolder,
      status: statusFilter,
      search: searchQuery,
    });

    if (sortBy === 'scans') {
      result.sort((a, b) => (b.totalScans || 0) - (a.totalScans || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
    }

    return result;
  }, [qrs, selectedFolder, statusFilter, searchQuery, sortBy]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  const handleCreateQr = (newQr: DynamicQR) => {
    setQrs((prev) => [newQr, ...prev]);
    showToast(`Created Dynamic QR "/r/${newQr.slug}"!`);
  };

  const handleToggleActive = (qrId: string) => {
    setQrs((prev) =>
      prev.map((q) => {
        if (q.id === qrId) {
          const next = !q.isActive;
          showToast(next ? `Activated "${q.name}"` : `Paused "${q.name}"`);
          return { ...q, isActive: next, updatedAt: new Date().toISOString() };
        }
        return q;
      })
    );
  };

  const handleSaveDestination = (
    qrId: string,
    newDestination: string,
    newName?: string,
    newLogo?: CenterLogoConfig,
    newSlug?: string
  ) => {
    const existingQr = qrs.find((q) => q.id === qrId);
    const oldSlug = existingQr?.slug;
    const cleanedSlug = newSlug?.trim().toLowerCase() || oldSlug;
    const slugChanged = Boolean(cleanedSlug && oldSlug && cleanedSlug !== oldSlug);

    setQrs((prev) => {
      const next = prev.map((q) => {
        if (q.id === qrId) {
          const nextSlug = cleanedSlug || q.slug;
          const prevSlugs = new Set<string>(q.previousSlugs || []);
          if (q.slug && q.slug !== nextSlug) {
            prevSlugs.add(q.slug);
          }
          prevSlugs.delete(nextSlug);
          return {
            ...q,
            slug: nextSlug,
            previousSlugs: Array.from(prevSlugs),
            destination: newDestination,
            name: newName || q.name,
            updatedAt: new Date().toISOString(),
            styling: {
              ...(q.styling || {
                fgColor: '#0F172A',
                bgColor: '#FFFFFF',
                correctionLevel: 'H',
              }),
              centerLogo: newLogo !== undefined ? newLogo : q.styling?.centerLogo,
            },
          };
        }
        return q;
      });
      try {
        localStorage.setItem(STORAGE_KEY_QRS, JSON.stringify(next));
      } catch {}
      return next;
    });

    if (slugChanged && cleanedSlug && oldSlug) {
      setScans((prev) =>
        prev.map((s) =>
          s.qrId === qrId || s.slug.toLowerCase() === oldSlug.toLowerCase()
            ? { ...s, slug: cleanedSlug }
            : s
        )
      );
      showToast(`Short link updated to "/r/${cleanedSlug}" and destination saved!`);
    } else {
      showToast('Destination updated! Physical QR code remains 100% identical.');
    }
  };

  const handleDuplicateQr = (qr: DynamicQR) => {
    const newSlug = generateSlug(
      `${qr.slug}-copy`,
      qrs.map((q) => q.slug)
    );
    const copy: DynamicQR = {
      ...qr,
      id: `qr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${qr.name} (Copy)`,
      slug: newSlug,
      totalScans: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQrs((prev) => [copy, ...prev]);
    showToast(`Duplicated into "/r/${newSlug}"`);
  };

  const handleDeleteQr = (qrId: string) => {
    setDeletingQrId(qrId);
  };

  const confirmDeleteQr = () => {
    if (!deletingQrId) return;
    setQrs((prev) => prev.filter((q) => q.id !== deletingQrId));
    setDeletingQrId(null);
    showToast('Dynamic QR deleted.');
  };

  const handleSimulateScan = (qr: DynamicQR) => {
    const scanEvent = createScanEvent(qr);
    setScans((prev) => [scanEvent, ...prev]);
    setQrs((prev) =>
      prev.map((q) => {
        if (q.id === qr.id) {
          return { ...q, totalScans: (q.totalScans || 0) + 1 };
        }
        return q;
      })
    );
    showToast(`Simulated scan on "${qr.name}" from ${scanEvent.city}!`);
  };

  const handleLogScanFromRedirect = (
    scan: ScanRecord,
    qrId: string,
    syncedDestination?: string
  ) => {
    setScans((prev) => [scan, ...prev]);
    setQrs((prev) => {
      const exists = prev.some((q) => q.id === qrId || q.slug.toLowerCase() === scan.slug.toLowerCase());
      const next = exists
        ? prev.map((q) =>
            q.id === qrId || q.slug.toLowerCase() === scan.slug.toLowerCase()
              ? {
                  ...q,
                  destination: syncedDestination || q.destination,
                  totalScans: (q.totalScans || 0) + 1,
                }
              : q
          )
        : syncedDestination
        ? [
            {
              id: qrId,
              name: scan.slug,
              slug: scan.slug,
              folder: 'Default',
              destination: syncedDestination,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              totalScans: 1,
            },
            ...prev,
          ]
        : prev;
      try {
        localStorage.setItem(STORAGE_KEY_QRS, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleExportCsv = () => {
    const csvContent = exportQrsToCsv(qrs, settings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dynoqr-all-qrs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV export downloaded!');
  };

  const handleCreateFolder = (newFolderName: string) => {
    const clean = newFolderName.trim();
    if (!clean) return;
    setCustomFolders((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setSelectedFolder(clean);
    showToast(`Campaign folder "${clean}" ready!`);
  };

  const handleResetToDemo = () => {
    setQrs(getInitialDemoQrs());
    setScans(getInitialDemoScans());
    setCustomFolders([]);
    setSelectedFolder('all');
    showToast('Reset to demo dynamic QRs!');
  };

  // If hitting a redirect directly in browser (e.g. /r/reviews-kansas)
  if (redirectSlug) {
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
    return (
      <RedirectScreen
        slug={redirectSlug}
        targetOverride={redirectTargetOverride}
        qrs={qrs}
        settings={settings}
        onLogScan={handleLogScanFromRedirect}
        onBackToDashboard={() => {
          setRedirectSlug(null);
          setRedirectTargetOverride(null);
          if (window.history.pushState) {
            window.history.pushState('', '/', baseUrl);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <TopNav
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenGoogleBusiness={() => setIsGoogleBusinessOpen(true)}
        onOpenDeployment={() => setIsDeploymentOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportCsv={handleExportCsv}
        totalQrs={qrs.length}
      />

      {/* Main Spacious Scroll View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Horizontal Campaign Scroller */}
        <CampaignBar
          qrs={qrs}
          selectedFolder={selectedFolder}
          onSelectFolder={(f) => setSelectedFolder(f)}
          folders={folders}
          onCreateFolder={handleCreateFolder}
        />

        {/* Filter & Search Ribbon */}
        <div className="clay-card-flat p-3 sm:p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs bg-white border border-slate-200">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dynamic QRs by name, slug, folder, or target URL..."
              className="w-full clay-inset pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Status & View Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Status Pills */}
            <div className="flex items-center clay-inset p-1 text-xs bg-slate-100 border border-slate-200 rounded-full">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({qrs.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  statusFilter === 'inactive'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paused
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="clay-inset text-slate-700 bg-white border border-slate-200 px-3 py-1.5 text-xs focus:outline-none cursor-pointer rounded-xl font-medium"
            >
              <option value="recent">Recently Updated</option>
              <option value="scans">Most Scanned</option>
              <option value="name">Alphabetical</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center clay-inset p-1 bg-slate-100 border border-slate-200 rounded-full">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid Card View"
                aria-label="Grid Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic QR Cards Grid / Table */}
        {filteredQrs.length > 0 ? (
          viewMode === 'grid' ? (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredQrs.map((qr) => (
                  <motion.div
                    key={qr.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col"
                  >
                    <QrCard
                      qr={qr}
                      settings={settings}
                      onEditDestination={(q) => setEditingQr(q)}
                      onOpenAnalytics={(q) => setAnalyticsQr(q)}
                      onToggleActive={handleToggleActive}
                      onDuplicate={handleDuplicateQr}
                      onDelete={handleDeleteQr}
                      onSimulateScan={handleSimulateScan}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <QrTableView
              qrs={filteredQrs}
              settings={settings}
              onEditDestination={(q) => setEditingQr(q)}
              onOpenAnalytics={(q) => setAnalyticsQr(q)}
              onToggleActive={handleToggleActive}
              onDelete={handleDeleteQr}
              onSimulateScan={handleSimulateScan}
            />
          )
        ) : (
          /* Empty State */
          <div className="clay-card p-12 text-center space-y-4 bg-white border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Matching Dynamic QRs</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No dynamic codes matched your search or folder filter.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFolder('all');
                  setStatusFilter('all');
                  setIsCreateOpen(true);
                }}
                className="clay-button-primary px-5 py-2.5 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Dynamic QR</span>
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFolder('all');
                  setStatusFilter('all');
                  setIsGoogleBusinessOpen(true);
                }}
                className="clay-button-secondary px-4 py-2.5 text-xs font-bold text-blue-600 inline-flex items-center gap-1.5 cursor-pointer border border-blue-200 bg-blue-50/50 hover:bg-blue-100"
              >
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">G</span>
                <span>Generate Google Review QR</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Animated Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="app-toast"
            initial={{ opacity: 0, y: 20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-6 right-6 z-60 clay-modal border border-blue-200 text-slate-900 text-xs px-4 py-3 shadow-xl flex items-center gap-2.5 bg-white"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-1 p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Pop-up Modal */}
      <ModalPortal
        isOpen={Boolean(deletingQrId)}
        onClose={() => setDeletingQrId(null)}
        maxWidthClass="max-w-sm"
        ariaLabel="Confirm Delete Dynamic QR"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delete Dynamic QR?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-800">
                "{deletingQrTarget?.name || 'this QR'}"
              </span>{' '}
              (<code className="font-mono text-rose-600">/r/{deletingQrTarget?.slug}</code>)?
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeletingQrId(null)}
              className="clay-button-secondary px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteQr}
              className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete QR</span>
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Modals */}
      <CreateQrModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreateQr}
        existingQrs={qrs}
        folders={folders}
        settings={settings}
        defaultFolder={selectedFolder}
      />

      <GoogleBusinessModal
        isOpen={isGoogleBusinessOpen}
        onClose={() => setIsGoogleBusinessOpen(false)}
        onGenerateQr={handleCreateQr}
        existingQrs={qrs}
        folders={folders}
        defaultFolder={selectedFolder}
      />

      <EditDestinationModal
        qr={editingQr}
        isOpen={Boolean(editingQr)}
        onClose={() => setEditingQr(null)}
        existingQrs={qrs}
        settings={settings}
        onSave={handleSaveDestination}
      />

      <QrAnalyticsModal
        qr={liveAnalyticsQr}
        isOpen={Boolean(analyticsQr)}
        onClose={() => setAnalyticsQr(null)}
        scans={scans}
        settings={settings}
        onSimulateScan={handleSimulateScan}
        onToggleActive={handleToggleActive}
      />

      <DeploymentModal
        isOpen={isDeploymentOpen}
        onClose={() => setIsDeploymentOpen(false)}
        settings={settings}
        qrs={qrs}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(s) => {
          setSettings(s);
          showToast('Platform settings saved!');
        }}
        qrs={qrs}
        scans={scans}
        onImportData={(newQrs, newScans) => {
          setQrs(newQrs);
          setScans(newScans);
          showToast(`Imported ${newQrs.length} Dynamic QRs!`);
        }}
        onResetToDemo={handleResetToDemo}
        onOpenDeployment={() => {
          setIsSettingsOpen(false);
          setIsDeploymentOpen(true);
        }}
      />
    </div>
  );
}
