# Isolated MovieBox provider

MovieBox is intentionally separated from the main MNProviders manifest. Add this
repository URL in Nuvio only when testing MovieBox:

```text
https://raw.githubusercontent.com/scsuite/MNProviders/refs/heads/main/manifest-moviebox.json
```

The provider reproduces Phisher MovieBoxProvider v26 request signing and performs
bootstrap, token acquisition, search and playback resolution on the Nuvio device.
It does not use the MNProviders Cloudflare Worker.

The aoneroom gateway returned HTTP 407 to the standalone Node/OpenSSL probe while
the original Phisher Android provider was confirmed working. Consequently this
port is experimental and must first be validated in Nuvio Android's native fetch
runtime. Desktop may fail if the gateway requires an Android TLS fingerprint.

Build and run deterministic tests:

```powershell
node build-moviebox.js
node tests/moviebox.test.js
$env:MOVIEBOX_BUNDLE = '1'
node tests/moviebox.test.js
Remove-Item Env:MOVIEBOX_BUNDLE
```

The normal `manifest.json` does not include MovieBox and remains unaffected.
