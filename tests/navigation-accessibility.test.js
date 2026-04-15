const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");
const productScript = fs.readFileSync(path.join(rootDir, "js", "product-showcase.js"), "utf8");
const productHtml = fs.readFileSync(path.join(rootDir, "pages", "product-showcase.html"), "utf8");
const styleCss = fs.readFileSync(path.join(rootDir, "css", "style.css"), "utf8");

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
    style: {
      setProperty(name, value) {
        this[name] = String(value);
      },
      getPropertyValue(name) {
        return this[name] || "";
      }
    },
    attributes: Object.assign({}, config.attributes),
    innerHTML: "",
    textContent: "",
    src: "",
    alt: "",
    focused: false,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((handler) => handler.call(this, event));
      return !event.defaultPrevented;
    },
    focus() {
      this.focused = true;
    }
  };
}

function createAppHarness() {
  const windowListeners = new Map();
  const slides = [0, 1, 2].map(() => createElement({ className: "slide" }));
  const navDots = [0, 1, 2].map((index) =>
    createElement({
      className: index === 0 ? "nav-dot active" : "nav-dot",
      dataset: { target: String(index) }
    })
  );
  const progressIndicator = createElement({ id: "progress-indicator" });
  const slidesContainer = createElement({ id: "slides" });
  const slideFrames = slides.map(() => ({
    contentWindow: { postMessage() {} },
    addEventListener() {}
  }));

  const context = {
    console,
    Number,
    Math,
    setTimeout,
    clearTimeout,
    document: {
      documentElement: {
        dataset: { mode: "presentation" }
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
    dispatchEvent() {},
    setTimeout,
    clearTimeout
  };

  vm.runInNewContext(appScript, context);

  return {
    navDots,
    sendGoToSlide(slide) {
      const handlers = windowListeners.get("message") || [];
      handlers.forEach((handler) => handler.call(context.window, { data: { type: "goToSlide", slide } }));
    }
  };
}

function createProductHarness() {
  const buttonLabels = [
    "Expansion Card",
    "Leader/Node",
    "Det",
    "MCP",
    "Sounder",
    "I/O"
  ];
  const buttons = buttonLabels.map((label, index) =>
    createElement({
      className: index === 0 ? "product-switch-btn is-active" : "product-switch-btn",
      dataset: { productIndex: String(index) },
      attributes: {
        role: "tab",
        "aria-selected": index === 0 ? "true" : "false"
      }
    })
  );
  const switcher = createElement({ id: "product-switcher" });
  const stage = createElement({ id: "product-stage" });
  const imageShell = createElement({ id: "product-image-shell" });
  const imageEl = createElement({ id: "product-image" });
  const fallbackEl = createElement({ id: "product-fallback", className: "product-fallback is-hidden" });
  const titleEl = createElement({ id: "product-title" });
  const statsEl = createElement({ id: "product-stats" });
  const panel = createElement({ id: "product-details-panel" });

  const context = {
    console,
    Number,
    Math,
    Array,
    document: {
      querySelectorAll(selector) {
        if (selector === ".product-switch-btn") {
          return buttons;
        }
        return [];
      },
      getElementById(id) {
        if (id === "product-stage") return stage;
        if (id === "product-image-shell") return imageShell;
        if (id === "product-image") return imageEl;
        if (id === "product-fallback") return fallbackEl;
        if (id === "product-title") return titleEl;
        if (id === "product-stats") return statsEl;
        if (id === "product-switcher") return switcher;
        if (id === "product-details-panel") return panel;
        return null;
      }
    },
    window: {}
  };

  vm.runInNewContext(productScript, context);

  return {
    buttons,
    switcher,
    panel
  };
}

test("main navigation exposes aria-current and focus-visible styles for the active slide", () => {
  const harness = createAppHarness();

  assert.equal(harness.navDots[0].getAttribute("aria-current"), "true");
  assert.equal(harness.navDots[1].getAttribute("aria-current"), null);

  harness.sendGoToSlide(2);

  assert.equal(harness.navDots[0].getAttribute("aria-current"), null);
  assert.equal(harness.navDots[2].getAttribute("aria-current"), "true");
  assert.match(styleCss, /\.nav-dot:focus-visible\s*\{/);
});

test("product showcase markup wires tabs to a tabpanel", () => {
  assert.match(productHtml, /id="product-details-panel"/);
  assert.match(productHtml, /role="tabpanel"/);
  assert.match(productHtml, /aria-labelledby="product-tab-0"/);
  assert.match(productHtml, /aria-controls="product-details-panel"/);
});

test("product showcase keyboard navigation supports roving tabindex with arrow and Home\/End keys", () => {
  const harness = createProductHarness();

  harness.switcher.dispatchEvent({
    type: "keydown",
    key: "End",
    preventDefault() {
      this.defaultPrevented = true;
    }
  });

  assert.equal(harness.buttons[5].getAttribute("aria-selected"), "true");
  assert.equal(harness.buttons[5].getAttribute("tabindex"), "0");

  harness.switcher.dispatchEvent({
    type: "keydown",
    key: "Home",
    preventDefault() {
      this.defaultPrevented = true;
    }
  });

  assert.equal(harness.buttons[0].getAttribute("aria-selected"), "true");
  assert.equal(harness.buttons[0].getAttribute("tabindex"), "0");

  harness.switcher.dispatchEvent({
    type: "keydown",
    key: "ArrowRight",
    preventDefault() {
      this.defaultPrevented = true;
    }
  });

  assert.equal(harness.buttons[1].getAttribute("aria-selected"), "true");
  assert.equal(harness.buttons[1].getAttribute("tabindex"), "0");
  assert.equal(harness.panel.getAttribute("aria-labelledby"), "product-tab-1");
});
