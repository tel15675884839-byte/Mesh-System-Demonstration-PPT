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
