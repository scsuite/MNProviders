/** UHDMovies - generated from src/providers/uhdmovies.js */
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
      UHDMOVIES_FALLBACK: "https://uhdmovies.casa",
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
    function resolveTmdbId(inputId, type) {
      const value = String(inputId || "").replace(/^tmdb:/i, "");
      if (!/^tt\d+$/i.test(value))
        return Promise.resolve(value);
      return fetch(`${DOMAINS2.TMDB_API}/find/${encodeURIComponent(value)}?api_key=${TMDB_KEY}&external_source=imdb_id`).then((response) => response.ok ? response.json() : null).then((data) => {
        var _a;
        const matches = type === "tv" ? data == null ? void 0 : data.tv_results : data == null ? void 0 : data.movie_results;
        return ((_a = matches == null ? void 0 : matches[0]) == null ? void 0 : _a.id) ? String(matches[0].id) : null;
      }).catch(() => null);
    }
    function getMetadata(tmdbId, mediaType) {
      const type = mediaType === "tv" ? "tv" : "movie";
      const key = `${type}:${tmdbId}`;
      if (!cache.has(key)) {
        cache.set(key, resolveTmdbId(tmdbId, type).then((resolvedId) => resolvedId ? fetch(`${DOMAINS2.TMDB_API}/${type}/${resolvedId}?api_key=${TMDB_KEY}&append_to_response=external_ids`) : null).then((response) => (response == null ? void 0 : response.ok) ? response.json() : null).then((data) => {
          var _a;
          return data ? {
            title: type === "tv" ? data.name : data.title,
            year: Number(String(type === "tv" ? data.first_air_date : data.release_date).slice(0, 4)) || null,
            imdbId: ((_a = data.external_ids) == null ? void 0 : _a.imdb_id) || data.imdb_id || (/^tt\d+$/i.test(String(tmdbId)) ? String(tmdbId) : null),
            tmdbId: String(data.id)
          } : null;
        }).catch(() => null));
      }
      return cache.get(key);
    }
    module2.exports = { getMetadata, resolveTmdbId };
  }
});

// src/shared/html.js
var require_html = __commonJS({
  "src/shared/html.js"(exports2, module2) {
    var cheerio2 = require("cheerio-without-node-native");
    function parseHtml(html) {
      return cheerio2.load(typeof html === "string" ? html : "");
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
    function parseQuality2(...values) {
      const text = values.filter(Boolean).join(" ").toLowerCase();
      if (/\b(?:2160p?|4k|uhd)\b/.test(text))
        return "4K";
      for (const quality of [1440, 1080, 720, 576, 480, 360, 240]) {
        if (new RegExp(`\\b${quality}p?\\b`).test(text))
          return `${quality}p`;
      }
      return "Unknown";
    }
    function parseMediaAttributes2(...values) {
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
        quality: parseQuality2(text),
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
      const attributes = parseMediaAttributes2(stream.url, stream.title, stream.name, stream.label, stream.fileName);
      return __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
        url: stream.url,
        quality: stream.quality || parseQuality2(stream.url, stream.title, stream.name),
        title: stream.title || stream.name || defaults.title || "Stream",
        headers: mergeHeaders(defaults.headers, stream.headers),
        subtitles: normalizeSubtitles(stream.subtitles)
      }, stream.size || attributes.size ? { size: stream.size || attributes.size } : {}), stream.hdr !== void 0 || attributes.hdr ? { hdr: stream.hdr !== void 0 ? stream.hdr : attributes.hdr } : {}), stream.codec || attributes.codec ? { codec: stream.codec || attributes.codec } : {}), stream.audio || attributes.audio ? { audio: stream.audio || attributes.audio } : {}), stream.languages || attributes.languages.length ? { languages: stream.languages || attributes.languages } : {});
    }
    function uniqueStreams(streams, defaults) {
      const seen = /* @__PURE__ */ new Set();
      return (streams || []).flatMap((stream) => {
        const normalized = normalizeStream(stream, defaults);
        if (!normalized || seen.has(normalized.url))
          return [];
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
    function qualityRank(quality) {
      const text = String(quality || "").toUpperCase();
      if (text === "4K" || text.includes("2160"))
        return 2160;
      const match = text.match(/(1440|1080|720|576|480|360|240)/);
      return match ? Number(match[1]) : 0;
    }
    function normalizeDisplayQuality(value) {
      const rank = qualityRank(value);
      return rank === 2160 ? "4K" : rank > 0 ? `${rank}p` : "Unknown";
    }
    function qualityOrderPrefix(quality) {
      const rank = { "4K": 1, "1080p": 2, "720p": 3, "480p": 4, "360p": 5, "240p": 6 }[quality] || 9;
      return "\u200B".repeat(rank);
    }
    function streamOrderPrefix(quality, seekable) {
      var _a;
      const qualityPosition = (_a = { "4K": 0, "1080p": 1, "720p": 2, "480p": 3, "360p": 4, "240p": 5 }[quality]) != null ? _a : 8;
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
        const quality = normalizeDisplayQuality(stream.quality || stream.name || stream.title);
        const rawSource = stream.source || stream.provider || "Direct";
        const canonicalSource = rawSource.replace(/\s*\([^)]*no\s*seek[^)]*\)/gi, "").trim();
        const key = `${quality}|${canonicalSource}|${stream.url}`;
        if (seen.has(key))
          continue;
        seen.add(key);
        const provider = stream.provider || "StreamPlay";
        const seekable = getSeekableHint(__spreadProps(__spreadValues({}, stream), { source: canonicalSource }));
        let displaySource = canonicalSource;
        if (seekable === false && !/\(no\s*seek\)/i.test(displaySource)) {
          displaySource = `${displaySource} (No Seek)`;
        }
        const prefix = streamOrderPrefix(quality, seekable);
        const name = `${prefix}${provider} \u2022 ${quality} \u2022 ${displaySource}`;
        valid.push(__spreadProps(__spreadValues({}, stream), {
          name,
          quality,
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
    function mapConcurrent2(items, concurrency, fn) {
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
      parseMediaAttributes: parseMediaAttributes2,
      parseQuality: parseQuality2,
      qualityRank,
      normalizeDisplayQuality,
      qualityOrderPrefix,
      streamOrderPrefix,
      getSeekableHint,
      resolveFinalUrl,
      uniqueStreams,
      uniqueExactStreams: uniqueExactStreams2,
      mapConcurrent: mapConcurrent2,
      checkStreamRange
    };
  }
});

// src/providers/uhdmovies.js
var cheerio = require("cheerio-without-node-native");
var DOMAINS = require_domains();
var sharedMetadata = require_metadata();
var { mapConcurrent, parseMediaAttributes, parseQuality, uniqueExactStreams } = require_streams();
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
var HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9"
};
function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
function absolute(value, base) {
  try {
    return new URL(value, base).href;
  } catch (_) {
    return null;
  }
}
function responseText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const response = yield fetch(url, __spreadProps(__spreadValues({
      redirect: "follow"
    }, options), {
      headers: __spreadValues(__spreadValues({}, HEADERS), options.headers || {})
    }));
    if (!response.ok)
      throw new Error(`HTTP ${response.status} for ${url}`);
    return { response, html: yield response.text() };
  });
}
function getBaseUrl() {
  return __async(this, null, function* () {
    try {
      const { html } = yield responseText(DOMAINS.PHISHER_DOMAINS, { headers: { Accept: "application/json" } });
      const domains = JSON.parse(html);
      if (domains.UHDMovies)
        return String(domains.UHDMovies).replace(/\/$/, "");
    } catch (_) {
    }
    return DOMAINS.UHDMOVIES_FALLBACK;
  });
}
function normalizedTitle(value) {
  return clean(value).toLowerCase().replace(/^download\s+/, "").replace(/\b(?:19|20)\d{2}(?:\s*[-\u2013]\s*(?:19|20)\d{2})?\b/g, " ").replace(/\bseason\s*\d+(?:\s*[-\u2013]\s*\d+)?\b/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function catalogTitle(value) {
  return clean(value).replace(/^download\s+/i, "").split(/\(\s*(?:19|20)\d{2}/)[0].trim();
}
function yearMatchesResult(value, year) {
  if (!year)
    return true;
  const range = clean(value).match(/\b((?:19|20)\d{2})\s*[-\u2013]\s*((?:19|20)\d{2})\b/);
  if (range)
    return Number(year) >= Number(range[1]) && Number(year) <= Number(range[2]);
  const years = clean(value).match(/\b(?:19|20)\d{2}\b/g) || [];
  return !years.length || years.some((valueYear) => Number(valueYear) === Number(year));
}
function resultSupportsSeason(value, season) {
  if (!season)
    return true;
  const text = clean(value);
  const range = text.match(/(?:season\s*|\bS)0*(\d+)\s*[-\u2013]\s*(?:season\s*|S)?0*(\d+)/i);
  if (range)
    return Number(season) >= Number(range[1]) && Number(season) <= Number(range[2]);
  const seasons = [...text.matchAll(/(?:season\s*|\bS)0*(\d+)/gi)].map((match) => Number(match[1]));
  return !seasons.length || seasons.includes(Number(season));
}
function resultScore(result, metadata, mediaType, season) {
  const target = normalizedTitle(metadata.title);
  const candidate = normalizedTitle(catalogTitle(result.title));
  const targetWords = target.split(" ").filter((word) => word && !/^(?:a|an|the)$/.test(word));
  const candidateWords = candidate.split(" ").filter((word) => word && !/^(?:a|an|the)$/.test(word));
  const candidateSet = new Set(candidateWords);
  const commonWords = targetWords.filter((word) => candidateSet.has(word)).length;
  const closeVariant = Math.min(targetWords.length, candidateWords.length) >= 2 && commonWords / Math.min(targetWords.length, candidateWords.length) >= 0.8 && commonWords / Math.max(targetWords.length, candidateWords.length) >= 0.6;
  let score = candidate === target ? 10 : target.split(" ").length > 1 && candidate.startsWith(`${target} `) ? 7 : closeVariant ? 6 : 0;
  if (!score)
    return 0;
  if (mediaType === "movie" && !yearMatchesResult(result.title, metadata.year))
    return 0;
  if (mediaType === "tv" && !resultSupportsSeason(result.title, season))
    return 0;
  if (metadata.year)
    score += 2;
  if (mediaType === "tv" && /season|series|\bS\d+/i.test(result.title))
    score += 1;
  return score;
}
function chooseResult(results, metadata, mediaType, season) {
  var _a;
  return ((_a = (results || []).map((result) => ({ result, score: resultScore(result, metadata, mediaType, season) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score)[0]) == null ? void 0 : _a.result) || null;
}
function findDetailPage(base, metadata, mediaType, season) {
  return __async(this, null, function* () {
    const primary = metadata.title.replace(/:/g, "").replace(/\s*&\s*/g, " and ");
    const withoutMiddleSubtitle = metadata.title.replace(/\s*[-\u2013\u2014]\s*[^:]+:\s*/g, " ");
    const queries = [...new Set([primary, withoutMiddleSubtitle].map(clean).filter(Boolean))];
    let resultCount = 0;
    for (const query of queries) {
      const { response, html } = yield responseText(`${base}/search/${encodeURIComponent(query)}`, {
        headers: { Referer: `${base}/` }
      });
      const $ = cheerio.load(html);
      const results = [];
      $("article.gridlove-post").each((_, article) => {
        let found = null;
        $(article).find('a[href*="/download-"]').each((__, anchor) => {
          if (found)
            return;
          const url = absolute($(anchor).attr("href"), response.url || base);
          const title = clean($(anchor).attr("title") || $(article).find("h1.sanket").text() || $(anchor).text());
          if (url && title)
            found = { title, url };
        });
        if (found && !results.some((item) => item.url === found.url))
          results.push(found);
      });
      if (!results.length) {
        $('a[href*="/download-"]').each((_, anchor) => {
          const url = absolute($(anchor).attr("href"), response.url || base);
          const title = clean($(anchor).attr("title") || $(anchor).text());
          if (url && title && !results.some((item) => item.url === url))
            results.push({ title, url });
        });
      }
      resultCount += results.length;
      const selected = chooseResult(results, metadata, mediaType, season);
      if (selected)
        return selected;
    }
    console.log(`[UHDMovies Search] No exact match for ${metadata.title} (${metadata.year || "N/A"}) among ${resultCount} results`);
    return null;
  });
}
function sizeFrom(value) {
  const match = clean(value).match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)(?:\s*\/\s*E)?\b/i);
  return match ? match[0].replace(/\s+/g, " ") : void 0;
}
function hasReleaseDescriptor(value) {
  return parseQuality(value) !== "Unknown" && !!sizeFrom(value);
}
function cloudLinks($, element) {
  const links = [];
  $(element).find("a[href]").each((_, anchor) => {
    const url = $(anchor).attr("href");
    if (!/cloud\.unblockedgames\.world/i.test(url || ""))
      return;
    links.push({ label: clean($(anchor).text()), url });
  });
  return links;
}
function makeCandidate(route, descriptor, detailUrl) {
  const attributes = parseMediaAttributes(descriptor);
  return {
    provider: "UHDMovies",
    source: "DriveSeed Resume",
    url: route.url,
    label: route.label,
    descriptor,
    quality: attributes.quality,
    size: attributes.size || sizeFrom(descriptor),
    referer: detailUrl,
    headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: detailUrl }),
    resolverType: "driveseed-sid"
  };
}
function parseMovieCandidates($, detailUrl) {
  const candidates = [];
  let descriptor = "";
  $(".entry-content p, .entry-content h2, .entry-content h3, .entry-content h4, .entry-content pre").each((_, element) => {
    const text = clean($(element).text());
    const links = cloudLinks($, element);
    if (!links.length && hasReleaseDescriptor(text))
      descriptor = text;
    if (!descriptor)
      return;
    for (const route of links) {
      if (/^download\b/i.test(route.label))
        candidates.push(makeCandidate(route, descriptor, detailUrl));
    }
  });
  return candidates;
}
function parseTvCandidates($, detailUrl, targetSeason, targetEpisode) {
  const candidates = [];
  let currentSeason = null;
  let descriptor = "";
  $(".entry-content p, .entry-content h2, .entry-content h3, .entry-content h4, .entry-content pre").each((_, element) => {
    var _a;
    const text = clean($(element).text());
    const seasonMatch = text.match(/\bseason\s*0*(\d+)\b/i);
    const links = cloudLinks($, element);
    if (seasonMatch && !links.length && !hasReleaseDescriptor(text)) {
      currentSeason = Number(seasonMatch[1]);
      descriptor = "";
      return;
    }
    if (!links.length && hasReleaseDescriptor(text)) {
      const descriptorSeason = (_a = text.match(/\bS0*(\d+)(?:E\d+|\b)/i)) == null ? void 0 : _a[1];
      const belongsToTarget = descriptorSeason ? Number(descriptorSeason) === Number(targetSeason) : currentSeason === Number(targetSeason);
      descriptor = belongsToTarget ? text : "";
    }
    if (!descriptor)
      return;
    const episodePattern = new RegExp(`^episode\\s*0*${Number(targetEpisode)}(?:\\D|$)`, "i");
    for (const route of links) {
      if (episodePattern.test(route.label) && !/zip|pack/i.test(route.label)) {
        candidates.push(makeCandidate(route, descriptor, detailUrl));
      }
    }
  });
  return candidates;
}
function distinctCandidates(candidates) {
  const seen = /* @__PURE__ */ new Set();
  return (candidates || []).filter((item) => {
    const key = `${item.quality}|${item.source}|${item.url}`;
    if (seen.has(key))
      return false;
    seen.add(key);
    return true;
  });
}
function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  return __async(this, null, function* () {
    try {
      const type = mediaType === "tv" ? "tv" : "movie";
      if (!tmdbId || type === "tv" && (!season || !episode))
        return [];
      const [base, metadata] = yield Promise.all([getBaseUrl(), sharedMetadata.getMetadata(tmdbId, type)]);
      if (!(metadata == null ? void 0 : metadata.title))
        return [];
      const result = yield findDetailPage(base, metadata, type, season);
      if (!(result == null ? void 0 : result.url))
        return [];
      const { response, html } = yield responseText(result.url, { headers: { Referer: base } });
      const $ = cheerio.load(html);
      const detailUrl = response.url || result.url;
      const candidates = type === "tv" ? parseTvCandidates($, detailUrl, season, episode) : parseMovieCandidates($, detailUrl);
      if (!candidates.length)
        console.log(`[UHDMovies Candidates] No ${type === "tv" ? `S${season}E${episode} ` : ""}release links on ${detailUrl}`);
      return distinctCandidates(candidates);
    } catch (error) {
      console.log(`[UHDMovies Candidates] ${(error == null ? void 0 : error.message) || error}`);
      return [];
    }
  });
}
function postForm(url, values, referer) {
  return __async(this, null, function* () {
    return responseText(url, {
      method: "POST",
      // Nuvio's native fetch bridge does not serialize URLSearchParams objects.
      // Pass the encoded string explicitly so form verification works in QuickJS.
      body: new URLSearchParams(values).toString(),
      headers: { Referer: referer, "Content-Type": "application/x-www-form-urlencoded" }
    });
  });
}
function resolveSid(url, referer) {
  return __async(this, null, function* () {
    var _a;
    const first = yield responseText(url, { headers: { Referer: referer } });
    const $first = cheerio.load(first.html);
    const firstForm = $first("form#landing");
    const firstAction = absolute(firstForm.attr("action"), first.response.url || url);
    const wpHttp = firstForm.find('input[name="_wp_http"]').attr("value");
    if (!firstAction || !wpHttp)
      return null;
    const second = yield postForm(firstAction, { _wp_http: wpHttp }, first.response.url || url);
    const $second = cheerio.load(second.html);
    const secondForm = $second("form#landing");
    const secondAction = absolute(secondForm.attr("action"), second.response.url || firstAction);
    const wpHttp2 = secondForm.find('input[name="_wp_http2"]').attr("value") || "";
    const token = secondForm.find('input[name="token"]').attr("value") || "";
    if (!secondAction)
      return null;
    const verification = yield postForm(secondAction, { _wp_http2: wpHttp2, token }, second.response.url || firstAction);
    const cookieMatch = verification.html.match(/s_343\('([^']+)',\s*'([^']+)'/);
    const linkMatch = verification.html.match(/c\.setAttribute\(["']href["'],\s*["']([^"']+)["']\)/);
    if (!cookieMatch || !linkMatch)
      return null;
    const finalUrl = absolute(linkMatch[1], verification.response.url || secondAction);
    if (!finalUrl)
      return null;
    const landing = yield responseText(finalUrl, {
      headers: {
        Referer: verification.response.url || secondAction,
        Cookie: `${cookieMatch[1]}=${cookieMatch[2]}`
      }
    });
    const $landing = cheerio.load(landing.html);
    const content = $landing('meta[http-equiv="refresh"]').attr("content") || "";
    const target = (_a = content.match(/url\s*=\s*["']?([^"';]+)/i)) == null ? void 0 : _a[1];
    return target ? absolute(target, landing.response.url || finalUrl) : null;
  });
}
function extractFileInfo($) {
  let name = clean($("title").text());
  let size;
  $("ul.list-group li").each((_, item) => {
    const text = clean($(item).text());
    if (/^name\s*:/i.test(text))
      name = clean(text.replace(/^name\s*:/i, "")) || name;
    if (/^size\s*:/i.test(text))
      size = clean(text.replace(/^size\s*:/i, ""));
  });
  return { name, size };
}
function findLinkByText($, pattern) {
  let found = null;
  $("a[href]").each((_, anchor) => {
    if (found || !pattern.test(clean($(anchor).text())))
      return;
    found = $(anchor).attr("href");
  });
  return found;
}
function isAllowedMediaUrl(value) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol))
      return false;
    if (/(?:^|\/)null(?:\/|$)/i.test(url.pathname))
      return false;
    const hostname = url.hostname.toLowerCase();
    return hostname === "video-downloads.googleusercontent.com" || hostname.endsWith(".workers.dev") || hostname.endsWith(".cloudflarestorage.com");
  } catch (_) {
    return false;
  }
}
function directUrlFromRedirect(location, base) {
  try {
    const redirectUrl = new URL(location, base);
    if (isAllowedMediaUrl(redirectUrl.href))
      return redirectUrl.href;
    const nestedUrl = redirectUrl.searchParams.get("url");
    return isAllowedMediaUrl(nestedUrl) ? new URL(nestedUrl).href : null;
  } catch (_) {
    return null;
  }
}
function buildStream(info, item, directUrl, source, seekable, headers = {}) {
  const attributes = parseMediaAttributes(info.name, item.descriptor);
  const quality = attributes.quality === "Unknown" ? item.quality : attributes.quality;
  return __spreadValues(__spreadValues(__spreadValues(__spreadValues({
    name: `UHDMovies \u2022 ${quality} \u2022 ${source}`,
    title: info.name || item.descriptor,
    url: directUrl,
    quality,
    size: info.size || item.size,
    source,
    provider: "UHDMovies",
    headers,
    subtitles: [],
    seekable
  }, attributes.hdr ? { hdr: true } : {}), attributes.codec ? { codec: attributes.codec } : {}), attributes.audio ? { audio: attributes.audio } : {}), attributes.languages.length ? { languages: attributes.languages } : {});
}
function resolveResumeRoute($file, filePage, fileUrl, info, item) {
  return __async(this, null, function* () {
    const resumePath = findLinkByText($file, /^Resume Cloud$/i);
    const resumeUrl = absolute(resumePath, filePage.response.url || fileUrl);
    if (!resumeUrl)
      return null;
    const resume = yield responseText(resumeUrl, { headers: { Referer: filePage.response.url || fileUrl } });
    const $resume = cheerio.load(resume.html);
    const directPath = findLinkByText($resume, /^Cloud Resume Download$/i);
    const directUrl = absolute(directPath, resume.response.url || resumeUrl);
    if (!isAllowedMediaUrl(directUrl))
      return null;
    return buildStream(info, item, directUrl, "DriveSeed Resume", true, __spreadProps(__spreadValues({}, HEADERS), {
      Referer: resume.response.url || resumeUrl
    }));
  });
}
function resolveInstantRoute($file, filePage, fileUrl, info, item) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f;
    const instantPath = findLinkByText($file, /^Instant Download$/i);
    const instantUrl = absolute(instantPath, filePage.response.url || fileUrl);
    if (!instantUrl)
      return null;
    const requestOptions = {
      method: "GET",
      headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: filePage.response.url || fileUrl })
    };
    const response = yield fetch(instantUrl, __spreadProps(__spreadValues({}, requestOptions), { redirect: "manual" }));
    let directUrl = directUrlFromRedirect((_b = (_a = response.headers) == null ? void 0 : _a.get) == null ? void 0 : _b.call(_a, "location"), instantUrl) || directUrlFromRedirect(response.url, instantUrl);
    if (!directUrl) {
      const followed = yield fetch(instantUrl, __spreadProps(__spreadValues({}, requestOptions), { redirect: "follow" }));
      directUrl = directUrlFromRedirect(followed.url, instantUrl) || directUrlFromRedirect((_d = (_c = followed.headers) == null ? void 0 : _c.get) == null ? void 0 : _d.call(_c, "location"), instantUrl);
      try {
        yield (_f = (_e = followed.body) == null ? void 0 : _e.cancel) == null ? void 0 : _f.call(_e);
      } catch (_) {
      }
    }
    if (!directUrl)
      return null;
    return buildStream(info, item, directUrl, "DriveSeed Instant", false);
  });
}
function resolveDriveSeed(landingUrl, item) {
  return __async(this, null, function* () {
    var _a;
    const initial = yield responseText(landingUrl, { headers: { Referer: item.url } });
    const redirectPath = (_a = initial.html.match(/window\.location\.replace\(["']([^"']+)/)) == null ? void 0 : _a[1];
    const fileUrl = redirectPath ? absolute(redirectPath, initial.response.url || landingUrl) : initial.response.url || landingUrl;
    if (!fileUrl || !/driveseed\.org\/file\//i.test(fileUrl))
      return [];
    const filePage = redirectPath ? yield responseText(fileUrl, { headers: { Referer: initial.response.url || landingUrl } }) : initial;
    const $file = cheerio.load(filePage.html);
    const info = extractFileInfo($file);
    const routes = yield Promise.all([
      resolveResumeRoute($file, filePage, fileUrl, info, item).catch(() => null),
      resolveInstantRoute($file, filePage, fileUrl, info, item).catch(() => null)
    ]);
    return routes.filter(Boolean);
  });
}
function resolveCandidate(item) {
  return __async(this, null, function* () {
    if (!(item == null ? void 0 : item.url) || item.resolverType !== "driveseed-sid")
      return [];
    try {
      const landingUrl = yield resolveSid(item.url, item.referer);
      if (!landingUrl || !/driveseed\.org\//i.test(landingUrl))
        return [];
      return resolveDriveSeed(landingUrl, item);
    } catch (error) {
      console.log(`[UHDMovies Resolve] ${(error == null ? void 0 : error.message) || error}`);
      return [];
    }
  });
}
function getStreamsLocal(tmdbId, mediaType = "movie", season = 1, episode = 1) {
  return __async(this, null, function* () {
    const candidates = yield discoverCandidates(tmdbId, mediaType, season, episode);
    const resolved = yield mapConcurrent(candidates, 4, resolveCandidate);
    return uniqueExactStreams(resolved.flat().filter(Boolean));
  });
}
function fetchWorkerStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    var _a;
    try {
      const query = new URLSearchParams({
        tmdbId: String(tmdbId),
        type: mediaType,
        season: String(season || 1),
        episode: String(episode || 1),
        providers: "uhdmovies",
        timeout: "30000"
      });
      const response = yield fetch(`${DOMAINS.WORKER}/streams?${query.toString()}`, {
        headers: { Accept: "application/json" }
      });
      if (!response.ok)
        return null;
      const data = yield response.json();
      const state = (_a = data == null ? void 0 : data.providers) == null ? void 0 : _a.uhdmovies;
      if (!(data == null ? void 0 : data.ok) || !state || /^(?:error|timeout|blocked)$/i.test(String(state.status || "")))
        return null;
      return (Array.isArray(data.directStreams) ? data.directStreams : []).filter((stream) => String((stream == null ? void 0 : stream.provider) || "").toLowerCase() === "uhdmovies");
    } catch (_) {
      return null;
    }
  });
}
function getStreams(tmdbId, mediaType = "movie", season = 1, episode = 1) {
  return __async(this, null, function* () {
    const type = mediaType === "tv" ? "tv" : "movie";
    if (!tmdbId || type === "tv" && (!season || !episode))
      return [];
    const workerStreams = yield fetchWorkerStreams(tmdbId, type, season, episode);
    if (workerStreams !== null)
      return uniqueExactStreams(workerStreams);
    return getStreamsLocal(tmdbId, type, season, episode);
  });
}
module.exports = { discoverCandidates, resolveCandidate, getStreamsLocal, fetchWorkerStreams, getStreams };
