const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");

test("presentation shell exposes a single Easy Installation slide and removes the standalone EZI entry", () => {
  const easyInstallationLabelCount = (indexHtml.match(/<span class="nav-label">Easy Installation<\/span>/g) || []).length;

  assert.equal(easyInstallationLabelCount, 1);
  assert.doesNotMatch(indexHtml, /<span class="nav-label">EZI<\/span>/);
  assert.doesNotMatch(indexHtml, /pages\/ezi\.html/);
  assert.match(indexHtml, /pages\/installation\.html/);
  assert.doesNotMatch(appScript, /"ezi"/);
});
