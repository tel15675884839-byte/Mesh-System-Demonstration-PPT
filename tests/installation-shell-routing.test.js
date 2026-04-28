const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");

test("presentation shell places Cost Comparison as a standalone slide after Easy Installation", () => {
  const easyInstallationLabelCount = (indexHtml.match(/<span class="nav-label">Easy Installation<\/span>/g) || []).length;
  const costComparisonLabelCount = (indexHtml.match(/<span class="nav-label">Cost Comparison<\/span>/g) || []).length;

  assert.equal(easyInstallationLabelCount, 1);
  assert.equal(costComparisonLabelCount, 1);
  assert.doesNotMatch(indexHtml, /<span class="nav-label">EZI<\/span>/);
  assert.doesNotMatch(indexHtml, /pages\/ezi\.html/);
  assert.match(indexHtml, /data-target="7" aria-label="Easy Installation"/);
  assert.match(indexHtml, /data-target="8" aria-label="Cost Comparison"/);
  assert.match(indexHtml, /pages\/installation\.html/);
  assert.match(indexHtml, /pages\/installation-cost\.html/);
  assert.doesNotMatch(appScript, /"ezi"/);
  assert.match(appScript, /"installation-cost"/);
});
