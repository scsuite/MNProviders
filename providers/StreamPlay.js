/** StreamPlay - generated from src/providers/streamplay.js */
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/providers/vidlink.js
var require_vidlink = __commonJS({
  "src/providers/vidlink.js"(exports2, module2) {
    var TMDB_API_KEY = "1865f43a0549ca50d341dd9ab8b29f49";
    var ENCRYPT_API = "https://enc-dec.app/api/enc-vidlink";
    var STREAM_API = "https://vidlink.pro/api/b";
    var HEADERS = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
      Referer: "https://vidlink.pro/",
      Origin: "https://vidlink.pro"
    };
    function fetchJson(url, headers) {
      return fetch(url, { headers: headers || HEADERS }).then(function(response) {
        if (!response.ok)
          throw new Error("HTTP " + response.status);
        return response.json();
      });
    }
    function parseQuality(label, url) {
      const value = String(label || "") + " " + String(url || "");
      if (/(2160|4k|uhd)/i.test(value))
        return "4K";
      if (/1440/i.test(value))
        return "1440p";
      if (/1080/i.test(value))
        return "1080p";
      if (/720/i.test(value))
        return "720p";
      if (/480/i.test(value))
        return "480p";
      if (/360/i.test(value))
        return "360p";
      if (/240/i.test(value))
        return "240p";
      return "Unknown";
    }
    function getSubtitles(data) {
      const stream = data && data.stream;
      const raw = data && (data.subtitles || data.captions) || stream && (stream.subtitles || stream.captions) || [];
      if (!Array.isArray(raw))
        return [];
      return raw.filter(function(subtitle) {
        return subtitle && /^https?:\/\//i.test(subtitle.url || "");
      }).map(function(subtitle) {
        return {
          url: subtitle.url,
          language: subtitle.language || subtitle.lang || subtitle.label || subtitle.name || "Unknown"
        };
      });
    }
    function normalizeStreams(data, mediaTitle) {
      const subtitles = getSubtitles(data);
      const output = [];
      const seen = {};
      function add(url, label) {
        if (!/^https?:\/\//i.test(url || "") || seen[url])
          return;
        seen[url] = true;
        output.push({
          name: "StreamPlay - Vidlink",
          title: "StreamPlay - " + (label || mediaTitle || "Stream"),
          url,
          quality: parseQuality(label, url),
          headers: HEADERS,
          subtitles
        });
      }
      const stream = data && data.stream;
      const qualities = stream && stream.qualities;
      if (qualities && typeof qualities === "object") {
        Object.keys(qualities).forEach(function(label) {
          const item = qualities[label];
          if (item && item.url)
            add(item.url, label);
        });
      }
      if (data && data.url)
        add(data.url, data.quality);
      if (stream && stream.url)
        add(stream.url, stream.quality);
      if (data && Array.isArray(data.streams)) {
        data.streams.forEach(function(item) {
          if (item)
            add(item.url, item.quality || item.label);
        });
      }
      return output;
    }
    function getStreams2(tmdbId, mediaType, season, episode) {
      if (!tmdbId || mediaType !== "movie" && mediaType !== "tv")
        return Promise.resolve([]);
      const tmdbUrl = "https://api.themoviedb.org/3/" + mediaType + "/" + encodeURIComponent(tmdbId) + "?api_key=" + TMDB_API_KEY;
      return Promise.all([
        fetchJson(tmdbUrl, HEADERS),
        fetchJson(ENCRYPT_API + "?text=" + encodeURIComponent(tmdbId), HEADERS)
      ]).then(function(values) {
        const metadata = values[0] || {};
        const encrypted = values[1] && values[1].result;
        if (!encrypted)
          return [];
        const title = metadata.title || metadata.name || "Stream";
        const endpoint = mediaType === "tv" ? STREAM_API + "/tv/" + encrypted + "/" + (season || 1) + "/" + (episode || 1) : STREAM_API + "/movie/" + encrypted;
        return fetchJson(endpoint, HEADERS).then(function(data) {
          return normalizeStreams(data, title);
        });
      }).catch(function(error) {
        console.log("[StreamPlay] " + (error && error.message ? error.message : error));
        return [];
      });
    }
    module2.exports = { getStreams: getStreams2 };
  }
});

// src/providers/streamplay.js
var { getStreams: getVidlinkStreams } = require_vidlink();
function getStreams(tmdbId, mediaType, season, episode) {
  return getVidlinkStreams(tmdbId, mediaType, season, episode);
}
module.exports = { getStreams };
