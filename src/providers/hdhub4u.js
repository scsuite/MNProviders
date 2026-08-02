const cheerio = require('cheerio-without-node-native');
const CryptoJS = require('crypto-js');
const DOMAINS = require('../config/domains');
const { mapConcurrent, uniqueExactStreams } = require('../shared/streams');
const moviesDrive = require('../moviesdrive/index');
const sharedMetadata = require('../shared/metadata');

const TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36',
  Accept: 'text/html,application/json;q=0.9,*/*;q=0.8'
};
const VIDSTACK_KEY = CryptoJS.enc.Utf8.parse('kiemtienmua911ca');
const VIDSTACK_IVS = ['1234567890oiuytr', '0123456789abcdef'].map(value => CryptoJS.enc.Utf8.parse(value));
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const normalized = value => clean(value).toLowerCase().replace(/\(\d{4}\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

async function request(url, referer) {
  return fetch(url, { redirect: 'follow', headers: { ...HEADERS, ...(referer ? { Referer: referer } : {}) } });
}
async function getBaseUrl() {
  try {
    const response = await request(DOMAINS.PHISHER_DOMAINS);
    const domains = await response.json();
    const configured = domains.HDHUB4u || domains.hdhub4u || domains.HDHub4u;
    if (/^https?:\/\//i.test(configured || '')) return String(configured).replace(/\/$/, '');
  } catch (_) {}
  return DOMAINS.HDHUB4U_FALLBACK;
}
async function metadata(tmdbId, mediaType) {
  return sharedMetadata.getMetadata(tmdbId, mediaType);
}
function qualityFrom(value) {
  const text = clean(value);
  if (/\b(?:2160p?|4k)\b/i.test(text)) return '4K';
  const match = text.match(/\b(1080|720|480|360|240)p?\b/i);
  return match ? `${match[1]}p` : 'Unknown';
}
function sizeFrom(value) { return clean(value).match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)(?:\/E)?\b/i)?.[0]; }
function absolute(value, base) { try { return new URL(value, base).toString(); } catch (_) { return ''; } }
function decodeBase64(value) {
  try { return typeof atob === 'function' ? atob(value) : Buffer.from(value, 'base64').toString('utf8'); } catch (_) { return ''; }
}
function rot13(value) {
  return String(value || '').replace(/[a-zA-Z]/g, character => String.fromCharCode((character <= 'Z' ? 90 : 122) >= (character = character.charCodeAt(0) + 13) ? character : character - 26));
}

async function search(info, base, mediaType, season) {
  const params = new URLSearchParams({
    q: info.title,
    query_by: 'post_title,category,stars,director,imdb_id',
    query_by_weights: '4,2,2,2,4', sort_by: 'sort_by_date:desc', limit: '15',
    highlight_fields: 'none', use_cache: 'true', page: '1'
  });
  const response = await request(`${DOMAINS.HDHUB4U_SEARCH_API}?${params}`, `${base}/search.html`);
  if (!response.ok) return null;
  const hits = (await response.json()).hits || [];
  const documents = hits.map(hit => hit.document).filter(Boolean);
  const title = normalized(info.title);
  const relevant = documents.filter(doc => {
    const name = normalized(doc.post_title);
    return doc.imdb_id === info.imdbId || name === title || name.startsWith(`${title} `);
  });
  const seasonPattern = new RegExp(`(?:season[ ._/-]*|\\bs)0?${season}(?:\\D|$)`, 'i');
  const selected = relevant.find(doc => mediaType !== 'tv' || seasonPattern.test(`${doc.post_title} ${doc.permalink}`))
    || relevant.find(doc => !info.year || String(doc.post_title).includes(String(info.year)))
    || relevant[0];
  if (!selected?.permalink) return null;
  const path = absolute(selected.permalink, base);
  if (!path) return null;
  const parsed = new URL(path);
  return `${base}${parsed.pathname}${parsed.search}`;
}

function candidate(url, label, referer) {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase(); } catch (_) { return null; }
  const resolverType = host.includes('hubdrive') ? 'hubdrive'
    : host.includes('hubcdn') ? 'hubcdn'
      : host.includes('gadgetsweb') || host.includes('greenmountmotors') ? 'protector'
        : host.includes('hubstream') ? 'watch' : null;
  if (!resolverType) return null;
  return {
    provider: 'HDHub4u', source: resolverType === 'hubcdn' ? 'Instant' : resolverType === 'watch' ? 'Watch' : resolverType === 'protector' ? 'Protected Link' : 'Drive',
    quality: qualityFrom(label), size: sizeFrom(label), url, label, referer,
    headers: { ...HEADERS, Referer: referer }, resolverType
  };
}

function parseMovie($, pageUrl) {
  const output = [];
  $('a[href]').each((_, anchor) => {
    const node = $(anchor);
    const url = absolute(node.attr('href'), pageUrl);
    if (!/(hubdrive|hubcdn|gadgetsweb|greenmountmotors|hubstream)/i.test(url)) return;
    const label = clean(`${node.text()} ${node.parent().text()} ${node.closest('h4,h5,p,div').first().text()}`);
    const item = candidate(url, label, pageUrl);
    if (item) output.push(item);
  });
  return output;
}
function parseEpisode($, pageUrl, episode) {
  const output = [];
  const pattern = new RegExp(`(?:E|EP|Episode)\\s*0?${Number(episode)}(?:\\D|$)`, 'i');
  $('a[href]').each((_, anchor) => {
    const node = $(anchor);
    const context = clean(node.parent().text());
    if (!pattern.test(context)) return;
    const url = absolute(node.attr('href'), pageUrl);
    let section = '';
    let ancestor = node.parent();
    for (let depth = 0; depth < 6 && ancestor.length && !section; depth += 1) {
      section = clean(ancestor.prevAll('h3,h4,h5,h6').first().text());
      ancestor = ancestor.parent();
    }
    const item = candidate(url, `${section} ${context} ${node.text()}`, pageUrl);
    if (item) output.push(item);
  });
  return output;
}
function distinct(items) {
  const seen = new Set();
  return items.filter(item => item && !seen.has(item.url) && seen.add(item.url));
}

async function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const type = mediaType === 'tv' ? 'tv' : 'movie';
    const [base, info] = await Promise.all([getBaseUrl(), metadata(tmdbId, type)]);
    if (!info?.title) return [];
    const pageUrl = await search(info, base, type, Number(season) || 1);
    if (!pageUrl) return [];
    const response = await request(pageUrl, base);
    if (!response.ok) return [];
    const $ = cheerio.load(await response.text());
    return distinct(type === 'tv' ? parseEpisode($, pageUrl, episode) : parseMovie($, pageUrl));
  } catch (error) {
    console.log(`[HDHub4u Candidates] ${error?.message || error}`);
    return [];
  }
}

async function resolveHubDrive(item) {
  const response = await request(item.url, item.referer);
  if (!response.ok) return [];
  const html = await response.text();
  if (/file not found|deleted|just a moment|cf-chl|turnstile/i.test(html)) return [];
  const $ = cheerio.load(html);
  const routes = $('a[href]').map((_, anchor) => absolute($(anchor).attr('href'), response.url)).get()
    .filter(url => /hubcloud|hubcdn/i.test(url));
  return (await mapConcurrent([...new Set(routes)], 2, url => resolveCandidate({ ...item, url, resolverType: /hubcdn/i.test(url) ? 'hubcdn' : 'hubcloud' }))).flat();
}
async function resolveHubCdn(item) {
  const response = await request(item.url, item.referer);
  if (!response.ok) return [];
  const html = await response.text();
  const encoded = html.match(/[?&]r=([A-Za-z0-9+/=_-]+)/)?.[1];
  if (!encoded) return [];
  let decoded = '';
  try { decoded = typeof atob === 'function' ? atob(encoded) : Buffer.from(encoded, 'base64').toString('utf8'); } catch (_) { return []; }
  const direct = decoded.includes('link=') ? decoded.slice(decoded.lastIndexOf('link=') + 5) : decoded;
  if (!/^https?:\/\//i.test(direct)) return [];
  return [{ name: `HDHub4u • ${item.quality} • Instant`, url: direct, quality: item.quality, size: item.size, source: 'Instant', provider: 'HDHub4u', headers: item.headers, subtitles: [] }];
}
async function resolveProtected(item) {
  const response = await request(item.url, item.referer);
  if (!response.ok) return [];
  const html = await response.text();
  if (/failed to decode|just a moment|cf-chl|turnstile/i.test(html)) return [];
  const encodedParts = [...html.matchAll(/s\s*\(\s*['"]o['"]\s*,\s*['"]([A-Za-z0-9+/=]+)['"]|ck\s*\(\s*['"]_wp_http_\d+['"]\s*,\s*['"]([^'"]+)['"]/g)]
    .map(match => match[1] || match[2]).filter(Boolean);
  let landing = '';
  for (const encoded of encodedParts) {
    try {
      const payload = JSON.parse(decodeBase64(rot13(decodeBase64(decodeBase64(encoded)))));
      landing = decodeBase64(payload.o || '').trim();
      if (!landing && payload.data && payload.blog_url) {
        const redirect = await request(`${payload.blog_url}?re=${encodeURIComponent(decodeBase64(payload.data).trim())}`, response.url);
        if (redirect.ok) landing = clean(await redirect.text());
      }
      if (/^https?:\/\//i.test(landing)) break;
    } catch (_) {}
  }
  if (!landing) {
    const urls = [...html.matchAll(/https?:\\?\/\\?\/[^"'<>\s]+/g)].map(match => match[0].replace(/\\\//g, '/'));
    landing = urls.find(url => /hubcloud|hubdrive|hubcdn|hblinks/i.test(url)) || '';
  }
  if (!/^https?:\/\//i.test(landing)) return [];
  const landingResponse = await request(landing, response.url);
  if (!landingResponse.ok) return [];
  const landingHtml = await landingResponse.text();
  if (/just a moment|cf-chl|turnstile/i.test(landingHtml)) return [];
  const $ = cheerio.load(landingHtml);
  const routes = $('a[href]').map((_, anchor) => absolute($(anchor).attr('href'), landingResponse.url)).get()
    .filter(url => /hubcloud|hubdrive|hubcdn/i.test(url));
  if (!routes.length && /hubcloud|hubdrive|hubcdn/i.test(landingResponse.url)) routes.push(landingResponse.url);
  return (await mapConcurrent([...new Set(routes)], 3, url => resolveCandidate({
    ...item, url, referer: landingResponse.url,
    resolverType: /hubcdn/i.test(url) ? 'hubcdn' : /hubdrive/i.test(url) ? 'hubdrive' : 'hubcloud'
  }))).flat();
}
function decryptVidStack(ciphertext) {
  for (const iv of VIDSTACK_IVS) {
    try {
      const bytes = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Hex.parse(String(ciphertext).trim()) }, VIDSTACK_KEY, {
        iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
      });
      const decoded = bytes.toString(CryptoJS.enc.Utf8).replace(/[\u0000-\u001f]+$/g, '');
      if (decoded) return JSON.parse(decoded);
    } catch (_) {}
  }
  return null;
}
async function resolveWatch(item) {
  const parsed = new URL(item.url);
  const id = parsed.hash.slice(1).split('&')[0] || parsed.pathname.split('/').filter(Boolean).pop();
  if (!id) return [];
  const response = await request(`${parsed.origin}/api/v1/video?id=${encodeURIComponent(id)}`, item.url);
  if (!response.ok) return [];
  const raw = clean(await response.text());
  let payload;
  try { payload = JSON.parse(raw); } catch (_) { payload = decryptVidStack(raw); }
  const mediaUrl = payload?.cfNative || payload?.source;
  if (!/^https?:\/\//i.test(mediaUrl || '')) return [];
  const subtitles = Object.entries(payload.subtitle || {}).map(([language, url]) => ({ language, url: absolute(String(url).split('#')[0], parsed.origin) })).filter(entry => entry.url);
  return [{
    name: `HDHub4u • ${item.quality} • Watch`, url: mediaUrl, quality: item.quality,
    size: item.size, source: 'Watch', provider: 'HDHub4u', headers: { ...HEADERS, Referer: parsed.origin }, subtitles, seekable: true
  }];
}
async function resolveCandidate(item) {
  if (!item?.url) return [];
  try {
    if (item.resolverType === 'hubdrive') return resolveHubDrive(item);
    if (item.resolverType === 'hubcdn') return resolveHubCdn(item);
    if (item.resolverType === 'protector') return resolveProtected(item);
    if (item.resolverType === 'watch') return resolveWatch(item);
    if (item.resolverType === 'hubcloud') {
      const resolver = moviesDrive.resolveCandidate || moviesDrive.default?.resolveCandidate;
      if (typeof resolver !== 'function') return [];
      return (await resolver({ ...item, resolverType: 'hubcloud' })).map(stream => ({ ...stream, provider: 'HDHub4u' }));
    }
    return [];
  } catch (_) { return []; }
}
function selectFastCandidates(candidates) {
  const unique = distinct(candidates);
  const selected = [];
  const coveredQualities = new Set();
  const add = item => {
    if (!item || selected.some(existing => existing.url === item.url)) return;
    selected.push(item);
    if (item.quality && item.quality !== 'Unknown') coveredQualities.add(item.quality);
  };

  // These routes normally resolve in one request and give the quickest useful result.
  unique.filter(item => item.resolverType === 'hubcdn' || item.resolverType === 'watch').forEach(add);

  // Keep one Drive release for every quality not already represented by an Instant link.
  for (const item of unique.filter(candidate => candidate.resolverType === 'hubdrive')) {
    if (!coveredQualities.has(item.quality)) add(item);
  }

  // Protected redirects are the slowest chain. Use only one when a quality has no faster route.
  for (const item of unique.filter(candidate => candidate.resolverType === 'protector')) {
    if (!coveredQualities.has(item.quality)) add(item);
  }

  // Nuvio waits for the entire Promise and has a hard runtime timeout; keep the bounded fast set.
  return selected.slice(0, 5);
}
async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  const candidates = await discoverCandidates(tmdbId, mediaType, season, episode);
  const fastCandidates = selectFastCandidates(candidates);
  return uniqueExactStreams((await mapConcurrent(fastCandidates, 4, resolveCandidate)).flat().filter(Boolean));
}

module.exports = { discoverCandidates, resolveCandidate, selectFastCandidates, getStreams };
