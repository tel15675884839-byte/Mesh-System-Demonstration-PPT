const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

function setupMeshScenePlayerTestEnv() {
  class FakeHTMLElement {}

  global.HTMLElement = FakeHTMLElement;
  global.document = {
    baseURI: "http://127.0.0.1:8765/pages/mesh.html",
    body: {},
    querySelector() {
      return null;
    },
    createElement() {
      return {
        style: {},
        setAttribute() {},
        appendChild() {},
        removeChild() {},
        addEventListener() {}
      };
    }
  };
  global.window = {
    THREE: {},
    LinkEffects: {},
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle() {
      return { position: "relative" };
    }
  };
  global.THREE = global.window.THREE;
  global.ResizeObserver = function ResizeObserver() {
    this.observe = function () {};
    this.disconnect = function () {};
  };
}

function teardownMeshScenePlayerTestEnv() {
  delete global.HTMLElement;
  delete global.document;
  delete global.window;
  delete global.THREE;
  delete global.ResizeObserver;
}

test("MeshScenePlayer preloads availability but only builds states on demand", async () => {
  setupMeshScenePlayerTestEnv();
  const modulePath = path.resolve(__dirname, "..", "js", "mesh-scene-player.js");
  delete require.cache[modulePath];
  const MeshScenePlayer = require(modulePath);

  MeshScenePlayer.prototype._mount = function () {
    this.overlayLayer = { appendChild() {} };
    this.errorBox = { style: {}, textContent: "" };
    this.debugBox = { style: {}, textContent: "" };
    this.canvas = { width: 0, height: 0 };
  };
  MeshScenePlayer.prototype._initThree = function () {
    this.scene = { add() {} };
    this.camera = {};
    this.renderer = {
      dispose() {},
      render() {},
      setPixelRatio() {},
      setSize() {},
      setClearColor() {},
      info: { memory: { geometries: 0 } }
    };
    this.controls = null;
    this.backgroundGroup = { traverse() {} };
    this.statesRoot = { add() {}, remove() {} };
  };
  MeshScenePlayer.prototype._attachResizeHandling = function () {};
  MeshScenePlayer.prototype._renderOnce = function () {};
  MeshScenePlayer.prototype._updateDebugOverlay = function () {};
  MeshScenePlayer.prototype._setStatus = function () {};
  MeshScenePlayer.prototype._setStateVisible = function () {};
  MeshScenePlayer.prototype._applyStateView = function () {};
  MeshScenePlayer.prototype._disposeBackground = function () {};
  MeshScenePlayer.prototype._disposeState = function () {};

  const buildCalls = [];
  const rawStates = {
    normal: { nodes: [{ id: "n1", position: { x: 0, y: 0, z: 0 } }], devices: [] },
    blocked: { nodes: [{ id: "n2", position: { x: 1, y: 0, z: 0 } }], devices: [] },
    recovery: { nodes: [{ id: "n3", position: { x: 2, y: 0, z: 0 } }], devices: [] }
  };

  MeshScenePlayer.prototype._loadStateFromCandidates = async function (mode) {
    return rawStates[mode];
  };
  MeshScenePlayer.prototype._buildState = function (mode) {
    buildCalls.push(mode);
    return {
      mode,
      group: { visible: false },
      nodes: [],
      devices: [],
      nodeLinks: [],
      deviceLinks: [],
      error: null,
      zoomFactor: 1
    };
  };

  const player = new MeshScenePlayer({
    container: new global.HTMLElement(),
    stateOrder: ["normal", "blocked", "recovery"],
    statePaths: {
      normal: [],
      blocked: [],
      recovery: []
    },
    initialMode: "normal",
    autostart: false
  });

  await player.preload();

  assert.deepEqual(
    buildCalls,
    [],
    "Expected preload() to avoid building every state up front."
  );

  assert.deepEqual(
    player.getStateAvailability(),
    {
      normal: { ok: true, error: null, path: [] },
      blocked: { ok: true, error: null, path: [] },
      recovery: { ok: true, error: null, path: [] }
    },
    "Expected preload() to keep availability information for each state."
  );

  await player.switchMode("blocked");
  await player.switchMode("blocked");
  await player.switchMode("recovery");

  assert.deepEqual(
    buildCalls,
    ["blocked", "recovery"],
    "Expected states to build only when first activated, then be reused."
  );

  teardownMeshScenePlayerTestEnv();
});
