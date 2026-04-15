const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const distanceHtml = fs.readFileSync(path.join(rootDir, "pages", "distance.html"), "utf8");
const capacityHtml = fs.readFileSync(path.join(rootDir, "pages", "capacity.html"), "utf8");
const capacityJs = fs.readFileSync(path.join(rootDir, "js", "capacity-page.js"), "utf8");

test("distance page marks decorative device and relay icons as aria-hidden", () => {
  assert.match(distanceHtml, /class="node-icon" src="\.\.\/assets\/icons\/node\.svg" alt="" aria-hidden="true"/);
  assert.match(distanceHtml, /class="node-icon" src="\.\.\/assets\/icons\/smoke\.svg" alt="" aria-hidden="true"/);
  assert.match(distanceHtml, /class="node-icon" src="\.\.\/assets\/icons\/sounder\.svg" alt="" aria-hidden="true"/);
  assert.match(distanceHtml, /class="relay-entry-panel">[\s\S]*?<img src="\.\.\/assets\/icons\/panel\.svg" alt="" aria-hidden="true">/);
  assert.match(distanceHtml, /class="relay-point is-leader"><img src="\.\.\/assets\/icons\/node\.svg" alt="" aria-hidden="true"><\/div>/);
  assert.match(distanceHtml, /class="relay-end-device relay-end-device-smoke">[\s\S]*?<img src="\.\.\/assets\/icons\/smoke\.svg" alt="" aria-hidden="true">/);
});

test("capacity page decorative icons stay hidden from assistive tech in static and generated markup", () => {
  assert.match(capacityHtml, /class="capacity-expansion-panel-icon" src="\.\.\/assets\/icons\/panel\.svg" alt="" aria-hidden="true"/);
  assert.match(capacityHtml, /class="capacity-expansion-card-image" src="\.\.\/assets\/icons\/loop expansion card\.svg" alt="" aria-hidden="true"/);
  assert.match(capacityHtml, /class="cap-icon-node"[\s\S]*?alt=""[\s\S]*?aria-hidden="true"/);
  assert.match(capacityHtml, /class="cloud-icon det-1"[\s\S]*?alt=""[\s\S]*?aria-hidden="true"/);
  assert.match(capacityHtml, /class="cloud-icon snd-1"[\s\S]*?alt=""[\s\S]*?aria-hidden="true"/);
  assert.match(capacityHtml, /class="cloud-icon mcp-1"[\s\S]*?alt=""[\s\S]*?aria-hidden="true"/);
  assert.match(capacityJs, /nodeIcon\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(capacityJs, /deviceIcon\.setAttribute\("aria-hidden", "true"\)/);
});
