const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const welcomeHtmlPath = path.join(rootDir, "welcome.html");
const welcomeJsPath = path.join(rootDir, "js", "welcome.js");
const welcomeCssPath = path.join(rootDir, "css", "welcome.css");

test("welcome entry page exposes the intro title and links into the main presentation", () => {
  const html = fs.readFileSync(welcomeHtmlPath, "utf8");
  const script = fs.readFileSync(welcomeJsPath, "utf8");
  const css = fs.readFileSync(welcomeCssPath, "utf8");

  assert.match(html, /Mesh Technology/);
  assert.doesNotMatch(html, /<button/i);
  assert.match(html, /class="welcome-brand"/);
  assert.match(html, /<img[^>]+class="welcome-brand-logo"[^>]+src="assets\/branding\/logo-long\.png"/i);
  assert.match(html, /id="content-layer"/);
  assert.match(html, /<iframe[^>]+src="index\.html"/i);
  assert.match(html, /class="welcome-title style-3"/);
  assert.match(script, /mode-parallax/);
  assert.match(script, /mode-entered/);
  assert.match(script, /pointerdown|click/);
  assert.match(css, /body\.mode-entered\s+#hero-layer/);
  assert.match(css, /\.welcome-brand\s*\{/);
  assert.match(css, /\.welcome-brand-logo\s*\{/);
  assert.match(css, /backdrop-filter:\s*blur/);
  assert.match(css, /mix-blend-mode:\s*color-dodge/);
  assert.match(css, /background-clip:\s*text/);
  assert.match(css, /font-size:\s*clamp\(4\.8rem,\s*11vw,\s*10\.5rem\)/);
  assert.match(css, /League Spartan/);
});
