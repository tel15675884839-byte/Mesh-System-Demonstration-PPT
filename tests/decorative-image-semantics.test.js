const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const distanceHtml = fs.readFileSync(path.join(rootDir, "pages", "distance.html"), "utf8");
const capacityHtml = fs.readFileSync(path.join(rootDir, "pages", "capacity.html"), "utf8");
const editorJsPath = path.join(rootDir, "js", "capacity-editor.js");
const editorJs = fs.existsSync(editorJsPath) ? fs.readFileSync(editorJsPath, "utf8") : "";

test("distance page marks decorative device and relay icons as aria-hidden", () => {
  assert.match(distanceHtml, /class="node-icon" src="\.\.\/assets\/icons\/node\.svg" alt="" aria-hidden="true"/);
  assert.match(distanceHtml, /class="node-icon" src="\.\.\/assets\/icons\/smoke\.svg" alt="" aria-hidden="true"/);
  assert.match(distanceHtml, /class="node-icon" src="\.\.\/assets\/icons\/sounder\.svg" alt="" aria-hidden="true"/);
  assert.match(distanceHtml, /class="relay-entry-panel">[\s\S]*?<img src="\.\.\/assets\/icons\/panel\.svg" alt="" aria-hidden="true">/);
  assert.match(distanceHtml, /class="relay-point is-leader"><img src="\.\.\/assets\/icons\/node\.svg" alt="" aria-hidden="true"><\/div>/);
  assert.match(distanceHtml, /class="relay-end-device relay-end-device-smoke">[\s\S]*?<img src="\.\.\/assets\/icons\/smoke\.svg" alt="" aria-hidden="true">/);
});

test("capacity page decorative icons stay hidden from assistive tech in static and generated markup", () => {
  assert.match(capacityHtml, /class="capacity-panel-image" src="\.\.\/assets\/icons\/panel\.svg" alt="" aria-hidden="true"/);
  assert.match(capacityHtml, /class="capacity-loop-card-image" src="\.\.\/assets\/icons\/loop expansion card\.svg" alt="" aria-hidden="true"/);
  assert.match(capacityHtml, /class="capacity-node-image" src="\.\.\/assets\/icons\/node\.svg" alt="" aria-hidden="true"/);
  assert.match(capacityHtml, /class="capacity-device-icon" src="\.\.\/assets\/icons\/smoke\.svg" alt="" aria-hidden="true"/);
  assert.match(capacityHtml, /class="capacity-device-icon" src="\.\.\/assets\/icons\/sounder\.svg" alt="" aria-hidden="true"/);
  assert.match(capacityHtml, /class="capacity-device-icon" src="\.\.\/assets\/icons\/mcp\.svg" alt="" aria-hidden="true"/);
  assert.match(editorJs, /alt="" aria-hidden="true"/);
});
