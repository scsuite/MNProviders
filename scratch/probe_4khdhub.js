const cheerio = require('cheerio-without-node-native');
const DOMAINS = require('../src/config/domains');
const fourkHDhub = require('../src/providers/fourkHDhub');
const moviesDrive = require('../src/moviesdrive/index');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  Accept: 'text/html,*/*;q=0.8'
};

async function testRange(name, url, headers = {}) {
  const started = Date.now();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 4000) : null;
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
      headers: {
        'User-Agent': HEADERS['User-Agent'],
        Range: 'bytes=1000000-1001023',
        ...headers
      }
    });
    if (timer) clearTimeout(timer);

    const status = res.status;
    const contentType = res.headers ? res.headers.get('content-type') : null;
    const contentRange = res.headers ? res.headers.get('content-range') : null;
    const acceptRanges = res.headers ? res.headers.get('accept-ranges') : null;
    const contentLength = res.headers ? res.headers.get('content-length') : null;
    const contentDisposition = res.headers ? res.headers.get('content-disposition') : null;
    const finalUrl = res.url || url;
    const finalHost = (() => { try { return new URL(finalUrl).hostname; } catch (_) { return ''; } })();

    let ebmlValid = false;
    if (res.body && typeof res.body.getReader === 'function') {
      try {
        const reader = res.body.getReader();
        const { value } = await reader.read();
        if (value && value.length >= 4) {
          // Matroska / EBML header starts with 0x1A 0x45 0xDF 0xA3
          ebmlValid = value[0] === 0x1A && value[1] === 0x45 && value[2] === 0xDF && value[3] === 0xA3;
        }
        await reader.cancel();
      } catch (_) {}
    } else if (res.body && typeof res.body.cancel === 'function') {
      try { await res.body.cancel(); } catch (_) {}
    }

    const seekable = status === 206 || !!contentRange || acceptRanges === 'bytes';

    console.log(`[Diagnostic Probe] ${name}`);
    console.log(`  Final Host: ${finalHost} | Status: ${status} | Content-Type: ${contentType}`);
    console.log(`  Content-Length: ${contentLength || 'none'} | Content-Disposition: ${contentDisposition || 'none'}`);
    console.log(`  Content-Range: ${contentRange || 'none'} | Accept-Ranges: ${acceptRanges || 'none'}`);
    console.log(`  EBML/MKV Header Valid: ${ebmlValid} | Seekable: ${seekable} | (${Date.now() - started}ms)\n`);

    return {
      name,
      url,
      finalHost,
      status,
      contentType,
      contentLength,
      contentDisposition,
      contentRange,
      acceptRanges,
      ebmlValid,
      seekable
    };
  } catch (error) {
    if (timer) clearTimeout(timer);
    console.log(`[Diagnostic Probe Failed] ${name} -> Error: ${error.message}\n`);
    return { name, url, status: 0, seekable: false, error: error.message };
  }
}

async function probeHubDrive(url, referer) {
  try {
    const res = await fetch(url, { headers: { ...HEADERS, Referer: referer } });
    const html = await res.text();
    const isNotFound = res.status === 404 || /file not found|404 not found|deleted/i.test(html);
    const isCF = res.status === 403 || /just a moment|cf-chl|turnstile/i.test(html);
    const $ = cheerio.load(html);
    const downloadButton = $('a.btn[href], a#download[href], a[href*="hubcloud"]').first().attr('href');

    console.log(`[HubDrive Probe] URL: ${url}`);
    console.log(`  Status: ${res.status} | Final URL: ${res.url || url}`);
    console.log(`  File Not Found: ${isNotFound} | Cloudflare: ${isCF}`);
    console.log(`  Extracted Button URL: ${downloadButton || 'none'}\n`);

    return { status: res.status, finalUrl: res.url || url, isNotFound, isCF, downloadButton };
  } catch (error) {
    console.log(`[HubDrive Probe Error] ${url} -> ${error.message}\n`);
    return { status: 0, error: error.message };
  }
}

async function runEmpiricalDiagnostic() {
  console.log('========================================================================');
  console.log('=== EMPIRICAL 4KHDHUB CANDIDATE DISCOVERY & PLAYBACK DIAGNOSTIC ===');
  console.log('========================================================================\n');

  console.log('--- Phase 1: Candidate Discovery for The Matrix (Movie, TMDB 603) ---');
  const movieCandidates = await fourkHDhub.discoverCandidates('603', 'movie');
  console.log(`Discovered ${movieCandidates.length} total candidates for The Matrix:`);
  const movieByQuality = {};
  for (const c of movieCandidates) {
    movieByQuality[c.quality] = (movieByQuality[c.quality] || 0) + 1;
    console.log(`  - [${c.quality}] Source: ${c.source} | Size: ${c.size || 'N/A'} | URL: ${c.url}`);
  }
  console.log('Candidate totals by quality:', movieByQuality, '\n');

  console.log('--- Phase 2: Candidate Discovery for Reacher S01E01 (TV, TMDB 108978) ---');
  const tvCandidates = await fourkHDhub.discoverCandidates('108978', 'tv', 1, 1);
  console.log(`Discovered ${tvCandidates.length} total candidates for Reacher S01E01:`);
  const tvByQuality = {};
  for (const c of tvCandidates) {
    tvByQuality[c.quality] = (tvByQuality[c.quality] || 0) + 1;
    console.log(`  - [${c.quality}] Source: ${c.source} | Size: ${c.size || 'N/A'} | URL: ${c.url}`);
  }
  console.log('Candidate totals by quality:', tvByQuality, '\n');

  console.log('--- Phase 3: Probing HubDrive Candidate Routes ---');
  const hubdriveCandidates = [...movieCandidates, ...tvCandidates].filter(c => c.source === 'HubDrive');
  for (const hd of hubdriveCandidates.slice(0, 5)) {
    await probeHubDrive(hd.url, hd.referer);
  }

  console.log('--- Phase 4: Stream Resolution & Range Diagnostics ---');
  const movieResolved = await fourkHDhub.getStreams('603', 'movie');
  console.log(`Resolved ${movieResolved.length} total streams for The Matrix:`);
  for (const stream of movieResolved) {
    await testRange(`${stream.name} [Provider: ${stream.provider}]`, stream.url, stream.headers);
  }
}

runEmpiricalDiagnostic();
