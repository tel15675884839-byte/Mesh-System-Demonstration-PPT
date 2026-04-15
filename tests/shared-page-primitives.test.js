const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const pageBaseCss = fs.readFileSync(path.join(rootDir, "css", "page-base.css"), "utf8");
const overviewHtml = fs.readFileSync(path.join(rootDir, "pages", "overview.html"), "utf8");
const productHtml = fs.readFileSync(path.join(rootDir, "pages", "product-showcase.html"), "utf8");
const distanceHtml = fs.readFileSync(path.join(rootDir, "pages", "distance.html"), "utf8");
const responseHtml = fs.readFileSync(path.join(rootDir, "pages", "response.html"), "utf8");
const overviewCss = fs.readFileSync(path.join(rootDir, "css", "pages", "overview.css"), "utf8");
const productCss = fs.readFileSync(path.join(rootDir, "css", "pages", "product-showcase.css"), "utf8");
const responseCss = fs.readFileSync(path.join(rootDir, "css", "pages", "response.css"), "utf8");

test("page base defines shared stage layout, header, hero, and control button primitives", () => {
  assert.match(pageBaseCss, /\.page-stage-layout\s*\{/);
  assert.match(pageBaseCss, /\.page-stage-header\s*\{/);
  assert.match(pageBaseCss, /\.page-hero-spotlight h2\s*\{/);
  assert.match(pageBaseCss, /\.stage-control-button[\s,\.]*response-reset-button\s*\{/);
  assert.match(pageBaseCss, /\.stage-control-button:hover[\s,\.]*response-reset-button:hover\s*\{/);
  assert.match(pageBaseCss, /\.stage-control-button:focus-visible[\s,\.]*response-reset-button:focus-visible\s*\{/);
});

test("single-stage feature pages adopt the shared layout and hero primitives in markup", () => {
  assert.match(overviewHtml, /class="page-grid overview-layout page-stage-layout"/);
  assert.match(overviewHtml, /class="overview-header page-stage-header"/);
  assert.match(overviewHtml, /class="page-copy overview-hero overview-hero-spotlight page-hero-spotlight"/);

  assert.match(productHtml, /class="page-grid product-layout page-stage-layout"/);
  assert.match(productHtml, /class="product-header page-stage-header"/);
  assert.match(productHtml, /class="page-copy product-hero product-hero-spotlight page-hero-spotlight"/);

  assert.match(distanceHtml, /class="page-grid distance-layout page-stage-layout"/);
  assert.match(distanceHtml, /class="distance-header page-stage-header"/);
  assert.match(distanceHtml, /class="page-copy distance-hero distance-hero-spotlight page-hero-spotlight"/);

  assert.match(responseHtml, /class="page-grid response-layout page-stage-layout"/);
  assert.match(responseHtml, /class="response-header page-stage-header"/);
  assert.match(responseHtml, /class="page-copy response-hero response-hero-spotlight page-hero-spotlight"/);
});

test("stage control buttons use the shared primitive and page css no longer duplicates hover/focus chrome", () => {
  assert.match(distanceHtml, /class="scene-toggle stage-control-button is-active"/);
  assert.match(distanceHtml, /class="scene-toggle stage-control-button"/);
  assert.match(responseHtml, /class="response-reset-button"/);

  assert.doesNotMatch(responseCss, /\.response-reset-button:hover\s*\{/);
  assert.doesNotMatch(responseCss, /\.response-reset-button:focus-visible\s*\{/);
  assert.doesNotMatch(responseCss, /\.response-reset-button:active\s*\{/);
  assert.doesNotMatch(overviewCss, /\.overview-hero-spotlight h2\s*\{/);
  assert.doesNotMatch(productCss, /\.product-hero-spotlight h2\s*\{/);
});
