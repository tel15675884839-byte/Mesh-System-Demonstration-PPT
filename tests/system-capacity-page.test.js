const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const capacityHtml = fs.readFileSync(path.join(rootDir, "pages", "capacity.html"), "utf8");
const capacityCss = fs.readFileSync(path.join(rootDir, "css", "pages", "capacity.css"), "utf8");
const capacityJs = fs.readFileSync(path.join(rootDir, "js", "capacity-page.js"), "utf8");
const editorHtml = fs.existsSync(path.join(rootDir, "capacity-editor.html"))
  ? fs.readFileSync(path.join(rootDir, "capacity-editor.html"), "utf8")
  : "";
const editorCss = fs.existsSync(path.join(rootDir, "css", "capacity-editor.css"))
  ? fs.readFileSync(path.join(rootDir, "css", "capacity-editor.css"), "utf8")
  : "";
const editorJs = fs.existsSync(path.join(rootDir, "js", "capacity-editor.js"))
  ? fs.readFileSync(path.join(rootDir, "js", "capacity-editor.js"), "utf8")
  : "";

test("presentation shell keeps the System Capacity slide wired into navigation only", () => {
  assert.match(indexHtml, /<span class="nav-label">System Capacity<\/span>[\s\S]*?data-target="8"/);
  assert.match(indexHtml, /<iframe class="slide-frame" data-src="pages\/capacity\.html" title="System Capacity" loading="lazy"><\/iframe>/);
  assert.doesNotMatch(indexHtml, /capacity-editor\.html/);
});

test("System Capacity first page is static generated markup while the second Network page remains", () => {
  assert.match(capacityHtml, /<main class="page page-capacity"/);
  assert.match(capacityHtml, /id="capacity-first-scene"/);
  assert.match(capacityHtml, /data-capacity-static-stage/);
  assert.match(capacityHtml, /class="capacity-static-object capacity-object-panel"/);
  assert.match(capacityHtml, /class="capacity-static-object capacity-object-loop-card"/);
  assert.match(capacityHtml, /class="capacity-static-object capacity-object-node"/);
  assert.match(capacityHtml, /class="capacity-static-object capacity-object-cluster"/);
  assert.match(capacityHtml, /class="capacity-static-line capacity-line-dashed"/);
  assert.match(capacityHtml, /class="capacity-static-text"/);
  assert.match(capacityHtml, /id="capacity-network-scene"/);
  assert.match(capacityHtml, /id="capacity-panels"/);
  assert.match(capacityHtml, /id="capacity-total-value"/);
  assert.match(capacityHtml, /<script src="\.\.\/js\/capacity-page\.js"><\/script>/);
  assert.doesNotMatch(capacityHtml, /capacity-editor/);
});

test("System Capacity CSS supports both generated first page and retained Network page", () => {
  assert.match(capacityCss, /\.capacity-first-scene\b/);
  assert.match(capacityCss, /\.capacity-static-stage\b/);
  assert.match(capacityCss, /\.capacity-static-object\b/);
  assert.match(capacityCss, /\.capacity-object-cluster\b/);
  assert.match(capacityCss, /\.capacity-static-line\b/);
  assert.match(capacityCss, /\.capacity-static-text\b/);
  assert.match(capacityCss, /\.capacity-network-scene\b/);
  assert.match(capacityCss, /\.capacity-panel\b/);
  assert.match(capacityCss, /\.capacity-network-line\b/);
  assert.match(capacityCss, /\.capacity-aggregation\b/);
});

test("System Capacity script advances from the designed first page into the retained Network sequence", () => {
  assert.match(capacityJs, /const STEP_FIRST_PAGE = 0;/);
  assert.match(capacityJs, /const STEP_NETWORK_INTRO = 1;/);
  assert.match(capacityJs, /function showNetworkScene/);
  assert.match(capacityJs, /function runIntroSequence/);
  assert.match(capacityJs, /function revealPanelStats/);
  assert.match(capacityJs, /function animateAggregation/);
  assert.match(capacityJs, /const panelCount = 4;/);
  assert.match(capacityJs, /const loopsPerPanel = 4;/);
  assert.match(capacityJs, /const devicesPerPanel = 500;/);
  assert.match(capacityJs, /capacityFirstScene/);
});

test("local Capacity editor provides add, align, text, dashed-line, and first-page project-save tools", () => {
  assert.match(editorHtml, /<title>System Capacity Editor<\/title>/);
  assert.match(editorHtml, /data-add-tool="panel"/);
  assert.match(editorHtml, /data-add-tool="loop-card"/);
  assert.match(editorHtml, /data-add-tool="node"/);
  assert.match(editorHtml, /data-add-tool="cluster"/);
  assert.match(editorHtml, /data-add-tool="text"/);
  assert.match(editorHtml, /data-add-tool="line"/);
  assert.match(editorHtml, /id="save-to-project"/);
  assert.match(editorHtml, /id="editor-stage"/);
  assert.match(editorCss, /\.editor-stage-center-line/);
  assert.match(editorCss, /\.editor-object-anchor/);
  assert.match(editorCss, /\.editor-line-handle/);
  assert.match(editorJs, /function snapToGuides/);
  assert.match(editorJs, /function getAnchorPoints/);
  assert.match(editorJs, /function generateStaticCapacityHtml/);
  assert.match(editorJs, /function generateStaticCapacityCss/);
  assert.match(editorJs, /capacity-first-scene/);
  assert.match(editorJs, /capacity-network-scene/);
  assert.match(editorJs, /showDirectoryPicker/);
  assert.match(editorJs, /capacity\.html/);
  assert.match(editorJs, /capacity\.css/);
});
