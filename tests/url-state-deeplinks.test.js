const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const appScript = fs.readFileSync(path.join(rootDir, "js", "app.js"), "utf8");
const pageMessagingScript = fs.readFileSync(path.join(rootDir, "js", "page-messaging.js"), "utf8");
const productScript = fs.readFileSync(path.join(rootDir, "js", "product-showcase.js"), "utf8");
const distanceScript = fs.readFileSync(path.join(rootDir, "js", "distance-page.js"), "utf8");

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
      },
      getPropertyValue(name) {
        return this[name] || "";
      }
    },
    attributes,
    innerHTML: "",
    textContent: config.textContent || "",
    src: config.src || "",
    alt: config.alt || "",
    focused: false,
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
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatchEvent(event) {
      event.currentTarget = this;
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((handler) => handler.call(this, event));
      return !event.defaultPrevented;
    },
    focus() {
      this.focused = true;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    getBoundingClientRect() {
      return Object.assign({
        left: 0,
        top: 0,
        width: 960,
        height: 540
      }, config.rect);
    }
  };
}

function createAppHarness(search) {
  const windowListeners = new Map();
  const historyUrls = [];
  const slides = Array.from({ length: 11 }, (_, index) => createElement({ dataset: { slide: String(index) } }));
  const navDots = Array.from({ length: 11 }, (_, index) =>
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

  const location = {
    pathname: "/index.html",
    search
  };
  const history = {
    replaceState(_state, _title, url) {
      historyUrls.push(String(url));
      const queryIndex = String(url).indexOf("?");
      location.search = queryIndex >= 0 ? String(url).slice(queryIndex) : "";
    }
  };

  const context = {
    console,
    Number,
    Math,
    URLSearchParams,
    history,
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
    },
    setTimeout,
    clearTimeout
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
    setTimeout,
    clearTimeout
  };
  context.window.window = context.window;
  context.window.document = context.document;

  vm.runInNewContext(appScript, context);

  return {
    navDots,
    progressIndicator,
    historyUrls,
    sendMessage(message) {
      const handlers = windowListeners.get("message") || [];
      handlers.forEach((handler) => handler.call(context.window, { data: message }));
    },
    clickNav(index) {
      navDots[index].dispatchEvent({ type: "click" });
    }
  };
}

function createProductHarness(sharedSearch) {
  const parentMessages = [];
  const historyUrls = [];
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
      },
      textContent: label
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

  const location = { pathname: "/pages/product-showcase.html", search: "" };
  const history = {
    replaceState(_state, _title, url) {
      historyUrls.push(String(url));
      const queryIndex = String(url).indexOf("?");
      location.search = queryIndex >= 0 ? String(url).slice(queryIndex) : "";
    }
  };
  const parentWindow = {
    location: {
      pathname: "/index.html",
      search: sharedSearch
    },
    postMessage(message) {
      parentMessages.push(message);
    }
  };

  const document = {
    querySelectorAll(selector) {
      if (selector === ".product-switch-btn") {
        return buttons;
      }
      if (selector === "[data-action='goto']") {
        return [];
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
  };

  const context = {
    console,
    Number,
    Math,
    Array,
    URLSearchParams,
    history,
    document,
    window: null
  };

  context.window = {
    location,
    history,
    parent: parentWindow,
    top: parentWindow,
    addEventListener() {}
  };
  context.window.window = context.window;
  context.window.document = document;

  vm.runInNewContext(pageMessagingScript, context);
  vm.runInNewContext(productScript, context);

  return {
    buttons,
    titleEl,
    parentMessages,
    historyUrls
  };
}

function createDistanceHarness(sharedSearch) {
  const parentMessages = [];
  const page = createElement({ className: "page page-distance is-revealed", rect: { width: 1280, height: 720 } });
  const stage = createElement({
    id: "distance-main-stage",
    className: "distance-stage",
    dataset: { scene: "open" }
  });
  const introTrigger = createElement({ id: "distance-intro-trigger", attributes: { "aria-expanded": "false" } });
  const introTitle = createElement({ className: "distance-intro-title", rect: { width: 420, height: 120 } });
  const heroTitle = createElement({ rect: { left: 80, top: 40, width: 360, height: 72 } });
  const modeElement = createElement({ id: "distance-stage-mode", textContent: "OPEN AREA" });
  const openScene = createElement({
    id: "distance-scene-open",
    className: "distance-scene is-visible",
    dataset: { scene: "open" },
    attributes: { "aria-hidden": "false" }
  });
  const relayScene = createElement({
    id: "distance-scene-relay",
    className: "distance-scene",
    dataset: { scene: "relay" },
    attributes: { "aria-hidden": "true" }
  });
  const sceneButtons = [
    createElement({
      className: "scene-toggle is-active",
      id: "distance-scene-tab-open",
      dataset: { sceneTarget: "open" },
      attributes: {
        "aria-selected": "true",
        tabindex: "0"
      }
    }),
    createElement({
      className: "scene-toggle",
      id: "distance-scene-tab-relay",
      dataset: { sceneTarget: "relay" },
      attributes: {
        "aria-selected": "false",
        tabindex: "-1"
      }
    })
  ];

  page.querySelector = function (selector) {
    if (selector === ".distance-stage") return stage;
    if (selector === "#distance-intro-trigger") return introTrigger;
    if (selector === ".distance-intro-title") return introTitle;
    if (selector === ".distance-hero h2") return heroTitle;
    if (selector === "#distance-stage-mode") return modeElement;
    if (selector === "#distance-status-title") return null;
    if (selector === "#distance-status-copy") return null;
    if (selector === "#distance-scene-open") return openScene;
    if (selector === "#distance-scene-relay") return relayScene;
    if (selector === '.distance-scene[data-scene="open"]') return openScene;
    if (selector === '.distance-scene[data-scene="relay"]') return relayScene;
    if (selector === '.scene-toggle[data-scene-target="open"]') return sceneButtons[0];
    if (selector === '.scene-toggle[data-scene-target="relay"]') return sceneButtons[1];
    return null;
  };
  page.querySelectorAll = function (selector) {
    if (selector === ".scene-toggle") return sceneButtons;
    if (selector === ".distance-scene") return [openScene, relayScene];
    if (selector === "[data-action='goto']") return [];
    return [];
  };

  const document = {
    hidden: false,
    fonts: null,
    querySelector(selector) {
      if (selector === ".page-distance") {
        return page;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-action='goto']") {
        return [];
      }
      return [];
    },
    addEventListener() {},
    removeEventListener() {}
  };

  const parentWindow = {
    location: {
      pathname: "/index.html",
      search: sharedSearch
    },
    postMessage(message) {
      parentMessages.push(message);
    }
  };

  const context = {
    console,
    Math,
    Number,
    URLSearchParams,
    document,
    history: {
      replaceState() {}
    },
    window: null,
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    ResizeObserver: null
  };

  context.window = {
    location: { pathname: "/pages/distance.html", search: "" },
    history: context.history,
    parent: parentWindow,
    top: parentWindow,
    matchMedia() {
      return {
        matches: false,
        addEventListener() {},
        addListener() {}
      };
    },
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    addEventListener() {}
  };
  context.window.window = context.window;
  context.window.document = document;

  vm.runInNewContext(pageMessagingScript, context);
  vm.runInNewContext(distanceScript, context);

  return {
    stage,
    sceneButtons,
    modeElement,
    parentMessages
  };
}

test("app shell resolves slide state from shared URL and keeps the query clean on navigation", () => {
  const harness = createAppHarness("?scene=relay");

  assert.equal(harness.navDots[5].getAttribute("aria-current"), "true");
  assert.equal(harness.progressIndicator.style.width, "54.54545454545454%");
  assert.match(harness.historyUrls[0], /slide=distance/);
  assert.match(harness.historyUrls[0], /scene=relay/);

  harness.clickNav(2);

  assert.equal(harness.navDots[2].getAttribute("aria-current"), "true");
  assert.match(harness.historyUrls[harness.historyUrls.length - 1], /slide=mesh/);
  assert.doesNotMatch(harness.historyUrls[harness.historyUrls.length - 1], /scene=/);
});

test("product showcase reads the shared product deep link and broadcasts later tab changes", () => {
  const harness = createProductHarness("?slide=products&product=call-point");

  assert.equal(harness.titleEl.textContent, "Wireless Manual Call Point");
  assert.equal(harness.buttons[3].getAttribute("aria-selected"), "true");

  harness.buttons[4].dispatchEvent({ type: "click" });

  const lastMessage = harness.parentMessages[harness.parentMessages.length - 1];
  assert.equal(lastMessage.type, "syncPresentationState");
  assert.equal(lastMessage.state.product, "av-alarm");
});

test("distance page reads the shared scene deep link and broadcasts scene changes", () => {
  const harness = createDistanceHarness("?slide=distance&scene=relay");

  assert.equal(harness.stage.dataset.scene, "relay");
  assert.equal(harness.sceneButtons[1].getAttribute("aria-selected"), "true");
  assert.equal(harness.modeElement.textContent, "MESH RELAY");

  harness.sceneButtons[1].dispatchEvent({
    type: "keydown",
    key: "Home",
    preventDefault() {
      this.defaultPrevented = true;
    }
  });

  assert.equal(harness.stage.dataset.scene, "open");
  const lastMessage = harness.parentMessages[harness.parentMessages.length - 1];
  assert.equal(lastMessage.type, "syncPresentationState");
  assert.equal(lastMessage.state.scene, "open");
});
