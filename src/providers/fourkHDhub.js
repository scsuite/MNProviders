const cheerio = require('cheerio-without-node-native');
const DOMAINS = require('../config/domains');
const { mapConcurrent, uniqueExactStreams } = require('../shared/streams');
const moviesDrive = require('../moviesdrive/index');

const TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  Accept: 'text/html,*/*;q=0.8'
};

async function text(url, referer) {
  const response = await fetch(url, { redirect: 'follow', headers: { ...HEADERS, ...(referer ? { Referer: referer } : {}) } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function getBaseUrl() {
  try {
    const domains = JSON.parse(await text(DOMAINS.PHISHER_DOMAINS));
    if (domains['4khdhub']) return String(domains['4khdhub']).replace(/\/$/, '');
  } catch (_) {}
  return DOMAINS.FOURKHDHUB_FALLBACK;
}

async function metadata(tmdbId, mediaType) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const data = JSON.parse(await text(`${DOMAINS.TMDB_API}/${type}/${tmdbId}?api_key=${TMDB_KEY}`));
  return {
    title: type === 'tv' ? data.name : data.title,
    year: Number(String(type === 'tv' ? data.first_air_date : data.release_date).slice(0, 4)) || null
  };
}

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const normalized = value => clean(value).toLowerCase().replace(/\(\d{4}\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function absolute(url, base) {
  try { return new URL(url, base).toString(); } catch (_) { return ''; }
}

function qualityFrom(value) {
  const match = clean(value).match(/\b(?:2160p?|4k|1080p?|720p?|480p?|360p?)\b/i);
  if (!match) return 'Unknown';
  return /2160|4k/i.test(match[0]) ? '4K' : `${match[0].match(/\d+/)[0]}p`;
}

function sizeFrom(value) {
  return clean(value).match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)(?:\/E)?\b/i)?.[0];
}

function selectResult(results, info, mediaType) {
  const target = normalized(info.title);
  return results.find(item => {
    const name = normalized(item.name);
    return (name === target || name.startsWith(`${target} `)) &&
      (!info.year || item.name.includes(String(info.year)) || mediaType === 'tv') &&
      (mediaType !== 'tv' || /series|season/i.test(`${item.name} ${item.url}`));
  }) || results.find(item => {
    const name = normalized(item.name);
    return name === target || name.startsWith(`${target} `);
  }) || null;
}

function matchesEpisode(label, season, episode) {
  const exact = clean(label).match(/S(?:eason)?\s*0*(\d+)\s*E(?:pisode)?\s*0*(\d+)/i);
  if (exact) return Number(exact[1]) === Number(season) && Number(exact[2]) === Number(episode);
  const simple = clean(label).match(/Episode[-\s:]*(\d+)/i);
  return Boolean(simple && Number(simple[1]) === Number(episode));
}

function makeCandidate(url, anchorLabel, blockLabel, referer) {
  const hostname = (() => { try { return new URL(url).hostname.toLowerCase(); } catch (_) { return ''; } })();
  const resolverType = hostname.includes('hubcloud') ? 'hubcloud' : hostname.includes('hubdrive') ? 'hubdrive' : null;
  if (!resolverType) return null;
  return {
    provider: '4KHDHub',
    source: resolverType === 'hubcloud' ? 'HubCloud' : 'HubDrive',
    quality: qualityFrom(blockLabel),
    size: sizeFrom(blockLabel),
    url,
    label: blockLabel,
    referer,
    headers: { ...HEADERS, Referer: referer },
    resolverType
  };
}

async function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  if (!tmdbId || !['movie', 'tv'].includes(mediaType)) return [];
  try {
    const [base, info] = await Promise.all([getBaseUrl(), metadata(tmdbId, mediaType)]);
    const $search = cheerio.load(await text(`${base}/?s=${encodeURIComponent(info.title)}`, base));
    const results = $search('div.card-grid a, article a').map((_, anchor) => ({
      name: clean($search(anchor).find('h2,h3').first().text() || $search(anchor).attr('title') || $search(anchor).text()),
      url: absolute($search(anchor).attr('href'), base)
    })).get().filter(item => item.name && item.url);
    const selected = selectResult(results, info, mediaType);
    if (!selected) return [];

    const $ = cheerio.load(await text(selected.url, base));
    const selector = mediaType === 'tv' ? 'div.episode-download-item' : 'div.download-item';
    const candidates = [];
    $(selector).each((_, block) => {
      const label = clean($(block).text());
      if (mediaType === 'tv' && !matchesEpisode(label, season, episode)) return;
      $(block).find('a[href]').each((__, anchor) => {
        const url = absolute($(anchor).attr('href'), selected.url);
        const item = makeCandidate(url, clean($(anchor).text()), label, selected.url);
        if (item) candidates.push(item);
      });
    });
    const seen = new Set();
    return candidates.filter(item => {
      const key = `${item.quality}|${item.source}|${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.log(`[4KHDHub Candidates] ${error?.message || error}`);
    return [];
  }
}

async function resolveCandidate(candidate) {
  if (!candidate?.url) return [];
  // HubDrive currently exposes an account/landing page without a playable URL.
  // Never leak it to Nuvio. HubCloud uses the existing device-side extractor.
  if (candidate.resolverType !== 'hubcloud') return [];
  try {
    const resolver = moviesDrive.resolveCandidate || moviesDrive.default?.resolveCandidate;
    if (typeof resolver !== 'function') return [];
    const streams = await resolver({ ...candidate, resolverType: 'hubcloud' });
    return (streams || []).map(stream => ({ ...stream, provider: '4KHDHub' }));
  } catch (_) { return []; }
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  const candidates = await discoverCandidates(tmdbId, mediaType, season, episode);
  const resolved = await mapConcurrent(candidates, 4, resolveCandidate);
  return uniqueExactStreams(resolved.flat().filter(Boolean));
}

module.exports = { discoverCandidates, resolveCandidate, getStreams };
