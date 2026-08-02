const cheerio = require('cheerio-without-node-native');
const DOMAINS = require('../config/domains');
const { mapConcurrent, uniqueExactStreams } = require('../shared/streams');
const moviesDrive = require('../moviesdrive/index');
const sharedMetadata = require('../shared/metadata');

const TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36',
  Accept: 'text/html,application/json;q=0.9,*/*;q=0.8'
};
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
  const urls = [...html.matchAll(/https?:\\?\/\\?\/[^"'<>\\s]+/g)].map(match => match[0].replace(/\\\//g, '/'));
  const route = urls.find(url => /hubcloud|hubdrive|hubcdn/i.test(url));
  if (!route) return [];
  return resolveCandidate({ ...item, url: route, resolverType: /hubcdn/i.test(route) ? 'hubcdn' : /hubdrive/i.test(route) ? 'hubdrive' : 'hubcloud' });
}
async function resolveCandidate(item) {
  if (!item?.url) return [];
  try {
    if (item.resolverType === 'hubdrive') return resolveHubDrive(item);
    if (item.resolverType === 'hubcdn') return resolveHubCdn(item);
    if (item.resolverType === 'protector') return resolveProtected(item);
    if (item.resolverType === 'hubcloud') {
      const resolver = moviesDrive.resolveCandidate || moviesDrive.default?.resolveCandidate;
      if (typeof resolver !== 'function') return [];
      return (await resolver({ ...item, resolverType: 'hubcloud' })).map(stream => ({ ...stream, provider: 'HDHub4u' }));
    }
    return [];
  } catch (_) { return []; }
}
async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  const candidates = await discoverCandidates(tmdbId, mediaType, season, episode);
  return uniqueExactStreams((await mapConcurrent(candidates, 4, resolveCandidate)).flat().filter(Boolean));
}

module.exports = { discoverCandidates, resolveCandidate, getStreams };
