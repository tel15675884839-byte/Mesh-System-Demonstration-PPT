const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const pageMessagingScript = fs.readFileSync(path.join(rootDir, "js", "page-messaging.js"), "utf8");
const pageBaseCss = fs.readFileSync(path.join(rootDir, "css", "page-base.css"), "utf8");

function createHarness(isEmbedded) {
  const windowListeners = new Map();
  const dispatchedEvents = [];
  const svgAnimationState = [];
  const svgElements = [
    {
      pauseAnimations() {
        svgAnimationState.push("pause");
      },
      unpauseAnimations() {
        svgAnimationState.push("unpause");
      }
    }
  ];

  const documentElement = {
    dataset: {}
  };
  const body = {
    dataset: {}
  };

  const context = {
    console,
    URLSearchParams,
    document: {
      documentElement,
      body,
      querySelectorAll(selector) {
        if (selector === "svg") {
          return svgElements;
        }
        if (selector === "[data-action='goto']") {
          return [];
        }
        return [];
      }
    },
    window: null,
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init ? init.detail : undefined;
    }
  };

  const parentWindow = isEmbedded ? {} : null;
  context.window = {
    location: {
      pathname: "/pages/overview.html",
      search: ""
    },
    parent: parentWindow || null,
    addEventListener(type, handler) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(handler);
      windowListeners.set(type, handlers);
    },
    dispatchEvent(event) {
      dispatchedEvents.push(event);
      return true;
    }
  };
  context.window.window = context.window;
  context.window.document = context.document;
  if (!isEmbedded) {
    context.window.parent = context.window;
  }

  vm.runInNewContext(pageMessagingScript, context, {
    filename: "page-messaging.js"
  });

  return {
    documentElement,
    body,
    svgAnimationState,
    dispatchedEvents,
    dispatchMessage(data) {
      const handlers = windowListeners.get("message") || [];
      handlers.forEach((handler) => handler.call(context.window, { data }));
    }
  };
}

test("embedded iframe pages start paused and resume only after activation", () => {
  const harness = createHarness(true);

  assert.equal(harness.documentElement.dataset.slideActive, "false");
  assert.equal(harness.body.dataset.slideActive, "false");
  assert.deepEqual(harness.svgAnimationState, ["pause"]);

  harness.dispatchMessage({ type: "slideVisibility", active: true });

  assert.equal(harness.documentElement.dataset.slideActive, "true");
  assert.equal(harness.body.dataset.slideActive, "true");
  assert.deepEqual(harness.svgAnimationState, ["pause", "unpause"]);
  assert.equal(harness.dispatchedEvents.at(-1).type, "slideActivityChange");
  assert.equal(harness.dispatchedEvents.at(-1).detail.active, true);
});

test("shared page base pauses descendant animations when the slide is inactive", () => {
  assert.match(pageBaseCss, /html\[data-slide-active="false"\]\s+\*/);
  assert.match(pageBaseCss, /animation-play-state:\s*paused\s*!important/i);
});
