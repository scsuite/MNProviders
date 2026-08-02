const CryptoJS = require('crypto-js');
const sharedMetadata = require('../shared/metadata');
const { parseQuality, uniqueExactStreams } = require('../shared/streams');

const MIRRORS = [
  'https://api3.aoneroom.com',
  'https://api4.aoneroom.com',
  'https://api4sg.aoneroom.com',
  'https://api5.aoneroom.com',
  'https://api6.aoneroom.com'
];

const BOOTSTRAP_PATH = '/wefeed-mobile-bff/tab/ranking-list?tabId=0&categoryType=4516404531735022304&page=1&perPage=1';
const SEARCH_PATH = '/wefeed-mobile-bff/subject-api/search/v2';
const SUBJECT_PATH = '/wefeed-mobile-bff/subject-api/get?subjectId=';
const SEASON_PATH = '/wefeed-mobile-bff/subject-api/season-info?subjectId=';
const PLAY_PATH = '/wefeed-mobile-bff/subject-api/play-info?subjectId=';
const CAPTION_PATHS = [
  '/wefeed-mobile-bff/subject-api/get-ext-captions?subjectId=',
  '/wefeed-mobile-bff/subject-api/get-stream-captions?subjectId='
];

const DEFAULT_SECRET = CryptoJS.enc.Base64.parse('8NzZpUmwwN3MweFNOOWpxbUVXQXQ3OUVCSlp1bElRSXNWNjRGWnIyTw==');
const TOKEN_CACHE = new Map();

const BOOTSTRAP_CLIENT = Object.freeze({
  package_name: 'com.community.oneroom', version_name: '3.0.13.0325.03', version_code: 50020088,
  os: 'android', os_version: '13', device_id: 'd7578036d13336cc', install_store: 'ps',
  system_language: 'en', net: 'NETWORK_WIFI', region: 'US', timezone: 'Asia/Calcutta', sp_code: ''
});
const MAIN_CLIENT = Object.freeze({
  package_name: 'com.community.mbox.in', version_name: '3.0.03.0529.03', version_code: 50020042,
  os: 'android', os_version: '16', device_id: 'd7578036d13336cc', install_store: 'ps',
  gaid: 'd7578036d13336cc', brand: 'google', model: 'Pixel 7', system_language: 'en',
  net: 'NETWORK_WIFI', region: 'IN', timezone: 'Asia/Calcutta', sp_code: ''
});
const BOOTSTRAP_UA = 'com.community.oneroom/50020088 (Linux; U; Android 13; en_US; Pixel 7; Build/TQ3A.230901.001; Cronet/145.0.7582.0)';
const MAIN_UA = 'com.community.mbox.in/50020042 (Linux; U; Android 16; en_IN; sdk_gphone64_x86_64; Build/BP22.250325.006; Cronet/133.0.6876.3)';

function md5Hex(value) {
  return CryptoJS.MD5(value).toString(CryptoJS.enc.Hex);
}

function utf8First500(value) {
  const words = CryptoJS.enc.Utf8.parse(String(value || ''));
  if (words.sigBytes > 500) {
    words.sigBytes = 500;
    words.clamp();
  }
  return words;
}

function canonicalRequest(method, pathWithQuery, body, timestamp) {
  const parsed = new URL(pathWithQuery, 'https://moviebox.invalid');
  const pairs = [];
  parsed.searchParams.forEach((value, key) => pairs.push([key, value]));
  pairs.sort((left, right) => left[0].localeCompare(right[0]));
  const query = pairs.map(([key, value]) => `${key}=${value}`).join('&');
  const bodyHash = body ? CryptoJS.MD5(utf8First500(body)).toString(CryptoJS.enc.Hex) : '';
  return `${String(method).toUpperCase()}\n${parsed.pathname}\n${query}\n${bodyHash}\n${timestamp}`;
}

function signedHeaders(method, pathWithQuery, body = '', token = null, bootstrap = false) {
  const timestamp = Date.now();
  const reversedTimestamp = String(timestamp).split('').reverse().join('');
  const clientToken = `${md5Hex(reversedTimestamp)}_${timestamp}`;
  const canonical = canonicalRequest(method, pathWithQuery, body, timestamp);
  const signature = `${CryptoJS.enc.Base64.stringify(CryptoJS.HmacMD5(canonical, DEFAULT_SECRET))}|2|${timestamp}`;
  return {
    'User-Agent': bootstrap ? BOOTSTRAP_UA : MAIN_UA,
    Accept: 'application/json',
    'Content-Type': bootstrap ? 'application/json' : 'application/json; charset=utf-8',
    'x-client-token': clientToken,
    'x-tr-signature': signature,
    'x-client-info': JSON.stringify(bootstrap ? BOOTSTRAP_CLIENT : MAIN_CLIENT),
    'x-client-status': '0',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function safeJson(text) {
  try { return JSON.parse(text); } catch (_) { return null; }
}

function deepValues(value, visitor, depth = 0) {
  if (depth > 12 || value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach(item => deepValues(item, visitor, depth + 1));
    return;
  }
  if (typeof value !== 'object') return;
  visitor(value);
  Object.values(value).forEach(item => deepValues(item, visitor, depth + 1));
}

function normalizeTitle(value) {
  return String(value || '').toLowerCase().replace(/\b(?:the|a|an)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleScore(target, candidate, wantedYear) {
  const left = normalizeTitle(target);
  const right = normalizeTitle(candidate);
  if (!left || !right) return 0;
  let score = left === right ? 10 : right.includes(left) || left.includes(right) ? 7 : 0;
  if (!score) {
    const leftWords = left.split(' ');
    const rightWords = new Set(right.split(' '));
    const overlap = leftWords.filter(word => rightWords.has(word)).length;
    score = overlap / Math.max(leftWords.length, 1) >= 0.75 ? 5 : 0;
  }
  if (wantedYear && new RegExp(`\\b${wantedYear}\\b`).test(String(candidate))) score += 2;
  return score;
}

function findBestSubject(payload, metadata, mediaType) {
  const candidates = [];
  deepValues(payload, object => {
    const id = object.subjectId || object.subject_id || object.id;
    const title = object.title || object.name || object.subjectTitle || object.originalTitle;
    if (!id || !title) return;
    let score = titleScore(metadata.title, title, metadata.year);
    const kind = String(object.subjectType || object.subject_type || object.type || object.detailKind || '').toLowerCase();
    if (mediaType === 'tv' && /tv|series|show/.test(kind)) score += 1;
    if (mediaType === 'movie' && /movie|film/.test(kind)) score += 1;
    candidates.push({ id: String(id), title: String(title), score, raw: object });
  });
  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.score > 0 ? candidates[0] : null;
}

function responseToken(response, payload) {
  const raw = response.headers?.get?.('x-user') || response.headers?.get?.('X-User');
  const header = raw ? safeJson(raw) : null;
  if (header?.token) return header.token;
  let token = null;
  deepValues(payload, object => {
    if (!token && typeof object.token === 'string' && object.token.length > 20) token = object.token;
  });
  return token;
}

async function apiRequest(mirror, path, { method = 'GET', body = '', token = null, bootstrap = false } = {}) {
  const response = await fetch(`${mirror}${path}`, {
    method,
    headers: signedHeaders(method, path, body, token, bootstrap),
    ...(body ? { body } : {})
  });
  const text = await response.text();
  return { response, payload: safeJson(text), text };
}

async function bootstrapMirror(mirror) {
  const cached = TOKEN_CACHE.get(mirror);
  if (cached) return cached;
  const result = await apiRequest(mirror, BOOTSTRAP_PATH, { bootstrap: true });
  if (!result.response.ok) throw new Error(`bootstrap HTTP ${result.response.status}`);
  const token = responseToken(result.response, result.payload);
  if (!token) throw new Error('bootstrap token missing');
  TOKEN_CACHE.set(mirror, token);
  return token;
}

async function searchMirror(mirror, token, metadata, mediaType) {
  const body = JSON.stringify({ page: 1, perPage: 20, keyword: metadata.title });
  const result = await apiRequest(mirror, SEARCH_PATH, { method: 'POST', body, token });
  if (result.response.status === 441) TOKEN_CACHE.delete(mirror);
  if (!result.response.ok) throw new Error(`search HTTP ${result.response.status}`);
  if (!result.payload) throw new Error('search invalid JSON');
  return findBestSubject(result.payload, metadata, mediaType);
}

function findEpisodeHints(payload, season, episode) {
  const hints = [];
  deepValues(payload, object => {
    const seasonValue = Number(object.season || object.seasonNumber || object.se || object.season_number);
    const episodeValue = Number(object.episode || object.episodeNumber || object.ep || object.episode_number);
    if (seasonValue && seasonValue !== Number(season)) return;
    if (episodeValue && episodeValue !== Number(episode)) return;
    const streamId = object.streamId || object.stream_id || object.id;
    const subjectId = object.subjectId || object.subject_id;
    if (streamId || subjectId || episodeValue) hints.push({ streamId, subjectId });
  });
  return hints;
}

function playPaths(subjectId, mediaType, season, episode, seasonPayload) {
  if (mediaType !== 'tv') {
    return [
      `${PLAY_PATH}${encodeURIComponent(subjectId)}&episode=0`,
      `${PLAY_PATH}${encodeURIComponent(subjectId)}&se=0&ep=0`
    ];
  }
  const hints = findEpisodeHints(seasonPayload, season, episode);
  const values = [];
  for (const hint of hints) {
    const id = hint.subjectId || subjectId;
    const stream = hint.streamId ? `&streamId=${encodeURIComponent(hint.streamId)}` : '';
    values.push(`${PLAY_PATH}${encodeURIComponent(id)}&se=${Number(season)}&ep=${Number(episode)}${stream}`);
  }
  values.push(`${PLAY_PATH}${encodeURIComponent(subjectId)}&se=${Number(season)}&ep=${Number(episode)}`);
  return [...new Set(values)];
}

function isMediaUrl(value) {
  if (!/^https?:\/\//i.test(String(value || ''))) return false;
  return !/\.(?:jpg|jpeg|png|webp|gif|svg|vtt|srt)(?:$|[?#])/i.test(value);
}

function extractStreams(payload, metadata, mediaType, season, episode) {
  const streams = [];
  deepValues(payload, object => {
    const possibleUrls = [object.streamUrl, object.playUrl, object.videoUrl, object.file, object.url, object.m3u8, object.dash];
    for (const url of possibleUrls) {
      if (!isMediaUrl(url)) continue;
      const descriptor = [object.resolution, object.quality, object.label, object.name, object.title, url].filter(Boolean).join(' ');
      const streamQuality = parseQuality(descriptor);
      streams.push({
        name: `MovieBox • ${streamQuality} • Direct`,
        title: `${metadata.title}${mediaType === 'tv' ? ` S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}` : metadata.year ? ` (${metadata.year})` : ''}`,
        url: String(url), quality: streamQuality, source: 'MovieBox Direct', provider: 'MovieBox',
        headers: { 'User-Agent': MAIN_UA }, subtitles: [], seekable: /\.m3u8(?:$|[?#])/i.test(url) ? true : 'unknown'
      });
    }
  });
  return uniqueExactStreams(streams);
}

function extractSubtitles(payload) {
  const subtitles = [];
  const seen = new Set();
  deepValues(payload, object => {
    const url = object.captionUrl || object.subtitleUrl || object.file || object.url;
    if (!/^https?:\/\//i.test(String(url || '')) || !/subtitle|caption|\.srt|\.vtt/i.test(`${url} ${object.type || ''}`)) return;
    if (seen.has(url)) return;
    seen.add(url);
    subtitles.push({ url, language: object.language || object.lang || object.label || 'Unknown' });
  });
  return subtitles;
}

async function resolveSubject(mirror, token, subject, metadata, mediaType, season, episode) {
  let seasonPayload = null;
  if (mediaType === 'tv') {
    const seasonResult = await apiRequest(mirror, `${SEASON_PATH}${encodeURIComponent(subject.id)}`, { token });
    seasonPayload = seasonResult.payload;
  }
  let streams = [];
  const playStatuses = [];
  for (const path of playPaths(subject.id, mediaType, season, episode, seasonPayload)) {
    const result = await apiRequest(mirror, path, { token });
    playStatuses.push(result.response.status);
    if (!result.response.ok || !result.payload) continue;
    streams = extractStreams(result.payload, metadata, mediaType, season, episode);
    if (streams.length) break;
  }
  if (!streams.length) {
    throw new Error(`play no streams (HTTP ${playStatuses.join('/') || 'no response'})`);
  }

  const subtitlePayloads = await Promise.all(CAPTION_PATHS.map(async prefix => {
    try { return (await apiRequest(mirror, `${prefix}${encodeURIComponent(subject.id)}`, { token })).payload; }
    catch (_) { return null; }
  }));
  const subtitles = subtitlePayloads.flatMap(extractSubtitles);
  return streams.map(stream => ({ ...stream, subtitles }));
}

function diagnosticStream(mirror, message, metadata, mediaType, season, episode, index) {
  const host = new URL(mirror).hostname;
  const detail = String(message || 'unknown failure').replace(/\s+/g, ' ').slice(0, 90);
  return {
    name: `MovieBox DIAG | ${host} | ${detail}`,
    title: `Diagnostic only: ${metadata.title}${mediaType === 'tv' ? ` S${season}E${episode}` : ''}`,
    url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4?moviebox_diag=${index}`,
    quality: '1080p',
    size: 'Diagnostic',
    source: `DIAG ${host}: ${detail}`,
    provider: 'MovieBox',
    headers: { 'User-Agent': MAIN_UA },
    subtitles: [],
    seekable: true
  };
}

async function getStreams(tmdbId, mediaType = 'movie', season = 1, episode = 1) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  if (!tmdbId || (type === 'tv' && (!season || !episode))) return [];
  let metadata;
  try {
    metadata = await sharedMetadata.getMetadata(tmdbId, type);
  } catch (error) {
    return [diagnosticStream(
      'https://metadata.moviebox.invalid',
      `metadata failure: ${error?.message || error}`,
      { title: `TMDB ${tmdbId}` }, type, season, episode, 90
    )];
  }
  if (!metadata?.title) {
    return [diagnosticStream(
      'https://metadata.moviebox.invalid', 'metadata title missing',
      { title: `TMDB ${tmdbId}` }, type, season, episode, 91
    )];
  }

  const diagnostics = [];
  for (const [index, mirror] of MIRRORS.entries()) {
    try {
      const token = await bootstrapMirror(mirror);
      const subject = await searchMirror(mirror, token, metadata, type);
      if (!subject) {
        diagnostics.push(diagnosticStream(mirror, 'search OK; no matching title', metadata, type, season, episode, index));
        continue;
      }
      const streams = await resolveSubject(mirror, token, subject, metadata, type, season, episode);
      if (streams.length) return streams;
    } catch (error) {
      const message = error?.message || String(error);
      console.log(`[MovieBox ${new URL(mirror).hostname}] ${message}`);
      diagnostics.push(diagnosticStream(mirror, message, metadata, type, season, episode, index));
    }
  }
  return diagnostics;
}

module.exports = {
  MIRRORS, canonicalRequest, signedHeaders, findBestSubject, extractStreams,
  extractSubtitles, playPaths, diagnosticStream, getStreams
};
