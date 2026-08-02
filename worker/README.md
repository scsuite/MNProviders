# MNProviders Cloudflare Resolver

This Worker runs supported providers in parallel. UHDMovies, 4KHDHub and HDHub4u
perform complete server-side resolution; their results are cached for five minutes
because some final media URLs are signed. Other complete discovery results are
cached for six hours. Video bytes do not pass through the Worker.

## Dashboard deployment

1. Run `node worker/build.js` locally (the repository already contains esbuild).
2. Open Cloudflare **Workers & Pages**, then open your Worker.
3. Choose **Edit code**, replace the editor contents with `worker/dist/worker.js`,
   then press **Deploy**.
4. Verify `/health` and then test a stream URL.

Examples:

```text
https://YOUR-WORKER.workers.dev/health
https://YOUR-WORKER.workers.dev/streams?tmdbId=1402&type=tv&season=1&episode=1
https://YOUR-WORKER.workers.dev/streams?tmdbId=1402&type=tv&season=1&episode=1&providers=moviesdrive
https://YOUR-WORKER.workers.dev/streams?tmdbId=1124&type=movie&providers=uhdmovies&timeout=30000
https://YOUR-WORKER.workers.dev/streams?tmdbId=603&type=movie&providers=4khdhub&timeout=30000
https://YOUR-WORKER.workers.dev/streams?tmdbId=603&type=movie&providers=hdhub4u&timeout=40000
```

Optional Worker variables:

- `PROVIDER_TIMEOUT_MS`: provider deadline, default `8000` (allowed 3000–45000).
- `RESOLVER_KEY`: when set, clients must send the same value in `X-Resolver-Key`.

Do not enable `RESOLVER_KEY` until the Nuvio plugins have been configured to send
it. A key embedded in a public plugin should be treated only as abuse friction,
not as a secret.
