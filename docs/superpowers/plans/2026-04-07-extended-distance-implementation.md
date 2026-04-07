# Extended Distance Cinematic Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Extended Distance page with two manually switched cinematic scenes that clearly communicate `500 m` and `Up to 16 km`.

**Architecture:** Keep the page in the existing two-column feature-page pattern. Render one shared stage that changes via `data-scene` and button state (`aria-pressed`). Drive visual motion mostly with CSS keyframes; use a small JS controller for scene switching, status copy updates, reduced-motion handling, and visibility-safe timers.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, existing project page styles (`page-base.css`) and messaging script (`page-messaging.js`).

---

## File Structure Map

- Modify: `pages/distance.html`
  - Replace placeholder stage with cinematic scene markup, manual switch buttons, and scene-aware status copy nodes.
- Modify: `css/pages/distance.css`
  - Replace placeholder styles with layout, stage visuals, scene transitions, keyframe animations, responsive and reduced-motion rules.
- Create: `js/distance-page.js`
  - Add page controller for manual scene switching, per-scene status text, timer-driven in-scene replay, and accessibility state sync.

### Task 1: Build semantic page structure and switch controls

**Files:**
- Modify: `pages/distance.html`
- Test: `pages/distance.html` (DOM contract check by search)

- [ ] **Step 1: Write the failing DOM contract check**

Run:
```powershell
Select-String -Path pages\distance.html -Pattern 'distance-scene-toggle|distance-stage|data-scene="open"|data-scene="relay"' -SimpleMatch
```
Expected: no match output (controls and scene hooks do not exist yet).

- [ ] **Step 2: Replace placeholder markup with scene markup**

Use this structure in `pages/distance.html` inside `.page-copy` and `.visual-card`:
```html
<div class="distance-keylines" aria-label="Distance highlights">
  <p>Open-area link up to 500 m</p>
  <p>Node-to-node relay up to 16 km</p>
</div>
<div class="distance-scene-toggle" role="group" aria-label="Distance scene switch">
  <button type="button" class="scene-toggle is-active" data-scene-target="open" aria-pressed="true">Open Area 500m</button>
  <button type="button" class="scene-toggle" data-scene-target="relay" aria-pressed="false">Mesh Relay 16km</button>
</div>
<div class="status-panel distance-status-panel">
  <p class="eyebrow">Scene State</p>
  <h3 id="distance-status-title">Open area direct link established</h3>
  <p id="distance-status-copy">Two nodes maintain a stable open-area connection at extended range.</p>
</div>
```

```html
<div class="visual-card distance-stage" data-scene="open" aria-label="Extended distance cinematic stage">
  <span class="distance-stage-mode" id="distance-stage-mode">OPEN AREA</span>
  <div class="distance-cinematic-bg" aria-hidden="true"></div>

  <section class="distance-scene scene-open is-visible" data-scene="open" aria-label="Open area 500 meter scene">
    <div class="scene-ruler">
      <span class="ruler-start">0</span>
      <span class="ruler-track"></span>
      <span class="ruler-end">500m</span>
    </div>
    <div class="scene-link open-link"></div>
    <span class="signal-pulse pulse-open"></span>
    <div class="scene-node node-open-a"><span>Node A</span></div>
    <div class="scene-node node-open-b"><span>Node B</span></div>
    <div class="scene-metric metric-open">500m</div>
  </section>

  <section class="distance-scene scene-relay" data-scene="relay" aria-label="Mesh relay 16 kilometer scene">
    <div class="relay-chain">
      <span class="relay-hop hop-1"></span><span class="relay-hop hop-2"></span><span class="relay-hop hop-3"></span><span class="relay-hop hop-4"></span><span class="relay-hop hop-5"></span>
    </div>
    <div class="scene-link relay-link"></div>
    <span class="signal-pulse pulse-relay"></span>
    <div class="scene-node node-relay-a"><span>Leader</span></div>
    <div class="scene-node node-relay-z"><span>Terminal</span></div>
    <div class="scene-metric metric-relay">Up to 16 km</div>
  </section>
</div>
```

And add script include before `</body>`:
```html
<script src="../js/distance-page.js"></script>
```

- [ ] **Step 3: Re-run DOM contract check to verify pass**

Run:
```powershell
Select-String -Path pages\distance.html -Pattern 'distance-scene-toggle|distance-stage|data-scene="open"|data-scene="relay"' -SimpleMatch
```
Expected: matches returned for all scene hooks.

- [ ] **Step 4: Commit Task 1**

Run:
```bash
git add pages/distance.html
git commit -m "feat(distance): add cinematic stage markup and manual scene controls"
```

### Task 2: Implement cinematic visuals, scene transitions, and responsive behavior

**Files:**
- Modify: `css/pages/distance.css`
- Test: `css/pages/distance.css` (selector presence check)

- [ ] **Step 1: Write the failing style-hook check**

Run:
```powershell
Select-String -Path css\pages\distance.css -Pattern 'distance-stage|scene-open|scene-relay|@keyframes open-pulse-travel|@keyframes relay-pulse-travel' -SimpleMatch
```
Expected: no cinematic selector/keyframe matches in current file.

- [ ] **Step 2: Replace placeholder CSS with cinematic stage styles**

Add full scene styles in `css/pages/distance.css`, including these required blocks:
```css
.page-distance .distance-stage {
  position: relative;
  overflow: hidden;
  min-height: 520px;
  padding: 24px;
  background: linear-gradient(180deg, rgba(5, 16, 29, 0.92), rgba(4, 10, 21, 0.97));
}

.page-distance .distance-scene {
  position: absolute;
  inset: 74px 24px 24px;
  opacity: 0;
  transform: scale(1.02);
  pointer-events: none;
  transition: opacity 220ms ease, transform 380ms ease;
}

.page-distance .distance-scene.is-visible {
  opacity: 1;
  transform: scale(1);
}

.page-distance .pulse-open {
  animation: open-pulse-travel 4.5s linear infinite;
}

.page-distance .pulse-relay {
  animation: relay-pulse-travel 5.5s linear infinite;
}

@keyframes open-pulse-travel {
  0% { left: 15%; opacity: 0; }
  12% { opacity: 1; }
  78% { opacity: 1; }
  100% { left: 85%; opacity: 0; }
}

@keyframes relay-pulse-travel {
  0% { left: 12%; opacity: 0; }
  10% { opacity: 1; }
  82% { opacity: 1; }
  100% { left: 88%; opacity: 0; }
}
```

Also include:
- `.distance-scene-toggle` and `.scene-toggle.is-active` visual states
- `.distance-stage-mode` badge
- `.scene-ruler` growth animation and `500m` metric emphasis
- `.relay-hop` staggered flash animation
- responsive media query for single-column layout and stage height `360-420px`
- `prefers-reduced-motion` rules that disable continuous travel animation

- [ ] **Step 3: Re-run style-hook check to verify pass**

Run:
```powershell
Select-String -Path css\pages\distance.css -Pattern 'distance-stage|scene-open|scene-relay|@keyframes open-pulse-travel|@keyframes relay-pulse-travel' -SimpleMatch
```
Expected: all selectors and keyframes found.

- [ ] **Step 4: Commit Task 2**

Run:
```bash
git add css/pages/distance.css
git commit -m "feat(distance): add cinematic scene styles and motion system"
```

### Task 3: Implement scene controller JS (manual switch + status sync)

**Files:**
- Create: `js/distance-page.js`
- Test: `js/distance-page.js` (syntax check + behavior check in browser)

- [ ] **Step 1: Write failing runtime check (missing script)**

Run in browser console on `pages/distance.html` before adding script:
```js
window.__distancePageReady
```
Expected: `undefined`.

- [ ] **Step 2: Create `js/distance-page.js` controller**

Use this implementation shape:
```javascript
(function () {
  const page = document.querySelector('.page-distance');
  if (!page) return;

  const stage = page.querySelector('.distance-stage');
  const mode = document.getElementById('distance-stage-mode');
  const title = document.getElementById('distance-status-title');
  const copy = document.getElementById('distance-status-copy');
  const toggles = Array.from(page.querySelectorAll('.scene-toggle'));
  const scenes = Array.from(page.querySelectorAll('.distance-scene'));
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');

  const sceneMeta = {
    open: {
      mode: 'OPEN AREA',
      title: 'Open area direct link established',
      copy: 'Two nodes maintain a stable open-area connection at extended range.'
    },
    relay: {
      mode: 'MESH RELAY',
      title: 'Relay chain extends total coverage',
      copy: 'Signal advances hop-by-hop through nodes, reaching up to 16 km.'
    }
  };

  let active = 'open';

  function applyScene(next) {
    if (!sceneMeta[next]) return;
    active = next;
    stage.dataset.scene = next;
    if (mode) mode.textContent = sceneMeta[next].mode;
    if (title) title.textContent = sceneMeta[next].title;
    if (copy) copy.textContent = sceneMeta[next].copy;

    scenes.forEach((scene) => scene.classList.toggle('is-visible', scene.dataset.scene === next));
    toggles.forEach((btn) => {
      const isActive = btn.dataset.sceneTarget === next;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  toggles.forEach((btn) => {
    btn.addEventListener('click', () => applyScene(btn.dataset.sceneTarget));
  });

  function syncMotionPreference() {
    page.classList.toggle('reduce-motion', media.matches);
  }

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', syncMotionPreference);
  } else if (typeof media.addListener === 'function') {
    media.addListener(syncMotionPreference);
  }

  document.addEventListener('visibilitychange', () => {
    page.classList.toggle('is-hidden', document.hidden);
  });

  syncMotionPreference();
  applyScene(active);
  window.__distancePageReady = true;
}());
```

- [ ] **Step 3: Run syntax and smoke checks**

Run:
```powershell
node --check js\distance-page.js
```
Expected: no syntax errors.

Then in browser console on `pages/distance.html`:
```js
window.__distancePageReady
```
Expected: `true`.

- [ ] **Step 4: Commit Task 3**

Run:
```bash
git add js/distance-page.js pages/distance.html
git commit -m "feat(distance): add scene switch controller and dynamic status updates"
```

### Task 4: End-to-end verification and integration sanity

**Files:**
- Verify: `pages/distance.html`, `css/pages/distance.css`, `js/distance-page.js`

- [ ] **Step 1: Run repository status check**

Run:
```bash
git status --short
```
Expected: only intended distance-page files changed for this feature.

- [ ] **Step 2: Launch local preview and verify behavior**

Run:
```powershell
# from repo root
python -m http.server 4173
```
Open `http://localhost:4173/pages/distance.html` and verify:
- Toggle buttons switch scene immediately.
- Scene A shows `500m` direct-link story.
- Scene B shows relay chain and `Up to 16 km` emphasis.
- No console errors.

- [ ] **Step 3: Verify reduced-motion fallback**

In DevTools emulate `prefers-reduced-motion: reduce` and verify:
- Scene meaning remains readable.
- Continuous pulse animations are disabled/minimized.

- [ ] **Step 4: Final commit (if Task 4 introduced code tweaks)**

Run:
```bash
git add pages/distance.html css/pages/distance.css js/distance-page.js
git commit -m "fix(distance): polish responsive motion and accessibility details"
```

If no code changes were needed in Task 4, skip commit.

---

## Self-Review

### 1) Spec coverage
- Manual switch interaction: covered in Task 1 + Task 3.
- Cinematic two-scene visual narrative: covered in Task 2.
- 500m and 16km content emphasis: covered in Task 1 + Task 2 + Task 3 metadata.
- Transition timing and status updates: covered in Task 2 + Task 3.
- Responsive + reduced motion: covered in Task 2 + Task 4.

### 2) Placeholder scan
- No `TBD`, `TODO`, or deferred pseudo-steps.
- Commands and expected outcomes are concrete.

### 3) Type/interface consistency
- Scene keys are consistent as `open` and `relay` across HTML `data-scene`, CSS selectors, and JS `sceneMeta`/toggle targets.
- Status node IDs are consistently referenced in HTML and JS.
