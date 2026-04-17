const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const indexHtmlPath = path.join(rootDir, "index.html");
const welcomeHtmlPath = path.join(rootDir, "welcome.html");
const welcomeJsPath = path.join(rootDir, "js", "welcome.js");
const welcomeCssPath = path.join(rootDir, "css", "welcome.css");

test("index entry embeds the welcome intro overlay directly into the presentation shell", () => {
  const html = fs.readFileSync(indexHtmlPath, "utf8");
  const script = fs.readFileSync(welcomeJsPath, "utf8");
  const css = fs.readFileSync(welcomeCssPath, "utf8");

  assert.match(html, /Mesh Technology/);
  assert.match(html, /class="welcome-brand"/);
  assert.match(html, /<img[^>]+class="welcome-brand-logo"[^>]+src="assets\/branding\/logo-long\.png"/i);
  assert.match(html, /id="content-layer"/);
  assert.doesNotMatch(html, /<iframe[^>]+src="index\.html"/i);
  assert.doesNotMatch(html, /id="contentFrame"/);
  assert.match(html, /class="stage-viewport"/);
  assert.match(html, /class="welcome-title style-3 style-3-bubble"/);
  assert.match(script, /getElementById\("content-layer"\)/);
  assert.doesNotMatch(script, /contentFrame/);
  assert.match(script, /mode-parallax/);
  assert.match(script, /mode-entered/);
  assert.match(script, /pointerdown|click/);
  assert.match(css, /body\.mode-entered\s+#hero-layer/);
  assert.match(css, /\.welcome-shell\s*\{/);
  assert.match(css, /\.content-layer\s*\{/);
  assert.match(css, /\.welcome-brand\s*\{/);
  assert.match(css, /\.welcome-brand-logo\s*\{/);
  assert.match(css, /--welcome-bubble-shell:/);
  assert.match(css, /--welcome-title-depth:/);
  assert.match(css, /\.style-3-bubble::before/);
  assert.match(css, /\.style-3-bubble::after/);
  assert.match(css, /-webkit-text-stroke:\s*var\(--welcome-bubble-shell\)/);
  assert.match(css, /transform:\s*translate\(var\(--welcome-title-depth-x\),\s*var\(--welcome-title-depth\)\)/);
  assert.match(css, /mix-blend-mode:\s*color-dodge/);
  assert.match(css, /background-clip:\s*text/);
  assert.match(css, /font-size:\s*clamp\(4\.8rem,\s*11vw,\s*10\.5rem\)/);
  assert.match(css, /League Spartan/);
});

test("legacy standalone welcome entry is removed once the intro lives inside index", () => {
  assert.equal(fs.existsSync(welcomeHtmlPath), false);
});
