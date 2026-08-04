/** MultiMovies - generated from src/providers/multimovies.js */
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
    function parseQuality(...values) {
      const text2 = values.filter(Boolean).join(" ").toLowerCase();
      if (/\b(?:2160p?|4k|uhd)\b/.test(text2))
        return "4K";
      for (const quality of [1440, 1080, 720, 576, 480, 360, 240]) {
        if (new RegExp(`\\b${quality}p?\\b`).test(text2))
          return `${quality}p`;
      }
      return "Unknown";
    }
    function parseMediaAttributes2(...values) {
      var _a;
      const text2 = values.filter(Boolean).join(" ");
      const lower = text2.toLowerCase();
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
        if (pattern.test(text2))
          languages.push(name);
      return {
        quality: parseQuality(text2),
        hdr: /\b(?:hdr10\+?|dolby\s*vision|dv)\b/i.test(text2),
        codec: /\b(?:hevc|h\.?265|x265)\b/i.test(text2) ? "HEVC" : /\b(?:avc|h\.?264|x264)\b/i.test(text2) ? "AVC" : void 0,
        audio: /\b(?:dual[ -]?audio|multi[ -]?audio|dual)\b/i.test(text2) ? "Dual/Multi Audio" : void 0,
        languages,
        size: (_a = text2.match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)\b/i)) == null ? void 0 : _a[0]
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
    function qualityRank(quality) {
      const text2 = String(quality || "").toUpperCase();
      if (text2 === "4K" || text2.includes("2160"))
        return 2160;
      const match = text2.match(/(1440|1080|720|576|480|360|240)/);
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
      parseQuality,
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

// src/providers/multimovies.js
var cheerio = require("cheerio-without-node-native");
var CryptoJS = require("crypto-js");
var DOMAINS = require_domains();
var { mapConcurrent, parseMediaAttributes, uniqueExactStreams } = require_streams();
var sharedMetadata = require_metadata();
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36";
var HEADERS = { "User-Agent": USER_AGENT, Accept: "text/html,*/*;q=0.8" };
var API_KEY = CryptoJS.enc.Utf8.parse("kiemtienmua911ca");
var API_IV = CryptoJS.enc.Utf8.parse("1234567890oiuytr");
function text(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const response = yield fetch(url, __spreadProps(__spreadValues({ redirect: "follow" }, options), { headers: __spreadValues(__spreadValues({}, HEADERS), options.headers || {}) }));
    if (!response.ok)
      throw new Error(`HTTP ${response.status} for ${url}`);
    return response.text();
  });
}
function getBaseUrl() {
  return __async(this, null, function* () {
    try {
      const domains = JSON.parse(yield text(DOMAINS.PHISHER_DOMAINS));
      if (domains.MultiMovies)
        return String(domains.MultiMovies).replace(/\/$/, "");
    } catch (_) {
    }
    return DOMAINS.MULTIMOVIES_FALLBACK;
  });
}
function metadata(tmdbId, mediaType) {
  return __async(this, null, function* () {
    return sharedMetadata.getMetadata(tmdbId, mediaType);
  });
}
var clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
var normalized = (value) => clean(value).toLowerCase().replace(/\(\d{4}\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
var absolute = (url, base) => {
  try {
    return new URL(url, base).toString();
  } catch (_) {
    return "";
  }
};
function selectResult(results, info, mediaType) {
  const target = normalized(info.title);
  return results.find((item) => {
    const name = normalized(item.title);
    const correctType = mediaType === "tv" ? /\/tvshows\//i.test(item.url) : /\/movies\//i.test(item.url);
    return correctType && (name === target || name.startsWith(`${target} `)) && (!info.year || item.text.includes(String(info.year)) || name === target);
  }) || results.find((item) => normalized(item.title) === target) || null;
}
function playerEmbeds(pageUrl) {
  return __async(this, null, function* () {
    const html = yield text(pageUrl, { headers: { Referer: new URL(pageUrl).origin } });
    const $ = cheerio.load(html);
    const options = $("#playeroptionsul li").toArray().map((item) => ({
      post: $(item).attr("data-post"),
      nume: $(item).attr("data-nume"),
      type: $(item).attr("data-type"),
      label: clean($(item).text())
    })).filter((item) => item.post && item.nume && !/trailer/i.test(`${item.nume} ${item.label}`));
    return mapConcurrent(options, 4, (item) => __async(this, null, function* () {
      try {
        const origin = new URL(pageUrl).origin;
        const response = yield fetch(`${origin}/wp-admin/admin-ajax.php`, {
          method: "POST",
          headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl, "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest" }),
          body: new URLSearchParams({ action: "doo_player_ajax", post: item.post, nume: item.nume, type: item.type || "" }).toString()
        });
        const data = yield response.json();
        const $embed = cheerio.load((data == null ? void 0 : data.embed_url) || "");
        return { url: absolute($embed("iframe").attr("src") || (data == null ? void 0 : data.embed_url), pageUrl), label: item.label };
      } catch (_) {
        return null;
      }
    })).then((items) => items.filter((item) => (item == null ? void 0 : item.url) && !/youtube/i.test(item.url)));
  });
}
function mirrorCandidates(embed, pageUrl) {
  return __async(this, null, function* () {
    try {
      const response = yield fetch(embed.url, { redirect: "follow", headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }) });
      const finalUrl = response.url || embed.url;
      const slug = new URL(embed.url).pathname.split("/").filter(Boolean).pop();
      if (!slug)
        return [];
      const helper = yield fetch(`${new URL(finalUrl).origin}/embedhelper2.php`, {
        method: "POST",
        headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: finalUrl, "Content-Type": "application/x-www-form-urlencoded" }),
        body: new URLSearchParams({ sid: slug, UserFavSite: "", currentDomain: new URL(pageUrl).hostname }).toString()
      });
      const data = yield helper.json();
      const ids = JSON.parse(atob(data.mresult || ""));
      return Object.entries(data.sources || {}).flatMap(([key, source]) => {
        const id = ids[key];
        if (!id || !source.siteUrl)
          return [];
        const origin = new URL(source.siteUrl).origin;
        if (!/rpmhub\.site|p2pplay\.pro|uns\.bio/i.test(origin))
          return [];
        return [{
          provider: "MultiMovies",
          source: `MultiMovies ${source.friendlyName || key}`,
          quality: "Unknown",
          url: `${origin}/#${id}`,
          referer: finalUrl,
          pageUrl,
          headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: `${origin}/#${id}` }),
          resolverType: "multimovies_api"
        }];
      });
    } catch (_) {
      return [];
    }
  });
}
function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  return __async(this, null, function* () {
    if (!tmdbId || !["movie", "tv"].includes(mediaType))
      return [];
    try {
      const [base, info] = yield Promise.all([getBaseUrl(), metadata(tmdbId, mediaType)]);
      const searchHtml = yield text(`${base}/?s=${encodeURIComponent(info.title)}`, { headers: { Referer: base } });
      const $ = cheerio.load(searchHtml);
      const results = $("div.result-item, article").toArray().map((item) => ({
        title: clean($(item).find(".title,h2,h3").first().text()),
        text: clean($(item).text()),
        url: absolute($(item).find("a").first().attr("href"), base)
      })).filter((item) => item.title && item.url);
      const selected = selectResult(results, info, mediaType);
      if (!selected)
        return [];
      let pageUrl = selected.url;
      if (mediaType === "tv") {
        const detail = cheerio.load(yield text(pageUrl, { headers: { Referer: base } }));
        const target = detail("#seasons ul.episodios li").toArray().find((item) => {
          const href = detail(item).find("a").attr("href") || "";
          const marker = href.match(/-(\d+)x(\d+)\/?$/i);
          return marker && Number(marker[1]) === Number(season) && Number(marker[2]) === Number(episode);
        });
        pageUrl = absolute(target && detail(target).find("a").attr("href"), selected.url);
        if (!pageUrl)
          return [];
      }
      const embeds = yield playerEmbeds(pageUrl);
      const groups = yield mapConcurrent(embeds, 3, (embed) => mirrorCandidates(embed, pageUrl));
      const seen = /* @__PURE__ */ new Set();
      return groups.flat().filter((item) => !seen.has(item.url) && seen.add(item.url));
    } catch (error) {
      console.log(`[MultiMovies Candidates] ${(error == null ? void 0 : error.message) || error}`);
      return [];
    }
  });
}
function decryptApi(hex) {
  const bytes = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Hex.parse(String(hex).trim()) }, API_KEY, { iv: API_IV, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8).replace(/[\u0000-\u001f]+$/g, ""));
}
function resolveCandidate(candidate) {
  return __async(this, null, function* () {
    if (!(candidate == null ? void 0 : candidate.url) || candidate.resolverType !== "multimovies_api")
      return [];
    try {
      const parsed = new URL(candidate.url);
      const id = parsed.hash.slice(1).split("&")[0];
      if (!id)
        return [];
      const apiUrl = `${parsed.origin}/api/v1/video?id=${encodeURIComponent(id)}&w=1920&h=1080&r=${encodeURIComponent(new URL(candidate.pageUrl).hostname)}`;
      const payload = decryptApi(yield text(apiUrl, { headers: { Referer: candidate.url } }));
      const mediaUrl = payload.cfNative || payload.source;
      if (!/^https?:\/\//i.test(mediaUrl || ""))
        return [];
      const attributes = parseMediaAttributes(payload.title, mediaUrl);
      const subtitles = Object.entries(payload.subtitle || {}).map(([language, url]) => ({ language, url: absolute(String(url).split("#")[0], parsed.origin) })).filter((item) => item.url);
      return [{
        provider: "MultiMovies",
        source: candidate.source,
        name: `MultiMovies \u2022 ${attributes.quality} \u2022 ${candidate.source.replace(/^MultiMovies\s*/i, "")}`,
        url: mediaUrl,
        quality: attributes.quality,
        headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: parsed.origin }),
        subtitles,
        seekable: true
      }];
    } catch (_) {
      return [];
    }
  });
}
function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  return __async(this, null, function* () {
    const candidates = yield discoverCandidates(tmdbId, mediaType, season, episode);
    const streams = yield mapConcurrent(candidates, 4, resolveCandidate);
    return uniqueExactStreams(streams.flat().filter(Boolean));
  });
}
module.exports = { discoverCandidates, resolveCandidate, getStreams };
