(function () {
  "use strict";

  const STATE_ORDER = ["normal", "blocked", "recovery", "diagnostic"];
  const DEFAULT_STATE_PATHS = {
    normal: "../assets/mesh-states/normal.json",
    blocked: "../assets/mesh-states/blocked.json",
    recovery: "../assets/mesh-states/recovery.json"
  };
  const DEFAULT_ICON_BASE_PATH = "../Mesh System Demonstration/assets/icons";
  const DEFAULT_FALLBACK_VIEW = {
    camera: { x: 0, y: 24, z: 88 },
    target: { x: 0, y: 0, z: 0 }
  };
  const DEFAULT_CONFIG = {
    nodeSize: 3.8,
    nodeRange: 45,
    nodeLinkColor: "#aee8ff",
    nodeLinkDash: 1.6,
    nodeLinkGap: 0.52,
    nodeLinkWidth: 1,
    disconnectedLinkZigzagInterval: 4,
    disconnectedLinkZigzagAmplitude: 0.5,
    nodeLinkMotionMode: "off",
    nodeLinkMotionSpeed: 1.1,
    nodeLinkMotionIntensity: 1,
    nodeLinkMotionSpacing: 0.18,
    deviceSize: 1.2,
    perspectiveStrength: 1,
    deviceShellRadius: 14,
    deviceRange: 20,
    deviceLinkColor: "#8fd0ff",
    deviceLinkDash: 1.25,
    deviceLinkGap: 0.44,
    deviceLinkWidth: 1,
    deviceLinkMotionMode: "off",
    deviceLinkMotionSpeed: 1,
    deviceLinkMotionIntensity: 1,
    deviceLinkMotionSpacing: 0.18,
    bidirectionalMotion: false
  };
  const DEVICE_ICON_TYPES = ["heat-mult", "io-module", "mcp", "smoke", "sounder"];
  const TYPE_COLORS = {
    "heat-mult": "#ffb36d",
    "io-module": "#7fd7ff",
    mcp: "#ffcf67",
    smoke: "#9ee8c0",
    sounder: "#ff8b96",
    node: "#87d5ff"
  };

  function isObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
  function toNumber(value, fallback) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
  function resolveUrl(path, basePath) {
    if (!path) return "";
    if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
    const base = basePath ? new URL(basePath, document.baseURI).href : document.baseURI;
    return new URL(path, base).href;
  }
  function resolveContainer(container) {
    if (!container) return document.body;
    if (typeof container === "string") {
      const element = document.querySelector(container);
      if (!element) throw new Error("MeshScenePlayer: container not found");
      return element;
    }
    if (container instanceof HTMLElement) return container;
    throw new Error("MeshScenePlayer: invalid container");
  }
  function cloneVectorLike(source, fallback) {
    const target = fallback || { x: 0, y: 0, z: 0 };
    if (!isObject(source)) return { x: toNumber(target.x, 0), y: toNumber(target.y, 0), z: toNumber(target.z, 0) };
    return {
      x: toNumber(source.x, toNumber(target.x, 0)),
      y: toNumber(source.y, toNumber(target.y, 0)),
      z: toNumber(source.z, toNumber(target.z, 0))
    };
  }
  function normalizeConfig(rawConfig) {
    const config = Object.assign({}, DEFAULT_CONFIG, isObject(rawConfig) ? rawConfig : {});
    config.nodeSize = toNumber(config.nodeSize, DEFAULT_CONFIG.nodeSize);
    config.nodeRange = toNumber(config.nodeRange, DEFAULT_CONFIG.nodeRange);
    config.nodeLinkDash = toNumber(config.nodeLinkDash, DEFAULT_CONFIG.nodeLinkDash);
    config.nodeLinkGap = toNumber(config.nodeLinkGap, DEFAULT_CONFIG.nodeLinkGap);
    config.nodeLinkWidth = toNumber(config.nodeLinkWidth, DEFAULT_CONFIG.nodeLinkWidth);
    config.disconnectedLinkZigzagInterval = toNumber(config.disconnectedLinkZigzagInterval, DEFAULT_CONFIG.disconnectedLinkZigzagInterval);
    config.disconnectedLinkZigzagAmplitude = toNumber(config.disconnectedLinkZigzagAmplitude, DEFAULT_CONFIG.disconnectedLinkZigzagAmplitude);
    config.nodeLinkMotionSpeed = toNumber(config.nodeLinkMotionSpeed, DEFAULT_CONFIG.nodeLinkMotionSpeed);
    config.nodeLinkMotionIntensity = toNumber(config.nodeLinkMotionIntensity, DEFAULT_CONFIG.nodeLinkMotionIntensity);
    config.nodeLinkMotionSpacing = toNumber(config.nodeLinkMotionSpacing, DEFAULT_CONFIG.nodeLinkMotionSpacing);
    config.deviceSize = toNumber(config.deviceSize, DEFAULT_CONFIG.deviceSize);
    config.perspectiveStrength = toNumber(config.perspectiveStrength, DEFAULT_CONFIG.perspectiveStrength);
    config.deviceShellRadius = toNumber(config.deviceShellRadius, DEFAULT_CONFIG.deviceShellRadius);
    config.deviceRange = toNumber(config.deviceRange, DEFAULT_CONFIG.deviceRange);
    config.deviceLinkDash = toNumber(config.deviceLinkDash, DEFAULT_CONFIG.deviceLinkDash);
    config.deviceLinkGap = toNumber(config.deviceLinkGap, DEFAULT_CONFIG.deviceLinkGap);
    config.deviceLinkWidth = toNumber(config.deviceLinkWidth, DEFAULT_CONFIG.deviceLinkWidth);
    config.deviceLinkMotionSpeed = toNumber(config.deviceLinkMotionSpeed, DEFAULT_CONFIG.deviceLinkMotionSpeed);
    config.deviceLinkMotionIntensity = toNumber(config.deviceLinkMotionIntensity, DEFAULT_CONFIG.deviceLinkMotionIntensity);
    config.deviceLinkMotionSpacing = toNumber(config.deviceLinkMotionSpacing, DEFAULT_CONFIG.deviceLinkMotionSpacing);
    config.bidirectionalMotion = !!config.bidirectionalMotion;
    config.linkMotionMode = config.nodeLinkMotionMode || config.linkMotionMode || DEFAULT_CONFIG.nodeLinkMotionMode;
    config.linkMotionSpeed = config.nodeLinkMotionSpeed;
    config.linkMotionIntensity = config.nodeLinkMotionIntensity;
    config.linkMotionSpacing = config.nodeLinkMotionSpacing;
    config.nodeLinkMotionMode = config.nodeLinkMotionMode || config.linkMotionMode;
    config.deviceLinkMotionMode = config.deviceLinkMotionMode || config.linkMotionMode;
    return config;
  }
  function normalizeScale(value) {
    return THREE.MathUtils.clamp(toNumber(value, 1), 0.4, 3);
  }
  function getNodeLinkKey(nodeAId, nodeBId) {
    const aId = String(nodeAId || "");
    const bId = String(nodeBId || "");
    return aId < bId ? ("n:" + aId + "|" + bId) : ("n:" + bId + "|" + aId);
  }
  function getDeviceLinkKey(nodeId, deviceId) {
    return "d:" + String(nodeId || "") + "|" + String(deviceId || "");
  }
  function getDisconnectedLinkPoints(start, end, isNodeLink, config) {
    const direction = end.clone().sub(start);
    const distanceValue = Math.max(0.001, direction.length());
    const zigzagInterval = THREE.MathUtils.clamp(Number(config.disconnectedLinkZigzagInterval) || 8, 2, 24);
    const zigzagCount = THREE.MathUtils.clamp(Math.ceil(distanceValue / zigzagInterval), 4, 24);
    const amplitudeScale = THREE.MathUtils.clamp(Number(config.disconnectedLinkZigzagAmplitude) || 1, 0.5, 2.5);
    const baseAmplitude = THREE.MathUtils.clamp(distanceValue * (isNodeLink ? 0.08 : 0.11), 1.4, isNodeLink ? 5.4 : 4.6);
    const amplitude = baseAmplitude * amplitudeScale;
    const points = [];

    for (let i = 0; i <= zigzagCount; i += 1) {
      const t = i / zigzagCount;
      const point = start.clone().lerp(end, t);
      if (i !== 0 && i !== zigzagCount) {
        point.y += (i % 2 === 0 ? 1 : -1) * amplitude;
      }
      points.push(point);
    }
    return points;
  }
  function normalizeView(rawView, fallbackView) {
    const fallback = fallbackView || DEFAULT_FALLBACK_VIEW;
    const source = isObject(rawView) ? rawView : {};
    const cameraSource = isObject(source.camera) && isObject(source.camera.position)
      ? source.camera.position
      : (isObject(source.camera) ? source.camera : source);
    const targetSource = isObject(source.controls) && isObject(source.controls.target)
      ? source.controls.target
      : (isObject(source.target) ? source.target : (isObject(source.controlsTarget) ? source.controlsTarget : fallback.target));
    return {
      camera: cloneVectorLike(cameraSource, fallback.camera),
      target: cloneVectorLike(targetSource, fallback.target)
    };
  }
  function normalizeStatePaths(options) {
    const statePaths = options.statePaths;
    function toCandidates(value, fallback) {
      if (Array.isArray(value)) {
        return value.filter(function (item) {
          return typeof item === "string" && item.trim().length > 0;
        });
      }
      if (typeof value === "string" && value.trim().length > 0) {
        return [value];
      }
      return [fallback];
    }
    if (Array.isArray(statePaths)) {
      return {
        normal: toCandidates(statePaths[0], DEFAULT_STATE_PATHS.normal),
        blocked: toCandidates(statePaths[1], DEFAULT_STATE_PATHS.blocked),
        recovery: toCandidates(statePaths[2], DEFAULT_STATE_PATHS.recovery)
      };
    }
    if (isObject(statePaths)) {
      return {
        normal: toCandidates(statePaths.normal, DEFAULT_STATE_PATHS.normal),
        blocked: toCandidates(statePaths.blocked, DEFAULT_STATE_PATHS.blocked),
        recovery: toCandidates(statePaths.recovery, DEFAULT_STATE_PATHS.recovery)
      };
    }
    const basePath = options.stateBasePath || null;
    if (basePath) {
      return {
        normal: [resolveUrl("normal.json", basePath)],
        blocked: [resolveUrl("blocked.json", basePath)],
        recovery: [resolveUrl("recovery.json", basePath)]
      };
    }
    return {
      normal: [DEFAULT_STATE_PATHS.normal],
      blocked: [DEFAULT_STATE_PATHS.blocked],
      recovery: [DEFAULT_STATE_PATHS.recovery]
    };
  }
  function createIconElement(type, fileName, size, iconBasePath) {
    const element = document.createElement("img");
    element.className = "mesh-player-icon mesh-player-icon-" + type;
    element.src = resolveUrl(fileName + ".svg", iconBasePath);
    element.alt = type;
    element.style.position = "absolute";
    element.style.left = "0";
    element.style.top = "0";
    element.style.transform = "translate(-50%, -50%)";
    element.style.pointerEvents = "none";
    element.style.width = size + "px";
    element.style.height = size + "px";
    element.style.objectFit = "contain";
    element.style.filter = "drop-shadow(0 0 10px rgba(120, 210, 255, 0.32))";
    element.style.willChange = "transform, left, top";
    element.style.opacity = "0.98";
    element.onerror = function () { element.style.display = "none"; };
    return element;
  }
  function updateIconElement(element, size, fileName, iconBasePath) {
    element.style.width = size + "px";
    element.style.height = size + "px";
    if (fileName) element.src = resolveUrl(fileName + ".svg", iconBasePath);
  }
  function createNodeMaterial(color) {
    return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.22, metalness: 0.28, roughness: 0.34, transparent: true, opacity: 0.72, depthWrite: false });
  }
  function createDeviceMaterial(color) {
    return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.18, metalness: 0.35, roughness: 0.28, transparent: true, opacity: 0.84, depthWrite: false });
  }
  function buildBoundsFromPoints(points) {
    const box = new THREE.Box3();
    let hasPoint = false;

    for (let i = 0; i < points.length; i += 1) {
      if (!points[i]) continue;
      box.expandByPoint(points[i]);
      hasPoint = true;
    }

    if (!hasPoint) {
      return {
        center: new THREE.Vector3(0, 0, 0),
        radius: 24
      };
    }

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    let radius = 12;
    for (let i = 0; i < points.length; i += 1) {
      if (!points[i]) continue;
      radius = Math.max(radius, center.distanceTo(points[i]));
    }
    return { center: center, radius: radius, size: size };
  }
  function loadJsonTextViaIframe(url) {
    return new Promise(function (resolve, reject) {
      const iframe = document.createElement("iframe");
      let settled = false;
      const timeout = window.setTimeout(function () {
        cleanup();
        reject(new Error("Timed out while reading local JSON file."));
      }, 5000);

      function cleanup() {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }

      iframe.style.position = "fixed";
      iframe.style.left = "-9999px";
      iframe.style.top = "0";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.opacity = "0";
      iframe.setAttribute("aria-hidden", "true");

      iframe.onload = function () {
        if (settled) return;
        try {
          const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
          const text = doc && doc.documentElement ? String(doc.documentElement.textContent || "").trim() : "";
          cleanup();
          if (!text) {
            reject(new Error("Local JSON file loaded but returned empty content."));
            return;
          }
          resolve(text);
        } catch (error) {
          cleanup();
          reject(new Error("Browser blocked local file access for JSON loading."));
        }
      };

      iframe.onerror = function () {
        if (settled) return;
        cleanup();
        reject(new Error("Failed to read local JSON file."));
      };

      iframe.src = url;
      document.body.appendChild(iframe);
    });
  }
  async function loadJsonFromPath(path) {
    const resolvedUrl = resolveUrl(path, document.baseURI);

    try {
      const response = await fetch(resolvedUrl, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status + " loading " + path);
      return await response.json();
    } catch (fetchError) {
      if (window.location.protocol !== "file:") {
        throw fetchError;
      }

      const text = await loadJsonTextViaIframe(resolvedUrl);
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new Error("Failed to parse local JSON file \"" + path + "\".");
      }
    }
  }
  class MeshScenePlayer {
    constructor(options) {
      if (!window.THREE) throw new Error("MeshScenePlayer: THREE is required");
      if (!window.LinkEffects) throw new Error("MeshScenePlayer: LinkEffects is required");

      this.options = options || {};
      this.container = resolveContainer(this.options.container);
      this.statePaths = normalizeStatePaths(this.options);
      this.stateData = isObject(this.options.stateData) ? this.options.stateData : {};
      this.iconBasePath = this.options.iconBasePath || DEFAULT_ICON_BASE_PATH;
      this.fallbackView = normalizeView(this.options.fallbackView, DEFAULT_FALLBACK_VIEW);
      this.initialMode = STATE_ORDER.includes(this.options.initialMode) ? this.options.initialMode : "normal";
      this.autostart = this.options.autostart !== false;
      this.autoFitView = this.options.autoFitView !== false;
      this.debugEnabled = !!this.options.debug;

      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.canvas = null;
      this.controls = null;
      this.overlayLayer = null;
      this.errorBox = null;
      this.debugBox = null;
      this.debugMarker = null;
      this.backgroundGroup = null;
      this.statesRoot = null;
      this._states = new Map();
      this._activeMode = null;
      this._activeState = null;
      this._elapsed = 0;
      this._frameHandle = 0;
      this._destroyed = false;
      this._preloadPromise = null;
      this._resizeObserver = null;
      this._boundResize = this._resize.bind(this);
      this._boundAnimate = this._animate.bind(this);

      this._mount();
      this._initThree();
      this._attachResizeHandling();

      if (this.autostart) {
        this.preload().catch(function () { return null; });
      }
    }

    preload() {
      if (this._preloadPromise) return this._preloadPromise;
      this._setStatus("Loading mesh states", false);
      this._preloadPromise = this._preload().catch((error) => {
        this._setStatus(error && error.message ? error.message : String(error), true);
        return this;
      });
      return this._preloadPromise;
    }

    async switchMode(mode) {
      if (this._destroyed) return false;
      await this.preload();
      if (this._destroyed) return false;

      return this._activateMode(mode);
    }

    _activateMode(mode) {
      const nextMode = STATE_ORDER.includes(mode) ? mode : this.initialMode;
      const nextState = this._states.get(nextMode);
      if (!nextState || nextState.error) {
        this._setStatus(nextState && nextState.error ? "Unable to load " + nextMode + " state" : "Unknown mesh state: " + nextMode, true);
        return false;
      }

      if (this._activeState && this._activeState !== nextState) {
        this._setStateVisible(this._activeState, false);
      }
      this._activeMode = nextMode;
      this._activeState = nextState;
      if (!Number.isFinite(nextState.zoomFactor)) {
        nextState.zoomFactor = 1;
      }
      this._setStateVisible(nextState, true);
      this._applyStateView(nextState);
      this._setStatus("", false);
      this._updateDebugOverlay("mode switched");
      return true;
    }

    getStateAvailability() {
      const availability = {};
      for (const mode of STATE_ORDER) {
        const state = this._states.get(mode);
        availability[mode] = {
          ok: !!(state && !state.error),
          error: state && state.error ? state.error : null,
          path: this.statePaths[mode] || []
        };
      }
      return availability;
    }

    getFirstAvailableMode() {
      for (const mode of STATE_ORDER) {
        const state = this._states.get(mode);
        if (state && !state.error) {
          return mode;
        }
      }
      return null;
    }

    zoomBy(multiplier) {
      if (!this._activeState || !Number.isFinite(multiplier) || multiplier <= 0) {
        return false;
      }

      const nextFactor = THREE.MathUtils.clamp((this._activeState.zoomFactor || 1) * multiplier, 0.18, 6);
      this._activeState.zoomFactor = nextFactor;
      this._applyStateView(this._activeState);
      this._renderOnce();
      this._updateDebugOverlay("zoom " + nextFactor.toFixed(2) + "x");
      return true;
    }

    zoomIn() {
      return this.zoomBy(0.85);
    }

    zoomOut() {
      return this.zoomBy(1.18);
    }

    resetZoom() {
      if (!this._activeState) {
        return false;
      }
      this._activeState.zoomFactor = 1;
      this._applyStateView(this._activeState);
      this._renderOnce();
      this._updateDebugOverlay("zoom reset");
      return true;
    }

    resetView() {
      return this.resetZoom();
    }

    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      cancelAnimationFrame(this._frameHandle);
      this._frameHandle = 0;

      if (this._resizeObserver) {
        this._resizeObserver.disconnect();
        this._resizeObserver = null;
      }
      window.removeEventListener("resize", this._boundResize);

      for (const state of this._states.values()) this._disposeState(state);
      this._states.clear();
      this._disposeBackground();
      if (this.controls && typeof this.controls.dispose === "function") this.controls.dispose();
      this.controls = null;
      if (this.renderer) this.renderer.dispose();
      if (this.container) this.container.innerHTML = "";
    }

    _mount() {
      this.container.innerHTML = "";
      const computedPosition = window.getComputedStyle(this.container).position;
      if (!computedPosition || computedPosition === "static") {
        this.container.style.position = "relative";
      }
      this.container.style.display = "block";
      this.container.style.width = this.container.style.width || "100%";
      this.container.style.height = this.container.style.height || "100%";
      this.container.style.overflow = "hidden";
      this.container.style.background = "radial-gradient(circle at top, rgba(13, 28, 52, 0.92), rgba(2, 8, 18, 0.98) 56%, #02060b 100%)";

      const shell = document.createElement("div");
      shell.style.position = "absolute";
      shell.style.inset = "0";
      shell.style.overflow = "hidden";
      shell.style.pointerEvents = "auto";
      shell.style.userSelect = "none";
      shell.style.touchAction = "none";
      this.container.appendChild(shell);

      this.canvas = document.createElement("canvas");
      this.canvas.setAttribute("aria-hidden", "true");
      this.canvas.style.position = "absolute";
      this.canvas.style.inset = "0";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      this.canvas.style.display = "block";
      this.canvas.style.pointerEvents = "auto";
      this.canvas.style.touchAction = "none";
      shell.appendChild(this.canvas);

      this.overlayLayer = document.createElement("div");
      this.overlayLayer.style.position = "absolute";
      this.overlayLayer.style.inset = "0";
      this.overlayLayer.style.pointerEvents = "none";
      this.overlayLayer.style.overflow = "hidden";
      this.overlayLayer.style.userSelect = "none";
      shell.appendChild(this.overlayLayer);

      this.errorBox = document.createElement("div");
      this.errorBox.setAttribute("aria-live", "polite");
      this.errorBox.style.position = "absolute";
      this.errorBox.style.inset = "0";
      this.errorBox.style.display = "flex";
      this.errorBox.style.alignItems = "center";
      this.errorBox.style.justifyContent = "center";
      this.errorBox.style.padding = "18px";
      this.errorBox.style.boxSizing = "border-box";
      this.errorBox.style.pointerEvents = "none";
      this.errorBox.style.opacity = "0";
      this.errorBox.style.transition = "opacity 180ms ease";
      this.errorBox.style.background = "linear-gradient(180deg, rgba(2, 8, 18, 0.1), rgba(2, 8, 18, 0.42))";
      this.errorBox.style.color = "#d7ecff";
      this.errorBox.style.textAlign = "center";
      this.errorBox.style.fontFamily = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      this.errorBox.style.fontSize = "12px";
      this.errorBox.style.letterSpacing = "0.06em";
      this.errorBox.style.textTransform = "uppercase";
      this.errorBox.style.textShadow = "0 0 12px rgba(112, 240, 255, 0.18)";
      shell.appendChild(this.errorBox);

      this.debugBox = document.createElement("div");
      this.debugBox.style.position = "absolute";
      this.debugBox.style.left = "10px";
      this.debugBox.style.bottom = "10px";
      this.debugBox.style.zIndex = "8";
      this.debugBox.style.maxWidth = "calc(100% - 20px)";
      this.debugBox.style.padding = "8px 10px";
      this.debugBox.style.borderRadius = "10px";
      this.debugBox.style.background = "rgba(2, 8, 18, 0.78)";
      this.debugBox.style.border = "1px solid rgba(112, 240, 255, 0.16)";
      this.debugBox.style.color = "rgba(220, 244, 255, 0.9)";
      this.debugBox.style.font = "11px/1.45 Consolas, Monaco, monospace";
      this.debugBox.style.whiteSpace = "pre-wrap";
      this.debugBox.style.pointerEvents = "none";
      this.debugBox.style.display = this.debugEnabled ? "block" : "none";
      shell.appendChild(this.debugBox);
    }

    _initThree() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000000);
      this.scene.fog = new THREE.FogExp2(0x02060b, 0.0027);
      this.camera = new THREE.PerspectiveCamera(74, 1, 0.1, 2000);
      this._applyView(this.fallbackView);

      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setClearColor(0x000000, 1);
      if ("outputEncoding" in this.renderer) this.renderer.outputEncoding = THREE.sRGBEncoding;
      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = true;
        this.controls.minDistance = 24;
        this.controls.maxDistance = 220;
        this.controls.update();
      }

      this.backgroundGroup = new THREE.Group();
      this.statesRoot = new THREE.Group();
      this.scene.add(this.backgroundGroup);
      this.scene.add(this.statesRoot);
      this._buildBackground();

      this.debugMarker = new THREE.Group();
      const debugCube = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(10, 10, 10)),
        new THREE.LineBasicMaterial({
          color: 0xff4fd8,
          transparent: true,
          opacity: 0.95
        })
      );
      const debugCore = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 14, 14),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.95
        })
      );
      this.debugMarker.add(debugCube);
      this.debugMarker.add(debugCore);
      this.scene.add(this.debugMarker);
      this.debugMarker.visible = false;

      const ambient = new THREE.AmbientLight(0x8fd6ff, 0.72);
      const keyLight = new THREE.PointLight(0x3ebdff, 1.15, 220, 2);
      keyLight.position.set(16, 35, 44);
      const fillLight = new THREE.PointLight(0x1f56b8, 0.7, 220, 2);
      fillLight.position.set(-40, -16, -30);
      this.scene.add(ambient);
      this.scene.add(keyLight);
      this.scene.add(fillLight);

      this._resize();
      this._setStatus("Loading mesh states", false);
      this._updateDebugOverlay("three initialized");
      this._frameHandle = requestAnimationFrame(this._boundAnimate);
    }

    _attachResizeHandling() {
      if (typeof ResizeObserver !== "undefined") {
        this._resizeObserver = new ResizeObserver(this._boundResize);
        this._resizeObserver.observe(this.container);
      } else {
        window.addEventListener("resize", this._boundResize);
      }
    }

    async _preload() {
      const results = await Promise.allSettled(STATE_ORDER.map(async (mode) => {
        const inlineRaw = isObject(this.stateData[mode]) ? this.stateData[mode] : null;
        let raw = null;

        try {
          raw = await this._loadStateFromCandidates(mode);
        } catch (error) {
          if (inlineRaw) {
            raw = inlineRaw;
          } else {
            throw error;
          }
        }

        if (!isObject(raw)) {
          throw new Error("Invalid state payload for " + mode);
        }

        return { mode, state: this._buildState(mode, raw) };
      }));

      let firstReady = null;
      for (let i = 0; i < results.length; i += 1) {
        const mode = STATE_ORDER[i];
        const result = results[i];
        if (result.status === "fulfilled") {
          const state = result.value.state;
          this._states.set(mode, state);
          if (!firstReady) firstReady = state;
        } else {
          this._states.set(mode, { mode, error: result.reason instanceof Error ? result.reason : new Error(String(result.reason)) });
        }
      }

      if (!firstReady) {
        const firstError = results.find(function (item) { return item.status === "rejected"; });
        throw firstError && firstError.reason ? firstError.reason : new Error("Failed to load mesh states");
      }

      for (const state of this._states.values()) {
        if (state && !state.error) this._setStateVisible(state, false);
      }

      const bootMode = this._states.has(this.initialMode) && this._states.get(this.initialMode) && !this._states.get(this.initialMode).error
        ? this.initialMode
        : firstReady.mode;
      this._activateMode(bootMode);
      this._updateDebugOverlay("preload complete");
      return this;
    }

    async _loadStateFromCandidates(mode) {
      const candidates = Array.isArray(this.statePaths[mode])
        ? this.statePaths[mode]
        : (this.statePaths[mode] ? [this.statePaths[mode]] : []);
      const attemptErrors = [];

      if (!candidates.length) {
        throw new Error("No state paths configured for mode: " + mode);
      }

      for (let i = 0; i < candidates.length; i += 1) {
        const candidate = candidates[i];
        if (!candidate) {
          continue;
        }
        try {
          return await loadJsonFromPath(candidate);
        } catch (error) {
          attemptErrors.push(
            (error && error.message ? error.message : String(error))
          );
        }
      }

      throw new Error(
        "Failed to load " + mode + " state from configured paths. " + attemptErrors.join(" | ")
      );
    }

    _buildState(mode, raw) {
      if (!isObject(raw)) throw new Error("Invalid state payload for " + mode);

      const config = normalizeConfig(raw.config);
      const view = normalizeView(raw.view, this.fallbackView);
      const nodesInput = Array.isArray(raw.nodes) ? raw.nodes : [];
      const devicesInput = Array.isArray(raw.devices) ? raw.devices : [];
      if (nodesInput.length === 0) throw new Error("State " + mode + " has no nodes");
      const disconnectedLinkKeys = new Set(
        (Array.isArray(raw.disconnectedLinks) ? raw.disconnectedLinks : [])
          .map(function (key) { return String(key || "").trim(); })
          .filter(function (key) { return key.length > 0; })
      );
      const hiddenLinkKeys = new Set(
        (Array.isArray(raw.hiddenLinks) ? raw.hiddenLinks : [])
          .map(function (key) { return String(key || "").trim(); })
          .filter(function (key) { return key.length > 0; })
      );

      const duplicateNodeIds = [];
      const seenNodeIds = new Set();
      for (let i = 0; i < nodesInput.length; i += 1) {
        const item = nodesInput[i];
        if (!isObject(item) || !isObject(item.position)) throw new Error("Invalid node entry in " + mode + " at index " + i);
        const id = item.id != null ? String(item.id) : "node-" + i;
        if (seenNodeIds.has(id) && duplicateNodeIds.indexOf(id) === -1) {
          duplicateNodeIds.push(id);
        }
        seenNodeIds.add(id);
      }
      if (duplicateNodeIds.length > 0) {
        throw new Error("State " + mode + " has duplicate node id(s): " + duplicateNodeIds.join(", "));
      }

      const group = new THREE.Group();
      group.name = "mesh-state-" + mode;
      group.visible = false;
      this.statesRoot.add(group);

      const nodeEntries = [];
      const deviceEntries = [];
      const nodeById = new Map();

      for (let i = 0; i < nodesInput.length; i += 1) {
        const item = nodesInput[i];
        if (!isObject(item) || !isObject(item.position)) throw new Error("Invalid node entry in " + mode + " at index " + i);
        const id = item.id != null ? String(item.id) : "node-" + i;
        const position = new THREE.Vector3(toNumber(item.position.x, 0), toNumber(item.position.y, 0), toNumber(item.position.z, 0));
        const shellRadius = toNumber(item.shellRadius, config.deviceShellRadius);
        const localScale = normalizeScale(item.scale);
        const nodeColor = new THREE.Color(TYPE_COLORS.node);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.75, config.nodeSize * 0.55 * localScale), 20, 20), createNodeMaterial(nodeColor.getHex()));
        mesh.position.copy(position);
        group.add(mesh);

        const glow = new THREE.Mesh(new THREE.SphereGeometry(Math.max(1.4, config.nodeSize * 0.95 * localScale), 16, 16), new THREE.MeshBasicMaterial({ color: nodeColor.getHex(), transparent: true, opacity: 0.14, depthWrite: false }));
        glow.position.copy(position);
        group.add(glow);

        const iconEl = createIconElement("node", "node", config.nodeSize * 18 * localScale, this.iconBasePath);
        this.overlayLayer.appendChild(iconEl);

        const nodeEntry = { id, position, shellRadius, localScale, mesh, glow, iconEl, devices: [] };
        nodeById.set(id, nodeEntry);
        nodeEntries.push(nodeEntry);
      }

      for (let i = 0; i < devicesInput.length; i += 1) {
        const item = devicesInput[i];
        if (!isObject(item) || !item.nodeId) throw new Error("Invalid device entry in " + mode + " at index " + i);
        const owner = nodeById.get(String(item.nodeId));
        if (!owner) throw new Error("State " + mode + " references missing nodeId \"" + String(item.nodeId) + "\" at device index " + i);
        const hasPosition = isObject(item.position);
        const hasOffset = isObject(item.offset);
        if (!hasPosition && !hasOffset) throw new Error("Invalid device entry in " + mode + " at index " + i + ": missing position and offset");

        const id = item.id != null ? String(item.id) : "device-" + i;
        const type = DEVICE_ICON_TYPES.includes(item.type) ? String(item.type) : DEVICE_ICON_TYPES[0];
        const localScale = normalizeScale(item.scale);
        const offset = hasOffset
          ? new THREE.Vector3(
            toNumber(item.offset.x, 0),
            toNumber(item.offset.y, 0),
            toNumber(item.offset.z, 0)
          )
          : new THREE.Vector3(
            toNumber(item.position.x, owner.position.x) - owner.position.x,
            toNumber(item.position.y, owner.position.y) - owner.position.y,
            toNumber(item.position.z, owner.position.z) - owner.position.z
          );
        const position = new THREE.Vector3(
          hasPosition ? toNumber(item.position.x, owner.position.x + offset.x) : owner.position.x + offset.x,
          hasPosition ? toNumber(item.position.y, owner.position.y + offset.y) : owner.position.y + offset.y,
          hasPosition ? toNumber(item.position.z, owner.position.z + offset.z) : owner.position.z + offset.z
        );
        const color = new THREE.Color(TYPE_COLORS[type] || TYPE_COLORS.node);
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.24, config.deviceSize * 0.48 * localScale), 16, 16), createDeviceMaterial(color.getHex()));
        mesh.position.copy(position);
        group.add(mesh);

        const iconEl = createIconElement("device", type, config.deviceSize * 24 * localScale, this.iconBasePath);
        this.overlayLayer.appendChild(iconEl);

        const deviceEntry = { id, node: owner, position, offset, type, localScale, mesh, iconEl };
        owner.devices.push(deviceEntry);
        deviceEntries.push(deviceEntry);
      }

      const nodeLinks = [];
      const deviceLinks = [];
      const nodeRangeSq = config.nodeRange * config.nodeRange;
      const deviceRangeSq = config.deviceRange * config.deviceRange;

      for (let i = 0; i < nodeEntries.length; i += 1) {
        for (let j = i + 1; j < nodeEntries.length; j += 1) {
          const a = nodeEntries[i];
          const b = nodeEntries[j];
          if (a.position.distanceToSquared(b.position) > nodeRangeSq) continue;
          const key = getNodeLinkKey(a.id, b.id);
          const link = this._createLink(group, a.position, b.position, config, true);
          link.key = key;
          link.a = a;
          link.b = b;
          link.status = disconnectedLinkKeys.has(key) ? "disconnected" : "connected";
          link.visibility = hiddenLinkKeys.has(key) ? "hidden" : "visible";
          this._refreshLinkGeometryByStatus(link, config);
          nodeLinks.push(link);
        }
      }
      for (let i = 0; i < deviceEntries.length; i += 1) {
        const device = deviceEntries[i];
        for (let j = 0; j < nodeEntries.length; j += 1) {
          const node = nodeEntries[j];
          if (device.position.distanceToSquared(node.position) > deviceRangeSq) continue;
          const key = getDeviceLinkKey(node.id, device.id);
          const link = this._createLink(group, node.position, device.position, config, false);
          link.key = key;
          link.node = node;
          link.device = device;
          link.status = disconnectedLinkKeys.has(key) ? "disconnected" : "connected";
          link.visibility = hiddenLinkKeys.has(key) ? "hidden" : "visible";
          this._refreshLinkGeometryByStatus(link, config);
          deviceLinks.push(link);
        }
      }

      const state = {
        mode,
        raw,
        config,
        view,
        group,
        nodes: nodeEntries,
        devices: deviceEntries,
        nodeLinks: nodeLinks,
        deviceLinks: deviceLinks,
        disconnectedLinkKeys: disconnectedLinkKeys,
        hiddenLinkKeys: hiddenLinkKeys,
        error: null,
        zoomFactor: 1
      };
      const boundsPoints = nodeEntries.map(function (node) { return node.position; }).concat(deviceEntries.map(function (device) { return device.position; }));
      state.points = boundsPoints;
      state.bounds = buildBoundsFromPoints(boundsPoints);
      this._applyStateAppearance(state);
      return state;
    }

    _createLink(group, start, end, config, isNodeLink) {
      const color = isNodeLink ? config.nodeLinkColor : config.deviceLinkColor;
      const dashSize = isNodeLink ? config.nodeLinkDash : config.deviceLinkDash;
      const gapSize = isNodeLink ? config.nodeLinkGap : config.deviceLinkGap;
      const linewidth = isNodeLink ? config.nodeLinkWidth : config.deviceLinkWidth;
      const pathPoints = isNodeLink ? window.LinkEffects.getStraightLinkPoints(start, end) : window.LinkEffects.getDeviceArcPoints(start, end);
      const actor = window.LinkEffects.createLinkActor({ root: group, start, end, color, dashSize, gapSize, opacity: isNodeLink ? 0.88 : 0.82, linewidth, pathPoints });
      const widthStrength = THREE.MathUtils.clamp(linewidth / 5, 0, 1);
      window.LinkEffects.applyLinkAppearance(actor, {
        color,
        dashSize,
        gapSize,
        linewidth,
        baseOpacity: isNodeLink ? 0.12 + widthStrength * 0.16 : 0.08 + widthStrength * 0.14,
        pulseOpacity: isNodeLink ? 0.52 + widthStrength * 0.28 : 0.44 + widthStrength * 0.24
      });
      return { actor, start, end, isNodeLink };
    }

    _applyStateAppearance(state) {
      const config = state.config;
      for (let i = 0; i < state.nodes.length; i += 1) {
        const node = state.nodes[i];
        updateIconElement(node.iconEl, config.nodeSize * 18 * normalizeScale(node.localScale), "node", this.iconBasePath);
      }
      for (let i = 0; i < state.devices.length; i += 1) {
        const device = state.devices[i];
        updateIconElement(device.iconEl, config.deviceSize * 24 * normalizeScale(device.localScale), device.type, this.iconBasePath);
      }
    }

    _setStateVisible(state, visible) {
      if (!state) return;
      state.group.visible = visible;
      for (let i = 0; i < state.nodes.length; i += 1) state.nodes[i].iconEl.style.display = visible ? "block" : "none";
      for (let i = 0; i < state.devices.length; i += 1) state.devices[i].iconEl.style.display = visible ? "block" : "none";
      const links = state.nodeLinks.concat(state.deviceLinks);
      for (let i = 0; i < links.length; i += 1) {
        const link = links[i];
        if (!link || !link.actor) continue;
        link.actor.visible = visible && link.visibility !== "hidden";
        if (!visible) {
          this._hideLinkBreakMarker(link);
        }
      }
    }

    _refreshLinkGeometryByStatus(link, config) {
      if (!link || !link.actor) return;
      const isDisconnected = link.status === "disconnected";
      const isHidden = link.visibility === "hidden";
      const pathPoints = isDisconnected
        ? getDisconnectedLinkPoints(link.start, link.end, !!link.isNodeLink, config)
        : (link.isNodeLink
          ? window.LinkEffects.getStraightLinkPoints(link.start, link.end)
          : window.LinkEffects.getDeviceArcPoints(link.start, link.end));

      if (typeof window.LinkEffects.updateLinkActorGeometry === "function") {
        window.LinkEffects.updateLinkActorGeometry(link.actor, link.start, link.end, pathPoints);
      }
      link.actor.visible = !isHidden;
      if (!isDisconnected || isHidden) {
        this._hideLinkBreakMarker(link);
      }
    }

    _ensureLinkBreakMarker(link) {
      if (!link) return null;
      if (link.breakMarkerEl) return link.breakMarkerEl;
      const marker = document.createElement("div");
      marker.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 9.2a11 11 0 0 1 14.4 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M7.8 12.4a7 7 0 0 1 8.4 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M10.7 15.7a3 3 0 0 1 2.6 0" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="18.4" r="1.4" fill="currentColor"/><path d="M5.6 18.6L18.8 5.4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
      marker.style.position = "absolute";
      marker.style.width = "56px";
      marker.style.height = "56px";
      marker.style.marginLeft = "-28px";
      marker.style.marginTop = "-28px";
      marker.style.display = "none";
      marker.style.alignItems = "center";
      marker.style.justifyContent = "center";
      marker.style.borderRadius = "50%";
      marker.style.background = "radial-gradient(circle at center, rgba(255, 72, 72, 0.22), rgba(16, 6, 8, 0.8))";
      marker.style.boxShadow = "0 0 0 1px rgba(255, 120, 120, 0.45), 0 0 20px rgba(255, 74, 74, 0.36)";
      marker.style.color = "#ff8e8e";
      marker.style.pointerEvents = "none";
      marker.style.zIndex = "9";
      const svg = marker.querySelector("svg");
      if (svg) {
        svg.style.width = "30px";
        svg.style.height = "30px";
      }
      this.overlayLayer.appendChild(marker);
      link.breakMarkerEl = marker;
      return marker;
    }

    _hideLinkBreakMarker(link) {
      if (!link || !link.breakMarkerEl) return;
      link.breakMarkerEl.style.display = "none";
    }

    _placeLinkBreakMarker(link) {
      if (!link || !link.actor || !link.actor.visible || link.status !== "disconnected" || link.visibility === "hidden") {
        this._hideLinkBreakMarker(link);
        return;
      }

      const marker = this._ensureLinkBreakMarker(link);
      if (!marker) return;
      const pathPoints = link.actor.userData && Array.isArray(link.actor.userData.pathPoints)
        ? link.actor.userData.pathPoints
        : null;
      let worldPosition = null;

      if (pathPoints && pathPoints.length > 1) {
        const middleIndex = Math.floor((pathPoints.length - 1) / 2);
        const pointA = pathPoints[middleIndex];
        const pointB = pathPoints[Math.min(pathPoints.length - 1, middleIndex + 1)];
        worldPosition = pointA.clone().lerp(pointB, 0.5);
      } else if (link.start && link.end) {
        worldPosition = link.start.clone().lerp(link.end, 0.5);
      }

      if (!worldPosition) {
        marker.style.display = "none";
        return;
      }

      const projected = worldPosition.clone().project(this.camera);
      if (projected.z <= -1 || projected.z >= 1) {
        marker.style.display = "none";
        return;
      }

      const width = Math.max(1, this.container.clientWidth || 1);
      const height = Math.max(1, this.container.clientHeight || 1);
      marker.style.display = "flex";
      marker.style.left = ((projected.x * 0.5 + 0.5) * width) + "px";
      marker.style.top = ((-projected.y * 0.5 + 0.5) * height) + "px";
      marker.style.zIndex = String(Math.floor((1 - projected.z) * 10000) + 1);
    }

    _applyView(view) {
      const resolved = normalizeView(view, this.fallbackView);
      this.camera.position.set(resolved.camera.x, resolved.camera.y, resolved.camera.z);
      if (this.controls) {
        this.controls.target.set(resolved.target.x, resolved.target.y, resolved.target.z);
        this.controls.update();
      } else {
        this.camera.lookAt(resolved.target.x, resolved.target.y, resolved.target.z);
      }
    }

    _applyStateView(state) {
      if (!state) return;

      const config = state.config || DEFAULT_CONFIG;
      const resolved = normalizeView(state.view, this.fallbackView);
      if (!this.autoFitView || !state.bounds) {
        this._applyView(resolved);
        return;
      }

      const center = state.bounds.center.clone();
      const radius = Math.max(state.bounds.radius, 12);
      const target = new THREE.Vector3(
        resolved.target.x,
        resolved.target.y,
        resolved.target.z
      );
      const cameraVector = new THREE.Vector3(
        resolved.camera.x - resolved.target.x,
        resolved.camera.y - resolved.target.y,
        resolved.camera.z - resolved.target.z
      );

      if (cameraVector.lengthSq() < 0.0001) {
        cameraVector.set(
          this.fallbackView.camera.x - this.fallbackView.target.x,
          this.fallbackView.camera.y - this.fallbackView.target.y,
          this.fallbackView.camera.z - this.fallbackView.target.z
        );
      }

      const exportedDistance = Math.max(cameraVector.length(), 1);
      cameraVector.normalize();

      const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov * 0.5) * this.camera.aspect);
      const upReference = Math.abs(cameraVector.dot(new THREE.Vector3(0, 1, 0))) > 0.96
        ? new THREE.Vector3(0, 0, 1)
        : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(upReference, cameraVector).normalize();
      const up = new THREE.Vector3().crossVectors(cameraVector, right).normalize();
      const points = Array.isArray(state.points) && state.points.length > 0 ? state.points : [center];
      const halfHorizontalTan = Math.max(Math.tan(horizontalFov * 0.5), 0.2);
      const halfVerticalTan = Math.max(Math.tan(verticalFov * 0.5), 0.2);
      const framingPadding = Math.max(8, radius * 0.08, config.nodeSize * 2.5);

      let fitDistance = Math.max(exportedDistance, 1);
      for (let i = 0; i < points.length; i += 1) {
        const offset = points[i].clone().sub(target);
        const depth = offset.dot(cameraVector);
        const horizontal = Math.abs(offset.dot(right));
        const vertical = Math.abs(offset.dot(up));
        fitDistance = Math.max(
          fitDistance,
          depth + (horizontal / halfHorizontalTan) + framingPadding,
          depth + (vertical / halfVerticalTan) + framingPadding
        );
      }

      const baseDistance = Math.max(exportedDistance, fitDistance);
      const distance = baseDistance * (state.zoomFactor || 1);
      const cameraPosition = target.clone().add(cameraVector.clone().multiplyScalar(distance));

      this.camera.position.copy(cameraPosition);
      this.camera.near = Math.max(0.1, distance / 800);
      this.camera.far = Math.max(2000, distance + radius * 10);
      this.camera.updateProjectionMatrix();
      if (this.controls) {
        this.controls.target.copy(target);
        this.controls.minDistance = THREE.MathUtils.clamp(distance * 0.28, 10, 240);
        this.controls.maxDistance = Math.max(this.controls.minDistance + 18, distance * 3.2);
        this.controls.update();
      } else {
        this.camera.lookAt(target);
      }

      if (this.debugMarker) {
        this.debugMarker.visible = this.debugEnabled;
        if (this.debugEnabled) {
          this.debugMarker.position.copy(target);
          this.debugMarker.scale.setScalar(Math.max(radius * 0.12, 6));
        }
      }
    }

    _resize() {
      if (!this.renderer || !this.camera || this._destroyed) return;
      const width = Math.max(1, this.container.clientWidth || 1);
      const height = Math.max(1, this.container.clientHeight || 1);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      if (this._activeState) {
        this._applyStateView(this._activeState);
      }
      this._updateDebugOverlay("resize");
      this._renderOnce();
    }

    _renderOnce() {
      if (!this.renderer || !this.scene || !this.camera) return;
      this.renderer.render(this.scene, this.camera);
    }
    _animate(time) {
      if (this._destroyed) return;
      this._frameHandle = requestAnimationFrame(this._boundAnimate);
      const now = typeof time === "number" ? time : performance.now();
      const delta = Math.max(0, now - (this._lastFrameTime || now));
      this._lastFrameTime = now;
      this._elapsed += delta;
      if (this.controls) {
        this.controls.update();
      }
      if (this._activeState && this._activeState.group.visible) {
        this._updateStateFrame(this._activeState, this._elapsed / 1000);
      }
      this._updateDebugOverlay();
      this.renderer.render(this.scene, this.camera);
    }

    _updateStateFrame(state, elapsed) {
      const config = state.config;
      for (let i = 0; i < state.nodes.length; i += 1) {
        const node = state.nodes[i];
        node.mesh.position.copy(node.position);
        node.glow.position.copy(node.position);
        this._placeIcon(node.iconEl, node.position, config, node.localScale);
      }
      for (let i = 0; i < state.devices.length; i += 1) {
        const device = state.devices[i];
        device.position.copy(device.node.position).add(device.offset);
        device.mesh.position.copy(device.position);
        this._placeIcon(device.iconEl, device.position, config, device.localScale);
      }
      for (let i = 0; i < state.nodeLinks.length; i += 1) {
        const link = state.nodeLinks[i];
        if (!link || link.failed || !link.actor) continue;
        try {
          const isDisconnected = link.status === "disconnected";
          const isHidden = link.visibility === "hidden";
          window.LinkEffects.updateLinkMotion({
            actor: link.actor,
            start: link.start,
            end: link.end,
            elapsed: elapsed,
            isNodeLink: true,
            isSelected: false,
            isDisconnected: isDisconnected,
            reconnectPulse: 0,
            isHidden: isHidden,
            config: config,
            nodeSize: config.nodeSize,
            deviceSize: config.deviceSize
          });
          this._placeLinkBreakMarker(link);
        } catch (error) {
          link.failed = true;
          if (link.actor) {
            try { window.LinkEffects.disposeLinkActor(link.actor); } catch (_) { }
            link.actor = null;
          }
          this._hideLinkBreakMarker(link);
        }
      }
      for (let i = 0; i < state.deviceLinks.length; i += 1) {
        const link = state.deviceLinks[i];
        if (!link || link.failed || !link.actor) continue;
        try {
          const isDisconnected = link.status === "disconnected";
          const isHidden = link.visibility === "hidden";
          window.LinkEffects.updateLinkMotion({
            actor: link.actor,
            start: link.start,
            end: link.end,
            elapsed: elapsed,
            isNodeLink: false,
            isSelected: false,
            isDisconnected: isDisconnected,
            reconnectPulse: 0,
            isHidden: isHidden,
            config: config,
            nodeSize: config.nodeSize,
            deviceSize: config.deviceSize
          });
          this._placeLinkBreakMarker(link);
        } catch (error) {
          link.failed = true;
          if (link.actor) {
            try { window.LinkEffects.disposeLinkActor(link.actor); } catch (_) { }
            link.actor = null;
          }
          this._hideLinkBreakMarker(link);
        }
      }
    }

    _placeIcon(element, worldPosition, config, localScale) {
      if (!element) return;
      const projected = worldPosition.clone().project(this.camera);
      if (projected.z <= -1 || projected.z >= 1) {
        element.style.display = "none";
        return;
      }
      element.style.display = "block";
      const width = Math.max(1, this.container.clientWidth || 1);
      const height = Math.max(1, this.container.clientHeight || 1);
      element.style.left = ((projected.x * 0.5 + 0.5) * width) + "px";
      element.style.top = ((-projected.y * 0.5 + 0.5) * height) + "px";
      const distanceToCamera = this.camera.position.distanceTo(worldPosition);
      const perspectiveStrength = THREE.MathUtils.clamp(config.perspectiveStrength || 1, 0.6, 2);
      const baseDistanceScale = Math.pow(95 / Math.max(distanceToCamera, 0.001), perspectiveStrength);
      const viewportScale = THREE.MathUtils.clamp(height / 900, 0.42, 1.25);
      const fovReference = THREE.MathUtils.degToRad(74 * 0.5);
      const fovCurrent = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
      const fovScale = THREE.MathUtils.clamp(
        Math.tan(fovReference) / Math.max(Math.tan(fovCurrent), 0.001),
        0.75,
        1.35
      );
      const iconScaleBias = 0.78;
      const distanceScale = THREE.MathUtils.clamp(baseDistanceScale * viewportScale * fovScale * iconScaleBias, 0.12, 1.02);
      const stateScale = normalizeScale(localScale);
      element.style.transform = "translate(-50%, -50%) scale(" + (distanceScale * stateScale) + ")";
      element.style.zIndex = String(Math.floor((1 - projected.z) * 10000));
    }

    _buildBackground() {
      const starGroup = new THREE.Group();
      const ringGroup = new THREE.Group();
      const count = 900;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const i3 = i * 3;
        positions[i3] = THREE.MathUtils.randFloat(-520, 520);
        positions[i3 + 1] = THREE.MathUtils.randFloat(-520, 520);
        positions[i3 + 2] = THREE.MathUtils.randFloat(-520, 520);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.05, transparent: true, opacity: 0.88, sizeAttenuation: true });
      starGroup.add(new THREE.Points(starGeometry, starMaterial));
      for (let i = 0; i < 3; i += 1) {
        const radius = 32 + i * 10;
        const points = [];
        for (let step = 0; step < 64; step += 1) {
          const angle = (step / 64) * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const ring = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: i === 0 ? 0x0d2c45 : 0x0a2037, transparent: true, opacity: 0.16 - i * 0.03 }));
        ring.position.y = -20 + i * 0.4;
        ringGroup.add(ring);
      }
      this.backgroundGroup.add(starGroup);
      this.backgroundGroup.add(ringGroup);
    }

    _disposeBackground() {
      if (!this.backgroundGroup) return;
      this.backgroundGroup.traverse((object) => {
        if (object.geometry && typeof object.geometry.dispose === "function") object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material && material.dispose && material.dispose());
          } else if (typeof object.material.dispose === "function") {
            object.material.dispose();
          }
        }
      });
    }

    _disposeState(state) {
      if (!state) return;
      for (let i = 0; i < state.nodes.length; i += 1) {
        const node = state.nodes[i];
        if (node.iconEl && node.iconEl.parentNode) node.iconEl.parentNode.removeChild(node.iconEl);
        if (node.mesh) { node.mesh.geometry.dispose(); node.mesh.material.dispose(); }
        if (node.glow) { node.glow.geometry.dispose(); node.glow.material.dispose(); }
      }
      for (let i = 0; i < state.devices.length; i += 1) {
        const device = state.devices[i];
        if (device.iconEl && device.iconEl.parentNode) device.iconEl.parentNode.removeChild(device.iconEl);
        if (device.mesh) { device.mesh.geometry.dispose(); device.mesh.material.dispose(); }
      }
      for (let i = 0; i < state.nodeLinks.length; i += 1) window.LinkEffects.disposeLinkActor(state.nodeLinks[i].actor);
      for (let i = 0; i < state.nodeLinks.length; i += 1) {
        const link = state.nodeLinks[i];
        if (link && link.breakMarkerEl && link.breakMarkerEl.parentNode) {
          link.breakMarkerEl.parentNode.removeChild(link.breakMarkerEl);
        }
      }
      for (let i = 0; i < state.deviceLinks.length; i += 1) {
        const link = state.deviceLinks[i];
        window.LinkEffects.disposeLinkActor(link.actor);
        if (link && link.breakMarkerEl && link.breakMarkerEl.parentNode) {
          link.breakMarkerEl.parentNode.removeChild(link.breakMarkerEl);
        }
      }
      if (state.group && state.group.parent) state.group.parent.remove(state.group);
    }

    _setStatus(message, isError) {
      if (!this.errorBox) return;
      if (!message) {
        this.errorBox.textContent = "";
        this.errorBox.style.opacity = "0";
        this._updateDebugOverlay();
        return;
      }
      this.errorBox.textContent = message;
      this.errorBox.style.opacity = isError ? "1" : "0.62";
      this.errorBox.style.color = isError ? "#ffd6d6" : "#d7ecff";
      this._updateDebugOverlay("status: " + message);
    }

    _updateDebugOverlay(note) {
      if (!this.debugEnabled || !this.debugBox) return;

      const lines = [];
      const canvasWidth = this.canvas ? this.canvas.width : 0;
      const canvasHeight = this.canvas ? this.canvas.height : 0;
      const containerWidth = this.container ? this.container.clientWidth : 0;
      const containerHeight = this.container ? this.container.clientHeight : 0;

      lines.push("canvas: " + canvasWidth + "x" + canvasHeight);
      lines.push("container: " + containerWidth + "x" + containerHeight);
      lines.push("active: " + (this._activeMode || "none"));

      if (this.camera) {
        lines.push(
          "camera: " +
          this.camera.position.x.toFixed(1) + "," +
          this.camera.position.y.toFixed(1) + "," +
          this.camera.position.z.toFixed(1)
        );
      }

      for (let i = 0; i < STATE_ORDER.length; i += 1) {
        const mode = STATE_ORDER[i];
        const state = this._states.get(mode);
        if (!state) {
          lines.push(mode + ": pending");
          continue;
        }
        if (state.error) {
          lines.push(mode + ": error");
          continue;
        }
        lines.push(
          mode + ": nodes " + state.nodes.length +
          " devices " + state.devices.length +
          " links " + (state.nodeLinks.length + state.deviceLinks.length) +
          " visible " + (state.group && state.group.visible ? "yes" : "no")
        );
      }

      if (note) {
        lines.push("note: " + note);
      }

      this.debugBox.textContent = lines.join("\n");
    }
  }

  window.MeshScenePlayer = MeshScenePlayer;
  if (typeof module !== "undefined" && module.exports) module.exports = MeshScenePlayer;
})();
