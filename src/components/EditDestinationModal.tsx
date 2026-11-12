import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Star,
  Instagram,
  MessageSquare,
  UtensilsCrossed,
  ShoppingBag,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import {
  DynamicQR,
  PlatformSettings,
  CenterLogoPreset,
  CenterLogoConfig,
  normalizeDestinationUrl,
  generateSlug,
  validateSlug,
  formatShortLinkDisplay,
  normalizeSlugInput,
} from '../utils/qrLogic';
import { ModalPortal } from './ModalPortal';

interface EditDestinationModalProps {
  qr: DynamicQR | null;
  isOpen: boolean;
  onClose: () => void;
  existingQrs?: DynamicQR[];
  settings?: PlatformSettings;
  onSave: (
    qrId: string,
    newDestination: string,
    newName?: string,
    newLogo?: CenterLogoConfig,
    newSlug?: string
  ) => void;
}

export const EditDestinationModal: React.FC<EditDestinationModalProps> = ({
  qr,
  isOpen,
  onClose,
  existingQrs = [],
  settings,
  onSave,
}) => {
  const lastQrRef = useRef<DynamicQR | null>(qr);
  if (qr) {
    lastQrRef.current = qr;
  }
  const activeQr = qr || lastQrRef.current;

  const [destination, setDestination] = useState(activeQr?.destination || '');
  const [name, setName] = useState(activeQr?.name || '');
  const [slug, setSlug] = useState(activeQr?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [logoType, setLogoType] = useState<CenterLogoPreset>(activeQr?.styling?.centerLogo?.type || 'none');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(activeQr?.styling?.centerLogo?.customUrl || '');
  const [error, setError] = useState<string | null>(null);

  const otherSlugs = existingQrs
    .filter((q) => q.id !== activeQr?.id)
    .map((q) => q.slug);

  useEffect(() => {
    if (qr) {
      setDestination(qr.destination);
      setName(qr.name);
      setSlug(qr.slug);
      setSlugManuallyEdited(false);
      setLogoType(qr.styling?.centerLogo?.type || 'none');
      setCustomLogoUrl(qr.styling?.centerLogo?.customUrl || '');
      setError(null);
    }
  }, [qr]);

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (!slugManuallyEdited && activeQr) {
      if (newName.trim() && newName.trim() !== activeQr.name) {
        setSlug(generateSlug(newName, otherSlugs));
      } else if (newName.trim() === activeQr.name) {
        setSlug(activeQr.slug);
      }
    }
  };

  const handleSlugInputChange = (rawVal: string) => {
    setSlugManuallyEdited(true);
    setSlug(normalizeSlugInput(rawVal));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQr) return;
    setError(null);

    const finalSlug = slug.trim().replace(/-+$/g, '') || generateSlug(name || activeQr.name, otherSlugs);
    const slugCheck = validateSlug(finalSlug);
    if (!slugCheck.valid) {
      setError(slugCheck.error || 'Please enter a valid short link slug');
      return;
    }

    const collision = existingQrs.find(
      (q) => q.id !== activeQr.id && q.slug.toLowerCase() === finalSlug.toLowerCase()
    );
    if (collision) {
      setError(`Short link "/r/${finalSlug}" is already in use by "${collision.name}".`);
      return;
    }

    const check = normalizeDestinationUrl(destination);
    if (!check.valid) {
      setError(check.error || 'Please enter a valid destination URL');
      return;
    }

    const updatedLogo: CenterLogoConfig = {
      type: logoType,
      customUrl: logoType === 'custom' ? customLogoUrl : undefined,
    };

    onSave(activeQr.id, check.url, name.trim() || activeQr.name, updatedLogo, finalSlug);
    onClose();
  };

  const handleQuickSwap = (newUrl: string, sampleLabel: string, sampleLogo: CenterLogoPreset) => {
    setDestination(newUrl);
    setName(sampleLabel);
    setLogoType(sampleLogo);
    setSlugManuallyEdited(false);
    setSlug(generateSlug(sampleLabel, otherSlugs));
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

  return (
    <ModalPortal
      isOpen={isOpen && Boolean(activeQr)}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      ariaLabel="Edit Dynamic Target"
    >
      {activeQr && (
        <div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Edit Short Link & Destination</h2>
            <p className="text-xs text-blue-600 font-mono font-semibold mt-0.5">
              Short Link: {formatShortLinkDisplay(slug || activeQr.slug, settings)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="clay-button-secondary p-2 text-slate-400 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Key Guarantee Banner */}
          <div className="clay-card-flat p-4 flex items-start gap-3 text-xs border border-blue-200 bg-blue-50/70 text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-950 block mb-0.5">
                Physical Printed QR Never Changes!
              </span>
              No reprinting needed. Anyone scanning your physical stickers or acrylic tabletop stands will immediately be routed to this new destination.
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Swaps */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quick Test Swaps (as seen in demo):
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickSwap(
                    'https://instagram.com/luccianos_palermo_soho',
                    "Lucciano's Palermo Soho",
                    'instagram'
                  )
                }
                className="clay-button-secondary text-[11px] px-3 py-1.5 text-blue-600 font-semibold hover:border-blue-300"
              >
                Switch to Lucciano's Palermo
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickSwap(
                    'https://maps.google.com/?q=Kansas+Diner+Reviews',
                    'Kansas - Google Reviews',
                    'google'
                  )
                }
                className="clay-button-secondary text-[11px] px-3 py-1.5 text-slate-700 font-semibold hover:border-blue-300"
              >
                Switch to Kansas Reviews
              </button>
            </div>
          </div>

          {/* QR Display Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              QR Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full clay-inset px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Short Link Slug */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Short Link (/r/slug) <span className="text-rose-500">*</span>
              </label>
              {name.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setSlugManuallyEdited(true);
                    setSlug(generateSlug(name, otherSlugs));
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Auto-sync from Name
                </button>
              )}
            </div>
            <div className="flex items-center clay-inset overflow-hidden">
              <span className="bg-slate-200/70 text-slate-600 px-3.5 py-2.5 text-xs font-mono font-semibold select-none border-r border-slate-300">
                {settings?.useCustomDomain && settings.customDomain.trim()
                  ? `${settings.customDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')}/r/`
                  : '/r/'}
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugInputChange(e.target.value)}
                placeholder="custom-short-link"
                aria-label="Short Link Slug"
                className="flex-1 bg-transparent px-3 py-2 text-xs font-mono text-blue-600 font-bold placeholder-slate-400 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* New Destination */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              New Destination URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="https://..."
              className="w-full clay-inset px-4 py-2.5 text-xs font-mono text-blue-700 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Center Logo Option */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Center Logo Badge
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
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
                  className={`px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    logoType === item.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {item.icon && <item.icon className="w-3 h-3" />}
                  <span className="text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>

            {logoType === 'custom' && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={customLogoUrl}
                  onChange={(e) => setCustomLogoUrl(e.target.value)}
                  placeholder="Paste Logo Image URL"
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none"
                />
                <label className="clay-button-secondary px-2.5 py-1 text-xs font-semibold cursor-pointer flex items-center gap-1 text-slate-700">
                  <Upload className="w-3 h-3 text-blue-600" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Current vs New comparison */}
          <div className="clay-inset p-3 text-xs space-y-1.5">
            {slug && slug !== activeQr.slug && (
              <div className="flex items-center gap-1.5 truncate font-mono pb-1 border-b border-slate-200/80">
                <span className="font-sans font-semibold text-slate-400">Short Link:</span>
                <span className="line-through text-slate-400">/r/{activeQr.slug}</span>
                <ArrowRight className="w-3 h-3 shrink-0 text-blue-600" />
                <span className="text-blue-600 font-bold">/r/{slug}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 truncate text-slate-500">
              <span className="font-semibold text-slate-400">Previous:</span>
              <span className="truncate line-through text-slate-500">{activeQr.destination}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate text-blue-700 font-semibold">
              <ArrowRight className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span className="truncate">{destination || 'Enter URL above'}</span>
            </div>
          </div>

          {/* Footer Actions */}
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
              className="clay-button-primary px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Update Destination Instantly</span>
            </button>
          </div>

        </form>
        </div>
      )}
    </ModalPortal>
  );
};
