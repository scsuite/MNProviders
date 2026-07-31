const cheerio = require('cheerio-without-node-native');
const CryptoJS = require('crypto-js');
const DOMAINS = require('../config/domains');
const { mapConcurrent, parseMediaAttributes, uniqueExactStreams } = require('../shared/streams');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*;q=0.8' };
const TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const API_KEY = CryptoJS.enc.Utf8.parse('kiemtienmua911ca');
const API_IV = CryptoJS.enc.Utf8.parse('1234567890oiuytr');

async function text(url, options = {}) {
  const response = await fetch(url, { redirect: 'follow', ...options, headers: { ...HEADERS, ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function getBaseUrl() {
  try {
    const domains = JSON.parse(await text(DOMAINS.PHISHER_DOMAINS));
    if (domains.MultiMovies) return String(domains.MultiMovies).replace(/\/$/, '');
  } catch (_) {}
  return DOMAINS.MULTIMOVIES_FALLBACK;
}

async function metadata(tmdbId, mediaType) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const data = JSON.parse(await text(`${DOMAINS.TMDB_API}/${type}/${tmdbId}?api_key=${TMDB_KEY}`));
  return { title: type === 'tv' ? data.name : data.title, year: Number(String(type === 'tv' ? data.first_air_date : data.release_date).slice(0, 4)) || null };
}

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const normalized = value => clean(value).toLowerCase().replace(/\(\d{4}\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const absolute = (url, base) => { try { return new URL(url, base).toString(); } catch (_) { return ''; } };

function selectResult(results, info, mediaType) {
  const target = normalized(info.title);
  return results.find(item => {
    const name = normalized(item.title);
    const correctType = mediaType === 'tv' ? /\/tvshows\//i.test(item.url) : /\/movies\//i.test(item.url);
    return correctType && (name === target || name.startsWith(`${target} `)) && (!info.year || item.text.includes(String(info.year)) || name === target);
  }) || results.find(item => normalized(item.title) === target) || null;
}

async function playerEmbeds(pageUrl) {
  const html = await text(pageUrl, { headers: { Referer: new URL(pageUrl).origin } });
  const $ = cheerio.load(html);
  const options = $('#playeroptionsul li').toArray().map(item => ({
    post: $(item).attr('data-post'), nume: $(item).attr('data-nume'), type: $(item).attr('data-type'), label: clean($(item).text())
  })).filter(item => item.post && item.nume && !/trailer/i.test(`${item.nume} ${item.label}`));
  return mapConcurrent(options, 4, async item => {
    try {
      const origin = new URL(pageUrl).origin;
      const response = await fetch(`${origin}/wp-admin/admin-ajax.php`, {
        method: 'POST',
        headers: { ...HEADERS, Referer: pageUrl, 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
        body: new URLSearchParams({ action: 'doo_player_ajax', post: item.post, nume: item.nume, type: item.type || '' }).toString()
      });
      const data = await response.json();
      const $embed = cheerio.load(data?.embed_url || '');
      return { url: absolute($embed('iframe').attr('src') || data?.embed_url, pageUrl), label: item.label };
    } catch (_) { return null; }
  }).then(items => items.filter(item => item?.url && !/youtube/i.test(item.url)));
}

async function mirrorCandidates(embed, pageUrl) {
  try {
    const response = await fetch(embed.url, { redirect: 'follow', headers: { ...HEADERS, Referer: pageUrl } });
    const finalUrl = response.url || embed.url;
    const slug = new URL(embed.url).pathname.split('/').filter(Boolean).pop();
    if (!slug) return [];
    const helper = await fetch(`${new URL(finalUrl).origin}/embedhelper2.php`, {
      method: 'POST',
      headers: { ...HEADERS, Referer: finalUrl, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ sid: slug, UserFavSite: '', currentDomain: new URL(pageUrl).hostname }).toString()
    });
    const data = await helper.json();
    const ids = JSON.parse(atob(data.mresult || ''));
    return Object.entries(data.sources || {}).flatMap(([key, source]) => {
      const id = ids[key];
      if (!id || !source.siteUrl) return [];
      const origin = new URL(source.siteUrl).origin;
      if (!/rpmhub\.site|p2pplay\.pro|uns\.bio/i.test(origin)) return [];
      return [{
        provider: 'MultiMovies', source: `MultiMovies ${source.friendlyName || key}`, quality: 'Unknown',
        url: `${origin}/#${id}`, referer: finalUrl, pageUrl, headers: { ...HEADERS, Referer: `${origin}/#${id}` }, resolverType: 'multimovies_api'
      }];
    });
  } catch (_) { return []; }
}

async function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  if (!tmdbId || !['movie', 'tv'].includes(mediaType)) return [];
  try {
    const [base, info] = await Promise.all([getBaseUrl(), metadata(tmdbId, mediaType)]);
    const searchHtml = await text(`${base}/?s=${encodeURIComponent(info.title)}`, { headers: { Referer: base } });
    const $ = cheerio.load(searchHtml);
    const results = $('div.result-item, article').toArray().map(item => ({
      title: clean($(item).find('.title,h2,h3').first().text()), text: clean($(item).text()), url: absolute($(item).find('a').first().attr('href'), base)
    })).filter(item => item.title && item.url);
    const selected = selectResult(results, info, mediaType);
    if (!selected) return [];
    let pageUrl = selected.url;
    if (mediaType === 'tv') {
      const detail = cheerio.load(await text(pageUrl, { headers: { Referer: base } }));
      const target = detail('#seasons ul.episodios li').toArray().find(item => {
        const href = detail(item).find('a').attr('href') || '';
        const marker = href.match(/-(\d+)x(\d+)\/?$/i);
        return marker && Number(marker[1]) === Number(season) && Number(marker[2]) === Number(episode);
      });
      pageUrl = absolute(target && detail(target).find('a').attr('href'), selected.url);
      if (!pageUrl) return [];
    }
    const embeds = await playerEmbeds(pageUrl);
    const groups = await mapConcurrent(embeds, 3, embed => mirrorCandidates(embed, pageUrl));
    const seen = new Set();
    return groups.flat().filter(item => !seen.has(item.url) && seen.add(item.url));
  } catch (error) {
    console.log(`[MultiMovies Candidates] ${error?.message || error}`);
    return [];
  }
}

function decryptApi(hex) {
  const bytes = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Hex.parse(String(hex).trim()) }, API_KEY, { iv: API_IV, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8).replace(/[\u0000-\u001f]+$/g, ''));
}

async function resolveCandidate(candidate) {
  if (!candidate?.url || candidate.resolverType !== 'multimovies_api') return [];
  try {
    const parsed = new URL(candidate.url);
    const id = parsed.hash.slice(1).split('&')[0];
    if (!id) return [];
    const apiUrl = `${parsed.origin}/api/v1/video?id=${encodeURIComponent(id)}&w=1920&h=1080&r=${encodeURIComponent(new URL(candidate.pageUrl).hostname)}`;
    const payload = decryptApi(await text(apiUrl, { headers: { Referer: candidate.url } }));
    const mediaUrl = payload.cfNative || payload.source;
    if (!/^https?:\/\//i.test(mediaUrl || '')) return [];
    const attributes = parseMediaAttributes(payload.title, mediaUrl);
    const subtitles = Object.entries(payload.subtitle || {}).map(([language, url]) => ({ language, url: absolute(String(url).split('#')[0], parsed.origin) })).filter(item => item.url);
    return [{
      provider: 'MultiMovies', source: candidate.source, name: `MultiMovies • ${attributes.quality} • ${candidate.source.replace(/^MultiMovies\s*/i, '')}`,
      url: mediaUrl, quality: attributes.quality, headers: { ...HEADERS, Referer: parsed.origin }, subtitles, seekable: true
    }];
  } catch (_) { return []; }
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  const candidates = await discoverCandidates(tmdbId, mediaType, season, episode);
  const streams = await mapConcurrent(candidates, 4, resolveCandidate);
  return uniqueExactStreams(streams.flat().filter(Boolean));
}

module.exports = { discoverCandidates, resolveCandidate, getStreams };
