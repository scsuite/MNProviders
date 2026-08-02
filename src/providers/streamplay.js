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
const CANDIDATE_TIMEOUT_MS = 4500;
const DEVICE_DISCOVERY_TIMEOUT_MS = 6500;
const FALLBACK_RESOLUTION_TIMEOUT_MS = 2500;
const DEVICE_RESOLUTION_CONCURRENCY = 32;
const DEVICE_PROVIDER_IDS = ['moviesdrive', 'vegamovies', 'movies4u', '4khdhub', 'multimovies', 'hdhub4u'];

function withTimeout(promise, milliseconds = CANDIDATE_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve([]), milliseconds);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
}

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

function resolveCandidateBounded(candidate) {
  return withTimeout(resolveDeviceCandidate(candidate));
}

function resolveFallbackCandidate(candidate) {
  return withTimeout(resolveDeviceCandidate(candidate), FALLBACK_RESOLUTION_TIMEOUT_MS);
}

function deviceDiscoverers() {
  return {
    moviesdrive: mdModule.discoverCandidates || mdModule.default?.discoverCandidates,
    vegamovies: vegaModule.discoverCandidates || vegaModule.default?.discoverCandidates,
    movies4u: movies4uModule.discoverCandidates || movies4uModule.default?.discoverCandidates,
    '4khdhub': fourkHDHubModule.discoverCandidates || fourkHDHubModule.default?.discoverCandidates,
    multimovies: multiMoviesModule.discoverCandidates || multiMoviesModule.default?.discoverCandidates,
    hdhub4u: hdHub4uModule.discoverCandidates || hdHub4uModule.default?.discoverCandidates
  };
}

async function discoverOnDevice(providerIds, tmdbId, mediaType, season, episode) {
  const discoverers = deviceDiscoverers();
  const selected = [...new Set(providerIds)].filter(id => DEVICE_PROVIDER_IDS.includes(id) && typeof discoverers[id] === 'function');
  const groups = await Promise.all(selected.map(id => withTimeout(
    Promise.resolve(discoverers[id](tmdbId, mediaType, season, episode)).catch(() => []),
    DEVICE_DISCOVERY_TIMEOUT_MS
  )));
  return groups.flat().filter(candidate => candidate?.url);
}

async function runLocalDiscoveryFallback(tmdbId, mediaType, season, episode) {
  const [candidates, castleStreams] = await Promise.all([
    discoverOnDevice(DEVICE_PROVIDER_IDS, tmdbId, mediaType, season, episode),
    withTimeout(typeof getCastleStreams === 'function' ? getCastleStreams(tmdbId, mediaType, season, episode) : [], DEVICE_DISCOVERY_TIMEOUT_MS)
  ]);
  const resolved = await mapConcurrent(candidates, DEVICE_RESOLUTION_CONCURRENCY, resolveCandidateBounded);
  return [
    ...(Array.isArray(castleStreams) ? castleStreams.map(stream => ({ ...stream, provider: 'castle', source: stream.source || stream.name || 'Castle' })) : []),
    ...resolved.flat().filter(Boolean)
  ];
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

    const fallbackProviderIds = workerData.providers
      ? DEVICE_PROVIDER_IDS.filter(id => {
          const state = workerData.providers[id];
          const failed = Boolean(state?.error) || /^(blocked|timeout|error)$/i.test(String(state?.status || ''));
          const devicePreferredEmpty = id === '4khdhub' && Number(state?.count || 0) === 0;
          return !state || failed || devicePreferredEmpty;
        })
      : DEVICE_PROVIDER_IDS;
    // Successful Worker discovery remains fast. Only empty/blocked/error
    // providers repeat discovery on the current device's network IP.
    const workerResolutionJob = mapConcurrent(workerData.candidates || [], DEVICE_RESOLUTION_CONCURRENCY, resolveCandidateBounded);
    const localFallbackJob = (async () => {
      const localCandidates = await discoverOnDevice(fallbackProviderIds, tmdbId, mediaType, season, episode);
      return mapConcurrent(localCandidates, DEVICE_RESOLUTION_CONCURRENCY, resolveFallbackCandidate);
    })();
    const [workerResolved, localResolved] = await Promise.all([workerResolutionJob, localFallbackJob]);
    const resolvedCandidates = [...workerResolved, ...localResolved];
    rawStreams = [
      ...directStreams,
      ...resolvedCandidates.flat().filter(Boolean)
    ];
  } else {
    const deviceCandidates = await discoverOnDevice(DEVICE_PROVIDER_IDS, tmdbId, mediaType, season, episode);
    const [resolvedCandidates, castleStreams] = await Promise.all([
      mapConcurrent(deviceCandidates, DEVICE_RESOLUTION_CONCURRENCY, resolveCandidateBounded),
      withTimeout(typeof getCastleStreams === 'function' ? getCastleStreams(tmdbId, mediaType, season, episode) : [], DEVICE_DISCOVERY_TIMEOUT_MS)
    ]);
    rawStreams = [
      ...(Array.isArray(castleStreams) ? castleStreams.map(stream => ({ ...stream, provider: 'castle', source: stream.source || stream.name || 'Castle' })) : []),
      ...resolvedCandidates.flat().filter(Boolean)
    ];
  }

  return uniqueExactStreams(rawStreams);
}

module.exports = { getStreams, WORKER_BASE, fetchWorkerData, resolveDeviceCandidate, resolveCandidateBounded, discoverOnDevice, runLocalDiscoveryFallback };
