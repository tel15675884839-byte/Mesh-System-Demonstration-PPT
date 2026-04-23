# Original Offline Packaging Workflow

This document records the packaging method for an offline zip that behaves like the original presentation. Use this workflow when the requirement is:

- unzip on another device
- open `Mesh-html-offline/index.html` directly
- preserve the same welcome screen, background, iframe shell, navigation, and page transition behavior as the source project

## Key Decision

Use the original `index.html` shell. Do not use the Artidrop-style export for this requirement.

The original experience depends on:

- `index.html` as the single deck shell
- iframe-loaded slides from `pages/*.html`
- `js/app.js` for slide state, iframe loading, keyboard/wheel navigation, URL state, and `translateY` page transitions
- `js/welcome.js` for the welcome intro and return-to-welcome behavior
- `js/cyber-page-background.js` for the cyan animated background
- `css/style.css` and `css/welcome.css` for the fixed-stage layout and intro animation

The previous Artidrop export intentionally converted slides into separate top-level HTML pages. That made direct file opening easier, but it removed original shell behavior: browser-level navigation replaced the original animated `transform` transitions, and returning to the welcome layer was no longer possible.

## Build Command

From repo root:

```powershell
node scripts/build-original-offline-export.cjs --output "release\Mesh-html-offline"
```

This copies only the original runtime files needed for offline use while preserving relative paths.

Expected output:

```text
release/Mesh-html-offline/
```

## Zip Command

From repo root:

```powershell
$zip = Join-Path (Resolve-Path -LiteralPath 'release').Path 'Mesh-html-offline.zip'
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -LiteralPath 'release\Mesh-html-offline' -DestinationPath $zip -CompressionLevel Optimal
```

Expected zip:

```text
release/Mesh-html-offline.zip
```

## Required Verification

Run targeted Node tests:

```powershell
node --test tests/shell-mode-behavior.test.js tests/welcome-entry.spec.js tests/cyber-page-background.test.js tests/opening-page-local-json.test.js tests/mesh-scene-player-lazy-build.test.js
```

Run a relative reference scan against the generated folder. The expected result is:

```text
All checked relative file references exist.
```

Then unzip the generated zip into a temporary folder and verify by browser automation using `file://`, not a local server. Required checks:

- welcome text shows `Mesh Technology`
- clicking enters the deck and adds `mode-entered`
- iframes load `pages/opening.html` and `pages/overview.html`
- cyan cyber background controller is initialized and running
- pressing `ArrowDown` changes `.slides` transform to `translateY(-1080px)`
- computed transition includes `transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)`
- active nav dot becomes `Feature Overview`
- the next iframe loads `pages/mesh.html`
- browser Back returns to the welcome screen
- console has no errors

## Important File Mode Fix

Direct `file://` usage can make iframe origins opaque. Avoid iframe code directly reading `window.parent.location.search`, because some browsers block it even when files are local. Use `postMessage` for parent communication and fall back quietly to local `window.location.search` when parent location access is blocked.

This is handled in:

```text
js/page-messaging.js
```

## Return To Welcome

The direct-open offline package supports browser Back returning to the welcome screen. This depends on `js/welcome.js` pushing a history entry when entering the presentation and restoring the intro state on `popstate`.

Do not replace this with separate-page navigation if the requirement is "same as original".

## What Not To Use

Do not use:

```powershell
node scripts/build-artidrop-export.cjs --output "release\Mesh-html-offline"
```

for original-behavior packaging.

That script is for a different export model where slides become standalone pages. It is useful for some upload/drop scenarios, but it does not preserve the original deck shell behavior.
