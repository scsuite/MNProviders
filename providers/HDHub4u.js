/** HDHub4u - generated from src/providers/hdhub4u.js */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
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
      NEXDRIVE: "https://nexdrive.fit",
      HUBCLOUD: "https://hubcloud.cx",
      VCLOUD: "https://vcloud.zip",
      FASTDL: "https://fastdl.zip",
      GDFLIX_MIRRORS: ["https://new3.gdflix.cfd", "https://new2.gdflix.cfd"]
    });
  }
});

// src/shared/html.js
var require_html = __commonJS({
  "src/shared/html.js"(exports2, module2) {
    var cheerio4 = require("cheerio-without-node-native");
    function parseHtml(html) {
      return cheerio4.load(typeof html === "string" ? html : "");
    }
    function decodeBase642(value) {
      if (!value)
        return "";
      if (typeof globalThis.atob === "function")
        return globalThis.atob(value);
      if (typeof Buffer !== "undefined")
        return Buffer.from(value, "base64").toString("utf8");
      throw new Error("No base64 decoder is available in this runtime");
    }
    function absoluteUrl2(value, baseUrl) {
      if (!value)
        return "";
      try {
        return new URL(value, baseUrl).href;
      } catch (_) {
        return "";
      }
    }
    module2.exports = { absoluteUrl: absoluteUrl2, decodeBase64: decodeBase642, parseHtml };
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
    function request2(_0) {
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
        const response = yield request2(url, options);
        if (!response.ok)
          throw new Error(`HTTP ${response.status} for ${url}`);
        return response.text();
      });
    }
    function getJson(url, options) {
      return __async(this, null, function* () {
        const response = yield request2(url, options);
        if (!response.ok)
          throw new Error(`HTTP ${response.status} for ${url}`);
        return response.json();
      });
    }
    module2.exports = { DEFAULT_TIMEOUT_MS, getJson, getText, mergeHeaders, request: request2, withReferer };
  }
});

// src/shared/streams.js
var require_streams = __commonJS({
  "src/shared/streams.js"(exports2, module2) {
    var { absoluteUrl: absoluteUrl2, parseHtml } = require_html();
    var { mergeHeaders, request: request2 } = require_http();
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
      return values.map((value) => absoluteUrl2(value, baseUrl)).filter(Boolean);
    }
    function resolveFinalUrl(_0) {
      return __async(this, arguments, function* (url, options = {}, depth = 0) {
        if (!/^https?:\/\//i.test(url || "") || PLACEHOLDER_MEDIA.test(url) || depth > 2)
          return null;
        const response = yield request2(url, __spreadProps(__spreadValues({}, options), { redirect: "follow", retries: 0 }));
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
        for (const candidate2 of candidates) {
          const resolved = yield resolveFinalUrl(candidate2, options, depth + 1).catch(() => null);
          if (resolved)
            return resolved;
        }
        const $ = parseHtml(html);
        const iframe = absoluteUrl2($("iframe").first().attr("src") || $("iframe").first().attr("data-src"), finalUrl);
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
    function uniqueExactStreams3(streams) {
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
    function mapConcurrent3(items, concurrency, fn) {
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
      uniqueExactStreams: uniqueExactStreams3,
      mapConcurrent: mapConcurrent3,
      checkStreamRange
    };
  }
});

// src/moviesdrive/constants.js
var import_domains, MAIN_URL, HEADERS;
var init_constants = __esm({
  "src/moviesdrive/constants.js"() {
    import_domains = __toESM(require_domains());
    MAIN_URL = import_domains.default.MOVIESDRIVE_FALLBACK;
    HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Referer": `${MAIN_URL}/`
    };
  }
});

// src/moviesdrive/extractor.js
function absoluteUrl(value, base) {
  if (!value || typeof value !== "string")
    return null;
  try {
    return new URL(value, base).toString();
  } catch (_) {
    return null;
  }
}
function parseSize(value) {
  const match = String(value || "").match(/([\d.]+)\s*(GB|MB)/i);
  return match ? `${Number(match[1]).toFixed(match[1].includes(".") ? 1 : 0)} ${match[2].toUpperCase()}` : void 0;
}
function parseQuality(value) {
  const text = String(value || "");
  if (/\b(?:2160p?|4k)\b/i.test(text))
    return "4K";
  const match = text.match(/\b(1080|720|480|360|240)p?\b/i);
  return match ? `${match[1]}p` : "Unknown";
}
function safeUrl(value) {
  if (!value)
    return null;
  const parsed = new URL(value);
  parsed.pathname = parsed.pathname.split("/").map((segment) => {
    try {
      return encodeURIComponent(decodeURIComponent(segment));
    } catch (_) {
      return encodeURIComponent(segment);
    }
  }).join("/");
  return parsed.toString();
}
function hubCloudServer(text, link) {
  const value = `${text || ""} ${link || ""}`.toLowerCase();
  if (/gpdl\.|server\s*:\s*10gbps/.test(value))
    return "HubCloud Pixel 10Gbps";
  if (/fslv2/.test(value))
    return "HubCloud FSLv2";
  if (/fsl/.test(value))
    return "HubCloud FSL";
  if (/s3 server/.test(value))
    return "HubCloud S3";
  if (/mega server/.test(value))
    return "HubCloud Mega";
  if (/pdl server/.test(value))
    return "HubCloud PDL";
  if (/buzzserver/.test(value))
    return "HubCloud BuzzServer";
  if (/pixeldrain/.test(value))
    return "HubCloud Pixeldrain";
  if (/pixel\.|pixelserver/.test(value))
    return "HubCloud Pixel";
  if (/workers\.dev|download file/.test(value))
    return "HubCloud Direct";
  return "HubCloud";
}
function wrapFslMkvUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!(host === "r2.cloudflarestorage.com" || host.endsWith(".r2.cloudflarestorage.com")))
      return url;
    return `${import_domains2.default.WORKER}/media/file.mkv?url=${encodeURIComponent(url)}`;
  } catch (_) {
    return url;
  }
}
function expandMovieButton(_0) {
  return __async(this, arguments, function* (url, hint = {}) {
    var _a, _b;
    try {
      const response = yield fetch(url, { headers: HEADERS });
      const html = yield response.text();
      if (/search-recover\.php/i.test(response.url || url)) {
        const query = (_a = html.match(/Q_INITIAL\s*=\s*"([^"]+)"/)) == null ? void 0 : _a[1];
        const token = (_b = html.match(/FROM_AC_TOKEN\s*=\s*"([^"]+)"/)) == null ? void 0 : _b[1];
        if (!query || !token)
          return [];
        const endpoint = (response.url || url).split("?")[0];
        const pageNumbers = hint.season && hint.episode ? [1, 2, 3, 4, 5] : [1];
        const payloads = yield Promise.all(pageNumbers.map((page) => {
          const params = new URLSearchParams({ api: "search", q: query, page: String(page), from_ac: token });
          return fetch(`${endpoint}?${params}`, { headers: __spreadProps(__spreadValues({}, HEADERS), { Accept: "application/json" }) }).then((r) => r.json()).catch(() => ({ hits: [] }));
        }));
        const hits = payloads.flatMap((data) => data.hits || []);
        const words = query.toLowerCase().replace(/\b(download|19\d{2}|20\d{2}|2160p|1080p|720p|480p)\b/g, "").split(/\W+/).filter((w) => w.length > 2);
        return hits.filter((hit) => {
          const name = String(hit.file_name || "");
          const normalized2 = name.toLowerCase();
          if (!words.every((word) => normalized2.includes(word)) || /\.zip(?:$|\?)/i.test(name))
            return false;
          if (!hint.season || !hint.episode)
            return true;
          const season = Number(hint.season);
          const episode = Number(hint.episode);
          const seasonMatch = new RegExp(`(?:s|season[ ._-]*)0?${season}(?:\\D|$)`, "i").test(name);
          const episodeMatch = new RegExp(`(?:e|ep|episode[ ._-]*)0?${episode}(?:\\D|$)`, "i").test(name);
          const compactMatch = new RegExp(`(?:^|\\D)${season}x0?${episode}(?:\\D|$)`, "i").test(name);
          return seasonMatch && episodeMatch || compactMatch;
        }).map((hit) => hit.url).filter((link, index, all) => link && all.indexOf(link) === index);
      }
      const $ = import_cheerio_without_node_native.default.load(html);
      const hosts = $("a[href]").map((_, anchor) => $(anchor).attr("href")).get().filter((href) => /hubcloud/i.test(href || ""));
      return hosts.length ? hosts : [response.url || url];
    } catch (_) {
      return [];
    }
  });
}
function extractHubCloud(url, referer) {
  return __async(this, null, function* () {
    var _a;
    try {
      let currentUrl = url.replace("hubcloud.foo", "hubcloud.cx").replace("hubcloud.ink", "hubcloud.dad");
      let response = yield fetch(currentUrl, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }) });
      let html = yield response.text();
      let pageUrl = response.url || currentUrl;
      let $ = import_cheerio_without_node_native.default.load(html);
      const generate = $('a[href*="hubcloud.php"]').first().attr("href") || $("#download").attr("href") || ((_a = html.match(/var url = '([^']+)'/)) == null ? void 0 : _a[1]);
      if (generate) {
        const next = absoluteUrl(generate, pageUrl);
        if (next) {
          response = yield fetch(next, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }) });
          html = yield response.text();
          pageUrl = response.url || next;
          $ = import_cheerio_without_node_native.default.load(html);
        }
      }
      const header = $("div.card-header").text().trim() || $("title").text().trim();
      const size = parseSize($("i#size").text());
      const quality = parseQuality(header);
      const buttons = $("a.btn[href]").map((_, element) => {
        const link = $(element).attr("href");
        const text = $(element).text().toLowerCase();
        if (!link || !/(download file|download\s*\[server|fsl|buzzserver|pixeldra|pixelserver|pixel server|s3 server|mega server|pdl server)/i.test(text))
          return null;
        if (/workers\.dev/i.test(link) && /download file/i.test(text))
          return null;
        return { link: absoluteUrl(link, pageUrl), text };
      }).get().filter(Boolean);
      const streams = yield Promise.all(buttons.map((button) => __async(this, null, function* () {
        var _a2, _b, _c, _d, _e, _f, _g, _h;
        let link = button.link;
        if (/pixeldra|pixelserver|pixel server/i.test(button.text)) {
          return null;
        } else if (/gpdl\.|download\s*\[server\s*:\s*10gbps/i.test(`${button.link} ${button.text}`)) {
          try {
            const gateway = yield fetch(link, { redirect: "manual", headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }) });
            const worker = absoluteUrl((_b = (_a2 = gateway.headers) == null ? void 0 : _a2.get) == null ? void 0 : _b.call(_a2, "location"), link);
            if (!worker)
              return null;
            const generated = yield fetch(worker, { redirect: "manual", headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: link }) });
            const wrapper = absoluteUrl((_d = (_c = generated.headers) == null ? void 0 : _c.get) == null ? void 0 : _d.call(_c, "location"), worker);
            if (!wrapper)
              return null;
            link = new URL(wrapper).searchParams.get("link");
            if (!link)
              return null;
          } catch (_) {
            return null;
          }
        } else if (/buzzserver/i.test(button.text)) {
          try {
            const response2 = yield fetch(link, { redirect: "manual", headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }) });
            link = absoluteUrl(((_f = (_e = response2.headers) == null ? void 0 : _e.get) == null ? void 0 : _f.call(_e, "hx-redirect")) || ((_h = (_g = response2.headers) == null ? void 0 : _g.get) == null ? void 0 : _h.call(_g, "location")), link);
            if (!link)
              return null;
          } catch (_) {
            return null;
          }
        }
        const source = hubCloudServer(button.text, button.link);
        if (/HubCloud FSL/i.test(source))
          link = wrapFslMkvUrl(link);
        return {
          source,
          title: [quality, size].filter(Boolean).join(" \u2022 "),
          url: safeUrl(link),
          quality,
          size,
          headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }),
          subtitles: []
        };
      })));
      return streams.filter(Boolean);
    } catch (_) {
      return [];
    }
  });
}
function extractGdflix(_0, _1) {
  return __async(this, arguments, function* (url, referer, hint = {}) {
    var _a, _b, _c, _d, _e, _f;
    const makeStream = (source, link, quality, size, pageUrl, headers = {}) => ({
      source,
      title: [quality, size].filter(Boolean).join(" \u2022 "),
      url: safeUrl(link),
      quality,
      size,
      headers: __spreadValues(__spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }), headers),
      subtitles: []
    });
    const metaRefreshUrl = (html, base) => {
      var _a2, _b2;
      const $ = import_cheerio_without_node_native.default.load(html || "");
      const content = $('meta[http-equiv="refresh"]').first().attr("content") || "";
      const target = (_b2 = (_a2 = content.match(/url\s*=\s*["']?([^"';]+)/i)) == null ? void 0 : _a2[1]) == null ? void 0 : _b2.trim();
      return target ? absoluteUrl(target, base) : null;
    };
    const extractGofile = (link, quality, size, pageUrl) => __async(this, null, function* () {
      var _a2, _b2, _c2, _d2;
      try {
        const id = (_a2 = link.match(/(?:[?&]c=|\/d\/)([a-zA-Z0-9-]+)/)) == null ? void 0 : _a2[1];
        if (!id)
          return [];
        const account = yield fetch("https://api.gofile.io/accounts", {
          method: "POST",
          headers: __spreadProps(__spreadValues({}, HEADERS), { Accept: "application/json" })
        }).then((response) => response.json());
        const token = (_b2 = account == null ? void 0 : account.data) == null ? void 0 : _b2.token;
        if (!token)
          return [];
        const globalJs = yield fetch("https://gofile.io/dist/js/global.js", { headers: HEADERS }).then((response) => response.text());
        const wt = (_c2 = globalJs.match(/appdata\.wt\s*=\s*["']([^"']+)/)) == null ? void 0 : _c2[1];
        if (!wt)
          return [];
        const data = yield fetch(`https://api.gofile.io/contents/${id}?wt=${encodeURIComponent(wt)}`, {
          headers: __spreadProps(__spreadValues({}, HEADERS), { Accept: "application/json", Authorization: `Bearer ${token}` })
        }).then((response) => response.json());
        const children = Object.values(((_d2 = data == null ? void 0 : data.data) == null ? void 0 : _d2.children) || {});
        return children.filter((file) => file == null ? void 0 : file.link).map((file) => makeStream(
          "GDFlix GoFile",
          file.link,
          parseQuality(file.name) === "Unknown" ? quality : parseQuality(file.name),
          parseSize(file.name) || size,
          pageUrl,
          { Cookie: `accountToken=${token}` }
        ));
      } catch (_) {
        return [];
      }
    });
    try {
      const first = yield fetch(url, { redirect: "manual", headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }) });
      const firstHtml = yield first.text();
      const redirected = absoluteUrl((_b = (_a = first.headers) == null ? void 0 : _a.get) == null ? void 0 : _b.call(_a, "location"), url) || metaRefreshUrl(firstHtml, url);
      const id = (_c = url.match(/\/(?:w?file)\/([^/?#]+)/i)) == null ? void 0 : _c[1];
      const pageCandidates = [...new Set([
        redirected,
        first.ok && !redirected ? first.url || url : null,
        ...import_domains2.default.GDFLIX_MIRRORS.map((base) => id ? `${base}/file/${id}` : null)
      ].filter(Boolean))];
      const isCloudflareChallenge = (status, html) => status === 403 || /just a moment|cf-chl|turnstile|challenge-running/i.test(String(html || ""));
      const pages = yield Promise.all(pageCandidates.map((pageUrl) => __async(this, null, function* () {
        try {
          if (pageUrl === (first.url || url) && first.ok && !redirected) {
            if (isCloudflareChallenge(first.status, firstHtml))
              return null;
            return { html: firstHtml, pageUrl };
          }
          const response = yield fetch(pageUrl, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: url }) });
          if (!response.ok)
            return null;
          const html = yield response.text();
          if (isCloudflareChallenge(response.status, html))
            return null;
          return { html, pageUrl: response.url || pageUrl };
        } catch (_) {
          return null;
        }
      })));
      const results = [];
      for (const page of pages.filter(Boolean)) {
        const $ = import_cheerio_without_node_native.default.load(page.html);
        const details = $("ul > li.list-group-item").text() || $("li").text() || $("title").text();
        const detectedQuality = parseQuality(details);
        const quality = detectedQuality === "Unknown" ? hint.quality || "1080p" : detectedQuality;
        const size = parseSize(details) || hint.size;
        const buttons = [];
        $("div.text-center a[href], a.btn[href]").each((_, element) => {
          buttons.push({ text: $(element).text().trim(), link: absoluteUrl($(element).attr("href"), page.pageUrl) });
        });
        if (!/list-group-item|direct\s*dl|instant\s*dl|gofile|pixeldra|pixelserver/i.test(page.html))
          continue;
        for (const button of buttons) {
          if (!button.link)
            continue;
          if (/direct\s*dl/i.test(button.text)) {
            results.push(makeStream("GDFlix Direct", button.link, quality, size, page.pageUrl));
          } else if (/instant\s*dl/i.test(button.text)) {
            try {
              const instant = yield fetch(button.link, { redirect: "manual", headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: page.pageUrl }) });
              const location = ((_e = (_d = instant.headers) == null ? void 0 : _d.get) == null ? void 0 : _e.call(_d, "location")) || instant.url;
              const direct = (_f = location == null ? void 0 : location.match(/[?&]url=([^&]+)/i)) == null ? void 0 : _f[1];
              const resolved = direct ? decodeURIComponent(direct) : location;
              if (resolved && resolved !== button.link)
                results.push(makeStream("GDFlix Instant Download", resolved, quality, size, page.pageUrl));
            } catch (_) {
            }
          } else if (/gofile/i.test(button.text)) {
            results.push(...yield extractGofile(button.link, quality, size, page.pageUrl));
          } else if (/pixeldra|pixelserver|\bpixel\b/i.test(button.text)) {
            continue;
          }
        }
        const cfBase = page.pageUrl.replace("/file/", "/wfile/").replace(/\?.*$/, "");
        const cfPages = yield Promise.all(["type=1", "type=2"].map((query) => __async(this, null, function* () {
          try {
            const cfUrl = `${cfBase}?${query}`;
            const response = yield fetch(cfUrl, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: page.pageUrl }) });
            return response.ok ? { html: yield response.text(), url: response.url || cfUrl } : null;
          } catch (_) {
            return null;
          }
        })));
        for (const cfPage of cfPages.filter(Boolean)) {
          const $$ = import_cheerio_without_node_native.default.load(cfPage.html);
          const link = absoluteUrl($$("a.btn-success[href]").first().attr("href"), cfPage.url);
          if (link)
            results.push(makeStream("GDFlix CF", link, quality, size, cfPage.url));
        }
      }
      if (results.length)
        return results;
    } catch (_) {
    }
    return [];
  });
}
function extractHost(url, referer, hint = {}) {
  return /gdflix|gdlink/i.test(url) ? extractGdflix(url, referer, hint) : extractHubCloud(url, referer);
}
var import_cheerio_without_node_native, import_domains2;
var init_extractor = __esm({
  "src/moviesdrive/extractor.js"() {
    import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
    init_constants();
    import_domains2 = __toESM(require_domains());
  }
});

// src/shared/metadata.js
var require_metadata = __commonJS({
  "src/shared/metadata.js"(exports2, module2) {
    var DOMAINS5 = require_domains();
    var TMDB_KEY = "439c478a771f35c05022f9feabcca01c";
    var cache = /* @__PURE__ */ new Map();
    function getMetadata2(tmdbId, mediaType) {
      const type = mediaType === "tv" ? "tv" : "movie";
      const key = `${type}:${tmdbId}`;
      if (!cache.has(key)) {
        cache.set(key, fetch(`${DOMAINS5.TMDB_API}/${type}/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=external_ids`).then((response) => response.ok ? response.json() : null).then((data) => {
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
    module2.exports = { getMetadata: getMetadata2 };
  }
});

// src/moviesdrive/index.js
var moviesdrive_exports = {};
__export(moviesdrive_exports, {
  default: () => moviesdrive_default,
  discoverCandidates: () => discoverCandidates,
  getStreams: () => getStreams,
  resolveCandidate: () => resolveCandidate
});
function normalizeType(value) {
  return /^(tv|series|show)$/i.test(String(value || "")) ? "tv" : "movie";
}
function getMetadata(tmdbId, mediaType) {
  return __async(this, null, function* () {
    return import_metadata.default.getMetadata(tmdbId, mediaType);
  });
}
function coversSeason(document, season) {
  if (!season)
    return true;
  const text = `${document.post_title || ""} ${document.permalink || ""}`;
  const range = text.match(/season\s*0?(\d+)\s*[-–—]\s*0?(\d+)/i);
  if (range && season >= Number(range[1]) && season <= Number(range[2]))
    return true;
  return new RegExp(`(?:season[ ._/-]*|\\bs)0?${season}(?:\\D|$)`, "i").test(text);
}
function getMainUrls() {
  return __async(this, null, function* () {
    const candidates = [];
    try {
      const response = yield fetch(DOMAINS_URL, { headers: HEADERS });
      if (response.ok) {
        const configured = String((yield response.json()).moviesdrive || "").replace(/\/$/, "");
        if (/^https?:\/\//i.test(configured))
          candidates.push(configured);
      }
    } catch (_) {
    }
    candidates.push(MAIN_URL);
    return [...new Set(candidates)];
  });
}
function search(metadata2, season, mainUrls) {
  return __async(this, null, function* () {
    const queries = [metadata2.imdbId, metadata2.title].filter(Boolean);
    const attempts = mainUrls.flatMap((mainUrl) => queries.map((query) => __async(this, null, function* () {
      const data = yield fetch(`${mainUrl}/search.php?q=${encodeURIComponent(query)}&page=1`, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: `${mainUrl}/` }) }).then((r) => r.json());
      const documents = (data.hits || []).map((hit) => hit.document).filter(Boolean);
      const exact = metadata2.imdbId ? documents.filter((doc) => doc.imdb_id === metadata2.imdbId) : [];
      const titled = documents.filter((doc) => String(doc.post_title || "").toLowerCase().includes(String(metadata2.title || "").toLowerCase()));
      const candidates = exact.length ? exact : titled;
      const match = candidates.find((doc) => coversSeason(doc, season));
      if (match)
        return `${mainUrl}${String(match.permalink).startsWith("/") ? "" : "/"}${match.permalink}`;
      throw new Error("No matching result");
    })));
    try {
      return yield Promise.any(attempts);
    } catch (_) {
      return null;
    }
  });
}
function seasonPages($, season) {
  const result = [];
  const pattern = new RegExp(`Season\\s*0?${season}(?:\\D|$)`, "i");
  $("h5").each((_, heading) => {
    if (!pattern.test($(heading).text()))
      return;
    let node = $(heading).next();
    let traversed = 0;
    while (node.length && traversed++ < 100) {
      const nodeText = node.text();
      const anchors = node.attr("href") ? [node] : node.find("a[href]").get();
      anchors.forEach((anchor) => {
        const text = $(anchor).text();
        const href = $(anchor).attr("href");
        if (href && /single\s*episode/i.test(text) && !/zip/i.test(text) && !result.some((item) => item.url === href)) {
          const qualityMatch = text.match(/\b(1080|720|480|360|240)p?\b/i);
          const quality = /(?:2160p?|4k)/i.test(text) ? "4K" : qualityMatch ? `${qualityMatch[1]}p` : "Unknown";
          result.push({ url: href, quality });
        }
      });
      if (/Season\s*\d+/i.test(nodeText))
        break;
      node = node.next();
    }
  });
  return result;
}
function episodeLinks($, episode) {
  const result = [];
  const pattern = new RegExp(`(?:Ep|Episode)\\s*0?${episode}(?:\\D|$)`, "i");
  $("h5").each((_, heading) => {
    var _a;
    const headingText = $(heading).text();
    if (!pattern.test(headingText))
      return;
    const qualityMatch = headingText.match(/\b(1080|720|480|360|240)p?\b/i);
    const quality = /(?:2160p?|4k)/i.test(headingText) ? "4K" : qualityMatch ? `${qualityMatch[1]}p` : "Unknown";
    const size = (_a = headingText.match(/([\d.]+)\s*(GB|MB)/i)) == null ? void 0 : _a[0];
    let node = $(heading).next();
    let traversed = 0;
    while (node.length && traversed++ < 100) {
      const nodeText = node.text();
      const anchors = node.attr("href") ? [node] : node.find("a[href]").get();
      anchors.forEach((anchor) => {
        const href = $(anchor).attr("href");
        if (href && /(hubcloud|gdflix|gdlink)/i.test(href) && !result.some((item) => item.url === href)) {
          result.push({ url: href, quality, size });
        }
      });
      if (/(?:Ep|Episode)\s*\d+/i.test(nodeText))
        break;
      node = node.next();
    }
  });
  return result;
}
function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  return __async(this, null, function* () {
    try {
      const type = normalizeType(mediaType);
      const seasonNumber = Number(season) || 1;
      const episodeNumber = Number(episode) || 1;
      const [metadata2, mainUrls] = yield Promise.all([
        getMetadata(String(tmdbId).replace(/^tmdb:/i, ""), type),
        getMainUrls()
      ]);
      if (!(metadata2 == null ? void 0 : metadata2.title))
        return [];
      const mediaUrl = yield search(metadata2, type === "tv" ? seasonNumber : null, mainUrls);
      if (!mediaUrl)
        return [];
      const html = yield fetch(mediaUrl, { headers: HEADERS }).then((r) => r.text());
      const $ = import_cheerio_without_node_native2.default.load(html);
      let hostPages = [];
      if (type === "movie") {
        const buttons = $("h5 > a[href]").map((_, anchor) => $(anchor).attr("href")).get().filter(Boolean);
        hostPages = (yield Promise.all([...new Set(buttons)].map(expandMovieButton))).flat();
      } else {
        const pages = seasonPages($, seasonNumber);
        const pageResults = yield Promise.all(pages.map((page) => __async(this, null, function* () {
          try {
            if (/search-recover\.php/i.test(page.url)) {
              return [__spreadProps(__spreadValues({}, page), { season: seasonNumber, episode: episodeNumber, referer: mediaUrl })];
            }
            const episodeHtml = yield fetch(page.url, { headers: HEADERS }).then((r) => r.text());
            return episodeLinks(import_cheerio_without_node_native2.default.load(episodeHtml), episodeNumber).map((item) => __spreadProps(__spreadValues({}, item), {
              season: seasonNumber,
              episode: episodeNumber,
              referer: page.url
            }));
          } catch (_) {
            return [];
          }
        })));
        hostPages = pageResults.flat();
      }
      const uniqueHosts = hostPages.filter((item, index, all) => {
        const url = typeof item === "string" ? item : item.url;
        return all.findIndex((other) => (typeof other === "string" ? other : other.url) === url) === index;
      });
      const expandedHosts = (yield Promise.all(uniqueHosts.map((item) => __async(this, null, function* () {
        const url = typeof item === "string" ? item : item.url;
        if (!/search-recover\.php/i.test(url))
          return [item];
        const expanded = yield expandMovieButton(url, typeof item === "string" ? {} : item);
        return expanded.map((expandedUrl) => typeof item === "string" ? expandedUrl : __spreadProps(__spreadValues({}, item), { url: expandedUrl }));
      })))).flat();
      return expandedHosts.map((item) => {
        const hint = typeof item === "string" ? {} : item;
        const url = typeof item === "string" ? item : item.url;
        const referer = hint.referer || mediaUrl;
        const isGdflix = /gdflix|gdlink/i.test(url);
        const isHubcloud = /hubcloud/i.test(url);
        return {
          provider: "MoviesDrive",
          source: isGdflix ? "GDFlix" : isHubcloud ? "HubCloud" : "MoviesDrive Host",
          quality: hint.quality || "Unknown",
          size: hint.size,
          url,
          referer,
          headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }),
          resolverType: isGdflix ? "gdflix" : isHubcloud ? "hubcloud" : "direct"
        };
      });
    } catch (error) {
      console.error("[MoviesDrive Candidate Discovery] Error:", error.message);
      return [];
    }
  });
}
function resolveCandidate(candidate2) {
  return __async(this, null, function* () {
    if (!candidate2 || !candidate2.url)
      return [];
    try {
      if (candidate2.resolverType === "direct") {
        return [{
          name: candidate2.name || `MoviesDrive \u2022 ${candidate2.quality || "Unknown"} \u2022 ${candidate2.source || "Direct"}`,
          title: candidate2.title,
          url: candidate2.url,
          quality: candidate2.quality || "Unknown",
          size: candidate2.size,
          headers: candidate2.headers || HEADERS,
          provider: "MoviesDrive",
          source: candidate2.source || "Direct",
          subtitles: []
        }];
      }
      const streams = yield extractHost(candidate2.url, candidate2.referer || MAIN_URL, {
        quality: candidate2.quality,
        size: candidate2.size
      });
      return (streams || []).map((stream) => __spreadProps(__spreadValues({}, stream), {
        provider: "MoviesDrive"
      }));
    } catch (error) {
      return [];
    }
  });
}
function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  return __async(this, null, function* () {
    try {
      const candidates = yield discoverCandidates(tmdbId, mediaType, season, episode);
      const resolvedResults = yield (0, import_streams.mapConcurrent)(candidates, 4, resolveCandidate);
      const flatStreams = resolvedResults.flat().filter(Boolean);
      return (0, import_streams.uniqueExactStreams)(flatStreams);
    } catch (error) {
      console.error("[MoviesDrive] Error:", error.message);
      return [];
    }
  });
}
var import_cheerio_without_node_native2, import_streams, import_domains3, import_metadata, DOMAINS_URL, moviesdrive_default;
var init_moviesdrive = __esm({
  "src/moviesdrive/index.js"() {
    import_cheerio_without_node_native2 = __toESM(require("cheerio-without-node-native"));
    init_constants();
    init_extractor();
    import_streams = __toESM(require_streams());
    import_domains3 = __toESM(require_domains());
    import_metadata = __toESM(require_metadata());
    DOMAINS_URL = import_domains3.default.PHISHER_DOMAINS;
    moviesdrive_default = { discoverCandidates, resolveCandidate, getStreams };
  }
});

// src/providers/hdhub4u.js
var cheerio3 = require("cheerio-without-node-native");
var CryptoJS = require("crypto-js");
var DOMAINS4 = require_domains();
var { mapConcurrent: mapConcurrent2, uniqueExactStreams: uniqueExactStreams2 } = require_streams();
var moviesDrive = (init_moviesdrive(), __toCommonJS(moviesdrive_exports));
var sharedMetadata2 = require_metadata();
var HEADERS2 = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
  Accept: "text/html,application/json;q=0.9,*/*;q=0.8"
};
var VIDSTACK_KEY = CryptoJS.enc.Utf8.parse("kiemtienmua911ca");
var VIDSTACK_IVS = ["1234567890oiuytr", "0123456789abcdef"].map((value) => CryptoJS.enc.Utf8.parse(value));
var clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
var normalized = (value) => clean(value).toLowerCase().replace(/\(\d{4}\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
function request(url, referer) {
  return __async(this, null, function* () {
    return fetch(url, { redirect: "follow", headers: __spreadValues(__spreadValues({}, HEADERS2), referer ? { Referer: referer } : {}) });
  });
}
function getBaseUrl() {
  return __async(this, null, function* () {
    try {
      const response = yield request(DOMAINS4.PHISHER_DOMAINS);
      const domains = yield response.json();
      const configured = domains.HDHUB4u || domains.hdhub4u || domains.HDHub4u;
      if (/^https?:\/\//i.test(configured || ""))
        return String(configured).replace(/\/$/, "");
    } catch (_) {
    }
    return DOMAINS4.HDHUB4U_FALLBACK;
  });
}
function metadata(tmdbId, mediaType) {
  return __async(this, null, function* () {
    return sharedMetadata2.getMetadata(tmdbId, mediaType);
  });
}
function qualityFrom(value) {
  const text = clean(value);
  if (/\b(?:2160p?|4k)\b/i.test(text))
    return "4K";
  const match = text.match(/\b(1080|720|480|360|240)p?\b/i);
  return match ? `${match[1]}p` : "Unknown";
}
function sizeFrom(value) {
  var _a;
  return (_a = clean(value).match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)(?:\/E)?\b/i)) == null ? void 0 : _a[0];
}
function absolute(value, base) {
  try {
    return new URL(value, base).toString();
  } catch (_) {
    return "";
  }
}
function decodeBase64(value) {
  try {
    return typeof atob === "function" ? atob(value) : Buffer.from(value, "base64").toString("utf8");
  } catch (_) {
    return "";
  }
}
function rot13(value) {
  return String(value || "").replace(/[a-zA-Z]/g, (character) => String.fromCharCode((character <= "Z" ? 90 : 122) >= (character = character.charCodeAt(0) + 13) ? character : character - 26));
}
function search2(info, base, mediaType, season) {
  return __async(this, null, function* () {
    const query = mediaType === "tv" ? `${info.title} Season ${season}` : info.title;
    try {
      const response2 = yield request(`${base}/search/${encodeURIComponent(query)}/`, base);
      if (response2.ok) {
        const $ = cheerio3.load(yield response2.text());
        const target = normalized(info.title);
        const seasonPattern2 = new RegExp(`(?:season[ ._/-]*|\\bs)0?${season}(?:\\D|$)`, "i");
        const results = [];
        $("a[href]").each((_, anchor) => {
          const node = $(anchor);
          const title2 = clean(node.text() || node.attr("title"));
          const url = absolute(node.attr("href"), response2.url || base);
          if (!title2 || !url || url.indexOf(`${base}/`) !== 0)
            return;
          const name = normalized(title2);
          if (name === target || name.indexOf(`${target} `) === 0)
            results.push({ title: title2, url });
        });
        const selected2 = results.find((item) => mediaType === "tv" && seasonPattern2.test(`${item.title} ${item.url}`)) || results.find((item) => info.year && item.title.includes(String(info.year))) || results[0];
        if (selected2 == null ? void 0 : selected2.url)
          return selected2.url;
      }
    } catch (_) {
    }
    const params = new URLSearchParams({
      q: info.title,
      query_by: "post_title,category,stars,director,imdb_id",
      query_by_weights: "4,2,2,2,4",
      sort_by: "sort_by_date:desc",
      limit: "15",
      highlight_fields: "none",
      use_cache: "true",
      page: "1"
    });
    const response = yield request(`${DOMAINS4.HDHUB4U_SEARCH_API}?${params}`, `${base}/search.html`);
    if (!response.ok)
      return null;
    const hits = (yield response.json()).hits || [];
    const documents = hits.map((hit) => hit.document).filter(Boolean);
    const title = normalized(info.title);
    const relevant = documents.filter((doc) => {
      const name = normalized(doc.post_title);
      return doc.imdb_id === info.imdbId || name === title || name.startsWith(`${title} `);
    });
    const seasonPattern = new RegExp(`(?:season[ ._/-]*|\\bs)0?${season}(?:\\D|$)`, "i");
    const selected = relevant.find((doc) => mediaType !== "tv" || seasonPattern.test(`${doc.post_title} ${doc.permalink}`)) || relevant.find((doc) => !info.year || String(doc.post_title).includes(String(info.year))) || relevant[0];
    if (!(selected == null ? void 0 : selected.permalink))
      return null;
    const path = absolute(selected.permalink, base);
    if (!path)
      return null;
    const parsed = new URL(path);
    return `${base}${parsed.pathname}${parsed.search}`;
  });
}
function candidate(url, label, referer) {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch (_) {
    return null;
  }
  const resolverType = host.includes("hubdrive") ? "hubdrive" : host.includes("hubcdn") ? "hubcdn" : host.includes("gadgetsweb") || host.includes("greenmountmotors") ? "protector" : host.includes("hubstream") ? "watch" : null;
  if (!resolverType)
    return null;
  return {
    provider: "HDHub4u",
    source: resolverType === "hubcdn" ? "Instant" : resolverType === "watch" ? "Watch" : resolverType === "protector" ? "Protected Link" : "Drive",
    quality: qualityFrom(label),
    size: sizeFrom(label),
    url,
    label,
    referer,
    headers: __spreadProps(__spreadValues({}, HEADERS2), { Referer: referer }),
    resolverType
  };
}
function parseMovie($, pageUrl) {
  const output = [];
  $("a[href]").each((_, anchor) => {
    const node = $(anchor);
    const url = absolute(node.attr("href"), pageUrl);
    if (!/(hubdrive|hubcdn|gadgetsweb|greenmountmotors|hubstream)/i.test(url))
      return;
    const label = clean(`${node.text()} ${node.parent().text()} ${node.parent().parent().text()}`);
    const item = candidate(url, label, pageUrl);
    if (item)
      output.push(item);
  });
  return output;
}
function parseEpisode($, pageUrl, episode) {
  const output = [];
  const wantedEpisode = Number(episode);
  let currentEpisode = null;
  $("h3,h4,h5,h6").each((_, heading) => {
    const node = $(heading);
    const text = clean(node.text());
    const marker = text.match(/(?:EPiSODE|Episode|EP|E)\s*0?(\d+)(?:\D|$)/i);
    if (marker) {
      currentEpisode = Number(marker[1]);
      return;
    }
    if (currentEpisode !== wantedEpisode)
      return;
    node.find("a[href]").each((__, anchor) => {
      const link = $(anchor);
      const url = absolute(link.attr("href"), pageUrl);
      const item = candidate(url, `${text} ${link.text()}`, pageUrl);
      if (item)
        output.push(item);
    });
  });
  return output;
}
function distinct(items) {
  const seen = /* @__PURE__ */ new Set();
  return items.filter((item) => item && !seen.has(item.url) && seen.add(item.url));
}
function discoverCandidates2(tmdbId, mediaType, season = 1, episode = 1) {
  return __async(this, null, function* () {
    let stage = "initialization";
    try {
      const type = mediaType === "tv" ? "tv" : "movie";
      stage = "domain and metadata";
      const [base, info] = yield Promise.all([getBaseUrl(), metadata(tmdbId, type)]);
      if (!(info == null ? void 0 : info.title))
        return [];
      stage = "same-domain search";
      const pageUrl = yield search2(info, base, type, Number(season) || 1);
      if (!pageUrl)
        return [];
      stage = "detail page fetch";
      const response = yield request(pageUrl, base);
      if (!response.ok)
        return [];
      stage = "detail page parsing";
      const $ = cheerio3.load(yield response.text());
      return distinct(type === "tv" ? parseEpisode($, pageUrl, episode) : parseMovie($, pageUrl));
    } catch (error) {
      console.log(`[HDHub4u Candidates:${stage}] ${(error == null ? void 0 : error.message) || error}`);
      return [];
    }
  });
}
function expandHubDriveRoutes(item) {
  return __async(this, null, function* () {
    const response = yield request(item.url, item.referer);
    if (!response.ok)
      return [];
    const html = yield response.text();
    if (/file not found|deleted|just a moment|cf-chl|turnstile/i.test(html))
      return [];
    const $ = cheerio3.load(html);
    const routes = [];
    $("a[href]").each((_, anchor) => {
      const url = absolute($(anchor).attr("href"), response.url);
      if (/hubcloud|hubcdn/i.test(url))
        routes.push(url);
    });
    return [...new Set(routes)];
  });
}
function resolveHubDrive(item) {
  return __async(this, null, function* () {
    const routes = yield expandHubDriveRoutes(item);
    return (yield mapConcurrent2([...new Set(routes)], 2, (url) => resolveCandidate2(__spreadProps(__spreadValues({}, item), { url, resolverType: /hubcdn/i.test(url) ? "hubcdn" : "hubcloud" })))).flat();
  });
}
function resolveHubCdn(item) {
  return __async(this, null, function* () {
    var _a;
    const response = yield request(item.url, item.referer);
    if (!response.ok)
      return [];
    const html = yield response.text();
    const encoded = (_a = html.match(/[?&]r=([A-Za-z0-9+/=_-]+)/)) == null ? void 0 : _a[1];
    if (!encoded)
      return [];
    let decoded = "";
    try {
      decoded = typeof atob === "function" ? atob(encoded) : Buffer.from(encoded, "base64").toString("utf8");
    } catch (_) {
      return [];
    }
    const direct = decoded.includes("link=") ? decoded.slice(decoded.lastIndexOf("link=") + 5) : decoded;
    if (!/^https?:\/\//i.test(direct))
      return [];
    return [{ name: `HDHub4u \u2022 ${item.quality} \u2022 Instant`, url: direct, quality: item.quality, size: item.size, source: "Instant", provider: "HDHub4u", headers: item.headers, subtitles: [] }];
  });
}
function resolveProtected(item) {
  return __async(this, null, function* () {
    const response = yield request(item.url, item.referer);
    if (!response.ok)
      return [];
    const html = yield response.text();
    if (/failed to decode|just a moment|cf-chl|turnstile/i.test(html))
      return [];
    const encodedParts = [];
    const encodedPattern = /s\s*\(\s*['"]o['"]\s*,\s*['"]([A-Za-z0-9+/=]+)['"]|ck\s*\(\s*['"]_wp_http_\d+['"]\s*,\s*['"]([^'"]+)['"]/g;
    let encodedMatch;
    while ((encodedMatch = encodedPattern.exec(html)) !== null) {
      if (encodedMatch[1] || encodedMatch[2])
        encodedParts.push(encodedMatch[1] || encodedMatch[2]);
    }
    let landing = "";
    for (const encoded of encodedParts) {
      try {
        const payload = JSON.parse(decodeBase64(rot13(decodeBase64(decodeBase64(encoded)))));
        landing = decodeBase64(payload.o || "").trim();
        if (!landing && payload.data && payload.blog_url) {
          const redirect = yield request(`${payload.blog_url}?re=${encodeURIComponent(decodeBase64(payload.data).trim())}`, response.url);
          if (redirect.ok)
            landing = clean(yield redirect.text());
        }
        if (/^https?:\/\//i.test(landing))
          break;
      } catch (_) {
      }
    }
    if (!landing) {
      const urls = [];
      const urlPattern = /https?:\\?\/\\?\/[^"'<>\s]+/g;
      let urlMatch;
      while ((urlMatch = urlPattern.exec(html)) !== null)
        urls.push(urlMatch[0].replace(/\\\//g, "/"));
      landing = urls.find((url) => /hubcloud|hubdrive|hubcdn|hblinks/i.test(url)) || "";
    }
    if (!/^https?:\/\//i.test(landing))
      return [];
    const landingResponse = yield request(landing, response.url);
    if (!landingResponse.ok)
      return [];
    const landingHtml = yield landingResponse.text();
    if (/just a moment|cf-chl|turnstile/i.test(landingHtml))
      return [];
    const $ = cheerio3.load(landingHtml);
    const routes = [];
    $("a[href]").each((_, anchor) => {
      const url = absolute($(anchor).attr("href"), landingResponse.url);
      if (/hubcloud|hubdrive|hubcdn/i.test(url))
        routes.push(url);
    });
    if (!routes.length && /hubcloud|hubdrive|hubcdn/i.test(landingResponse.url))
      routes.push(landingResponse.url);
    const canonicalGroups = yield mapConcurrent2([...new Set(routes)], 3, (url) => __async(this, null, function* () {
      if (!/hubdrive/i.test(url))
        return [url];
      return expandHubDriveRoutes(__spreadProps(__spreadValues({}, item), { url, referer: landingResponse.url }));
    }));
    const canonicalRoutes = [...new Set(canonicalGroups.flat().filter(Boolean))];
    return (yield mapConcurrent2(canonicalRoutes, 3, (url) => resolveCandidate2(__spreadProps(__spreadValues({}, item), {
      url,
      referer: landingResponse.url,
      resolverType: /hubcdn/i.test(url) ? "hubcdn" : /hubdrive/i.test(url) ? "hubdrive" : "hubcloud"
    })))).flat();
  });
}
function decryptVidStack(ciphertext) {
  for (const iv of VIDSTACK_IVS) {
    try {
      const bytes = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Hex.parse(String(ciphertext).trim()) }, VIDSTACK_KEY, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      const decoded = bytes.toString(CryptoJS.enc.Utf8).replace(/[\u0000-\u001f]+$/g, "");
      if (decoded)
        return JSON.parse(decoded);
    } catch (_) {
    }
  }
  return null;
}
function resolveWatch(item) {
  return __async(this, null, function* () {
    const parsed = new URL(item.url);
    const id = parsed.hash.slice(1).split("&")[0] || parsed.pathname.split("/").filter(Boolean).pop();
    if (!id)
      return [];
    const response = yield request(`${parsed.origin}/api/v1/video?id=${encodeURIComponent(id)}`, item.url);
    if (!response.ok)
      return [];
    const raw = clean(yield response.text());
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (_) {
      payload = decryptVidStack(raw);
    }
    const mediaUrl = (payload == null ? void 0 : payload.cfNative) || (payload == null ? void 0 : payload.source);
    if (!/^https?:\/\//i.test(mediaUrl || ""))
      return [];
    const subtitles = Object.entries(payload.subtitle || {}).map(([language, url]) => ({ language, url: absolute(String(url).split("#")[0], parsed.origin) })).filter((entry) => entry.url);
    return [{
      name: `HDHub4u \u2022 ${item.quality} \u2022 Watch`,
      url: mediaUrl,
      quality: item.quality,
      size: item.size,
      source: "Watch",
      provider: "HDHub4u",
      headers: __spreadProps(__spreadValues({}, HEADERS2), { Referer: parsed.origin }),
      subtitles,
      seekable: true
    }];
  });
}
function resolveCandidate2(item) {
  return __async(this, null, function* () {
    var _a;
    if (!(item == null ? void 0 : item.url))
      return [];
    try {
      if (item.resolverType === "hubdrive")
        return resolveHubDrive(item);
      if (item.resolverType === "hubcdn")
        return resolveHubCdn(item);
      if (item.resolverType === "protector")
        return resolveProtected(item);
      if (item.resolverType === "watch")
        return resolveWatch(item);
      if (item.resolverType === "hubcloud") {
        const resolver = moviesDrive.resolveCandidate || ((_a = moviesDrive.default) == null ? void 0 : _a.resolveCandidate);
        if (typeof resolver !== "function")
          return [];
        return (yield resolver(__spreadProps(__spreadValues({}, item), { resolverType: "hubcloud" }))).map((stream) => __spreadProps(__spreadValues({}, stream), { provider: "HDHub4u" }));
      }
      return [];
    } catch (_) {
      return [];
    }
  });
}
function getStreams2(tmdbId, mediaType, season = 1, episode = 1) {
  return __async(this, null, function* () {
    const candidates = yield discoverCandidates2(tmdbId, mediaType, season, episode);
    const downloadCandidates = candidates.filter((candidate2) => candidate2.resolverType !== "watch");
    return uniqueExactStreams2((yield mapConcurrent2(downloadCandidates, 4, resolveCandidate2)).flat().filter(Boolean));
  });
}
module.exports = { discoverCandidates: discoverCandidates2, resolveCandidate: resolveCandidate2, getStreams: getStreams2 };
