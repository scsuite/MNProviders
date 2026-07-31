const { getStreams: getCastleStreams } = require('./castle');
const vegaModule = require('./vegamovies');
const mdModule = require('../moviesdrive/index');
const { mapConcurrent, uniqueExactStreams } = require('../shared/streams');

const WORKER_BASE = 'https://lucky-star-3059.salman-sohail93.workers.dev';
const WORKER_TIMEOUT_MS = 20000;

async function fetchWorkerData(tmdbId, mediaType, season, episode) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), WORKER_TIMEOUT_MS) : null;
  try {
    const url = `${WORKER_BASE}/streams?tmdbId=${encodeURIComponent(tmdbId)}&type=${encodeURIComponent(mediaType)}&season=${encodeURIComponent(season || 1)}&episode=${encodeURIComponent(episode || 1)}`;
    const response = await fetch(url, {
      signal: controller ? controller.signal : undefined,
      headers: { Accept: 'application/json' }
    });
    if (timer) clearTimeout(timer);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !Array.isArray(data.directStreams) || !Array.isArray(data.candidates)) {
      return null;
    }
    return data;
  } catch (_) {
    if (timer) clearTimeout(timer);
    return null;
  }
}

async function resolveDeviceCandidate(candidate) {
  if (!candidate || !candidate.url) return [];
  const mdResolver = mdModule.resolveCandidate || mdModule.default?.resolveCandidate;
  const vegaResolver = vegaModule.resolveCandidate || vegaModule.default?.resolveCandidate;

  try {
    const isMoviesDriveTarget = candidate.provider === 'MoviesDrive' || /hubcloud|gdflix|gdlink/i.test(candidate.url) || candidate.resolverType === 'hubcloud' || candidate.resolverType === 'gdflix';
    if (isMoviesDriveTarget) {
      if (typeof mdResolver === 'function') {
        const res = await mdResolver(candidate);
        return Array.isArray(res) ? res : [];
      }
      return [];
    }

    const isVegaTarget = candidate.provider === 'vegamovies' || /vcloud|fastdl/i.test(candidate.url) || candidate.resolverType === 'vcloud' || candidate.resolverType === 'fastdl';
    if (isVegaTarget) {
      if (typeof vegaResolver === 'function') {
        const res = await vegaResolver(candidate);
        return Array.isArray(res) ? res : [];
      }
      return [];
    }

    if (candidate.resolverType === 'direct') {
      return [{
        name: candidate.name || `${candidate.provider || 'StreamPlay'} • ${candidate.quality || 'Unknown'} • ${candidate.source || 'Direct'}`,
        url: candidate.url,
        quality: candidate.quality || 'Unknown',
        headers: candidate.headers || {},
        provider: candidate.provider || 'StreamPlay',
        source: candidate.source || 'Direct',
        subtitles: []
      }];
    }

    return [];
  } catch (_) {
    return [];
  }
}

async function runLocalDiscoveryFallback(tmdbId, mediaType, season, episode) {
  const discoverVega = vegaModule.discoverCandidates || vegaModule.default?.discoverCandidates;
  const getVega = vegaModule.getStreams || vegaModule.default?.getStreams;

  const discoverMD = mdModule.discoverCandidates || mdModule.default?.discoverCandidates;
  const getMD = mdModule.getStreams || mdModule.default?.getStreams;

  const [castleResult, vegaResult, mdResult] = await Promise.allSettled([
    typeof getCastleStreams === 'function' ? getCastleStreams(tmdbId, mediaType, season, episode) : Promise.resolve([]),
    typeof discoverVega === 'function' ? discoverVega(tmdbId, mediaType, season, episode) : typeof getVega === 'function' ? getVega(tmdbId, mediaType, season, episode) : Promise.resolve([]),
    typeof discoverMD === 'function' ? discoverMD(tmdbId, mediaType, season, episode) : typeof getMD === 'function' ? getMD(tmdbId, mediaType, season, episode) : Promise.resolve([])
  ]);

  const castleStreams = castleResult.status === 'fulfilled' && Array.isArray(castleResult.value)
    ? castleResult.value.map(s => ({ ...s, provider: 'castle', source: s.source || s.name || 'Castle' }))
    : [];

  let vegaStreams = [];
  if (vegaResult.status === 'fulfilled' && Array.isArray(vegaResult.value)) {
    if (typeof discoverVega === 'function') {
      const resolved = await mapConcurrent(vegaResult.value, 4, resolveDeviceCandidate);
      vegaStreams = resolved.flat().filter(Boolean);
    } else {
      vegaStreams = vegaResult.value.map(s => ({ ...s, provider: 'vegamovies' }));
    }
  }

  let mdStreams = [];
  if (mdResult.status === 'fulfilled' && Array.isArray(mdResult.value)) {
    if (typeof discoverMD === 'function') {
      const resolved = await mapConcurrent(mdResult.value, 4, resolveDeviceCandidate);
      mdStreams = resolved.flat().filter(Boolean);
    } else {
      mdStreams = mdResult.value.map(s => ({ ...s, provider: 'MoviesDrive' }));
    }
  }

  return [...castleStreams, ...vegaStreams, ...mdStreams];
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  if (!tmdbId || (mediaType !== 'movie' && mediaType !== 'tv')) return [];
  if (mediaType === 'tv' && (!season || !episode)) return [];

  const workerData = await fetchWorkerData(tmdbId, mediaType, season, episode);

  let rawStreams = [];
  if (workerData) {
    const directStreams = (workerData.directStreams || []).map(s => ({
      ...s,
      provider: s.provider || 'castle',
      source: s.source || s.name || 'Castle'
    }));

    const resolvedCandidates = await mapConcurrent(workerData.candidates || [], 4, resolveDeviceCandidate);
    rawStreams = [...directStreams, ...resolvedCandidates.flat().filter(Boolean)];
  } else {
    rawStreams = await runLocalDiscoveryFallback(tmdbId, mediaType, season, episode);
  }

  return uniqueExactStreams(rawStreams);
}

module.exports = { getStreams, WORKER_BASE, fetchWorkerData, resolveDeviceCandidate, runLocalDiscoveryFallback };
