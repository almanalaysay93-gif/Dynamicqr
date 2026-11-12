export interface ScanRecord {
  id: string;
  qrId: string;
  slug: string;
  timestamp: string; // ISO string
  device: 'Mobile' | 'Desktop' | 'Tablet';
  os: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux';
  browser: 'Safari' | 'Chrome' | 'Firefox' | 'Edge' | 'Camera Scan';
  city: string;
  country: string;
  countryCode: string;
  referrer: string;
  destinationForwarded: string;
}

export type CenterLogoPreset =
  | 'none'
  | 'google'
  | 'instagram'
  | 'whatsapp'
  | 'star'
  | 'restaurant'
  | 'shop'
  | 'custom';

export interface CenterLogoConfig {
  type: CenterLogoPreset;
  customUrl?: string; // image URL or base64 data URL
  bgColor?: string; // background badge fill, defaults to #FFFFFF
}

export interface DynamicQR {
  id: string;
  name: string;
  slug: string;
  previousSlugs?: string[]; // Retains prior slugs when short link is changed so old links still redirect
  folder: string; // e.g. "Restaurant A", "Shop 1", "Client: Lucciano's"
  destination: string; // Final destination URL
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  totalScans: number;
  notes?: string;
  tags?: string[];
  styling?: {
    fgColor: string;
    bgColor: string;
    correctionLevel: 'L' | 'M' | 'Q' | 'H';
    centerLogo?: CenterLogoConfig;
    includeLogoText?: string;
  };
}

export interface PlatformSettings {
  customDomain: string; // e.g. "go.link" or "mydomain.com" or empty to use window.location.host
  useCustomDomain: boolean;
  defaultFolder: string;
  autoLogSimulations: boolean;
  redirectDelayMs: number; // 0 for instant, 800 for smooth interstitial redirect
}

/**
 * Normalizes input name into a URL-friendly slug, ensuring uniqueness.
 */
export function generateSlug(name: string, existingSlugs: string[] = []): string {
  let base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!base || base.length < 2) {
    const randomHex = Math.random().toString(36).substring(2, 7);
    base = `qr-${randomHex}`;
  }

  // Ensure uniqueness
  const set = new Set(existingSlugs.map((s) => s.toLowerCase()));
  if (!set.has(base)) {
    return base;
  }

  let counter = 2;
  while (set.has(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

/**
 * Validates slug format: only lowercase alphanumeric and hyphens, 2-60 chars
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  const clean = slug.trim().toLowerCase();
  if (clean.length < 2) {
    return { valid: false, error: 'Slug must be at least 2 characters long' };
  }
  if (clean.length > 64) {
    return { valid: false, error: 'Slug must be 64 characters or fewer' };
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) {
    return {
      valid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens)',
    };
  }
  return { valid: true };
}

/**
 * Validates and normalizes target destination URL.
 * Automatically adds https:// if missing, supports standard URLs, wa.me, mailto:, tel:
 */
export function normalizeDestinationUrl(rawUrl: string): { valid: boolean; url: string; error?: string } {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, url: '', error: 'Destination URL is required' };
  }

  // Handle special schemes
  if (
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('sms:')
  ) {
    return { valid: true, url: trimmed };
  }

  let target = trimmed;
  // If wa.me or whatsapp link without scheme
  if (/^wa\.me\//i.test(target)) {
    target = `https://${target}`;
  } else if (!/^https?:\/\//i.test(target)) {
    target = `https://${target}`;
  }

  try {
    const parsed = new URL(target);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, url: '', error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, url: '', error: 'Please enter a valid web URL' };
  }
}

export interface GoogleBusinessProfileInput {
  businessName: string;
  address?: string;
  placeId?: string;
}

/**
 * Builds an authentic Google Business Profile review destination URL.
 * If a Place ID is provided, directs straight to Google's "Write a Review" dialog.
 * If business name & address are provided, builds a Google Maps place query link.
 */
export function buildGoogleReviewUrl(input: GoogleBusinessProfileInput): string {
  const name = (input.businessName || '').trim();
  const address = (input.address || '').trim();
  const placeId = (input.placeId || '').trim();

  // If user provided a Place ID: direct write-review prompt
  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
  }

  // If business name and/or address provided:
  const queryParts = [name, address].filter(Boolean).join(', ');
  if (!queryParts) {
    return 'https://maps.google.com';
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts)}`;
}

/**
 * Extracts Google Place ID from various Google Maps URLs or direct Place ID strings
 */
export function extractPlaceIdFromGoogleUrl(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Direct Place ID (e.g. ChIJN1t_tDeuEmsRUsoyG83frY4)
  if (/^ChIJ[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const pid = parsed.searchParams.get('placeid') || parsed.searchParams.get('query_place_id');
    if (pid && pid.startsWith('ChIJ')) {
      return pid;
    }

    const match = trimmed.match(/!1s(ChIJ[a-zA-Z0-9_-]{20,})/);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    // Not a URL
  }

  return null;
}


/**
 * Builds the full short link URL for a dynamic QR code
 */
export function buildShortLink(
  slug: string,
  settings: PlatformSettings,
  currentOrigin: string = 'http://localhost:3000'
): string {
  if (settings.useCustomDomain && settings.customDomain.trim()) {
    const domain = settings.customDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `https://${domain}/r/${slug}`;
  }
  const originClean = currentOrigin.replace(/\/+$/, '');
  return `${originClean}/r/${slug}`;
}

/**
 * Formats the short link label for pills and tables, reflecting custom domain when enabled
 */
export function formatShortLinkDisplay(slug: string, settings?: PlatformSettings): string {
  if (settings?.useCustomDomain && settings.customDomain.trim()) {
    const domain = settings.customDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `${domain}/r/${slug}`;
  }
  return `/r/${slug}`;
}

/**
 * Extracts and normalizes a clean slug from raw user input (handles "/r/my-slug", full URLs, or plain text)
 */
export function normalizeSlugInput(raw: string): string {
  let val = raw.trim().toLowerCase();
  const rMatch = val.match(/\/r\/([a-z0-9_-]*)/i);
  if (rMatch && rMatch[1] !== undefined) {
    val = rMatch[1];
  } else {
    val = val.replace(/^https?:\/\/[^/]+\/?/i, '').replace(/^\/+|\/+$/g, '');
  }
  return val
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '');
}

/**
 * Filters and searches QRs
 */
export function filterQrs(
  qrs: DynamicQR[],
  filters: {
    folder?: string;
    status?: 'all' | 'active' | 'inactive';
    search?: string;
  }
): DynamicQR[] {
  return qrs.filter((qr) => {
    // Folder filter
    if (filters.folder && filters.folder !== 'all' && qr.folder !== filters.folder) {
      return false;
    }

    // Status filter
    if (filters.status === 'active' && !qr.isActive) return false;
    if (filters.status === 'inactive' && qr.isActive) return false;

    // Search term
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matchName = qr.name.toLowerCase().includes(q);
      const matchSlug = qr.slug.toLowerCase().includes(q);
      const matchDest = qr.destination.toLowerCase().includes(q);
      const matchFolder = qr.folder.toLowerCase().includes(q);
      if (!matchName && !matchSlug && !matchDest && !matchFolder) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculates aggregated analytics and KPIs
 */
export function calculateStats(qrs: DynamicQR[], scans: ScanRecord[]) {
  const totalQrs = qrs.length;
  const activeQrs = qrs.filter((q) => q.isActive).length;
  const totalScans = qrs.reduce((acc, q) => acc + (q.totalScans || 0), 0);

  // Today's scans
  const todayStr = new Date().toISOString().slice(0, 10);
  const scansToday = scans.filter((s) => s.timestamp.slice(0, 10) === todayStr).length;

  // Top performing QR
  const topQr = [...qrs].sort((a, b) => b.totalScans - a.totalScans)[0] || null;

  // Device breakdown
  const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
  scans.forEach((s) => {
    deviceCounts[s.device] = (deviceCounts[s.device] || 0) + 1;
  });

  return {
    totalQrs,
    activeQrs,
    inactiveQrs: totalQrs - activeQrs,
    totalScans,
    scansToday,
    topQr,
    deviceCounts,
  };
}

/**
 * Generates sample initial QRs as requested in user prompt
 * (e.g. "Kansas - Google Reviews", "Lucciano's Palermo Soho", "Restaurant Davao Menu", "Shop 1 Promo")
 */
export function getInitialDemoQrs(): DynamicQR[] {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();

  return [
    {
      id: 'qr-1',
      name: 'Kansas - Google Reviews',
      slug: 'reviews-kansas',
      folder: 'Client: Kansas Diner',
      destination: 'https://maps.google.com/?q=Kansas+Diner+Reviews',
      isActive: true,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(2),
      totalScans: 482,
      notes: 'Printed on tabletop stands and receipt footers',
      styling: {
        fgColor: '#0F172A',
        bgColor: '#FFFFFF',
        correctionLevel: 'H',
        centerLogo: { type: 'google' },
      },
    },
    {
      id: 'qr-2',
      name: "Lucciano's Palermo Soho - Gelato Menu",
      slug: 'luccianos-palermo',
      folder: "Client: Lucciano's",
      destination: 'https://instagram.com/luccianos_palermo_menu',
      isActive: true,
      createdAt: daysAgo(9),
      updatedAt: daysAgo(1),
      totalScans: 819,
      notes: "Main store entrance & counter card. Switched destination from old PDF to live Instagram menu without reprinting!",
      styling: {
        fgColor: '#0F172A',
        bgColor: '#FFFFFF',
        correctionLevel: 'H',
        centerLogo: { type: 'instagram' },
      },
    },
    {
      id: 'qr-3',
      name: 'Menu Davao - Seafront Branch',
      slug: 'menu-davao',
      folder: 'Restaurant Davao',
      destination: 'https://restaurant-davao.com/digital-menu-2026',
      isActive: true,
      createdAt: daysAgo(21),
      updatedAt: daysAgo(5),
      totalScans: 1240,
      notes: 'Laminated acrylic holders on 30 outdoor tables',
      styling: {
        fgColor: '#0F172A',
        bgColor: '#FFFFFF',
        correctionLevel: 'H',
        centerLogo: { type: 'restaurant' },
      },
    },
    {
      id: 'qr-4',
      name: 'May Promo Special VIP 20%',
      slug: 'promo-may',
      folder: 'Shop 1 Promotions',
      destination: 'https://shop1-boutique.com/spring-sale-vip-access',
      isActive: true,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
      totalScans: 195,
      notes: 'Window poster & flyer campaign',
      styling: {
        fgColor: '#0F172A',
        bgColor: '#FFFFFF',
        correctionLevel: 'H',
        centerLogo: { type: 'shop' },
      },
    },
    {
      id: 'qr-5',
      name: 'VIP Concierge WhatsApp Chat',
      slug: 'vip-whatsapp',
      folder: 'Shop 1 Promotions',
      destination: 'https://wa.me/15550198273?text=Hi%20I%20would%20like%20to%20reserve',
      isActive: false,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(12),
      totalScans: 88,
      notes: 'Paused between campaign flights',
      styling: {
        fgColor: '#0F172A',
        bgColor: '#FFFFFF',
        correctionLevel: 'H',
        centerLogo: { type: 'whatsapp' },
      },
    },
  ];
}

/**
 * Creates seed scan analytics records for demo items
 */
export function getInitialDemoScans(): ScanRecord[] {
  const cities = [
    { city: 'Kansas City', country: 'United States', countryCode: 'US' },
    { city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR' },
    { city: 'Davao City', country: 'Philippines', countryCode: 'PH' },
    { city: 'Manila', country: 'Philippines', countryCode: 'PH' },
    { city: 'New York', country: 'United States', countryCode: 'US' },
    { city: 'Cordoba', country: 'Argentina', countryCode: 'AR' },
    { city: 'Miami', country: 'United States', countryCode: 'US' },
  ];

  const devices: Array<'Mobile' | 'Desktop' | 'Tablet'> = ['Mobile', 'Mobile', 'Mobile', 'Tablet', 'Desktop'];
  const oss: Array<'iOS' | 'Android' | 'macOS' | 'Windows'> = ['iOS', 'iOS', 'Android', 'Android', 'macOS'];
  const browsers: Array<'Camera Scan' | 'Safari' | 'Chrome'> = ['Camera Scan', 'Safari', 'Chrome', 'Camera Scan'];

  const scans: ScanRecord[] = [];
  const now = Date.now();

  const slugs = ['reviews-kansas', 'luccianos-palermo', 'menu-davao', 'promo-may', 'vip-whatsapp'];

  for (let i = 0; i < 40; i++) {
    const slug = slugs[i % slugs.length];
    const qrId = `qr-${(i % 5) + 1}`;
    const cityObj = cities[i % cities.length];
    const hoursAgo = Math.floor(Math.random() * 120); // within last 5 days
    const timestamp = new Date(now - hoursAgo * 3600000).toISOString();

    scans.push({
      id: `scan-${i + 1}`,
      qrId,
      slug,
      timestamp,
      device: devices[i % devices.length],
      os: oss[i % oss.length],
      browser: browsers[i % browsers.length],
      city: cityObj.city,
      country: cityObj.country,
      countryCode: cityObj.countryCode,
      referrer: 'Direct Camera Scan',
      destinationForwarded: slug === 'reviews-kansas'
        ? 'https://maps.google.com/?q=Kansas+Diner+Reviews'
        : slug === 'luccianos-palermo'
        ? 'https://instagram.com/luccianos_palermo_menu'
        : 'https://restaurant-davao.com/digital-menu-2026',
    });
  }

  return scans;
}

/**
 * Creates a new simulated scan event
 */
export function createScanEvent(
  qr: DynamicQR,
  overrides?: Partial<ScanRecord>
): ScanRecord {
  const isMobile = typeof navigator !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent);
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Mobile Safari';

  let detectedOs: 'iOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' = 'iOS';
  if (/Android/i.test(userAgent)) detectedOs = 'Android';
  else if (/iPhone|iPad/i.test(userAgent)) detectedOs = 'iOS';
  else if (/Mac/i.test(userAgent)) detectedOs = 'macOS';
  else if (/Win/i.test(userAgent)) detectedOs = 'Windows';

  const defaultLocations = [
    { city: 'Davao City', country: 'Philippines', countryCode: 'PH' },
    { city: 'Kansas City', country: 'United States', countryCode: 'US' },
    { city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR' },
    { city: 'Manila', country: 'Philippines', countryCode: 'PH' },
  ];
  const loc = defaultLocations[Math.floor(Math.random() * defaultLocations.length)];

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    qrId: qr.id,
    slug: qr.slug,
    timestamp: new Date().toISOString(),
    device: isMobile ? 'Mobile' : 'Desktop',
    os: detectedOs,
    browser: /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent) ? 'Safari' : 'Chrome',
    city: loc.city,
    country: loc.country,
    countryCode: loc.countryCode,
    referrer: 'Direct Camera QR Scan',
    destinationForwarded: qr.destination,
    ...overrides,
  };
}

/**
 * Exports all QRs and Scan data to clean CSV
 */
export function exportQrsToCsv(qrs: DynamicQR[], settings: PlatformSettings): string {
  const headers = ['ID', 'Name', 'Slug', 'Short Link', 'Folder', 'Current Destination', 'Status', 'Total Scans', 'Created At', 'Last Updated'];
  const rows = qrs.map((q) => [
    q.id,
    `"${q.name.replace(/"/g, '""')}"`,
    q.slug,
    buildShortLink(q.slug, settings),
    `"${q.folder.replace(/"/g, '""')}"`,
    `"${q.destination.replace(/"/g, '""')}"`,
    q.isActive ? 'Active' : 'Inactive',
    q.totalScans,
    q.createdAt,
    q.updatedAt,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Cloudflare Worker code template for deployment
 */
export function getCloudflareWorkerCode(baseDomain = 'go.link'): string {
  return `/**
 * Cloudflare Worker for DynoQR Dynamic Redirects
 * Deploy to Cloudflare Workers with a KV namespace: QR_STORE
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\\/r\\/([a-zA-Z0-9_-]+)/);

    if (!match) {
      return new Response('Not Found', { status: 404 });
    }

    const slug = match[1].toLowerCase();
    
    // Fetch dynamic QR configuration from KV
    // Format in KV: { "destination": "https://...", "isActive": true, "name": "..." }
    const qrData = await env.QR_STORE.get(slug, { type: 'json' });

    if (!qrData) {
      return new Response(\`Dynamic QR /r/\${slug} not found.\`, {
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (qrData.isActive === false) {
      return new Response(\`This dynamic QR (/r/\${slug}) has been deactivated by its owner.\`, {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Async background logging of scan analytics
    ctx.waitUntil((async () => {
      const scanEvent = {
        slug,
        timestamp: new Date().toISOString(),
        country: request.cf?.country || 'Unknown',
        city: request.cf?.city || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        destination: qrData.destination
      };
      // Send to analytics endpoint, Supabase, or KV counter
      await env.QR_STORE.put(\`scan:\${slug}:\${Date.now()}\`, JSON.stringify(scanEvent));
    })());

    // 302 Found (Temporary Redirect) so browsers don't cache and future changes apply immediately!
    return Response.redirect(qrData.destination, 302);
  }
};`;
}

/**
 * Vercel Edge / Serverless Route template for deployment
 */
export function getVercelRouteCode(): string {
  return `// app/r/[slug]/route.ts (Next.js App Router / Vercel Edge)
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Retrieve QR destination from database / Supabase / Upstash Redis
  // e.g.: const qr = await db.query.qrs.findFirst({ where: eq(qrs.slug, slug) });
  
  const qr = await getQrBySlug(slug);

  if (!qr) {
    return new NextResponse('Dynamic QR not found', { status: 404 });
  }

  if (!qr.isActive) {
    return new NextResponse('This QR code is currently inactive', { status: 403 });
  }

  // Log scan event asynchronously (non-blocking)
  const userAgent = request.headers.get('user-agent') || '';
  const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
  await recordScan({ slug, userAgent, country, destination: qr.destination });

  // 302 Temporary Redirect ensures QR destination edits update in real time
  return NextResponse.redirect(new URL(qr.destination), 302);
}`;
}

/**
 * SQL Schema for Supabase / PostgreSQL
 */
export function getSqlSchema(): string {
  return `-- DynoQR PostgreSQL / Supabase Schema
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'Default',
  destination TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  total_scans BIGINT NOT NULL DEFAULT 0,
  notes TEXT,
  fg_color TEXT DEFAULT '#0F172A',
  bg_color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID REFERENCES qrs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  device TEXT,
  os TEXT,
  browser TEXT,
  city TEXT,
  country TEXT,
  country_code VARCHAR(2),
  referrer TEXT,
  destination_forwarded TEXT NOT NULL
);

-- Index for instant redirect lookups
CREATE INDEX IF NOT EXISTS idx_qrs_slug ON qrs(slug);
CREATE INDEX IF NOT EXISTS idx_scans_slug ON scans(slug);
CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);`;
}
