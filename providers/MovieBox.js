/** MovieBox - generated from src/providers/moviebox.js */
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
    var DOMAINS = require_domains();
    var TMDB_KEY = "439c478a771f35c05022f9feabcca01c";
    var cache = /* @__PURE__ */ new Map();
    function getMetadata(tmdbId, mediaType) {
      const type = mediaType === "tv" ? "tv" : "movie";
      const key = `${type}:${tmdbId}`;
      if (!cache.has(key)) {
        cache.set(key, fetch(`${DOMAINS.TMDB_API}/${type}/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=external_ids`).then((response) => response.ok ? response.json() : null).then((data) => {
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
      const attributes = parseMediaAttributes(stream.url, stream.title, stream.name, stream.label, stream.fileName);
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
      parseQuality: parseQuality2,
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

// src/providers/moviebox.js
var CryptoJS = require("crypto-js");
var sharedMetadata = require_metadata();
var { parseQuality, uniqueExactStreams } = require_streams();
var MIRRORS = [
  "https://api3.aoneroom.com",
  "https://api4.aoneroom.com",
  "https://api4sg.aoneroom.com",
  "https://api5.aoneroom.com",
  "https://api6.aoneroom.com"
];
var BOOTSTRAP_PATH = "/wefeed-mobile-bff/tab/ranking-list?tabId=0&categoryType=4516404531735022304&page=1&perPage=1";
var SEARCH_PATH = "/wefeed-mobile-bff/subject-api/search/v2";
var SEASON_PATH = "/wefeed-mobile-bff/subject-api/season-info?subjectId=";
var PLAY_PATH = "/wefeed-mobile-bff/subject-api/play-info?subjectId=";
var CAPTION_PATHS = [
  "/wefeed-mobile-bff/subject-api/get-ext-captions?subjectId=",
  "/wefeed-mobile-bff/subject-api/get-stream-captions?subjectId="
];
var DEFAULT_SECRET = CryptoJS.enc.Base64.parse("8NzZpUmwwN3MweFNOOWpxbUVXQXQ3OUVCSlp1bElRSXNWNjRGWnIyTw==");
var TOKEN_CACHE = /* @__PURE__ */ new Map();
var BOOTSTRAP_CLIENT = Object.freeze({
  package_name: "com.community.oneroom",
  version_name: "3.0.13.0325.03",
  version_code: 50020088,
  os: "android",
  os_version: "13",
  device_id: "d7578036d13336cc",
  install_store: "ps",
  system_language: "en",
  net: "NETWORK_WIFI",
  region: "US",
  timezone: "Asia/Calcutta",
  sp_code: ""
});
var MAIN_CLIENT = Object.freeze({
  package_name: "com.community.mbox.in",
  version_name: "3.0.03.0529.03",
  version_code: 50020042,
  os: "android",
  os_version: "16",
  device_id: "d7578036d13336cc",
  install_store: "ps",
  gaid: "d7578036d13336cc",
  brand: "google",
  model: "Pixel 7",
  system_language: "en",
  net: "NETWORK_WIFI",
  region: "IN",
  timezone: "Asia/Calcutta",
  sp_code: ""
});
var BOOTSTRAP_UA = "com.community.oneroom/50020088 (Linux; U; Android 13; en_US; Pixel 7; Build/TQ3A.230901.001; Cronet/145.0.7582.0)";
var MAIN_UA = "com.community.mbox.in/50020042 (Linux; U; Android 16; en_IN; sdk_gphone64_x86_64; Build/BP22.250325.006; Cronet/133.0.6876.3)";
function md5Hex(value) {
  return CryptoJS.MD5(value).toString(CryptoJS.enc.Hex);
}
function utf8First500(value) {
  const words = CryptoJS.enc.Utf8.parse(String(value || ""));
  if (words.sigBytes > 500) {
    words.sigBytes = 500;
    words.clamp();
  }
  return words;
}
function canonicalRequest(method, pathWithQuery, body, timestamp) {
  const parsed = new URL(pathWithQuery, "https://moviebox.invalid");
  const pairs = [];
  parsed.searchParams.forEach((value, key) => pairs.push([key, value]));
  pairs.sort((left, right) => left[0].localeCompare(right[0]));
  const query = pairs.map(([key, value]) => `${key}=${value}`).join("&");
  const bodyHash = body ? CryptoJS.MD5(utf8First500(body)).toString(CryptoJS.enc.Hex) : "";
  return `${String(method).toUpperCase()}
${parsed.pathname}
${query}
${bodyHash}
${timestamp}`;
}
function signedHeaders(method, pathWithQuery, body = "", token = null, bootstrap = false) {
  const timestamp = Date.now();
  const reversedTimestamp = String(timestamp).split("").reverse().join("");
  const clientToken = `${md5Hex(reversedTimestamp)}_${timestamp}`;
  const canonical = canonicalRequest(method, pathWithQuery, body, timestamp);
  const signature = `${CryptoJS.enc.Base64.stringify(CryptoJS.HmacMD5(canonical, DEFAULT_SECRET))}|2|${timestamp}`;
  return __spreadValues({
    "User-Agent": bootstrap ? BOOTSTRAP_UA : MAIN_UA,
    Accept: "application/json",
    "Content-Type": bootstrap ? "application/json" : "application/json; charset=utf-8",
    "x-client-token": clientToken,
    "x-tr-signature": signature,
    "x-client-info": JSON.stringify(bootstrap ? BOOTSTRAP_CLIENT : MAIN_CLIENT),
    "x-client-status": "0"
  }, token ? { Authorization: `Bearer ${token}` } : {});
}
function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}
function deepValues(value, visitor, depth = 0) {
  if (depth > 12 || value === null || value === void 0)
    return;
  if (Array.isArray(value)) {
    value.forEach((item) => deepValues(item, visitor, depth + 1));
    return;
  }
  if (typeof value !== "object")
    return;
  visitor(value);
  Object.values(value).forEach((item) => deepValues(item, visitor, depth + 1));
}
function normalizeTitle(value) {
  return String(value || "").toLowerCase().replace(/\b(?:the|a|an)\b/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function titleScore(target, candidate, wantedYear) {
  const left = normalizeTitle(target);
  const right = normalizeTitle(candidate);
  if (!left || !right)
    return 0;
  let score = left === right ? 10 : right.includes(left) || left.includes(right) ? 7 : 0;
  if (!score) {
    const leftWords = left.split(" ");
    const rightWords = new Set(right.split(" "));
    const overlap = leftWords.filter((word) => rightWords.has(word)).length;
    score = overlap / Math.max(leftWords.length, 1) >= 0.75 ? 5 : 0;
  }
  if (wantedYear && new RegExp(`\\b${wantedYear}\\b`).test(String(candidate)))
    score += 2;
  return score;
}
function findBestSubject(payload, metadata, mediaType) {
  var _a;
  const candidates = [];
  deepValues(payload, (object) => {
    const id = object.subjectId || object.subject_id || object.id;
    const title = object.title || object.name || object.subjectTitle || object.originalTitle;
    if (!id || !title)
      return;
    let score = titleScore(metadata.title, title, metadata.year);
    const kind = String(object.subjectType || object.subject_type || object.type || object.detailKind || "").toLowerCase();
    if (mediaType === "tv" && /tv|series|show/.test(kind))
      score += 1;
    if (mediaType === "movie" && /movie|film/.test(kind))
      score += 1;
    candidates.push({ id: String(id), title: String(title), score, raw: object });
  });
  candidates.sort((left, right) => right.score - left.score);
  return ((_a = candidates[0]) == null ? void 0 : _a.score) > 0 ? candidates[0] : null;
}
function responseToken(response, payload) {
  var _a, _b, _c, _d;
  const raw = ((_b = (_a = response.headers) == null ? void 0 : _a.get) == null ? void 0 : _b.call(_a, "x-user")) || ((_d = (_c = response.headers) == null ? void 0 : _c.get) == null ? void 0 : _d.call(_c, "X-User"));
  const header = raw ? safeJson(raw) : null;
  if (header == null ? void 0 : header.token)
    return header.token;
  let token = null;
  deepValues(payload, (object) => {
    if (!token && typeof object.token === "string" && object.token.length > 20)
      token = object.token;
  });
  return token;
}
function apiRequest(_0, _1) {
  return __async(this, arguments, function* (mirror, path, { method = "GET", body = "", token = null, bootstrap = false } = {}) {
    const response = yield fetch(`${mirror}${path}`, __spreadValues({
      method,
      headers: signedHeaders(method, path, body, token, bootstrap)
    }, body ? { body } : {}));
    const text = yield response.text();
    return { response, payload: safeJson(text), text };
  });
}
function bootstrapMirror(mirror) {
  return __async(this, null, function* () {
    const cached = TOKEN_CACHE.get(mirror);
    if (cached)
      return cached;
    const result = yield apiRequest(mirror, BOOTSTRAP_PATH, { bootstrap: true });
    if (!result.response.ok)
      throw new Error(`bootstrap HTTP ${result.response.status}`);
    const token = responseToken(result.response, result.payload);
    if (!token)
      throw new Error("bootstrap token missing");
    TOKEN_CACHE.set(mirror, token);
    return token;
  });
}
function searchMirror(mirror, token, metadata, mediaType) {
  return __async(this, null, function* () {
    const body = JSON.stringify({ page: 1, perPage: 20, keyword: metadata.title });
    const result = yield apiRequest(mirror, SEARCH_PATH, { method: "POST", body, token });
    if (result.response.status === 441)
      TOKEN_CACHE.delete(mirror);
    if (!result.response.ok)
      throw new Error(`search HTTP ${result.response.status}`);
    if (!result.payload)
      throw new Error("search invalid JSON");
    return findBestSubject(result.payload, metadata, mediaType);
  });
}
function findEpisodeHints(payload, season, episode) {
  const hints = [];
  deepValues(payload, (object) => {
    const seasonValue = Number(object.season || object.seasonNumber || object.se || object.season_number);
    const episodeValue = Number(object.episode || object.episodeNumber || object.ep || object.episode_number);
    if (seasonValue && seasonValue !== Number(season))
      return;
    if (episodeValue && episodeValue !== Number(episode))
      return;
    const streamId = object.streamId || object.stream_id || object.id;
    const subjectId = object.subjectId || object.subject_id;
    if (streamId || subjectId || episodeValue)
      hints.push({ streamId, subjectId });
  });
  return hints;
}
function playPaths(subjectId, mediaType, season, episode, seasonPayload) {
  if (mediaType !== "tv") {
    return [
      `${PLAY_PATH}${encodeURIComponent(subjectId)}&episode=0`,
      `${PLAY_PATH}${encodeURIComponent(subjectId)}&se=0&ep=0`
    ];
  }
  const hints = findEpisodeHints(seasonPayload, season, episode);
  const values = [];
  for (const hint of hints) {
    const id = hint.subjectId || subjectId;
    const stream = hint.streamId ? `&streamId=${encodeURIComponent(hint.streamId)}` : "";
    values.push(`${PLAY_PATH}${encodeURIComponent(id)}&se=${Number(season)}&ep=${Number(episode)}${stream}`);
  }
  values.push(`${PLAY_PATH}${encodeURIComponent(subjectId)}&se=${Number(season)}&ep=${Number(episode)}`);
  return [...new Set(values)];
}
function isMediaUrl(value) {
  if (!/^https?:\/\//i.test(String(value || "")))
    return false;
  return !/\.(?:jpg|jpeg|png|webp|gif|svg|vtt|srt)(?:$|[?#])/i.test(value);
}
function extractStreams(payload, metadata, mediaType, season, episode) {
  const streams = [];
  deepValues(payload, (object) => {
    const possibleUrls = [object.streamUrl, object.playUrl, object.videoUrl, object.file, object.url, object.m3u8, object.dash];
    for (const url of possibleUrls) {
      if (!isMediaUrl(url))
        continue;
      const descriptor = [object.resolution, object.quality, object.label, object.name, object.title, url].filter(Boolean).join(" ");
      const streamQuality = parseQuality(descriptor);
      streams.push({
        name: `MovieBox \u2022 ${streamQuality} \u2022 Direct`,
        title: `${metadata.title}${mediaType === "tv" ? ` S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}` : metadata.year ? ` (${metadata.year})` : ""}`,
        url: String(url),
        quality: streamQuality,
        source: "MovieBox Direct",
        provider: "MovieBox",
        headers: { "User-Agent": MAIN_UA },
        subtitles: [],
        seekable: /\.m3u8(?:$|[?#])/i.test(url) ? true : "unknown"
      });
    }
  });
  return uniqueExactStreams(streams);
}
function extractSubtitles(payload) {
  const subtitles = [];
  const seen = /* @__PURE__ */ new Set();
  deepValues(payload, (object) => {
    const url = object.captionUrl || object.subtitleUrl || object.file || object.url;
    if (!/^https?:\/\//i.test(String(url || "")) || !/subtitle|caption|\.srt|\.vtt/i.test(`${url} ${object.type || ""}`))
      return;
    if (seen.has(url))
      return;
    seen.add(url);
    subtitles.push({ url, language: object.language || object.lang || object.label || "Unknown" });
  });
  return subtitles;
}
function resolveSubject(mirror, token, subject, metadata, mediaType, season, episode) {
  return __async(this, null, function* () {
    let seasonPayload = null;
    if (mediaType === "tv") {
      const seasonResult = yield apiRequest(mirror, `${SEASON_PATH}${encodeURIComponent(subject.id)}`, { token });
      seasonPayload = seasonResult.payload;
    }
    let streams = [];
    const playStatuses = [];
    for (const path of playPaths(subject.id, mediaType, season, episode, seasonPayload)) {
      const result = yield apiRequest(mirror, path, { token });
      playStatuses.push(result.response.status);
      if (!result.response.ok || !result.payload)
        continue;
      streams = extractStreams(result.payload, metadata, mediaType, season, episode);
      if (streams.length)
        break;
    }
    if (!streams.length) {
      throw new Error(`play no streams (HTTP ${playStatuses.join("/") || "no response"})`);
    }
    const subtitlePayloads = yield Promise.all(CAPTION_PATHS.map((prefix) => __async(this, null, function* () {
      try {
        return (yield apiRequest(mirror, `${prefix}${encodeURIComponent(subject.id)}`, { token })).payload;
      } catch (_) {
        return null;
      }
    })));
    const subtitles = subtitlePayloads.flatMap(extractSubtitles);
    return streams.map((stream) => __spreadProps(__spreadValues({}, stream), { subtitles }));
  });
}
function diagnosticStream(mirror, message, metadata, mediaType, season, episode, index) {
  const host = new URL(mirror).hostname;
  const detail = String(message || "unknown failure").replace(/\s+/g, " ").slice(0, 90);
  return {
    name: `MovieBox DIAG | ${host} | ${detail}`,
    title: `Diagnostic only: ${metadata.title}${mediaType === "tv" ? ` S${season}E${episode}` : ""}`,
    url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4?moviebox_diag=${index}`,
    quality: "1080p",
    size: "Diagnostic",
    source: `DIAG ${host}: ${detail}`,
    provider: "MovieBox",
    headers: { "User-Agent": MAIN_UA },
    subtitles: [],
    seekable: true
  };
}
function getStreams(tmdbId, mediaType = "movie", season = 1, episode = 1) {
  return __async(this, null, function* () {
    const type = mediaType === "tv" ? "tv" : "movie";
    if (!tmdbId || type === "tv" && (!season || !episode))
      return [];
    let metadata;
    try {
      metadata = yield sharedMetadata.getMetadata(tmdbId, type);
    } catch (error) {
      return [diagnosticStream(
        "https://metadata.moviebox.invalid",
        `metadata failure: ${(error == null ? void 0 : error.message) || error}`,
        { title: `TMDB ${tmdbId}` },
        type,
        season,
        episode,
        90
      )];
    }
    if (!(metadata == null ? void 0 : metadata.title)) {
      return [diagnosticStream(
        "https://metadata.moviebox.invalid",
        "metadata title missing",
        { title: `TMDB ${tmdbId}` },
        type,
        season,
        episode,
        91
      )];
    }
    const diagnostics = [];
    for (const [index, mirror] of MIRRORS.entries()) {
      try {
        const token = yield bootstrapMirror(mirror);
        const subject = yield searchMirror(mirror, token, metadata, type);
        if (!subject) {
          diagnostics.push(diagnosticStream(mirror, "search OK; no matching title", metadata, type, season, episode, index));
          continue;
        }
        const streams = yield resolveSubject(mirror, token, subject, metadata, type, season, episode);
        if (streams.length)
          return streams;
      } catch (error) {
        const message = (error == null ? void 0 : error.message) || String(error);
        console.log(`[MovieBox ${new URL(mirror).hostname}] ${message}`);
        diagnostics.push(diagnosticStream(mirror, message, metadata, type, season, episode, index));
      }
    }
    return diagnostics;
  });
}
module.exports = {
  MIRRORS,
  canonicalRequest,
  signedHeaders,
  findBestSubject,
  extractStreams,
  extractSubtitles,
  playPaths,
  diagnosticStream,
  getStreams
};
