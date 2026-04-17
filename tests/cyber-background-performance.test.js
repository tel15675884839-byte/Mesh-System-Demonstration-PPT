const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const cyberBackgroundScript = fs.readFileSync(path.join(rootDir, "js", "cyber-page-background.js"), "utf8");

function createHarness() {
  const windowListeners = new Map();
  const documentListeners = new Map();
  let rectCallCount = 0;
  let currentRect = {
    left: 120,
    top: 48,
    width: 1280,
    height: 720
  };

  const ctx = {
    setTransform() {},
    fillRect() {},
    beginPath() {},
    arc() {},
    fill() {},
    closePath() {},
    fillText() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    setLineDash() {},
    save() {},
    restore() {}
  };

  const canvas = {
    width: 0,
    height: 0,
    getContext() {
      return ctx;
    }
  };

  const root = {
    clientWidth: 1280,
    clientHeight: 720,
    __cyberBackgroundInitialized: false,
    __cyberBackgroundInstance: null,
    querySelector(selector) {
      if (selector === "canvas") {
        return canvas;
      }
      return null;
    },
    hasAttribute() {
      return false;
    },
    getBoundingClientRect() {
      rectCallCount += 1;
      return Object.assign({}, currentRect);
    }
  };

  const context = {
    console,
    Math,
    Date,
    document: {
      hidden: false,
      readyState: "complete",
      querySelectorAll(selector) {
        if (selector === "[data-cyber-bg]") {
          return [root];
        }
        return [];
      },
      addEventListener(type, handler) {
        documentListeners.set(type, handler);
      },
      removeEventListener(type) {
        documentListeners.delete(type);
      }
    },
    window: null
  };

  context.window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    parent: {},
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    removeEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      windowListeners.set(
        type,
        handlers.filter((entry) => entry !== handler)
      );
    },
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {}
  };

  return {
    context,
    root,
    getRectCallCount() {
      return rectCallCount;
    },
    setRootRect(nextRect) {
      currentRect = Object.assign({}, currentRect, nextRect);
    },
    dispatchPointerMove(event) {
      const handlers = windowListeners.get("pointermove") || [];
      handlers.forEach((handler) => handler.call(context.window, event));
    },
    dispatchResize() {
      const handlers = windowListeners.get("resize") || [];
      handlers.forEach((handler) => handler.call(context.window));
    }
  };
}

test("cyber background caches root bounds instead of remeasuring on every pointer move", () => {
  const harness = createHarness();

  vm.runInNewContext(cyberBackgroundScript, harness.context, {
    filename: "cyber-page-background.js"
  });

  const initialRectReads = harness.getRectCallCount();

  harness.dispatchPointerMove({ clientX: 400, clientY: 300 });
  harness.dispatchPointerMove({ clientX: 620, clientY: 420 });

  assert.equal(
    harness.getRectCallCount(),
    initialRectReads,
    "Expected pointer tracking to reuse cached root bounds instead of forcing new layout reads."
  );
});

test("cyber background refreshes cached bounds when the viewport changes", () => {
  const harness = createHarness();

  vm.runInNewContext(cyberBackgroundScript, harness.context, {
    filename: "cyber-page-background.js"
  });

  harness.dispatchPointerMove({ clientX: 400, clientY: 300 });

  harness.setRootRect({ left: 260, top: 180 });
  harness.dispatchResize();
  harness.dispatchPointerMove({ clientX: 600, clientY: 460 });

  assert.equal(
    harness.root.__cyberBackgroundInstance.mouseX,
    340,
    "Expected pointer tracking to honor the refreshed cached left offset after resize."
  );
  assert.equal(
    harness.root.__cyberBackgroundInstance.mouseY,
    280,
    "Expected pointer tracking to honor the refreshed cached top offset after resize."
  );
});
