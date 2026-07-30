# Movies/TV provider ranking

Generated from `PhisherCloudStream/repo.json`, all 79 records in `plugins.json`, all 79 `.cs3` Android/Dex artifacts, 42 companion JAR records, build metadata (status/version/language/types/descriptions/hashes), and all 48 Nuvio JavaScript providers. The upstream Kotlin source is absent. No playback tests were run for Phase 3.5; domain checks were short HTTP reachability checks only.

## Scoring

Scores use exactly A–I from the request. A published status: 0–3; B Movies: 0–2; C TV: 0–2; D quality potential: 0–3; E anonymous HTTP/HLS potential: 0–3; F readable JS: 0–2; G reachable domain: 0–2; H recent successful evidence: 0–3; I penalties. A high version is shown but is not treated as playback success. Compiled-only candidates receive I −2. “Reachable” does not mean extraction works.

## Full eligible ranking (39 providers)

| Rank | CloudStream plugin | Metadata/artifact path | Version | Status | Nuvio JS | Movies | TV | Lang | Likely mechanism | Current domain status | Known blocker | Components | Total | Recommendation |
|---:|---|---|---:|---:|---|:---:|:---:|---|---|---|---|---|---:|---|
| 1 | XDMovies | plugins.json; XDMovies.cs3 | 7 | 1 | xdmovies.js | Yes | Yes | en | Readable multi-host JS: Pixeldrain, StreamTape, Hubstream, Gofile, GDFlix/Drivebot-style links | new.xdmovies.wtf — HTTP 200 | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+3 F+2 G+2 H+0 I+0 | **17** | NEXT FIVE — Implement next; verify each host independently |
| 2 | IStreamFlare | plugins.json; IStreamFlare.cs3 | 2 | 1 | istreamflare.js | Yes | Yes | hi | Readable JSON app API returning movie/episode play links | istreamflare.com — HTTP 200 | No successful live evidence recorded | A+3 B+2 C+2 D+2 E+3 F+2 G+2 H+0 I+0 | **16** | NEXT FIVE — Implement next; validate API response and final URLs |
| 3 | MPlayerProvider | plugins.json; MPlayerProvider.cs3; MPlayerProvider.jar | 7 | 1 | mplayer.js | Yes | Yes | hi | Readable MXPlayer web API with HLS/DASH URLs | mxplayer.in — HTTP 200 | Likely geo-restricted; single service | A+3 B+2 C+2 D+2 E+2 F+2 G+2 H+0 I+0 | **15** | NEXT FIVE — Implement next with explicit geo/DRM rejection tests |
| 4 | Cinefreak | plugins.json; Cinefreak.cs3; Cinefreak.jar | 9 | 1 | cinefreak.js | Yes | Yes | bn | Readable single-site/API implementation; inspect code for exact host chain | https://cinefreak.nl | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+2 F+2 G+0 H+0 I+0 | **14** | Evaluate after higher-ranked aggregators |
| 5 | Topstreamfilm | plugins.json; Topstreamfilm.cs3; Topstreamfilm.jar | 7 | 1 | topstreamfilm.js | Yes | Yes | de | Readable single-site/API implementation; inspect code for exact host chain | https://www.topstreamfilm.live) | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+2 F+2 G+0 H+0 I+0 | **14** | Evaluate after higher-ranked aggregators |
| 6 | Fivemovierulz | plugins.json; Fivemovierulz.cs3; Fivemovierulz.jar | 6 | 1 | fivemovierulz.js | Yes | Yes | hi | Readable single-site/API implementation; inspect code for exact host chain | https://5movierulz.gripe | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+2 F+2 G+0 H+0 I+0 | **14** | Evaluate after higher-ranked aggregators |
| 7 | Pencurimovie | plugins.json; Pencurimovie.cs3; Pencurimovie.jar | 5 | 1 | pencurimovie.js | Yes | Yes | id | Readable single-site/API implementation; inspect code for exact host chain | https://ww73.pencurimovie.bond | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+2 F+2 G+0 H+0 I+0 | **14** | Evaluate after higher-ranked aggregators |
| 8 | Pinoymoviepedia | plugins.json; Pinoymoviepedia.cs3; Pinoymoviepedia.jar | 3 | 1 | pinoymoviepedia.js | Yes | Yes | fil | Readable single-site/API implementation; inspect code for exact host chain | https://pinoymoviepedia.ru | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+2 F+2 G+0 H+0 I+0 | **14** | Evaluate after higher-ranked aggregators |
| 9 | Pmsm | plugins.json; Pmsm.cs3 | 3 | 1 | pmsm.js | Yes | Yes | id | Readable single-site/API implementation; inspect code for exact host chain | https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+2 F+2 G+0 H+0 I+0 | **14** | Evaluate after higher-ranked aggregators |
| 10 | TokusatsuUltimate | plugins.json; TokusatsuUltimate.cs3 | 2 | 1 | tokusatsu.js | Yes | Yes | en | Readable single-site/API implementation; inspect code for exact host chain | https://toku555.com) | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+2 F+2 G+0 H+0 I+0 | **14** | Evaluate after higher-ranked aggregators |
| 11 | TokuZilla | plugins.json; TokuZilla.cs3 | 2 | 1 | tokuzilla.js | Yes | Yes | en | Readable single-site/API implementation; inspect code for exact host chain | https://tokuzilla.net) | No successful live evidence recorded | A+3 B+2 C+2 D+3 E+2 F+2 G+0 H+0 I+0 | **14** | Evaluate after higher-ranked aggregators |
| 12 | StreamPlay | plugins.json; StreamPlay.cs3 | 654 | 1 | None (compiled only) | Yes | Yes | en | Compiled MultiAPI aggregator; individual APIs/extractors cannot be verified without source | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+3 E+3 F+0 G+0 H+2 I-2 | **13** | NEXT FIVE — Implement next; strongest aggregator signal, but reconstruct only from authorized evidence |
| 13 | HDhub4u | plugins.json; HDhub4u.cs3 | 49 | 1 | None (compiled only) | Yes | Yes | hi | Compiled HDHub4u site/download provider; exact host chain unavailable | new3.hdhub4u.cl — HTTP 200 (maintained registry) | Readable source unavailable | A+3 B+2 C+2 D+3 E+2 F+0 G+2 H+1 I-2 | **13** | NEXT FIVE — Implement next after extracting observable request flow from artifact |
| 14 | KisskhProvider | plugins.json; KisskhProvider.cs3; KisskhProvider.jar | 19 | 1 | kisskh.js | Yes | Yes | en | Readable single-site/API implementation; inspect code for exact host chain | https://kisskh.nl | No successful live evidence recorded | A+3 B+2 C+2 D+2 E+2 F+2 G+0 H+0 I+0 | **13** | Evaluate after higher-ranked aggregators |
| 15 | MultiMoviesProvider | plugins.json; MultiMoviesProvider.cs3; MultiMoviesProvider.jar | 50 | 1 | multimovies.js | Yes | Yes | hi | Readable WordPress player AJAX and embed resolution | multimovies.makeup — HTTP 200 | Phase 3: no verified final media in three titles | A+3 B+2 C+2 D+2 E+2 F+2 G+2 H+0 I-3 | **12** | Defer until endpoint behavior changes |
| 16 | FourKHDHub | plugins.json; FourKHDHub.cs3 | 34 | 1 | fourkHDhub.js | Yes | Yes | en | Readable download/HubCloud chain | 4khdhub.one — reachable but Cloudflare placeholder observed | Cloudflare open-graph placeholder; bounded tests found no media | A+3 B+2 C+2 D+3 E+2 F+2 G+1 H+0 I-3 | **12** | Do not prioritize |
| 17 | Hindmoviez | plugins.json; Hindmoviez.cs3 | 13 | 1 | hindmoviez.js | Yes | Yes | hi | Readable site/download scraper | hindmovie.icu — HTTP 200 | JS endpoint is outdated; maintained replacement domain differs | A+3 B+2 C+2 D+2 E+2 F+2 G+2 H+0 I-3 | **12** | Candidate only after endpoint re-audit |
| 18 | DudeFilms | plugins.json; DudeFilms.cs3 | 7 | 1 | dudefilms.js | Yes | Yes | hi | Readable site/download scraper | dudefilms.living — HTTP 200 | JS endpoint is outdated; maintained replacement domain differs | A+3 B+2 C+2 D+2 E+2 F+2 G+2 H+0 I-3 | **12** | Candidate only after endpoint re-audit |
| 19 | LayarKacaProvider | plugins.json; LayarKacaProvider.cs3; LayarKacaProvider.jar | 7 | 1 | layarkaca.js | Yes | Yes | id | Readable single-site/API implementation; inspect code for exact host chain | https://lk21.de | No successful live evidence recorded | A+3 B+2 C+2 D+1 E+2 F+2 G+0 H+0 I+0 | **12** | Evaluate after higher-ranked aggregators |
| 20 | Netcinez | plugins.json; Netcinez.cs3; Netcinez.jar | 3 | 1 | netcinez.js | Yes | Yes | pt-br | Readable WordPress/player iframe flow | netcinez.si reachable; netcineye.lat player HTTP 404 | Dead player endpoint | A+3 B+2 C+2 D+2 E+2 F+2 G+2 H+0 I-3 | **12** | Do not prioritize |
| 21 | Coflix | plugins.json; Coflix.cs3; Coflix.jar | 16 | 1 | coflix.js | Yes | Yes | fr | Readable WordPress JSON/embed flow | coflix.wales — redirect/reachable | Search endpoint HTTP 500 in Phase 2 | A+3 B+2 C+2 D+2 E+2 F+2 G+1 H+0 I-3 | **11** | Defer |
| 22 | Desicinemas | plugins.json; Desicinemas.cs3; Desicinemas.jar | 14 | 1 | desicinemas.js | Yes | Yes | hi | Readable site through public Worker, iframe chain | desicinemas.to — HTTP 200 | No verified media in Phase 3 | A+3 B+2 C+2 D+1 E+2 F+2 G+2 H+0 I-3 | **11** | Do not prioritize |
| 23 | Movies4u | plugins.json; Movies4u.cs3; Movies4u.jar | 10 | 1 | movies4u.js | Yes | Yes | hi | Readable download-page scraper | new1.movies4u.clinic — HTTP 200 | JS contains hardcoded cookie; clean-room anonymous flow required | A+3 B+2 C+2 D+3 E+1 F+2 G+2 H+0 I-4 | **11** | Do not implement until anonymous flow is proven |
| 24 | Goojara | plugins.json; Goojara.cs3; Goojara.jar | 3 | 1 | goojara.js | Yes | Yes | en | Readable search/session-cookie/redirect flow | ww1.goojara.to — HTTP 200 | No verified media in Phase 2 | A+3 B+2 C+2 D+1 E+2 F+2 G+2 H+0 I-3 | **11** | Defer |
| 25 | Movierulzhd | plugins.json; Movierulzhd.cs3; Movierulzhd.jar | 155 | 1 | movierulzhd.js | Yes | Yes | hi | Readable search/embed flow | 123moviesfree9.cv — DNS failure | Maintained-registry domain does not resolve | A+3 B+2 C+2 D+2 E+2 F+2 G+0 H+0 I-3 | **10** | Do not prioritize |
| 26 | Fibwatch | plugins.json; Fibwatch.cs3 | 7 | 1 | fibwatch.js | Yes | Yes | hi | Readable AJAX resolution API and download links | fibwatch.art — HTTP 403 | Current maintained domain rejects anonymous probe with 403 | A+3 B+2 C+2 D+2 E+2 F+2 G+0 H+0 I-3 | **10** | Do not prioritize |
| 27 | MassTamilanProvider | plugins.json; MassTamilanProvider.cs3; MassTamilanProvider.jar | 7 | 1 | masstamilan.js | Yes | No | ta | Readable single-site/API implementation; inspect code for exact host chain | https://masstamilan.dev | No successful live evidence recorded | A+3 B+2 C+0 D+1 E+2 F+2 G+0 H+0 I+0 | **10** | Evaluate after higher-ranked aggregators |
| 28 | MovieBoxProvider | plugins.json; MovieBoxProvider.cs3 | 26 | 1 | None (compiled only) | Yes | Yes | hi | Compiled multi-language Movies/TV provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+2 E+2 F+0 G+0 H+0 I-2 | **9** | Implement next only after artifact/API inspection |
| 29 | AllMovieLandProvider | plugins.json; AllMovieLandProvider.cs3; AllMovieLandProvider.jar | 21 | 1 | None (compiled only) | Yes | Yes | hi | Compiled Indian multi-language Movies/TV provider | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+2 E+2 F+0 G+0 H+0 I-2 | **9** | Inspect artifact after top five |
| 30 | Cinemacity | plugins.json; Cinemacity.cs3 | 18 | 1 | None (compiled only) | Yes | Yes | en | Compiled multi-language/audio Movies/TV provider | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+2 E+2 F+0 G+0 H+0 I-2 | **9** | Inspect artifact after top five |
| 31 | IdlixProvider | plugins.json; IdlixProvider.cs3 | 14 | 1 | idlix.js | Yes | Yes | id | Readable search/play-info/session-claim/redeem API | z1.idlixku.com — unverified | Session claim/redeem authorization required | A+3 B+2 C+2 D+2 E+1 F+2 G+0 H+0 I-4 | **8** | Do not prioritize without proven anonymous flow |
| 32 | UHDmoviesProvider | plugins.json; UHDmoviesProvider.cs3 | 36 | 1 | None (compiled only) | Yes | Yes | en | Compiled provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+1 E+1 F+0 G+0 H+0 I-2 | **7** | Artifact inspection required before implementation |
| 33 | Tamilblasters | plugins.json; Tamilblasters.cs3 | 7 | 1 | None (compiled only) | Yes | Yes | ta | Compiled provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+1 E+1 F+0 G+0 H+0 I-2 | **7** | Artifact inspection required before implementation |
| 34 | BanglaPlex | plugins.json; BanglaPlex.cs3; BanglaPlex.jar | 5 | 1 | None (compiled only) | Yes | Yes | bn | Compiled provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+1 E+1 F+0 G+0 H+0 I-2 | **7** | Artifact inspection required before implementation |
| 35 | OHLI24 | plugins.json; OHLI24.cs3 | 4 | 1 | None (compiled only) | Yes | Yes | ko | Compiled provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+1 E+1 F+0 G+0 H+0 I-2 | **7** | Artifact inspection required before implementation |
| 36 | KayiFamilyTv | plugins.json; KayiFamilyTv.cs3 | 3 | 1 | None (compiled only) | Yes | Yes | en | Compiled provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+1 E+1 F+0 G+0 H+0 I-2 | **7** | Artifact inspection required before implementation |
| 37 | MovieBlast | plugins.json; MovieBlast.cs3 | 3 | 1 | None (compiled only) | Yes | Yes | te | Compiled provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+1 E+1 F+0 G+0 H+0 I-2 | **7** | Artifact inspection required before implementation |
| 38 | Zinkmovies | plugins.json; Zinkmovies.cs3; Zinkmovies.jar | 3 | 1 | None (compiled only) | Yes | Yes | hi | Compiled provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+2 C+2 D+1 E+1 F+0 G+0 H+0 I-2 | **7** | Artifact inspection required before implementation |
| 39 | OneTouchTV | plugins.json; OneTouchTV.cs3; OneTouchTV.jar | 2 | 1 | None (compiled only) | No | Yes | en | Compiled provider; mechanism unavailable | Not exposed in metadata | Readable source unavailable | A+3 B+0 C+2 D+1 E+1 F+0 G+0 H+0 I-2 | **5** | Artifact inspection required before implementation |

## Top 15

1. **XDMovies** — 17; Readable multi-host JS: Pixeldrain, StreamTape, Hubstream, Gofile, GDFlix/Drivebot-style links; No successful live evidence recorded.
2. **IStreamFlare** — 16; Readable JSON app API returning movie/episode play links; No successful live evidence recorded.
3. **MPlayerProvider** — 15; Readable MXPlayer web API with HLS/DASH URLs; Likely geo-restricted; single service.
4. **Cinefreak** — 14; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
5. **Topstreamfilm** — 14; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
6. **Fivemovierulz** — 14; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
7. **Pencurimovie** — 14; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
8. **Pinoymoviepedia** — 14; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
9. **Pmsm** — 14; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
10. **TokusatsuUltimate** — 14; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
11. **TokuZilla** — 14; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
12. **StreamPlay** — 13; Compiled MultiAPI aggregator; individual APIs/extractors cannot be verified without source; Readable source unavailable.
13. **HDhub4u** — 13; Compiled HDHub4u site/download provider; exact host chain unavailable; Readable source unavailable.
14. **KisskhProvider** — 13; Readable single-site/API implementation; inspect code for exact host chain; No successful live evidence recorded.
15. **MultiMoviesProvider** — 12; Readable WordPress player AJAX and embed resolution; Phase 3: no verified final media in three titles.

## Recommended next five

1. **StreamPlay** — uniquely described as MultiAPI and has version 654/status 1; it is the strongest published aggregator signal. Compiled-only/source penalty remains.
2. **XDMovies** — readable multi-host implementation and reachable API domain; strongest inspectable direct-host candidate.
3. **IStreamFlare** — readable JSON API for Movies/TV play links and reachable domain; smaller scope than StreamPlay but much more inspectable.
4. **HDhub4u** — published version 49, Movies/TV, maintained reachable domain, and explicit HD/4K-family potential; compiled-only.
5. **MPlayerProvider** — readable public HLS/DASH API and reachable domain; implementation must reject DRM and report geo restrictions rather than bypass them.

Preference among tied scores favors multi-host/API aggregators over single fragile sites. MXPlayer remains fifth because its API is readable and reachable, but geo restrictions and DRM rejection are mandatory gates.

## Why these outrank the Phase 3 batch

- **StreamPlay** offers a published MultiAPI aggregation signal instead of one site/domain; none of the Phase 3 five did.
- **XDMovies** exposes several readable direct-host extractors, while MoviesDrive, Desicinemas, Netcinez, and MultiMovies returned zero verified media and 4KHDHub hit a Cloudflare placeholder.
- **IStreamFlare** has a readable structured play-link API and reachable domain, avoiding the stale HTML selectors that blocked the prior batch.
- **HDhub4u** is a separate published plugin at version 49 with a maintained reachable domain; it is not the failed FourKHDHub flow, though compiled-source uncertainty remains.
- **MPlayerProvider** has a structured public HLS/DASH API and reachable service, unlike the failed HTML/player chains in the Phase 3 batch; geo/DRM constraints remain explicit blockers.

## Requested-name investigation

| Requested name/family | Finding | Actual evidence |
|---|---|---|
| StreamPlay | Exact published plugin | MultiAPI aggregator; compiled-only |
| SuperStream | Exact published plugin — excluded | Google-login cookie required |
| ShowBox | Exact published plugin — excluded | Google-login cookie required |
| SoraStream | Absent | No metadata or JS match |
| Film1k | Absent | No metadata or JS match |
| CineStream | Absent | No metadata or JS match |
| VidSrc-based | No named plugin | No string evidence in 48 JS files; may be hidden inside compiled StreamPlay but cannot be claimed |
| MultiEmbed-based | No named plugin | No string evidence in JS/metadata |
| PrimeWire-style | No named plugin | No string evidence in JS/metadata |
| FlixHQ-style | No named plugin | No string evidence in JS/metadata |
| FMovies-style | No named plugin | No string evidence in JS/metadata |
| 4KHDHub | Related exact plugin: FourKHDHub | Readable fourkHDhub.js; bounded Phase 3 playback failed |
| MoviesDrive | No exact CloudStream plugin | Readable moviesdrive.js only; current API behavior failed |
| HiMovies | Absent | No metadata or JS match |
| Ridomovies | Absent | No metadata or JS match |
| SmashyStream | Absent | No metadata or JS match |
| AutoEmbed | Absent | No metadata or JS match |
| VidLink | Absent | No metadata or JS match |
| VidSrcTo | Absent | No metadata or JS match |
| TwoEmbed | Absent | No metadata or JS match |
| WarezCDN | Absent | No metadata or JS match |
| NetMovies | Absent | No metadata or JS match |
| Cuevana | Absent | No metadata or JS match |
| PelisPlus | No CloudStream metadata match | Readable pelisplushd.js exists only in Nuvio tree |

## All Nuvio JavaScript correlations

| Nuvio JS | Published CloudStream match | Visible mechanism hints |
|---|---|---|
| allwish.js | AllWish | embed |
| anichi.js | Anichi | HLS, JSON/API, embed |
| anime-dekho.js | AnimeDekhoProvider | embed |
| animecloud.js | AnimeCloud | JSON/API |
| animedubhindi.js | Animedubhindi | multi-host, embed |
| animekhor.js | Animekhor | HTML/direct-link scraper |
| cinefreak.js | Cinefreak | HTML/direct-link scraper |
| coflix.js | Coflix | embed |
| desicinemas.js | Desicinemas | embed |
| donghuastream.js | Donghuastream | embed |
| dorabash.js | DoraBash | WordPress, embed |
| dudefilms.js | DudeFilms | HTML/direct-link scraper |
| fibwatch.js | Fibwatch | HLS |
| fivemovierulz.js | Fivemovierulz | HTML/direct-link scraper |
| fourkHDhub.js | FourKHDHub | HTML/direct-link scraper |
| goojara.js | Goojara | HTML/direct-link scraper |
| hianime.js | No exact published plugin match | HLS, embed |
| hindmoviez.js | Hindmoviez | HTML/direct-link scraper |
| idlix.js | IdlixProvider | HLS, JSON/API |
| istreamflare.js | IStreamFlare | JSON/API |
| kickassanime.js | Kickassanime | HLS, JSON/API |
| kisskh.js | KisskhProvider | HLS, JSON/API |
| latanime.js | Latanime | HLS |
| layarkaca.js | LayarKacaProvider | embed |
| masstamilan.js | MassTamilanProvider | HTML/direct-link scraper |
| megakino.js | Megakino | HLS, embed |
| movierulzhd.js | Movierulzhd | WordPress, embed |
| movies4u.js | Movies4u | HTML/direct-link scraper |
| moviesdrive.js | No exact published plugin match | HLS, multi-host, JSON/API |
| mplayer.js | MPlayerProvider | HLS |
| multimovies.js | MultiMoviesProvider | WordPress, embed |
| netcinez.js | Netcinez | embed |
| onepace.js | OnePace | embed |
| pelisplushd.js | No exact published plugin match | JSON/API, embed |
| pencurimovie.js | Pencurimovie | embed |
| pinoymoviepedia.js | Pinoymoviepedia | embed |
| piratexplay.js | Piratexplay | embed |
| pmsm.js | Pmsm | WordPress, embed |
| ringz.js | RingZ | HTML/direct-link scraper |
| tokusatsu.js | TokusatsuUltimate | HLS, JSON/API, embed |
| tokuzilla.js | TokuZilla | HLS, JSON/API, embed |
| toonhub.js | ToonHub | embed |
| toonstream.js | Toonstream | WordPress, embed |
| toontales.js | ToonTales | HTML/direct-link scraper |
| topcartoons.js | Topcartoons | HTML/direct-link scraper |
| topstreamfilm.js | Topstreamfilm | embed |
| torrastream.js | TorraStream | torrent |
| xdmovies.js | XDMovies | HLS, multi-host, JSON/API |

## Excluded published plugins

| Plugin | Exclusion reason | Artifact |
|---|---|---|
| Anichi | anime-only | Anichi.cs3 |
| AniDb | anime-only | AniDb.cs3 |
| Anikage | anime-only | Anikage.cs3 |
| Animeav1 | anime-only | Animeav1.cs3 |
| AnimeCloud | anime-only | AnimeCloud.cs3 |
| AnimeDekhoProvider | anime-only | AnimeDekhoProvider.cs3 |
| Animedubhindi | anime-only | Animedubhindi.cs3 |
| Animekhor | anime-only | Animekhor.cs3 |
| Animenosub | anime-only | Animenosub.cs3 |
| AnimePahe | anime-only | AnimePahe.cs3 |
| Animesalt | anime-only | Animesalt.cs3 |
| Animexin | anime-only | Animexin.cs3 |
| Anineko | anime-only | Anineko.cs3 |
| Aniworld | anime-only | Aniworld.cs3 |
| Anizone | anime-only | Anizone.cs3 |
| CloudPlay | live-TV-only | CloudPlay.cs3 |
| Donghuastream | anime-only | Donghuastream.cs3 |
| DoraBash | anime-only | DoraBash.cs3 |
| IPTVPlayer | live-TV-only | IPTVPlayer.cs3 |
| Jellyfin | private-server integration | Jellyfin.cs3 |
| Kickassanime | anime-only | Kickassanime.cs3 |
| Latanime | anime-only | Latanime.cs3 |
| OnePace | anime-only | OnePace.cs3 |
| Piratexplay | anime-only | Piratexplay.cs3 |
| PublicSportsIPTV | live-TV-only | PublicSportsIPTV.cs3 |
| QuickIPTV | live-TV-only | QuickIPTV.cs3 |
| RingZ | anime-only | RingZ.cs3 |
| ShowBox | Google-login cookie required | ShowBox.cs3 |
| StremioAddon | configurable addon integration | StremioAddon.cs3 |
| StremioX | catalogue/addon integration | StremioX.cs3 |
| SuperStream | Google-login cookie required | SuperStream.cs3 |
| ToonHub | anime-only | ToonHub.cs3 |
| Toonstream | anime-only | Toonstream.cs3 |
| ToonTales | anime-only | ToonTales.cs3 |
| Topcartoons | anime-only | Topcartoons.cs3 |
| TorraStream | torrent/debrid dependent | TorraStream.cs3 |
| Ultima | aggregator/UI plugin | Ultima.cs3 |
| YTS | torrent-only | YTS.cs3 |

## Capability constraints

- **Compiled-only among the recommended five:** StreamPlay and HDhub4u. Their `.cs3` artifacts exist, but readable Kotlin source and exact extractor graphs are unavailable.
- **Readable JS among the recommended five:** XDMovies, IStreamFlare, and MPlayerProvider (`mplayer.js`).
- **Server-side/WebView:** no recommended candidate is proven to require WebView from available metadata. FourKHDHub shows a Cloudflare access-path problem and is penalized/excluded from the next five. StreamPlay may depend on server-side APIs, but compiled metadata is insufficient to assert WebView.
- **Authentication exclusions:** ShowBox and SuperStream explicitly require Google-login-derived cookies; Jellyfin requires a private server/authentication. They are not ranked.
