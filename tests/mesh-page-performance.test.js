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
    }
  };
}

function createElement(options) {
  const config = options || {};
  const listeners = new Map();
  let rectCallCount = 0;
  let currentRect = Object.assign(
    {
      left: 0,
      top: 0,
      width: config.clientWidth || 960,
      height: config.clientHeight || 540
    },
    config.rect
  );

  const element = {
    id: config.id || "",
    dataset: Object.assign({}, config.dataset),
    classList: createClassList(config.className),
    style: {},
    width: config.width || 0,
    height: config.height || 0,
    clientWidth: config.clientWidth || 0,
    clientHeight: config.clientHeight || 0,
    appendChild() {},
    setAttribute() {},
    removeAttribute() {},
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((handler) => handler.call(this, event));
    },
    getBoundingClientRect() {
      rectCallCount += 1;
      return Object.assign({}, currentRect);
    },
    __setRect(nextRect) {
      currentRect = Object.assign({}, currentRect, nextRect);
    },
    __getRectCallCount() {
      return rectCallCount;
    }
  };

  return element;
}

function createContext2dStub() {
  const gradient = {
    addColorStop() {}
  };

  return {
    save() {},
    restore() {},
    translate() {},
    scale() {},
    rotate() {},
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
    measureText(text) {
      return { width: String(text || "").length * 8 };
    }
  };
}

function flushTasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createHarness() {
  const windowListeners = new Map();
  const page = createElement({ className: "page page-mesh is-revealed" });
  const stage = createElement({
    id: "mesh-self-healing-stage",
    className: "mesh-self-healing-stage",
    clientWidth: 960,
    clientHeight: 540,
    rect: {
      left: 40,
      top: 30,
      width: 960,
      height: 540
    }
  });
  const canvas = createElement({
    id: "mesh-stage-canvas",
    className: "mesh-stage-canvas",
    clientWidth: 960,
    clientHeight: 540,
    rect: {
      left: 40,
      top: 30,
      width: 960,
      height: 540
    }
  });
  canvas.getContext = function () {
    return createContext2dStub();
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
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {},
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    removeEventListener() {},
    parent: {},
    Event: function Event(type) {
      this.type = type;
    }
  };

  context.window = context;

  return {
    context,
    canvas,
    stage,
    dispatchResize() {
      const handlers = windowListeners.get("resize") || [];
      handlers.forEach((handler) => handler.call(context.window));
    }
  };
}

test("mesh page reuses cached canvas bounds for pointer interactions and refreshes them on resize", async () => {
  const harness = createHarness();

  vm.runInNewContext(meshPageScript, harness.context, {
    filename: "mesh-page.js"
  });

  await flushTasks();

  const controller = harness.canvas.__meshController;
  assert.ok(controller, "Expected mesh page bootstrap to expose a controller for the canvas stage.");

  const firstEdgePoint = controller.getEdgeMidpoint(3, 0);
  const initialRectReads = harness.canvas.__getRectCallCount();

  harness.canvas.dispatchEvent({
    type: "pointermove",
    clientX: harness.stage.getBoundingClientRect().left + firstEdgePoint.x,
    clientY: harness.stage.getBoundingClientRect().top + firstEdgePoint.y
  });
  harness.canvas.dispatchEvent({
    type: "pointerdown",
    button: 0,
    clientX: harness.stage.getBoundingClientRect().left + firstEdgePoint.x,
    clientY: harness.stage.getBoundingClientRect().top + firstEdgePoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  assert.equal(
    harness.canvas.__getRectCallCount(),
    initialRectReads,
    "Expected pointer interactions to reuse cached canvas bounds instead of forcing new layout reads."
  );

  const brokenPrimaryEdge = controller.getSnapshot().edges.find((edge) => edge.source === 3 && edge.target === 0);
  assert.equal(brokenPrimaryEdge.broken, true);

  harness.stage.__setRect({ left: 180, top: 120 });
  harness.canvas.__setRect({ left: 180, top: 120 });
  harness.dispatchResize();

  const secondEdgePoint = controller.getEdgeMidpoint(4, 0);

  harness.canvas.dispatchEvent({
    type: "pointerdown",
    button: 0,
    clientX: 180 + secondEdgePoint.x,
    clientY: 120 + secondEdgePoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  const brokenSecondaryEdge = controller.getSnapshot().edges.find((edge) => edge.source === 4 && edge.target === 0);
  assert.equal(
    brokenSecondaryEdge.broken,
    true,
    "Expected cached pointer bounds to refresh after resize so the relocated stage stays interactive."
  );
});
