const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const overviewHtml = fs.readFileSync(path.join(rootDir, "pages", "overview.html"), "utf8");
const overviewCss = fs.readFileSync(path.join(rootDir, "css", "pages", "overview.css"), "utf8");

test("rapid response overview card uses a single transparent F asset inside the speed scene", () => {
  assert.match(
    overviewHtml,
    /<img class="boost-letter-image" src="\.\.\/assets\/images\/fast-f-transparent\.png" alt="" aria-hidden="true">/,
    "Expected the Rapid Response overview card to render the extracted F image asset."
  );
  assert.doesNotMatch(
    overviewHtml,
    /<div class="boost-text"/,
    "Expected the previous text-based Fast treatment to be removed."
  );
  assert.match(
    overviewCss,
    /\.boost-letter-image\s*\{/,
    "Expected overview.css to define styling for the extracted F image."
  );
  assert.match(
    overviewCss,
    /width:\s*min\(44%,\s*119px\);/,
    "Expected the F image to be scaled down by another fifty percent from the current size."
  );
  assert.match(
    overviewCss,
    /hue-rotate\(\d+deg\)/,
    "Expected the extracted F image to be recolored toward the cyan presentation palette."
  );
  assert.match(
    overviewCss,
    /drop-shadow\(0 0 12px rgba\(112,\s*240,\s*255,\s*0\.55\)\)/,
    "Expected the F image glow to align with the cyan page accent."
  );
  assert.match(
    overviewCss,
    /animation:\s*boost-image-vibrate\s+0\.08s\s+linear\s+infinite/,
    "Expected the F image to keep a slight vibration for aggressive speed energy."
  );
  assert.match(
    overviewCss,
    /object-fit:\s*contain/,
    "Expected the extracted F asset to scale cleanly inside the card."
  );
  assert.match(
    overviewHtml,
    /<div class="speed-tunnel-container">[\s\S]*?<img class="boost-letter-image"/,
    "Expected the F asset to be integrated directly inside the existing speed scene."
  );
});
