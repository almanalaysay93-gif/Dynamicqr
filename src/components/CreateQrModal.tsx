import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Globe,
  MessageSquare,
  Instagram,
  FileText,
  Star,
  UtensilsCrossed,
  ShoppingBag,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  MapPin,
  Building2,
  ExternalLink,
} from 'lucide-react';
import {
  DynamicQR,
  PlatformSettings,
  CenterLogoPreset,
  generateSlug,
  validateSlug,
  normalizeDestinationUrl,
  buildShortLink,
  buildGoogleReviewUrl,
  extractPlaceIdFromGoogleUrl,
} from '../utils/qrLogic';
import { generateQrDataUrl } from '../utils/qrRenderer';
import { ModalPortal } from './ModalPortal';

interface CreateQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newQr: DynamicQR) => void;
  existingQrs: DynamicQR[];
  folders: string[];
  settings: PlatformSettings;
  defaultFolder?: string;
}

export const CreateQrModal: React.FC<CreateQrModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  existingQrs,
  folders,
  settings,
  defaultFolder,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [folder, setFolder] = useState(folders[0] || 'Default');
  const [isCustomFolder, setIsCustomFolder] = useState(false);
  const [customFolderInput, setCustomFolderInput] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

  // Center logo options
  const [logoType, setLogoType] = useState<CenterLogoPreset>('google');
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  // Google Business Profile Review Generator helper state
  const [showGoogleReviewHelper, setShowGoogleReviewHelper] = useState(false);
  const [gbpBusinessName, setGbpBusinessName] = useState('');
  const [gbpAddress, setGbpAddress] = useState('');
  const [gbpPlaceId, setGbpPlaceId] = useState('');

  // Custom styling
  const [fgColor, setFgColor] = useState('#0F172A');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [correctionLevel, setCorrectionLevel] = useState<'M' | 'Q' | 'H'>('H');

  // Preview & errors
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync default folder when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      const preferred =
        defaultFolder && defaultFolder !== 'all'
          ? defaultFolder
          : folders[0] || settings.defaultFolder || 'Default';
      setFolder(preferred);
    }
  }, [isOpen, defaultFolder, folders, settings.defaultFolder]);

  // Auto-generate slug when name changes unless user modified it
  useEffect(() => {
    if (!slugManuallyEdited && name.trim()) {
      const generated = generateSlug(
        name,
        existingQrs.map((q) => q.slug)
      );
      setSlug(generated);
    } else if (!slugManuallyEdited && !name.trim()) {
      setSlug('');
    }
  }, [name, slugManuallyEdited, existingQrs]);

  // Live QR preview generation
  const candidateSlug = slug.trim() || 'preview-slug';
  const candidateShortLink = buildShortLink(
    candidateSlug,
    settings,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    generateQrDataUrl(candidateShortLink, {
      width: 240,
      margin: 1,
      fgColor,
      bgColor,
      errorCorrectionLevel: correctionLevel,
      centerLogo: {
        type: logoType,
        customUrl: logoType === 'custom' ? customLogoUrl : undefined,
      },
    }).then((url) => {
      if (active) setPreviewDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [isOpen, candidateShortLink, fgColor, bgColor, correctionLevel, logoType, customLogoUrl]);

  const resetForm = () => {
    setName('');
    setSlug('');
    setSlugManuallyEdited(false);
    setIsCustomFolder(false);
    setCustomFolderInput('');
    setDestination('');
    setNotes('');
    setLogoType('google');
    setCustomLogoUrl('');
    setShowGoogleReviewHelper(false);
    setGbpBusinessName('');
    setGbpAddress('');
    setGbpPlaceId('');
    setError(null);
  };

  const handleSlugChange = (val: string) => {
    setSlugManuallyEdited(true);
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(clean);
  };

  const handlePresetSelect = (presetType: string) => {
    if (presetType === 'review') {
      setShowGoogleReviewHelper(!showGoogleReviewHelper);
      setLogoType('google');
      if (!name) setName('Google Reviews Table Stand');
      if (!gbpBusinessName && name && name !== 'Google Reviews Table Stand') {
        setGbpBusinessName(name);
      }
      if (!destination) {
        setDestination(buildGoogleReviewUrl({
          businessName: gbpBusinessName || name || 'My Business',
          address: gbpAddress,
          placeId: gbpPlaceId,
        }));
      }
    } else if (presetType === 'instagram') {
      setShowGoogleReviewHelper(false);
      setDestination('https://instagram.com/mybusiness');
      setLogoType('instagram');
      if (!name) setName('Official Instagram');
    } else if (presetType === 'whatsapp') {
      setShowGoogleReviewHelper(false);
      setDestination('https://wa.me/15551234567?text=Hello%20I%20have%20an%20inquiry');
      setLogoType('whatsapp');
      if (!name) setName('WhatsApp VIP Concierge');
    } else if (presetType === 'menu') {
      setShowGoogleReviewHelper(false);
      setDestination('https://myrestaurant.com/menu.pdf');
      setLogoType('restaurant');
      if (!name) setName('Table Digital Menu');
    }
  };

  const handleApplyGoogleReviewLink = () => {
    const bName = gbpBusinessName.trim() || name.trim() || 'My Business';
    const bAddress = gbpAddress.trim();
    const pid = extractPlaceIdFromGoogleUrl(gbpPlaceId) || gbpPlaceId.trim();

    const reviewUrl = buildGoogleReviewUrl({
      businessName: bName,
      address: bAddress,
      placeId: pid,
    });

    setDestination(reviewUrl);
    setLogoType('google');

    if (bName && (!name || name === 'Google Reviews Table Stand')) {
      setName(`${bName} - Google Reviews`);
    }

    if (bAddress && !notes) {
      setNotes(`Location: ${bAddress}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomLogoUrl(reader.result);
          setLogoType('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a name for this dynamic QR code');
      return;
    }

    const finalSlug = slug.trim() || generateSlug(name, existingQrs.map((q) => q.slug));
    const slugCheck = validateSlug(finalSlug);
    if (!slugCheck.valid) {
      setError(slugCheck.error || 'Invalid slug format');
      return;
    }

    // Check collision
    const collision = existingQrs.find(
      (q) => q.slug.toLowerCase() === finalSlug.toLowerCase()
    );
    if (collision) {
      setError(`Slug "/r/${finalSlug}" is already in use by "${collision.name}". Please choose another.`);
      return;
    }

    const destCheck = normalizeDestinationUrl(destination);
    if (!destCheck.valid) {
      setError(destCheck.error || 'Please provide a valid destination URL');
      return;
    }

    const finalFolder = isCustomFolder ? (customFolderInput.trim() || 'General') : folder;

    const newQr: DynamicQR = {
      id: `qr-${Date.now()}`,
      name: name.trim(),
      slug: finalSlug,
      folder: finalFolder,
      destination: destCheck.url,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalScans: 0,
      notes: notes.trim(),
      styling: {
        fgColor,
        bgColor,
        correctionLevel: logoType !== 'none' ? 'H' : correctionLevel,
        centerLogo: {
          type: logoType,
          customUrl: logoType === 'custom' ? customLogoUrl : undefined,
        },
      },
    };

    onCreated(newQr);
    resetForm();
    onClose();
  };

  return (
    <ModalPortal
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      ariaLabel="Create Dynamic QR Code"
    >
      <div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Create Dynamic QR Code</h2>
              <p className="text-xs text-slate-500">
                Short link: <code className="text-blue-600 font-mono font-semibold">/r/{slug || '...'}</code> · Destination remains editable forever
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="clay-button-secondary p-2 text-slate-400 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form Fields (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* QR Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  QR Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kansas - Google Reviews or Palermo Gelato"
                  className="w-full clay-inset px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              {/* Custom Slug */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Custom Redirect Slug <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Permanent short URL
                  </span>
                </div>
                <div className="flex items-center clay-inset overflow-hidden">
                  <span className="bg-slate-200/70 text-slate-600 px-3.5 py-2.5 text-xs font-mono font-semibold select-none border-r border-slate-300">
                    /r/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="reviews-kansas"
                    className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-blue-600 font-semibold placeholder-slate-400 focus:outline-none"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Fixed encoded URL. You will never need to reprint this physical QR code.
                </p>
              </div>

              {/* Campaign / Folder */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Campaign / Folder
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomFolder(!isCustomFolder)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    {isCustomFolder ? 'Select Existing' : '+ New Folder'}
                  </button>
                </div>

                {isCustomFolder ? (
                  <input
                    type="text"
                    value={customFolderInput}
                    onChange={(e) => setCustomFolderInput(e.target.value)}
                    placeholder="e.g. Client: Lucciano's"
                    className="w-full clay-inset px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <select
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    className="w-full clay-inset px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {folders.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Final Destination URL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Final Destination URL <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Editable anytime
                  </span>
                </div>
                
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('review')}
                    className={`px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 rounded-full transition-all cursor-pointer ${
                      showGoogleReviewHelper
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'clay-button-secondary hover:border-blue-300'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${showGoogleReviewHelper ? 'fill-amber-300 text-amber-300' : 'text-amber-500'}`} />
                    <span>Google Review Builder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('instagram')}
                    className="clay-button-secondary px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 hover:border-blue-300 cursor-pointer"
                  >
                    <Instagram className="w-3 h-3 text-blue-600" />
                    <span>Instagram</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('whatsapp')}
                    className="clay-button-secondary px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 hover:border-blue-300 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect('menu')}
                    className="clay-button-secondary px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 hover:border-blue-300 cursor-pointer"
                  >
                    <UtensilsCrossed className="w-3 h-3 text-blue-600" />
                    <span>Menu</span>
                  </button>
                </div>

                {/* Google Business Review Link Builder Helper */}
                {showGoogleReviewHelper && (
                  <div className="p-3.5 mb-2.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-900 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Google Business Profile Details</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGoogleReviewHelper(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
                      >
                        Hide
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Business Name
                        </label>
                        <div className="relative">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={gbpBusinessName}
                            onChange={(e) => setGbpBusinessName(e.target.value)}
                            placeholder="e.g. Kansas Diner"
                            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Physical Address / City
                        </label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={gbpAddress}
                            onChange={(e) => setGbpAddress(e.target.value)}
                            placeholder="e.g. 123 Main St, Kansas City"
                            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                        Place ID or Google Maps Link (Optional)
                      </label>
                      <input
                        type="text"
                        value={gbpPlaceId}
                        onChange={(e) => setGbpPlaceId(e.target.value)}
                        placeholder="Paste Google Place ID (ChIJ...) or Maps URL"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleApplyGoogleReviewLink}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate & Apply Google Review Link</span>
                      </button>

                      {destination.includes('google') && (
                        <a
                          href={destination}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Test Review URL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="https://maps.google.com/?q=... or https://..."
                  className="w-full clay-inset px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Placement Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Table stands 1-15, acrylic counter display"
                  className="w-full clay-inset px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

            </div>

            {/* Right Column: Center Logo Option & Live QR Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between clay-card-flat p-4 bg-slate-50/70 border border-slate-200">
              
              <div>
                {/* Center Logo Option */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Center Logo Badge
                    </label>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      Auto High-ECC
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                    {[
                      { id: 'none', label: 'None', icon: null },
                      { id: 'google', label: 'Google', icon: Star },
                      { id: 'instagram', label: 'Insta', icon: Instagram },
                      { id: 'whatsapp', label: 'Chat', icon: MessageSquare },
                      { id: 'star', label: 'Star', icon: Star },
                      { id: 'restaurant', label: 'Food', icon: UtensilsCrossed },
                      { id: 'shop', label: 'Shop', icon: ShoppingBag },
                      { id: 'custom', label: 'Custom', icon: ImageIcon },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLogoType(item.id as CenterLogoPreset)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                          logoType === item.id
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {item.icon ? (
                          <item.icon className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[10px] uppercase font-bold">∅</span>
                        )}
                        <span className="text-[10px] leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom Logo Upload / URL */}
                  {logoType === 'custom' && (
                    <div className="space-y-2 p-2.5 bg-white rounded-xl border border-blue-200 shadow-xs mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customLogoUrl}
                          onChange={(e) => setCustomLogoUrl(e.target.value)}
                          placeholder="Image URL (https://...)"
                          className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <label className="clay-button-secondary px-2 py-1 text-xs font-semibold cursor-pointer flex items-center gap-1 shrink-0 text-slate-700">
                          <Upload className="w-3 h-3 text-blue-600" />
                          <span>File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Square PNG/SVG works best. Badge background remains white for clean scanning.
                      </p>
                    </div>
                  )}
                </div>

                {/* Live Preview Display */}
                <div className="text-center w-full">
                  <div className="clay-inset p-3 rounded-2xl inline-block bg-white shadow-xs">
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt="Live Dynamic QR Preview"
                        className="w-36 h-36 object-contain mx-auto bg-white p-1 rounded-xl shadow-xs"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-slate-100 animate-pulse rounded-xl" />
                    )}
                  </div>

                  <div className="mt-2 text-xs font-mono text-blue-600 font-semibold break-all select-all max-w-[200px] mx-auto bg-blue-50/70 border border-blue-100 py-1 px-2 rounded-lg">
                    /r/{candidateSlug}
                  </div>
                </div>
              </div>

              {/* Error correction information */}
              <div className="w-full pt-3 mt-3 border-t border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">QR Reliability:</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Level H (30% Damage Tolerance)
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="clay-button-secondary px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="clay-button-primary px-6 py-2.5 text-xs font-bold text-white flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Dynamic QR Code</span>
            </button>
          </div>

        </form>

      </div>
    </ModalPortal>
  );
};
