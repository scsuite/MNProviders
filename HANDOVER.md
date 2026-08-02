# MNProviders — Complete Project Handover

Last updated: 2026-08-02 (Asia/Karachi)

## 1. Project identity

- GitHub repository: `https://github.com/scsuite/MNProviders`
- Branch: `main`
- Nuvio repository URL:
  `https://raw.githubusercontent.com/scsuite/MNProviders/refs/heads/main/manifest.json`
- Local project folder used during development:
  `C:\Users\AMS-Admin\Desktop\MNProviders`
- Current repository/manifest version: `1.0.60`
- Current latest work: Worker-first UHDMovies, 4KHDHub and HDHub4u resolution
- Cloudflare Worker:
  `https://lucky-star-3059.salman-sohail93.workers.dev`
- Worker source/bundle version prepared: `1.0.17` (manual Cloudflare deployment required)

The project targets Nuvio on Mobile, Desktop and TV. It contains movie and TV
providers only; anime/cartoon-only providers are intentionally excluded.

## 2. Product requirements agreed with the user

These requirements must be preserved in future work:

1. Providers should be independent plugins. The combined StreamPlay provider is
   experimental and disabled.
2. Do not reduce or cap links merely to improve speed. Preserve every distinct,
   valid final stream URL.
3. Remove exact duplicates only. The deduplication key is effectively quality,
   source and final URL.
4. Global quality order must be:
   `4K/2160p > 1440p > 1080p > 720p > 480p > 360p > 240p`.
   Do not sort highest-to-lowest separately per source.
5. Within the same quality, known seekable links may appear before unknown and
   confirmed non-seekable links.
6. Do not expose HTML landing pages as playable streams when protected resolution
   fails.
7. Provider domains must remain centralized in `src/config/domains.js` so domain
   changes can be maintained in one place.
8. Do not modify Nuvio itself, require a home computer to be running, add a paid
   scraper/proxy/debrid dependency, or add the Hostinger VPS to the current design.
9. The desired user experience is: turn on TV, open Nuvio, and fetch streams with
   no separate machine or manual service startup.

## 3. Current standalone providers

| Provider | Version | Enabled | Types | Main behavior / status |
|---|---:|---:|---|---|
| MoviesDrive | 2.0.15 | Yes | Movie, TV | HubCloud plus GDFlix-style extraction; generally works but protected routes can vary. |
| VegaMovies | 1.0.0 | Yes | Movie, TV | VCloud and FastDL extraction; working. |
| Movies4u | 1.0.0 | Yes | Movie, TV | HubCloud, GDFlix, VCloud and FastDL routes; working. |
| 4KHDHub | 1.1.0 | Yes | Movie, TV | Full Worker-side discovery/resolution in parallel; falls back to device when the Worker is blocked or empty. |
| HDHub4u | 1.1.0 | Yes | Movie, TV | Full Worker-side discovery/resolution in parallel; falls back to device when the Worker is blocked or empty. |
| UHDMovies | 1.1.0 | Yes | Movie, TV | Worker-side multi-route resolution; Resume Cloud is preferred while distinct Google progressive links are preserved. |
| MultiMovies | 1.0.0 | Yes | Movie, TV | Embed/AES stream resolution. |
| MovieBlast | 1.0.0 | Yes | Movie, TV | Fast direct API/CDN provider; added in latest commit. |
| Castle | 1.0.0 | Yes | Movie, TV | Multilingual HLS API fallback; working. |
| StreamPlay | 1.0.31 | No | Movie, TV | Experimental combined aggregator; keep disabled for reliability. |

Provider definitions and cache-busting filenames are in `manifest.json`.

## 4. Important files

- `manifest.json`: repository version, provider versions, enabled state and bundle paths.
- `src/config/domains.js`: all active provider/resolver domains and Worker URL.
- `src/shared/metadata.js`: TMDB metadata lookup shared by providers.
- `src/shared/streams.js`: exact deduplication, quality ranking, seekability hints and labels.
- `src/moviesdrive/index.js`: standalone MoviesDrive provider entry.
- `src/moviesdrive/extractor.js`: HubCloud/GDFlix and related resolver logic.
- `src/providers/streamplay.js`: disabled combined aggregator.
- `src/providers/vegamovies.js`
- `src/providers/movies4u.js`
- `src/providers/fourkHDhub.js`
- `src/providers/hdhub4u.js`
- `src/providers/multimovies.js`
- `src/providers/movieblast.js`
- `src/providers/castle.js`
- `providers/*.js`: production bundles consumed by Nuvio.
- `worker/src/index.js`: Worker source.
- `worker/dist/worker.js`: Worker bundle to paste/deploy to Cloudflare.
- `build.js`: provider bundle builder.
- `worker/build.js`: Worker builder.
- `tests/`: validation, sorting, fallback and integration diagnostics.

Important: the existing `README.md` contains inherited/outdated statements such as
"async/await is not supported." Do not treat that README as the authoritative
architecture document. The current code and this handover are authoritative.

## 5. Current domain configuration

At handover time `src/config/domains.js` contains:

```text
Worker:       https://lucky-star-3059.salman-sohail93.workers.dev
MoviesDrive:  https://new1.moviesdrive.christmas
VegaMovies:   https://vegamovies.catering
Movies4u:     https://new2.movies4u.clinic
4KHDHub:      https://4khdhub.one
HDHub4u:      https://new4.hdhub4u.cl
HDHub search: https://search.pingora.fyi/collections/post/documents/search
MultiMovies:  https://multimovies.makeup
Castle API:   https://api.hlowb.com
MovieBlast:   https://app.cloud-mb.xyz
NexDrive:     https://nexdrive.fit
HubCloud:     https://hubcloud.cx
VCloud:       https://vcloud.zip
FastDL:       https://fastdl.zip
GDFlix:       https://new3.gdflix.cfd, https://new2.gdflix.cfd
```

Phisher's dynamic domains file is also configured:
`https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json`.

## 6. Architecture findings

### Nuvio fetch behavior

The official Nuvio Mobile runtime was audited. Its Android fetch bridge invokes a
native HTTP request synchronously before exposing the result as a JavaScript
Promise. Consequently, putting many fetch calls in `Promise.all()` does not provide
true native HTTP parallelism inside one provider. Nuvio also has an approximately
60-second plugin execution deadline.

This is why a device-only provider with many sequential protected hops, especially
HDHub4u, can take 30–120 seconds even when JavaScript appears concurrent.

### Worker versus residential device requests

Cloudflare Workers use datacenter IP addresses. Several target sites challenge or
block those requests. A Worker cannot make an outbound request originate from the
user's residential IP. Routing a phone request through a Worker still makes the
target see the Worker's IP.

The earlier Worker-first architecture had a critical false-negative behavior:
the Worker could return HTTP 200 with zero candidates after being challenged, and
the device would not activate local fallback. The current 4KHDHub and HDHub4u
providers accept Worker results only when their provider state is `success` and
direct streams are non-empty; otherwise they activate the original local path.

The Worker should only be used where the upstream accepts it: APIs, metadata/cache,
or discovery routes empirically verified from Worker IPs. Do not assume it bypasses
Cloudflare.

### Why CloudStream/Phisher can work where Nuvio cannot

CloudStream plugins run natively on Android. Phisher can open an Android WebView,
let the user solve a Cloudflare challenge on the device IP, and retain the matching
`cf_clearance` cookie/User-Agent in a native cookie jar. Pure Nuvio provider JS has
no equivalent cross-platform WebView challenge API.

Cookies solved on a device generally cannot be reused by a Worker because the IP,
TLS fingerprint, User-Agent and request context differ.

## 7. HDHub4u work and current limitation

Nuvio logcat exposed unsupported Cheerio operations:

```text
[HDHub4u Candidates] not a function
[HDHub4u Candidates:detail page parsing] not a function
```

The provider was fixed by removing/replacing unsupported APIs including patterns
around `.closest`, `.map().get`, `.matchAll` and `.prevAll`.

Current implementation:

- Worker-first full discovery and resolution;
- automatic device-side fallback on Worker error, timeout or empty results;
- no Watch links;
- no artificial result caps;
- expands HubDrive wrappers;
- canonicalizes/deduplicates equivalent HubCloud/HubCDN landing routes before
  resolution;
- preserves every unique final Drive, Instant and protected stream URL;
- statefully associates episode headings with following quality blocks.

Live validation before the latest provider work:

- Scary Movie (2026): 15 unique non-Watch links.
- Musafir Cafe S01E01: 8 links.
- Musafir Cafe S01E02: 8 links.

The new Worker executes 4KHDHub and HDHub4u concurrently. A combined live Matrix
test returned four 4KHDHub streams and three HDHub4u streams in about 14.8 seconds;
the result is cached for five minutes. If an upstream challenges the Worker's
datacenter IP, the provider deliberately falls back to the slower device path so a
Worker false negative does not become `No streams found`.

Key commits:

```text
6849c25 Preserve all HDHub4u links with canonical route deduplication
49d3812 Remove unsupported Cheerio APIs from HDHub4u
e12853f Avoid incompatible Cheerio mapping in HDHub4u
29ec02f Use same-domain search for HDHub4u
7602248 Move HDHub4u resolution fully to device
```

## 8. Playback and seeking findings

Do not equate network transfer with playable streaming.

- HubCloud FSL was observed returning HTTP 206 and `Content-Range` in diagnostic
  probes, but seeking was still inconsistent in Nuvio for some files.
- HubCloud Pixel 10Gbps commonly ignores Range, returns HTTP 200 with the complete
  body and is labeled `(No Seek)` when confirmed.
- Pixeldrain URLs frequently expire or return 404 and may not play.
- Castle HLS is considered natively seekable through HLS segment behavior.
- Unknown hosts must not be mislabeled `(No Seek)`; only confirmed false gets the
  label.
- Quality ranking always has priority over seekability. A non-seekable 1080p link
  still remains above a seekable 720p link.
- Normal sorting must perform zero network probes. Range checks belong only in
  diagnostics/integration tests.

4KHDHub empirical issue:

- Some final `video-downloads.googleusercontent.com` MKV URLs return valid MKV
  content but ignore every Range request and send HTTP 200/full Content-Length.
- VLC, MPV, JustPlayer and Nuvio can receive data without starting playback.
- This is not merely a MIME or player configuration problem.
- Do not fake HTTP 206 in a proxy. Genuine random access is impossible unless the
  entire object is first ingested into range-capable storage such as R2.
- Real alternatives are download-then-play, marking such links Download Only, or
  asynchronous R2 ingestion with storage/egress/operational costs.

## 9. MovieBlast implementation and live results

Added in commit:

```text
ce03a78 Add MovieBlast standalone provider
```

Implementation details:

- API: `https://app.cloud-mb.xyz`
- Uses the upstream MovieBlast token, request headers and HMAC-signed playback URLs
  ported from yoruix/Phisher logic.
- Movie detail endpoint and TV season/episode endpoint are selected separately.
- All video entries are returned with no cap.
- Final sorting goes through `uniqueExactStreams()`.
- No Worker deployment is required.

Live source tests at implementation time:

| Test | Result | Approx. time |
|---|---:|---:|
| Project Hail Mary (TMDB 687163) | 5 links | 4.6 s |
| Reacher S01E01 (TMDB 108978) | 2 links | 1.1 s |
| Musafir Cafe S01E01 (TMDB 313101) | 2 links | 0.9 s |

Generated bundle `providers/MovieBlast.js` was also loaded directly and confirmed
to export `getStreams` and return signed URLs.

## 10. CinemaCity audit — do not implement yet

The Phisher CinemaCity v19 `.cs3` artifact was downloaded and its DEX inspected.
There is no readable source in the repository and no yoruix implementation.

Recovered flow:

1. Main domain: `https://cinemacity.cc`.
2. DLE search with `do=search`, followed by `engine/mods/dle_search/ajax.php`.
3. Detail-page script containing `atob(...)` is decoded.
4. PlayerJS data yields HLS master streams, separate audio, subtitles and download
   links.
5. Phisher contains a dedicated `CloudflareWebViewDialog`, cookie persistence and
   a bypass settings screen.

Live probes on 2026-08-02 returned HTTP 403 for homepage, movies, TV and search.
The response explicitly included:

```text
Cf-Mitigated: challenge
Server: cloudflare
```

Phisher requires the user to solve the challenge in Android WebView and saves
`cf_clearance`, cookie host and User-Agent. This cannot currently be reproduced
reliably in Nuvio provider JS across Mobile, Desktop and TV. CinemaCity should stay
on hold unless Nuvio gains a cross-platform challenge/cookie API or the site exposes
an unprotected legitimate API.

## 11. Cloudflare Worker status

Expected root response after manually deploying `worker/dist/worker.js`:

```json
{"ok":true,"service":"MNProviders Resolver","version":"1.0.17","providers":["moviesdrive","vegamovies","movies4u","4khdhub","hdhub4u","multimovies","castle","uhdmovies"]}
```

UHDMovies, 4KHDHub and HDHub4u perform full resolution in the Worker. The two Hub
providers retain a local fallback because some upstreams may block Cloudflare
datacenter requests. MovieBlast remains device-side and does not need the Worker.

For a Worker source change:

```powershell
npm run build:worker
```

Then deploy/paste `worker/dist/worker.js` through the existing Cloudflare Worker
workflow and verify the root URL reports the new version. Git push alone does not
necessarily deploy the Worker unless Cloudflare Git integration is configured.

## 12. New-PC setup

Install Git and Node.js, then run:

```powershell
cd $env:USERPROFILE\Desktop
git clone https://github.com/scsuite/MNProviders.git
cd MNProviders
npm install
npm test
```

Check repository state:

```powershell
git status
git log --oneline -10
git remote -v
```

Build all manifest providers:

```powershell
npm run build
npm test
```

Build a single provider while developing:

```powershell
npm run build -- MovieBlast
```

Build Worker only when Worker source changed:

```powershell
npm run build:worker
```

Publish normal provider changes:

```powershell
git add manifest.json src providers
git commit -m "Describe the provider change"
git push origin main
```

Do not run `git push` from `C:\Users\AMS-Admin`; first `cd` into the cloned
`MNProviders` directory.

## 13. Versioning and Nuvio cache rules

Whenever a provider changes:

1. Increment that provider's semantic version in `manifest.json`.
2. Change its bundle cache query, e.g. `MovieBlast.js?v=100` to `?v=101`.
3. Increment the repository version.
4. Build the provider so `providers/<Name>.js` matches the source.
5. Run `npm test`.
6. Commit and push both source and generated bundle.
7. Refresh/reinstall the repository in Nuvio. If GitHub/Nuvio still caches the old
   manifest, temporarily append a query parameter to the repository URL.

## 14. Android debugging commands

In Command Prompt:

```cmd
adb logcat -c
REM Reproduce the provider failure in Nuvio
adb logcat -d | findstr /i "HDHub4u MovieBlast PluginRuntime FetchBridge JavaScript MNProviders"
```

`Select-String` is a PowerShell command and does not work in plain Command Prompt.
In PowerShell use:

```powershell
adb logcat -d | Select-String -Pattern "HDHub4u|MovieBlast|PluginRuntime|FetchBridge|JavaScript|MNProviders" -CaseSensitive:$false
```

## 15. Testing expectations for every new provider

Before adding a provider to the manifest:

1. Confirm its current domain/API and do not rely only on old source code.
2. Test at least one English movie, one Hindi/Indian movie where relevant, and two
   TV episodes from different series.
3. Measure discovery and resolution time separately where possible.
4. Confirm final URLs are media/direct-download responses, not HTML pages.
5. Check playback and Range behavior empirically without downloading a full huge
   file.
6. Preserve all unique links; do not use `slice`, one-per-quality, max-release or
   first-N caps.
7. Verify global quality sorting and meaningful source/host labels.
8. Run the generated bundle, not only the source module.
9. Run `npm test` and `git diff --check`.
10. State clearly whether a Worker deployment is required.

## 16. Recommended next direction

Do not pick DesiCinemas (user explicitly rejected it). NetCinez was suggested but
not approved. CinemaCity was investigated and rejected for now because of mandatory
Cloudflare WebView handling.

The next provider should preferably resemble MovieBlast:

- legitimate direct API or stable JSON endpoint;
- accessible from Nuvio device fetch without WebView challenge;
- movies and TV series;
- distinct English/Hindi/multilingual catalog;
- direct HLS or range-capable files;
- few network hops and preferably under 10 seconds;
- no artificial link caps.

Audit a candidate live before implementation. A compiled Phisher artifact alone is
not evidence that it will work in Nuvio.

## 17. Final verification state at handover

- Git branch: `main`
- Remote: `https://github.com/scsuite/MNProviders.git`
- Manifest: `1.0.60`
- 4KHDHub: `1.1.0`
- HDHub4u: `1.1.0`
- Worker source/bundle: `1.0.17` (manual dashboard deployment required)
- Provider tests, validation, sorting tests, generated-bundle syntax checks and
  Worker redirect tests passed for the parallel implementation.

