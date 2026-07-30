/** StreamPlay - generated from src/providers/streamplay.js */
var __defProp = Object.defineProperty;
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

// src/providers/castle.js
var require_castle = __commonJS({
  "src/providers/castle.js"(exports2, module2) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
    var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __spreadValues2 = (a, b) => {
      for (var prop in b || (b = {}))
        if (__hasOwnProp2.call(b, prop))
          __defNormalProp2(a, prop, b[prop]);
      if (__getOwnPropSymbols2)
        for (var prop of __getOwnPropSymbols2(b)) {
          if (__propIsEnum2.call(b, prop))
            __defNormalProp2(a, prop, b[prop]);
        }
      return a;
    };
    var __async2 = (__this, __arguments, generator) => {
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
    var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
    var TMDB_BASE_URL = "https://api.themoviedb.org/3";
    var CASTLE_BASE = "https://api.hlowb.com";
    var PKG = "com.external.castle";
    var CHANNEL = "IndiaA";
    var CLIENT = "1";
    var LANG = "en-US";
    var API_HEADERS = {
      "User-Agent": "okhttp/4.9.3",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "Connection": "Keep-Alive",
      "Referer": CASTLE_BASE
    };
    var PLAYBACK_HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      "Accept": "video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
      "Connection": "keep-alive",
      "Sec-Fetch-Dest": "video",
      "Sec-Fetch-Mode": "no-cors",
      "Sec-Fetch-Site": "cross-site",
      "DNT": "1"
    };
    function makeRequest(_0) {
      return __async2(this, arguments, function* (url, options = {}) {
        try {
          const response = yield fetch(url, {
            method: options.method || "GET",
            headers: __spreadValues2(__spreadValues2({}, API_HEADERS), options.headers),
            body: options.body
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response;
        } catch (error) {
          console.error(`[Castle] Request failed for ${url}: ${error.message}`);
          throw error;
        }
      });
    }
    function extractCipherFromResponse(response) {
      return __async2(this, null, function* () {
        const text = yield response.text();
        const trimmed = text.trim();
        if (!trimmed) {
          throw new Error("Empty response");
        }
        try {
          const json = JSON.parse(trimmed);
          if (json && json.data && typeof json.data === "string") {
            return json.data.trim();
          }
        } catch (e) {
        }
        return trimmed;
      });
    }
    function extractDataBlock(obj) {
      if (obj && obj.data && typeof obj.data === "object") {
        return obj.data;
      }
      return obj || {};
    }
    function getTMDBDetails(tmdbId, mediaType) {
      return __async2(this, null, function* () {
        const endpoint = mediaType === "tv" ? "tv" : "movie";
        const url = `${TMDB_BASE_URL}/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
        const response = yield makeRequest(url);
        const data = yield response.json();
        const title = mediaType === "tv" ? data.name : data.title;
        const releaseDate = mediaType === "tv" ? data.first_air_date : data.release_date;
        const year = releaseDate ? parseInt(releaseDate.split("-")[0]) : null;
        return {
          title,
          year,
          tmdbId
        };
      });
    }
    function decryptCastle(encryptedB64, securityKeyB64) {
      return __async2(this, null, function* () {
        console.log("[Castle] Starting local AES-CBC decryption...");
        try {
          const CryptoJS = require("crypto-js");
          if (typeof __crypto_aes_decrypt_raw !== "undefined") {
            const originalDecrypt = CryptoJS.AES.decrypt;
            CryptoJS.AES.decrypt = function(cipher, key, options) {
              try {
                const wordArrayToBytes = (wordArray) => {
                  const bytes = new Uint8Array(wordArray.sigBytes);
                  for (let i = 0; i < wordArray.sigBytes; i++) {
                    bytes[i] = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
                  }
                  return bytes;
                };
                const toUint8Array = (data2) => {
                  if (data2 instanceof Uint8Array)
                    return data2;
                  if (data2 instanceof ArrayBuffer)
                    return new Uint8Array(data2);
                  if (data2 && typeof data2.length === "number")
                    return new Uint8Array(Array.prototype.slice.call(data2));
                  return new Uint8Array(0);
                };
                const data = typeof cipher === "string" ? new Uint8Array(Array.from(atob(cipher), (c) => c.charCodeAt(0))) : cipher.ciphertext ? wordArrayToBytes(cipher.ciphertext) : toUint8Array(cipher);
                const kBytes = wordArrayToBytes(key);
                const ivBytes = options && options.iv ? wordArrayToBytes(options.iv) : new Uint8Array(0);
                const mode = options && options.mode || "AES-CBC";
                const keyArg = typeof Int8Array !== "undefined" ? new Int8Array(kBytes.buffer) : kBytes;
                const ivArg = typeof Int8Array !== "undefined" ? new Int8Array(ivBytes.buffer) : ivBytes;
                const dataArg = typeof Int8Array !== "undefined" ? new Int8Array(data.buffer) : data;
                const resBytes = __crypto_aes_decrypt_raw(mode, keyArg, ivArg, dataArg);
                const plain = new TextDecoder().decode(resBytes);
                return { toString: function() {
                  return plain;
                } };
              } catch (err) {
                console.error("[Castle JNI Patch] Decrypt failed, falling back:", err);
                return originalDecrypt.call(CryptoJS.AES, cipher, key, options);
              }
            };
          }
          const CASTLE_SUFFIX = "T!BgJB";
          const securityKeyWords = CryptoJS.enc.Base64.parse(securityKeyB64);
          const suffixWords = CryptoJS.enc.Utf8.parse(CASTLE_SUFFIX);
          const keyMaterial = securityKeyWords.concat(suffixWords);
          let finalKey;
          if (keyMaterial.sigBytes < 16) {
            const padding = CryptoJS.lib.WordArray.create(new Array(16 - keyMaterial.sigBytes).fill(0));
            finalKey = keyMaterial.concat(padding);
          } else if (keyMaterial.sigBytes > 16) {
            finalKey = CryptoJS.lib.WordArray.create(keyMaterial.words.slice(0, 4), 16);
          } else {
            finalKey = keyMaterial;
          }
          const iv = finalKey;
          const decrypted = CryptoJS.AES.decrypt(encryptedB64, finalKey, {
            iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          });
          const result = decrypted.toString(CryptoJS.enc.Utf8);
          if (!result) {
            throw new Error("Decryption resulted in empty string (possible key/IV mismatch)");
          }
          console.log("[Castle] Local decryption successful");
          return result;
        } catch (error) {
          console.error(`[Castle] Local decryption failed: ${error.message}`);
          throw error;
        }
      });
    }
    function getSecurityKey() {
      return __async2(this, null, function* () {
        console.log("[Castle] Fetching security key...");
        const url = `${CASTLE_BASE}/v0.1/system/getSecurityKey/1?channel=${CHANNEL}&clientType=${CLIENT}&lang=${LANG}`;
        const response = yield makeRequest(url);
        const data = yield response.json();
        if (data.code !== 200 || !data.data) {
          throw new Error(`Security key API error: ${JSON.stringify(data)}`);
        }
        console.log("[Castle] Security key obtained");
        return data.data;
      });
    }
    function searchCastle(securityKey, keyword, page = 1, size = 30) {
      return __async2(this, null, function* () {
        console.log(`[Castle] Searching for: ${keyword}`);
        const params = new URLSearchParams({
          channel: CHANNEL,
          clientType: CLIENT,
          keyword,
          lang: LANG,
          mode: "1",
          packageName: PKG,
          page: page.toString(),
          size: size.toString()
        });
        const url = `${CASTLE_BASE}/film-api/v1.1.0/movie/searchByKeyword?${params.toString()}`;
        const response = yield makeRequest(url);
        const cipher = yield extractCipherFromResponse(response);
        const decrypted = yield decryptCastle(cipher, securityKey);
        return JSON.parse(decrypted);
      });
    }
    function getDetails(securityKey, movieId) {
      return __async2(this, null, function* () {
        console.log(`[Castle] Fetching details for movieId: ${movieId}`);
        const url = `${CASTLE_BASE}/film-api/v1.9.9/movie?channel=${CHANNEL}&clientType=${CLIENT}&lang=${LANG}&movieId=${movieId}&packageName=${PKG}`;
        const response = yield makeRequest(url);
        const cipher = yield extractCipherFromResponse(response);
        const decrypted = yield decryptCastle(cipher, securityKey);
        return JSON.parse(decrypted);
      });
    }
    function getVideoV1(securityKey, movieId, episodeId, languageId, resolution = 2) {
      return __async2(this, null, function* () {
        console.log(`[Castle] Fetching video (v1) for movieId: ${movieId}, languageId: ${languageId}`);
        const url = `${CASTLE_BASE}/film-api/v2.0.1/movie/getVideo2?clientType=${CLIENT}&packageName=${PKG}&channel=${CHANNEL}&lang=${LANG}`;
        const body = {
          mode: "1",
          appMarket: "GuanWang",
          clientType: CLIENT,
          woolUser: "false",
          apkSignKey: "ED0955EB04E67A1D9F3305B95454FED485261475",
          androidVersion: "13",
          movieId: movieId.toString(),
          episodeId: episodeId.toString(),
          languageId: languageId.toString(),
          isNewUser: "true",
          resolution: resolution.toString(),
          packageName: PKG
        };
        const response = yield makeRequest(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const cipher = yield extractCipherFromResponse(response);
        const decrypted = yield decryptCastle(cipher, securityKey);
        return JSON.parse(decrypted);
      });
    }
    function getVideo2(securityKey, movieId, episodeId, resolution = 2) {
      return __async2(this, null, function* () {
        console.log(`[Castle] Fetching video (v2) for movieId: ${movieId}, episodeId: ${episodeId}`);
        const url = `${CASTLE_BASE}/film-api/v2.0.1/movie/getVideo2?clientType=${CLIENT}&packageName=${PKG}&channel=${CHANNEL}&lang=${LANG}`;
        const body = {
          mode: "1",
          appMarket: "GuanWang",
          clientType: CLIENT,
          woolUser: "false",
          apkSignKey: "ED0955EB04E67A1D9F3305B95454FED485261475",
          androidVersion: "13",
          movieId: movieId.toString(),
          episodeId: episodeId.toString(),
          isNewUser: "true",
          resolution: resolution.toString(),
          packageName: PKG
        };
        const response = yield makeRequest(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const cipher = yield extractCipherFromResponse(response);
        const decrypted = yield decryptCastle(cipher, securityKey);
        return JSON.parse(decrypted);
      });
    }
    function findCastleMovieId(securityKey, tmdbInfo) {
      return __async2(this, null, function* () {
        const searchTerm = tmdbInfo.year ? `${tmdbInfo.title} ${tmdbInfo.year}` : tmdbInfo.title;
        const searchResult = yield searchCastle(securityKey, searchTerm);
        const data = extractDataBlock(searchResult);
        const rows = data.rows || [];
        if (rows.length === 0) {
          throw new Error("No search results found");
        }
        for (const item of rows) {
          const itemTitle = (item.title || item.name || "").toLowerCase();
          const searchTitle = tmdbInfo.title.toLowerCase();
          if (itemTitle.includes(searchTitle) || searchTitle.includes(itemTitle)) {
            const movieId2 = item.id || item.redirectId || item.redirectIdStr;
            if (movieId2) {
              console.log(`[Castle] Found match: ${item.title || item.name} (id: ${movieId2})`);
              return movieId2.toString();
            }
          }
        }
        const firstItem = rows[0];
        const movieId = firstItem.id || firstItem.redirectId || firstItem.redirectIdStr;
        if (movieId) {
          console.log(`[Castle] Using first result: ${firstItem.title || firstItem.name} (id: ${movieId})`);
          return movieId.toString();
        }
        throw new Error("Could not extract movie ID from search results");
      });
    }
    function getQualityValue(quality) {
      if (!quality)
        return 0;
      const cleanQuality = quality.toString().toLowerCase().replace(/^(sd|hd|fhd|uhd|4k)\s*/i, "").replace(/p$/, "").trim();
      const qualityMap = {
        "4k": 2160,
        "2160": 2160,
        "1440": 1440,
        "1080": 1080,
        "720": 720,
        "480": 480,
        "360": 360,
        "240": 240
      };
      if (qualityMap[cleanQuality]) {
        return qualityMap[cleanQuality];
      }
      const numQuality = parseInt(cleanQuality);
      if (!isNaN(numQuality) && numQuality > 0) {
        return numQuality;
      }
      return 0;
    }
    function formatSize(sizeValue) {
      if (typeof sizeValue !== "number" || sizeValue <= 0) {
        return "Unknown";
      }
      if (sizeValue > 1e9) {
        return `${(sizeValue / 1e9).toFixed(2)} GB`;
      }
      return `${(sizeValue / 1e6).toFixed(0)} MB`;
    }
    function resolutionToQuality(resolution) {
      const qualityMap = {
        1: "480p",
        2: "720p",
        3: "1080p"
      };
      return qualityMap[resolution] || `${resolution}p`;
    }
    function processVideoResponse(videoData, mediaInfo, seasonNum, episodeNum, resolution, languageInfo) {
      const streams = [];
      const data = extractDataBlock(videoData);
      const videoUrl = data.videoUrl;
      if (!videoUrl) {
        console.log("[Castle] No videoUrl found in response");
        return streams;
      }
      const subtitles = [];
      if (data.subtitles && Array.isArray(data.subtitles)) {
        data.subtitles.forEach((sub) => {
          if (sub.url) {
            subtitles.push({
              url: sub.url,
              language: sub.abbreviate || "Unknown",
              name: sub.title || sub.abbreviate || "Unknown",
              headers: PLAYBACK_HEADERS
            });
          }
        });
      }
      let mediaTitle = mediaInfo.title || "Unknown";
      if (mediaInfo.year) {
        mediaTitle += ` (${mediaInfo.year})`;
      }
      if (seasonNum && episodeNum) {
        mediaTitle = `${mediaInfo.title} S${String(seasonNum).padStart(2, "0")}E${String(episodeNum).padStart(2, "0")}`;
      }
      const quality = resolutionToQuality(resolution);
      if (data.videos && Array.isArray(data.videos)) {
        for (const video of data.videos) {
          let videoQuality = video.resolutionDescription || video.resolution || quality;
          videoQuality = videoQuality.replace(/^(SD|HD|FHD)\s+/i, "");
          const streamName = languageInfo ? `Castle ${languageInfo} - ${videoQuality}` : `Castle - ${videoQuality}`;
          streams.push({
            name: streamName,
            title: mediaTitle,
            url: video.url || videoUrl,
            quality: videoQuality,
            size: formatSize(video.size),
            headers: PLAYBACK_HEADERS,
            provider: "castle",
            subtitles
          });
        }
      } else {
        const streamName = languageInfo ? `Castle ${languageInfo} - ${quality}` : `Castle - ${quality}`;
        streams.push({
          name: streamName,
          title: mediaTitle,
          url: videoUrl,
          quality,
          size: formatSize(data.size),
          headers: PLAYBACK_HEADERS,
          provider: "castle",
          subtitles
        });
      }
      return streams;
    }
    function getStreams2(tmdbId, mediaType, seasonNum, episodeNum) {
      return __async2(this, null, function* () {
        console.log(`[Castle] Starting extraction for TMDB ID: ${tmdbId}, Type: ${mediaType}${mediaType === "tv" ? `, S:${seasonNum}E:${episodeNum}` : ""}`);
        try {
          const tmdbInfo = yield getTMDBDetails(tmdbId, mediaType);
          console.log(`[Castle] TMDB Info: "${tmdbInfo.title}" (${tmdbInfo.year || "N/A"})`);
          const securityKey = yield getSecurityKey();
          const movieId = yield findCastleMovieId(securityKey, tmdbInfo);
          let details = yield getDetails(securityKey, movieId);
          let currentMovieId = movieId;
          if (mediaType === "tv" && seasonNum && episodeNum) {
            const data = extractDataBlock(details);
            const seasons = data.seasons || [];
            const season = seasons.find((s) => s.number === seasonNum);
            if (season && season.movieId && season.movieId !== movieId) {
              console.log(`[Castle] Fetching season ${seasonNum} details...`);
              details = yield getDetails(securityKey, season.movieId.toString());
              currentMovieId = season.movieId.toString();
            }
          }
          const detailsData = extractDataBlock(details);
          const episodes = detailsData.episodes || [];
          let episodeId = null;
          if (mediaType === "tv" && seasonNum && episodeNum) {
            const episode2 = episodes.find((e) => e.number === episodeNum);
            if (episode2 && episode2.id) {
              episodeId = episode2.id.toString();
            }
          } else if (episodes.length > 0) {
            episodeId = episodes[0].id.toString();
          }
          if (!episodeId) {
            throw new Error("Could not find episode ID");
          }
          const episode = episodes.find((e) => e.id.toString() === episodeId);
          const tracks = episode && episode.tracks || [];
          const resolution = 2;
          const allStreams = [];
          for (const track of tracks) {
            const langName = track.languageName || track.abbreviate || "Unknown";
            if (track.existIndividualVideo && track.languageId) {
              try {
                console.log(`[Castle] Fetching ${langName} (languageId: ${track.languageId})`);
                const videoData = yield getVideoV1(securityKey, currentMovieId, episodeId, track.languageId, resolution);
                const langStreams = processVideoResponse(videoData, tmdbInfo, seasonNum, episodeNum, resolution, `[${langName}]`);
                if (langStreams.length > 0) {
                  console.log(`[Castle] \u2705 ${langName}: Found ${langStreams.length} streams`);
                  allStreams.push(...langStreams);
                }
              } catch (error) {
                console.log(`[Castle] \u26A0\uFE0F ${langName}: Failed - ${error.message}`);
              }
            }
          }
          if (allStreams.length === 0) {
            console.log("[Castle] Falling back to shared stream (v2)");
            const videoData = yield getVideo2(securityKey, currentMovieId, episodeId, resolution);
            const sharedStreams = processVideoResponse(videoData, tmdbInfo, seasonNum, episodeNum, resolution, "[Shared]");
            allStreams.push(...sharedStreams);
          }
          allStreams.sort((a, b) => getQualityValue(b.quality) - getQualityValue(a.quality));
          console.log(`[Castle] Total streams found: ${allStreams.length}`);
          return allStreams;
        } catch (error) {
          console.error(`[Castle] Error: ${error.message}`);
          return [];
        }
      });
    }
    module2.exports = { getStreams: getStreams2 };
  }
});

// src/providers/vegamovies.js
var require_vegamovies = __commonJS({
  "src/providers/vegamovies.js"(exports2, module2) {
    var cheerio = require("cheerio");
    var TMDB_API = "https://api.themoviedb.org/3";
    var TMDB_KEY = "439c478a771f35c05022f9feabcca01c";
    var DOMAINS_URL = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
    function requestText(url, referer) {
      return __async(this, null, function* () {
        let lastError;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const response = yield fetch(url, {
              redirect: "follow",
              headers: __spreadValues({
                "User-Agent": USER_AGENT,
                Accept: "text/html,application/json;q=0.9,*/*;q=0.8"
              }, referer ? { Referer: referer } : {})
            });
            if (!response.ok)
              throw new Error(`HTTP ${response.status} for ${url}`);
            return response.text();
          } catch (error) {
            lastError = error;
          }
        }
        throw lastError;
      });
    }
    function getMediaInfo(tmdbId, mediaType) {
      return __async(this, null, function* () {
        const endpoint = mediaType === "tv" ? "tv" : "movie";
        const url = `${TMDB_API}/${endpoint}/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=external_ids`;
        const data = JSON.parse(yield requestText(url));
        return {
          title: mediaType === "tv" ? data.name : data.title,
          year: Number(String(mediaType === "tv" ? data.first_air_date : data.release_date).slice(0, 4)) || null,
          imdbId: data.imdb_id || data.external_ids && data.external_ids.imdb_id || null
        };
      });
    }
    function getVegaBase() {
      return __async(this, null, function* () {
        const domains = JSON.parse(yield requestText(DOMAINS_URL));
        if (!domains.vegamovies)
          throw new Error("VegaMovies domain missing");
        return String(domains.vegamovies).replace(/\/$/, "");
      });
    }
    function searchVega(base, query) {
      return __async(this, null, function* () {
        const data = JSON.parse(yield requestText(`${base}/search.php?q=${encodeURIComponent(query)}`, base));
        return (data.hits || []).map((hit) => hit && hit.document).filter(Boolean);
      });
    }
    function chooseResult(results, media, mediaType) {
      const imdbMatch = results.find((item) => media.imdbId && item.imdb_id === media.imdbId);
      if (imdbMatch)
        return imdbMatch;
      const title = String(media.title || "").toLowerCase();
      const year = String(media.year || "");
      return results.find((item) => {
        const value = String(item.post_title || "").toLowerCase();
        return value.includes(title) && (!year || value.includes(year)) && (mediaType !== "tv" || /season|series|episode/i.test(value));
      }) || results[0];
    }
    function absoluteUrl(value, base) {
      try {
        return new URL(value, base).href;
      } catch (_) {
        return null;
      }
    }
    function movieReleaseLinks(html, base) {
      const $ = cheerio.load(html);
      const links = [];
      $("button.dwd-button").each((_, button) => {
        const anchor = $(button).closest("a");
        const url = absoluteUrl(anchor.attr("href"), base);
        if (!url)
          return;
        const label = anchor.closest("p").prevAll("h3,h4,h5").first().text().replace(/\s+/g, " ").trim();
        links.push({ url, label });
      });
      return links;
    }
    function episodeReleaseLinks(html, base, season, episode) {
      const $ = cheerio.load(html);
      const links = [];
      const seasonRegex = new RegExp(`season\\s*0?${season}(?:\\D|$)`, "i");
      $("h3,h4,h5").each((_, heading) => {
        const label = $(heading).text().replace(/\s+/g, " ").trim();
        if (!seasonRegex.test(label))
          return;
        const container = $(heading).nextAll("p").first();
        container.find("a").each((__, anchor) => {
          const node = $(anchor);
          const url = absoluteUrl(node.attr("href"), base);
          if (url && /(g-?direct|v-?cloud|single|download)/i.test(node.text() + " " + url)) {
            links.push({ url, label });
          }
        });
      });
      return links;
    }
    function resolveGDirect(pageUrl, base, episode) {
      return __async(this, null, function* () {
        const page = yield requestText(pageUrl, base);
        const $ = cheerio.load(page);
        let directPage = null;
        if (episode) {
          const episodeRegex = new RegExp(`episodes?\\s*:\\s*0?${episode}(?:\\D|$)`, "i");
          $("h3,h4,h5").each((_, heading) => {
            if (directPage || !episodeRegex.test($(heading).text()))
              return;
            const node = $(heading).nextAll("p").first().find("a").filter((__, anchor) => /g-?direct|instant/i.test($(anchor).text())).first();
            directPage = absoluteUrl(node.attr("href"), pageUrl);
          });
        } else {
          $("a").each((_, anchor) => {
            const node = $(anchor);
            if (!directPage && /g-?direct|instant/i.test(node.text()))
              directPage = absoluteUrl(node.attr("href"), pageUrl);
          });
        }
        if (!directPage)
          return null;
        const embed = yield requestText(directPage, pageUrl);
        const match = embed.match(/(?:var\s+reurl\s*=\s*|['"])(?:https:\/\/fastdl\.[^/]+\/dl\.php\?link=)(https:\/\/video-downloads\.googleusercontent\.com\/[^'"\s<]+)/i);
        if (!match)
          return null;
        return { url: match[1].replace(/&amp;/g, "&"), referer: directPage };
      });
    }
    function qualityFrom(label) {
      const match = String(label).match(/(2160|1080|720|480|360)p?/i);
      if (!match)
        return "Unknown";
      return match[1] === "2160" ? "4K" : `${match[1]}p`;
    }
    function getStreams2(tmdbId, mediaType, season, episode) {
      return __async(this, null, function* () {
        if (!tmdbId || !["movie", "tv"].includes(mediaType))
          return [];
        if (mediaType === "tv" && (!season || !episode))
          return [];
        try {
          const [base, media] = yield Promise.all([getVegaBase(), getMediaInfo(tmdbId, mediaType)]);
          let results = media.imdbId ? yield searchVega(base, media.imdbId) : [];
          if (!results.length)
            results = yield searchVega(base, media.title);
          const result = chooseResult(results, media, mediaType);
          if (!result || !result.permalink)
            return [];
          const detailUrl = absoluteUrl(result.permalink, base);
          const detail = yield requestText(detailUrl, base);
          const releases = mediaType === "movie" ? movieReleaseLinks(detail, base) : episodeReleaseLinks(detail, base, Number(season), Number(episode));
          const selected = releases.slice(0, 10);
          const resolved = yield Promise.all(selected.map((release) => __async(this, null, function* () {
            try {
              const direct = yield resolveGDirect(release.url, base, mediaType === "tv" ? Number(episode) : null);
              if (!direct)
                return null;
              const quality = qualityFrom(release.label);
              return {
                name: `StreamPlay VegaMovies - ${quality}`,
                title: mediaType === "tv" ? `${media.title} S${season}E${episode}` : media.title,
                url: direct.url,
                quality,
                headers: { "User-Agent": USER_AGENT, Referer: direct.referer },
                provider: "vegamovies",
                subtitles: []
              };
            } catch (_) {
              return null;
            }
          })));
          return resolved.filter(Boolean).filter((item, index, all) => all.findIndex((other) => other.url === item.url) === index);
        } catch (error) {
          console.log(`[VegaMovies] ${error && error.message ? error.message : error}`);
          return [];
        }
      });
    }
    module2.exports = { getStreams: getStreams2 };
  }
});

// src/providers/streamplay.js
var { getStreams: getCastleStreams } = require_castle();
var { getStreams: getVegaMoviesStreams } = require_vegamovies();
function normalizeQuality(value) {
  const match = String(value || "").match(/(2160|1440|1080|720|480|360|240)/);
  if (match)
    return match[1] === "2160" ? "4K" : match[1] + "p";
  return "Unknown";
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    if (!tmdbId || mediaType !== "movie" && mediaType !== "tv")
      return Promise.resolve([]);
    const results = yield Promise.allSettled([
      getVegaMoviesStreams(tmdbId, mediaType, season, episode),
      getCastleStreams(tmdbId, mediaType, season, episode)
    ]);
    const streams = results.flatMap((result) => result.status === "fulfilled" && Array.isArray(result.value) ? result.value : []);
    return streams.map(function(stream) {
      return Object.assign({}, stream, {
        name: String(stream.name || "Castle").replace(/^Castle/, "StreamPlay"),
        quality: normalizeQuality(stream.quality)
      });
    }).filter((stream, index, all) => all.findIndex((other) => other.url === stream.url) === index);
  });
}
module.exports = { getStreams };
