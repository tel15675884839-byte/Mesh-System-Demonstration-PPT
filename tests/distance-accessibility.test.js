const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const distanceHtml = fs.readFileSync(path.join(rootDir, "pages", "distance.html"), "utf8");
const distanceScript = fs.readFileSync(path.join(rootDir, "js", "distance-page.js"), "utf8");
const distanceCss = fs.readFileSync(path.join(rootDir, "css", "pages", "distance.css"), "utf8");

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
      }
    },
    attributes: Object.assign({}, config.attributes),
    focused: false,
    textContent: config.textContent || "",
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
      event.currentTarget = this;
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((handler) => handler.call(this, event));
      return !event.defaultPrevented;
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
    },
    focus() {
      this.focused = true;
    }
  };
}

function createDistanceHarness() {
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
      dataset: { sceneTarget: "open" },
      attributes: {
        "aria-selected": "true",
        tabindex: "0"
      }
    }),
    createElement({
      className: "scene-toggle",
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
    return [];
  };

  const document = {
    hidden: false,
    querySelector(selector) {
      if (selector === ".page-distance") {
        return page;
      }
      return null;
    },
    addEventListener() {},
    removeEventListener() {}
  };

  const windowListeners = new Map();
  const context = {
    console,
    Math,
    Number,
    URLSearchParams,
    document,
    window: null,
    setTimeout(fn) {
      return 1;
    },
    clearTimeout() {}
  };

  context.window = {
    location: { search: "" },
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
    setTimeout(fn) {
      return 1;
    },
    clearTimeout() {},
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    }
  };
  context.window.window = context.window;
  context.window.document = document;

  vm.runInNewContext(distanceScript, context);

  return {
    stage,
    sceneButtons,
    openScene,
    relayScene
  };
}

test("distance scene switch markup is wired as a tablist with labelled tabpanels", () => {
  assert.match(distanceHtml, /class="distance-stage-controls" role="tablist"/);
  assert.match(distanceHtml, /id="distance-scene-tab-open"[\s\S]*role="tab"/);
  assert.match(distanceHtml, /id="distance-scene-tab-relay"[\s\S]*role="tab"/);
  assert.match(distanceHtml, /id="distance-scene-open"[\s\S]*role="tabpanel"[\s\S]*aria-labelledby="distance-scene-tab-open"/);
  assert.match(distanceHtml, /id="distance-scene-relay"[\s\S]*role="tabpanel"[\s\S]*aria-labelledby="distance-scene-tab-relay"/);
  assert.match(distanceCss, /\.scene-toggle:focus-visible\s*\{/);
});

test("distance scene switch supports arrow and Home\/End keyboard navigation with roving tabindex", () => {
  const harness = createDistanceHarness();

  harness.sceneButtons[0].dispatchEvent({
    type: "keydown",
    key: "ArrowRight",
    preventDefault() {
      this.defaultPrevented = true;
    }
  });

  assert.equal(harness.stage.dataset.scene, "relay");
  assert.equal(harness.sceneButtons[1].getAttribute("aria-selected"), "true");
  assert.equal(harness.sceneButtons[1].getAttribute("tabindex"), "0");
  assert.equal(harness.sceneButtons[0].getAttribute("tabindex"), "-1");
  assert.equal(harness.openScene.getAttribute("aria-hidden"), "true");
  assert.equal(harness.relayScene.getAttribute("aria-hidden"), "false");

  harness.sceneButtons[1].dispatchEvent({
    type: "keydown",
    key: "Home",
    preventDefault() {
      this.defaultPrevented = true;
    }
  });

  assert.equal(harness.stage.dataset.scene, "open");
  assert.equal(harness.sceneButtons[0].getAttribute("aria-selected"), "true");

  harness.sceneButtons[0].dispatchEvent({
    type: "keydown",
    key: "End",
    preventDefault() {
      this.defaultPrevented = true;
    }
  });

  assert.equal(harness.stage.dataset.scene, "relay");
  assert.equal(harness.sceneButtons[1].focused, true);
});
