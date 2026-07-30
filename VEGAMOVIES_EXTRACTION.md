# VegaMovies extraction map

## Content lookup

1. Fetch the active domain from Phisher's `domains.json` (`vegamovies` field).
2. Fetch TMDB metadata and its IMDb ID.
3. Query `GET /search.php?q=<imdb-id>`.
4. Prefer an exact `imdb_id` match; fall back to title/year matching.
5. Open the result's `permalink`.

## Movie selection

Movie releases are grouped by `h3`/`h4`/`h5` quality headings. Each release points to a Nexdrive page. Its heading supplies resolution, codec, audio and file-size metadata.

## TV selection

The VegaMovies detail page is first filtered by `Season N`. The selected Nexdrive season page is then filtered by `Episodes: N`, so a season archive is never returned as an individual episode.

## Server chain

`VegaMovies -> Nexdrive -> server route -> final media URL`

Current Nexdrive routes include:

- G-Direct/Instant -> FastDL embed -> Google-hosted progressive MKV.
- V-Cloud/Resumable -> encoded intermediate page -> server card.
- Filepress/G-Drive, GDToT and batch/archive links can appear, but are not emitted as streams unless they resolve to direct media.

## Recovered V-Cloud server routing

The original Phisher `StreamPlay.cs3` contains dedicated `VCloud` and `VCloudGDirect` extractors. The recovered V-Cloud resolver recognizes:

- FSLv2
- FSL
- BuzzServer (`/download`, then `hx-redirect`)
- Pixeldrain/PixelServer (`/api/file/<id>?download`)
- PDL Server
- 10Gbps (follow redirect; unwrap `link=`)
- S3 Server
- Mega Server
- Generic registered-extractor fallback

The initial V-Cloud page extracts its intermediate URL from either double Base64 `atob(atob(...))` JavaScript or `var url = '...'`, then parses `div.card-body h2 a.btn` server buttons.

## Playback classification

- `G-Direct (VLC)`: valid progressive MKV, but its Google host ignores byte-range requests. It works in VLC/external players and is labelled accordingly.
- V-Cloud server results: intended for Nuvio's internal player after a direct server URL is recovered.
- `vcloud.zip` currently returns Cloudflare HTTP 403 from ordinary server-side requests. The resolver returns no fake stream when blocked.
- Castle remains the verified internal-player HLS fallback.

## Live test titles

- Movie: Dune: Part Two (TMDB `693134`).
- TV: Reacher S01E01 (TMDB `108978`).

