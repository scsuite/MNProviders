/** StreamPlay - generated from src/providers/streamplay.js */
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

// src/providers/vcloud.js
var require_vcloud = __commonJS({
  "src/providers/vcloud.js"(exports2, module2) {
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
    function clean(value) {
      return String(value || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
    }
    function origin(url) {
      const match = String(url).match(/^(https?:\/\/[^/]+)/i);
      return match ? match[1] : "";
    }
    function absolute(value, base) {
      if (!value)
        return null;
      const url = String(value).replace(/&amp;/gi, "&").trim();
      if (/^https?:\/\//i.test(url))
        return url;
      if (url.startsWith("/"))
        return origin(base) + url;
      return String(base).replace(/\/[^/]*$/, "/") + url.replace(/^\.\//, "");
    }
    function anchors(html, base) {
      const output = [];
      const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while (match = regex.exec(html)) {
        const url = absolute(match[1], base);
        if (url)
          output.push({ url, text: clean(match[2]) });
      }
      return output;
    }
    function getResponse(url, referer, redirect) {
      return __async(this, null, function* () {
        return fetch(url, {
          redirect: redirect || "follow",
          headers: __spreadValues({ "User-Agent": USER_AGENT, Accept: "text/html,*/*;q=0.8" }, referer ? { Referer: referer } : {})
        });
      });
    }
    function decodeTwice(value) {
      try {
        return atob(atob(value));
      } catch (_) {
        return "";
      }
    }
    function extractIntermediate(html) {
      const script = String(html);
      const encoded = script.match(/atob\(atob\(['"]([^'"]+)['"]\)\)/i);
      if (encoded)
        return decodeTwice(encoded[1]);
      const plain = script.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/i);
      return plain ? plain[1] : "";
    }
    function qualityFrom(value) {
      const match = String(value).match(/(2160|1080|720|480|360)p?/i);
      if (!match)
        return "Unknown";
      return match[1] === "2160" ? "4K" : `${match[1]}p`;
    }
    function resolveServer(server, label, referer) {
      return __async(this, null, function* () {
        let url = server.url;
        const text = server.text;
        let name = text || "V-Cloud";
        if (/buzzserver/i.test(text)) {
          const response = yield getResponse(url.replace(/\/$/, "") + "/download", url, "manual");
          const target = response.headers.get("hx-redirect");
          if (!target)
            return null;
          url = absolute(target, url);
          name = "BuzzServer";
        } else if (/pixeldra|pixelserver|\bpixel\b/i.test(text)) {
          if (!/download/i.test(url))
            url = origin(url) + "/api/file/" + url.split("/").filter(Boolean).pop() + "?download";
          name = "Pixeldrain";
        } else if (/10\s*gbps/i.test(text)) {
          const response = yield getResponse(url, referer, "follow");
          url = response.url || url;
          if (url.includes("link="))
            url = decodeURIComponent(url.split("link=").pop());
          name = "10Gbps";
          if (response.body && response.body.cancel)
            yield response.body.cancel();
        } else if (/fslv2/i.test(text))
          name = "FSLv2";
        else if (/\bfsl\b/i.test(text))
          name = "FSL";
        else if (/pdl server/i.test(text))
          name = "PDL";
        else if (/s3 server/i.test(text))
          name = "S3";
        else if (/mega server/i.test(text))
          name = "Mega";
        return { name, url, quality: qualityFrom(label), headers: { "User-Agent": USER_AGENT, Referer: referer } };
      });
    }
    function resolveVCloud(url, referer, label) {
      return __async(this, null, function* () {
        try {
          let response = yield getResponse(url, referer);
          if (!response.ok)
            return { streams: [], blocked: `HTTP ${response.status}` };
          let html = yield response.text();
          let pageUrl = response.url || url;
          if (/api\/index\.php/i.test(pageUrl)) {
            const next = anchors(html, pageUrl).find((item) => /download|v-?cloud|continue/i.test(item.text + " " + item.url));
            if (!next)
              return { streams: [], blocked: "api/index.php target missing" };
            response = yield getResponse(next.url, pageUrl);
            if (!response.ok)
              return { streams: [], blocked: `HTTP ${response.status}` };
            html = yield response.text();
            pageUrl = response.url || next.url;
          }
          const intermediate = absolute(extractIntermediate(html), pageUrl);
          if (!intermediate)
            return { streams: [], blocked: "encoded intermediate URL missing" };
          response = yield getResponse(intermediate, pageUrl);
          if (!response.ok)
            return { streams: [], blocked: `intermediate HTTP ${response.status}` };
          const serverHtml = yield response.text();
          const serverPage = response.url || intermediate;
          const candidates = anchors(serverHtml, serverPage).filter((item) => /fsl|buzz|pixel|pdl|10\s*gbps|s3 server|mega server/i.test(item.text));
          const results = yield Promise.all(candidates.map((item) => resolveServer(item, label, serverPage).catch(() => null)));
          return { streams: results.filter(Boolean), blocked: null };
        } catch (error) {
          return { streams: [], blocked: error && error.message ? error.message : String(error) };
        }
      });
    }
    module2.exports = { resolveVCloud };
  }
});

// src/providers/vegamovies.js
var require_vegamovies = __commonJS({
  "src/providers/vegamovies.js"(exports2, module2) {
    var TMDB_API = "https://api.themoviedb.org/3";
    var { resolveVCloud } = require_vcloud();
    var TMDB_KEY = "439c478a771f35c05022f9feabcca01c";
    var DOMAINS_URL = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
    var VEGA_FALLBACK = "https://vegamovies.catering";
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
        try {
          const domains = JSON.parse(yield requestText(DOMAINS_URL));
          if (domains.vegamovies)
            return String(domains.vegamovies).replace(/\/$/, "");
        } catch (_) {
        }
        return VEGA_FALLBACK;
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
      if (!value)
        return null;
      const url = String(value).trim();
      if (/^https?:\/\//i.test(url))
        return url;
      const origin = String(base || "").match(/^(https?:\/\/[^/]+)/i);
      if (!origin)
        return null;
      if (url.startsWith("/"))
        return origin[1] + url;
      return String(base).replace(/\/[^/]*$/, "/").replace(/\/$/, "/") + url.replace(/^\.\//, "");
    }
    function cleanText(value) {
      return String(value || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
    }
    function headingBlocks(html) {
      const blocks = [];
      const regex = /<(h[3-5])\b[^>]*>([\s\S]*?)<\/\1>([\s\S]*?)(?=<h[3-5]\b|$)/gi;
      let match;
      while (match = regex.exec(html))
        blocks.push({ heading: cleanText(match[2]), body: match[3] });
      return blocks;
    }
    function anchors(html, base) {
      const values = [];
      const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      while (match = regex.exec(html)) {
        const url = absoluteUrl(match[1].replace(/&amp;/gi, "&"), base);
        if (url)
          values.push({ url, text: cleanText(match[2]) });
      }
      return values;
    }
    function movieReleaseLinks(html, base) {
      const links = [];
      for (const block of headingBlocks(html)) {
        for (const anchor of anchors(block.body, base)) {
          if (/nexdrive|dwd-button|download now/i.test(anchor.url + " " + anchor.text + " " + block.body)) {
            links.push({ url: anchor.url, label: block.heading });
          }
        }
      }
      return links;
    }
    function episodeReleaseLinks(html, base, season, episode) {
      const links = [];
      const seasonRegex = new RegExp(`season\\s*0?${season}(?:\\D|$)`, "i");
      for (const block of headingBlocks(html)) {
        if (!seasonRegex.test(block.heading))
          continue;
        for (const anchor of anchors(block.body, base)) {
          if (/(g-?direct|v-?cloud|single|download|nexdrive)/i.test(anchor.text + " " + anchor.url)) {
            links.push({ url: anchor.url, label: block.heading });
          }
        }
      }
      return links;
    }
    function resolveFastdl(directPage, pageUrl) {
      return __async(this, null, function* () {
        const embed = yield requestText(directPage, pageUrl);
        const match = embed.match(/(?:var\s+reurl\s*=\s*|['"])(?:https:\/\/fastdl\.[^/]+\/dl\.php\?link=)(https:\/\/video-downloads\.googleusercontent\.com\/[^'"\s<]+)/i);
        if (!match)
          return null;
        return { name: "G-Direct (VLC)", url: match[1].replace(/&amp;/g, "&"), referer: directPage, compatibility: "external" };
      });
    }
    function resolveRelease(pageUrl, base, episode, label) {
      return __async(this, null, function* () {
        const page = yield requestText(pageUrl, base);
        let routes = [];
        if (episode) {
          const episodeRegex = new RegExp(`episodes?\\s*:\\s*0?${episode}(?:\\D|$)`, "i");
          for (const block of headingBlocks(page)) {
            if (!episodeRegex.test(block.heading))
              continue;
            routes = anchors(block.body, pageUrl);
            break;
          }
        } else {
          routes = anchors(page, pageUrl);
        }
        const useful = routes.filter((item) => /g-?direct|instant|fastdl|v-?cloud|resumable|vcloud\.zip/i.test(item.text + " " + item.url));
        const results = yield Promise.all(useful.slice(0, 4).map((route) => __async(this, null, function* () {
          if (/vcloud\.zip|v-?cloud|resumable/i.test(route.text + " " + route.url)) {
            const resolved = yield resolveVCloud(route.url, pageUrl, label);
            return resolved.streams.map((stream) => __spreadProps(__spreadValues({}, stream), { referer: stream.headers && stream.headers.Referer, compatibility: "internal" }));
          }
          const direct = yield resolveFastdl(route.url, pageUrl);
          return direct ? [direct] : [];
        })));
        return results.flat();
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
              const directLinks = yield resolveRelease(release.url, base, mediaType === "tv" ? Number(episode) : null, release.label);
              const quality = qualityFrom(release.label);
              return directLinks.map((direct) => ({
                name: `StreamPlay VegaMovies ${direct.name} - ${quality}`,
                title: mediaType === "tv" ? `${media.title} S${season}E${episode}` : media.title,
                url: direct.url,
                quality,
                headers: direct.headers || { "User-Agent": USER_AGENT, Referer: direct.referer },
                provider: "vegamovies",
                compatibility: direct.compatibility,
                subtitles: []
              }));
            } catch (_) {
              return [];
            }
          })));
          const flat = resolved.flat().filter(Boolean);
          return flat.filter((item, index, all) => all.findIndex((other) => other.url === item.url) === index);
        } catch (error) {
          console.log(`[VegaMovies] ${error && error.message ? error.message : error}`);
          return [];
        }
      });
    }
    module2.exports = { getStreams: getStreams2 };
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
    module2.exports = {
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
  }
});

// src/providers/moviesdrive.js
var require_moviesdrive = __commonJS({
  "src/providers/moviesdrive.js"(exports2, module2) {
    var cheerio = require("cheerio-without-node-native");
    var { withReferer } = require_http();
    var { parseMediaAttributes, resolveFinalUrl, uniqueStreams } = require_streams();
    var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
    var TMDB_BASE_URL = "https://api.themoviedb.org/3";
    var MAIN_URL = "https://new1.moviesdrive.christmas";
    var DOMAINS_URL = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
    var DOMAIN_CACHE_TTL = 4 * 60 * 60 * 1e3;
    var domainCacheTimestamp = 0;
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
    function atob2(value) {
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
          const m3u8Data = atob2(encodedMatch[1]);
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
            return pixelDrainExtractor(link2).then((extracted) => {
              links.push(...extracted.map((l) => __spreadProps(__spreadValues({}, l), {
                quality: typeof l.quality === "number" ? l.quality : quality,
                size: l.size || sizeInBytes2,
                fileName
              })));
            }).catch(() => {
            });
          }
          if (text.includes("10Gbps")) {
            let redirectUrl = link2;
            let finalLink = null;
            const walk = (i) => {
              if (i >= 5)
                return Promise.resolve(finalLink);
              return fetch(redirectUrl, { redirect: "manual" }).then((r) => {
                if (r.status >= 300 && r.status < 400) {
                  const loc = r.headers.get("location");
                  if (loc == null ? void 0 : loc.includes("link=")) {
                    finalLink = loc.split("link=")[1];
                    return finalLink;
                  }
                  if (loc)
                    redirectUrl = new URL(loc, redirectUrl).toString();
                  return walk(i + 1);
                }
                return finalLink;
              }).catch(() => finalLink);
            };
            return walk(0).then((dlink) => {
              if (dlink) {
                links.push({
                  source: `HubCloud - 10Gbps ${labelExtras}`,
                  quality,
                  url: dlink,
                  size: sizeInBytes2,
                  fileName
                });
              }
            });
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
                      if (/hubcloud|gdflix/i.test(href)) {
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
    if (typeof module2 !== "undefined" && module2.exports) {
      module2.exports = { getStreams: getStreams2 };
    } else {
      global.getStreams = { getStreams: getStreams2 };
    }
    function getStreams2(tmdbId, mediaType = "movie", season = null, episode = null) {
      return __async(this, null, function* () {
        var _a;
        const candidates = yield getStreamsLegacy(tmdbId, mediaType, season, episode);
        const streams = [];
        for (const candidate of candidates) {
          const requestHeaders = withReferer(candidate.headers || HEADERS, ((_a = candidate.headers) == null ? void 0 : _a.Referer) || MAIN_URL);
          const finalUrl = yield resolveFinalUrl(candidate.url, { headers: requestHeaders }).catch(() => null);
          if (!finalUrl)
            continue;
          const attributes = parseMediaAttributes(candidate.title, candidate.name, candidate.size, finalUrl);
          const verifiedQuality = attributes.quality !== "Unknown" ? attributes.quality : candidate.quality;
          streams.push(__spreadProps(__spreadValues(__spreadProps(__spreadValues({}, candidate), {
            url: finalUrl,
            headers: requestHeaders,
            subtitles: candidate.subtitles || []
          }), attributes), {
            name: candidate.name || "MoviesDrive",
            title: candidate.title || attributes.title || "MoviesDrive",
            quality: candidate.quality === "240p" && attributes.quality === "Unknown" ? "Unknown" : verifiedQuality,
            size: candidate.size || attributes.size
          }));
        }
        return uniqueStreams(streams);
      });
    }
  }
});

// src/providers/streamplay.js
var { getStreams: getCastleStreams } = require_castle();
var { getStreams: getVegaMoviesStreams } = require_vegamovies();
var { getStreams: getMoviesDriveStreams } = require_moviesdrive();
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
      getMoviesDriveStreams(tmdbId, mediaType, season, episode),
      getCastleStreams(tmdbId, mediaType, season, episode)
    ]);
    const streams = results.flatMap((result) => result.status === "fulfilled" && Array.isArray(result.value) ? result.value : []);
    return streams.map(function(stream) {
      return Object.assign({}, stream, {
        name: String(stream.name || "Castle").replace(/^Castle/, "StreamPlay"),
        quality: normalizeQuality(stream.quality)
      });
    }).filter((stream, index, all) => all.findIndex((other) => other.url === stream.url) === index).sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));
  });
}
function qualityRank(quality) {
  const match = String(quality || "").match(/(2160|1440|1080|720|480|360|240|4K)/i);
  if (!match)
    return 0;
  return match[1].toUpperCase() === "4K" ? 2160 : Number(match[1]);
}
module.exports = { getStreams };
