const assert = require('assert');
const { getStreams: getStreamPlayStreams, WORKER_BASE } = require('../src/providers/streamplay');
const { checkStreamRange, mapConcurrent } = require('../src/shared/streams');

async function measureWorkerEndpoint(tmdbId, type, season, episode) {
  const started = Date.now();
  const url = `${WORKER_BASE}/streams?tmdbId=${tmdbId}&type=${type}&season=${season || 1}&episode=${episode || 1}`;
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const elapsedMs = Date.now() - started;
    const cacheHeader = response.headers.get('x-mnproviders-cache') || 'UNKNOWN';
    if (!response.ok) {
      return { ok: false, status: response.status, elapsedMs, cacheHeader };
    }
    const json = await response.json();
    return {
      ok: true,
      status: response.status,
      elapsedMs,
      cacheHeader,
      directCount: (json.directStreams || []).length,
      candidateCount: (json.candidates || []).length
    };
  } catch (error) {
    return { ok: false, error: error.message, elapsedMs: Date.now() - started };
  }
}

function selectRepresentativeHosts(streams) {
  const seenTypes = new Set();
  const representative = [];

  for (const stream of streams) {
    let hostType = 'other';
    const source = String(stream.source || stream.name || '').toLowerCase();
    const url = String(stream.url || '').toLowerCase();

    if (/fsl/i.test(source)) hostType = 'hubcloud_fsl';
    else if (/10gbps/i.test(source)) hostType = 'pixel_10gbps';
    else if (/fastdl/i.test(source)) hostType = 'fastdl';
    else if (/castle|\.m3u8/i.test(source + ' ' + url)) hostType = 'castle_hls';
    else if (/pixeldrain/i.test(source)) hostType = 'pixeldrain';
    else if (/gdflix/i.test(source)) hostType = 'gdflix';

    if (!seenTypes.has(hostType)) {
      seenTypes.add(hostType);
      representative.push({ hostType, stream });
    }
  }

  return representative;
}

async function runIntegrationTest() {
  console.log('=== Integration Test 1: Movie Stream Discovery & Resolution (TMDB 603) ===');

  const movieWorkerProbe = await measureWorkerEndpoint('603', 'movie');
  console.log(`Worker Movie Discovery Time: ${movieWorkerProbe.elapsedMs} ms | Cache Status: ${movieWorkerProbe.cacheHeader} | Status: ${movieWorkerProbe.status || movieWorkerProbe.error}`);
  if (movieWorkerProbe.ok) {
    console.log(`Worker returned ${movieWorkerProbe.directCount} direct streams & ${movieWorkerProbe.candidateCount} candidate streams`);
  }

  const movieStart = Date.now();
  const movieStreams = await getStreamPlayStreams('603', 'movie');
  const movieTotalTimeMs = Date.now() - movieStart;
  const movieResolutionTimeMs = Math.max(0, movieTotalTimeMs - (movieWorkerProbe.ok ? movieWorkerProbe.elapsedMs : 0));

  console.log(`Measured Movie StreamPlay Total Time: ${movieTotalTimeMs} ms (Client Candidate Resolution: ~${movieResolutionTimeMs} ms)`);
  console.log(`Total Resolved Movie Streams: ${movieStreams.length}`);

  assert(movieStreams.length > 0, `Expected resolved movie streams for TMDB 603, got 0`);
  const sampleMovie = movieStreams[0];
  assert(sampleMovie.url && /^https?:\/\//i.test(sampleMovie.url), `Valid playable HTTP(S) stream URL required`);
  console.log(`PASS: Movie Stream Sample: "${sampleMovie.name}" -> ${sampleMovie.url.slice(0, 70)}...`);

  console.log('\n=== Integration Test 2: Representative Host Range & Seeking Probes ===');
  const representativeHosts = selectRepresentativeHosts(movieStreams);
  console.log(`Selected ${representativeHosts.length} representative unique host types for diagnostic Range probes (concurrency = 2, timeout = 3s)...`);

  const probeStart = Date.now();
  const probeResults = await mapConcurrent(representativeHosts, 2, async (item) => {
    const res = await checkStreamRange(item.stream.url, item.stream.headers, 3000);
    return { hostType: item.hostType, streamName: item.stream.name, ...res };
  });
  const probeDurationMs = Date.now() - probeStart;

  for (const res of probeResults.filter(Boolean)) {
    console.log(`[Host Diagnostic Probing: ${res.hostType}] ${res.streamName}`);
    console.log(`  Status: ${res.status} | Content-Type: ${res.contentType || 'null'}`);
    console.log(`  Content-Range: ${res.contentRange || 'none'} | Accept-Ranges: ${res.acceptRanges || 'none'}`);
    console.log(`  Confirmed Seekable (HTTP 206/Content-Range): ${res.seekable}`);
  }
  console.log(`Diagnostic Range Probing Time: ${probeDurationMs} ms (measured separately from StreamPlay discovery)`);

  console.log('\n=== Integration Test 3: TV Episode Stream Discovery & Resolution (TMDB 108978 S01E01) ===');

  const tvWorkerProbe = await measureWorkerEndpoint('108978', 'tv', 1, 1);
  console.log(`Worker TV Discovery Time: ${tvWorkerProbe.elapsedMs} ms | Cache Status: ${tvWorkerProbe.cacheHeader} | Status: ${tvWorkerProbe.status || tvWorkerProbe.error}`);
  if (tvWorkerProbe.ok) {
    console.log(`Worker returned ${tvWorkerProbe.directCount} direct streams & ${tvWorkerProbe.candidateCount} candidate streams`);
  }

  const tvStart = Date.now();
  const tvStreams = await getStreamPlayStreams('108978', 'tv', 1, 1);
  const tvTotalTimeMs = Date.now() - tvStart;
  const tvResolutionTimeMs = Math.max(0, tvTotalTimeMs - (tvWorkerProbe.ok ? tvWorkerProbe.elapsedMs : 0));

  console.log(`Measured TV StreamPlay Total Time: ${tvTotalTimeMs} ms (Client Candidate Resolution: ~${tvResolutionTimeMs} ms)`);
  console.log(`Total Resolved TV Streams: ${tvStreams.length}`);

  assert(tvStreams.length > 0, `Expected resolved TV streams for TMDB 108978 S01E01, got 0`);
  const sampleTV = tvStreams[0];
  assert(sampleTV.url && /^https?:\/\//i.test(sampleTV.url), `Valid playable HTTP(S) stream URL required`);
  console.log(`PASS: TV Stream Sample: "${sampleTV.name}" -> ${sampleTV.url.slice(0, 70)}...`);

  console.log('\n=== Timings & Performance Summary ===');
  console.log(`Movie - Worker Discovery: ${movieWorkerProbe.elapsedMs}ms | Client Resolution: ~${movieResolutionTimeMs}ms | Total: ${movieTotalTimeMs}ms | Cache: ${movieWorkerProbe.cacheHeader}`);
  console.log(`TV    - Worker Discovery: ${tvWorkerProbe.elapsedMs}ms | Client Resolution: ~${tvResolutionTimeMs}ms | Total: ${tvTotalTimeMs}ms | Cache: ${tvWorkerProbe.cacheHeader}`);
  console.log(`Diagnostic Range Probes: ${probeDurationMs}ms (reported separately)`);
}

runIntegrationTest().then(() => {
  console.log('\n✅ INTEGRATION TESTS & REPRESENTATIVE RANGE DIAGNOSTICS PASSED!');
}).catch(err => {
  console.error('\n❌ INTEGRATION TEST FAILURE:', err);
  process.exit(1);
});
