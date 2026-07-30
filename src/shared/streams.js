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

module.exports = {
  MEDIA_EXTENSION,
  PLACEHOLDER_MEDIA,
  extractMediaCandidates,
  normalizeStream,
  normalizeSubtitles,
  parseMediaAttributes,
  parseQuality,
  resolveFinalUrl,
  uniqueStreams
};
