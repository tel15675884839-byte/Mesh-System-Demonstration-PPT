const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const meshPageScript = fs.readFileSync(path.join(rootDir, "js", "mesh-page.js"), "utf8");
const openingPageScript = fs.readFileSync(path.join(rootDir, "js", "opening-page.js"), "utf8");

function createClassList() {
  return {
    add() {},
    remove() {},
    toggle() {},
    contains() {
      return false;
    }
  };
}

function createElement(options) {
  const config = options || {};
  const listeners = new Map();

  return {
    id: config.id || "",
    dataset: Object.assign({}, config.dataset),
    classList: createClassList(),
    style: {},
    clientWidth: config.clientWidth || 0,
    clientHeight: config.clientHeight || 0,
    children: [],
    attributes: {},
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter((entry) => entry !== child);
      child.parentNode = null;
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
      return {
        left: 0,
        top: 0,
        width: this.clientWidth || 960,
        height: this.clientHeight || 540
      };
    }
  };
}

function createMeshContext() {
  const windowListeners = new Map();
  const frameCallbacks = [];
  const cancelledFrames = [];

  const page = createElement({ clientWidth: 960, clientHeight: 540 });
  const stage = createElement({
    id: "mesh-self-healing-stage",
    clientWidth: 960,
    clientHeight: 540
  });
  const canvas = createElement({
    id: "mesh-stage-canvas",
    clientWidth: 960,
    clientHeight: 540
  });

  const gradient = {
    addColorStop() {}
  };

  canvas.getContext = function () {
    return {
      save() {},
      restore() {},
      setTransform() {},
      clearRect() {},
      fillRect() {},
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      fill() {},
      arc() {},
      ellipse() {},
      roundRect() {},
      drawImage() {},
      setLineDash() {},
      fillText() {},
      strokeText() {},
      createLinearGradient() {
        return gradient;
      },
      createRadialGradient() {
        return gradient;
      },
      measureText() {
        return { width: 0 };
      }
    };
  };

  class InstantImage {
    constructor() {
      this.complete = true;
      this.naturalWidth = 128;
      this.naturalHeight = 128;
    }

    set src(_value) {
      if (typeof this.onload === "function") {
        queueMicrotask(() => this.onload());
      }
    }
  }

  const context = {
    console,
    Math,
    Date,
    Promise,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    queueMicrotask,
    document: {
      baseURI: "http://127.0.0.1:8765/pages/mesh.html",
      querySelector(selector) {
        if (selector === ".page-mesh") {
          return page;
        }
        if (selector === ".mesh-self-healing-stage") {
          return stage;
        }
        return null;
      },
      getElementById(id) {
        if (id === "mesh-self-healing-stage") {
          return stage;
        }
        if (id === "mesh-stage-canvas") {
          return canvas;
        }
        return null;
      }
    },
    Image: InstantImage,
    location: {
      search: "",
      href: "http://127.0.0.1:8765/pages/mesh.html"
    },
    requestAnimationFrame(callback) {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
    },
    cancelAnimationFrame(handle) {
      cancelledFrames.push(handle);
    },
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
    parent: {},
    Event: function Event(type) {
      this.type = type;
    }
  };

  context.window = context;

  return {
    context,
    canvas,
    dispatchMessage(data) {
      const handlers = windowListeners.get("message") || [];
      handlers.forEach((handler) => handler.call(context.window, { data }));
    },
    getScheduledFrameCount() {
      return frameCallbacks.length;
    },
    getCancelledFrames() {
      return cancelledFrames.slice();
    }
  };
}

function createOpeningPageHarness() {
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
            nodes: [{ id: "opening-node", position: { x: 0, y: 0, z: 0 } }],
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

  const openingStage = createElement({ className: "opening-stage" });
  const openingPlayerHost = createElement({ id: "opening-player-host" });
  const openingPlayerMessage = createElement({ id: "opening-player-message" });

  context.document.baseURI = "http://127.0.0.1:8765/pages/opening.html";
  context.location.href = context.document.baseURI;
  context.document.querySelector = function (selector) {
    if (selector === ".opening-stage") {
      return openingStage;
    }
    return null;
  };
  context.document.getElementById = function (id) {
    const elements = {
      "opening-player-host": openingPlayerHost,
      "opening-player-message": openingPlayerMessage
    };
    return elements[id] || null;
  };

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

function flushTasks() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

test("mesh page animation loop waits for slide activation and pauses on deactivate", async () => {
  const harness = createMeshContext();

  vm.runInNewContext(meshPageScript, harness.context, {
    filename: "mesh-page.js"
  });

  await flushTasks();

  assert.ok(
    harness.canvas.__meshController,
    "Expected mesh page bootstrap to attach its controller even before activation."
  );
  assert.equal(
    harness.getScheduledFrameCount(),
    0,
    "Expected the mesh stage to stay idle until the slide becomes active."
  );

  harness.dispatchMessage({ type: "slideVisibility", active: true });

  assert.equal(
    harness.getScheduledFrameCount(),
    1,
    "Expected the mesh stage to request animation frames only after slide activation."
  );

  harness.dispatchMessage({ type: "slideVisibility", active: false });

  assert.deepEqual(
    harness.getCancelledFrames(),
    [1],
    "Expected the mesh stage to cancel its queued frame when the slide becomes inactive."
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
