const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const scriptPath = path.join(rootDir, "scripts", "build-artidrop-export.cjs");
const outputDir = path.join(rootDir, ".codex-tmp", "artidrop-export-test");

function readFile(targetPath) {
  return fs.readFileSync(targetPath, "utf8");
}

test("Artidrop export builder creates a root welcome entry and top-level slide pages without iframes", () => {
  fs.rmSync(outputDir, { recursive: true, force: true });

  const result = spawnSync(process.execPath, [scriptPath, "--output", outputDir], {
    cwd: rootDir,
    encoding: "utf8"
  });

  assert.equal(
    result.status,
    0,
    "Expected Artidrop export builder to exit successfully.\n" +
      "STDOUT:\n" + result.stdout + "\nSTDERR:\n" + result.stderr
  );

  const entryPath = path.join(outputDir, "index.html");
  const slideOpeningPath = path.join(outputDir, "pages", "slide-opening.html");
  const slideInstallationPath = path.join(outputDir, "pages", "slide-installation.html");
  const slideMeshPath = path.join(outputDir, "pages", "slide-mesh.html");

  assert.equal(fs.existsSync(entryPath), true, "Expected a root index.html welcome entry.");
  assert.equal(fs.existsSync(slideOpeningPath), true, "Expected pages/slide-opening.html to exist.");
  assert.equal(fs.existsSync(slideInstallationPath), true, "Expected pages/slide-installation.html to exist.");
  assert.equal(fs.existsSync(slideMeshPath), true, "Expected pages/slide-mesh.html to exist.");

  const entryHtml = readFile(entryPath);
  const openingSlideHtml = readFile(slideOpeningPath);
  const installationSlideHtml = readFile(slideInstallationPath);
  const meshSlideHtml = readFile(slideMeshPath);

  assert.doesNotMatch(entryHtml, /<iframe/i, "Welcome entry should not rely on an iframe.");
  assert.match(entryHtml, /pages\/slide-opening\.html/, "Welcome entry should navigate into the opening slide page.");

  assert.doesNotMatch(openingSlideHtml, /<iframe/i, "Opening slide page should inline page content.");
  assert.match(openingSlideHtml, /Wireless Mesh Fire Alarm System/, "Opening slide page should include opening page content.");
  assert.match(openingSlideHtml, /href="\.\.\/css\/artidrop-shell\.css/, "Opening slide page should load the Artidrop shell overlay styles.");
  assert.match(openingSlideHtml, /src="\.\.\/js\/opening-page\.js/, "Opening slide page should keep the original opening script path context.");
  assert.match(openingSlideHtml, /src="\.\.\/js\/artidrop-shell\.js/, "Opening slide page should load the Artidrop navigation shell.");

  assert.doesNotMatch(installationSlideHtml, /assets\/images\/wireless\.png/, "Artidrop export should avoid the oversized wireless PNG.");
  assert.doesNotMatch(installationSlideHtml, /assets\/images\/wiring\.png/, "Artidrop export should avoid the oversized wiring PNG.");
  assert.match(installationSlideHtml, /assets\/images\/wireless\.jpg/, "Installation slide should use the smaller wireless JPG in export mode.");
  assert.match(installationSlideHtml, /assets\/images\/wiring\.jpg/, "Installation slide should use the smaller wiring JPG in export mode.");

  assert.match(meshSlideHtml, /Mesh Communication/, "Mesh slide page should include mesh content.");
  assert.match(meshSlideHtml, /src="\.\.\/js\/mesh-page\.js/, "Mesh slide page should keep the original mesh script path context.");
});
