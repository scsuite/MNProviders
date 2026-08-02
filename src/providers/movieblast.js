const CryptoJS = require('crypto-js');
const DOMAINS = require('../config/domains');
const sharedMetadata = require('../shared/metadata');
const { uniqueExactStreams } = require('../shared/streams');

const TOKEN = 'jdvhhjv255vghhghdhvfch2565656jhdcghfdf';
const APP_ID = 'com.movieblast';
const SIGN_SECRET = 'GJ8reydarI7Jqat9rvbAJKNQ9gY4DoEQF2H5nfuI1gi';
const HEADERS = { 'User-Agent': 'okhttp/5.0.0-alpha.6', 'x-request-x': APP_ID };
const SEARCH_HEADERS = {
  ...HEADERS,
  hash256: '86dc03244adddb3cbedbf0ae36074a736ee293a64774b18e82a6244eafd0df30',
  packagename: APP_ID
};
const PLAYBACK_HEADERS = {
  'Accept-Encoding': 'identity', Connection: 'Keep-Alive', 'Icy-MetaData': '1',
  Referer: 'MovieBlast', 'User-Agent': 'MovieBlast', 'x-request-x': APP_ID
};

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
function normalized(value) {
  return clean(value).toLowerCase().replace(/\b(?:the|a|an)\b/g, '').replace(/[:\-_]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}
function similarity(left, right) {
  const a = normalized(left);
  const b = normalized(right);
  if (a === b) return 1;
  const first = a.split(/\s+/).filter(Boolean);
  const second = b.split(/\s+/).filter(Boolean);
  if (!first.length || !second.length) return 0;
  const secondSet = new Set(second);
  const union = new Set(first.concat(second));
  return first.filter(word => secondSet.has(word)).length / union.size;
}
function selectResult(info, results, mediaType) {
  let best = null;
  let bestScore = 0;
  for (const item of results || []) {
    let score = similarity(info.title, item.name);
    const resultYear = Number(String(item.release_date || '').slice(0, 4));
    if (info.year && resultYear === Number(info.year)) score += 0.2;
    const isSeries = /serie/i.test(String(item.type || ''));
    if ((mediaType === 'tv') === isSeries) score += 0.15;
    else score -= 0.25;
    if (score > bestScore && score > 0.4) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}
function quality(value) {
  const text = String(value || '').toLowerCase();
  if (/2160|4k/.test(text)) return '4K';
  if (/1440|2k/.test(text)) return '1440p';
  const match = text.match(/(1080|720|480|360|240)/);
  return match ? `${match[1]}p` : 'Unknown';
}
function signedUrl(rawUrl) {
  try {
    const value = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(value);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(parsed.pathname + timestamp, SIGN_SECRET));
    return `${value}${value.includes('?') ? '&' : '?'}verify=${timestamp}-${encodeURIComponent(signature)}`;
  } catch (_) { return rawUrl; }
}

async function getStreams(tmdbId, mediaType = 'movie', season = 1, episode = 1) {
  try {
    const type = mediaType === 'tv' ? 'tv' : 'movie';
    const info = await sharedMetadata.getMetadata(tmdbId, type);
    if (!info?.title) return [];
    const searchResponse = await fetch(`${DOMAINS.MOVIEBLAST_API}/api/search/${encodeURIComponent(info.title)}/${TOKEN}`, { headers: SEARCH_HEADERS });
    if (!searchResponse.ok) return [];
    const searchPayload = await searchResponse.json();
    const match = selectResult(info, searchPayload?.search || [], type);
    if (!match?.id) return [];

    const isSeries = type === 'tv' || /serie/i.test(String(match.type || ''));
    const detailPath = isSeries ? 'series/show' : 'media/detail';
    const detailResponse = await fetch(`${DOMAINS.MOVIEBLAST_API}/api/${detailPath}/${match.id}/${TOKEN}`, { headers: HEADERS });
    if (!detailResponse.ok) return [];
    const detail = await detailResponse.json();
    let videos = detail?.videos || [];
    if (isSeries) {
      const selectedSeason = (detail?.seasons || []).find(item => Number(item.season_number) === Number(season));
      const selectedEpisode = (selectedSeason?.episodes || []).find(item => Number(item.episode_number) === Number(episode));
      videos = selectedEpisode?.videos || [];
    }

    const streams = [];
    for (const video of videos) {
      if (!video?.link) continue;
      const streamQuality = quality(video.server);
      const language = clean(video.lang || 'EN');
      const server = clean(video.server || 'Direct');
      streams.push({
        name: `MovieBlast • ${streamQuality} • ${language}`,
        title: `${info.title}${isSeries ? ` S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}` : info.year ? ` (${info.year})` : ''}`,
        url: signedUrl(video.link), quality: streamQuality, source: `MovieBlast ${server} ${language}`,
        headers: PLAYBACK_HEADERS, provider: 'MovieBlast', subtitles: [], seekable: 'unknown'
      });
    }
    return uniqueExactStreams(streams);
  } catch (error) {
    console.log(`[MovieBlast] ${error?.message || error}`);
    return [];
  }
}

module.exports = { getStreams };
