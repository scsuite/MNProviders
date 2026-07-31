const assert = require('assert');

let workerUrlCalled = null;
let localVegaDiscoverCalled = false;
let localMDDiscoverCalled = false;

const originalFetch = global.fetch;

global.fetch = async (url, options) => {
  const urlString = String(url);
  const urlDecoded = decodeURIComponent(urlString);
  if (urlString.includes('salman-sohail93.workers.dev')) {
    workerUrlCalled = urlString;
    if (urlDecoded.includes('fail=true')) {
      return { ok: false, status: 500 };
    }

    return {
      ok: true,
      json: async () => ({
        ok: true,
        directStreams: [
          {
            name: 'Castle HLS - 1080p',
            url: 'https://cdn.castle.test/stream.m3u8',
            quality: '1080p',
            provider: 'castle',
            source: 'Castle'
          }
        ],
        candidates: [
          {
            provider: 'vegamovies',
            source: 'FastDL',
            quality: '4K',
            url: 'https://fastdl.test/movie4k',
            referer: 'https://vegamovies.test/',
            resolverType: 'fastdl'
          },
          {
            provider: 'MoviesDrive',
            source: 'HubCloud',
            quality: '720p',
            url: 'https://hubcloud.test/drive/720',
            referer: 'https://moviesdrive.test/',
            resolverType: 'hubcloud'
          }
        ]
      })
    };
  }
  return originalFetch ? originalFetch(url, options) : { ok: false };
};

const vegaResolved = require.resolve('../src/providers/vegamovies');
require.cache[vegaResolved] = {
  id: vegaResolved,
  filename: vegaResolved,
  loaded: true,
  exports: {
    discoverCandidates: async () => {
      localVegaDiscoverCalled = true;
      return [];
    },
    resolveCandidate: async (candidate) => [{
      name: `VegaMovies ${candidate.source} - ${candidate.quality}`,
      url: `https://resolved.test/vega_${candidate.quality}.mp4`,
      quality: candidate.quality,
      provider: 'vegamovies',
      source: candidate.source
    }]
  }
};

const mdResolved = require.resolve('../src/moviesdrive/index');
require.cache[mdResolved] = {
  id: mdResolved,
  filename: mdResolved,
  loaded: true,
  exports: {
    discoverCandidates: async () => {
      localMDDiscoverCalled = true;
      return [];
    },
    resolveCandidate: async (candidate) => [{
      name: `MoviesDrive ${candidate.source} - ${candidate.quality}`,
      url: `https://resolved.test/md_${candidate.quality}.mkv`,
      quality: candidate.quality,
      provider: 'MoviesDrive',
      source: candidate.source
    }]
  }
};

const castleResolved = require.resolve('../src/providers/castle');
require.cache[castleResolved] = {
  id: castleResolved,
  filename: castleResolved,
  loaded: true,
  exports: {
    getStreams: async () => [{
      name: 'Local Castle Fallback',
      url: 'https://cdn.castle.test/fallback.m3u8',
      quality: '720p',
      provider: 'castle',
      source: 'Castle'
    }]
  }
};

const { getStreams } = require('../src/providers/streamplay');

(async () => {
  console.log('--- Test Suite 1: Successful Worker Response ---');
  workerUrlCalled = null;
  localVegaDiscoverCalled = false;
  localMDDiscoverCalled = false;

  const streams = await getStreams('603', 'movie');

  assert(workerUrlCalled && workerUrlCalled.includes('salman-sohail93.workers.dev/streams'), 'Worker endpoint should be called');
  console.log('PASS: Worker endpoint was called:', workerUrlCalled);

  assert.strictEqual(localVegaDiscoverCalled, false, 'Local Vega discoverCandidates should NOT be called on Worker success');
  assert.strictEqual(localMDDiscoverCalled, false, 'Local MoviesDrive discoverCandidates should NOT be called on Worker success');
  console.log('PASS: Local discoverCandidates was skipped on Worker success');

  assert.strictEqual(streams.length, 3, `Expected 3 total streams (1 Castle direct + 2 resolved candidates), got ${streams.length}`);
  const castleStream = streams.find(s => s.provider === 'castle');
  assert(castleStream && castleStream.url === 'https://cdn.castle.test/stream.m3u8', 'Direct Castle stream should be preserved without re-resolution');
  console.log('PASS: Direct Castle streams preserved & all candidates resolved');

  const qualities = streams.map(s => s.quality);
  assert.deepStrictEqual(qualities, ['4K', '1080p', '720p'], `Expected qualities ['4K', '1080p', '720p'], got ${JSON.stringify(qualities)}`);
  console.log('PASS: Global quality order correct (4K > 1080p > 720p)');

  console.log('\n--- Test Suite 2: Worker Failure activates Local Fallback ---');
  workerUrlCalled = null;
  localVegaDiscoverCalled = false;
  localMDDiscoverCalled = false;

  const fallbackStreams = await getStreams('603?fail=true', 'movie');

  assert(workerUrlCalled && decodeURIComponent(workerUrlCalled).includes('fail=true'), 'Worker endpoint was attempted');

  assert.strictEqual(localVegaDiscoverCalled, true, 'Local Vega discoverCandidates SHOULD be called on Worker failure');
  assert.strictEqual(localMDDiscoverCalled, true, 'Local MoviesDrive discoverCandidates SHOULD be called on Worker failure');
  console.log('PASS: Worker failure activated local discovery fallback seamlessly');

  console.log('\n✅ ALL STREAMPLAY WORKER-FIRST & FALLBACK TESTS PASSED!');
})().catch((err) => {
  console.error('❌ TEST FAILURE:', err);
  process.exit(1);
});
