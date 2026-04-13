const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const styleCss = fs.readFileSync(path.join(rootDir, "css", "style.css"), "utf8");
const pageBaseCss = fs.readFileSync(path.join(rootDir, "css", "page-base.css"), "utf8");
const pagesDir = path.join(rootDir, "pages");
const pageFiles = fs.readdirSync(pagesDir).filter((fileName) => fileName.endsWith(".html"));
const layoutRulesPath = path.join(rootDir, "docs", "presentation-ui-layout-rules.md");

test("outer presentation shell uses the simplified single-line brand and no frame meta", () => {
  assert.doesNotMatch(indexHtml, /Presentation Framework/i);
  assert.doesNotMatch(indexHtml, /frame-meta|frame-index|Independent Page File/i);
  assert.match(indexHtml, /Wireless Mesh Fire Alarm System/);

  assert.doesNotMatch(styleCss, /\.frame-meta\b/);
  assert.doesNotMatch(styleCss, /\.frame-index\b/);
});

test("shared page layout removes page-copy eyebrow labels and lifts the content stage", () => {
  for (const fileName of pageFiles) {
    const html = fs.readFileSync(path.join(pagesDir, fileName), "utf8");
    assert.doesNotMatch(
      html,
      /<div class="page-copy[^"]*"[^>]*>\s*<p class="eyebrow">/i,
      `Expected ${fileName} to remove the eyebrow label inside the page header copy.`
    );
  }

  assert.match(pageBaseCss, /\.page-copy\s*>\s*\.eyebrow\s*\{[\s\S]*?display:\s*none/i);
  assert.match(pageBaseCss, /\.page\s*\{[\s\S]*?justify-content:\s*flex-start/i);
  assert.match(pageBaseCss, /\.page-grid\s*\{[\s\S]*?align-items:\s*stretch/i);
});

test("layout rules are documented for future slide additions", () => {
  const doc = fs.readFileSync(layoutRulesPath, "utf8");

  assert.match(doc, /Wireless Mesh Fire Alarm System/);
  assert.match(doc, /Do not add page eyebrow labels/i);
  assert.match(doc, /Do not restore frame meta/i);
  assert.match(doc, /Keep the title block compact and high/i);
});
