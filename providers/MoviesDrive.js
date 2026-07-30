/** MoviesDrive - generated from src/providers/moviesdrive.js */
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
    function withReferer2(headers, referer) {
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
    module2.exports = { DEFAULT_TIMEOUT_MS, getJson, getText, mergeHeaders, request, withReferer: withReferer2 };
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
      const attributes = parseMediaAttributes2(stream.url, stream.title, stream.name, stream.label, stream.fileName);
      return __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
        url: stream.url,
        quality: stream.quality || parseQuality(stream.url, stream.title, stream.name),
        title: stream.title || stream.name || defaults.title || "Stream",
        headers: mergeHeaders(defaults.headers, stream.headers),
        subtitles: normalizeSubtitles(stream.subtitles)
      }, stream.size || attributes.size ? { size: stream.size || attributes.size } : {}), stream.hdr !== void 0 || attributes.hdr ? { hdr: stream.hdr !== void 0 ? stream.hdr : attributes.hdr } : {}), stream.codec || attributes.codec ? { codec: stream.codec || attributes.codec } : {}), stream.audio || attributes.audio ? { audio: stream.audio || attributes.audio } : {}), stream.languages || attributes.languages.length ? { languages: stream.languages || attributes.languages } : {});
    }
    function uniqueStreams2(streams, defaults) {
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
    function resolveFinalUrl2(_0) {
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
          const resolved = yield resolveFinalUrl2(candidate, options, depth + 1).catch(() => null);
          if (resolved)
            return resolved;
        }
        const $ = parseHtml(html);
        const iframe = absoluteUrl($("iframe").first().attr("src") || $("iframe").first().attr("data-src"), finalUrl);
        if (iframe && iframe !== url)
          return resolveFinalUrl2(iframe, options, depth + 1).catch(() => null);
        return null;
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
      resolveFinalUrl: resolveFinalUrl2,
      uniqueStreams: uniqueStreams2
    };
  }
});

// src/providers/moviesdrive.js
var cheerio = require("cheerio-without-node-native");
var { withReferer } = require_http();
var { parseMediaAttributes, resolveFinalUrl, uniqueStreams } = require_streams();
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var TMDB_BASE_URL = "https://api.themoviedb.org/3";
var MAIN_URL = "https://new1.moviesdrive.christmas";
var DOMAINS_URL = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
var DOMAIN_CACHE_TTL = 4 * 60 * 60 * 1e3;
var domainCacheTimestamp = Date.now();
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  "Referer": `${MAIN_URL}/`
};
function formatBytes(bytes) {
  if (!bytes || bytes === 0)
    return "Unknown";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
function extractServerName(source) {
  if (!source)
    return "Unknown";
  const src = source.trim();
  if (/HubCloud/i.test(src)) {
    if (/FSL/i.test(src))
      return "HubCloud FSL Server";
    if (/FSL V2/i.test(src))
      return "HubCloud FSL V2 Server";
    if (/S3/i.test(src))
      return "HubCloud S3 Server";
    if (/Buzz/i.test(src))
      return "HubCloud BuzzServer";
    if (/10\s*Gbps/i.test(src))
      return "HubCloud 10Gbps";
    return "HubCloud";
  }
  if (/Pixeldrain/i.test(src))
    return "Pixeldrain";
  if (/StreamTape/i.test(src))
    return "StreamTape";
  if (/HubCdn/i.test(src))
    return "HubCdn";
  if (/HbLinks/i.test(src))
    return "HbLinks";
  if (/Hubstream/i.test(src))
    return "Hubstream";
  return src.replace(/^www\./i, "").split(/[.\s]/)[0];
}
var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function atob(value) {
  if (!value)
    return "";
  let input = String(value).replace(/=+$/, "");
  let output = "";
  let bc = 0, bs, buffer, idx = 0;
  while (buffer = input.charAt(idx++)) {
    buffer = BASE64_CHARS.indexOf(buffer);
    if (~buffer) {
      bs = bc % 4 ? bs * 64 + buffer : buffer;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & bs >> (-2 * bc & 6));
      }
    }
  }
  return output;
}
function cleanTitle(title) {
  const parts = title.split(/[.\-_]/);
  const qualityTags = [
    "WEBRip",
    "WEB-DL",
    "WEB",
    "BluRay",
    "HDRip",
    "DVDRip",
    "HDTV",
    "CAM",
    "TS",
    "R5",
    "DVDScr",
    "BRRip",
    "BDRip",
    "DVD",
    "PDTV",
    "HD"
  ];
  const audioTags = [
    "AAC",
    "AC3",
    "DTS",
    "MP3",
    "FLAC",
    "DD5",
    "EAC3",
    "Atmos"
  ];
  const subTags = [
    "ESub",
    "ESubs",
    "Subs",
    "MultiSub",
    "NoSub",
    "EnglishSub",
    "HindiSub"
  ];
  const codecTags = [
    "x264",
    "x265",
    "H264",
    "HEVC",
    "AVC"
  ];
  const startIndex = parts.findIndex(
    (part) => qualityTags.some((tag) => part.toLowerCase().includes(tag.toLowerCase()))
  );
  const endIndex = parts.findLastIndex(
    (part) => subTags.some((tag) => part.toLowerCase().includes(tag.toLowerCase())) || audioTags.some((tag) => part.toLowerCase().includes(tag.toLowerCase())) || codecTags.some((tag) => part.toLowerCase().includes(tag.toLowerCase()))
  );
  if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
    return parts.slice(startIndex, endIndex + 1).join(".");
  } else if (startIndex !== -1) {
    return parts.slice(startIndex).join(".");
  } else {
    return parts.slice(-3).join(".");
  }
}
function fetchAndUpdateDomain() {
  return __async(this, null, function* () {
    const now = Date.now();
    if (now - domainCacheTimestamp < DOMAIN_CACHE_TTL) {
      return;
    }
    console.log("[Moviesdrive] Fetching latest domain...");
    try {
      const response = yield fetch(DOMAINS_URL, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      if (response.ok) {
        const data = yield response.json();
        if (data && (data.moviesdrive || data.Moviesdrive)) {
          const newDomain = String(data.moviesdrive || data.Moviesdrive).replace(/\/$/, "");
          try {
            const probe = yield fetch(`${newDomain}/search.php?q=test&page=1`, {
              headers: { "User-Agent": HEADERS["User-Agent"] }
            });
            if (probe.ok && /json/i.test(probe.headers.get("content-type") || "")) {
              if (newDomain !== MAIN_URL) {
                console.log(`[Moviesdrive] Updating domain from ${MAIN_URL} to ${newDomain}`);
                MAIN_URL = newDomain;
                HEADERS.Referer = `${MAIN_URL}/`;
              }
            } else {
              console.warn(`[Moviesdrive] Ignoring unavailable domain: ${newDomain}`);
            }
          } catch (_) {
            console.warn(`[Moviesdrive] Ignoring unreachable domain: ${newDomain}`);
          }
        }
      }
    } catch (error) {
      console.error(`[Moviesdrive] Failed to fetch latest domains: ${error.message}`);
    } finally {
      domainCacheTimestamp = now;
    }
  });
}
function getCurrentDomain() {
  return fetchAndUpdateDomain().then(function() {
    return MAIN_URL;
  });
}
function pixelDrainExtractor(link2) {
  return Promise.resolve().then(() => {
    let fileId;
    const match = link2.match(/(?:file|u)\/([A-Za-z0-9]+)/);
    if (match) {
      fileId = match[1];
    } else {
      fileId = link2.split("/").pop();
    }
    if (!fileId) {
      return [{ source: "Pixeldrain", quality: "Unknown", url: link2 }];
    }
    const infoUrl = `https://pixeldrain.com/api/file/${fileId}/info`;
    let fileInfo = { name: "", quality: "Unknown", size: 0 };
    return fetch(infoUrl, { headers: HEADERS }).then((response) => response.json()).then((info) => {
      if (info && info.name) {
        fileInfo.name = info.name;
        fileInfo.size = info.size || 0;
        const qualityMatch = info.name.match(/(\d{3,4})p/);
        if (qualityMatch) {
          fileInfo.quality = qualityMatch[0];
        }
      }
      const directUrl = `https://pixeldrain.com/api/file/${fileId}?download`;
      return [{
        source: "Pixeldrain",
        quality: fileInfo.quality,
        url: directUrl,
        name: fileInfo.name,
        size: fileInfo.size
      }];
    }).catch((e) => {
      console.warn(`[Pixeldrain] Could not fetch file info for ${fileId}:`, e.message);
      const directUrl = `https://pixeldrain.com/api/file/${fileId}?download`;
      return [{
        source: "Pixeldrain",
        quality: fileInfo.quality,
        url: directUrl,
        name: fileInfo.name,
        size: fileInfo.size
      }];
    });
  }).catch((e) => {
    console.error("[Pixeldrain] extraction failed", e.message);
    return [{ source: "Pixeldrain", quality: "Unknown", url: link2 }];
  });
}
function streamTapeExtractor(link2) {
  const url = new URL(link2);
  url.hostname = "streamtape.com";
  const normalizedLink = url.toString();
  return fetch(normalizedLink, { headers: HEADERS }).then((res) => res.text()).then((data) => {
    const match = data.match(/document\.getElementById\('videolink'\)\.innerHTML = (.*?);/);
    if (match && match[1]) {
      const scriptContent = match[1];
      const urlPartMatch = scriptContent.match(/'(\/\/streamtape\.com\/get_video[^']+)'/);
      if (urlPartMatch && urlPartMatch[1]) {
        const videoSrc = "https:" + urlPartMatch[1];
        return [{ source: "StreamTape", quality: "Stream", url: videoSrc }];
      }
    }
    const simpleMatch = data.match(/'(\/\/streamtape\.com\/get_video[^']+)'/);
    if (simpleMatch && simpleMatch[0]) {
      const videoSrc = "https:" + simpleMatch[0].slice(1, -1);
      return [{ source: "StreamTape", quality: "Stream", url: videoSrc }];
    }
    return [];
  }).catch((e) => {
    if (!e.response || e.response.status !== 404) {
      console.error(`[StreamTape] An unexpected error occurred for ${normalizedLink}:`, e.message);
    }
    return [];
  });
}
function hubStreamExtractor(url, referer) {
  return fetch(url, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }) }).then((response) => {
    return [{ source: "Hubstream", quality: "Unknown", url }];
  }).catch((e) => {
    console.error(`[Hubstream] Failed to extract from ${url}:`, e.message);
    return [];
  });
}
function hbLinksExtractor(url, referer) {
  return fetch(url, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }) }).then((response) => response.text()).then((data) => {
    const $ = cheerio.load(data);
    const links = $("h3 a, div.entry-content p a").map((i, el) => $(el).attr("href")).get();
    const finalLinks = [];
    const promises = links.map((link2) => loadExtractor(link2, url));
    return Promise.all(promises).then((results) => {
      results.forEach((extracted) => finalLinks.push(...extracted));
      return finalLinks;
    });
  });
}
function hubCdnExtractor(url, referer) {
  return fetch(url, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }) }).then((response) => response.text()).then((data) => {
    const encodedMatch = data.match(/r=([A-Za-z0-9+/=]+)/);
    if (encodedMatch && encodedMatch[1]) {
      const m3u8Data = atob(encodedMatch[1]);
      const m3u8Link = m3u8Data.substring(m3u8Data.lastIndexOf("link=") + 5);
      return [{
        source: "HubCdn",
        quality: "M3U8",
        url: m3u8Link
      }];
    }
    return [];
  }).catch(() => []);
}
function hubDriveExtractor(url, referer) {
  return fetch(url, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }) }).then((response) => response.text()).then((data) => {
    const $ = cheerio.load(data);
    const href = $(".btn.btn-primary.btn-user.btn-success1.m-1").attr("href");
    if (href) {
      return loadExtractor(href, url);
    }
    return [];
  }).catch(() => []);
}
function hubCloudExtractor(url, referer) {
  let currentUrl = url;
  if (currentUrl.includes("hubcloud.ink")) {
    currentUrl = currentUrl.replace("hubcloud.ink", "hubcloud.dad");
  }
  if (/search-recover\.php/i.test(currentUrl)) {
    return fetch(currentUrl, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }) }).then((response) => __async(this, null, function* () {
      var _a, _b;
      const html = yield response.text();
      const query = ((_a = html.match(/Q_INITIAL\s*=\s*"([^"]+)"/)) == null ? void 0 : _a[1]) || "";
      const token = ((_b = html.match(/FROM_AC_TOKEN\s*=\s*"([^"]+)"/)) == null ? void 0 : _b[1]) || "";
      if (!query || !token)
        return [];
      const apiUrl = new URL(response.url || currentUrl);
      apiUrl.search = new URLSearchParams({ api: "search", q: query, page: "1", from_ac: token }).toString();
      const apiResponse = yield fetch(apiUrl.toString(), {
        headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: response.url || currentUrl, Accept: "application/json" })
      });
      const data = yield apiResponse.json();
      const titleWords = query.toLowerCase().replace(/\b(download|19\d{2}|20\d{2}|2160p|1080p|720p|480p)\b/g, "").split(/\W+/).filter((word) => word.length > 2);
      const hits = (data.hits || []).filter((hit) => {
        const name = String(hit.file_name || "").toLowerCase();
        return titleWords.length > 0 && titleWords.every((word) => name.includes(word));
      });
      const resolved = yield Promise.all(hits.map((hit) => loadExtractor(hit.url, apiUrl.toString()).catch(() => [])));
      return resolved.flat();
    })).catch(() => []);
  }
  if (/\/(video|drive)\//i.test(currentUrl)) {
    return fetch(currentUrl, {
      headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer })
    }).then((r) => r.text()).then((html) => {
      const $ = cheerio.load(html);
      const hubPhp = $('a[href*="hubcloud.php"]').attr("href");
      if (!hubPhp)
        return [];
      return hubCloudExtractor(hubPhp, currentUrl);
    }).catch(() => []);
  }
  const initialFetch = currentUrl.includes("hubcloud.php") ? fetch(currentUrl, {
    headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }),
    redirect: "follow"
  }).then(
    (response) => response.text().then((html) => ({
      pageData: html,
      finalUrl: response.url || currentUrl
    }))
  ) : fetch(currentUrl, {
    headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer })
  }).then((r) => r.text()).then((pageData) => {
    let finalUrl = currentUrl;
    const scriptUrlMatch = pageData.match(/var url = '([^']*)'/);
    if (scriptUrlMatch && scriptUrlMatch[1]) {
      finalUrl = scriptUrlMatch[1];
      return fetch(finalUrl, {
        headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: currentUrl })
      }).then((r) => r.text()).then((secondData) => ({
        pageData: secondData,
        finalUrl
      }));
    }
    return { pageData, finalUrl };
  });
  return initialFetch.then(({ pageData, finalUrl }) => {
    const $ = cheerio.load(pageData);
    const size = $("i#size").text().trim();
    const header = $("div.card-header").text().trim();
    const getIndexQuality2 = (str) => {
      const match = (str || "").match(/(\d{3,4})[pP]/);
      return match ? parseInt(match[1]) : 2160;
    };
    const quality = getIndexQuality2(header);
    const headerDetails = cleanTitle(header);
    const labelExtras = (() => {
      let extras = "";
      if (headerDetails)
        extras += `[${headerDetails}]`;
      if (size)
        extras += `[${size}]`;
      return extras;
    })();
    const sizeInBytes2 = (() => {
      if (!size)
        return 0;
      const m = size.match(/([\d.]+)\s*(GB|MB|KB)/i);
      if (!m)
        return 0;
      const v = parseFloat(m[1]);
      if (m[2].toUpperCase() === "GB")
        return v * 1024 ** 3;
      if (m[2].toUpperCase() === "MB")
        return v * 1024 ** 2;
      if (m[2].toUpperCase() === "KB")
        return v * 1024;
      return 0;
    })();
    const links = [];
    const elements = $("a.btn[href]").get();
    const processElements = elements.map((el) => {
      var _a;
      const link2 = $(el).attr("href");
      const text = $(el).text();
      if (/telegram/i.test(text) || /telegram/i.test(link2)) {
        return Promise.resolve();
      }
      console.log(`[HubCloud] Found ${text} link ${link2}`);
      const fileName = header || headerDetails || "Unknown";
      if (text.includes("Download File")) {
        links.push({
          source: `HubCloud ${labelExtras}`,
          quality,
          url: link2,
          size: sizeInBytes2,
          fileName
        });
        return Promise.resolve();
      }
      if (text.includes("FSL V2")) {
        links.push({
          source: `HubCloud - FSL V2 Server ${labelExtras}`,
          quality,
          url: link2,
          size: sizeInBytes2,
          fileName
        });
        return Promise.resolve();
      }
      if (text.includes("FSL")) {
        links.push({
          source: `HubCloud - FSL Server ${labelExtras}`,
          quality,
          url: link2,
          size: sizeInBytes2,
          fileName
        });
        return Promise.resolve();
      }
      if (text.includes("S3 Server")) {
        links.push({
          source: `HubCloud - S3 Server ${labelExtras}`,
          quality,
          url: link2,
          size: sizeInBytes2,
          fileName
        });
        return Promise.resolve();
      }
      if (text.includes("BuzzServer")) {
        return fetch(`${link2}/download`, {
          method: "GET",
          headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: link2 }),
          redirect: "manual"
        }).then((resp) => {
          if (resp.status >= 300 && resp.status < 400) {
            const loc = resp.headers.get("location");
            const m = loc == null ? void 0 : loc.match(/hx-redirect=([^&]+)/);
            if (m) {
              links.push({
                source: `HubCloud - BuzzServer ${labelExtras}`,
                quality,
                url: decodeURIComponent(m[1]),
                size: sizeInBytes2,
                fileName
              });
            }
          }
        }).catch(() => {
        });
      }
      if (link2.includes("pixeldra")) {
        const fileId = (_a = link2.match(/(?:file|u)\/([A-Za-z0-9]+)/)) == null ? void 0 : _a[1];
        if (fileId) {
          links.push({
            source: "Pixeldrain",
            quality,
            url: `https://pixeldrain.com/api/file/${fileId}?download`,
            size: sizeInBytes2,
            fileName
          });
        }
        return Promise.resolve();
      }
      if (text.includes("10Gbps")) {
        return Promise.resolve();
      }
      return loadExtractor(link2, finalUrl).then((r) => links.push(...r));
    });
    return Promise.all(processElements).then(() => links);
  }).catch(() => []);
}
function gdFlixExtractor(url, referer = null) {
  return __async(this, null, function* () {
    var _a, _b, _c, _d, _e, _f;
    const links = [];
    const getIndexQuality2 = (name) => {
      const m = (name || "").match(/(\d{3,4})[pP]/);
      return m ? parseInt(m[1]) : 2160;
    };
    const toBytes = (size) => {
      if (!size)
        return 0;
      const m = size.match(/([\d.]+)\s*(GB|MB|KB)/i);
      if (!m)
        return 0;
      const v = parseFloat(m[1]);
      return m[2].toUpperCase() === "GB" ? v * 1024 ** 3 : m[2].toUpperCase() === "MB" ? v * 1024 ** 2 : v * 1024;
    };
    try {
      let res = yield fetch(url, { headers: HEADERS });
      let html = yield res.text();
      let refresh = html.match(/url=([^"]+)/i);
      let finalUrl = refresh ? refresh[1] : url;
      const page = yield fetch(finalUrl, { headers: HEADERS }).then((r) => r.text());
      const $ = cheerio.load(page);
      const fileName = $('li:contains("Name")').text().replace("Name :", "").trim();
      const fileSizeText = $('li:contains("Size")').text().replace("Size :", "").trim();
      const quality = getIndexQuality2(fileName);
      const sizeBytes = toBytes(fileSizeText);
      const anchors = $("div.text-center a[href]").get();
      for (const a of anchors) {
        const el = $(a);
        const text = el.text().toLowerCase();
        const href = el.attr("href");
        if (text.includes("direct")) {
          links.push({
            source: "GDFlix [Direct]",
            quality,
            url: href,
            size: sizeBytes,
            fileName
          });
        } else if (text.includes("index")) {
          const indexPage = yield fetch(`https://new6.gdflix.dad${href}`).then((r) => r.text());
          const $$ = cheerio.load(indexPage);
          const btns = $$("a.btn-outline-info").get();
          for (const b of btns) {
            const serverUrl = "https://new6.gdflix.dad" + $$(b).attr("href");
            const serverPage = yield fetch(serverUrl).then((r) => r.text());
            const $$$ = cheerio.load(serverPage);
            $$$("div.mb-4 > a[href]").each((_, x) => {
              links.push({
                source: "GDFlix [Index]",
                quality,
                url: $$(x).attr("href"),
                size: sizeBytes,
                fileName
              });
            });
          }
        } else if (text.includes("drivebot")) {
          const id = (_a = href.match(/id=([^&]+)/)) == null ? void 0 : _a[1];
          const doId = (_b = href.match(/do=([^=]+)/)) == null ? void 0 : _b[1];
          if (!id || !doId)
            continue;
          const bases = ["https://drivebot.sbs", "https://drivebot.cfd"];
          for (const base of bases) {
            try {
              const bot = yield fetch(`${base}/download?id=${id}&do=${doId}`);
              const cookie = bot.headers.get("set-cookie") || "";
              const html2 = yield bot.text();
              const token = (_c = html2.match(/token', '([a-f0-9]+)/)) == null ? void 0 : _c[1];
              const postId = (_d = html2.match(/download\?id=([^']+)/)) == null ? void 0 : _d[1];
              if (!token || !postId)
                continue;
              const dl = yield fetch(`${base}/download?id=${postId}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Referer": `${base}/download?id=${id}&do=${doId}`,
                  "Cookie": cookie
                },
                body: `token=${token}`
              }).then((r) => r.text());
              const final = (_f = (_e = dl.match(/url":"(.*?)"/)) == null ? void 0 : _e[1]) == null ? void 0 : _f.replace(/\\/g, "");
              if (final) {
                links.push({
                  source: "GDFlix [DriveBot]",
                  quality,
                  url: final,
                  size: sizeBytes,
                  fileName
                });
              }
            } catch (e) {
            }
          }
        } else if (text.includes("instant")) {
          const r = yield fetch(href, { redirect: "manual" });
          const loc = r.headers.get("location");
          if (loc) {
            links.push({
              source: "GDFlix [Instant]",
              quality,
              url: loc.replace("url=", ""),
              size: sizeBytes,
              fileName
            });
          }
        } else if (text.includes("gofile")) {
          const extracted = yield goFileExtractor(href);
          extracted.forEach((l) => links.push(__spreadProps(__spreadValues({}, l), {
            quality,
            size: l.size || sizeBytes,
            fileName
          })));
        } else if (text.includes("pixel")) {
          return pixelDrainExtractor(link).then((extracted) => {
            links.push(...extracted.map((l) => __spreadProps(__spreadValues({}, l), {
              quality: typeof l.quality === "number" ? l.quality : quality,
              size: l.size || sizeInBytes,
              fileName
            })));
          }).catch(() => {
          });
        }
      }
    } catch (e) {
    }
    return links;
  });
}
function goFileExtractor(url) {
  return __async(this, null, function* () {
    var _a, _b, _c;
    const links = [];
    try {
      const id = (_a = url.match(/(?:\?c=|\/d\/)([a-zA-Z0-9-]+)/)) == null ? void 0 : _a[1];
      if (!id)
        return [];
      const acc = yield fetch("https://api.gofile.io/accounts", { method: "POST" }).then((r) => r.json());
      const token = (_b = acc == null ? void 0 : acc.data) == null ? void 0 : _b.token;
      if (!token)
        return [];
      const js = yield fetch("https://gofile.io/dist/js/global.js").then((r) => r.text());
      const wt = (_c = js.match(/appdata\.wt\s*=\s*["']([^"']+)/)) == null ? void 0 : _c[1];
      if (!wt)
        return [];
      const data = yield fetch(`https://api.gofile.io/contents/${id}?wt=${wt}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((r) => r.json());
      const files = Object.values(data.data.children);
      const file = files[0];
      if (!file)
        return [];
      const size = file.size;
      const sizeFormatted = size < 1024 ** 3 ? `${(size / 1024 ** 2).toFixed(2)} MB` : `${(size / 1024 ** 3).toFixed(2)} GB`;
      links.push({
        source: "GoFile",
        quality: getIndexQuality(file.name),
        url: file.link,
        size,
        fileName: file.name,
        headers: { Cookie: `accountToken=${token}` },
        label: `GoFile [${sizeFormatted}]`
      });
    } catch (e) {
    }
    return links;
  });
}
function loadExtractor(url, referer = MAIN_URL) {
  const hostname = new URL(url).hostname;
  if (hostname.includes("gdflix")) {
    return gdFlixExtractor(url, referer);
  }
  if (hostname.includes("gofile")) {
    return goFileExtractor(url);
  }
  if (hostname.includes("hubcloud")) {
    return hubCloudExtractor(url, referer);
  }
  if (hostname.includes("hubdrive")) {
    return hubDriveExtractor(url, referer);
  }
  if (hostname.includes("hubcdn")) {
    return hubCdnExtractor(url, referer);
  }
  if (hostname.includes("hblinks")) {
    return hbLinksExtractor(url, referer);
  }
  if (hostname.includes("hubstream")) {
    return hubStreamExtractor(url, referer);
  }
  if (hostname.includes("pixeldrain")) {
    return pixelDrainExtractor(url);
  }
  if (hostname.includes("streamtape")) {
    return streamTapeExtractor(url);
  }
  if (hostname.includes("hdstream4u")) {
    return Promise.resolve([{ source: "HdStream4u", quality: "Unknown", url }]);
  }
  if (hostname.includes("linkrit")) {
    return Promise.resolve([]);
  }
  if (hostname.includes("google.") || hostname.includes("ampproject.org") || hostname.includes("gstatic.") || hostname.includes("doubleclick.") || hostname.includes("ddl2")) {
    console.warn("[Moviesdrive] Blocked redirect host:", hostname);
    return Promise.resolve([]);
  }
  const sourceName = hostname.replace(/^www\./, "");
  return Promise.resolve([{ source: sourceName, quality: "Unknown", url }]);
}
function search(imdbId, page = 1) {
  return getCurrentDomain().then((currentDomain) => {
    const apiUrl = `${currentDomain}/search.php?q=${encodeURIComponent(imdbId)}&page=${page}`;
    console.log(`[Moviesdrive] Searching API: ${apiUrl}`);
    return fetch(apiUrl, { headers: HEADERS });
  }).then((res) => res.json()).then((json) => {
    var _a;
    if (!((_a = json == null ? void 0 : json.hits) == null ? void 0 : _a.length)) {
      console.log("[Moviesdrive] No results");
      return [];
    }
    const results = json.hits.map((hit) => hit.document).filter((doc) => !/^tt\d+$/i.test(imdbId) || !doc.imdb_id || doc.imdb_id === imdbId).map((doc) => {
      var _a2;
      return {
        title: doc.post_title,
        url: doc.permalink.startsWith("http") ? doc.permalink : `${MAIN_URL}${doc.permalink.startsWith("/") ? "" : "/"}${doc.permalink}`,
        poster: (_a2 = doc.post_thumbnail) != null ? _a2 : null,
        year: (() => {
          const match = doc.post_title.match(/\b(19|20)\d{2}\b/);
          return match ? Number(match[0]) : null;
        })(),
        imdbId: doc.imdb_id
      };
    });
    console.log(`[Moviesdrive] Search results: ${results.length}`);
    return results;
  });
}
function getDownloadLinks(mediaUrl, season, episode) {
  return getCurrentDomain().then((currentDomain) => {
    HEADERS.Referer = `${currentDomain}/`;
    return fetch(mediaUrl, { headers: HEADERS });
  }).then((response) => response.text()).then((data) => {
    const $ = cheerio.load(data);
    const typeRaw = $("h1.post-title").text();
    const isMovie = typeRaw.toLowerCase().includes("movie");
    const title = $(".poster-title").first().text().trim();
    const seasonMatch = title.match(/\bSeason\s*(\d+)\b/i);
    const seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : null;
    if (isMovie) {
      const links = $("h5 a").map((_, el) => $(el).attr("href")).get().filter(Boolean);
      console.error(`[Moviesdrive] Found ${links.length} h5 links`);
      const hosterRegex = /hubcloud|gdflix|gdlink/i;
      const extractMdrive = (url) => {
        return fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }).then((res) => res.text()).then((html) => {
          const $$ = cheerio.load(html);
          return $$("a[href]").map((_, el) => {
            const href = $$(el).attr("href");
            return hosterRegex.test(href) ? href : null;
          }).get().filter(Boolean);
        }).catch((e) => {
          console.error("[Moviesdrive] Error extracting links:", e.message);
          return [];
        });
      };
      const promises = links.map((url) => {
        if (hosterRegex.test(url)) {
          return loadExtractor(url, mediaUrl).catch((err) => {
            console.error(`[Moviesdrive] Failed direct extractor ${url}:`, err.message);
            return [];
          });
        }
        return extractMdrive(url).then((extractedUrls) => {
          return Promise.all(
            extractedUrls.map(
              (serverUrl) => loadExtractor(serverUrl, mediaUrl).catch((err) => {
                console.error(
                  `[Moviesdrive] Failed extractor ${serverUrl}:`,
                  err.message
                );
                return [];
              })
            )
          );
        }).catch((err) => {
          console.error("[Moviesdrive] Failed extractMdrive:", err.message);
          return [];
        });
      });
      return Promise.all(promises).then((results) => {
        const flat = results.flat(2);
        const seen = /* @__PURE__ */ new Set();
        const finalLinks = flat.filter((link2) => {
          if (!(link2 == null ? void 0 : link2.url) || seen.has(link2.url))
            return false;
          seen.add(link2.url);
          return true;
        });
        console.error(
          `[Moviesdrive] Final extracted movie streams: ${finalLinks.length}`
        );
        return {
          finalLinks,
          isMovie: true
        };
      });
    } else {
      const seasonPattern = new RegExp(`Season\\s*0?${season}\\b`, "i");
      const episodePattern = new RegExp(`Ep\\s*0?${episode}\\b`, "i");
      const seasonPageUrls = [];
      $("h5").each((_, el) => {
        const text = $(el).text();
        if (seasonPattern.test(text)) {
          $(el).nextAll("h5").each((_2, h5) => {
            const a = $(h5).find("a[href]");
            if (a.length && /single\s*episode/i.test(a.text()) && !/zip/i.test(a.text())) {
              const href = a.attr("href");
              if (href && !seasonPageUrls.includes(href)) {
                seasonPageUrls.push(href);
              }
            }
          });
        }
      });
      if (seasonPageUrls.length === 0) {
        console.error("[Moviesdrive] No single-episode pages found for season", season);
        return Promise.resolve({ finalLinks: [], isMovie: false });
      }
      const mdrivePromises = seasonPageUrls.map(
        (seasonPageUrl) => fetch(seasonPageUrl, { headers: HEADERS }).then((r) => r.text()).then((html) => {
          const $$ = cheerio.load(html);
          const episodeLinks = [];
          $$("h5").each((_, h) => {
            if (episodePattern.test($$(h).text())) {
              let next = $$(h).next();
              while (next.length && next.prop("tagName") !== "HR") {
                const a = next.find("a[href]").addBack("a[href]");
                if (a.length) {
                  const href = a.attr("href");
                  if (/hubcloud/i.test(href)) {
                    episodeLinks.push(href);
                  }
                }
                next = next.next();
              }
            }
          });
          return episodeLinks;
        }).catch(() => [])
      );
      return Promise.all(mdrivePromises).then((allEpisodeLinks) => {
        const flatLinks = allEpisodeLinks.flat();
        if (flatLinks.length === 0) {
          console.error("[Moviesdrive] No episode links found for episode", episode);
          return { finalLinks: [], isMovie: false };
        }
        const extractorPromises = flatLinks.map(
          (serverUrl) => console.log("[DEBUG] Loading extractor for", serverUrl) || loadExtractor(serverUrl, seasonPageUrls[0]).catch((e) => {
            console.error(
              `[Moviesdrive] Failed extractor ${serverUrl}:`,
              e.message
            );
            return [];
          })
        );
        return Promise.all(extractorPromises).then((results) => {
          const flat = results.flat();
          const seen = /* @__PURE__ */ new Set();
          const finalLinks = flat.filter((link2) => {
            if (!(link2 == null ? void 0 : link2.url) || seen.has(link2.url))
              return false;
            seen.add(link2.url);
            return true;
          });
          console.log(
            `[Moviesdrive] Final extracted episode streams: ${finalLinks.length}`
          );
          return {
            finalLinks,
            isMovie: false
          };
        });
      });
    }
  });
}
function getTMDBDetails(tmdbId, mediaType) {
  const endpoint = mediaType === "tv" ? "tv" : "movie";
  const url = `${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
  return fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  }).then(function(response) {
    console.error("[TMDB] HTTP status:", response.status);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    return response.json();
  }).then(function(data) {
    var _a;
    const title = mediaType === "tv" ? data.name : data.title;
    const releaseDate = mediaType === "tv" ? data.first_air_date : data.release_date;
    const year = releaseDate ? parseInt(releaseDate.split("-")[0]) : null;
    return {
      title,
      year,
      imdbId: ((_a = data.external_ids) == null ? void 0 : _a.imdb_id) || null
    };
  });
}
function normalizeTitle(title) {
  if (!title)
    return "";
  return title.toLowerCase().replace(/\b(the|a|an)\b/g, "").replace(/[:\-_]/g, " ").replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();
}
function calculateTitleSimilarity(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  if (norm1 === norm2)
    return 1;
  if (norm1.includes(norm2) || norm2.includes(norm1))
    return 0.9;
  const words1 = new Set(norm1.split(/\s+/).filter((w) => w.length > 2));
  const words2 = new Set(norm2.split(/\s+/).filter((w) => w.length > 2));
  if (words1.size === 0 || words2.size === 0)
    return 0;
  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = /* @__PURE__ */ new Set([...words1, ...words2]);
  return intersection.size / union.size;
}
function findBestTitleMatch(mediaInfo, searchResults, mediaType, season) {
  if (!searchResults || searchResults.length === 0)
    return null;
  let bestMatch = null;
  let bestScore = 0;
  for (const result of searchResults) {
    let score = calculateTitleSimilarity(mediaInfo.title, result.title);
    if (mediaInfo.year && result.year) {
      const yearDiff = Math.abs(mediaInfo.year - result.year);
      if (yearDiff === 0) {
        score += 0.2;
      } else if (yearDiff <= 1) {
        score += 0.1;
      } else if (yearDiff > 5) {
        score -= 0.3;
      }
    }
    if (mediaType === "tv" && season) {
      const titleLower = result.title.toLowerCase();
      const hasSeason = titleLower.includes(`season ${season}`) || titleLower.includes(`s${season}`) || titleLower.includes(`season ${season.toString().padStart(2, "0")}`);
      if (hasSeason) {
        score += 0.3;
      } else {
        score -= 0.2;
      }
    }
    if (result.title.toLowerCase().includes("2160p") || result.title.toLowerCase().includes("4k")) {
      score += 0.05;
    }
    if (score > bestScore && score > 0.3) {
      bestScore = score;
      bestMatch = result;
    }
  }
  if (bestMatch) {
    console.log(`[Moviesdrive] Best title match: "${bestMatch.title}" (score: ${bestScore.toFixed(2)})`);
  }
  return bestMatch;
}
function getStreamsLegacy(tmdbId, mediaType = "movie", season = null, episode = null) {
  console.log(`[Moviesdrive] Fetching streams for TMDB ID: ${tmdbId}, Type: ${mediaType}${mediaType === "tv" ? `, S:${season}E:${episode}` : ""}`);
  return getTMDBDetails(tmdbId, mediaType).then(function(mediaInfo) {
    if (!mediaInfo.title) {
      throw new Error("Could not extract title from TMDB response");
    }
    console.log(`[Moviesdrive] TMDB Info: "${mediaInfo.title}" (${mediaInfo.year || "N/A"})`);
    const searchQuery = mediaInfo.imdbId ? mediaInfo.imdbId : mediaInfo.title;
    console.log(`[Moviesdrive] Searching for: "${searchQuery}"`);
    return search(searchQuery).then(function(searchResults) {
      return __async(this, null, function* () {
        if (searchResults.length === 0 && mediaInfo.imdbId) {
          searchResults = yield search(mediaInfo.title);
        }
        if (searchResults.length === 0) {
          console.log("[Moviesdrive] No search results found");
          return [];
        }
        const bestMatch = findBestTitleMatch(mediaInfo, searchResults, mediaType, season);
        const selectedMedia = bestMatch || searchResults[0];
        console.log(`[Moviesdrive] Selected: "${selectedMedia.title}" (${selectedMedia.url})`);
        return getDownloadLinks(selectedMedia.url, season, episode).then(function(result) {
          const { finalLinks, isMovie } = result;
          let filteredLinks = finalLinks;
          const streams = filteredLinks.filter(function(link2) {
            console.log("[Moviesdrive] Processing link from source:", link2.source);
            return link2 && link2.url;
          }).map(function(link2) {
            let mediaTitle;
            if (link2.fileName && link2.fileName !== "Unknown") {
              mediaTitle = link2.fileName;
            } else if (mediaType === "tv" && season && episode) {
              mediaTitle = `${mediaInfo.title} S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
            } else if (mediaInfo.year) {
              mediaTitle = `${mediaInfo.title} (${mediaInfo.year})`;
            } else {
              mediaTitle = mediaInfo.title;
            }
            const formattedSize = formatBytes(link2.size);
            const serverName = extractServerName(link2.source);
            let qualityStr = "Unknown";
            if (link2.quality >= 2160)
              qualityStr = "2160p";
            else if (link2.quality >= 1440)
              qualityStr = "1440p";
            else if (link2.quality >= 1080)
              qualityStr = "1080p";
            else if (link2.quality >= 720)
              qualityStr = "720p";
            else if (link2.quality >= 480)
              qualityStr = "480p";
            else if (link2.quality >= 360)
              qualityStr = "360p";
            else
              qualityStr = "240p";
            return {
              name: `Moviesdrive ${serverName}`,
              title: mediaTitle,
              url: link2.url,
              quality: qualityStr,
              size: formattedSize,
              headers: HEADERS,
              provider: "Moviesdrive"
            };
          });
          const qualityOrder = {
            "2160p": 5,
            "1440p": 4,
            "1080p": 3,
            "720p": 2,
            "480p": 1,
            "360p": 0,
            "240p": -1,
            "Unknown": -2
          };
          streams.sort(function(a, b) {
            var _a, _b;
            return ((_a = qualityOrder[b.quality]) != null ? _a : -3) - ((_b = qualityOrder[a.quality]) != null ? _b : -3);
          });
          console.log(`[Moviesdrive] Found ${streams.length} streams`);
          return streams;
        });
      });
    });
  }).catch(function(error) {
    console.error(`[Moviesdrive] Scraping error: ${error.message}`);
    return [];
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = { getStreams };
}
function getStreams(tmdbId, mediaType = "movie", season = null, episode = null) {
  return __async(this, null, function* () {
    const normalizedType = String(mediaType || "").toLowerCase() === "tv" || String(mediaType || "").toLowerCase() === "series" ? "tv" : "movie";
    const normalizedSeason = season == null || season === "" ? null : Number(season);
    const normalizedEpisode = episode == null || episode === "" ? null : Number(episode);
    const candidates = yield getStreamsLegacy(String(tmdbId), normalizedType, normalizedSeason, normalizedEpisode);
    const resolved = candidates.map((candidate) => {
      var _a;
      const requestHeaders = withReferer(candidate.headers || HEADERS, ((_a = candidate.headers) == null ? void 0 : _a.Referer) || MAIN_URL);
      const attributes = parseMediaAttributes(candidate.title, candidate.name, candidate.size, candidate.url);
      const verifiedQuality = attributes.quality !== "Unknown" ? attributes.quality : candidate.quality;
      return __spreadProps(__spreadValues(__spreadProps(__spreadValues({}, candidate), {
        url: candidate.url,
        headers: requestHeaders,
        subtitles: candidate.subtitles || []
      }), attributes), {
        name: candidate.name || "MoviesDrive",
        title: candidate.title || attributes.title || "MoviesDrive",
        quality: candidate.quality === "240p" && attributes.quality === "Unknown" ? "Unknown" : verifiedQuality,
        size: candidate.size || attributes.size
      });
    });
    const qualityOrder = { "4K": 2160, "1440p": 1440, "1080p": 1080, "720p": 720, "480p": 480, "360p": 360, "240p": 240 };
    return uniqueStreams(resolved.filter(Boolean)).filter((stream) => stream.quality && stream.quality !== "Unknown").map((stream) => {
      const details = [stream.quality, stream.size, stream.codec, ...stream.languages || []].filter(Boolean);
      const parsedUrl = new URL(stream.url);
      parsedUrl.pathname = parsedUrl.pathname.split("/").map((segment) => {
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch (_) {
          return encodeURIComponent(segment);
        }
      }).join("/");
      return {
        name: `MoviesDrive - ${stream.quality}`,
        title: details.join(" \u2022 "),
        url: parsedUrl.toString(),
        quality: stream.quality,
        size: stream.size,
        headers: stream.headers || HEADERS,
        subtitles: Array.isArray(stream.subtitles) ? stream.subtitles : []
      };
    }).sort((a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0));
  });
}
