import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSlug,
  validateSlug,
  normalizeDestinationUrl,
  buildShortLink,
  filterQrs,
  calculateStats,
  exportQrsToCsv,
  buildGoogleReviewUrl,
  extractPlaceIdFromGoogleUrl,
  PlatformSettings,
  DynamicQR,
} from './qrLogic';

test('generateSlug generates clean slug from titles and handles collisions', () => {
  const slug1 = generateSlug('Kansas - Google Reviews');
  assert.equal(slug1, 'kansas-google-reviews');

  const slug2 = generateSlug("Lucciano's Palermo Soho - Gelato Menu");
  assert.equal(slug2, 'lucciano-s-palermo-soho-gelato-menu');

  // Collision handling
  const slugWithCollision = generateSlug('menu-davao', ['menu-davao', 'menu-davao-2']);
  assert.equal(slugWithCollision, 'menu-davao-3');

  // Empty or invalid title gets fallback
  const fallback = generateSlug('!@#$%');
  assert.match(fallback, /^qr-[a-z0-9]+$/);
});

test('validateSlug enforces correct alphanumeric rules', () => {
  assert.equal(validateSlug('menu-davao').valid, true);
  assert.equal(validateSlug('reviews_kansas').valid, false); // no underscore
  assert.equal(validateSlug('a').valid, false); // too short
  assert.equal(validateSlug('valid-slug-123').valid, true);
  assert.equal(validateSlug('-invalid-start').valid, false);
});

test('normalizeDestinationUrl adds protocol and validates structure', () => {
  const res1 = normalizeDestinationUrl('instagram.com/luccianos');
  assert.equal(res1.valid, true);
  assert.equal(res1.url, 'https://instagram.com/luccianos');

  const res2 = normalizeDestinationUrl('https://maps.google.com/?q=Kansas');
  assert.equal(res2.valid, true);
  assert.equal(res2.url, 'https://maps.google.com/?q=Kansas');

  const res3 = normalizeDestinationUrl('wa.me/15551234567');
  assert.equal(res3.valid, true);
  assert.equal(res3.url, 'https://wa.me/15551234567');

  const resEmpty = normalizeDestinationUrl('');
  assert.equal(resEmpty.valid, false);
});

test('buildShortLink uses custom domain when enabled, or local origin', () => {
  const settings: PlatformSettings = {
    customDomain: 'qr.mydomain.com',
    useCustomDomain: true,
    defaultFolder: 'Default',
    autoLogSimulations: true,
    redirectDelayMs: 600,
  };

  const customLink = buildShortLink('promo-may', settings, 'http://localhost:3000');
  assert.equal(customLink, 'https://qr.mydomain.com/r/promo-may');

  settings.useCustomDomain = false;
  const localLink = buildShortLink('promo-may', settings, 'http://localhost:3000');
  assert.equal(localLink, 'http://localhost:3000/r/promo-may');
});

test('filterQrs filters correctly by folder, status and search query', () => {
  const sampleQrs: DynamicQR[] = [
    {
      id: '1',
      name: 'Kansas Reviews',
      slug: 'reviews-kansas',
      folder: 'Restaurant A',
      destination: 'https://google.com',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      totalScans: 10,
    },
    {
      id: '2',
      name: 'Shop Promo',
      slug: 'shop-promo',
      folder: 'Shop 1',
      destination: 'https://shop.com',
      isActive: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      totalScans: 5,
    },
  ];

  // Filter active
  const activeOnly = filterQrs(sampleQrs, { status: 'active' });
  assert.equal(activeOnly.length, 1);
  assert.equal(activeOnly[0].slug, 'reviews-kansas');

  // Filter folder
  const shopFolder = filterQrs(sampleQrs, { folder: 'Shop 1' });
  assert.equal(shopFolder.length, 1);
  assert.equal(shopFolder[0].slug, 'shop-promo');

  // Search query
  const searchResult = filterQrs(sampleQrs, { search: 'Kansas' });
  assert.equal(searchResult.length, 1);
  assert.equal(searchResult[0].slug, 'reviews-kansas');
});

test('calculateStats aggregates KPIs accurately', () => {
  const sampleQrs: DynamicQR[] = [
    {
      id: '1',
      name: 'A',
      slug: 'a',
      folder: 'F1',
      destination: 'https://a.com',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      totalScans: 100,
    },
    {
      id: '2',
      name: 'B',
      slug: 'b',
      folder: 'F1',
      destination: 'https://b.com',
      isActive: false,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      totalScans: 50,
    },
  ];

  const stats = calculateStats(sampleQrs, []);
  assert.equal(stats.totalQrs, 2);
  assert.equal(stats.activeQrs, 1);
  assert.equal(stats.inactiveQrs, 1);
  assert.equal(stats.totalScans, 150);
  assert.equal(stats.topQr?.slug, 'a');
});

test('exportQrsToCsv generates well-formed CSV rows', () => {
  const sampleQrs: DynamicQR[] = [
    {
      id: '1',
      name: 'Test "Quote" QR',
      slug: 'test-quote',
      folder: 'Demo',
      destination: 'https://example.com',
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      totalScans: 42,
    },
  ];
  const settings: PlatformSettings = {
    customDomain: 'test.com',
    useCustomDomain: false,
    defaultFolder: 'Demo',
    autoLogSimulations: true,
    redirectDelayMs: 0,
  };
  const csv = exportQrsToCsv(sampleQrs, settings);
  assert.match(csv, /ID,Name,Slug,Short Link/);
  assert.match(csv, /"Test ""Quote"" QR"/);
  assert.match(csv, /42/);
});

test('buildGoogleReviewUrl formats direct Place ID review link and address search link', () => {
  // With business name and address
  const urlWithAddress = buildGoogleReviewUrl({
    businessName: 'Kansas Diner',
    address: '123 Main St, Kansas City, MO',
  });
  assert.equal(
    urlWithAddress,
    'https://www.google.com/maps/search/?api=1&query=Kansas%20Diner%2C%20123%20Main%20St%2C%20Kansas%20City%2C%20MO'
  );

  // With direct Place ID
  const directReview = buildGoogleReviewUrl({
    businessName: 'Kansas Diner',
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  });
  assert.equal(
    directReview,
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4'
  );
});

test('extractPlaceIdFromGoogleUrl extracts ChIJ place IDs accurately', () => {
  assert.equal(
    extractPlaceIdFromGoogleUrl('ChIJN1t_tDeuEmsRUsoyG83frY4'),
    'ChIJN1t_tDeuEmsRUsoyG83frY4'
  );

  const fullUrl = 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';
  assert.equal(
    extractPlaceIdFromGoogleUrl(fullUrl),
    'ChIJN1t_tDeuEmsRUsoyG83frY4'
  );
});

test('generateQrSvgString preserves preset SVG viewBox, stroke attributes, and centers badge inside QR viewBox', async () => {
  const { generateQrSvgString, escapeHtml } = await import('./qrRenderer');

  const googleSvg = await generateQrSvgString('https://example.com/r/reviews-kansas', {
    width: 400,
    centerLogo: { type: 'google' },
  });
  // Must preserve 48x48 viewBox for Google logo and not scale by /24
  assert.match(googleSvg, /viewBox="0 0 48 48"/);
  assert.doesNotMatch(googleSvg, /scale\(2\.346/);

  // Extract QR viewBox width and rect x coordinate to prove badge sits inside viewBox
  const vbMatch = googleSvg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  const rectMatch = googleSvg.match(/<rect x="(\d+(?:\.\d+)?)" y="(\d+(?:\.\d+)?)" width="(\d+(?:\.\d+)?)"/);
  assert.ok(vbMatch && rectMatch);
  const vbSize = Number(vbMatch[1]);
  const rectX = Number(rectMatch[1]);
  const rectW = Number(rectMatch[3]);
  assert.ok(rectX > 0 && rectX + rectW < vbSize, `Expected badge (${rectX} + ${rectW}) inside viewBox (${vbSize})`);

  const instaSvg = await generateQrSvgString('https://example.com/r/luccianos', {
    width: 400,
    centerLogo: { type: 'instagram' },
  });
  // Must preserve stroke="#2563EB" and fill="none" on stroke-based icons
  assert.match(instaSvg, /stroke="#2563EB"/);
  assert.match(instaSvg, /fill="none"/);

  assert.equal(escapeHtml('<script>"test"&\'x\'</script>'), '&lt;script&gt;&quot;test&quot;&amp;&#39;x&#39;&lt;/script&gt;');
});


