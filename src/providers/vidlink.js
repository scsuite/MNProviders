const { getMediaInfo } = require('../shared/media');
const { parseQuality, uniqueStreams } = require('../shared/streams');

const ENCRYPT_API = 'https://enc-dec.app/api/enc-vidlink';
const STREAM_API = 'https://vidlink.pro/api/b';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36',
  Referer: 'https://vidlink.pro/',
  Origin: 'https://vidlink.pro'
};

async function getJson(url, headers = {}) {
  const response = await fetch(url, { headers: { ...HEADERS, ...headers } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function subtitlesFrom(data) {
  const raw = data?.subtitles || data?.stream?.subtitles || data?.captions || data?.stream?.captions || [];
  return Array.isArray(raw) ? raw.flatMap((subtitle) => {
    if (!subtitle?.url) return [];
    return [{
      url: subtitle.url,
      language: subtitle.language || subtitle.lang || subtitle.label || subtitle.name || 'Unknown'
    }];
  }) : [];
}

function qualityFrom(label, url) {
  const parsed = parseQuality(label, url);
  return parsed === 'Unknown' && /^auto$/i.test(label || '') ? 'Auto' : parsed;
}

function directStreams(data, title) {
  const subtitles = subtitlesFrom(data);
  const streams = [];
  const qualities = data?.stream?.qualities;

  if (qualities && typeof qualities === 'object') {
    for (const [label, value] of Object.entries(qualities)) {
      if (!value?.url) continue;
      streams.push({
        name: `StreamPlay • Vidlink`,
        title: `Vidlink • ${label}`,
        url: value.url,
        quality: qualityFrom(label, value.url),
        headers: HEADERS,
        subtitles
      });
    }
  }

  const fallbackUrl = data?.url || data?.stream?.url;
  if (fallbackUrl) {
    streams.push({
      name: 'StreamPlay • Vidlink',
      title: `Vidlink • ${title}`,
      url: fallbackUrl,
      quality: qualityFrom(data?.quality, fallbackUrl),
      headers: HEADERS,
      subtitles
    });
  }

  for (const item of Array.isArray(data?.streams) ? data.streams : []) {
    if (!item?.url) continue;
    streams.push({
      name: 'StreamPlay • Vidlink',
      title: `Vidlink • ${item.quality || item.label || title}`,
      url: item.url,
      quality: qualityFrom(item.quality || item.label, item.url),
      headers: HEADERS,
      subtitles
    });
  }

  return uniqueStreams(streams);
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    if (!tmdbId || (mediaType !== 'movie' && mediaType !== 'tv')) return [];
    const media = await getMediaInfo(tmdbId, mediaType);
    const encrypted = await getJson(`${ENCRYPT_API}?text=${encodeURIComponent(tmdbId)}`);
    if (!encrypted?.result) return [];
    const endpoint = mediaType === 'tv'
      ? `${STREAM_API}/tv/${encrypted.result}/${season}/${episode}`
      : `${STREAM_API}/movie/${encrypted.result}`;
    const data = await getJson(endpoint);
    return directStreams(data, media.title);
  } catch (error) {
    console.error('[Vidlink]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
