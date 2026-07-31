import moviesDriveModule from '../../src/moviesdrive/index.js';
import vegaMoviesModule from '../../src/providers/vegamovies.js';
import castleModule from '../../src/providers/castle.js';

const VERSION = '1.0.1';
const DEFAULT_TIMEOUT_MS = 12000;
const CACHE_SECONDS = 21600;
const PARTIAL_CACHE_SECONDS = 300;
const PROVIDERS = {
  moviesdrive: moviesDriveModule.getStreams,
  // Keep the combined request below Cloudflare Free's subrequest ceiling.
  vegamovies: (tmdbId, type, season, episode) =>
    vegaMoviesModule.getStreams(tmdbId, type, season, episode, { maxReleases: 4 }),
  castle: castleModule.getStreams
};

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

function qualityValue(value) {
  const text = String(value || '').toLowerCase();
  if (/4k|2160/.test(text)) return 2160;
  const match = text.match(/(1080|720|480|360|240)/);
  return match ? Number(match[1]) : 0;
}

function displayQuality(value) {
  const rank = qualityValue(value);
  return rank === 2160 ? '4K' : rank ? `${rank}p` : 'Unknown';
}

function sourceName(stream, provider) {
  return stream.source || stream.provider || provider;
}

function normalizeStream(stream, provider) {
  if (!stream || !stream.url) return null;
  const quality = displayQuality(stream.quality || stream.name || stream.title);
  const source = sourceName(stream, provider);
  const order = { '4K': '01', '1080p': '02', '720p': '03', '480p': '04', '360p': '05', '240p': '06' };
  return {
    ...stream,
    name: `${order[quality] || '99'} • ${quality} • ${source}`,
    quality,
    source,
    provider,
    headers: stream.headers || {},
    subtitles: Array.isArray(stream.subtitles) ? stream.subtitles : []
  };
}

function sortAndUnique(streams) {
  const seen = new Set();
  return streams
    .map(item => normalizeStream(item.stream, item.provider))
    .filter(stream => {
      if (!stream) return false;
      const key = `${stream.quality}|${stream.source}|${stream.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => qualityValue(b.quality) - qualityValue(a.quality));
}

function deadline(promise, milliseconds, provider) {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve({ provider, streams: [], error: `timeout after ${milliseconds}ms` }), milliseconds);
  });
  return Promise.race([
    Promise.resolve(promise)
      .then(streams => ({ provider, streams: Array.isArray(streams) ? streams : [], error: null }))
      .catch(error => ({ provider, streams: [], error: error?.message || String(error) })),
    timeout
  ]).finally(() => clearTimeout(timer));
}

async function runProviders(params) {
  const jobs = params.providers.map(provider => deadline(
    PROVIDERS[provider](params.tmdbId, params.type, params.season, params.episode),
    params.timeout,
    provider
  ));
  const settled = await Promise.all(jobs);
  const streams = sortAndUnique(settled.flatMap(result =>
    result.streams.map(stream => ({ provider: result.provider, stream }))
  ));
  return {
    streams,
    providers: Object.fromEntries(settled.map(result => [result.provider, {
      count: result.streams.length,
      error: result.error
    }]))
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
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get('content-type'),
      bytes: body.length,
      elapsedMs: Date.now() - started,
      preview: body.slice(0, 160).replace(/\s+/g, ' ')
    };
  } catch (error) {
    return { ok: false, error: error?.message || String(error), elapsedMs: Date.now() - started };
  }
}

async function diagnostics() {
  const moviesDriveUrl = 'https://new1.moviesdrive.christmas/search.php?q=tt9288030&page=1';
  const domainsUrl = 'https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json';
  const [tmdb, moviesdrive, domains] = await Promise.all([
    probe('https://api.themoviedb.org/3/tv/108978?api_key=439c478a771f35c05022f9feabcca01c'),
    probe(moviesDriveUrl, 'https://new1.moviesdrive.christmas/'),
    probe(domainsUrl)
  ]);
  let vegamovies = { ok: false, error: 'Vega domain unavailable' };
  if (domains.ok) {
    try {
      const response = await fetch(domainsUrl);
      const domain = String((await response.json()).vegamovies || '').replace(/\/$/, '');
      if (domain) vegamovies = await probe(`${domain}/search.php?q=tt9288030`, domain);
    } catch (error) {
      vegamovies = { ok: false, error: error?.message || String(error) };
    }
  }
  return { tmdb, moviesdrive, domains, vegamovies };
}

function parseRequest(url, env) {
  const tmdbId = String(url.searchParams.get('tmdbId') || url.searchParams.get('id') || '').replace(/^tmdb:/i, '');
  const type = normalizeType(url.searchParams.get('type'));
  const season = Number(url.searchParams.get('season') || 1);
  const episode = Number(url.searchParams.get('episode') || 1);
  const requested = String(url.searchParams.get('providers') || 'moviesdrive,vegamovies,castle')
    .toLowerCase().split(',').map(value => value.trim()).filter(value => PROVIDERS[value]);
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
  const result = await runProviders(params);
  const payload = {
    ok: true,
    version: VERSION,
    query: { tmdbId: params.tmdbId, type: params.type, season: params.season, episode: params.episode },
    elapsedMs: Date.now() - started,
    count: result.streams.length,
    streams: result.streams,
    providers: result.providers
  };
  const complete = params.providers.every(provider => result.providers[provider]?.count > 0);
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
    return json({ ok: true, service: 'MNProviders Resolver', version: VERSION, providers: Object.keys(PROVIDERS) });
  }
  if (url.pathname === '/diagnostics') {
    return json({ ok: true, version: VERSION, probes: await diagnostics() }, 200, { 'Cache-Control': 'no-store' });
  }
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
