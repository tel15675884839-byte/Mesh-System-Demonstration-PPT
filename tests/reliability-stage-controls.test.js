const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const reliabilityHtml = fs.readFileSync(path.join(rootDir, "pages", "reliability.html"), "utf8");
const reliabilityCss = fs.readFileSync(path.join(rootDir, "css", "pages", "reliability-animations.css"), "utf8");

test("reliability page uses the same double-button stage control structure as distance", () => {
  assert.match(
    reliabilityHtml,
    /<div class="reliability-stage-controls"[^>]*>[\s\S]*?<button type="button" class="scene-toggle is-active"[^>]*data-scene="response"[\s\S]*?<span class="scene-toggle-arrow scene-toggle-arrow-left"[\s\S]*?<button type="button" class="scene-toggle"[^>]*data-scene="path"[\s\S]*?<span class="scene-toggle-arrow scene-toggle-arrow-right"/,
    "Expected High Reliability to use the same scene-toggle markup pattern as Extended Distance."
  );
});

test("reliability stage controls match distance control sizing and placement", () => {
  assert.match(
    reliabilityCss,
    /\.reliability-stage-controls\s*\{[\s\S]*?top:\s*22px;[\s\S]*?right:\s*22px;[\s\S]*?display:\s*flex;[\s\S]*?gap:\s*8px;[\s\S]*?align-items:\s*center;/,
    "Expected High Reliability controls to use the same top-right placement."
  );

  assert.match(
    reliabilityCss,
    /\.scene-toggle\s*\{[\s\S]*?width:\s*34px;[\s\S]*?height:\s*34px;[\s\S]*?border:\s*1px solid rgba\(112,\s*240,\s*255,\s*0\.16\);[\s\S]*?border-radius:\s*12px;/,
    "Expected High Reliability buttons to use the same button sizing and radius as Extended Distance."
  );
});
