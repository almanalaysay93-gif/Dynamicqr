import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  Building2,
  ExternalLink,
  Sparkles,
  Check,
  Copy,
  Search,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  DynamicQR,
  generateSlug,
  buildGoogleReviewUrl,
  extractPlaceIdFromGoogleUrl,
} from '../utils/qrLogic';
import { ModalPortal } from './ModalPortal';

interface GoogleBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateQr: (newQr: DynamicQR) => void;
  existingQrs: DynamicQR[];
  folders: string[];
  defaultFolder?: string;
}

export const GoogleBusinessModal: React.FC<GoogleBusinessModalProps> = ({
  isOpen,
  onClose,
  onGenerateQr,
  existingQrs,
  folders,
  defaultFolder,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [placeIdOrUrl, setPlaceIdOrUrl] = useState('');
  const [folder, setFolder] = useState(folders[0] || 'Google Reviews');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const preferred =
        defaultFolder && defaultFolder !== 'all'
          ? defaultFolder
          : folders[0] || 'Google Reviews';
      setFolder(preferred);
    }
  }, [isOpen, defaultFolder, folders]);

  // Extracted Place ID if present
  const detectedPlaceId = extractPlaceIdFromGoogleUrl(placeIdOrUrl) || '';

  // Generate real Google Review link
  const generatedReviewUrl = buildGoogleReviewUrl({
    businessName,
    address,
    placeId: detectedPlaceId || placeIdOrUrl.trim(),
  });

  const previewSlug = generateSlug(
    `reviews-${businessName.trim() || 'my-business'}`,
    existingQrs.map((q) => q.slug)
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedReviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    const qrName = `${businessName.trim()} - Google Reviews`;
    const newQr: DynamicQR = {
      id: `qr-${Date.now()}`,
      name: qrName,
      slug: previewSlug,
      folder: folder || 'Google Reviews',
      destination: generatedReviewUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalScans: 0,
      notes: address.trim() ? `Location: ${address.trim()}` : 'Google Business Profile Review Link',
      styling: {
        fgColor: '#0F172A',
        bgColor: '#FFFFFF',
        correctionLevel: 'H',
        centerLogo: { type: 'google' },
      },
    };

    onGenerateQr(newQr);
    setBusinessName('');
    setAddress('');
    setPlaceIdOrUrl('');
    setCopied(false);
    onClose();
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-xl"
      ariaLabel="Google Business Profile Review Generator"
    >
      <div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Google Business Profile Review Generator
              </h2>
              <p className="text-xs text-slate-500">
                Enter your business name & address to build a direct Google Review link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="clay-button-secondary p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreateQr} className="p-6 space-y-5">
          
          {/* Business Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Business / Store Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Kansas Diner or Lucciano's Gelato"
                className="w-full clay-inset pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
          </div>

          {/* Business Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Physical Address / Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St, Kansas City, MO or Davao City, Philippines"
                className="w-full clay-inset pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Helps Google Maps pin directly to your exact storefront or branch.
            </p>
          </div>

          {/* Optional Place ID or Google Link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Google Place ID or Maps Share Link (Optional)
              </label>
              <span className="text-[11px] text-blue-600 font-medium">
                For 1-click 5-star pop-up
              </span>
            </div>
            <input
              type="text"
              value={placeIdOrUrl}
              onChange={(e) => setPlaceIdOrUrl(e.target.value)}
              placeholder="Paste Google Place ID (e.g. ChIJ...) or full Google Maps URL"
              className="w-full clay-inset px-4 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-slate-50 border border-slate-200 rounded-xl"
            />
            {detectedPlaceId && (
              <p className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Detected Google Place ID: <code className="font-mono">{detectedPlaceId}</code>
              </p>
            )}
          </div>

          {/* Campaign Folder */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Save under Campaign Folder
            </label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. Client: Kansas Diner or Google Reviews"
              className="w-full clay-inset px-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Live Generated Review Link Card */}
          <div className="clay-card-flat p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Generated Google Business Review URL</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-600 rounded-lg text-[11px] font-bold border border-blue-200 flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy URL'}</span>
                </button>
                <a
                  href={generatedReviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-blue-200 font-mono text-xs text-blue-700 break-all select-all">
              {generatedReviewUrl}
            </div>

            <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Your dynamic QR will encode <code className="text-blue-700 font-mono font-bold">/r/{previewSlug}</code> and forward customers straight to this review URL with the Google logo badge in the center!
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="clay-button-secondary px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!businessName.trim()}
              className={`clay-button-primary px-6 py-2.5 text-xs font-bold text-white flex items-center gap-2 cursor-pointer ${
                !businessName.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
              <span>Generate Dynamic Google Review QR</span>
            </button>
          </div>

        </form>

      </div>
    </ModalPortal>
  );
};
