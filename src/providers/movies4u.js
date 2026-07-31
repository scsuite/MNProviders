const cheerio = require('cheerio-without-node-native');
const DOMAINS = require('../config/domains');
const { mapConcurrent, uniqueExactStreams } = require('../shared/streams');
const moviesDrive = require('../moviesdrive/index');
const vegaMovies = require('./vegamovies');

const TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*;q=0.8', Cookie: 'xla=s4t' };

async function text(url, referer) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { ...HEADERS, ...(referer ? { Referer: referer } : {}) }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function getBaseUrl() {
  try {
    const domains = JSON.parse(await text(DOMAINS.PHISHER_DOMAINS));
    if (domains.movies4u) return String(domains.movies4u).replace(/\/$/, '');
  } catch (_) {}
  return DOMAINS.MOVIES4U_FALLBACK;
}

async function getMetadata(tmdbId, mediaType) {
  const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
  const data = JSON.parse(await text(`${DOMAINS.TMDB_API}/${endpoint}/${tmdbId}?api_key=${TMDB_KEY}`));
  return {
    title: mediaType === 'tv' ? data.name : data.title,
    year: Number(String(mediaType === 'tv' ? data.first_air_date : data.release_date).slice(0, 4)) || null
  };
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function qualityFrom(value) {
  const match = clean(value).match(/(?:2160p?|4k|1080p?|720p?|480p?|360p?)/i);
  if (!match) return 'Unknown';
  return /2160|4k/i.test(match[0]) ? '4K' : `${match[0].match(/\d+/)[0]}p`;
}

function sizeFrom(value) {
  return clean(value).match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)(?:\/E)?\b/i)?.[0];
}

function normalizedTitle(value) {
  return clean(value).toLowerCase().replace(/\(\d{4}\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function chooseResult(results, metadata, mediaType) {
  const target = normalizedTitle(metadata.title);
  const exact = results.find(result => {
    const name = normalizedTitle(result.name);
    const yearMatches = !metadata.year || String(result.name).includes(String(metadata.year));
    return (name === target || name.startsWith(`${target} `)) && yearMatches &&
      (mediaType !== 'tv' || /season|series/i.test(result.name));
  });
  return exact || results.find(result => normalizedTitle(result.name).startsWith(`${target} `)) || null;
}

function routesFromBlock($, heading) {
  return $(heading).next().find('a[href]').map((_, anchor) => ({
    url: $(anchor).attr('href'),
    label: clean($(anchor).text())
  })).get().filter(route => route.url && !/batch|zip/i.test(route.label));
}

function candidate(route, quality, size, referer, label) {
  const value = `${route.label} ${route.url}`;
  // Movies4u sometimes labels a vcloud.zip route as "GDFlix". The actual
  // hostname is authoritative because it determines the required resolver.
  const resolverType = /vcloud/i.test(route.url) ? 'vcloud'
    : /hubcloud/i.test(route.url) ? 'hubcloud'
      : /gdflix|gdlink/i.test(route.url) ? 'gdflix'
        : /hubcloud/i.test(value) ? 'hubcloud'
          : /gdflix|gdlink/i.test(value) ? 'gdflix' : null;
  if (!resolverType) return null;
  return {
    provider: 'Movies4u',
    source: resolverType === 'hubcloud' ? 'HubCloud' : resolverType === 'gdflix' ? 'GDFlix' : 'VCloud',
    quality,
    size,
    url: route.url,
    label,
    referer,
    headers: { ...HEADERS, Referer: referer },
    resolverType
  };
}

async function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  if (!tmdbId || !['movie', 'tv'].includes(mediaType)) return [];
  if (mediaType === 'tv' && (!season || !episode)) return [];
  try {
    const [base, metadata] = await Promise.all([getBaseUrl(), getMetadata(tmdbId, mediaType)]);
    if (!metadata.title) return [];
    const $search = cheerio.load(await text(`${base}/?s=${encodeURIComponent(metadata.title)}`, base));
    const results = $search('article').map((_, article) => {
      const anchor = $search(article).find('h2 a, h3 a').first();
      return { name: clean(anchor.text()), url: anchor.attr('href') };
    }).get().filter(result => result.url && result.name);
    const match = chooseResult(results, metadata, mediaType);
    if (!match) return [];

    const $detail = cheerio.load(await text(match.url, base));
    const releasePages = [];
    $detail('div.download-links-div h4, div.downloads-btns-div h4, h4').each((_, heading) => {
      const label = clean($detail(heading).text());
      if (mediaType === 'tv' && !new RegExp(`season\\s*0?${Number(season)}(?:\\D|$)`, 'i').test(label)) return;
      const quality = qualityFrom(label);
      if (quality === 'Unknown') return;
      for (const route of routesFromBlock($detail, heading)) {
        if (/m4ulinks\./i.test(route.url)) releasePages.push({ ...route, quality, size: sizeFrom(label), label });
      }
    });

    const pageCache = new Map();
    const getReleasePage = url => {
      if (!pageCache.has(url)) pageCache.set(url, text(url, match.url));
      return pageCache.get(url);
    };
    const discovered = await mapConcurrent(releasePages, 4, async release => {
      try {
        const $page = cheerio.load(await getReleasePage(release.url));
        const routes = [];
        if (mediaType === 'tv') {
          $page('h4, h5').each((_, heading) => {
            const headingText = clean($page(heading).text());
            const matchEpisode = headingText.match(/episodes?\s*:\s*0*(\d+)/i);
            if (!matchEpisode || Number(matchEpisode[1]) !== Number(episode)) return;
            routes.push(...routesFromBlock($page, heading));
          });
        } else {
          $page('h4, h5').each((_, heading) => {
            const headingText = clean($page(heading).text());
            if (qualityFrom(headingText) !== release.quality) return;
            routes.push(...routesFromBlock($page, heading));
          });
        }
        return routes.map(route => candidate(route, release.quality, release.size, release.url, release.label)).filter(Boolean);
      } catch (_) { return []; }
    });
    const seen = new Set();
    return discovered.flat().filter(item => {
      const key = `${item.quality}|${item.source}|${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.log(`[Movies4u Candidates] ${error?.message || error}`);
    return [];
  }
}

async function resolveCandidate(item) {
  if (!item?.url) return [];
  try {
    const resolver = item.resolverType === 'vcloud'
      ? (vegaMovies.resolveCandidate || vegaMovies.default?.resolveCandidate)
      : (moviesDrive.resolveCandidate || moviesDrive.default?.resolveCandidate);
    if (typeof resolver !== 'function') return [];
    const streams = await resolver(item);
    return (streams || []).map(stream => ({ ...stream, provider: 'Movies4u' }));
  } catch (_) { return []; }
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  const candidates = await discoverCandidates(tmdbId, mediaType, season, episode);
  const resolved = await mapConcurrent(candidates, 4, resolveCandidate);
  return uniqueExactStreams(resolved.flat().filter(Boolean));
}

module.exports = { discoverCandidates, resolveCandidate, getStreams };
