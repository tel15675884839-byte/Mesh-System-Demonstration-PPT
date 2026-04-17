const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const capacityHtml = fs.readFileSync(path.join(rootDir, "pages", "capacity.html"), "utf8");
const capacityCss = fs.readFileSync(path.join(rootDir, "css", "pages", "capacity.css"), "utf8");
const capacityJs = fs.readFileSync(path.join(rootDir, "js", "capacity-page.js"), "utf8");

test("presentation shell keeps the System Capacity slide wired into navigation", () => {
  assert.match(indexHtml, /<span class="nav-label">System Capacity<\/span>[\s\S]*?data-target="8"/);
  assert.match(indexHtml, /<iframe class="slide-frame" data-src="pages\/capacity\.html" title="System Capacity" loading="lazy"><\/iframe>/);
});

test("System Capacity expansion scene exposes the updated node and loop headings", () => {
  assert.doesNotMatch(capacityHtml, /capacity-expansion-card-overline/);
  assert.match(capacityHtml, /class="capacity-expansion-card-title">Wireless Loop Card<\/p>/);

  assert.match(capacityCss, /--capacity-card-width:\s*138px;/);
  assert.match(capacityCss, /--capacity-card-shift:\s*-96px;/);
  assert.match(capacityCss, /--capacity-loops-shift:\s*-94px;/);
  assert.match(capacityCss, /content:\s*"UP TO 64 NODES";/);
  assert.match(capacityCss, /font-size:\s*0\.864rem;/);
  assert.match(capacityCss, /transform:\s*translateX\(var\(--capacity-card-shift\)\)\s*scale\(0\.67\);/);
  assert.match(capacityCss, /transform:\s*translateX\(var\(--capacity-card-shift\)\)\s*scale\(0\.7\);/);
  assert.match(capacityCss, /transform:\s*translateX\(var\(--capacity-loops-shift\)\);/);

  assert.match(capacityJs, /const expansionLoopCount = 4;/);
  assert.match(capacityJs, /const nodesPerExpansionLoop = 32;/);
  assert.doesNotMatch(capacityJs, /capacity-expansion-card-overline/);
  assert.match(capacityJs, /Wireless Loop Card/);
  assert.match(capacityJs, /label\.textContent = "LOOP";/);
  assert.match(capacityJs, /nodeUnit\.textContent = `\$\{nodesPerExpansionLoop\} NODES`;/);
});

test("System Capacity network view uses four enlarged panels with 4 loops and 500 devices each", () => {
  assert.match(capacityCss, /--capacity-reference-panel-size:\s*210px;/);
  assert.match(capacityCss, /--panel-scale:\s*1;/);
  assert.match(capacityCss, /--panel-base-size:\s*clamp\(190px,\s*14vw,\s*var\(--capacity-reference-panel-size\)\);/);
  assert.match(capacityCss, /width:\s*min\(100%,\s*var\(--capacity-reference-panel-size\)\);/);

  assert.match(capacityJs, /const panelCount = 4;/);
  assert.match(capacityJs, /const loopsPerPanel = 4;/);
  assert.match(capacityJs, /const devicesPerPanel = 500;/);
  assert.match(capacityJs, /const totalDevices = panelCount \* devicesPerPanel;/);
  assert.match(capacityJs, /"Four enlarged network panels are dropping onto an even arc/);
  assert.match(capacityJs, /"Each panel contributes 4 wireless loops and 500 devices\./);
});

test("System Capacity stage shifts the full infographic slightly up and left", () => {
  assert.match(capacityCss, /--capacity-stage-shift-x:\s*-28px;/);
  assert.match(capacityCss, /--capacity-stage-shift-y:\s*-32px;/);
  assert.match(capacityCss, /transform:\s*translate\(var\(--capacity-stage-shift-x\),\s*var\(--capacity-stage-shift-y\)\);/);
  assert.match(capacityCss, /\.capacity-stage-shell\.is-aggregating\s+\.capacity-stage-surface\s*\{\s*box-shadow:\s*none;\s*\}/s);
});

test("System Capacity stages an independent left-side three-panel cluster before the network view", () => {
  assert.match(capacityHtml, /class="capacity-expansion-left-cluster" id="capacity-expansion-left-cluster"/);
  assert.match(capacityHtml, /class="capacity-expansion-left-cluster-svg" id="capacity-expansion-left-cluster-svg"/);

  assert.match(capacityCss, /\.capacity-expansion-left-cluster\b/);
  assert.match(capacityCss, /\.capacity-linked-panel\b/);
  assert.match(capacityCss, /\.capacity-linked-panel\.is-landed\b/);
  assert.match(capacityCss, /--capacity-linked-panel-scale:\s*1\.18;/);
  assert.match(capacityCss, /--capacity-linked-panel-scale:\s*0\.94;/);

  assert.match(capacityJs, /const leftClusterPanelSpecs = \[/);
  assert.match(capacityJs, /const STEP_EXPANSION_REVEAL_LEFT_CLUSTER = 3;/);
  assert.match(capacityJs, /async function runLeftClusterSequence\(\)/);
  assert.match(capacityJs, /interactionStep = STEP_EXPANSION_REVEAL_LEFT_CLUSTER;/);
  assert.match(capacityJs, /"Click to reveal linked panels"/);
});
