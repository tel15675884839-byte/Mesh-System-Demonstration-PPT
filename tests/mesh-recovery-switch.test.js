const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const meshPageScript = fs.readFileSync(path.join(rootDir, "js", "mesh-page.js"), "utf8");

function createElement(options) {
  const config = options || {};
  const listeners = new Map();

  return {
    id: config.id || "",
    className: config.className || "",
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      }
    },
    style: {},
    width: 0,
    height: 0,
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
      return {
        left: 0,
        top: 0,
        width: this.clientWidth || 960,
        height: this.clientHeight || 540
      };
    }
  };
}

function createContext2dStub() {
  const gradient = {
    addColorStop() {}
  };

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
    roundRect() {},
    drawImage() {},
    setLineDash() {},
    createLinearGradient() {
      return gradient;
    },
    createRadialGradient() {
      return gradient;
    }
  };
}

function flushTasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function createMeshHarness() {
  const page = createElement({ className: "page page-mesh is-revealed" });
  page.classList.add = function () {};

  const stage = createElement({
    id: "mesh-self-healing-stage",
    className: "mesh-self-healing-stage",
    clientWidth: 960,
    clientHeight: 540
  });
  const canvas = createElement({
    id: "mesh-stage-canvas",
    className: "mesh-stage-canvas",
    clientWidth: 960,
    clientHeight: 540
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

    set src(value) {
      this._src = value;
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
    addEventListener() {},
    removeEventListener() {},
    parent: {},
    Event: function Event(type) {
      this.type = type;
    }
  };

  context.window = context;

  return {
    context,
    canvas
  };
}

test("mesh branch recovery reuses the existing stage controller", async () => {
  const harness = createMeshHarness();

  vm.runInNewContext(meshPageScript, harness.context, {
    filename: "mesh-page.js"
  });

  await flushTasks();

  const controller = harness.canvas.__meshController;
  assert.ok(controller, "Expected mesh page bootstrap to attach a controller to the stage canvas.");

  const primaryPoint = controller.getEdgeMidpoint(3, 0);

  harness.canvas.dispatchEvent({
    type: "pointerdown",
    button: 0,
    clientX: primaryPoint.x,
    clientY: primaryPoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  harness.canvas.dispatchEvent({
    type: "contextmenu",
    button: 2,
    clientX: primaryPoint.x,
    clientY: primaryPoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  assert.equal(
    harness.canvas.__meshController,
    controller,
    "Expected branch recovery to update the current stage instead of recreating the controller."
  );
});
