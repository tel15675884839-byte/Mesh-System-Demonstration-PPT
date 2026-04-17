const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const reliabilityScript = fs.readFileSync(path.join(rootDir, "js", "pages", "reliability-animations.js"), "utf8");

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

function createElement(options, registry) {
  const config = options || {};
  const listeners = new Map();
  let rectCallCount = 0;

  const element = {
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
      rectCallCount += 1;
      return Object.assign(
        {
          left: 0,
          top: 0,
          width: 120,
          height: 60
        },
        config.rect
      );
    },
    animate() {
      return {
        onfinish: null
      };
    },
    __getRectCallCount() {
      return rectCallCount;
    }
  };

  registry.push(element);
  return element;
}

function createHarness() {
  const windowListeners = new Map();
  const intervals = [];
  const elements = {};
  const registry = [];

  function register(id, rect) {
    const element = createElement({ id, rect }, registry);
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
        return createElement({ tagName: String(tagName || "").toLowerCase() }, registry);
      },
      createElementNS(_ns, tagName) {
        return createElement({ tagName: String(tagName || "").toLowerCase() }, registry);
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
    clearInterval() {},
    setTimeout,
    clearTimeout
  };

  return {
    context,
    dispatchMessage(data) {
      const handlers = windowListeners.get("message") || [];
      handlers.forEach((handler) => handler.call(context.window, { data }));
    },
    runParticleLoop() {
      const interval = intervals[0];
      if (interval) {
        interval.callback();
      }
    },
    getTotalRectCallCount() {
      return registry.reduce((total, element) => total + element.__getRectCallCount(), 0);
    }
  };
}

test("reliability particle loop reuses cached link geometry instead of remeasuring every cycle", () => {
  const harness = createHarness();

  vm.runInNewContext(reliabilityScript, harness.context, {
    filename: "reliability-animations.js"
  });

  harness.dispatchMessage({ type: "slideVisibility", active: true });
  const initialRectCalls = harness.getTotalRectCallCount();

  harness.runParticleLoop();

  assert.equal(
    harness.getTotalRectCallCount(),
    initialRectCalls,
    "Expected the active reliability particle loop to reuse staged geometry without extra layout reads."
  );
});
