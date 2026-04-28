const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const installationHtml = fs.readFileSync(path.join(rootDir, "pages", "installation.html"), "utf8");
const installationCostPath = path.join(rootDir, "pages", "installation-cost.html");
const installationCostHtml = fs.existsSync(installationCostPath) ? fs.readFileSync(installationCostPath, "utf8") : "";
const installationCss = fs.readFileSync(path.join(rootDir, "css", "pages", "installation.css"), "utf8");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");

test("Easy Installation returns to a single comparison page without internal cost controls", () => {
  const easyInstallationLabelCount = (indexHtml.match(/<span class="nav-label">Easy Installation<\/span>/g) || []).length;
  const installationFrameCount = (indexHtml.match(/pages\/installation\.html/g) || []).length;

  assert.equal(easyInstallationLabelCount, 1);
  assert.equal(installationFrameCount, 1);
  assert.doesNotMatch(installationHtml, /data-installation-screen/);
  assert.doesNotMatch(installationHtml, /data-installation-panel="cost"/);
  assert.doesNotMatch(installationHtml, /Show fire alarm cost comparison/);
  assert.doesNotMatch(installationHtml, /js\/installation-page\.js/);
  assert.doesNotMatch(installationHtml, /Wired vs Wireless Fire Alarm Cost Comparison/);
  assert.doesNotMatch(installationHtml, /Labor Cost/);
});

test("Cost Comparison is a standalone slide with the standard title treatment", () => {
  assert.equal(fs.existsSync(installationCostPath), true);
  assert.match(indexHtml, /<span class="nav-label">Cost Comparison<\/span>/);
  assert.match(indexHtml, /pages\/installation-cost\.html/);
  assert.match(appScript, /"installation-cost"/);
  assert.match(installationCostHtml, /class="page-copy[^"]*page-hero-spotlight"/);
  assert.match(installationCostHtml, /<h2>Wired vs Wireless Cost<\/h2>/);
  assert.doesNotMatch(installationCostHtml, /Per-point pricing, installation cost, and total life-cycle cost/);
  assert.match(installationCostHtml, /Scenario Total Cost per Point/);
  assert.match(installationCostHtml, /Labor Cost/);
  assert.match(installationCss, /\.installation-shell\[data-installation-screen="cost"\]/);
  assert.match(installationCss, /@keyframes installationHudReveal/);
  assert.match(installationCss, /grid-template-rows:\s*auto auto;/);
  assert.match(installationCss, /align-items:\s*start;/);
});
