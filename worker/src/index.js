import moviesDriveModule from '../../src/moviesdrive/index.js';
import vegaMoviesModule from '../../src/providers/vegamovies.js';
import movies4uModule from '../../src/providers/movies4u.js';
import castleModule from '../../src/providers/castle.js';
import domainConfig from '../../src/config/domains.js';

const VERSION = '1.0.9';
const DEFAULT_TIMEOUT_MS = 12000;
const CACHE_SECONDS = 21600;
const PARTIAL_CACHE_SECONDS = 300;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Resolver-Key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

function normalizeType(value) {
  return /^(tv|series|show)$/i.test(String(value || '')) ? 'tv' : 'movie';
}

function isAllowedMediaRedirect(target) {
  try {
    const parsed = new URL(target);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === 'https:' &&
      (host === 'r2.cloudflarestorage.com' || host.endsWith('.r2.cloudflarestorage.com'));
  } catch (_) {
    return false;
  }
}

function mediaRedirect(url) {
  const target = url.searchParams.get('url') || '';
  if (!isAllowedMediaRedirect(target)) {
    return json({ ok: false, error: 'Unsupported media redirect target' }, 400, { 'Cache-Control': 'no-store' });
  }
  return new Response(null, {
    status: 307,
    headers: {
      ...corsHeaders,
      Location: target,
      'Cache-Control': 'no-store, private',
      'X-MNProviders-Media-Redirect': 'FSL-MKV'
    }
  });
}

function deadline(promise, milliseconds, provider) {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve({ provider, data: [], error: `timeout after ${milliseconds}ms` }), milliseconds);
  });
  return Promise.race([
    Promise.resolve(promise)
      .then(data => ({ provider, data: Array.isArray(data) ? data : [], error: null }))
      .catch(error => ({ provider, data: [], error: error?.message || String(error) })),
    timeout
  ]).finally(() => clearTimeout(timer));
}

async function runWorkerDiscovery(params) {
  const castleJob = params.providers.includes('castle')
    ? deadline(castleModule.getStreams(params.tmdbId, params.type, params.season, params.episode), params.timeout, 'castle')
    : Promise.resolve({ provider: 'castle', data: [], error: null });

  const mdJob = params.providers.includes('moviesdrive')
    ? deadline(moviesDriveModule.discoverCandidates(params.tmdbId, params.type, params.season, params.episode), params.timeout, 'moviesdrive')
    : Promise.resolve({ provider: 'moviesdrive', data: [], error: null });

  const vegaJob = params.providers.includes('vegamovies')
    ? deadline(vegaMoviesModule.discoverCandidates(params.tmdbId, params.type, params.season, params.episode), params.timeout, 'vegamovies')
    : Promise.resolve({ provider: 'vegamovies', data: [], error: null });

  const movies4uJob = params.providers.includes('movies4u')
    ? deadline(movies4uModule.discoverCandidates(params.tmdbId, params.type, params.season, params.episode), params.timeout, 'movies4u')
    : Promise.resolve({ provider: 'movies4u', data: [], error: null });

  const [castleRes, mdRes, vegaRes, movies4uRes] = await Promise.all([castleJob, mdJob, vegaJob, movies4uJob]);

  const directStreams = castleRes.data.map(stream => ({
    ...stream,
    provider: 'castle',
    resolverType: 'direct'
  }));

  const candidates = [...mdRes.data, ...vegaRes.data, ...movies4uRes.data];

  return {
    directStreams,
    candidates,
    providers: {
      castle: { count: castleRes.data.length, error: castleRes.error },
      moviesdrive: { count: mdRes.data.length, error: mdRes.error },
      vegamovies: { count: vegaRes.data.length, error: vegaRes.error },
      movies4u: { count: movies4uRes.data.length, error: movies4uRes.error }
    }
  };
}

async function probe(url, referer) {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36',
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
        ...(referer ? { Referer: referer } : {})
      }
    });
    const body = await response.text();
    const isCF = response.status === 403 || /just a moment|cf-chl|turnstile|challenge-running/i.test(body);
    let finalHost = '';
    try { finalHost = new URL(response.url).hostname; } catch (_) {}
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      finalHost,
      contentType: response.headers.get('content-type'),
      cloudflareChallenge: isCF,
      bytes: body.length,
      elapsedMs: Date.now() - started
    };
  } catch (error) {
    return { ok: false, error: error?.message || String(error), elapsedMs: Date.now() - started };
  }
}


async function diagnostics() {
  const domainsUrl = domainConfig.PHISHER_DOMAINS;
  const [tmdb, domains, moviesdriveFallback, vegaRelease] = await Promise.all([
    probe(`${domainConfig.TMDB_API}/tv/108978?api_key=439c478a771f35c05022f9feabcca01c`),
    probe(domainsUrl),
    probe(`${domainConfig.MOVIESDRIVE_FALLBACK}/search.php?q=Reacher&page=1`, `${domainConfig.MOVIESDRIVE_FALLBACK}/`),
    probe(`${domainConfig.NEXDRIVE}/genxfm784776338494/`, `${domainConfig.VEGAMOVIES_FALLBACK}/`)
  ]);
  let moviesdrive = { ok: false, error: 'MoviesDrive domain unavailable' };
  let vegamovies = { ok: false, error: 'Vega domain unavailable' };
  let vegaDetail = { ok: false, error: 'Vega detail unavailable' };
  if (domains.ok) {
    try {
      const response = await fetch(domainsUrl);
      const configured = await response.json();
      const moviesDomain = String(configured.moviesdrive || '').replace(/\/$/, '');
      const vegaDomain = String(configured.vegamovies || '').replace(/\/$/, '');
      if (moviesDomain) moviesdrive = await probe(`${moviesDomain}/search.php?q=tt9288030&page=1`, moviesDomain);
      if (vegaDomain) {
        vegamovies = await probe(`${vegaDomain}/search.php?q=tt9288030`, vegaDomain);
        vegaDetail = await probe(`${vegaDomain}/download-reacher-season-1-3-amazon-original-complete-org-5-1-hindi-480p-720p-1080p-web-dl/`, vegaDomain);
      }
    } catch (error) {
      vegamovies = { ok: false, error: error?.message || String(error) };
    }
  }
  return { tmdb, domains, moviesdrive, moviesdriveFallback, vegamovies, vegaDetail, vegaRelease };
}

function parseRequest(url, env) {
  const tmdbId = String(url.searchParams.get('tmdbId') || url.searchParams.get('id') || '').replace(/^tmdb:/i, '');
  const type = normalizeType(url.searchParams.get('type'));
  const season = Number(url.searchParams.get('season') || 1);
  const episode = Number(url.searchParams.get('episode') || 1);
  const requested = String(url.searchParams.get('providers') || 'moviesdrive,vegamovies,movies4u,castle')
    .toLowerCase().split(',').map(value => value.trim()).filter(value => ['moviesdrive', 'vegamovies', 'movies4u', 'castle'].includes(value));
  const configuredTimeout = Number(env?.PROVIDER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  return {
    tmdbId,
    type,
    season,
    episode,
    providers: [...new Set(requested)],
    timeout: Math.min(20000, Math.max(3000, configuredTimeout))
  };
}

async function cachedResponse(request, env, ctx, params) {
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheUrl = new URL(request.url);
  cacheUrl.searchParams.sort();
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
  const hit = cache ? await cache.match(cacheKey) : null;
  if (hit) {
    const response = new Response(hit.body, hit);
    response.headers.set('X-MNProviders-Cache', 'HIT');
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  const started = Date.now();
  const result = await runWorkerDiscovery(params);
  const totalCount = result.directStreams.length + result.candidates.length;
  const payload = {
    ok: true,
    version: VERSION,
    query: { tmdbId: params.tmdbId, type: params.type, season: params.season, episode: params.episode },
    elapsedMs: Date.now() - started,
    count: totalCount,
    directStreams: result.directStreams,
    candidates: result.candidates,
    providers: result.providers
  };
  const complete = params.providers.every(provider => (result.providers[provider]?.count || 0) > 0);
  const cacheSeconds = complete ? CACHE_SECONDS : PARTIAL_CACHE_SECONDS;
  const response = json(payload, 200, {
    'Cache-Control': `public, max-age=${cacheSeconds}`,
    'X-MNProviders-Cache': 'MISS'
  });
  if (cache && ctx?.waitUntil) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export async function handleRequest(request, env = {}, ctx = {}) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'GET') return json({ ok: false, error: 'GET only' }, 405);

  const url = new URL(request.url);
  if (url.pathname === '/' || url.pathname === '/health') {
    return json({ ok: true, service: 'MNProviders Resolver', version: VERSION, providers: ['moviesdrive', 'vegamovies', 'movies4u', 'castle'] });
  }
  if (url.pathname === '/diagnostics') {
    return json({ ok: true, version: VERSION, probes: await diagnostics() }, 200, { 'Cache-Control': 'no-store' });
  }
  if (url.pathname === '/media/file.mkv') return mediaRedirect(url);
  if (url.pathname !== '/streams') return json({ ok: false, error: 'Not found' }, 404);

  if (env.RESOLVER_KEY && request.headers.get('X-Resolver-Key') !== env.RESOLVER_KEY) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }

  const params = parseRequest(url, env);
  if (!/^\d+$/.test(params.tmdbId)) return json({ ok: false, error: 'Valid tmdbId is required' }, 400);
  if (!params.providers.length) return json({ ok: false, error: 'No valid providers requested' }, 400);
  if (params.type === 'tv' && (!params.season || !params.episode)) {
    return json({ ok: false, error: 'season and episode are required for TV' }, 400);
  }
  return cachedResponse(request, env, ctx, params);
}

export default { fetch: handleRequest };
