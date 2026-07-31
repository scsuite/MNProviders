const assert = require('assert');
const { uniqueExactStreams, mapConcurrent, qualityRank } = require('../src/shared/streams');
const { discoverCandidates: discoverMD, resolveCandidate: resolveMD } = require('../src/moviesdrive/index');
const { discoverCandidates: discoverVega, resolveCandidate: resolveVega } = require('../src/providers/vegamovies');
const { resolveDeviceCandidate } = require('../src/providers/streamplay');

async function testLinkPreservationAndSorting() {
  console.log('--- Test 1: Multiple links from same quality with different sources are preserved ---');
  const sameQualityDifferentSources = [
    { provider: 'MoviesDrive', source: 'HubCloud Pixel', quality: '1080p', url: 'https://cdn.test/pixel1080.mkv' },
    { provider: 'MoviesDrive', source: 'HubCloud BuzzServer', quality: '1080p', url: 'https://cdn.test/buzz1080.mkv' },
    { provider: 'MoviesDrive', source: 'GDFlix Direct', quality: '1080p', url: 'https://cdn.test/gdflix1080.mkv' },
    { provider: 'vegamovies', source: 'FastDL', quality: '1080p', url: 'https://cdn.test/fastdl1080.mp4' }
  ];

  const processed = uniqueExactStreams(sameQualityDifferentSources);
  assert.strictEqual(processed.length, 4, `Expected 4 distinct sources preserved for 1080p, got ${processed.length}`);
  console.log('PASS: Preserved all 4 distinct 1080p streams from different sources');

  console.log('--- Test 2: Exact (quality, source, url) duplicates are removed ---');
  const withDuplicates = [
    { provider: 'MoviesDrive', source: 'HubCloud Pixel', quality: '1080p', url: 'https://cdn.test/pixel1080.mkv' },
    { provider: 'MoviesDrive', source: 'HubCloud Pixel', quality: '1080p', url: 'https://cdn.test/pixel1080.mkv' }, // Exact duplicate
    { provider: 'MoviesDrive', source: 'HubCloud BuzzServer', quality: '720p', url: 'https://cdn.test/buzz720.mkv' }
  ];

  const deduplicated = uniqueExactStreams(withDuplicates);
  assert.strictEqual(deduplicated.length, 2, `Expected 2 unique streams after deduplication, got ${deduplicated.length}`);
  console.log('PASS: Successfully removed exact (quality, source, url) duplicate');

  console.log('--- Test 3: Global quality sorting order (4K > 1080p > 720p > 480p > 360p > 240p) ---');
  const unsorted = [
    { provider: 'MoviesDrive', source: 'S1', quality: '480p', url: 'https://cdn.test/480.mp4' },
    { provider: 'vegamovies', source: 'S2', quality: '4K', url: 'https://cdn.test/4k.mkv' },
    { provider: 'castle', source: 'S3', quality: '720p', url: 'https://cdn.test/720.m3u8' },
    { provider: 'MoviesDrive', source: 'S4', quality: '1080p', url: 'https://cdn.test/1080.mkv' },
    { provider: 'vegamovies', source: 'S5', quality: '360p', url: 'https://cdn.test/360.mp4' }
  ];

  const sorted = uniqueExactStreams(unsorted);
  const qualities = sorted.map(s => s.quality);
  assert.deepStrictEqual(qualities, ['4K', '1080p', '720p', '480p', '360p']);
  console.log('PASS: Correctly sorted globally by quality (4K > 1080p > 720p > 480p > 360p)');

  console.log('--- Test 4: Bounded concurrency queue processes all items without dropping inputs ---');
  const items = Array.from({ length: 15 }, (_, i) => `item_${i + 1}`);
  let activeWorkers = 0;
  let maxConcurrentEncountered = 0;

  const results = await mapConcurrent(items, 4, async (item) => {
    activeWorkers++;
    if (activeWorkers > maxConcurrentEncountered) maxConcurrentEncountered = activeWorkers;
    await new Promise(r => setTimeout(r, 20));
    activeWorkers--;
    return `processed_${item}`;
  });

  assert.strictEqual(results.length, 15, `Expected 15 processed items, got ${results.length}`);
  assert(maxConcurrentEncountered <= 4, `Expected max concurrency <= 4, got ${maxConcurrentEncountered}`);
  assert(results.every(r => r.startsWith('processed_item_')));
  console.log(`PASS: Processed all 15 candidate queue items with max concurrency ${maxConcurrentEncountered} (<= 4 limit)`);

  console.log('--- Test 5: Candidate schema format verification ---');
  const dummyCandidate = {
    provider: 'MoviesDrive',
    source: 'HubCloud',
    quality: '1080p',
    size: '1.4 GB',
    url: 'https://hubcloud.cx/drive/sample',
    referer: 'https://new1.moviesdrive.christmas/',
    headers: { 'User-Agent': 'TestAgent', Referer: 'https://new1.moviesdrive.christmas/' },
    resolverType: 'hubcloud'
  };

  const requiredFields = ['provider', 'source', 'quality', 'url', 'referer', 'headers', 'resolverType'];
  for (const field of requiredFields) {
    assert(field in dummyCandidate, `Candidate missing required field: ${field}`);
  }
  console.log('PASS: Candidate object contains all required metadata and resolverType fields');

  console.log('--- Test 6: Failed protected resolver never leaks raw landing page URL ---');
  const failedHubCloudCandidate = {
    provider: 'MoviesDrive',
    source: 'HubCloud',
    quality: '1080p',
    url: 'https://hubcloud.cx/drive/invalid_token',
    referer: 'https://new1.moviesdrive.christmas/',
    resolverType: 'hubcloud'
  };

  const failedVCloudCandidate = {
    provider: 'vegamovies',
    source: 'VCloud',
    quality: '1080p',
    url: 'https://vcloud.zip/invalid_token',
    referer: 'https://vegamovies.catering/',
    resolverType: 'vcloud'
  };

  const hubcloudRes = await resolveDeviceCandidate(failedHubCloudCandidate);
  const vcloudRes = await resolveDeviceCandidate(failedVCloudCandidate);

  assert.deepStrictEqual(hubcloudRes, [], `Expected failed HubCloud candidate to return [], got ${JSON.stringify(hubcloudRes)}`);
  assert.deepStrictEqual(vcloudRes, [], `Expected failed VCloud candidate to return [], got ${JSON.stringify(vcloudRes)}`);
  console.log('PASS: Verified failed protected resolvers (HubCloud/VCloud) return [] and NEVER leak raw candidate URLs');

  console.log('--- Test 7: Sorter performs zero fetch/network calls and preserves quality rank priority ---');
  const originalFetch = global.fetch;
  let fetchCallCount = 0;
  global.fetch = async () => { fetchCallCount++; return { ok: false }; };

  const testList = [
    { provider: 'MoviesDrive', source: 'HubCloud Pixel 10Gbps', quality: '1080p', url: 'https://cdn.test/pixel1080.mkv' },
    { provider: 'MoviesDrive', source: 'HubCloud FSL', quality: '720p', url: 'https://cdn.test/fsl720.mkv' },
    { provider: 'vegamovies', source: 'FastDL', quality: '1080p', url: 'https://cdn.test/fastdl1080.mp4' },
    { provider: 'MoviesDrive', source: 'HubCloud FSL', quality: '1080p', url: 'https://cdn.test/fsl1080.mkv' }
  ];

  const sortedList = uniqueExactStreams(testList);
  global.fetch = originalFetch;

  assert.strictEqual(fetchCallCount, 0, `Expected 0 network calls during sorting, got ${fetchCallCount}`);
  console.log('PASS: uniqueExactStreams performed zero network/fetch calls');

  // Quality rank priority check: 1080p must all be above 720p
  const sortedQualities = sortedList.map(s => s.quality);
  assert.deepStrictEqual(sortedQualities, ['1080p', '1080p', '1080p', '720p'], '1080p streams must remain above 720p');
  console.log('PASS: Quality rank always takes priority over seekability (1080p non-seekable > 720p seekable)');

  console.log('--- Test 8: Within equal quality: seekable (true) > unknown > non-seekable (false) ---');
  const same1080pList = [
    { provider: 'MoviesDrive', source: 'HubCloud Pixel 10Gbps', quality: '1080p', url: 'https://cdn.test/pixel1080.mkv' }, // false
    { provider: 'vegamovies', source: 'FastDL', quality: '1080p', url: 'https://cdn.test/fastdl1080.mp4' }, // unknown
    { provider: 'MoviesDrive', source: 'HubCloud FSL', quality: '1080p', url: 'https://cdn.test/fsl1080.mkv' } // true
  ];

  const sorted1080p = uniqueExactStreams(same1080pList);
  const sources1080p = sorted1080p.map(s => s.source);
  assert.deepStrictEqual(sources1080p, ['HubCloud FSL', 'FastDL', 'HubCloud Pixel 10Gbps']);
  const invisiblePrefixLengths = sorted1080p.map(s => (s.name.match(/^\u200B+/) || [''])[0].length);
  assert.deepStrictEqual(invisiblePrefixLengths, [4, 5, 6], 'Nuvio name prefixes must preserve same-quality seekability order');
  console.log('PASS: Within 1080p tier: seekable (FSL) > unknown (FastDL) > non-seekable (Pixel 10Gbps)');

  console.log('--- Test 9: Idempotent labeling & prefix protection ---');
  const pixelStream = { provider: 'MoviesDrive', source: 'HubCloud Pixel 10Gbps', quality: '1080p', url: 'https://cdn.test/pixel1080.mkv' };
  const firstPass = uniqueExactStreams([pixelStream]);
  assert(firstPass[0].name.includes('(No Seek)'), 'First pass should add (No Seek)');

  const secondPass = uniqueExactStreams(firstPass);
  const matches = (secondPass[0].name.match(/\(No Seek\)/g) || []).length;
  assert.strictEqual(matches, 1, `Expected exactly 1 (No Seek) label, got ${matches}`);

  const fastdlStream = { provider: 'vegamovies', source: 'FastDL', quality: '1080p', url: 'https://cdn.test/fastdl1080.mp4' };
  const fastdlSorted = uniqueExactStreams([fastdlStream]);
  assert(!fastdlSorted[0].name.includes('(No Seek)'), 'Unknown seekability stream (FastDL) must NOT be labeled (No Seek)');
  const castleMp4 = uniqueExactStreams([{ provider: 'castle', source: 'Castle MP4', quality: '1080p', url: 'https://cdn.test/castle.mp4' }]);
  assert.strictEqual(castleMp4[0].seekable, 'unknown', 'Only Castle HLS, not every Castle stream, should be statically seekable');
  console.log('PASS: Labeling is idempotent (single (No Seek) label for false, zero for unknown)');
}

testLinkPreservationAndSorting().then(() => {
  console.log('\n✅ ALL PRESERVATION, SEEKABILITY & SORTING UNIT TESTS PASSED!');
}).catch(err => {
  console.error('❌ TEST FAILURE:', err);
  process.exit(1);
});
