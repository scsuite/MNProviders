const cheerio = require('cheerio-without-node-native');
const fourkHDhub = require('../src/providers/fourkHDhub');
const { checkStreamRange, mapConcurrent } = require('../src/shared/streams');

async function probeCandidate(candidate) {
  const started = Date.now();
  try {
    const streams = await fourkHDhub.resolveCandidate(candidate);
    const elapsedMs = Date.now() - started;
    if (!streams || !streams.length) {
      return {
        quality: candidate.quality,
        source: candidate.source,
        release: candidate.label || 'Unknown',
        url: candidate.url,
        resolvedCount: 0,
        status: 'Filtered / Dead / HTML Page',
        seekable: false,
        elapsedMs
      };
    }
    const sample = streams[0];
    const rangeRes = await checkStreamRange(sample.url, sample.headers, 3000);
    return {
      quality: sample.quality || candidate.quality,
      source: sample.source || candidate.source,
      release: candidate.label || 'Unknown',
      url: sample.url,
      resolvedCount: streams.length,
      finalHost: rangeRes.finalHost || rangeRes.finalUrl || 'Unknown',
      status: rangeRes.status || 200,
      contentType: rangeRes.contentType || 'unknown',
      seekable: rangeRes.seekable || false,
      elapsedMs
    };
  } catch (error) {
    return {
      quality: candidate.quality,
      source: candidate.source,
      release: candidate.label || 'Unknown',
      url: candidate.url,
      resolvedCount: 0,
      status: `Error: ${error.message}`,
      seekable: false,
      elapsedMs: Date.now() - started
    };
  }
}

async function run4kHDHubDiagnostics() {
  console.log('========================================================================');
  console.log('=== 4KHDHUB COMPREHENSIVE LIVE DIAGNOSTIC & DISCOVERY TEST ===');
  console.log('========================================================================\n');

  console.log('--- Target 1: The Matrix (Movie, TMDB 603) ---');
  const movieStart = Date.now();
  const movieCandidates = await fourkHDhub.discoverCandidates('603', 'movie');
  console.log(`Discovered ${movieCandidates.length} candidate links across all releases in ${Date.now() - movieStart}ms`);

  const movieDiagnostics = await mapConcurrent(movieCandidates, 4, probeCandidate);
  console.log('\nPer-Link Diagnostic Results for The Matrix:');
  for (const item of movieDiagnostics) {
    console.log(`  [${item.quality}] Release: "${item.release.slice(0, 40)}..."`);
    console.log(`    Source: ${item.source} | Status: ${item.status} | Final Host: ${item.finalHost || 'N/A'}`);
    console.log(`    Content-Type: ${item.contentType || 'N/A'} | Seekable: ${item.seekable} | Resolved: ${item.resolvedCount} stream(s) | (${item.elapsedMs}ms)`);
  }

  console.log('\n--- Target 2: Reacher S01E01 (TV, TMDB 108978) ---');
  const tvStart = Date.now();
  const tvCandidates = await fourkHDhub.discoverCandidates('108978', 'tv', 1, 1);
  console.log(`Discovered ${tvCandidates.length} candidate links across all releases in ${Date.now() - tvStart}ms`);

  const tvDiagnostics = await mapConcurrent(tvCandidates, 4, probeCandidate);
  console.log('\nPer-Link Diagnostic Results for Reacher S01E01:');
  for (const item of tvDiagnostics) {
    console.log(`  [${item.quality}] Release: "${item.release.slice(0, 40)}..."`);
    console.log(`    Source: ${item.source} | Status: ${item.status} | Final Host: ${item.finalHost || 'N/A'}`);
    console.log(`    Content-Type: ${item.contentType || 'N/A'} | Seekable: ${item.seekable} | Resolved: ${item.resolvedCount} stream(s) | (${item.elapsedMs}ms)`);
  }

  console.log('\n========================================================================');
  console.log('=== SUMMARY OF 4KHDHUB DIAGNOSTICS ===');
  console.log(`Movie (The Matrix): ${movieCandidates.length} discovered, ${movieDiagnostics.filter(d => d.resolvedCount > 0).length} playable streams resolved`);
  console.log(`TV (Reacher S01E01): ${tvCandidates.length} discovered, ${tvDiagnostics.filter(d => d.resolvedCount > 0).length} playable streams resolved`);
  console.log('========================================================================\n');
}

run4kHDHubDiagnostics().catch(err => {
  console.error('❌ 4KHDHub Diagnostics Failure:', err);
  process.exit(1);
});
