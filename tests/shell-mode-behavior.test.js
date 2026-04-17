const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const fixedStageScript = fs.readFileSync(path.join(rootDir, "js", "fixed-stage.js"), "utf8");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");

function runFixedStage(search, windowSize) {
  const styleUpdates = [];
  const listeners = new Map();

  const context = {
    console,
    Math,
    URLSearchParams,
    location: { search },
    document: {
      documentElement: {
        dataset: {},
        style: {
          setProperty(name, value) {
            styleUpdates.push([name, value]);
          }
        }
      }
    },
    window: null
  };

  context.window = {
    innerWidth: windowSize.width,
    innerHeight: windowSize.height,
    addEventListener(type, handler) {
      listeners.set(type, handler);
    }
  };
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.location = context.location;

  vm.runInNewContext(fixedStageScript, context);

  return {
    dataset: context.document.documentElement.dataset,
    styleUpdates,
    listeners
  };
}

function createAppHarness(mode, options) {
  const config = options || {};
  const windowListeners = new Map();
  const navHandlers = [];
  const slideScrollCalls = [];
  const frameMessages = [];

  function createSlide(index) {
    slideScrollCalls[index] = 0;
    return {
      dataset: { slide: String(index) },
      scrollIntoView() {
        slideScrollCalls[index] += 1;
      }
    };
  }

  function createNavDot(index) {
    const listeners = new Map();
    const classSet = new Set();
    const attributes = {};

    return {
      dataset: { target: String(index) },
      classList: {
        toggle(name, isActive) {
          if (isActive) {
            classSet.add(name);
          } else {
            classSet.delete(name);
          }
        },
        contains(name) {
          return classSet.has(name);
        }
      },
      setAttribute(name, value) {
        attributes[name] = String(value);
      },
      getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
      },
      removeAttribute(name) {
        delete attributes[name];
      },
      addEventListener(type, handler) {
        listeners.set(type, handler);
        navHandlers[index] = handler;
      },
      triggerClick() {
        const handler = listeners.get("click");
        if (handler) {
          handler();
        }
      }
    };
  }

  function createFrame(index) {
    const listeners = new Map();
    const frame = {
      dataset: {
        src: "pages/slide-" + index + ".html"
      },
      src: "",
      contentWindow: null,
      setAttribute(name, value) {
        if (name === "src") {
          this.src = String(value);
          this.contentWindow = {
            postMessage(message) {
              frameMessages.push({
                index,
                message
              });
            }
          };
          return;
        }

        this[name] = String(value);
      },
      removeAttribute(name) {
        if (name === "src") {
          this.src = "";
          this.contentWindow = null;
          return;
        }

        delete this[name];
      },
      addEventListener(type, handler) {
        listeners.set(type, handler);
      }
    };

    return frame;
  }

  const slides = [createSlide(0), createSlide(1), createSlide(2), createSlide(3)];
  const navDots = [createNavDot(0), createNavDot(1), createNavDot(2), createNavDot(3)];
  const slideFrames = slides.map(function (_slide, index) {
    return createFrame(index);
  });
  const slidesContainer = { style: {} };
  const progressIndicator = { style: {} };
  const bodyClasses = new Set(config.bodyClasses || []);

  const context = {
    console,
    Math,
    Number,
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init ? init.detail : undefined;
    },
    document: {
      documentElement: {
        dataset: { mode }
      },
      body: {
        classList: {
          add(className) {
            bodyClasses.add(className);
          },
          remove(className) {
            bodyClasses.delete(className);
          },
          contains(className) {
            return bodyClasses.has(className);
          }
        }
      },
      querySelectorAll(selector) {
        if (selector === ".slide") {
          return slides;
        }
        if (selector === ".nav-dot") {
          return navDots;
        }
        if (selector === ".slide-frame") {
          return slideFrames;
        }
        return [];
      },
      getElementById(id) {
        if (id === "progress-indicator") {
          return progressIndicator;
        }
        if (id === "slides") {
          return slidesContainer;
        }
        if (config.hasIntro && (id === "hero-layer" || id === "content-layer")) {
          return { id };
        }
        return null;
      }
    },
    window: null,
    setTimeout,
    clearTimeout
  };

  context.window = {
    setTimeout,
    clearTimeout,
    addEventListener(type, handler) {
      windowListeners.set(type, handler);
    },
    dispatchEvent() {}
  };
  context.window.window = context.window;
  context.window.document = context.document;

  vm.runInNewContext(appScript, context);

  return {
    slidesContainer,
    progressIndicator,
    slideScrollCalls,
    frameMessages,
    slideFrames,
    listeners: windowListeners,
    clickNav(index) {
      navDots[index].triggerClick();
    },
    sendMessage(message) {
      const handler = windowListeners.get("message");
      if (handler) {
        handler({ data: message });
      }
    }
  };
}

test("fixed-stage defaults to presentation mode and computes stage scale", () => {
  const result = runFixedStage("", { width: 1440, height: 900 });

  assert.equal(result.dataset.mode, "presentation");
  assert.deepEqual(result.styleUpdates[0], ["--stage-scale", String(Math.min(1440 / 1920, 900 / 1080))]);
  assert.ok(result.listeners.has("resize"));
});

test("fixed-stage honors browser mode without applying stage scaling", () => {
  const result = runFixedStage("?mode=browser", { width: 1440, height: 900 });

  assert.equal(result.dataset.mode, "browser");
  assert.equal(result.styleUpdates.length, 0);
});

test("app shell uses native scrolling in browser mode instead of fixed-stage transforms", () => {
  const harness = createAppHarness("browser");

  assert.equal(harness.slidesContainer.style.transform, "");
  assert.equal(harness.listeners.has("wheel"), false);

  harness.sendMessage({ type: "goToSlide", slide: 2 });

  assert.equal(harness.slideScrollCalls[2], 1);
  assert.equal(harness.progressIndicator.style.width, "75%");
});

test("app shell keeps transform-based paging in presentation mode", () => {
  const harness = createAppHarness("presentation");

  assert.equal(harness.listeners.has("wheel"), true);
  assert.equal(harness.slidesContainer.style.transform, "translateY(-0px)");

  harness.clickNav(1);

  assert.equal(harness.slidesContainer.style.transform, "translateY(-1080px)");
});

test("app shell only keeps the active slide and its neighbors mounted", () => {
  const harness = createAppHarness("presentation");

  assert.equal(harness.slideFrames[0].src, "pages/slide-0.html");
  assert.equal(harness.slideFrames[1].src, "pages/slide-1.html");
  assert.equal(harness.slideFrames[2].src, "");
  assert.equal(harness.slideFrames[3].src, "");

  harness.sendMessage({ type: "goToSlide", slide: 2 });

  assert.equal(harness.slideFrames[0].src, "");
  assert.equal(harness.slideFrames[1].src, "pages/slide-1.html");
  assert.equal(harness.slideFrames[2].src, "pages/slide-2.html");
  assert.equal(harness.slideFrames[3].src, "pages/slide-3.html");
});

test("app shell defers iframe loading until the merged welcome intro has been entered", () => {
  const harness = createAppHarness("presentation", { hasIntro: true });

  assert.equal(harness.slideFrames[0].src, "");
  assert.equal(harness.slideFrames[1].src, "");
  assert.equal(harness.slideFrames[2].src, "");
  assert.equal(harness.slideFrames[3].src, "");

  const introEntered = harness.listeners.get("presentationIntroEntered");
  assert.equal(typeof introEntered, "function");

  introEntered({ type: "presentationIntroEntered" });

  assert.equal(harness.slideFrames[0].src, "pages/slide-0.html");
  assert.equal(harness.slideFrames[1].src, "pages/slide-1.html");
  assert.equal(harness.slideFrames[2].src, "");
  assert.equal(harness.slideFrames[3].src, "");
});
