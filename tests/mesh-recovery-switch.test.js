const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const meshPageScript = fs.readFileSync(path.join(rootDir, "js", "mesh-page.js"), "utf8");

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
    },
    toString() {
      return Array.from(classes).join(" ");
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
  const classList = createClassList(config.className);
  const element = {
    id: config.id || "",
    dataset: Object.assign({}, config.dataset),
    style: createStyle(),
    classList,
    hidden: false,
    disabled: false,
    title: "",
    textContent: "",
    innerHTML: "",
    children: [],
    attributes: {},
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
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
    click() {
      this.dispatchEvent({
        type: "click",
        currentTarget: this,
        target: this
      });
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
  return element;
}

function flushTasks() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function createMeshPageHarness() {
  const instances = [];
  let destroyedCount = 0;

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
  page.querySelector = function (selector) {
    if (selector === ".mesh-intro-title") {
      return introTitle;
    }
    if (selector === ".mesh-hero h2") {
      return heroTitle;
    }
    return null;
  };

  const introTrigger = createElement({ id: "mesh-intro-trigger" });
  const meshStage = createElement({ className: "mesh-stage" });
  const meshPlayerHost = createElement({ id: "mesh-player-host" });
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

  const windowListeners = new Map();
  const documentHead = createElement({ id: "head" });
  const documentBody = createElement({ id: "body" });

  class StubMeshScenePlayer {
    constructor(options) {
      this.options = options;
      this.switchCalls = [];
      instances.push(this);
    }

    preload() {
      return Promise.resolve(this);
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

    switchMode(mode) {
      this.switchCalls.push(mode);
      return Promise.resolve(true);
    }

    destroy() {
      destroyedCount += 1;
    }
  }

  class InstantImage {
    set src(_value) {
      if (typeof this.onload === "function") {
        queueMicrotask(() => this.onload());
      }
    }
  }

  const document = {
    baseURI: "http://127.0.0.1:8765/pages/mesh.html",
    head: documentHead,
    body: documentBody,
    querySelector(selector) {
      if (selector === ".page-mesh") {
        return page;
      }
      if (selector === ".mesh-stage") {
        return meshStage;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".mode-button") {
        return modeButtons;
      }
      if (selector === ".mesh-recovery-result") {
        return recoveryButtons;
      }
      return [];
    },
    getElementById(id) {
      const elementsById = {
        "mesh-intro-trigger": introTrigger,
        "mesh-player-host": meshPlayerHost,
        "mesh-player-message": meshPlayerMessage,
        "mesh-status-title": titleElement,
        "mesh-recovery-switch": recoverySwitch
      };
      return elementsById[id] || null;
    },
    createElement(tagName) {
      return createElement({ tagName: String(tagName || "").toLowerCase() });
    }
  };

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
    document,
    Image: InstantImage,
    location: {
      protocol: "http:",
      search: "",
      href: "http://127.0.0.1:8765/pages/mesh.html"
    },
    localStorage: {
      getItem() {
        return null;
      }
    },
    matchMedia() {
      return { matches: false };
    },
    requestAnimationFrame(callback) {
      callback(0);
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
    parent: {},
    THREE: { OrbitControls: function OrbitControls() {} },
    LinkEffects: {},
    MeshScenePlayer: StubMeshScenePlayer
  };

  context.window = context;

  return {
    context,
    controls: {
      modeButtons,
      recoveryButtons
    },
    getInstanceCount() {
      return instances.length;
    },
    getDestroyedCount() {
      return destroyedCount;
    },
    getSwitchCalls() {
      return instances.length > 0 ? instances[0].switchCalls.slice() : [];
    }
  };
}

test("switching auto recovery result does not recreate the mesh player", async () => {
  const harness = createMeshPageHarness();
  vm.runInNewContext(meshPageScript, harness.context, {
    filename: "mesh-page.js"
  });

  await flushTasks();
  await flushTasks();

  assert.equal(
    harness.getInstanceCount(),
    1,
    "Expected mesh page bootstrap to create one player instance."
  );

  harness.controls.modeButtons[2].click();
  await flushTasks();

  harness.controls.recoveryButtons[1].click();
  await flushTasks();
  await flushTasks();

  assert.equal(
    harness.getDestroyedCount(),
    0,
    "Expected recovery result switching to reuse the existing player instance."
  );
  assert.equal(
    harness.getInstanceCount(),
    1,
    "Expected recovery result switching to avoid constructing a second player."
  );
  assert.equal(
    harness.getSwitchCalls().at(-1),
    "recovery-2",
    "Expected the existing player instance to switch into the second recovery state."
  );
});
