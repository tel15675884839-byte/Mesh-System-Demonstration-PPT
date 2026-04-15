const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const meshPageScript = fs.readFileSync(path.join(rootDir, "js", "mesh-page.js"), "utf8");
const openingPageScript = fs.readFileSync(path.join(rootDir, "js", "opening-page.js"), "utf8");

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

function createStyle() {
  return {
    setProperty(name, value) {
      this[name] = value;
    }
  };
}

function createElement(options) {
  const config = options || {};
  const listeners = new Map();
  return {
    id: config.id || "",
    dataset: Object.assign({}, config.dataset),
    style: createStyle(),
    classList: createClassList(config.className),
    hidden: false,
    disabled: false,
    textContent: "",
    innerHTML: "",
    attributes: {},
    children: [],
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      if (typeof child.onload === "function" && child.tagName === "script") {
        queueMicrotask(() => child.onload());
      }
      return child;
    },
    remove() {
      if (this.parentNode && Array.isArray(this.parentNode.children)) {
        this.parentNode.children = this.parentNode.children.filter((entry) => entry !== this);
      }
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
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
      return true;
    },
    getBoundingClientRect() {
      return Object.assign(
        {
          left: 0,
          top: 0,
          width: 100,
          height: 40
        },
        config.rect
      );
    },
    querySelector(selector) {
      if (!config.queryMap) {
        return null;
      }
      return config.queryMap[selector] || null;
    }
  };
}

function flushTasks() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function createBaseWindowContext() {
  const windowListeners = new Map();
  const documentHead = createElement({ id: "head" });
  const documentBody = createElement({ id: "body" });

  class StubMeshScenePlayer {
    constructor(options) {
      this.options = options;
      this.switchCalls = [];
      this.activeCalls = [];
      this.preloadCalls = 0;
      this.destroyCalls = 0;
      StubMeshScenePlayer.instances.push(this);
    }

    preload() {
      this.preloadCalls += 1;
      return Promise.resolve(this);
    }

    switchMode(mode) {
      this.switchCalls.push(mode);
      return Promise.resolve(true);
    }

    setActive(isActive) {
      this.activeCalls.push(isActive);
    }

    destroy() {
      this.destroyCalls += 1;
    }

    getStateAvailability() {
      return {
        normal: { ok: true },
        blocked: { ok: true },
        recovery: { ok: true },
        "recovery-2": { ok: true },
        diagnostic: { ok: false }
      };
    }
  }

  StubMeshScenePlayer.instances = [];

  class InstantImage {
    set src(_value) {
      if (typeof this.onload === "function") {
        queueMicrotask(() => this.onload());
      }
    }
  }

  const context = {
    console,
    URL,
    URLSearchParams,
    Promise,
    Math,
    Date,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    document: {
      baseURI: "http://127.0.0.1:8765/",
      head: documentHead,
      body: documentBody,
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getElementById() {
        return null;
      },
      createElement(tagName) {
        return createElement({ tagName: String(tagName || "").toLowerCase() });
      }
    },
    Image: InstantImage,
    HTMLElement: function HTMLElement() {},
    location: {
      protocol: "http:",
      search: "",
      href: "http://127.0.0.1:8765/"
    },
    localStorage: {
      getItem() {
        return null;
      }
    },
    fetch: async function () {
      return {
        ok: true,
        text: async function () {
          return JSON.stringify({
            version: 1,
            nodes: [
              { id: "opening-node", position: { x: 0, y: 0, z: 0 } }
            ],
            devices: []
          });
        }
      };
    },
    matchMedia() {
      return { matches: false };
    },
    requestAnimationFrame(callback) {
      queueMicrotask(() => callback(0));
      return 1;
    },
    cancelAnimationFrame() {},
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    removeEventListener() {},
    dispatchEvent(event) {
      const handlers = windowListeners.get(event.type) || [];
      handlers.forEach((handler) => handler.call(context.window, event));
      return true;
    },
    Event: function Event(type) {
      this.type = type;
    },
    ResizeObserver: function ResizeObserver() {
      this.observe = function () {};
      this.disconnect = function () {};
    },
    parent: {},
    THREE: {
      OrbitControls: function OrbitControls() {},
      MathUtils: {
        clamp(value, min, max) {
          return Math.min(Math.max(value, min), max);
        }
      }
    },
    LinkEffects: {},
    MeshScenePlayer: StubMeshScenePlayer
  };

  context.window = context;

  return {
    context,
    dispatchMessage(data) {
      const handlers = windowListeners.get("message") || [];
      handlers.forEach((handler) => handler.call(context.window, { data }));
    },
    getInstances() {
      return StubMeshScenePlayer.instances.slice();
    }
  };
}

function createMeshPageHarness() {
  const harness = createBaseWindowContext();
  const introTitle = createElement({
    className: "mesh-intro-title",
    rect: { left: 40, top: 30, width: 160, height: 28 }
  });
  const heroTitle = createElement({
    rect: { left: 120, top: 80, width: 220, height: 44 }
  });
  const page = createElement({
    className: "page-mesh",
    rect: { left: 0, top: 0, width: 1280, height: 720 }
  });
  const introTrigger = createElement({ id: "mesh-intro-trigger" });
  const meshStage = createElement({ className: "mesh-stage" });
  const meshPlayerHost = createElement({ id: "mesh-player-host" });
  meshPlayerHost.clientWidth = 960;
  meshPlayerHost.clientHeight = 540;
  const meshPlayerMessage = createElement({ id: "mesh-player-message" });
  const titleElement = createElement({ id: "mesh-status-title" });
  const recoverySwitch = createElement({ id: "mesh-recovery-switch" });
  const modeButtons = [
    createElement({ className: "mode-button active", dataset: { mode: "normal" } }),
    createElement({ className: "mode-button", dataset: { mode: "blocked" } }),
    createElement({ className: "mode-button", dataset: { mode: "recovery" } })
  ];
  const recoveryButtons = [
    createElement({ className: "mesh-recovery-result active", dataset: { recoveryResult: "1" } }),
    createElement({ className: "mesh-recovery-result", dataset: { recoveryResult: "2" } })
  ];

  page.querySelector = function (selector) {
    if (selector === ".mesh-intro-title") {
      return introTitle;
    }
    if (selector === ".mesh-hero h2") {
      return heroTitle;
    }
    return null;
  };

  harness.context.document.baseURI = "http://127.0.0.1:8765/pages/mesh.html";
  harness.context.location.href = harness.context.document.baseURI;
  harness.context.document.querySelector = function (selector) {
    if (selector === ".page-mesh") {
      return page;
    }
    if (selector === ".mesh-stage") {
      return meshStage;
    }
    return null;
  };
  harness.context.document.querySelectorAll = function (selector) {
    if (selector === ".mode-button") {
      return modeButtons;
    }
    if (selector === ".mesh-recovery-result") {
      return recoveryButtons;
    }
    return [];
  };
  harness.context.document.getElementById = function (id) {
    const elements = {
      "mesh-intro-trigger": introTrigger,
      "mesh-player-host": meshPlayerHost,
      "mesh-player-message": meshPlayerMessage,
      "mesh-status-title": titleElement,
      "mesh-recovery-switch": recoverySwitch
    };
    return elements[id] || null;
  };

  return harness;
}

function createOpeningPageHarness() {
  const harness = createBaseWindowContext();
  const openingStage = createElement({ className: "opening-stage" });
  const openingPlayerHost = createElement({ id: "opening-player-host" });
  const openingPlayerMessage = createElement({ id: "opening-player-message" });

  harness.context.document.baseURI = "http://127.0.0.1:8765/pages/opening.html";
  harness.context.location.href = harness.context.document.baseURI;
  harness.context.document.querySelector = function (selector) {
    if (selector === ".opening-stage") {
      return openingStage;
    }
    return null;
  };
  harness.context.document.getElementById = function (id) {
    const elements = {
      "opening-player-host": openingPlayerHost,
      "opening-player-message": openingPlayerMessage
    };
    return elements[id] || null;
  };

  return harness;
}

test("mesh page does not bootstrap the 3D player until the slide becomes active", async () => {
  const harness = createMeshPageHarness();

  vm.runInNewContext(meshPageScript, harness.context, {
    filename: "mesh-page.js"
  });

  await flushTasks();
  await flushTasks();

  assert.equal(
    harness.getInstances().length,
    0,
    "Expected mesh page bootstrap to stay idle before the slide receives an active visibility message."
  );

  harness.dispatchMessage({ type: "slideVisibility", active: true });
  await flushTasks();
  await flushTasks();

  assert.equal(
    harness.getInstances().length,
    1,
    "Expected mesh page to create its player only after becoming the active slide."
  );

  harness.dispatchMessage({ type: "slideVisibility", active: false });
  await flushTasks();

  assert.deepEqual(
    harness.getInstances()[0].activeCalls,
    [true, false],
    "Expected mesh page to pause its player after the slide becomes inactive again."
  );
});

test("opening page does not bootstrap the 3D player until the slide becomes active", async () => {
  const harness = createOpeningPageHarness();

  vm.runInNewContext(openingPageScript, harness.context, {
    filename: "opening-page.js"
  });

  await flushTasks();
  await flushTasks();

  assert.equal(
    harness.getInstances().length,
    0,
    "Expected opening page bootstrap to stay idle before the slide receives an active visibility message."
  );

  harness.dispatchMessage({ type: "slideVisibility", active: true });
  await flushTasks();
  await flushTasks();

  assert.equal(
    harness.getInstances().length,
    1,
    "Expected opening page to create its player only after becoming the active slide."
  );

  harness.dispatchMessage({ type: "slideVisibility", active: false });
  await flushTasks();

  assert.deepEqual(
    harness.getInstances()[0].activeCalls,
    [true, false],
    "Expected opening page to pause its player after the slide becomes inactive again."
  );
});
