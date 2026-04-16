const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const productCss = fs.readFileSync(path.join(rootDir, "css", "pages", "product-showcase.css"), "utf8");

test("product showcase removes residual product entrance motion from the stage art", () => {
  assert.doesNotMatch(productCss, /\.product-aura\s*\{[^}]*\banimation\s*:/i);
  assert.doesNotMatch(productCss, /\.product-image-shell\s*\{[^}]*\banimation\s*:/i);
  assert.doesNotMatch(productCss, /\.product-image\s*,\s*\.product-fallback\s*\{[^}]*\btransition\s*:/i);
  assert.doesNotMatch(productCss, /@keyframes\s+auraPulse/i);
  assert.doesNotMatch(productCss, /@keyframes\s+cineFloat/i);
});
