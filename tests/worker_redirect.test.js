const assert = require('assert');

(async () => {
  const { handleRequest } = await import('../worker/src/index.js');
  const target = 'https://abc123.r2.cloudflarestorage.com/hub/file-token?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=a%2Bb%2Fc%3D';
  const request = new Request(`https://worker.test/media/file.mkv?url=${encodeURIComponent(target)}`);
  const response = await handleRequest(request, {}, {});

  assert.strictEqual(response.status, 307, 'FSL wrapper must use a same-method 307 redirect');
  assert.strictEqual(response.headers.get('location'), target, 'Signed FSL target must be preserved exactly');
  assert.strictEqual(response.headers.get('x-mnproviders-media-redirect'), 'FSL-MKV');

  const rejected = await handleRequest(
    new Request(`https://worker.test/media/file.mkv?url=${encodeURIComponent('https://example.com/video.mkv')}`),
    {},
    {}
  );
  assert.strictEqual(rejected.status, 400, 'Arbitrary redirect targets must be rejected');
  console.log('PASS: FSL MKV redirect preserves signed URL and rejects non-R2 targets');
})().catch(error => {
  console.error('FAIL:', error);
  process.exit(1);
});
