const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const indexHtmlPath = path.join(rootDir, "index.html");
const appJsPath = path.join(rootDir, "js", "app.js");
const fixedStageJsPath = path.join(rootDir, "js", "fixed-stage.js");
const styleCssPath = path.join(rootDir, "css", "style.css");

test("presentation shell is wired to a fixed 1920x1080 stage", () => {
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const appScript = fs.readFileSync(appJsPath, "utf8");
  const fixedStageScript = fs.readFileSync(fixedStageJsPath, "utf8");
  const css = fs.readFileSync(styleCssPath, "utf8");

  assert.match(html, /class="stage-viewport"/);
  assert.match(html, /class="stage-scaler"/);
  assert.match(html, /class="app-shell fixed-stage"/);
  assert.match(html, /<script src="js\/fixed-stage\.js"><\/script>/i);

  assert.match(css, /--stage-width:\s*1920px/);
  assert.match(css, /--stage-height:\s*1080px/);
  assert.match(css, /\.stage-viewport\s*\{/);
  assert.match(css, /\.stage-scaler\s*\{/);
  assert.match(css, /\.fixed-stage\s*\{/);
  assert.match(css, /height:\s*var\(--stage-height\)/);
  assert.match(css, /width:\s*var\(--stage-width\)/);

  assert.match(fixedStageScript, /const STAGE_WIDTH = 1920/);
  assert.match(fixedStageScript, /const STAGE_HEIGHT = 1080/);
  assert.match(fixedStageScript, /Math\.min\(window\.innerWidth \/ STAGE_WIDTH,\s*window\.innerHeight \/ STAGE_HEIGHT\)/);
  assert.match(fixedStageScript, /document\.documentElement\.style\.setProperty\("--stage-scale"/);

  assert.match(appScript, /const STAGE_HEIGHT = 1080/);
  assert.match(appScript, /currentSlide \* STAGE_HEIGHT/);
});
