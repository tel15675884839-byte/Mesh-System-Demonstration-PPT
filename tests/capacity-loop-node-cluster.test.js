const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const capacityHtml = fs.readFileSync(path.join(rootDir, "pages", "capacity.html"), "utf8");
const capacityCss = fs.readFileSync(path.join(rootDir, "css", "pages", "capacity.css"), "utf8");
const editorJsPath = path.join(rootDir, "js", "capacity-editor.js");
const editorJs = fs.existsSync(editorJsPath) ? fs.readFileSync(editorJsPath, "utf8") : "";

test("static System Capacity page represents the node-and-devices cluster as a reusable visual unit", () => {
  assert.match(capacityHtml, /class="capacity-static-object capacity-object-cluster"/);
  assert.match(capacityHtml, /class="capacity-cluster-node"/);
  assert.match(capacityHtml, /class="capacity-cluster-devices"/);
  assert.match(capacityHtml, /\.\.\/assets\/icons\/node\.svg/);
  assert.match(capacityHtml, /\.\.\/assets\/icons\/smoke\.svg/);
  assert.match(capacityHtml, /\.\.\/assets\/icons\/mcp\.svg/);
  assert.match(capacityHtml, /\.\.\/assets\/icons\/sounder\.svg/);

  assert.match(capacityCss, /\.capacity-object-cluster\b/);
  assert.match(capacityCss, /\.capacity-cluster-node\b/);
  assert.match(capacityCss, /\.capacity-cluster-devices\b/);
  assert.match(capacityCss, /\.capacity-cluster-badge\b/);
});

test("Capacity editor can add a node-and-devices cluster and exposes anchor points for alignment", () => {
  assert.match(editorJs, /type:\s*"cluster"/);
  assert.match(editorJs, /renderClusterObject/);
  assert.match(editorJs, /center/);
  assert.match(editorJs, /rightCenter/);
  assert.match(editorJs, /leftCenter/);
  assert.match(editorJs, /stageCenterX/);
  assert.match(editorJs, /stageCenterY/);
});
