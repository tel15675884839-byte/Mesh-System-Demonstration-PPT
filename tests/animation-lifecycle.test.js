const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const reliabilityScript = fs.readFileSync(path.join(rootDir, "js", "pages", "reliability-animations.js"), "utf8");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");
const circuitBackgroundScript = fs.readFileSync(path.join(rootDir, "js", "circuit-background.js"), "utf8");

function createClassList(initialClassName) {
  const classes = new Set(String(initialClassName || "").split(/\s+/).filter(Boolean));
  return {
    add(className) {
      classes.add(className);
    },
    remove(className) {
      classes.delete(className);
    },
    toggle(className, force) {
      if (force === undefined) {
        if (classes.has(className)) {
          classes.delete(className);
          return false;
        }
        classes.add(className);
        return true;
      }
      if (force) {
        classes.add(className);
        return true;
      }
      classes.delete(className);
      return false;
    },
    contains(className) {
      return classes.has(className);
    }
  };
}

function createElement(options) {
  const config = options || {};
  const listeners = new Map();
  return {
    id: config.id || "",
    dataset: Object.assign({}, config.dataset),
    classList: createClassList(config.className),
    style: {},
    children: [],
    attributes: {},
    clientWidth: config.clientWidth || 0,
    clientHeight: config.clientHeight || 0,
    parentNode: null,
    textContent: "",
    innerHTML: "",
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter((entry) => entry !== child);
      child.parentNode = null;
      return child;
    },
    remove() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((handler) => handler.call(this, event));
      return true;
    },
    getBoundingClientRect() {
      return Object.assign({
        left: 0,
        top: 0,
        width: 120,
        height: 60
      }, config.rect);
    },
    animate() {
      return {
        onfinish: null
      };
    }
  };
}

function createReliabilityHarness() {
  const windowListeners = new Map();
  const intervals = [];
  const clearedIntervals = [];
  const elements = {};

  function register(id, rect) {
    const element = createElement({ id, rect });
    elements[id] = element;
    return element;
  }

  register("reli-animation-map-one-way", { left: 0, top: 0, width: 600, height: 320 });
  register("reli-connection-layer-one-way", { left: 0, top: 0, width: 600, height: 320 });
  register("reli-animation-map-two-way", { left: 0, top: 0, width: 600, height: 320 });
  register("reli-connection-layer-two-way", { left: 0, top: 0, width: 600, height: 320 });

  const context = {
    console,
    Math,
    Date,
    Set,
    Map,
    document: {
      getElementById(id) {
        return elements[id] || null;
      },
      createElement(tagName) {
        return createElement({ tagName: String(tagName || "").toLowerCase() });
      },
      createElementNS(_ns, tagName) {
        return createElement({ tagName: String(tagName || "").toLowerCase() });
      }
    },
    setTimeout,
    clearTimeout,
    window: null
  };

  context.window = {
    parent: {},
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    removeEventListener() {},
    setInterval(callback, delay) {
      const id = intervals.length + 1;
      intervals.push({ id, callback, delay });
      return id;
    },
    clearInterval(id) {
      clearedIntervals.push(id);
    },
    setTimeout,
    clearTimeout
  };

  return {
    context,
    dispatchMessage(data) {
      const handlers = windowListeners.get("message") || [];
      handlers.forEach((handler) => handler.call(context.window, { data }));
    },
    getIntervalCount() {
      return intervals.length;
    },
    getClearedIntervals() {
      return clearedIntervals.slice();
    }
  };
}

function createAppHarness() {
  const windowListeners = new Map();
  const frameMessages = [];
  const customEvents = [];
  const slideFrames = [0, 1, 2].map(() => ({
    contentWindow: {
      postMessage(message) {
        frameMessages.push(message);
      }
    },
    addEventListener() {}
  }));
  const slides = [0, 1, 2].map(() => createElement({ className: "slide" }));
  const navDots = [0, 1, 2].map((index) => createElement({ className: index === 0 ? "nav-dot active" : "nav-dot", dataset: { target: String(index) } }));
  const progressIndicator = createElement({ id: "progress-indicator" });
  const slidesContainer = createElement({ id: "slides" });

  const context = {
    console,
    Number,
    Math,
    setTimeout,
    clearTimeout,
    document: {
      querySelectorAll(selector) {
        if (selector === ".slide") return slides;
        if (selector === ".nav-dot") return navDots;
        if (selector === ".slide-frame") return slideFrames;
        return [];
      },
      getElementById(id) {
        if (id === "progress-indicator") return progressIndicator;
        if (id === "slides") return slidesContainer;
        return null;
      }
    },
    window: null,
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init ? init.detail : undefined;
    }
  };

  context.window = {
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    dispatchEvent(event) {
      customEvents.push(event);
      return true;
    },
    setTimeout,
    clearTimeout
  };

  return {
    context,
    customEvents,
    sendGoToSlide(slide) {
      const handlers = windowListeners.get("message") || [];
      handlers.forEach((handler) => handler.call(context.window, { data: { type: "goToSlide", slide } }));
    },
    getFrameMessages() {
      return frameMessages.slice();
    }
  };
}

function createCircuitBackgroundHarness() {
  const windowListeners = new Map();
  const rafCallbacks = [];

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

  const canvas = createElement({ clientWidth: 1280, clientHeight: 720 });
  canvas.getContext = function () {
    return ctx;
  };

  const context = {
    console,
    Math,
    window: null,
    document: {
      querySelectorAll(selector) {
        if (selector === "[data-circuit-bg]") {
          return [canvas];
        }
        return [];
      }
    },
    requestAnimationFrame(callback) {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    }
  };

  context.window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    removeEventListener() {},
    requestAnimationFrame(callback) {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    }
  };

  return {
    context,
    getScheduledFrameCount() {
      return rafCallbacks.length;
    },
    runNextFrame() {
      const callback = rafCallbacks.shift();
      if (callback) {
        callback();
      }
    },
    dispatchBackgroundState(active) {
      const handlers = windowListeners.get("stageBackgroundActive") || [];
      handlers.forEach((handler) => handler.call(context.window, { detail: { active } }));
    }
  };
}

test("reliability animation loop stays idle until the slide becomes active and clears on deactivate", () => {
  const harness = createReliabilityHarness();

  vm.runInNewContext(reliabilityScript, harness.context, {
    filename: "reliability-animations.js"
  });

  assert.equal(
    harness.getIntervalCount(),
    0,
    "Expected reliability particle loop to remain idle before an iframe slide becomes active."
  );

  harness.dispatchMessage({ type: "slideVisibility", active: true });
  assert.equal(
    harness.getIntervalCount(),
    1,
    "Expected reliability particle loop to start when the slide becomes active."
  );

  harness.dispatchMessage({ type: "slideVisibility", active: false });
  assert.deepEqual(
    harness.getClearedIntervals(),
    [1],
    "Expected reliability particle loop to clear when the slide becomes inactive."
  );
});

test("app dispatches background activity updates as the current slide changes", () => {
  const harness = createAppHarness();

  vm.runInNewContext(appScript, harness.context, {
    filename: "app.js"
  });

  assert.equal(
    harness.customEvents[0] && harness.customEvents[0].type,
    "stageBackgroundActive",
    "Expected app bootstrap to announce the initial background activity state."
  );
  assert.equal(
    harness.customEvents[0].detail.active,
    true,
    "Expected the background to stay active on the opening slide."
  );

  harness.sendGoToSlide(2);

  assert.equal(
    harness.customEvents.at(-1).detail.active,
    false,
    "Expected the background to freeze on heavier slides."
  );
});

test("circuit background stops scheduling new animation frames when background activity is disabled", () => {
  const harness = createCircuitBackgroundHarness();

  vm.runInNewContext(circuitBackgroundScript, harness.context, {
    filename: "circuit-background.js"
  });

  assert.equal(
    harness.getScheduledFrameCount(),
    1,
    "Expected circuit background to schedule its first animation frame on startup."
  );

  harness.dispatchBackgroundState(false);
  harness.runNextFrame();

  assert.equal(
    harness.getScheduledFrameCount(),
    0,
    "Expected circuit background to stop queuing frames after background activity is disabled."
  );
});
