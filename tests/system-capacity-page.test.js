const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const overviewHtml = fs.readFileSync(path.join(rootDir, "pages", "overview.html"), "utf8");
const capacityHtml = fs.readFileSync(path.join(rootDir, "pages", "capacity.html"), "utf8");
const capacityCss = fs.readFileSync(path.join(rootDir, "css", "pages", "capacity.css"), "utf8");
const capacityJs = fs.readFileSync(path.join(rootDir, "js", "capacity-page.js"), "utf8");

test("presentation shell adds a System Capcity slide after Extended Distance", () => {
  assert.match(indexHtml, /<span class="nav-label">System Capcity<\/span>[\s\S]*?data-target="8"/);
  assert.match(indexHtml, /<iframe class="slide-frame" src="pages\/capacity\.html" title="System Capcity" loading="lazy"><\/iframe>/);
  assert.match(indexHtml, /10-Year Battery<\/span>[\s\S]*?data-target="6"/);
  assert.match(indexHtml, /Easy Installation<\/span>[\s\S]*?data-target="7"/);
});

test("overview page stays focused on the existing summary content", () => {
  assert.match(overviewHtml, /Six Core Features/);
  assert.doesNotMatch(overviewHtml, /feature-capacity|System Capcity/);
});

test("System Capcity page renders the first Network level stage with click-driven capacity storytelling", () => {
  assert.match(capacityHtml, /<title>System Capcity<\/title>/);
  assert.match(capacityHtml, /<h2>System Capcity<\/h2>/);
  assert.match(capacityHtml, /class="page page-capacity" data-capacity-scene="network-level"/);
  assert.match(capacityHtml, /class="visual-card capacity-stage-shell" id="capacity-stage-shell"/);
  assert.match(capacityHtml, /class="capacity-stage" id="capacity-stage" aria-label="System Capcity stage"/);
  assert.match(capacityHtml, /class="capacity-stage-title">Network Level<\/p>/);
  assert.match(capacityHtml, /class="capacity-stage-status" id="capacity-stage-status">[\s\S]*?<\/p>/);
  assert.match(capacityHtml, /class="capacity-stage-hint" id="capacity-stage-hint">Click to start<\/button>/);
  assert.doesNotMatch(capacityHtml, /capacity-stage-eyebrow|SMALL STAGE/);
  assert.match(capacityHtml, /class="capacity-network" id="capacity-network"><\/div>/);
  assert.match(capacityHtml, /class="capacity-panels" id="capacity-panels"><\/div>/);
  assert.match(capacityHtml, /class="capacity-device-overlay" id="capacity-device-overlay" aria-hidden="true"><\/div>/);
  assert.match(capacityHtml, /class="capacity-aggregation" id="capacity-aggregation"/);
  assert.match(capacityHtml, /class="capacity-total-label">2000 devices<\/p>/);
  assert.match(capacityHtml, /<script src="\.\.\/js\/capacity-page\.js"><\/script>/);

  assert.match(capacityCss, /\.capacity-panel\b/);
  assert.match(capacityCss, /\.capacity-aggregation\.is-visible\b/);
  assert.match(capacityCss, /\.capacity-stage-shell\.is-aggregating\b/);
  assert.match(capacityCss, /\.capacity-network-line\b/);
  assert.match(capacityCss, /\.capacity-network-svg\b/);
  assert.match(capacityCss, /\.capacity-device-particle\b/);
  assert.match(capacityCss, /--panel-scale:\s*1\.7/);
  assert.match(capacityCss, /--panel-base-size:\s*clamp\(70px,\s*5\.3vw,\s*92px\)/);
  assert.match(capacityCss, /--panel-size:\s*calc\(var\(--panel-base-size\)\s*\*\s*var\(--panel-scale\)\)/);

  assert.match(capacityJs, /const panelCount = 8;/);
  assert.match(capacityJs, /const loopsPerPanel = 2;/);
  assert.match(capacityJs, /const devicesPerPanel = 250;/);
  assert.match(capacityJs, /const panelScale = 1\.7;/);
  assert.match(capacityJs, /const arcStartAngle =/);
  assert.match(capacityJs, /const arcEndAngle =/);
  assert.match(capacityJs, /function buildArcPanelPositions\(/);
  assert.match(capacityJs, /const arcLength = Math\.abs\(arcEndAngle - arcStartAngle\) \* arcRadius;/);
  assert.match(capacityJs, /const arcStep = arcLength \/ panelCount;/);
  assert.match(capacityJs, /const travelDistance = arcStep \* \(index \+ 0\.5\);/);
  assert.match(capacityJs, /buildArcPanelPositions\(\)/);
  assert.match(capacityJs, /function runIntroSequence\(/);
  assert.match(capacityJs, /function revealPanelStats\(/);
  assert.match(capacityJs, /function animateAggregation\(/);
  assert.match(capacityJs, /function createArcConnection\(/);
  assert.match(capacityJs, /setAttribute\("d", `M/);
  assert.match(capacityJs, /let countAnimationRunId = 0;/);
  assert.match(capacityJs, /const runId = countAnimationRunId \+ 1;/);
  assert.match(capacityJs, /countAnimationRunId = runId;/);
  assert.match(capacityJs, /const rawProgress = \(now - startTime\) \/ duration;/);
  assert.match(capacityJs, /const progress = Math\.min\(Math\.max\(rawProgress,\s*0\),\s*1\);/);
  assert.match(capacityJs, /const clampedValue = Math\.min\(Math\.max\(roundedValue,\s*0\),\s*targetValue\);/);
  assert.match(capacityJs, /if \(runId !== countAnimationRunId\)\s*\{\s*return;\s*\}/s);
  assert.match(capacityJs, /interactionStep = 1;/);
  assert.match(capacityJs, /capacityTotalValue\.textContent = "0";/);
  assert.match(capacityJs, /animateCountUp\(totalDevices,\s*900\);/);
  assert.match(capacityJs, /if \(interactionStep === 0\)\s*\{\s*runIntroSequence\(\);\s*return;/s);
  assert.match(capacityJs, /if \(interactionStep === 1\)\s*\{\s*revealPanelStats\(\);\s*return;/s);
  assert.match(capacityJs, /if \(interactionStep === 2\)\s*\{\s*animateAggregation\(\);\s*return;/s);
  assert.doesNotMatch(capacityJs, /buildPanels\(\);\s*resetStageVisuals\(\);\s*runIntroSequence\(\);/);
  assert.doesNotMatch(capacityJs, /const panelPositions = \[/);
  assert.match(capacityJs, /capacityStageShell\.addEventListener\("click"/);
});
