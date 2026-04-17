const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");

function createFrame(index) {
  return {
    dataset: {
      src: index === 9
        ? "pages/product-showcase.html?v=20260415m"
        : "pages/slide-" + index + ".html"
    },
    src: "",
    contentWindow: null,
    setAttribute(name, value) {
      if (name === "src") {
        this.src = String(value);
        this.contentWindow = { postMessage() {} };
      }
    },
    getAttribute(name) {
      if (name === "src") {
        return this.src;
      }
      if (name === "data-src") {
        return this.dataset.src;
      }
      return null;
    },
    removeAttribute(name) {
      if (name === "src") {
        this.src = "";
        this.contentWindow = null;
      }
    },
    addEventListener() {}
  };
}

function createHarness() {
  const slides = Array.from({ length: 10 }, (_, index) => ({
    dataset: { slide: String(index) }
  }));
  const navDots = Array.from({ length: 10 }, (_, index) => ({
    dataset: { target: String(index) },
    classList: { toggle() {} },
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {}
  }));
  const slideFrames = slides.map((_, index) => createFrame(index));

  const context = {
    console,
    Math,
    Number,
    URLSearchParams,
    document: {
      documentElement: {
        dataset: { mode: "presentation" }
      },
      body: {
        classList: {
          contains() {
            return true;
          }
        }
      },
      querySelector() {
        return null;
      },
      querySelectorAll(selector) {
        if (selector === ".slide") return slides;
        if (selector === ".nav-dot") return navDots;
        if (selector === ".slide-frame") return slideFrames;
        return [];
      },
      getElementById(id) {
        if (id === "progress-indicator") {
          return { style: {} };
        }
        if (id === "slides") {
          return { style: {} };
        }
        return null;
      }
    },
    window: null,
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init ? init.detail : undefined;
    },
    setTimeout,
    clearTimeout
  };

  context.window = {
    location: {
      pathname: "/index.html",
      search: ""
    },
    history: {
      replaceState() {}
    },
    addEventListener() {},
    dispatchEvent() {},
    setTimeout,
    clearTimeout
  };
  context.window.window = context.window;
  context.window.document = context.document;

  vm.runInNewContext(appScript, context, { filename: "app.js" });

  return {
    slideFrames
  };
}

test("app shell preloads the product showcase iframe before the first visit", () => {
  const harness = createHarness();

  assert.equal(
    harness.slideFrames[9].src,
    "pages/product-showcase.html?v=20260415m",
    "Expected the product showcase iframe to preload so the first navigation does not reveal an empty black shell."
  );
});

test("product showcase iframe opts out of lazy loading so preload can complete off-screen", () => {
  assert.match(
    indexHtml,
    /<iframe class="slide-frame" data-src="pages\/product-showcase\.html\?v=20260415m" title="Product Showcase" loading="eager"><\/iframe>/i
  );
});
