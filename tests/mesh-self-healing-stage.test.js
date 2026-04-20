const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const meshHtml = fs.readFileSync(path.join(rootDir, "pages", "mesh.html"), "utf8");
const meshCss = fs.readFileSync(path.join(rootDir, "css", "pages", "mesh.css"), "utf8");
const meshScript = fs.readFileSync(path.join(rootDir, "js", "mesh-page.js"), "utf8");

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
    style: {},
    hidden: false,
    textContent: "",
    innerHTML: "",
    attributes: {},
    children: [],
    width: config.width || 0,
    height: config.height || 0,
    clientWidth: config.clientWidth || 0,
    clientHeight: config.clientHeight || 0,
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
      return !event.defaultPrevented;
    },
    getBoundingClientRect() {
      return Object.assign(
        {
          left: 0,
          top: 0,
          width: this.clientWidth || 960,
          height: this.clientHeight || 540
        },
        config.rect
      );
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

function createMeshHarness() {
  const frameCallbacks = [];
  const windowListeners = new Map();

  const page = createElement({ className: "page page-mesh is-revealed" });
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

  const document = {
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
    },
    addEventListener() {},
    removeEventListener() {}
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

    get src() {
      return this._src;
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
    document,
    Image: InstantImage,
    location: {
      search: "",
      href: "http://127.0.0.1:8765/pages/mesh.html"
    },
    requestAnimationFrame(callback) {
      frameCallbacks.push(callback);
      return frameCallbacks.length;
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
    runNextFrame() {
      const callback = frameCallbacks.shift();
      if (callback) {
        callback(16);
      }
    }
  };
}

test("mesh page replaces the old player UI with a single self-healing stage", () => {
  assert.match(meshHtml, /<h2>Mesh Communication<\/h2>/);
  assert.match(meshHtml, /class="mesh-self-healing-stage" id="mesh-self-healing-stage"/);
  assert.match(meshHtml, /<canvas class="mesh-stage-canvas" id="mesh-stage-canvas"/);

  assert.doesNotMatch(
    meshHtml,
    /mesh-intro-overlay|mesh-stage-controls|mode-button|mesh-recovery-switch|mesh-status-panel|mesh-player-host|mesh-player-message/,
    "Expected Mesh Communication to remove the borrowed 3D player UI and keep only the title plus the new stage."
  );

  assert.match(meshCss, /\.mesh-self-healing-stage\s*\{/);
  assert.match(meshCss, /\.mesh-stage-canvas\s*\{/);
  assert.doesNotMatch(
    meshCss,
    /\.mesh-controls\s*\{|\.mesh-recovery-switch\s*\{|\.mesh-status-panel\s*\{|\.mesh-player-host\s*\{/,
    "Expected mesh CSS to drop the old player control styling."
  );
});

test("mesh self-healing stage breaks only sub links and reroutes to the backup path", async () => {
  const harness = createMeshHarness();

  vm.runInNewContext(meshScript, harness.context, {
    filename: "mesh-page.js"
  });

  await flushTasks();
  harness.runNextFrame();

  const controller = harness.canvas.__meshController;
  assert.ok(controller, "Expected mesh stage script to attach a testable controller to the canvas.");

  const beforeBreak = controller.getSnapshot();
  const primaryLink = beforeBreak.edges.find((edge) => edge.source === 3 && edge.target === 0);
  const backupLink = beforeBreak.edges.find((edge) => edge.source === 3 && edge.target === 1);
  const mainLink = beforeBreak.edges.find((edge) => edge.type === "main");

  assert.equal(primaryLink.active, true);
  assert.equal(backupLink.active, false);

  const primaryPoint = controller.getEdgeMidpoint(3, 0);
  harness.canvas.dispatchEvent({
    type: "pointerdown",
    button: 0,
    clientX: primaryPoint.x,
    clientY: primaryPoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  const afterBreak = controller.getSnapshot();
  assert.equal(
    afterBreak.edges.find((edge) => edge.source === 3 && edge.target === 0).broken,
    true,
    "Expected left click on a sub link to mark that branch as broken."
  );
  assert.equal(
    afterBreak.edges.find((edge) => edge.source === 3 && edge.target === 1).active,
    true,
    "Expected the child node to reroute onto its backup link after the primary branch breaks."
  );

  const mainPoint = controller.getEdgeMidpoint(mainLink.source, mainLink.target);
  harness.canvas.dispatchEvent({
    type: "pointerdown",
    button: 0,
    clientX: mainPoint.x,
    clientY: mainPoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  const afterMainAttempt = controller.getSnapshot();
  assert.equal(
    afterMainAttempt.edges.find((edge) => edge.source === mainLink.source && edge.target === mainLink.target).broken,
    false,
    "Expected the core triangle to stay non-interactive."
  );

  harness.canvas.dispatchEvent({
    type: "contextmenu",
    button: 2,
    clientX: primaryPoint.x,
    clientY: primaryPoint.y,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {}
  });

  const afterRecover = controller.getSnapshot();
  assert.equal(
    afterRecover.edges.find((edge) => edge.source === 3 && edge.target === 0).broken,
    false,
    "Expected right click on a broken sub link to restore that branch."
  );
});

test("mesh stage removes flash feedback, halves particles, speeds them up, and drops sub-node shells", async () => {
  const harness = createMeshHarness();

  vm.runInNewContext(meshScript, harness.context, {
    filename: "mesh-page.js"
  });

  await flushTasks();

  const controller = harness.canvas.__meshController;
  assert.ok(controller, "Expected mesh stage script to attach a testable controller to the canvas.");

  const beforeInteraction = controller.getDiagnostics();
  assert.equal(
    beforeInteraction.flashIntensity,
    0,
    "Expected the idle mesh stage to avoid any fullscreen flash overlay."
  );
  assert.equal(
    beforeInteraction.mainParticlesPerEdge,
    2,
    "Expected each main link to render roughly half the previous particle count."
  );
  assert.equal(
    beforeInteraction.subParticlesPerEdge,
    1,
    "Expected each sub link to render roughly half the previous particle count."
  );
  assert.ok(
    beforeInteraction.subParticleSpeed > 3.7,
    "Expected the sub-link particle flow to be 10x faster than the earlier 0.374 baseline."
  );
  assert.ok(
    beforeInteraction.mainParticleSpeed > 3,
    "Expected the main-link particle flow to be 10x faster than the earlier 0.306 baseline."
  );
  assert.equal(
    beforeInteraction.subNodeShellVisible,
    false,
    "Expected device nodes to render without the circular shell or glow base."
  );

  const primaryPoint = controller.getEdgeMidpoint(3, 0);
  harness.canvas.dispatchEvent({
    type: "pointerdown",
    button: 0,
    clientX: primaryPoint.x,
    clientY: primaryPoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  const afterBreak = controller.getDiagnostics();
  assert.equal(
    afterBreak.flashIntensity,
    0,
    "Expected breaking a branch to avoid flashing the whole stage red."
  );

  harness.canvas.dispatchEvent({
    type: "contextmenu",
    button: 2,
    clientX: primaryPoint.x,
    clientY: primaryPoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  const afterRecover = controller.getDiagnostics();
  assert.equal(
    afterRecover.flashIntensity,
    0,
    "Expected recovering a branch to avoid flashing the whole stage green."
  );
});

test("mesh communication stage adds smaller sounders below nodes 1 and 2 with mesh particle links", async () => {
  const harness = createMeshHarness();

  vm.runInNewContext(meshScript, harness.context, {
    filename: "mesh-page.js"
  });

  await flushTasks();

  const controller = harness.canvas.__meshController;
  assert.ok(controller, "Expected mesh stage script to attach a testable controller to the canvas.");

  const snapshot = controller.getSnapshot();
  const node1 = snapshot.nodes.find((node) => node.id === 1);
  const node2 = snapshot.nodes.find((node) => node.id === 2);

  assert.equal(node1.accessoryIcons.join(","), "sounder", "Expected node 1 to add a sounder accessory.");
  assert.equal(node2.accessoryIcons.join(","), "sounder", "Expected node 2 to add a sounder accessory.");
  assert.equal(node1.accessoryLayout, "below", "Expected node 1 sounder to sit below the main device.");
  assert.equal(node2.accessoryLayout, "below", "Expected node 2 sounder to sit below the main device.");
  assert.equal(node1.accessoryOffsetY, node2.accessoryOffsetY, "Expected node 1 and 2 sounders to stay aligned.");
  assert.ok(node1.accessoryOffsetY > 100, "Expected node 1 sounder to sit clearly below the main device.");
  assert.equal(node1.accessorySizeScale, 0.7, "Expected node 1 sounder icon to be 30% smaller.");
  assert.equal(node2.accessorySizeScale, 0.7, "Expected node 2 sounder icon to be 30% smaller.");

  assert.equal(
    JSON.stringify(
      snapshot.edges
        .filter((edge) => edge.type === "sounder")
        .map((edge) => ({ source: edge.source, target: edge.target, targetAccessory: edge.targetAccessory, active: edge.active }))
    ),
    JSON.stringify([
      { source: 1, target: 1, targetAccessory: true, active: true },
      { source: 2, target: 2, targetAccessory: true, active: true },
      { source: 1, target: 2, targetAccessory: true, active: false },
      { source: 2, target: 1, targetAccessory: true, active: false }
    ]),
    "Expected each sounder to start with one active primary mesh link and one inactive backup link."
  );

  const primaryPoint = controller.getEdgeMidpoint(1, 1, true);
  assert.ok(primaryPoint, "Expected sounder primary mesh link to expose a midpoint for interaction.");

  harness.canvas.dispatchEvent({
    type: "pointerdown",
    button: 0,
    clientX: primaryPoint.x,
    clientY: primaryPoint.y,
    preventDefault() {},
    stopPropagation() {}
  });

  const afterBreak = controller.getSnapshot();
  assert.equal(
    afterBreak.edges.find((edge) => edge.type === "sounder" && edge.source === 1 && edge.target === 1).broken,
    true,
    "Expected disabling the primary sounder link to mark it broken."
  );
  assert.equal(
    afterBreak.edges.find((edge) => edge.type === "sounder" && edge.source === 1 && edge.target === 2).active,
    true,
    "Expected the sounder to switch particle communication to the backup link."
  );

  const diagnostics = controller.getDiagnostics();
  assert.equal(diagnostics.sounderParticlesPerEdge, 1, "Expected sounder mesh links to use moving particle flow.");
  assert.equal(diagnostics.alarmLinksVisible, false, "Expected the previous red alarm overlay to be removed.");
});
