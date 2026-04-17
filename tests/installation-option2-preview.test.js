const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const previewPath = path.join(rootDir, "installation-option2-preview.html");

test("installation option 2 preview exists as a stacked before-after standalone page", () => {
  assert.equal(
    fs.existsSync(previewPath),
    true,
    "Expected installation-option2-preview.html to exist at the repo root."
  );

  const html = fs.readFileSync(previewPath, "utf8");

  assert.match(html, /<title>Traditional Wiring Preview<\/title>/i);
  assert.match(html, /class="comparison-band comparison-band-before"/i);
  assert.match(html, /class="comparison-band comparison-band-after"/i);
  assert.match(html, /Traditional Wiring/i);
  assert.doesNotMatch(html, /Wiring Headache/i);
  assert.doesNotMatch(html, /No Wiring Headache/i);
  assert.doesNotMatch(html, /class="preview-header"/i);
  assert.doesNotMatch(html, /class="band-chip"/i);
  assert.doesNotMatch(html, /class="band-caption"/i);
  assert.doesNotMatch(html, /class="band-rail"/i);
  assert.match(html, /assets\/images\/Wiring%20Headache\.png/i);
  assert.match(html, /assets\/images\/No%20Wiring%20Headahce\.png/i);
  assert.match(html, /class="band-title" id="comparison-before-title">Traditional Wiring<\/h2>/i);
  assert.match(html, /class="band-title" id="comparison-after-title">Wireless Mesh<\/h2>/i);
  assert.match(html, /class="comparison-versus" aria-hidden="true"/i);
  assert.match(html, /class="comparison-versus-inner">VS<\/span>/i);
});
