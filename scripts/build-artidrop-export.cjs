#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

const slides = [
  { slug: "opening", label: "Opening", source: "pages/opening.html" },
  { slug: "overview", label: "Feature Overview", source: "pages/overview.html" },
  { slug: "mesh", label: "Mesh Communication", source: "pages/mesh.html" },
  { slug: "reliability", label: "High Reliability", source: "pages/reliability.html" },
  { slug: "response", label: "Rapid Response", source: "pages/response.html" },
  { slug: "distance", label: "Extended Distance", source: "pages/distance.html" },
  { slug: "battery", label: "10-Year Battery", source: "pages/battery.html" },
  { slug: "installation", label: "Easy Installation", source: "pages/installation.html" },
  { slug: "capacity", label: "System Capacity", source: "pages/capacity.html" },
  { slug: "product-showcase", label: "Product Showcase", source: "pages/product-showcase.html" }
];

const copiedFiles = [
  "css/welcome.css",
  "css/page-base.css",
  "css/style.css",
  "css/artidrop-shell.css",
  "css/pages/opening.css",
  "css/pages/overview.css",
  "css/pages/mesh.css",
  "css/pages/reliability.css",
  "css/pages/reliability-animations.css",
  "css/pages/response.css",
  "css/pages/distance.css",
  "css/pages/battery.css",
  "css/pages/installation.css",
  "css/pages/capacity.css",
  "css/pages/product-showcase.css",
  "js/page-messaging.js",
  "js/cyber-page-background.js",
  "js/opening-page.js",
  "js/mesh-page.js",
  "js/mesh-scene-player.js",
  "js/response-page.js",
  "js/distance-page.js",
  "js/capacity-page.js",
  "js/product-showcase.js",
  "js/artidrop-shell.js",
  "js/artidrop-welcome.js",
  "js/pages/reliability-animations.js",
  "assets/branding/icon.png",
  "assets/branding/logo-long.png",
  "assets/distance-map-bg.png",
  "assets/icons/cie.svg",
  "assets/icons/heat-mult.svg",
  "assets/icons/io-module.svg",
  "assets/icons/leader-node.svg",
  "assets/icons/loop expansion card.svg",
  "assets/icons/mcp.svg",
  "assets/icons/node.svg",
  "assets/icons/panel.svg",
  "assets/icons/smoke.svg",
  "assets/icons/sounder.svg",
  "assets/images/fast-f-transparent.png",
  "assets/images/hero-1.JPG",
  "assets/images/hero-2.JPG",
  "assets/images/hero-3.JPG",
  "assets/images/mesh2D.png",
  "assets/images/System Capacity.png",
  "assets/images/wireless.jpg",
  "assets/images/wiring.jpg",
  "assets/images/products/17450.png",
  "assets/images/products/17450mcp.png",
  "assets/images/products/all.png",
  "assets/images/products/io module.png",
  "assets/images/products/mcp.png",
  "assets/images/products/node.png",
  "assets/images/products/smoke.png",
  "assets/images/products/wireless loop expansion card.png",
  "assets/images/products/wireless-av-alarm.png",
  "assets/mesh-states/blocked.json",
  "assets/mesh-states/normal.json",
  "assets/mesh-states/opening.json",
  "assets/mesh-states/recovery-1.json",
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

function parseArgs(argv) {
  const args = { output: path.join(rootDir, ".codex-tmp", "artidrop-export") };

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

function writeFile(targetPath, content) {
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, content, "utf8");
}

function copyFile(relativePath, outputDir) {
  const sourcePath = path.join(rootDir, relativePath);
  const targetPath = path.join(outputDir, relativePath);
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function buildWelcomeHtml() {
  const indexPath = path.join(rootDir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  html = html.replace(
    /<html([^>]*)>/i,
    "<html$1 data-enter-href=\"pages/slide-opening.html\">"
  );
  html = html.replace(
    /<!-- intro-content-start -->[\s\S]*?<!-- intro-content-end -->/i,
    [
      "<!-- intro-content-start -->",
      "      <div class=\"content-frame content-frame-placeholder\" aria-hidden=\"true\">",
      "        <div class=\"stage-cyber-background\" data-cyber-bg data-cyber-bg-force-active aria-hidden=\"true\">",
      "          <canvas class=\"cyber-page-background-canvas\"></canvas>",
      "        </div>",
      "      </div>",
      "      <!-- intro-content-end -->"
    ].join("\n")
  );
  html = html.replace(/\s*<script src=\"js\/fixed-stage\.js\"><\/script>/i, "");
  html = html.replace(/\s*<script src=\"js\/app\.js[^\"]*\"><\/script>/i, "");
  html = html.replace(
    /<script src=\"js\/welcome\.js\"><\/script>/i,
    "<script src=\"js/artidrop-welcome.js\"></script>"
  );

  return html;
}

function buildOverlay(index) {
  const progressWidth = (((index + 1) / slides.length) * 100).toFixed(3);
  const navItems = slides.map(function (slide, slideIndex) {
    const activeClass = slideIndex === index ? " is-active" : "";
    return [
      "      <div class=\"artidrop-shell-nav-item\">",
      "        <span class=\"artidrop-shell-nav-label\">" + slide.label + "</span>",
      "        <button",
      "          type=\"button\"",
      "          class=\"artidrop-shell-nav-dot" + activeClass + "\"",
      "          data-slide-index=\"" + slideIndex + "\"",
      "          aria-label=\"" + slide.label + "\"",
      "          aria-current=\"" + (slideIndex === index ? "true" : "false") + "\"",
      "        ></button>",
      "      </div>"
    ].join("\n");
  }).join("\n");

  return [
    "  <div class=\"artidrop-shell\" aria-hidden=\"false\">",
    "    <div class=\"artidrop-shell-bar\">",
    "      <div class=\"artidrop-shell-brand\" aria-label=\"Wireless Mesh Fire Alarm System\">",
    "        <img class=\"artidrop-shell-brand-icon\" src=\"../assets/branding/icon.png\" alt=\"\">",
    "        <span class=\"artidrop-shell-brand-text\">Wireless Mesh Fire Alarm System</span>",
    "      </div>",
    "      <div class=\"artidrop-shell-progress\" aria-hidden=\"true\">",
    "        <div class=\"artidrop-shell-progress-bar\">",
    "          <span class=\"artidrop-shell-progress-indicator\" style=\"width: " + progressWidth + "%\"></span>",
    "        </div>",
    "      </div>",
    "    </div>",
    "    <nav class=\"artidrop-shell-nav\" aria-label=\"Slide navigation\">",
    navItems,
    "    </nav>",
    "  </div>"
  ].join("\n");
}

function buildManifest() {
  return JSON.stringify(slides.map(function (slide) {
    return {
      slug: slide.slug,
      label: slide.label,
      href: "slide-" + slide.slug + ".html"
    };
  })).replace(/</g, "\\u003c");
}

function buildSlideHtml(index) {
  const slide = slides[index];
  const sourcePath = path.join(rootDir, slide.source);
  let html = fs.readFileSync(sourcePath, "utf8");

  html = html.replace(
    /<html([^>]*)>/i,
    "<html$1 data-slide-index=\"" + index + "\" data-slide-slug=\"" + slide.slug + "\" data-slide-count=\"" + slides.length + "\">"
  );
  html = html.replace(
    /<\/head>/i,
    "  <link rel=\"stylesheet\" href=\"../css/artidrop-shell.css\">\n</head>"
  );
  html = html.replace(
    /<body([^>]*)>/i,
    [
      "<body$1>",
      "  <div class=\"artidrop-page-cyber-background\" data-cyber-bg data-cyber-bg-force-active aria-hidden=\"true\">",
      "    <canvas class=\"cyber-page-background-canvas\"></canvas>",
      "  </div>"
    ].join("\n")
  );
  html = html.replace(
    /<\/body>/i,
    [
      buildOverlay(index),
      "  <script id=\"artidrop-slide-manifest\" type=\"application/json\">" + buildManifest() + "</script>",
      "  <script src=\"../js/cyber-page-background.js\"></script>",
      "  <script src=\"../js/artidrop-shell.js\"></script>",
      "</body>"
    ].join("\n")
  );

  return html;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = args.output;

  fs.rmSync(outputDir, { recursive: true, force: true });
  ensureDir(outputDir);

  copiedFiles.forEach(function (relativePath) {
    copyFile(relativePath, outputDir);
  });

  const welcomeHtml = buildWelcomeHtml();
  writeFile(path.join(outputDir, "index.html"), welcomeHtml);

  slides.forEach(function (_slide, index) {
    const fileName = "slide-" + slides[index].slug + ".html";
    writeFile(path.join(outputDir, "pages", fileName), buildSlideHtml(index));
  });

  process.stdout.write("Artidrop export written to " + outputDir + "\n");
}

main();
