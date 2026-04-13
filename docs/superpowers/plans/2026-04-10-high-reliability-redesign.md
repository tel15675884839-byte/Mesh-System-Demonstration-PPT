# High Reliability Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the High Reliability page as one large card containing stacked one-way and two-way sub-stages with updated topology, resized device layout, and wired vs wireless rendering rules.

**Architecture:** Replace the current scene-toggle stage with two static sub-stage containers inside the same reliability card. Drive both sub-stages from explicit JavaScript config objects so HTML stays simple, CSS controls the split-stage composition, and SVG rendering can distinguish wired single-solid links from wireless dashed links, including double-lane wireless links in the two-way sub-stage.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node `--test`, Playwright, Python `http.server`

---

## File Structure

**Modify**
- `pages/reliability.html`
- `css/pages/reliability.css`
- `css/pages/reliability-animations.css`
- `js/pages/reliability-animations.js`
- `tests/reliability-stage-controls.test.js`

**Create**
- `tests/reliability-stacked-stage.spec.js`

**Keep unchanged but re-run**
- `tests/unified-stage-layout.spec.js`

### Task 1: Replace the outdated source-level contract test

**Files:**
- Modify: `tests/reliability-stage-controls.test.js`
- Test: `tests/reliability-stage-controls.test.js`

- [ ] **Step 1: Write the failing test**

Replace the old control-button assertions with a stacked-stage contract:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const reliabilityHtml = fs.readFileSync(path.join(rootDir, "pages", "reliability.html"), "utf8");
const reliabilityCss = fs.readFileSync(path.join(rootDir, "css", "pages", "reliability.css"), "utf8");
const reliabilityAnimationsCss = fs.readFileSync(path.join(rootDir, "css", "pages", "reliability-animations.css"), "utf8");

test("reliability page removes scene-toggle controls and renders two stacked substages", () => {
  assert.doesNotMatch(
    reliabilityHtml,
    /reliability-stage-controls|btn-scene-response|btn-scene-path|scene-toggle/,
    "Expected High Reliability to remove the old scene-toggle controls."
  );

  assert.match(
    reliabilityHtml,
    /reliability-stage-stack[\s\S]*?reliability-substage-one-way[\s\S]*?ONE-WAY COMMUNICATION[\s\S]*?reli-connection-layer-one-way[\s\S]*?reli-animation-map-one-way[\s\S]*?reliability-substage-two-way[\s\S]*?TWO-WAY COMMUNICATION[\s\S]*?reli-connection-layer-two-way[\s\S]*?reli-animation-map-two-way/,
    "Expected High Reliability to render one-way and two-way substages inside the same stage card."
  );
});

test("reliability split-stage css defines a two-row stage stack and line variants", () => {
  assert.match(
    reliabilityCss,
    /\.reliability-stage-stack\s*\{[\s\S]*?(grid-template-rows:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)|grid-template-rows:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\))/,
    "Expected reliability.css to define a two-row stacked stage."
  );

  assert.match(
    reliabilityCss,
    /\.reliability-substage-label\s*\{/,
    "Expected reliability.css to style the per-stage label."
  );

  assert.match(
    reliabilityAnimationsCss,
    /\.reli-link-wired[\s\S]*?stroke-dasharray:\s*none[\s\S]*?\.reli-link-wireless[\s\S]*?stroke-dasharray:\s*[^;]+;[\s\S]*?\.reli-link-wireless-secondary\s*\{/,
    "Expected reliability animation styles to distinguish wired links, primary wireless links, and secondary wireless lanes."
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/reliability-stage-controls.test.js
```

Expected: FAIL because the current page still contains `reliability-stage-controls`, old buttons, and no split-stage markup.

- [ ] **Step 3: Write minimal implementation**

Do not implement the full page yet. Make only the smallest markup/class changes needed so the test target is clear during the next task. The end state should move toward this structure:

```html
<div class="reliability-stage-stack">
  <section class="reliability-substage reliability-substage-one-way" aria-labelledby="reliability-label-one-way">
    <span class="reliability-substage-label" id="reliability-label-one-way">ONE-WAY COMMUNICATION</span>
    <div class="reliability-visual-map reliability-visual-map-one-way">
      <svg class="reli-connection-svg" id="reli-connection-layer-one-way"></svg>
      <div class="reli-animation-map" id="reli-animation-map-one-way"></div>
    </div>
  </section>

  <section class="reliability-substage reliability-substage-two-way" aria-labelledby="reliability-label-two-way">
    <span class="reliability-substage-label" id="reliability-label-two-way">TWO-WAY COMMUNICATION</span>
    <div class="reliability-visual-map reliability-visual-map-two-way">
      <svg class="reli-connection-svg" id="reli-connection-layer-two-way"></svg>
      <div class="reli-animation-map" id="reli-animation-map-two-way"></div>
    </div>
  </section>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node --test tests/reliability-stage-controls.test.js
```

Expected: PASS for both source-level assertions.

- [ ] **Step 5: Commit**

```bash
git add tests/reliability-stage-controls.test.js pages/reliability.html css/pages/reliability.css css/pages/reliability-animations.css
git commit -m "test: lock stacked reliability stage contract"
```

### Task 2: Build the stacked reliability stage layout in HTML and CSS

**Files:**
- Modify: `pages/reliability.html`
- Modify: `css/pages/reliability.css`
- Modify: `css/pages/reliability-animations.css`
- Test: `tests/reliability-stage-controls.test.js`

- [ ] **Step 1: Write the failing test**

Add a layout-focused Playwright test file to lock the split-card composition:

```js
const { test, expect } = require("@playwright/test");

test("reliability page renders two stacked substages in one visual card", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/reliability.html", {
    waitUntil: "networkidle"
  });

  const card = page.locator(".reliability-stage-shell");
  const substages = page.locator(".reliability-substage");
  const oneWayLabel = page.getByText("ONE-WAY COMMUNICATION");
  const twoWayLabel = page.getByText("TWO-WAY COMMUNICATION");

  await expect(card).toBeVisible();
  await expect(substages).toHaveCount(2);
  await expect(oneWayLabel).toBeVisible();
  await expect(twoWayLabel).toBeVisible();

  const topStage = substages.nth(0);
  const bottomStage = substages.nth(1);
  const topBox = await topStage.boundingBox();
  const bottomBox = await bottomStage.boundingBox();

  expect(topBox).not.toBeNull();
  expect(bottomBox).not.toBeNull();
  expect(bottomBox.y).toBeGreaterThan(topBox.y + topBox.height - 4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Start the local server in a separate shell:

```bash
py -m http.server 8765
```

Then run:

```bash
npx playwright test tests/reliability-stacked-stage.spec.js
```

Expected: FAIL because the current page does not yet render two visible stacked substages with the final card layout.

- [ ] **Step 3: Write minimal implementation**

Update `pages/reliability.html` so the stage card contains only the split-stage structure:

```html
<div class="visual-card reliability-stage-shell">
  <div class="reliability-stage" aria-label="High reliability comparison stage">
    <div class="reliability-stage-stack">
      <section class="reliability-substage reliability-substage-one-way" aria-labelledby="reliability-label-one-way">
        <span class="reliability-substage-label" id="reliability-label-one-way">ONE-WAY COMMUNICATION</span>
        <div class="reliability-visual-map reliability-visual-map-one-way">
          <svg class="reli-connection-svg" id="reli-connection-layer-one-way"></svg>
          <div class="reli-animation-map" id="reli-animation-map-one-way"></div>
        </div>
      </section>

      <section class="reliability-substage reliability-substage-two-way" aria-labelledby="reliability-label-two-way">
        <span class="reliability-substage-label" id="reliability-label-two-way">TWO-WAY COMMUNICATION</span>
        <div class="reliability-visual-map reliability-visual-map-two-way">
          <svg class="reli-connection-svg" id="reli-connection-layer-two-way"></svg>
          <div class="reli-animation-map" id="reli-animation-map-two-way"></div>
        </div>
      </section>
    </div>
  </div>
</div>
```

Implement the base stack in `css/pages/reliability.css`:

```css
.reliability-stage {
  position: relative;
  height: 100%;
  min-height: 0;
  border-radius: 26px;
  overflow: hidden;
  isolation: isolate;
}

.reliability-stage-stack {
  position: relative;
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  height: 100%;
}

.reliability-substage {
  position: relative;
  min-height: 0;
  padding: clamp(18px, 2vw, 24px);
}

.reliability-substage + .reliability-substage::before {
  content: "";
  position: absolute;
  top: 0;
  left: 22px;
  right: 22px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(112, 240, 255, 0.24), transparent);
}

.reliability-substage-label {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 6;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(7, 16, 29, 0.76);
  color: rgba(230, 241, 255, 0.92);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}
```

Update `css/pages/reliability-animations.css` so the map containers fill each sub-stage:

```css
.reliability-visual-map,
.reli-animation-map,
.reli-connection-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
node --test tests/reliability-stage-controls.test.js
npx playwright test tests/reliability-stacked-stage.spec.js
```

Expected:
- Node test PASS
- Playwright test PASS, with both substages visible and stacked

- [ ] **Step 5: Commit**

```bash
git add pages/reliability.html css/pages/reliability.css css/pages/reliability-animations.css tests/reliability-stage-controls.test.js tests/reliability-stacked-stage.spec.js
git commit -m "feat: split reliability page into stacked substages"
```

### Task 3: Rebuild reliability stage rendering around explicit one-way and two-way configs

**Files:**
- Modify: `js/pages/reliability-animations.js`
- Modify: `css/pages/reliability-animations.css`
- Test: `tests/reliability-stacked-stage.spec.js`

- [ ] **Step 1: Write the failing test**

Extend the Playwright file with topology and line-style assertions:

```js
test("reliability page renders wired and wireless semantics correctly", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/reliability.html", {
    waitUntil: "networkidle"
  });

  const oneWayDevices = page.locator("#reli-animation-map-one-way .reliability-device");
  const twoWayDevices = page.locator("#reli-animation-map-two-way .reliability-device");
  const wiredLinks = page.locator("#reli-connection-layer-two-way .reli-link-wired");
  const wirelessLinks = page.locator("#reli-connection-layer-two-way .reli-link-wireless");
  const secondaryWireless = page.locator("#reli-connection-layer-two-way .reli-link-wireless-secondary");

  await expect(oneWayDevices).toHaveCount(5);
  await expect(twoWayDevices).toHaveCount(5);
  await expect(wiredLinks).toHaveCount(1);
  await expect(wirelessLinks).toHaveCount(4);
  await expect(secondaryWireless).toHaveCount(4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx playwright test tests/reliability-stacked-stage.spec.js --grep "wired and wireless semantics"
```

Expected: FAIL because the JavaScript still renders only one old scene and does not emit per-stage wired/double-wireless classes.

- [ ] **Step 3: Write minimal implementation**

Replace the single-scene logic in `js/pages/reliability-animations.js` with explicit per-stage config objects:

```js
const STAGE_CONFIGS = {
  oneWay: {
    mapId: "reli-animation-map-one-way",
    layerId: "reli-connection-layer-one-way",
    alarmPanel: "oneway-panel",
    devices: [
      { id: "oneway-det", type: "det", left: "16%", top: "28%", scale: 0.94 },
      { id: "oneway-sounder", type: "sounder", left: "17%", top: "74%", scale: 0.94 },
      { id: "oneway-node", type: "node", left: "39%", top: "53%", scale: 1.06 },
      { id: "oneway-leader", type: "leader-node", left: "63%", top: "53%", scale: 1.16 },
      { id: "oneway-panel", type: "panel", left: "86%", top: "50%", scale: 0.68 }
    ],
    links: [
      { from: "oneway-det", to: "oneway-node", kind: "wireless-single" },
      { from: "oneway-sounder", to: "oneway-node", kind: "wireless-single" },
      { from: "oneway-node", to: "oneway-leader", kind: "wireless-single" },
      { from: "oneway-leader", to: "oneway-panel", kind: "wireless-single" }
    ]
  },
  twoWay: {
    mapId: "reli-animation-map-two-way",
    layerId: "reli-connection-layer-two-way",
    alarmPanel: "twoway-panel",
    devices: [
      { id: "twoway-det-top", type: "det", left: "16%", top: "26%", scale: 0.9 },
      { id: "twoway-node", type: "node", left: "34%", top: "50%", scale: 1.02 },
      { id: "twoway-det-bottom", type: "det", left: "23%", top: "76%", scale: 0.92 },
      { id: "twoway-leader", type: "leader-node", left: "74%", top: "60%", scale: 1.12 },
      { id: "twoway-panel", type: "panel", left: "85%", top: "24%", scale: 0.62 }
    ],
    links: [
      { from: "twoway-det-top", to: "twoway-node", kind: "wireless-double", breakable: true },
      { from: "twoway-node", to: "twoway-leader", kind: "wireless-double", breakable: true },
      { from: "twoway-det-bottom", to: "twoway-leader", kind: "wireless-double", breakable: true },
      { from: "twoway-leader", to: "twoway-panel", kind: "wired", breakable: false }
    ]
  }
};
```

Implement stage-scoped rendering helpers:

```js
function renderStage(stageKey, stageConfig) {
  const map = document.getElementById(stageConfig.mapId);
  const layer = document.getElementById(stageConfig.layerId);
  map.innerHTML = "";
  layer.innerHTML = "";

  const deviceIndex = new Map();
  stageConfig.devices.forEach((device) => {
    const el = createDeviceElement(device);
    map.appendChild(el);
    deviceIndex.set(device.id, { ...device, element: el });
  });

  stageConfig.links.forEach((link) => {
    drawConfiguredLink({
      stageKey,
      map,
      layer,
      from: deviceIndex.get(link.from),
      to: deviceIndex.get(link.to),
      link
    });
  });
}
```

Implement line classes and particle gating:

```js
function getLinkClasses(link, lane = "primary") {
  if (link.kind === "wired") return "reli-link reli-link-wired";
  if (link.kind === "wireless-double" && lane === "secondary") {
    return "reli-link reli-link-wireless reli-link-wireless-secondary";
  }
  return "reli-link reli-link-wireless";
}

function shouldAnimateParticles(link) {
  return link.kind !== "wired";
}
```

Update `css/pages/reliability-animations.css`:

```css
.reli-link {
  fill: none;
  stroke-width: 2;
  pointer-events: none;
}

.reli-link-wired {
  stroke: rgba(214, 227, 244, 0.82);
  stroke-dasharray: none;
}

.reli-link-wireless {
  stroke: rgba(0, 229, 255, 0.62);
  stroke-dasharray: 4 5;
  filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.28));
}

.reli-link-wireless-secondary {
  stroke-opacity: 0.8;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npx playwright test tests/reliability-stacked-stage.spec.js
```

Expected:
- PASS for stacked layout
- PASS for `5` devices in each sub-stage
- PASS for one solid wired link in the two-way sub-stage
- PASS for four primary wireless links and four secondary wireless lanes in the two-way sub-stage

- [ ] **Step 5: Commit**

```bash
git add js/pages/reliability-animations.js css/pages/reliability-animations.css tests/reliability-stacked-stage.spec.js
git commit -m "feat: render dual-stage reliability topology"
```

### Task 4: Finish particles, alarm behavior, and full-page verification

**Files:**
- Modify: `js/pages/reliability-animations.js`
- Modify: `css/pages/reliability-animations.css`
- Test: `tests/reliability-stacked-stage.spec.js`
- Test: `tests/unified-stage-layout.spec.js`

- [ ] **Step 1: Write the failing test**

Add one more browser assertion that wired links stay static while wireless links animate:

```js
test("reliability page keeps particles off wired links", async ({ page }) => {
  await page.goto("http://127.0.0.1:8765/pages/reliability.html", {
    waitUntil: "networkidle"
  });

  await page.waitForTimeout(900);

  const oneWayParticles = page.locator("#reli-animation-map-one-way .reli-particle");
  const twoWayParticles = page.locator("#reli-animation-map-two-way .reli-particle");
  const panelAlarm = page.locator("#twoway-panel");

  await expect(oneWayParticles.count()).resolves.toBeGreaterThan(0);
  await expect(twoWayParticles.count()).resolves.toBeGreaterThan(0);
  await expect(panelAlarm).not.toHaveClass(/is-alarming/);
});
```

Then add a source-level guard that the script no longer queries the removed buttons:

```js
const reliabilityScript = fs.readFileSync(path.join(rootDir, "js", "pages", "reliability-animations.js"), "utf8");

test("reliability script no longer references removed scene-toggle buttons", () => {
  assert.doesNotMatch(
    reliabilityScript,
    /btn-scene-response|btn-scene-path|currentScene|loadScene\(/,
    "Expected the reliability script to stop using scene-toggle state."
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --test tests/reliability-stage-controls.test.js
npx playwright test tests/reliability-stacked-stage.spec.js --grep "particles off wired links"
```

Expected: FAIL because the current script still references old scene-toggle state and does not yet scope particle spawning by link kind and stage.

- [ ] **Step 3: Write minimal implementation**

Finish the script with stage-local particle spawning and two-way alarm state:

```js
const stageState = {
  twoWayBrokenLinks: new Set()
};

function spawnParticlesForStage(stageKey, stageConfig, deviceIndex) {
  stageConfig.links.forEach((link) => {
    if (!shouldAnimateParticles(link)) return;
    const from = deviceIndex.get(link.from);
    const to = deviceIndex.get(link.to);
    spawnParticleBetween(stageConfig.mapId, from.element, to.element, `${stageKey}:${link.from}:${link.to}`);
  });
}

function updateTwoWayPanelAlarm(deviceIndex) {
  const panel = deviceIndex.get("twoway-panel");
  if (!panel) return;
  panel.element.classList.toggle("is-alarming", stageState.twoWayBrokenLinks.size > 0);
}
```

Constrain interactive hit areas so only breakable two-way wireless links can toggle:

```js
if (link.breakable) {
  hitbox.classList.add("reli-connection-hitbox");
  hitbox.addEventListener("click", () => toggleTwoWayLink(link));
}
```

And keep the wired panel link visually static:

```css
.reli-link-wired {
  stroke: rgba(214, 227, 244, 0.82);
  stroke-dasharray: none;
  filter: none;
}

.reli-particle {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
}
```

- [ ] **Step 4: Run full verification**

Run:

```bash
node --test tests/reliability-stage-controls.test.js
npx playwright test tests/reliability-stacked-stage.spec.js
npx playwright test tests/unified-stage-layout.spec.js --grep "reliability.html"
```

Expected:
- Source contract tests PASS
- Reliability stacked-stage browser tests PASS
- Unified title-over-stage test still PASS for `reliability.html`

- [ ] **Step 5: Commit**

```bash
git add js/pages/reliability-animations.js css/pages/reliability-animations.css tests/reliability-stage-controls.test.js tests/reliability-stacked-stage.spec.js
git commit -m "feat: finalize reliability line semantics and verification"
```

## Self-Review

### Spec coverage

- Split one-card layout: covered in Task 1 and Task 2.
- Top one-way sub-stage with resized composition: covered in Task 3 config and Task 2 layout CSS.
- Bottom two-way sub-stage topology: covered in Task 3 config.
- Only one wired leader-to-panel segment in the bottom stage: covered in Task 3 and Task 4 tests.
- All other bottom-stage links rendered as double wireless lines: covered in Task 3 tests and CSS classes.
- No particles on wired links: covered in Task 4.
- Removal of old scene-toggle interaction: covered in Task 1 and Task 4.

### Placeholder scan

- No `TODO`, `TBD`, or deferred “implement later” wording remains.
- Each task includes explicit file paths, commands, and code snippets.

### Type consistency

- Shared names are consistent across tasks:
  - `reliability-stage-stack`
  - `reliability-substage-one-way`
  - `reliability-substage-two-way`
  - `reli-animation-map-one-way`
  - `reli-animation-map-two-way`
  - `reli-connection-layer-one-way`
  - `reli-connection-layer-two-way`
  - `reli-link-wired`
  - `reli-link-wireless`
  - `reli-link-wireless-secondary`

