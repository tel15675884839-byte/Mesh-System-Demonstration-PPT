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

function createAppHarness(mode) {
  const windowListeners = new Map();
  const navHandlers = [];
  const slideScrollCalls = [];

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

  const slides = [createSlide(0), createSlide(1), createSlide(2)];
  const navDots = [createNavDot(0), createNavDot(1), createNavDot(2)];
  const frameMessages = [];
  const slideFrames = slides.map(function () {
    return {
      contentWindow: {
        postMessage(message) {
          frameMessages.push(message);
        }
      },
      addEventListener() {}
    };
  });
  const slidesContainer = { style: {} };
  const progressIndicator = { style: {} };

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
  assert.equal(harness.progressIndicator.style.width, "100%");
});

test("app shell keeps transform-based paging in presentation mode", () => {
  const harness = createAppHarness("presentation");

  assert.equal(harness.listeners.has("wheel"), true);
  assert.equal(harness.slidesContainer.style.transform, "translateY(-0px)");

  harness.clickNav(1);

  assert.equal(harness.slidesContainer.style.transform, "translateY(-1080px)");
});
