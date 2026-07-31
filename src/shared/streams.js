const { absoluteUrl, parseHtml } = require('./html');
const { mergeHeaders, request } = require('./http');

const MEDIA_EXTENSION = /\.(?:m3u8|mp4|m4v|webm|mkv|mpd)(?:$|[?#])/i;
const EMBED_HINT = /(?:embed|player|watch|streamtape|dood|vidhide|filemoon|streamwish|vidwish|megacloud)/i;
const PLACEHOLDER_MEDIA = /(?:one\.one\.one\.one\/media\/open-graph\.mp4|\/favicon\.|\/logo\.(?:mp4|m3u8)|\b(?:trailer|sample|placeholder|preview)[-_./])/i;

function parseQuality(...values) {
  const text = values.filter(Boolean).join(' ').toLowerCase();
  if (/\b(?:2160p?|4k|uhd)\b/.test(text)) return '4K';
  for (const quality of [1440, 1080, 720, 576, 480, 360, 240]) {
    if (new RegExp(`\\b${quality}p?\\b`).test(text)) return `${quality}p`;
  }
  return 'Unknown';
}

function parseMediaAttributes(...values) {
  const text = values.filter(Boolean).join(' ');
  const lower = text.toLowerCase();
  const languages = [];
  const languagePatterns = [
    ['Hindi', /\b(?:hindi|hin)\b/i], ['English', /\b(?:english|eng)\b/i],
    ['Tamil', /\b(?:tamil|tam)\b/i], ['Telugu', /\b(?:telugu|tel)\b/i],
    ['Malayalam', /\b(?:malayalam|mal)\b/i], ['Kannada', /\b(?:kannada|kan)\b/i],
    ['Portuguese', /\b(?:portuguese|portugu[eê]s|pt-br)\b/i], ['French', /\b(?:french|fran[cç]ais)\b/i]
  ];
  for (const [name, pattern] of languagePatterns) if (pattern.test(text)) languages.push(name);
  return {
    quality: parseQuality(text),
    hdr: /\b(?:hdr10\+?|dolby\s*vision|dv)\b/i.test(text),
    codec: /\b(?:hevc|h\.?265|x265)\b/i.test(text) ? 'HEVC' : /\b(?:avc|h\.?264|x264)\b/i.test(text) ? 'AVC' : undefined,
    audio: /\b(?:dual[ -]?audio|multi[ -]?audio|dual)\b/i.test(text) ? 'Dual/Multi Audio' : undefined,
    languages,
    size: text.match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)\b/i)?.[0]
  };
}

function normalizeSubtitles(subtitles) {
  if (!Array.isArray(subtitles)) return [];
  const seen = new Set();
  return subtitles.flatMap((subtitle) => {
    const url = typeof subtitle === 'string' ? subtitle : subtitle && (subtitle.url || subtitle.file);
    if (!/^https?:\/\//i.test(url || '') || seen.has(url)) return [];
    seen.add(url);
    return [{
      url,
      language: (subtitle && (subtitle.language || subtitle.lang || subtitle.label)) || 'Unknown'
    }];
  });
}

function normalizeStream(stream, defaults = {}) {
  if (!stream || !/^https?:\/\//i.test(stream.url || '')) return null;
  const attributes = parseMediaAttributes(stream.url, stream.title, stream.name, stream.label, stream.fileName);
  return {
    url: stream.url,
    quality: stream.quality || parseQuality(stream.url, stream.title, stream.name),
    title: stream.title || stream.name || defaults.title || 'Stream',
    headers: mergeHeaders(defaults.headers, stream.headers),
    subtitles: normalizeSubtitles(stream.subtitles),
    ...(stream.size || attributes.size ? { size: stream.size || attributes.size } : {}),
    ...(stream.hdr !== undefined || attributes.hdr ? { hdr: stream.hdr !== undefined ? stream.hdr : attributes.hdr } : {}),
    ...(stream.codec || attributes.codec ? { codec: stream.codec || attributes.codec } : {}),
    ...(stream.audio || attributes.audio ? { audio: stream.audio || attributes.audio } : {}),
    ...(stream.languages || attributes.languages.length ? { languages: stream.languages || attributes.languages } : {})
  };
}

function uniqueStreams(streams, defaults) {
  const seen = new Set();
  return (streams || []).flatMap((stream) => {
    const normalized = normalizeStream(stream, defaults);
    if (!normalized || seen.has(normalized.url)) return [];
    seen.add(normalized.url);
    return [normalized];
  });
}

function extractMediaCandidates(html, baseUrl) {
  const values = [];
  const patterns = [
    /(?:file|source|src)\s*[:=]\s*["']([^"']+\.(?:m3u8|mp4|webm|mkv|mpd)[^"']*)["']/gi,
    /https?:\\?\/\\?\/[^"'\s<>]+\.(?:m3u8|mp4|webm|mkv|mpd)(?:[^"'\s<>]*)/gi
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html || ''))) values.push((match[1] || match[0]).replace(/\\\//g, '/'));
  }
  return values.map((value) => absoluteUrl(value, baseUrl)).filter(Boolean);
}

async function resolveFinalUrl(url, options = {}, depth = 0) {
  if (!/^https?:\/\//i.test(url || '') || PLACEHOLDER_MEDIA.test(url) || depth > 2) return null;

  const response = await request(url, { ...options, redirect: 'follow', retries: 0 });
  if (!response.ok) return null;
  const finalUrl = response.url || url;
  if (PLACEHOLDER_MEDIA.test(finalUrl)) return null;
  const contentType = (response.headers && response.headers.get && response.headers.get('content-type')) || '';
  const isHtml = /html|text\/html/i.test(contentType);
  if (/^(?:video|audio)\//i.test(contentType) || /mpegurl|dash\+xml/i.test(contentType) || (MEDIA_EXTENSION.test(finalUrl) && !isHtml)) return finalUrl;
  if (!/html|text\//i.test(contentType)) return EMBED_HINT.test(finalUrl) ? null : finalUrl;

  const html = await response.text();
  const candidates = extractMediaCandidates(html, finalUrl);
  for (const candidate of candidates) {
    const resolved = await resolveFinalUrl(candidate, options, depth + 1).catch(() => null);
    if (resolved) return resolved;
  }

  const $ = parseHtml(html);
  const iframe = absoluteUrl($('iframe').first().attr('src') || $('iframe').first().attr('data-src'), finalUrl);
  if (iframe && iframe !== url) return resolveFinalUrl(iframe, options, depth + 1).catch(() => null);
  return null;
}

function qualityRank(quality) {
  const text = String(quality || '').toUpperCase();
  if (text === '4K' || text.includes('2160')) return 2160;
  const match = text.match(/(1440|1080|720|576|480|360|240)/);
  return match ? Number(match[1]) : 0;
}

function normalizeDisplayQuality(value) {
  const rank = qualityRank(value);
  return rank === 2160 ? '4K' : rank > 0 ? `${rank}p` : 'Unknown';
}

function qualityOrderPrefix(quality) {
  const rank = { '4K': 1, '1080p': 2, '720p': 3, '480p': 4, '360p': 5, '240p': 6 }[quality] || 9;
  return '\u200B'.repeat(rank);
}

function streamOrderPrefix(quality, seekable) {
  const qualityPosition = { '4K': 0, '1080p': 1, '720p': 2, '480p': 3, '360p': 4, '240p': 5 }[quality] ?? 8;
  const seekPosition = seekable === true ? 1 : seekable === false ? 3 : 2;
  return '\u200B'.repeat((qualityPosition * 3) + seekPosition);
}

function getSeekableHint(stream) {
  if (stream && (stream.seekable === true || stream.seekable === false)) {
    return stream.seekable;
  }
  const url = String(stream?.url || '').toLowerCase();
  const source = String(stream?.source || stream?.name || '').toLowerCase();

  // FSL is wrapped in a same-method redirect URL ending in .mkv, allowing
  // Nuvio/Media3 to select its Matroska progressive source while byte ranges
  // continue directly against the Range-capable R2 target.
  if (/hubcloud\s*fsl|\bfsl\b/i.test(source) || /cloudflarestorage\.com\/hub\//i.test(url)) {
    return true;
  }
  if (/\.m3u8(?:$|[?#])/i.test(url) || (/castle/i.test(source) && /hls|m3u8/i.test(`${source} ${url}`))) {
    return true;
  }
  if (/hubcloud\s*pixel\s*10gbps|10gbps/i.test(source)) {
    return false;
  }
  return 'unknown';
}

function seekableOrderRank(hint) {
  if (hint === true) return 2;
  if (hint === 'unknown') return 1;
  if (hint === false) return 0;
  return 1;
}

function uniqueExactStreams(streams) {
  const seen = new Set();
  const valid = [];
  for (const stream of streams || []) {
    if (!stream || !stream.url) continue;
    const quality = normalizeDisplayQuality(stream.quality || stream.name || stream.title);
    const rawSource = stream.source || stream.provider || 'Direct';
    const canonicalSource = rawSource.replace(/\s*\([^)]*no\s*seek[^)]*\)/gi, '').trim();

    const key = `${quality}|${canonicalSource}|${stream.url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const provider = stream.provider || 'StreamPlay';
    const seekable = getSeekableHint({ ...stream, source: canonicalSource });

    let displaySource = canonicalSource;
    if (seekable === false && !/\(no\s*seek\)/i.test(displaySource)) {
      displaySource = `${displaySource} (No Seek)`;
    }

    // Nuvio alphabetically re-sorts names. A composite invisible prefix keeps
    // both quality and seekability ordering intact in the rendered UI.
    const prefix = streamOrderPrefix(quality, seekable);
    const name = `${prefix}${provider} • ${quality} • ${displaySource}`;

    valid.push({
      ...stream,
      name,
      quality,
      source: canonicalSource,
      provider,
      seekable
    });
  }

  return valid.sort((a, b) => {
    const qDiff = qualityRank(b.quality) - qualityRank(a.quality);
    if (qDiff !== 0) return qDiff;
    return seekableOrderRank(b.seekable) - seekableOrderRank(a.seekable);
  });
}

async function mapConcurrent(items, concurrency, fn) {
  if (!Array.isArray(items) || !items.length) return [];
  const limit = Math.max(1, Number(concurrency) || 4);
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = null;
      }
    }
  }

  const workers = [];
  for (let w = 0; w < Math.min(limit, items.length); w++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}

async function checkStreamRange(url, headers = {}, timeoutMs = 3000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36',
        Range: 'bytes=1000000-1001023',
        ...headers
      }
    });
    if (timer) clearTimeout(timer);
    const contentRange = res.headers ? res.headers.get('content-range') : null;
    const acceptRanges = res.headers ? res.headers.get('accept-ranges') : null;
    const contentType = res.headers ? res.headers.get('content-type') : null;
    const status = res.status;
    const seekable = status === 206 || !!contentRange || acceptRanges === 'bytes';

    if (res.body && typeof res.body.cancel === 'function') {
      try { await res.body.cancel(); } catch (_) {}
    }

    return {
      ok: res.ok || status === 206,
      status,
      finalUrl: res.url || url,
      contentType,
      contentRange,
      acceptRanges,
      seekable
    };
  } catch (error) {
    if (timer) clearTimeout(timer);
    return { ok: false, status: 0, seekable: false, error: error.message };
  }
}

module.exports = {
  MEDIA_EXTENSION,
  PLACEHOLDER_MEDIA,
  extractMediaCandidates,
  normalizeStream,
  normalizeSubtitles,
  parseMediaAttributes,
  parseQuality,
  qualityRank,
  normalizeDisplayQuality,
  qualityOrderPrefix,
  streamOrderPrefix,
  getSeekableHint,
  resolveFinalUrl,
  uniqueStreams,
  uniqueExactStreams,
  mapConcurrent,
  checkStreamRange
};
