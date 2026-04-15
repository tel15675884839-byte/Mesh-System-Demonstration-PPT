const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const overviewHtml = fs.readFileSync(path.join(rootDir, "pages", "overview.html"), "utf8");
const overviewCss = fs.readFileSync(path.join(rootDir, "css", "pages", "overview.css"), "utf8");

test("high reliability overview card uses two fast clockwise signal dots instead of a flowing beam", () => {
  assert.match(overviewHtml, /id="reliability-loop-path-blue"[^>]*pathLength="100"/);
  assert.match(overviewHtml, /id="reliability-loop-path-green"[^>]*pathLength="100"/);
  assert.match(overviewHtml, /class="loop-arrow loop-arrow-green loop-arrow-right"/);
  assert.match(overviewHtml, /class="loop-arrow loop-arrow-blue loop-arrow-left"/);
  assert.match(overviewHtml, /loop-arrow-right" transform="translate\(280 90\) rotate\(90\)"/);
  assert.match(overviewHtml, /loop-arrow-left" transform="translate\(40 90\) rotate\(-90\)"/);
  assert.match(overviewHtml, /class="loop-signal-dot loop-signal-dot-blue"/);
  assert.match(overviewHtml, /class="loop-signal-dot loop-signal-dot-green"/);
  assert.match(overviewHtml, /<circle class="loop-signal-dot loop-signal-dot-blue" r="5">/);
  assert.match(overviewHtml, /<circle class="loop-signal-dot loop-signal-dot-green" r="5">/);
  assert.doesNotMatch(overviewHtml, /class="loop-signal-dot loop-signal-dot-blue"[^>]*cx=/);
  assert.doesNotMatch(overviewHtml, /class="loop-signal-dot loop-signal-dot-blue"[^>]*cy=/);
  assert.doesNotMatch(overviewHtml, /class="loop-signal-dot loop-signal-dot-green"[^>]*cx=/);
  assert.doesNotMatch(overviewHtml, /class="loop-signal-dot loop-signal-dot-green"[^>]*cy=/);
  assert.match(overviewHtml, /<animateMotion[^>]*dur="1\.45s"[^>]*repeatCount="indefinite"/);
  assert.match(overviewHtml, /<mpath href="#reliability-loop-path-blue"/);
  assert.match(overviewHtml, /<mpath href="#reliability-loop-path-green"/);
  assert.doesNotMatch(overviewHtml, /class="loop-signal-beam"/);
  assert.doesNotMatch(overviewHtml, /loop-beam loop-beam-green/);
  assert.doesNotMatch(overviewHtml, /loop-beam loop-beam-blue/);
  assert.doesNotMatch(overviewHtml, /class="flow-icon /);

  assert.match(overviewCss, /\.loop-arrow\s*\{/);
  assert.match(overviewCss, /\.loop-arrow-blue\s*\{/);
  assert.match(overviewCss, /\.loop-signal-dot\s*\{/);
  assert.match(overviewCss, /\.loop-signal-dot-blue\s*\{/);
  assert.match(overviewCss, /\.loop-signal-dot-green\s*\{/);
  assert.match(overviewCss, /filter:\s*drop-shadow\(0 0 10px currentColor\)/);
  assert.doesNotMatch(overviewCss, /\.loop-signal-beam\s*\{/);
  assert.doesNotMatch(overviewCss, /@keyframes\s+loop-signal-flow/);
  assert.doesNotMatch(overviewCss, /@keyframes\s+loop-signal-color-shift/);
});
