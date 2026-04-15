const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const capacityCss = fs.readFileSync(path.join(rootDir, "css", "pages", "capacity.css"), "utf8");
const capacityJs = fs.readFileSync(path.join(rootDir, "js", "capacity-page.js"), "utf8");

test("each loop row uses a node-cluster shorthand with 32 badge", () => {
  assert.match(capacityJs, /className = "capacity-loop-connector"/);
  assert.match(capacityJs, /className = "capacity-loop-trunk"/);
  assert.match(capacityJs, /className = "capacity-loop-fan"/);
  assert.match(capacityJs, /className = "capacity-node-cluster"/);
  assert.match(capacityJs, /className = "capacity-node-badge"/);
  assert.match(capacityJs, /className = "capacity-node-device-link"/);
  assert.match(capacityJs, /className = "capacity-device-cluster"/);
  assert.match(capacityJs, /className = "capacity-device-badge"/);
  assert.match(capacityJs, /nodeBadge\.textContent = String\(nodesPerExpansionLoop\);/);
  assert.match(capacityJs, /deviceBadge\.textContent = String\(devicesPerNode\);/);
  assert.match(capacityJs, /\.\.\/assets\/icons\/smoke\.svg/);
  assert.match(capacityJs, /\.\.\/assets\/icons\/mcp\.svg/);
  assert.match(capacityJs, /\.\.\/assets\/icons\/sounder\.svg/);

  assert.match(capacityCss, /\.capacity-loop-connector\b/);
  assert.match(capacityCss, /\.capacity-loop-trunk\b/);
  assert.match(capacityCss, /\.capacity-loop-fan\b/);
  assert.match(capacityCss, /\.capacity-node-cluster\b/);
  assert.match(capacityCss, /\.capacity-node-badge\b/);
  assert.match(capacityCss, /\.capacity-node-device-link\b/);
  assert.match(capacityCss, /\.capacity-device-cluster\b/);
  assert.match(capacityCss, /\.capacity-device-badge\b/);
  assert.match(capacityCss, /\.capacity-device-icon\b/);
});
