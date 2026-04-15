const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const shellCss = fs.readFileSync(path.join(rootDir, "css", "style.css"), "utf8");

test("product showcase background keeps the shared cyber layer available as a fallback", () => {
  const productBackgroundBlock = shellCss.match(
    /\.app-shell\.is-product-background\s+\.stage-cyber-background\s*\{([\s\S]*?)\}/
  );

  assert.ok(productBackgroundBlock, "Expected a dedicated product-background override for the shared cyber layer.");
  assert.doesNotMatch(
    productBackgroundBlock[1],
    /display\s*:\s*none/i,
    "Expected product showcase mode to keep the shared cyber layer mounted instead of turning it off."
  );
  assert.match(
    productBackgroundBlock[1],
    /opacity\s*:/i,
    "Expected product showcase mode to tune the shared cyber layer with opacity instead of hiding it."
  );
});

test("product showcase background reuses the welcome-style hero cycle timing", () => {
  assert.match(
    shellCss,
    /\.app-shell\.is-product-background\s+\.stage-slide\s*\{[\s\S]*animation-name\s*:\s*heroBackdropCycle[\s\S]*animation-duration\s*:\s*24s[\s\S]*animation-timing-function\s*:\s*ease-in-out[\s\S]*animation-iteration-count\s*:\s*infinite/i,
    "Expected product showcase slides to keep the shared hero backdrop cycle without resetting per-slide delays."
  );

  assert.match(
    shellCss,
    /@keyframes\s+heroBackdropCycle\s*\{[\s\S]*10%\s*\{[\s\S]*33%\s*\{[\s\S]*43%\s*\{/i,
    "Expected the shared hero backdrop cycle to preserve the stable welcome-screen fade timings."
  );

  assert.match(
    shellCss,
    /\.stage-slide-2\s*\{[\s\S]*animation-delay\s*:\s*8s/i,
    "Expected the second hero slide to retain its delayed start."
  );

  assert.match(
    shellCss,
    /\.stage-slide-3\s*\{[\s\S]*animation-delay\s*:\s*16s/i,
    "Expected the third hero slide to retain its delayed start."
  );
});
