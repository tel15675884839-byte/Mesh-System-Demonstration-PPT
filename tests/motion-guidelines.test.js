const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const overviewCss = fs.readFileSync(path.join(rootDir, "css", "pages", "overview.css"), "utf8");
const responseCss = fs.readFileSync(path.join(rootDir, "css", "pages", "response.css"), "utf8");

test("overview page avoids transition-all and provides reduced-motion fallbacks", () => {
  assert.doesNotMatch(overviewCss, /transition:\s*all/i);
  assert.match(overviewCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test("response page avoids transition-all and provides reduced-motion fallbacks", () => {
  assert.doesNotMatch(responseCss, /transition:\s*all/i);
  assert.match(responseCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
