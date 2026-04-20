const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const openingHtml = fs.readFileSync(path.join(rootDir, "pages", "opening.html"), "utf8");
const openingCss = fs.readFileSync(path.join(rootDir, "css", "pages", "opening.css"), "utf8");

function readRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = openingCss.match(new RegExp(escapedSelector + "\\s*\\{([\\s\\S]*?)\\}", "m"));
  assert.ok(match, `Expected ${selector} rule to exist.`);
  return match[1];
}

test("opening 2D view uses the updated mesh2D raster with panel baked into the diagram", () => {
  const meshImageIndex = openingHtml.indexOf('class="opening-2d-view"');

  assert.notEqual(meshImageIndex, -1, "Expected the opening page to include the 2D mesh image.");
  assert.match(
    openingHtml,
    /<img class="opening-2d-view" src="\.\.\/assets\/images\/mesh2D\.png" alt="2D Mesh View">/,
    "Expected opening 2D view to use assets/images/mesh2D.png."
  );
  assert.doesNotMatch(openingHtml, /opening-panel/, "Expected the updated mesh2D raster to replace the separate panel overlay.");

  const wrapperRule = readRule(".opening-2d-wrapper");
  const viewRule = readRule(".opening-2d-view");

  assert.match(wrapperRule, /aspect-ratio:\s*3483\s*\/\s*2440/i, "Expected wrapper aspect ratio to match mesh2D.png.");
  assert.match(
    wrapperRule,
    /transform:\s*translateY\(12%\)/i,
    "Expected the whole 2D mesh raster to be shifted down toward the marked baseline."
  );
  assert.doesNotMatch(viewRule, /z-index\s*:/, "Expected the base mesh image to stay below overlay layers.");
});
