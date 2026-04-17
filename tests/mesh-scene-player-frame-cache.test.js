const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

function setupMeshScenePlayerTestEnv() {
  class FakeHTMLElement {}

  global.HTMLElement = FakeHTMLElement;
  global.document = {
    baseURI: "http://127.0.0.1:8765/pages/opening.html",
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
  global.THREE.MathUtils = {
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    degToRad(value) {
      return value * (Math.PI / 180);
    }
  };
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

test("MeshScenePlayer reuses cached frame viewport dimensions while placing icons", () => {
  setupMeshScenePlayerTestEnv();
  const modulePath = path.resolve(__dirname, "..", "js", "mesh-scene-player.js");
  delete require.cache[modulePath];
  const MeshScenePlayer = require(modulePath);

  let widthReads = 0;
  let heightReads = 0;

  const player = {
    container: {
      get clientWidth() {
        widthReads += 1;
        return 800;
      },
      get clientHeight() {
        heightReads += 1;
        return 600;
      }
    },
    camera: {
      fov: 74,
      position: {
        distanceTo() {
          return 120;
        }
      }
    },
    _frameViewport: {
      width: 800,
      height: 600
    }
  };

  const worldPosition = {
    clone() {
      return {
        project() {
          return { x: 0.1, y: -0.2, z: 0.2 };
        }
      };
    }
  };

  const firstElement = { style: {} };
  const secondElement = { style: {} };
  const config = { perspectiveStrength: 1 };

  MeshScenePlayer.prototype._placeIcon.call(player, firstElement, worldPosition, config, 1);
  MeshScenePlayer.prototype._placeIcon.call(player, secondElement, worldPosition, config, 1);

  assert.equal(widthReads, 0, "Expected icon placement to reuse cached frame width.");
  assert.equal(heightReads, 0, "Expected icon placement to reuse cached frame height.");
  assert.equal(firstElement.style.left, "440.00000000000006px");
  assert.equal(firstElement.style.top, "360px");

  teardownMeshScenePlayerTestEnv();
});
