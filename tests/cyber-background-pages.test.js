const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

const shellTargetPages = [
  "index.html"
];

const iframePages = [
  "opening",
  "overview",
  "mesh",
  "reliability",
  "response",
  "distance",
  "battery",
  "installation",
  "capacity"
];

function readPage(name) {
  return fs.readFileSync(path.join(rootDir, "pages", `${name}.html`), "utf8");
}

test("outer shell mounts a single shared cyber background container", () => {
  const shellHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  const backgroundPattern = /<div[^>]*class="[^"]*\bstage-cyber-background\b[^"]*"[^>]*data-cyber-bg[^>]*>\s*<canvas[^>]*class="[^"]*\bcyber-page-background-canvas\b[^"]*"[^>]*>\s*<\/canvas>\s*<\/div>/i;

  shellTargetPages.forEach((pageName) => {
    assert.match(
      shellHtml,
      backgroundPattern,
      `Expected ${pageName} to mount the shared shell-level cyber background container.`
    );
  });
});

test("outer shell loads the shared cyber background script once", () => {
  const shellHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");

  assert.match(
    shellHtml,
    /<script\s+src="js\/cyber-page-background\.js(?:\?[^"]*)?"><\/script>/i,
    "Expected index.html to reference js/cyber-page-background.js."
  );
});

test("iframe pages keep background ownership in the shell", () => {
  iframePages.concat("product-showcase").forEach((pageName) => {
    const html = readPage(pageName);

    assert.doesNotMatch(
      html,
      /data-cyber-bg/i,
      `Expected pages/${pageName}.html not to mount shell cyber background markup.`
    );

    assert.doesNotMatch(
      html,
      /cyber-page-background\.js/i,
      `Expected pages/${pageName}.html not to load the shared cyber background script directly.`
    );
  });
});
