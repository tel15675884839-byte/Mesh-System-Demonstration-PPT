const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const productScript = fs.readFileSync(path.join(rootDir, "js", "product-showcase.js"), "utf8");
const productCss = fs.readFileSync(path.join(rootDir, "css", "pages", "product-showcase.css"), "utf8");
const productHtml = fs.readFileSync(path.join(rootDir, "pages", "product-showcase.html"), "utf8");

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
    id: config.id || "",
    dataset: Object.assign({}, config.dataset),
    classList: createClassList(config.className),
    style: {
      setProperty(name, value) {
        this[name] = String(value);
      }
    },
    innerHTML: "",
    textContent: "",
    src: "",
    alt: "",
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
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((handler) => handler.call(this, event));
      return true;
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

test("product showcase animates internal product changes with directional zoom states", () => {
  const timers = createTimerHarness();
  const stage = createElement({ id: "product-stage" });
  const imageShell = createElement({ id: "product-image-shell" });
  const imageEl = createElement({ id: "product-image" });
  const fallbackEl = createElement({ id: "product-fallback", className: "product-fallback is-hidden" });
  const titleEl = createElement({ id: "product-title" });
  const statsEl = createElement({ id: "product-stats" });
  const detailsPanel = createElement({ id: "product-details-panel" });
  const counterEl = createElement({ id: "product-counter" });
  const btnPrev = createElement({ id: "nav-prev" });
  const btnNext = createElement({ id: "nav-next" });
  const documentListeners = new Map();

  const context = {
    console,
    Number,
    Math,
    Array,
    URLSearchParams,
    document: {
      getElementById(id) {
        if (id === "product-stage") return stage;
        if (id === "product-image-shell") return imageShell;
        if (id === "product-image") return imageEl;
        if (id === "product-fallback") return fallbackEl;
        if (id === "product-title") return titleEl;
        if (id === "product-stats") return statsEl;
        if (id === "product-details-panel") return detailsPanel;
        if (id === "product-counter") return counterEl;
        if (id === "nav-prev") return btnPrev;
        if (id === "nav-next") return btnNext;
        return null;
      },
      addEventListener(type, handler) {
        documentListeners.set(type, handler);
      }
    },
    window: {
      location: {
        search: ""
      },
      setTimeout(callback, delay) {
        return timers.setTimeout(callback, delay);
      },
      clearTimeout(id) {
        timers.clearTimeout(id);
      },
      requestAnimationFrame(callback) {
        return timers.setTimeout(callback, 16);
      }
    }
  };
  context.window.window = context.window;
  context.window.document = context.document;

  vm.runInNewContext(productScript, context, {
    filename: "product-showcase.js"
  });

  assert.equal(titleEl.textContent, "Wireless Loop Expansion Card");

  btnNext.dispatchEvent({ type: "click" });

  assert.equal(stage.classList.contains("is-transitioning"), true);
  assert.equal(stage.classList.contains("is-exiting"), true);
  assert.equal(stage.getAttribute("data-product-direction"), "forward");
  assert.equal(titleEl.textContent, "Wireless Loop Expansion Card");

  timers.advanceBy(260);

  assert.equal(titleEl.textContent, "Wireless Loop Expansion Card");
  assert.equal(stage.classList.contains("is-exiting"), true);

  timers.advanceBy(100);

  assert.equal(titleEl.textContent, "Wireless Leader / Node");
  assert.equal(stage.classList.contains("is-transitioning"), true);
  assert.equal(stage.classList.contains("is-enter-prep"), false);

  timers.advanceBy(700);

  assert.equal(stage.classList.contains("is-transitioning"), true);

  timers.advanceBy(120);

  assert.equal(stage.classList.contains("is-transitioning"), false);
  assert.equal(stage.classList.contains("is-exiting"), false);
  assert.equal(counterEl.textContent, "02 / 06");
  assert.match(productHtml, /id="product-stage"[^>]*data-product-anim="zoom"/i);
  assert.match(productCss, /\.product-stage\[data-product-anim="zoom"\]\s+\.product-motion-panel\s*\{/i);
  assert.match(productCss, /\.product-stage\[data-product-anim="zoom"\]\.is-transitioning\s+\.product-motion-panel\s*\{[\s\S]*transition:\s*transform 1\.1s cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\), opacity 1\.1s ease;/i);
  assert.match(productCss, /\.product-stage\[data-product-anim="zoom"\]\.is-exiting\[data-product-direction="forward"\]\s+\.product-motion-panel\s*\{[\s\S]*translateX\(-50%\)\s*scale\(0\.85\)[\s\S]*opacity:\s*0;/i);
  assert.match(productCss, /\.product-stage\[data-product-anim="zoom"\]\.is-enter-prep\[data-product-direction="forward"\]\s+\.product-motion-panel\s*\{[\s\S]*translateX\(50%\)\s*scale\(1\.15\)[\s\S]*opacity:\s*0;/i);
});
