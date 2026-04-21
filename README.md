# Wireless Mesh Fire Alarm System

Clean static presentation package for GitHub.

## Run Locally

On Windows, run `start-local-server.bat`, then open `http://127.0.0.1:8765/index.html`.

Alternatively, run:

```bash
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/index.html`.

## Offline Tablet Use

On a Samsung Tab, open the deployed HTTPS site once while online and wait for the presentation to load. In Chrome, use `Add to Home screen` or `Install app`. After it is installed, open it from the home-screen icon for offline viewing.

If the presentation is updated later, open it once while online again so the tablet can refresh its offline cache.

## Contents

This branch only includes the runtime files required by `index.html` and the iframe-loaded pages under `pages/`.
