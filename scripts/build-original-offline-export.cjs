#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

const copiedFiles = [
  "index.html",
  "css/style.css",
  "css/welcome.css",
  "css/page-base.css",
  "css/pages/battery.css",
  "css/pages/capacity.css",
  "css/pages/distance.css",
  "css/pages/installation.css",
  "css/pages/mesh.css",
  "css/pages/opening.css",
  "css/pages/overview.css",
  "css/pages/product-showcase.css",
  "css/pages/reliability.css",
  "css/pages/reliability-animations.css",
  "css/pages/response.css",
  "js/app.js",
  "js/cyber-page-background.js",
  "js/fixed-stage.js",
  "js/welcome.js",
  "js/page-messaging.js",
  "js/opening-page.js",
  "js/mesh-page.js",
  "js/mesh-scene-player.js",
  "js/response-page.js",
  "js/distance-page.js",
  "js/capacity-page.js",
  "js/product-showcase.js",
  "js/pages/reliability-animations.js",
  "Mesh System Demonstration/three.min.js",
  "Mesh System Demonstration/OrbitControls.js",
  "Mesh System Demonstration/link-effects.js",
  "Mesh System Demonstration/assets/icons/heat-mult.svg",
  "Mesh System Demonstration/assets/icons/io-module.svg",
  "Mesh System Demonstration/assets/icons/mcp.svg",
  "Mesh System Demonstration/assets/icons/node.svg",
  "Mesh System Demonstration/assets/icons/smoke.svg",
  "Mesh System Demonstration/assets/icons/sounder.svg"
];

const copiedDirs = [
  "assets",
  "pages"
];

function parseArgs(argv) {
  const args = { output: path.join(rootDir, "release", "Mesh-html-offline") };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--output" && argv[index + 1]) {
      args.output = path.resolve(argv[index + 1]);
      index += 1;
    }
  }

  return args;
}

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function copyFile(relativePath, outputDir) {
  const sourcePath = path.join(rootDir, relativePath);
  const targetPath = path.join(outputDir, relativePath);
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function copyDir(relativePath, outputDir) {
  const sourcePath = path.join(rootDir, relativePath);
  const targetPath = path.join(outputDir, relativePath);
  fs.cpSync(sourcePath, targetPath, {
    recursive: true,
    force: true,
    filter(source) {
      return !source.includes(path.sep + "node_modules" + path.sep)
        && !source.includes(path.sep + "test-results" + path.sep)
        && !source.includes(path.sep + "release" + path.sep);
    }
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = args.output;

  fs.rmSync(outputDir, { recursive: true, force: true });
  ensureDir(outputDir);

  copiedDirs.forEach(function (relativePath) {
    copyDir(relativePath, outputDir);
  });

  copiedFiles.forEach(function (relativePath) {
    copyFile(relativePath, outputDir);
  });

  process.stdout.write("Original offline export written to " + outputDir + "\n");
}

main();
