const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const responseHtml = fs.readFileSync(path.join(rootDir, "pages", "response.html"), "utf8");
const responseCss = fs.readFileSync(path.join(rootDir, "css", "pages", "response.css"), "utf8");

test("response page does not render the borrowed two-button stage navigation group", () => {
  assert.doesNotMatch(
    responseHtml,
    /response-stage-controls|scene-toggle-arrow-left|scene-toggle-arrow-right|data-target="3"|data-target="5"/,
    "Expected Rapid Response to remove the temporary two-button navigation group."
  );
});

test("response page css no longer defines the borrowed stage navigation styles", () => {
  assert.doesNotMatch(
    responseCss,
    /\.response-stage-controls\s*\{|\.scene-toggle-arrow-left\s*\{|\.scene-toggle-arrow-right\s*\{/,
    "Expected Rapid Response CSS to remove the borrowed distance-stage control styles."
  );
});
