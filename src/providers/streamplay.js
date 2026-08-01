const { getStreams: getCastleStreams } = require('./castle');
const vegaModule = require('./vegamovies');
const movies4uModule = require('./movies4u');
const fourkHDHubModule = require('./fourkHDhub');
const multiMoviesModule = require('./multimovies');
const hdHub4uModule = require('./hdhub4u');
const mdModule = require('../moviesdrive/index');
const { mapConcurrent, uniqueExactStreams } = require('../shared/streams');
const DOMAINS = require('../config/domains');

const WORKER_BASE = DOMAINS.WORKER;

async function fetchWorkerData(tmdbId, mediaType, season, episode) {
  try {
    const url = `${WORKER_BASE}/streams?tmdbId=${encodeURIComponent(tmdbId)}&type=${encodeURIComponent(mediaType)}&season=${encodeURIComponent(season || 1)}&episode=${encodeURIComponent(episode || 1)}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !Array.isArray(data.directStreams) || !Array.isArray(data.candidates)) {
      return null;
    }
    return data;
  } catch (_) {
    return null;
  }
}

async function resolveDeviceCandidate(candidate) {
  if (!candidate || !candidate.url) return [];
  const mdResolver = mdModule.resolveCandidate || mdModule.default?.resolveCandidate;
  const vegaResolver = vegaModule.resolveCandidate || vegaModule.default?.resolveCandidate;
  const movies4uResolver = movies4uModule.resolveCandidate || movies4uModule.default?.resolveCandidate;
  const fourkHDHubResolver = fourkHDHubModule.resolveCandidate || fourkHDHubModule.default?.resolveCandidate;
  const multiMoviesResolver = multiMoviesModule.resolveCandidate || multiMoviesModule.default?.resolveCandidate;
  const hdHub4uResolver = hdHub4uModule.resolveCandidate || hdHub4uModule.default?.resolveCandidate;

  try {
    if (candidate.provider === 'Movies4u') {
      if (typeof movies4uResolver === 'function') {
        const res = await movies4uResolver(candidate);
        return Array.isArray(res) ? res : [];
      }
      return [];
    }
    if (candidate.provider === '4KHDHub') {
      if (typeof fourkHDHubResolver === 'function') {
        const res = await fourkHDHubResolver(candidate);
        return Array.isArray(res) ? res : [];
      }
      return [];
    }
    if (candidate.provider === 'MultiMovies') {
      if (typeof multiMoviesResolver === 'function') {
        const res = await multiMoviesResolver(candidate);
        return Array.isArray(res) ? res : [];
      }
      return [];
    }
    if (candidate.provider === 'HDHub4u') {
      if (typeof hdHub4uResolver === 'function') {
        const res = await hdHub4uResolver(candidate);
        return Array.isArray(res) ? res : [];
      }
      return [];
    }
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
  const discoverMovies4u = movies4uModule.discoverCandidates || movies4uModule.default?.discoverCandidates;
  const getMovies4u = movies4uModule.getStreams || movies4uModule.default?.getStreams;
  const discover4KHDHub = fourkHDHubModule.discoverCandidates || fourkHDHubModule.default?.discoverCandidates;
  const get4KHDHub = fourkHDHubModule.getStreams || fourkHDHubModule.default?.getStreams;
  const discoverMultiMovies = multiMoviesModule.discoverCandidates || multiMoviesModule.default?.discoverCandidates;
  const getMultiMovies = multiMoviesModule.getStreams || multiMoviesModule.default?.getStreams;
  const discoverHDHub4u = hdHub4uModule.discoverCandidates || hdHub4uModule.default?.discoverCandidates;
  const getHDHub4u = hdHub4uModule.getStreams || hdHub4uModule.default?.getStreams;

  const discoverMD = mdModule.discoverCandidates || mdModule.default?.discoverCandidates;
  const getMD = mdModule.getStreams || mdModule.default?.getStreams;

  const [castleResult, vegaResult, mdResult, movies4uResult, fourkHDHubResult, multiMoviesResult, hdHub4uResult] = await Promise.allSettled([
    typeof getCastleStreams === 'function' ? getCastleStreams(tmdbId, mediaType, season, episode) : Promise.resolve([]),
    typeof discoverVega === 'function' ? discoverVega(tmdbId, mediaType, season, episode) : typeof getVega === 'function' ? getVega(tmdbId, mediaType, season, episode) : Promise.resolve([]),
    typeof discoverMD === 'function' ? discoverMD(tmdbId, mediaType, season, episode) : typeof getMD === 'function' ? getMD(tmdbId, mediaType, season, episode) : Promise.resolve([]),
    typeof discoverMovies4u === 'function' ? discoverMovies4u(tmdbId, mediaType, season, episode) : typeof getMovies4u === 'function' ? getMovies4u(tmdbId, mediaType, season, episode) : Promise.resolve([]),
    typeof discover4KHDHub === 'function' ? discover4KHDHub(tmdbId, mediaType, season, episode) : typeof get4KHDHub === 'function' ? get4KHDHub(tmdbId, mediaType, season, episode) : Promise.resolve([]),
    typeof discoverMultiMovies === 'function' ? discoverMultiMovies(tmdbId, mediaType, season, episode) : typeof getMultiMovies === 'function' ? getMultiMovies(tmdbId, mediaType, season, episode) : Promise.resolve([]),
    typeof discoverHDHub4u === 'function' ? discoverHDHub4u(tmdbId, mediaType, season, episode) : typeof getHDHub4u === 'function' ? getHDHub4u(tmdbId, mediaType, season, episode) : Promise.resolve([])
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

  let movies4uStreams = [];
  if (movies4uResult.status === 'fulfilled' && Array.isArray(movies4uResult.value)) {
    if (typeof discoverMovies4u === 'function') {
      const resolved = await mapConcurrent(movies4uResult.value, 4, resolveDeviceCandidate);
      movies4uStreams = resolved.flat().filter(Boolean);
    } else {
      movies4uStreams = movies4uResult.value.map(s => ({ ...s, provider: 'Movies4u' }));
    }
  }

  let fourkHDHubStreams = [];
  if (fourkHDHubResult.status === 'fulfilled' && Array.isArray(fourkHDHubResult.value)) {
    if (typeof discover4KHDHub === 'function') {
      const resolved = await mapConcurrent(fourkHDHubResult.value, 4, resolveDeviceCandidate);
      fourkHDHubStreams = resolved.flat().filter(Boolean);
    } else {
      fourkHDHubStreams = fourkHDHubResult.value.map(s => ({ ...s, provider: '4KHDHub' }));
    }
  }

  let multiMoviesStreams = [];
  if (multiMoviesResult.status === 'fulfilled' && Array.isArray(multiMoviesResult.value)) {
    if (typeof discoverMultiMovies === 'function') {
      const resolved = await mapConcurrent(multiMoviesResult.value, 4, resolveDeviceCandidate);
      multiMoviesStreams = resolved.flat().filter(Boolean);
    } else {
      multiMoviesStreams = multiMoviesResult.value.map(s => ({ ...s, provider: 'MultiMovies' }));
    }
  }

  let hdHub4uStreams = [];
  if (hdHub4uResult.status === 'fulfilled' && Array.isArray(hdHub4uResult.value)) {
    if (typeof discoverHDHub4u === 'function') {
      hdHub4uStreams = (await mapConcurrent(hdHub4uResult.value, 4, resolveDeviceCandidate)).flat().filter(Boolean);
    } else {
      hdHub4uStreams = hdHub4uResult.value.map(s => ({ ...s, provider: 'HDHub4u' }));
    }
  }

  return [...castleStreams, ...vegaStreams, ...mdStreams, ...movies4uStreams, ...fourkHDHubStreams, ...multiMoviesStreams, ...hdHub4uStreams];
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

    // Candidate resolution is the dominant cost on link-heavy titles. Fourteen
    // concurrent lightweight resolver requests avoids dozens of serial network
    // batches while still bounding mobile socket usage.
    const resolutionJob = mapConcurrent(workerData.candidates || [], 14, resolveDeviceCandidate);
    const providerFallbackJobs = [];

    // Some sites allow the user device but block Cloudflare Worker IPs. An
    // empty provider result must not suppress that provider's local fallback.
    const workerReported4KHDHub = workerData.providers && Object.prototype.hasOwnProperty.call(workerData.providers, '4khdhub');
    const worker4KCount = Number(workerData.providers?.['4khdhub']?.count || 0);
    if (workerReported4KHDHub && worker4KCount === 0) {
      const discover4KHDHub = fourkHDHubModule.discoverCandidates || fourkHDHubModule.default?.discoverCandidates;
      if (typeof discover4KHDHub === 'function') {
        try {
          providerFallbackJobs.push((async () => {
            const localCandidates = await discover4KHDHub(tmdbId, mediaType, season, episode);
            const localResolved = await mapConcurrent(localCandidates, 4, resolveDeviceCandidate);
            return localResolved.flat().filter(Boolean);
          })().catch(() => []));
        } catch (_) {}
      }
    }

    // A successful zero MultiMovies result means the title is absent. Retrying
    // its long discovery flow on-device only repeats the same work.
    const [resolvedCandidates, fallbackGroups] = await Promise.all([
      resolutionJob,
      Promise.all(providerFallbackJobs)
    ]);
    rawStreams = [
      ...directStreams,
      ...resolvedCandidates.flat().filter(Boolean),
      ...fallbackGroups.flat().filter(Boolean)
    ];
  } else {
    rawStreams = await runLocalDiscoveryFallback(tmdbId, mediaType, season, episode);
  }

  return uniqueExactStreams(rawStreams);
}

module.exports = { getStreams, WORKER_BASE, fetchWorkerData, resolveDeviceCandidate, runLocalDiscoveryFallback };
