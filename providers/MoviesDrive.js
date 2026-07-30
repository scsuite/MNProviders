/** MoviesDrive - generated from src/moviesdrive/index.js */
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

// src/moviesdrive/index.js
var import_cheerio_without_node_native2 = __toESM(require("cheerio-without-node-native"));

// src/moviesdrive/constants.js
var MAIN_URL = "https://new1.moviesdrive.christmas";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Referer": `${MAIN_URL}/`
};
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

// src/moviesdrive/extractor.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
function absoluteUrl(value, base) {
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
  if (/fslv2/.test(value))
    return "HubCloud FSLv2";
  if (/fsl/.test(value))
    return "HubCloud FSL";
  if (/s3 server/.test(value))
    return "HubCloud S3";
  if (/mega server/.test(value))
    return "HubCloud Mega";
  if (/pixeldrain/.test(value))
    return "HubCloud Pixeldrain";
  if (/workers\.dev|download file/.test(value))
    return "HubCloud Direct";
  return "HubCloud";
}
function expandMovieButton(url) {
  return __async(this, null, function* () {
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
        const params = new URLSearchParams({ api: "search", q: query, page: "1", from_ac: token });
        const data = yield fetch(`${endpoint}?${params}`, { headers: __spreadProps(__spreadValues({}, HEADERS), { Accept: "application/json" }) }).then((r) => r.json());
        const words = query.toLowerCase().replace(/\b(download|19\d{2}|20\d{2}|2160p|1080p|720p|480p)\b/g, "").split(/\W+/).filter((w) => w.length > 2);
        return (data.hits || []).filter((hit) => words.every((word) => String(hit.file_name || "").toLowerCase().includes(word))).map((hit) => hit.url).filter(Boolean);
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
      return $("a.btn[href]").map((_, element) => {
        const link = $(element).attr("href");
        const text = $(element).text().toLowerCase();
        if (!link || !/(download file|fsl|s3 server|mega server)/i.test(text))
          return null;
        return {
          source: hubCloudServer(text, link),
          title: [quality, size].filter(Boolean).join(" \u2022 "),
          url: safeUrl(absoluteUrl(link, pageUrl)),
          quality,
          size,
          headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }),
          subtitles: []
        };
      }).get().filter(Boolean);
    } catch (_) {
      return [];
    }
  });
}
function extractGdflix(_0, _1) {
  return __async(this, arguments, function* (url, referer, hint = {}) {
    var _a;
    try {
      let response = yield fetch(url, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }) });
      if (!response.ok)
        throw new Error(`GDFlix HTTP ${response.status}`);
      let html = yield response.text();
      let pageUrl = response.url || url;
      const redirect = (_a = html.match(/(?:location\.replace\(|url=)["']?([^"')>\s]+)/i)) == null ? void 0 : _a[1];
      if (redirect) {
        const next = absoluteUrl(redirect, pageUrl);
        if (next) {
          response = yield fetch(next, { headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }) });
          if (!response.ok)
            return [];
          html = yield response.text();
          pageUrl = response.url || next;
        }
      }
      const $ = import_cheerio_without_node_native.default.load(html);
      const header = $("li").text() || $("title").text();
      const quality = parseQuality(header) === "Unknown" ? hint.quality : parseQuality(header);
      const size = parseSize(header) || hint.size;
      const results = [];
      $("a[href]").each((_, element) => {
        const text = $(element).text().trim();
        const link = absoluteUrl($(element).attr("href"), pageUrl);
        if (!link || !/(direct|instant|index|drivebot|gofile|pixel)/i.test(text))
          return;
        if (!/(googleusercontent\.com|workers\.dev|r2\.dev|pixeldrain\.com\/api\/file|[?&]export=download|\.(?:mkv|mp4|m3u8)(?:[?#]|$))/i.test(link))
          return;
        results.push({
          source: `GDFlix ${text || "Direct"}`.trim(),
          title: [quality, size].filter(Boolean).join(" \u2022 "),
          url: safeUrl(link),
          quality,
          size,
          headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: pageUrl }),
          subtitles: []
        });
      });
      if (results.length)
        return results;
    } catch (_) {
    }
    return [{
      source: "GDFlix Web Link",
      title: [hint.quality, hint.size].filter(Boolean).join(" \u2022 "),
      url,
      quality: hint.quality || "1080p",
      size: hint.size,
      headers: __spreadProps(__spreadValues({}, HEADERS), { Referer: referer }),
      subtitles: []
    }];
  });
}
function extractHost(url, referer, hint = {}) {
  return /gdflix|gdlink/i.test(url) ? extractGdflix(url, referer, hint) : extractHubCloud(url, referer);
}
function sortAndUnique(streams) {
  const rank = { "4K": 2160, "1080p": 1080, "720p": 720, "480p": 480, "360p": 360, "240p": 240 };
  const order = { "4K": "01", "1080p": "02", "720p": "03", "480p": "04", "360p": "05", "240p": "06" };
  const seen = /* @__PURE__ */ new Set();
  return streams.filter((stream) => stream && stream.url && stream.quality !== "Unknown" && !seen.has(stream.url) && seen.add(stream.url)).sort((a, b) => (rank[b.quality] || 0) - (rank[a.quality] || 0)).map((stream) => __spreadProps(__spreadValues({}, stream), {
    name: `${order[stream.quality] || "99"} \u2022 MoviesDrive \u2022 ${stream.quality} \u2022 ${stream.source || "Direct"}`
  }));
}

// src/moviesdrive/index.js
function normalizeType(value) {
  return /^(tv|series|show)$/i.test(String(value || "")) ? "tv" : "movie";
}
function getMetadata(tmdbId, mediaType) {
  return __async(this, null, function* () {
    var _a;
    const response = yield fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`, { headers: HEADERS });
    if (!response.ok)
      return null;
    const data = yield response.json();
    return { title: mediaType === "tv" ? data.name : data.title, imdbId: (_a = data.external_ids) == null ? void 0 : _a.imdb_id };
  });
}
function search(metadata) {
  return __async(this, null, function* () {
    const queries = [metadata.imdbId, metadata.title].filter(Boolean);
    for (const query of queries) {
      try {
        const data = yield fetch(`${MAIN_URL}/search.php?q=${encodeURIComponent(query)}&page=1`, { headers: HEADERS }).then((r) => r.json());
        const documents = (data.hits || []).map((hit) => hit.document).filter(Boolean);
        const exact = metadata.imdbId && documents.find((doc) => doc.imdb_id === metadata.imdbId);
        const match = exact || documents.find((doc) => String(doc.post_title || "").toLowerCase().includes(String(metadata.title || "").toLowerCase()));
        if (match)
          return `${MAIN_URL}${String(match.permalink).startsWith("/") ? "" : "/"}${match.permalink}`;
      } catch (_) {
      }
    }
    return null;
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
        if (href && /single\s*episode/i.test(text) && !/zip/i.test(text) && !result.includes(href))
          result.push(href);
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
function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  return __async(this, null, function* () {
    try {
      const type = normalizeType(mediaType);
      const seasonNumber = Number(season) || 1;
      const episodeNumber = Number(episode) || 1;
      const metadata = yield getMetadata(String(tmdbId).replace(/^tmdb:/i, ""), type);
      if (!(metadata == null ? void 0 : metadata.title))
        return [];
      const mediaUrl = yield search(metadata);
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
            const episodeHtml = yield fetch(page, { headers: HEADERS }).then((r) => r.text());
            return episodeLinks(import_cheerio_without_node_native2.default.load(episodeHtml), episodeNumber).map((item) => __spreadProps(__spreadValues({}, item), { referer: page }));
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
      const extracted = yield Promise.all(uniqueHosts.map((item) => {
        const hint = typeof item === "string" ? {} : item;
        const url = typeof item === "string" ? item : item.url;
        return extractHost(url, hint.referer || mediaUrl, hint);
      }));
      return sortAndUnique(extracted.flat());
    } catch (error) {
      console.error("[MoviesDrive] Error:", error.message);
      return [];
    }
  });
}
module.exports = { getStreams };
