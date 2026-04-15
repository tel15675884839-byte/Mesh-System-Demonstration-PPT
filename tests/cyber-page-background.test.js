const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const cyberBackgroundScript = fs.readFileSync(
  path.join(rootDir, "js", "cyber-page-background.js"),
  "utf8"
);

function createCanvasContextStub() {
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
    fillText() {},
    createLinearGradient() {
      return gradient;
    },
    createRadialGradient() {
      return gradient;
    }
  };
}

function createHarness(options) {
  const config = options || {};
  const windowListeners = new Map();
  const documentListeners = new Map();
  const scheduledFrames = [];
  const cancelledFrames = [];

  const canvas = {
    clientWidth: config.width || 360,
    clientHeight: config.height || 220,
    width: 0,
    height: 0,
    style: {},
    className: "cyber-page-background-canvas",
    getContext: config.disableContext
      ? () => null
      : () => createCanvasContextStub()
  };

  const container = {
    className: "cyber-page-background",
    hasAttribute(name) {
      return name === "data-cyber-bg-force-active" && Boolean(config.forceActive);
    },
    querySelector(selector) {
      if (selector === "canvas") {
        return canvas;
      }
      return null;
    }
  };

  const context = {
    console,
    Math,
    Date,
    setTimeout,
    clearTimeout
  };

  context.document = {
    hidden: false,
    querySelectorAll(selector) {
      if (selector === "[data-cyber-bg]") {
        return [container];
      }
      return [];
    },
    addEventListener(type, handler) {
      const handlers = documentListeners.get(type) || [];
      handlers.push(handler);
      documentListeners.set(type, handlers);
    },
    removeEventListener() {}
  };

  context.window = {
    innerWidth: config.width || 360,
    innerHeight: config.height || 220,
    devicePixelRatio: 1,
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    removeEventListener() {},
    requestAnimationFrame(callback) {
      const handle = scheduledFrames.length + 1;
      scheduledFrames.push({ handle, callback });
      return handle;
    },
    cancelAnimationFrame(handle) {
      cancelledFrames.push(handle);
    }
  };

  context.window.parent = config.inIframe ? {} : context.window;

  return {
    context,
    canvas,
    dispatchWindowEvent(type, event) {
      const handlers = windowListeners.get(type) || [];
      handlers.forEach((handler) => handler.call(context.window, event || { type }));
    },
    dispatchSlideVisibility(active) {
      this.dispatchWindowEvent("message", { data: { type: "slideVisibility", active } });
    },
    setDocumentHidden(hidden) {
      context.document.hidden = Boolean(hidden);
      const handlers = documentListeners.get("visibilitychange") || [];
      handlers.forEach((handler) => handler.call(context.document, { type: "visibilitychange" }));
    },
    setCanvasSize(width, height) {
      canvas.clientWidth = width;
      canvas.clientHeight = height;
      context.window.innerWidth = width;
      context.window.innerHeight = height;
    },
    getScheduledFrameCount() {
      return scheduledFrames.length;
    },
    getScheduledHandles() {
      return scheduledFrames.map((entry) => entry.handle);
    },
    getCancelledHandles() {
      return cancelledFrames.slice();
    }
  };
}

test("cyber page background safely no-ops when canvas context is unavailable", () => {
  const harness = createHarness({ disableContext: true, inIframe: true });

  vm.runInNewContext(cyberBackgroundScript, harness.context, {
    filename: "cyber-page-background.js"
  });

  harness.dispatchSlideVisibility(true);

  assert.equal(
    harness.getScheduledFrameCount(),
    0,
    "Expected no RAF work to start when canvas.getContext returns null."
  );
});

test("cyber page background pauses and resumes with slideVisibility messages", () => {
  const harness = createHarness({ inIframe: true });

  vm.runInNewContext(cyberBackgroundScript, harness.context, {
    filename: "cyber-page-background.js"
  });

  assert.equal(
    harness.getScheduledFrameCount(),
    0,
    "Expected iframe slide background to stay idle before active visibility message."
  );

  harness.dispatchSlideVisibility(true);
  assert.equal(
    harness.getScheduledFrameCount(),
    1,
    "Expected background to request animation when slideVisibility.active becomes true."
  );

  harness.dispatchSlideVisibility(false);
  assert.deepEqual(
    harness.getCancelledHandles(),
    [1],
    "Expected active RAF handle to be cancelled when slideVisibility.active becomes false."
  );

  harness.dispatchSlideVisibility(true);
  assert.equal(
    harness.getScheduledFrameCount(),
    2,
    "Expected animation to resume by queuing a new RAF handle after reactivation."
  );
});

test("cyber page background can force activation when hosted in iframe shell", () => {
  const harness = createHarness({ inIframe: true, forceActive: true });

  vm.runInNewContext(cyberBackgroundScript, harness.context, {
    filename: "cyber-page-background.js"
  });

  assert.equal(
    harness.getScheduledFrameCount(),
    1,
    "Expected shell background to start immediately when force-active attribute is present."
  );
});

test("cyber page background rebuilds canvas sizing and particle layout on resize", () => {
  const harness = createHarness({ inIframe: false, width: 360, height: 220 });

  vm.runInNewContext(cyberBackgroundScript, harness.context, {
    filename: "cyber-page-background.js"
  });

  const controller = harness.canvas.__cyberBackgroundController;
  assert.ok(controller, "Expected script to expose a testable controller on the background canvas.");

  const before = controller.getDebugState();

  harness.setCanvasSize(1280, 720);
  harness.dispatchWindowEvent("resize", { type: "resize" });

  const after = controller.getDebugState();

  assert.equal(after.width, 1280);
  assert.equal(after.height, 720);
  assert.notEqual(
    after.particleCount,
    before.particleCount,
    "Expected resize to rebuild particle layout density for the new viewport."
  );
});
