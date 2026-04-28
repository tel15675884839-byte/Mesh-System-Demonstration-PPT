const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");

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
  const attributes = Object.assign({}, config.attributes);

  return {
    dataset: Object.assign({}, config.dataset),
    classList: createClassList(config.className),
    style: {},
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name)
        ? attributes[name]
        : null;
    },
    removeAttribute(name) {
      delete attributes[name];
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    dispatchEvent(event) {
      const handler = listeners.get(event.type);
      if (handler) {
        handler.call(this, event);
      }
    }
  };
}

function createTimerHarness() {
  let now = 0;
  let nextId = 1;
  const timers = new Map();

  return {
    setTimeout(callback, delay) {
      const id = nextId += 1;
      timers.set(id, {
        callback,
        runAt: now + Number(delay || 0)
      });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    advanceBy(ms) {
      const target = now + ms;

      while (true) {
        let nextTimer = null;
        for (const [id, timer] of timers.entries()) {
          if (timer.runAt > target) {
            continue;
          }
          if (!nextTimer || timer.runAt < nextTimer.timer.runAt) {
            nextTimer = { id, timer };
          }
        }

        if (!nextTimer) {
          break;
        }

        now = nextTimer.timer.runAt;
        timers.delete(nextTimer.id);
        nextTimer.timer.callback();
      }

      now = target;
    }
  };
}

function createAppHarness(search) {
  const timerHarness = createTimerHarness();
  const slides = Array.from({ length: 11 }, (_, index) => createElement({ dataset: { slide: String(index) } }));
  const navDots = Array.from({ length: 11 }, (_, index) =>
    createElement({
      className: index === 0 ? "nav-dot active" : "nav-dot",
      dataset: { target: String(index) }
    })
  );
  const slideFrames = slides.map(() => ({
    contentWindow: { postMessage() {} },
    addEventListener() {}
  }));
  const slidesContainer = createElement();
  const progressIndicator = createElement();
  const appShell = createElement({ className: "app-shell fixed-stage" });

  const location = {
    pathname: "/index.html",
    search
  };
  const history = {
    replaceState(_state, _title, url) {
      const queryIndex = String(url).indexOf("?");
      location.search = queryIndex >= 0 ? String(url).slice(queryIndex) : "";
    }
  };

  const windowListeners = new Map();
  const context = {
    console,
    Number,
    Math,
    URLSearchParams,
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init ? init.detail : undefined;
    },
    document: {
      documentElement: {
        dataset: { mode: "presentation" }
      },
      querySelector(selector) {
        if (selector === ".app-shell") {
          return appShell;
        }
        return null;
      },
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
    window: null
  };

  context.window = {
    location,
    history,
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    dispatchEvent() {},
    setTimeout(callback, delay) {
      return timerHarness.setTimeout(callback, delay);
    },
    clearTimeout(id) {
      timerHarness.clearTimeout(id);
    }
  };
  context.window.window = context.window;
  context.window.document = context.document;

  vm.runInNewContext(appScript, context);

  return {
    appShell,
    clickNav(index) {
      navDots[index].dispatchEvent({ type: "click" });
    },
    advanceBy(ms) {
      timerHarness.advanceBy(ms);
    }
  };
}

test("product background enters and exits through dedicated transition classes", () => {
  const harness = createAppHarness("?slide=capacity");

  assert.equal(harness.appShell.classList.contains("is-product-background"), false);
  assert.equal(harness.appShell.classList.contains("is-product-background-enter"), false);

  harness.clickNav(10);

  assert.equal(harness.appShell.classList.contains("is-product-background"), true);
  assert.equal(harness.appShell.classList.contains("is-product-background-enter"), true);
  assert.equal(harness.appShell.classList.contains("is-product-background-exit"), false);

  harness.advanceBy(400);
  assert.equal(harness.appShell.classList.contains("is-product-background-enter"), true);

  harness.advanceBy(400);
  assert.equal(harness.appShell.classList.contains("is-product-background"), true);
  assert.equal(harness.appShell.classList.contains("is-product-background-enter"), false);

  harness.clickNav(9);

  assert.equal(harness.appShell.classList.contains("is-product-background"), true);
  assert.equal(harness.appShell.classList.contains("is-product-background-exit"), true);

  harness.advanceBy(800);

  assert.equal(harness.appShell.classList.contains("is-product-background"), false);
  assert.equal(harness.appShell.classList.contains("is-product-background-exit"), false);
});

test("installation cost transition class is scoped to the Easy Installation pair", () => {
  const harness = createAppHarness("?slide=installation");

  assert.equal(harness.appShell.classList.contains("is-installation-cost-transition"), false);

  harness.clickNav(8);

  assert.equal(harness.appShell.classList.contains("is-installation-cost-transition"), true);
  assert.equal(harness.appShell.classList.contains("is-installation-cost-enter"), true);

  harness.advanceBy(900);

  assert.equal(harness.appShell.classList.contains("is-installation-cost-transition"), false);
  assert.equal(harness.appShell.classList.contains("is-installation-cost-enter"), false);

  harness.clickNav(9);

  assert.equal(harness.appShell.classList.contains("is-installation-cost-transition"), false);
  assert.equal(harness.appShell.classList.contains("is-installation-cost-enter"), false);
});
