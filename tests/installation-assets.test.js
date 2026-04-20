const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("installation page uses the smaller JPG comparison images", () => {
  const installationPath = path.join(__dirname, "..", "pages", "installation.html");
  const wiringJpgPath = path.join(__dirname, "..", "assets", "images", "wiring.jpg");
  const wirelessJpgPath = path.join(__dirname, "..", "assets", "images", "wireless.jpg");
  const html = fs.readFileSync(installationPath, "utf8");

  assert.equal(fs.existsSync(wiringJpgPath), true, "Expected assets/images/wiring.jpg to exist.");
  assert.equal(fs.existsSync(wirelessJpgPath), true, "Expected assets/images/wireless.jpg to exist.");
  assert.doesNotMatch(html, /assets\/images\/wiring\.png/, "Installation page should no longer reference the oversized wiring PNG.");
  assert.doesNotMatch(html, /assets\/images\/wireless\.png/, "Installation page should no longer reference the oversized wireless PNG.");
  assert.match(html, /assets\/images\/wiring\.jpg/, "Installation page should reference the smaller wiring JPG.");
  assert.match(html, /assets\/images\/wireless\.jpg/, "Installation page should reference the smaller wireless JPG.");
});
