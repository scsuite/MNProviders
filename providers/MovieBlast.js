/** MovieBlast - generated from src/providers/movieblast.js */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/config/domains.js
var require_domains = __commonJS({
  "src/config/domains.js"(exports2, module2) {
    module2.exports = Object.freeze({
      TMDB_API: "https://api.themoviedb.org/3",
      PHISHER_DOMAINS: "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json",
      WORKER: "https://lucky-star-3059.salman-sohail93.workers.dev",
      MOVIESDRIVE_FALLBACK: "https://new1.moviesdrive.christmas",
      VEGAMOVIES_FALLBACK: "https://vegamovies.catering",
      MOVIES4U_FALLBACK: "https://new2.movies4u.clinic",
      FOURKHDHUB_FALLBACK: "https://4khdhub.one",
      HDHUB4U_FALLBACK: "https://new4.hdhub4u.cl",
      HDHUB4U_SEARCH_API: "https://search.pingora.fyi/collections/post/documents/search",
      MULTIMOVIES_FALLBACK: "https://multimovies.makeup",
      CASTLE_API: "https://api.hlowb.com",
      MOVIEBLAST_API: "https://app.cloud-mb.xyz",
      NEXDRIVE: "https://nexdrive.fit",
      HUBCLOUD: "https://hubcloud.cx",
      VCLOUD: "https://vcloud.zip",
      FASTDL: "https://fastdl.zip",
      GDFLIX_MIRRORS: ["https://new3.gdflix.cfd", "https://new2.gdflix.cfd"]
    });
  }
});

// src/shared/metadata.js
var require_metadata = __commonJS({
  "src/shared/metadata.js"(exports2, module2) {
    var DOMAINS2 = require_domains();
    var TMDB_KEY = "439c478a771f35c05022f9feabcca01c";
    var cache = /* @__PURE__ */ new Map();
    function getMetadata(tmdbId, mediaType) {
      const type = mediaType === "tv" ? "tv" : "movie";
      const key = `${type}:${tmdbId}`;
      if (!cache.has(key)) {
        cache.set(key, fetch(`${DOMAINS2.TMDB_API}/${type}/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=external_ids`).then((response) => response.ok ? response.json() : null).then((data) => {
          var _a;
          return data ? {
            title: type === "tv" ? data.name : data.title,
            year: Number(String(type === "tv" ? data.first_air_date : data.release_date).slice(0, 4)) || null,
            imdbId: ((_a = data.external_ids) == null ? void 0 : _a.imdb_id) || data.imdb_id || null
          } : null;
        }).catch(() => null));
      }
      return cache.get(key);
    }
    module2.exports = { getMetadata };
  }
});

// src/shared/html.js
var require_html = __commonJS({
  "src/shared/html.js"(exports2, module2) {
    var cheerio = require("cheerio-without-node-native");
    function parseHtml(html) {
      return cheerio.load(typeof html === "string" ? html : "");
    }
    function decodeBase64(value) {
      if (!value)
        return "";
      if (typeof globalThis.atob === "function")
        return globalThis.atob(value);
      if (typeof Buffer !== "undefined")
        return Buffer.from(value, "base64").toString("utf8");
      throw new Error("No base64 decoder is available in this runtime");
    }
    function absoluteUrl(value, baseUrl) {
      if (!value)
        return "";
      try {
        return new URL(value, baseUrl).href;
      } catch (_) {
        return "";
      }
    }
    module2.exports = { absoluteUrl, decodeBase64, parseHtml };
  }
});

// src/shared/http.js
var require_http = __commonJS({
  "src/shared/http.js"(exports2, module2) {
    var DEFAULT_TIMEOUT_MS = 3e4;
    var RETRYABLE_STATUS = /* @__PURE__ */ new Set([408, 425, 429, 500, 502, 503, 504]);
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    function mergeHeaders(...sets) {
      const result = {};
      for (const set of sets) {
        if (!set)
          continue;
        for (const key of Object.keys(set)) {
          if (set[key] !== void 0 && set[key] !== null && set[key] !== "")
            result[key] = String(set[key]);
        }
      }
      return result;
    }
    function withReferer(headers, referer) {
      if (!referer)
        return mergeHeaders(headers);
      let origin;
      try {
        origin = new URL(referer).origin;
      } catch (_) {
      }
      return mergeHeaders(headers, { Referer: referer, Origin: origin });
    }
    function request(_0) {
      return __async(this, arguments, function* (url, options = {}) {
        const _a = options, {
          timeoutMs = DEFAULT_TIMEOUT_MS,
          retries = 1,
          retryDelayMs = 300
        } = _a, fetchOptions = __objRest(_a, [
          "timeoutMs",
          "retries",
          "retryDelayMs"
        ]);
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt += 1) {
          const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
          const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
          try {
            const response = yield fetch(url, __spreadProps(__spreadValues({
              skipSizeCheck: true
            }, fetchOptions), {
              signal: controller ? controller.signal : fetchOptions.signal
            }));
            if (!response.ok && RETRYABLE_STATUS.has(response.status) && attempt < retries) {
              yield sleep(retryDelayMs * (attempt + 1));
              continue;
            }
            return response;
          } catch (error) {
            lastError = error;
            if (attempt >= retries)
              throw error;
            yield sleep(retryDelayMs * (attempt + 1));
          } finally {
            if (timer)
              clearTimeout(timer);
          }
        }
        throw lastError || new Error(`Request failed: ${url}`);
      });
    }
    function getText(url, options) {
      return __async(this, null, function* () {
        const response = yield request(url, options);
        if (!response.ok)
          throw new Error(`HTTP ${response.status} for ${url}`);
        return response.text();
      });
    }
    function getJson(url, options) {
      return __async(this, null, function* () {
        const response = yield request(url, options);
        if (!response.ok)
          throw new Error(`HTTP ${response.status} for ${url}`);
        return response.json();
      });
    }
    module2.exports = { DEFAULT_TIMEOUT_MS, getJson, getText, mergeHeaders, request, withReferer };
  }
});

// src/shared/streams.js
var require_streams = __commonJS({
  "src/shared/streams.js"(exports2, module2) {
    var { absoluteUrl, parseHtml } = require_html();
    var { mergeHeaders, request } = require_http();
    var MEDIA_EXTENSION = /\.(?:m3u8|mp4|m4v|webm|mkv|mpd)(?:$|[?#])/i;
    var EMBED_HINT = /(?:embed|player|watch|streamtape|dood|vidhide|filemoon|streamwish|vidwish|megacloud)/i;
    var PLACEHOLDER_MEDIA = /(?:one\.one\.one\.one\/media\/open-graph\.mp4|\/favicon\.|\/logo\.(?:mp4|m3u8)|\b(?:trailer|sample|placeholder|preview)[-_./])/i;
    function parseQuality(...values) {
      const text = values.filter(Boolean).join(" ").toLowerCase();
      if (/\b(?:2160p?|4k|uhd)\b/.test(text))
        return "4K";
      for (const quality2 of [1440, 1080, 720, 576, 480, 360, 240]) {
        if (new RegExp(`\\b${quality2}p?\\b`).test(text))
          return `${quality2}p`;
      }
      return "Unknown";
    }
    function parseMediaAttributes(...values) {
      var _a;
      const text = values.filter(Boolean).join(" ");
      const lower = text.toLowerCase();
      const languages = [];
      const languagePatterns = [
        ["Hindi", /\b(?:hindi|hin)\b/i],
        ["English", /\b(?:english|eng)\b/i],
        ["Tamil", /\b(?:tamil|tam)\b/i],
        ["Telugu", /\b(?:telugu|tel)\b/i],
        ["Malayalam", /\b(?:malayalam|mal)\b/i],
        ["Kannada", /\b(?:kannada|kan)\b/i],
        ["Portuguese", /\b(?:portuguese|portugu[eê]s|pt-br)\b/i],
        ["French", /\b(?:french|fran[cç]ais)\b/i]
      ];
      for (const [name, pattern] of languagePatterns)
        if (pattern.test(text))
          languages.push(name);
      return {
        quality: parseQuality(text),
        hdr: /\b(?:hdr10\+?|dolby\s*vision|dv)\b/i.test(text),
        codec: /\b(?:hevc|h\.?265|x265)\b/i.test(text) ? "HEVC" : /\b(?:avc|h\.?264|x264)\b/i.test(text) ? "AVC" : void 0,
        audio: /\b(?:dual[ -]?audio|multi[ -]?audio|dual)\b/i.test(text) ? "Dual/Multi Audio" : void 0,
        languages,
        size: (_a = text.match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)\b/i)) == null ? void 0 : _a[0]
      };
    }
    function normalizeSubtitles(subtitles) {
      if (!Array.isArray(subtitles))
        return [];
      const seen = /* @__PURE__ */ new Set();
      return subtitles.flatMap((subtitle) => {
        const url = typeof subtitle === "string" ? subtitle : subtitle && (subtitle.url || subtitle.file);
        if (!/^https?:\/\//i.test(url || "") || seen.has(url))
          return [];
        seen.add(url);
        return [{
          url,
          language: subtitle && (subtitle.language || subtitle.lang || subtitle.label) || "Unknown"
        }];
      });
    }
    function normalizeStream(stream, defaults = {}) {
      if (!stream || !/^https?:\/\//i.test(stream.url || ""))
        return null;
      const attributes = parseMediaAttributes(stream.url, stream.title, stream.name, stream.label, stream.fileName);
      return __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
        url: stream.url,
        quality: stream.quality || parseQuality(stream.url, stream.title, stream.name),
        title: stream.title || stream.name || defaults.title || "Stream",
        headers: mergeHeaders(defaults.headers, stream.headers),
        subtitles: normalizeSubtitles(stream.subtitles)
      }, stream.size || attributes.size ? { size: stream.size || attributes.size } : {}), stream.hdr !== void 0 || attributes.hdr ? { hdr: stream.hdr !== void 0 ? stream.hdr : attributes.hdr } : {}), stream.codec || attributes.codec ? { codec: stream.codec || attributes.codec } : {}), stream.audio || attributes.audio ? { audio: stream.audio || attributes.audio } : {}), stream.languages || attributes.languages.length ? { languages: stream.languages || attributes.languages } : {});
    }
    function uniqueStreams(streams, defaults) {
      const seen = /* @__PURE__ */ new Set();
      return (streams || []).flatMap((stream) => {
        const normalized2 = normalizeStream(stream, defaults);
        if (!normalized2 || seen.has(normalized2.url))
          return [];
        seen.add(normalized2.url);
        return [normalized2];
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
        while (match = pattern.exec(html || ""))
          values.push((match[1] || match[0]).replace(/\\\//g, "/"));
      }
      return values.map((value) => absoluteUrl(value, baseUrl)).filter(Boolean);
    }
    function resolveFinalUrl(_0) {
      return __async(this, arguments, function* (url, options = {}, depth = 0) {
        if (!/^https?:\/\//i.test(url || "") || PLACEHOLDER_MEDIA.test(url) || depth > 2)
          return null;
        const response = yield request(url, __spreadProps(__spreadValues({}, options), { redirect: "follow", retries: 0 }));
        if (!response.ok)
          return null;
        const finalUrl = response.url || url;
        if (PLACEHOLDER_MEDIA.test(finalUrl))
          return null;
        const contentType = response.headers && response.headers.get && response.headers.get("content-type") || "";
        const isHtml = /html|text\/html/i.test(contentType);
        if (/^(?:video|audio)\//i.test(contentType) || /mpegurl|dash\+xml/i.test(contentType) || MEDIA_EXTENSION.test(finalUrl) && !isHtml)
          return finalUrl;
        if (!/html|text\//i.test(contentType))
          return EMBED_HINT.test(finalUrl) ? null : finalUrl;
        const html = yield response.text();
        const candidates = extractMediaCandidates(html, finalUrl);
        for (const candidate of candidates) {
          const resolved = yield resolveFinalUrl(candidate, options, depth + 1).catch(() => null);
          if (resolved)
            return resolved;
        }
        const $ = parseHtml(html);
        const iframe = absoluteUrl($("iframe").first().attr("src") || $("iframe").first().attr("data-src"), finalUrl);
        if (iframe && iframe !== url)
          return resolveFinalUrl(iframe, options, depth + 1).catch(() => null);
        return null;
      });
    }
    function qualityRank(quality2) {
      const text = String(quality2 || "").toUpperCase();
      if (text === "4K" || text.includes("2160"))
        return 2160;
      const match = text.match(/(1440|1080|720|576|480|360|240)/);
      return match ? Number(match[1]) : 0;
    }
    function normalizeDisplayQuality(value) {
      const rank = qualityRank(value);
      return rank === 2160 ? "4K" : rank > 0 ? `${rank}p` : "Unknown";
    }
    function qualityOrderPrefix(quality2) {
      const rank = { "4K": 1, "1080p": 2, "720p": 3, "480p": 4, "360p": 5, "240p": 6 }[quality2] || 9;
      return "\u200B".repeat(rank);
    }
    function streamOrderPrefix(quality2, seekable) {
      var _a;
      const qualityPosition = (_a = { "4K": 0, "1080p": 1, "720p": 2, "480p": 3, "360p": 4, "240p": 5 }[quality2]) != null ? _a : 8;
      const seekPosition = seekable === true ? 1 : seekable === false ? 3 : 2;
      return "\u200B".repeat(qualityPosition * 3 + seekPosition);
    }
    function getSeekableHint(stream) {
      if (stream && (stream.seekable === true || stream.seekable === false)) {
        return stream.seekable;
      }
      const url = String((stream == null ? void 0 : stream.url) || "").toLowerCase();
      const source = String((stream == null ? void 0 : stream.source) || (stream == null ? void 0 : stream.name) || "").toLowerCase();
      if (/hubcloud\s*fsl|\bfsl\b/i.test(source) || /cloudflarestorage\.com\/hub\//i.test(url)) {
        return true;
      }
      if (/\.m3u8(?:$|[?#])/i.test(url) || /castle/i.test(source) && /hls|m3u8/i.test(`${source} ${url}`)) {
        return true;
      }
      if (/hubcloud\s*pixel\s*10gbps|10gbps/i.test(source)) {
        return false;
      }
      return "unknown";
    }
    function seekableOrderRank(hint) {
      if (hint === true)
        return 2;
      if (hint === "unknown")
        return 1;
      if (hint === false)
        return 0;
      return 1;
    }
    function uniqueExactStreams2(streams) {
      const seen = /* @__PURE__ */ new Set();
      const valid = [];
      for (const stream of streams || []) {
        if (!stream || !stream.url)
          continue;
        const quality2 = normalizeDisplayQuality(stream.quality || stream.name || stream.title);
        const rawSource = stream.source || stream.provider || "Direct";
        const canonicalSource = rawSource.replace(/\s*\([^)]*no\s*seek[^)]*\)/gi, "").trim();
        const key = `${quality2}|${canonicalSource}|${stream.url}`;
        if (seen.has(key))
          continue;
        seen.add(key);
        const provider = stream.provider || "StreamPlay";
        const seekable = getSeekableHint(__spreadProps(__spreadValues({}, stream), { source: canonicalSource }));
        let displaySource = canonicalSource;
        if (seekable === false && !/\(no\s*seek\)/i.test(displaySource)) {
          displaySource = `${displaySource} (No Seek)`;
        }
        const prefix = streamOrderPrefix(quality2, seekable);
        const name = `${prefix}${provider} \u2022 ${quality2} \u2022 ${displaySource}`;
        valid.push(__spreadProps(__spreadValues({}, stream), {
          name,
          quality: quality2,
          source: canonicalSource,
          provider,
          seekable
        }));
      }
      return valid.sort((a, b) => {
        const qDiff = qualityRank(b.quality) - qualityRank(a.quality);
        if (qDiff !== 0)
          return qDiff;
        return seekableOrderRank(b.seekable) - seekableOrderRank(a.seekable);
      });
    }
    function mapConcurrent(items, concurrency, fn) {
      return __async(this, null, function* () {
        if (!Array.isArray(items) || !items.length)
          return [];
        const limit = Math.max(1, Number(concurrency) || 4);
        const results = new Array(items.length);
        let index = 0;
        function worker() {
          return __async(this, null, function* () {
            while (index < items.length) {
              const i = index++;
              try {
                results[i] = yield fn(items[i], i);
              } catch (err) {
                results[i] = null;
              }
            }
          });
        }
        const workers = [];
        for (let w = 0; w < Math.min(limit, items.length); w++) {
          workers.push(worker());
        }
        yield Promise.all(workers);
        return results;
      });
    }
    function checkStreamRange(_0) {
      return __async(this, arguments, function* (url, headers = {}, timeoutMs = 3e3) {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
        try {
          const res = yield fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: controller ? controller.signal : void 0,
            headers: __spreadValues({
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
              Range: "bytes=1000000-1001023"
            }, headers)
          });
          if (timer)
            clearTimeout(timer);
          const contentRange = res.headers ? res.headers.get("content-range") : null;
          const acceptRanges = res.headers ? res.headers.get("accept-ranges") : null;
          const contentType = res.headers ? res.headers.get("content-type") : null;
          const status = res.status;
          const seekable = status === 206 || !!contentRange || acceptRanges === "bytes";
          if (res.body && typeof res.body.cancel === "function") {
            try {
              yield res.body.cancel();
            } catch (_) {
            }
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
          if (timer)
            clearTimeout(timer);
          return { ok: false, status: 0, seekable: false, error: error.message };
        }
      });
    }
    module2.exports = {
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
      uniqueExactStreams: uniqueExactStreams2,
      mapConcurrent,
      checkStreamRange
    };
  }
});

// src/providers/movieblast.js
var CryptoJS = require("crypto-js");
var DOMAINS = require_domains();
var sharedMetadata = require_metadata();
var { uniqueExactStreams } = require_streams();
var TOKEN = "jdvhhjv255vghhghdhvfch2565656jhdcghfdf";
var APP_ID = "com.movieblast";
var SIGN_SECRET = "GJ8reydarI7Jqat9rvbAJKNQ9gY4DoEQF2H5nfuI1gi";
var HEADERS = { "User-Agent": "okhttp/5.0.0-alpha.6", "x-request-x": APP_ID };
var SEARCH_HEADERS = __spreadProps(__spreadValues({}, HEADERS), {
  hash256: "86dc03244adddb3cbedbf0ae36074a736ee293a64774b18e82a6244eafd0df30",
  packagename: APP_ID
});
var PLAYBACK_HEADERS = {
  "Accept-Encoding": "identity",
  Connection: "Keep-Alive",
  "Icy-MetaData": "1",
  Referer: "MovieBlast",
  "User-Agent": "MovieBlast",
  "x-request-x": APP_ID
};
var clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
function normalized(value) {
  return clean(value).toLowerCase().replace(/\b(?:the|a|an)\b/g, "").replace(/[:\-_]/g, " ").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}
function similarity(left, right) {
  const a = normalized(left);
  const b = normalized(right);
  if (a === b)
    return 1;
  const first = a.split(/\s+/).filter(Boolean);
  const second = b.split(/\s+/).filter(Boolean);
  if (!first.length || !second.length)
    return 0;
  const secondSet = new Set(second);
  const union = new Set(first.concat(second));
  return first.filter((word) => secondSet.has(word)).length / union.size;
}
function selectResult(info, results, mediaType) {
  let best = null;
  let bestScore = 0;
  for (const item of results || []) {
    let score = similarity(info.title, item.name);
    const resultYear = Number(String(item.release_date || "").slice(0, 4));
    if (info.year && resultYear === Number(info.year))
      score += 0.2;
    const isSeries = /serie/i.test(String(item.type || ""));
    if (mediaType === "tv" === isSeries)
      score += 0.15;
    else
      score -= 0.25;
    if (score > bestScore && score > 0.4) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}
function quality(value) {
  const text = String(value || "").toLowerCase();
  if (/2160|4k/.test(text))
    return "4K";
  if (/1440|2k/.test(text))
    return "1440p";
  const match = text.match(/(1080|720|480|360|240)/);
  return match ? `${match[1]}p` : "Unknown";
}
function signedUrl(rawUrl) {
  try {
    const value = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(value);
    const timestamp = String(Math.floor(Date.now() / 1e3));
    const signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(parsed.pathname + timestamp, SIGN_SECRET));
    return `${value}${value.includes("?") ? "&" : "?"}verify=${timestamp}-${encodeURIComponent(signature)}`;
  } catch (_) {
    return rawUrl;
  }
}
function getStreams(tmdbId, mediaType = "movie", season = 1, episode = 1) {
  return __async(this, null, function* () {
    try {
      const type = mediaType === "tv" ? "tv" : "movie";
      const info = yield sharedMetadata.getMetadata(tmdbId, type);
      if (!(info == null ? void 0 : info.title))
        return [];
      const searchResponse = yield fetch(`${DOMAINS.MOVIEBLAST_API}/api/search/${encodeURIComponent(info.title)}/${TOKEN}`, { headers: SEARCH_HEADERS });
      if (!searchResponse.ok)
        return [];
      const searchPayload = yield searchResponse.json();
      const match = selectResult(info, (searchPayload == null ? void 0 : searchPayload.search) || [], type);
      if (!(match == null ? void 0 : match.id))
        return [];
      const isSeries = type === "tv" || /serie/i.test(String(match.type || ""));
      const detailPath = isSeries ? "series/show" : "media/detail";
      const detailResponse = yield fetch(`${DOMAINS.MOVIEBLAST_API}/api/${detailPath}/${match.id}/${TOKEN}`, { headers: HEADERS });
      if (!detailResponse.ok)
        return [];
      const detail = yield detailResponse.json();
      let videos = (detail == null ? void 0 : detail.videos) || [];
      if (isSeries) {
        const selectedSeason = ((detail == null ? void 0 : detail.seasons) || []).find((item) => Number(item.season_number) === Number(season));
        const selectedEpisode = ((selectedSeason == null ? void 0 : selectedSeason.episodes) || []).find((item) => Number(item.episode_number) === Number(episode));
        videos = (selectedEpisode == null ? void 0 : selectedEpisode.videos) || [];
      }
      const streams = [];
      for (const video of videos) {
        if (!(video == null ? void 0 : video.link))
          continue;
        const streamQuality = quality(video.server);
        const language = clean(video.lang || "EN");
        const server = clean(video.server || "Direct");
        streams.push({
          name: `MovieBlast \u2022 ${streamQuality} \u2022 ${language}`,
          title: `${info.title}${isSeries ? ` S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}` : info.year ? ` (${info.year})` : ""}`,
          url: signedUrl(video.link),
          quality: streamQuality,
          source: `MovieBlast ${server} ${language}`,
          headers: PLAYBACK_HEADERS,
          provider: "MovieBlast",
          subtitles: [],
          seekable: "unknown"
        });
      }
      return uniqueExactStreams(streams);
    } catch (error) {
      console.log(`[MovieBlast] ${(error == null ? void 0 : error.message) || error}`);
      return [];
    }
  });
}
module.exports = { getStreams };
