const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("opening page falls back to local JSON loading when file:// fetch is blocked", async () => {
  const scriptPath = path.resolve(__dirname, "..", "js", "opening-page.js");
  const script = fs.readFileSync(scriptPath, "utf8");
  const scenePayload = { PLAYER_SCENE: { nodes: [{ id: "n-1" }] } };

  let playerOptions = null;

  const openingStage = {
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {}
    },
    setAttribute() {},
    removeAttribute() {}
  };

  const openingPlayerHost = {};
  const openingPlayerMessage = {
    hidden: true,
    textContent: "",
    dataset: {}
  };

  const body = {
    appendChild(element) {
      element.parentNode = body;
      if (typeof element.onload === "function") {
        setImmediate(() => {
          element.contentDocument = {
            documentElement: {
              textContent: JSON.stringify(scenePayload)
            }
          };
          element.onload();
        });
      }
    },
    removeChild() {}
  };

  function createIframeElement() {
    return {
      style: {},
      setAttribute() {},
      parentNode: null,
      onload: null,
      onerror: null,
      src: ""
    };
  }

  class FakeImage {
    constructor() {
      this.onload = null;
      this.onerror = null;
      this.complete = false;
      this.naturalWidth = 32;
    }

    set src(_value) {
      this.complete = true;
      if (typeof this.onload === "function") {
        this.onload();
      }
    }
  }

  function MeshScenePlayer(options) {
    playerOptions = options;
    this._states = {
      get() {
        return { nodes: [] };
      }
    };
  }

  MeshScenePlayer.prototype.preload = async function () {};
  MeshScenePlayer.prototype.switchMode = async function () {
    return true;
  };
  MeshScenePlayer.prototype.setActive = function () {};
  MeshScenePlayer.prototype.destroy = function () {};

  const windowObject = {
    parent: null,
    THREE: { OrbitControls: {} },
    LinkEffects: {},
    MeshScenePlayer,
    location: {
      protocol: "file:",
      href: "file:///D:/Mesh/pages/opening.html"
    },
    Image: FakeImage,
    setTimeout,
    clearTimeout,
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {}
  };
  windowObject.parent = windowObject;

  const documentObject = {
    querySelector(selector) {
      if (selector === ".opening-stage") {
        return openingStage;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".view-toggle-button") {
        return [];
      }
      return [];
    },
    getElementById(id) {
      if (id === "opening-player-host") {
        return openingPlayerHost;
      }
      if (id === "opening-player-message") {
        return openingPlayerMessage;
      }
      return null;
    },
    createElement(tagName) {
      if (tagName === "iframe") {
        return createIframeElement();
      }

      return {
        style: {},
        dataset: {},
        async: false,
        setAttribute() {},
        addEventListener() {}
      };
    },
    head: {
      appendChild() {}
    },
    body
  };

  const context = {
    window: windowObject,
    document: documentObject,
    Image: FakeImage,
    fetch: async function () {
      throw new Error("Fetch blocked");
    },
    console,
    setTimeout,
    clearTimeout
  };

  vm.runInNewContext(script, context, { filename: "opening-page.js" });

  await new Promise((resolve) => setTimeout(resolve, 25));

  assert.ok(playerOptions, "Expected MeshScenePlayer to be created after local JSON fallback.");
  assert.deepEqual(
    JSON.parse(JSON.stringify(playerOptions.stateData.opening)),
    scenePayload.PLAYER_SCENE,
    "Expected local opening.json contents to be parsed into the opening player state."
  );
  assert.equal(openingPlayerMessage.hidden, true, "Expected loading error message to be cleared after fallback succeeds.");
});

test("opening page uses embedded JSON when the browser blocks direct local file access", async () => {
  const scriptPath = path.resolve(__dirname, "..", "js", "opening-page.js");
  const script = fs.readFileSync(scriptPath, "utf8");
  const scenePayload = { PLAYER_SCENE: { nodes: [{ id: "embedded-1" }] } };

  let playerOptions = null;

  const openingStage = {
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {}
    },
    setAttribute() {},
    removeAttribute() {}
  };

  const openingPlayerHost = {};
  const openingPlayerMessage = {
    hidden: true,
    textContent: "",
    dataset: {}
  };

  class FakeImage {
    constructor() {
      this.onload = null;
      this.onerror = null;
      this.complete = false;
      this.naturalWidth = 32;
    }

    set src(_value) {
      this.complete = true;
      if (typeof this.onload === "function") {
        this.onload();
      }
    }
  }

  function MeshScenePlayer(options) {
    playerOptions = options;
    this._states = {
      get() {
        return { nodes: [] };
      }
    };
  }

  MeshScenePlayer.prototype.preload = async function () {};
  MeshScenePlayer.prototype.switchMode = async function () {
    return true;
  };
  MeshScenePlayer.prototype.setActive = function () {};
  MeshScenePlayer.prototype.destroy = function () {};

  const windowObject = {
    parent: null,
    THREE: { OrbitControls: {} },
    LinkEffects: {},
    MeshScenePlayer,
    location: {
      protocol: "file:",
      href: "file:///D:/Mesh/pages/opening.html"
    },
    Image: FakeImage,
    setTimeout,
    clearTimeout,
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {}
  };
  windowObject.parent = windowObject;

  const documentObject = {
    querySelector(selector) {
      if (selector === ".opening-stage") {
        return openingStage;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".view-toggle-button") {
        return [];
      }
      return [];
    },
    getElementById(id) {
      if (id === "opening-player-host") {
        return openingPlayerHost;
      }
      if (id === "opening-player-message") {
        return openingPlayerMessage;
      }
      if (id === "opening-scene-data") {
        return {
          textContent: JSON.stringify(scenePayload)
        };
      }
      return null;
    },
    createElement(tagName) {
      if (tagName === "iframe") {
        return {
          style: {},
          setAttribute() {},
          parentNode: null,
          onload: null,
          onerror: null,
          src: ""
        };
      }

      return {
        style: {},
        dataset: {},
        async: false,
        setAttribute() {},
        addEventListener() {}
      };
    },
    head: {
      appendChild() {}
    },
    body: {
      appendChild() {},
      removeChild() {}
    }
  };

  const context = {
    window: windowObject,
    document: documentObject,
    Image: FakeImage,
    fetch: async function () {
      throw new Error("Fetch blocked");
    },
    console,
    setTimeout,
    clearTimeout
  };

  vm.runInNewContext(script, context, { filename: "opening-page.js" });

  await new Promise((resolve) => setTimeout(resolve, 25));

  assert.ok(playerOptions, "Expected MeshScenePlayer to be created from embedded opening scene data.");
  assert.deepEqual(
    JSON.parse(JSON.stringify(playerOptions.stateData.opening)),
    scenePayload.PLAYER_SCENE,
    "Expected embedded opening scene contents to be parsed into the opening player state."
  );
  assert.equal(openingPlayerMessage.hidden, true, "Expected loading error message to stay cleared when embedded fallback succeeds.");
});
