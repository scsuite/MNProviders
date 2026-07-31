const assert = require('assert');
const { getStreams: getStreamPlayStreams, WORKER_BASE } = require('../src/providers/streamplay');

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

  console.log('\n=== Integration Test 2: TV Episode Stream Discovery & Resolution (TMDB 108978 S01E01) ===');

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
}

runIntegrationTest().then(() => {
  console.log('\n✅ INTEGRATION TESTS PASSED WITH HONEST TIMING MEASUREMENTS!');
}).catch(err => {
  console.error('\n❌ INTEGRATION TEST FAILURE:', err);
  process.exit(1);
});
