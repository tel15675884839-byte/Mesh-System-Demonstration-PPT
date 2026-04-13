const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const responseHtml = fs.readFileSync(path.join(rootDir, "pages", "response.html"), "utf8");
const responseCss = fs.readFileSync(path.join(rootDir, "css", "pages", "response.css"), "utf8");
const responseJs = fs.readFileSync(path.join(rootDir, "js", "response-page.js"), "utf8");

test("response page renders a top-right icon reset button", () => {
  assert.match(
    responseHtml,
    /<button type="button" class="response-reset-button"[^>]*aria-label="Reset animation"[\s\S]*?<span class="response-reset-icon" aria-hidden="true"><\/span>[\s\S]*?<\/button>/,
    "Expected Rapid Response to render an icon-only reset button."
  );
});

test("response page styles the reset button as a compact floating icon control", () => {
  assert.match(
    responseCss,
    /\.response-reset-button\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?top:\s*22px;[\s\S]*?right:\s*22px;[\s\S]*?width:\s*34px;[\s\S]*?height:\s*34px;/,
    "Expected Rapid Response to position the reset button at the top-right of the stage."
  );

  assert.match(
    responseCss,
    /\.response-reset-icon\s*\{/,
    "Expected Rapid Response to style a reset icon glyph."
  );
});

test("response page script exposes reset logic and removes the broken nodeCenter reference", () => {
  assert.match(
    responseJs,
    /function resetStageState\(\)/,
    "Expected Rapid Response to have a dedicated reset function."
  );

  assert.match(
    responseJs,
    /resetButton\.addEventListener\("click"/,
    "Expected Rapid Response to wire the reset button."
  );

  assert.doesNotMatch(
    responseJs,
    /nodeCenter/,
    "Expected Rapid Response to remove the stale nodeCenter reset reference."
  );
});
