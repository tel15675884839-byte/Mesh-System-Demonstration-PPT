(function () {
  const meshStates = {
    normal: {
      title: "Multiple paths ready",
      copy: "The default route carries the signal while backup relays stay available."
    },
    blocked: {
      title: "Primary link lost",
      copy: "One hop is removed, so the break is obvious before the message reaches the panel."
    },
    recovery: {
      title: "Auto recovery active",
      copy: function (result) {
        return "Backup route " + result + " reroutes around the failed link and keeps the panel connected.";
      }
    },
    diagnostic: {
      title: "3D player check",
      copy: "This mode bypasses JSON files and renders a hardcoded scene so we can verify the player itself is working."
    }
  };

  const ASSET_VERSION = "20260407c";

  function withVersion(path) {
    return path + "?v=" + ASSET_VERSION;
  }

  const LOCKED_STATE_BASE_PATH = "../assets/mesh-states";
  const LOCKED_STATE_PATHS = {
    normal: LOCKED_STATE_BASE_PATH + "/normal.json",
    blocked: LOCKED_STATE_BASE_PATH + "/blocked.json",
    recovery1: LOCKED_STATE_BASE_PATH + "/recovery-1.json",
    recovery2: LOCKED_STATE_BASE_PATH + "/recovery-2.json"
  };
  const DEMO_SCENE_STORAGE_KEY = "mesh_demo_scene_v1";
  const DEMO_SCENE_STORAGE_VERSION = 1;

  const diagnosticStateData = {
    diagnostic: {
      version: 1,
      config: {
        nodeSize: 4.4,
        deviceSize: 1.4,
        perspectiveStrength: 1.1,
        deviceShellRadius: 12,
        nodeRange: 80,
        deviceRange: 42,
        nodeLinkColor: "#5fd6ff",
        nodeLinkDash: 1.4,
        nodeLinkGap: 0.38,
        nodeLinkWidth: 1.5,
        deviceLinkColor: "#8effb3",
        deviceLinkDash: 1.1,
        deviceLinkGap: 0.4,
        deviceLinkWidth: 1.2,
        nodeLinkMotionMode: "quantum",
        nodeLinkMotionSpeed: 1.2,
        nodeLinkMotionIntensity: 2,
        nodeLinkMotionSpacing: 0.18,
        deviceLinkMotionMode: "standard",
        deviceLinkMotionSpeed: 1,
        deviceLinkMotionIntensity: 1,
        deviceLinkMotionSpacing: 0.18,
        bidirectionalMotion: true
      },
      view: {
        camera: {
          x: 0,
          y: 20,
          z: 68
        },
        target: {
          x: 0,
          y: 0,
          z: 0
        }
      },
      nodes: [
        { id: "diag-1", position: { x: -18, y: 0, z: 0 }, shellRadius: 12 },
        { id: "diag-2", position: { x: 0, y: 8, z: -10 }, shellRadius: 12 },
        { id: "diag-3", position: { x: 0, y: -8, z: 10 }, shellRadius: 12 },
        { id: "diag-4", position: { x: 18, y: 0, z: 0 }, shellRadius: 12 }
      ],
      devices: [
        { nodeId: "diag-1", type: "smoke", position: { x: -28, y: 7, z: -4 }, offset: { x: -10, y: 7, z: -4 } },
        { nodeId: "diag-2", type: "heat-mult", position: { x: 8, y: 15, z: -16 }, offset: { x: 8, y: 7, z: -6 } },
        { nodeId: "diag-3", type: "sounder", position: { x: 8, y: -13, z: 16 }, offset: { x: 8, y: -5, z: 6 } },
        { nodeId: "diag-4", type: "mcp", position: { x: 28, y: 7, z: 4 }, offset: { x: 10, y: 7, z: 4 } }
      ]
    }
  };

  const PLAYER_STATE_ORDER = ["normal", "blocked", "recovery", "recovery-2", "diagnostic"];
  const RECOVERY_PLAYER_MODES = {
    "1": "recovery",
    "2": "recovery-2"
  };

  function getStatePaths() {
    return {
      normal: [withVersion(LOCKED_STATE_PATHS.normal)],
      blocked: [withVersion(LOCKED_STATE_PATHS.blocked)],
      recovery: [withVersion(LOCKED_STATE_PATHS.recovery1)],
      "recovery-2": [withVersion(LOCKED_STATE_PATHS.recovery2)]
    };
  }

  function getPlayerStateDataForSelection() {
    return Object.assign({}, diagnosticStateData);
  }

  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function readDemoSceneSnapshot() {
    try {
      const raw = window.localStorage.getItem(DEMO_SCENE_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!isRecord(parsed)) {
        return null;
      }
      if (typeof parsed.version === "number" && parsed.version !== DEMO_SCENE_STORAGE_VERSION) {
        return null;
      }
      return parsed;
    } catch (_error) {
      return null;
    }
  }

  function getDemoConfigOverride() {
    const snapshot = readDemoSceneSnapshot();
    if (!snapshot || !isRecord(snapshot.config)) {
      return null;
    }
    return snapshot.config;
  }

  const dependencyScripts = [
    {
      name: "THREE",
      isReady: function () {
        return !!window.THREE;
      },
      sources: [
        withVersion("../Mesh System Demonstration/three.min.js"),
        withVersion("../Mesh System Demonstration/release/MeshDemo-portable/three.min.js")
      ]
    },
    {
      name: "OrbitControls",
      isReady: function () {
        return !!(window.THREE && window.THREE.OrbitControls);
      },
      sources: [
        withVersion("../Mesh System Demonstration/OrbitControls.js"),
        withVersion("../Mesh System Demonstration/release/MeshDemo-portable/OrbitControls.js")
      ]
    },
    {
      name: "LinkEffects",
      isReady: function () {
        return !!window.LinkEffects;
      },
      sources: [
        withVersion("../Mesh System Demonstration/link-effects.js"),
        withVersion("../Mesh System Demonstration/release/MeshDemo-portable/link-effects.js")
      ]
    },
    {
      name: "MeshScenePlayer",
      isReady: function () {
        return typeof window.MeshScenePlayer === "function";
      },
      sources: [
        withVersion("../js/mesh-scene-player.js")
      ]
    }
  ];

  const iconBasePathCandidates = [
    "../Mesh System Demonstration/assets/icons/",
    "../Mesh System Demonstration/release/MeshDemo-portable/assets/icons/"
  ];

  const page = document.querySelector(".page-mesh");
  const introTrigger = document.getElementById("mesh-intro-trigger");
  const introTitle = page ? page.querySelector(".mesh-intro-title") : null;
  const heroTitle = page ? page.querySelector(".mesh-hero h2") : null;
  const meshStage = document.querySelector(".mesh-stage");
  const meshPlayerHost = document.getElementById("mesh-player-host");
  const meshPlayerMessage = document.getElementById("mesh-player-message");
  const titleElement = document.getElementById("mesh-status-title");
  const buttons = Array.from(document.querySelectorAll(".mode-button"));
  const recoverySwitch = document.getElementById("mesh-recovery-switch");
  const recoveryResultButtons = Array.from(document.querySelectorAll(".mesh-recovery-result"));

  let mode = "normal";
  let recoveryResult = "1";
  let player = null;
  let bootstrapPromise = null;
  let diagnosticScene = null;
  let resolvedIconBasePathPromise = null;
  let playerAvailability = null;
  let revealSyncTimeout = 0;
  let introBaseWidth = 0;
  const searchParams = new URLSearchParams(window.location.search);
  const forceRevealOnLoad = searchParams.get("reveal") === "1";
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  function setMessage(message, kind) {
    if (!meshPlayerMessage || !meshStage) {
      return;
    }

    if (!message) {
      meshPlayerMessage.hidden = true;
      meshPlayerMessage.textContent = "";
      meshPlayerMessage.dataset.kind = "";
      meshStage.classList.remove("is-loading", "is-error");
      return;
    }

    meshPlayerMessage.hidden = false;
    meshPlayerMessage.textContent = message;
    meshPlayerMessage.dataset.kind = kind || "info";
    meshStage.classList.toggle("is-loading", kind === "loading");
    meshStage.classList.toggle("is-error", kind === "error");
  }

  function setStatus(modeName) {
    const state = meshStates[modeName];
    if (!state || !titleElement) {
      return;
    }

    titleElement.textContent = state.title;
  }

  function setModeButtons(activeMode) {
    buttons.forEach((button) => {
      const isActive = button.dataset.mode === activeMode;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    if (meshStage) {
      meshStage.dataset.activeMode = activeMode;
    }
  }

  function setRecoverySwitchVisibility(activeMode) {
    if (!recoverySwitch) {
      return;
    }
    const visible = activeMode === "recovery";
    recoverySwitch.hidden = !visible;
    recoverySwitch.setAttribute("aria-hidden", String(!visible));
    recoverySwitch.style.display = visible ? "inline-grid" : "none";
    recoverySwitch.style.pointerEvents = visible ? "auto" : "none";
  }

  function setRecoveryResultButtons(activeResult) {
    recoveryResultButtons.forEach((button) => {
      const isActive = button.dataset.recoveryResult === activeResult;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function setAvailability(statusMap) {
    buttons.forEach((button) => {
      if (button.dataset.mode === "diagnostic") {
        button.disabled = false;
        button.classList.remove("is-disabled");
        button.setAttribute("aria-disabled", "false");
        button.title = "Built-in diagnostic scene";
        return;
      }

      const stateStatus = getUiModeAvailability(statusMap, button.dataset.mode);
      const enabled = !!(stateStatus && stateStatus.ok);
      button.disabled = !enabled;
      button.classList.toggle("is-disabled", !enabled);
      button.setAttribute("aria-disabled", String(!enabled));
      if (stateStatus && stateStatus.error) {
        button.title = stateStatus.error.message || "State file failed to load.";
      } else {
        button.removeAttribute("title");
      }
    });
  }

  function getUiModeAvailability(statusMap, uiMode) {
    if (!statusMap) {
      return null;
    }

    if (uiMode !== "recovery") {
      return statusMap[uiMode] || null;
    }

    const recoveryPrimary = statusMap.recovery || null;
    const recoverySecondary = statusMap["recovery-2"] || null;

    if ((recoveryPrimary && recoveryPrimary.ok) || (recoverySecondary && recoverySecondary.ok)) {
      return { ok: true, error: null };
    }

    return recoveryPrimary || recoverySecondary || null;
  }

  function getPlayerModeForUiMode(uiMode, statusMap) {
    if (uiMode !== "recovery") {
      return uiMode;
    }

    const preferredMode = RECOVERY_PLAYER_MODES[recoveryResult] || "recovery";
    const fallbackMode = preferredMode === "recovery" ? "recovery-2" : "recovery";
    const preferredStatus = statusMap ? statusMap[preferredMode] : null;
    const fallbackStatus = statusMap ? statusMap[fallbackMode] : null;

    if (preferredStatus && preferredStatus.ok) {
      return preferredMode;
    }
    if (fallbackStatus && fallbackStatus.ok) {
      return fallbackMode;
    }

    return preferredMode;
  }

  function stopDiagnosticScene() {
    if (!diagnosticScene) {
      return;
    }

    if (diagnosticScene.frame) {
      window.cancelAnimationFrame(diagnosticScene.frame);
    }

    if (diagnosticScene.onResize) {
      window.removeEventListener("resize", diagnosticScene.onResize);
    }

    if (diagnosticScene.renderer) {
      diagnosticScene.renderer.dispose();
    }
    if (diagnosticScene.controls && typeof diagnosticScene.controls.dispose === "function") {
      diagnosticScene.controls.dispose();
    }

    if (meshPlayerHost) {
      meshPlayerHost.innerHTML = "";
    }

    diagnosticScene = null;
  }

  function resetPlayerInstance() {
    if (player && typeof player.destroy === "function") {
      player.destroy();
    }
    player = null;
    bootstrapPromise = null;
    playerAvailability = null;
  }

  function startDiagnosticScene() {
    stopDiagnosticScene();

    if (!meshPlayerHost || !window.THREE) {
      throw new Error("Three.js is unavailable for diagnostic mode.");
    }

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    meshPlayerHost.innerHTML = "";
    meshPlayerHost.appendChild(canvas);

    const renderer = new window.THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new window.THREE.Scene();
    scene.background = new window.THREE.Color(0x07111c);

    const camera = new window.THREE.PerspectiveCamera(52, 1, 0.1, 1000);
    camera.position.set(0, 6, 30);
    const initialTarget = new window.THREE.Vector3(0, 0, 0);
    camera.lookAt(initialTarget);

    let controls = null;
    if (window.THREE.OrbitControls) {
      controls = new window.THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = true;
      controls.minDistance = 14;
      controls.maxDistance = 120;
      controls.target.copy(initialTarget);
      controls.update();
    }

    const ambient = new window.THREE.AmbientLight(0xffffff, 0.9);
    const key = new window.THREE.DirectionalLight(0x7fe8ff, 1.1);
    key.position.set(18, 20, 12);
    scene.add(ambient);
    scene.add(key);

    const cube = new window.THREE.Mesh(
      new window.THREE.BoxGeometry(8, 8, 8),
      new window.THREE.MeshStandardMaterial({
        color: 0x25dfff,
        emissive: 0x0b3b52,
        metalness: 0.35,
        roughness: 0.24
      })
    );
    scene.add(cube);

    const edges = new window.THREE.LineSegments(
      new window.THREE.EdgesGeometry(new window.THREE.BoxGeometry(8.2, 8.2, 8.2)),
      new window.THREE.LineBasicMaterial({ color: 0xffffff })
    );
    scene.add(edges);

    const axes = new window.THREE.AxesHelper(10);
    scene.add(axes);

    const grid = new window.THREE.GridHelper(44, 12, 0x2ed8ff, 0x123042);
    grid.position.y = -8;
    scene.add(grid);

    function resize() {
      const width = Math.max(meshPlayerHost.clientWidth || 1, 1);
      const height = Math.max(meshPlayerHost.clientHeight || 1, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (controls) {
        controls.update();
      }
    }

    function loop() {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.015;
      edges.rotation.x = cube.rotation.x;
      edges.rotation.y = cube.rotation.y;
      if (controls) {
        controls.update();
      }
      renderer.render(scene, camera);
      if (diagnosticScene) {
        diagnosticScene.frame = window.requestAnimationFrame(loop);
      }
    }

    diagnosticScene = {
      scene: scene,
      renderer: renderer,
      frame: 0,
      onResize: resize,
      camera: camera,
      controls: controls,
      initialView: {
        position: camera.position.clone(),
        target: initialTarget.clone()
      }
    };

    resize();
    loop();
    window.addEventListener("resize", resize);
  }

  function isDependencyReady(dependency) {
    if (!dependency) {
      return false;
    }
    if (typeof dependency.isReady === "function") {
      return !!dependency.isReady();
    }
    return !!window[dependency.name];
  }

  function loadScript(dependency, src) {
    return new Promise((resolve, reject) => {
      if (isDependencyReady(dependency)) {
        resolve(true);
        return;
      }

      const dependencyName = dependency && dependency.name ? dependency.name : "unknown";
      const selector = 'script[data-mesh-dependency="' + dependencyName + '"][data-mesh-source="' + src + '"]';
      const existing = document.querySelector(selector);
      if (existing) {
        existing.addEventListener("load", function () {
          if (isDependencyReady(dependency)) {
            resolve(true);
            return;
          }
          reject(new Error("Dependency loaded but unavailable: " + dependencyName));
        }, { once: true });
        existing.addEventListener("error", function () {
          reject(new Error("Failed to load dependency: " + src));
        }, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.meshDependency = dependencyName;
      script.dataset.meshSource = src;
      script.onload = function () {
        if (isDependencyReady(dependency)) {
          resolve(true);
          return;
        }
        reject(new Error("Dependency loaded but unavailable: " + dependencyName));
      };
      script.onerror = function () {
        reject(new Error("Failed to load dependency: " + src));
      };
      document.head.appendChild(script);
    });
  }

  async function loadDependencyWithFallback(dependency) {
    const dependencyName = dependency && dependency.name ? dependency.name : "unknown";
    const sources = Array.isArray(dependency.sources) ? dependency.sources.slice() : [];
    const attempts = [];

    if (isDependencyReady(dependency)) {
      return true;
    }

    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i];
      if (!source) {
        continue;
      }

      try {
        await loadScript(dependency, source);
        return true;
      } catch (error) {
        attempts.push((error && error.message) ? error.message : String(error));
      }
    }

    throw new Error("Failed to load dependency " + dependencyName + ". Tried: " + attempts.join(" | "));
  }

  function probeIconBasePath(basePath) {
    return new Promise((resolve) => {
      const image = new Image();
      let settled = false;

      function finish(ok) {
        if (settled) {
          return;
        }
        settled = true;
        resolve(ok);
      }

      image.onload = function () {
        finish(true);
      };
      image.onerror = function () {
        finish(false);
      };

      image.src = withVersion(basePath + "node.svg");
      window.setTimeout(function () {
        finish(false);
      }, 1600);
    });
  }

  async function detectIconBasePath() {
    for (let i = 0; i < iconBasePathCandidates.length; i += 1) {
      const candidate = iconBasePathCandidates[i];
      const isAvailable = await probeIconBasePath(candidate);
      if (isAvailable) {
        return candidate;
      }
    }
    return iconBasePathCandidates[0];
  }

  async function ensureDependencies() {
    for (let i = 0; i < dependencyScripts.length; i += 1) {
      await loadDependencyWithFallback(dependencyScripts[i]);
    }
  }

  async function ensurePlayer() {
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async function () {
      setMessage("Loading 3D mesh player...", "loading");
      if (meshStage) {
        meshStage.setAttribute("aria-busy", "true");
      }

      await ensureDependencies();

      if (!resolvedIconBasePathPromise) {
        resolvedIconBasePathPromise = detectIconBasePath();
      }
      const iconBasePath = await resolvedIconBasePathPromise;
      const selectedStatePaths = getStatePaths();
      const selectedStateData = getPlayerStateDataForSelection(recoveryResult);
      const demoConfigOverride = getDemoConfigOverride();

      if (typeof window.MeshScenePlayer !== "function") {
        throw new Error("MeshScenePlayer is unavailable.");
      }

      player = new window.MeshScenePlayer({
        container: meshPlayerHost,
        stateOrder: PLAYER_STATE_ORDER,
        statePaths: selectedStatePaths,
        stateData: selectedStateData,
        globalConfigOverride: demoConfigOverride,
        iconBasePath: iconBasePath,
        fallbackView: {
          camera: { x: 0, y: 24, z: 88 },
          target: { x: 0, y: 0, z: 0 }
        },
        initialMode: getPlayerModeForUiMode(mode),
        autoFitView: false,
        autostart: false
      });

      await player.preload();

      const availability = typeof player.getStateAvailability === "function"
        ? player.getStateAvailability()
        : null;
      playerAvailability = availability;
      setAvailability(availability);

      const selectableModes = ["normal", "blocked", "recovery"];
      const preferredMode = selectableModes.indexOf(mode) >= 0 ? mode : "normal";
      const preferredStatus = getUiModeAvailability(availability, preferredMode);
      let nextMode = preferredStatus && preferredStatus.ok ? preferredMode : null;

      if (!nextMode) {
        for (let i = 0; i < selectableModes.length; i += 1) {
          const modeName = selectableModes[i];
          const modeStatus = getUiModeAvailability(availability, modeName);
          if (modeStatus && modeStatus.ok) {
            nextMode = modeName;
            break;
          }
        }
      }

      if (!nextMode) {
        throw new Error("Locked state files were not found under ../assets/mesh-states (normal.json, blocked.json, recovery-1.json, recovery-2.json).");
      }

      mode = nextMode;
      setStatus(mode);
      setModeButtons(mode);
      setRecoverySwitchVisibility(mode);
      setRecoveryResultButtons(recoveryResult);

      const switched = await player.switchMode(getPlayerModeForUiMode(mode, availability));
      if (!switched) {
        throw new Error("Unable to activate the initial mesh state.");
      }

      if (meshStage) {
        meshStage.removeAttribute("aria-busy");
      }
      setMessage("");
      return player;
    }()).catch(function (error) {
      if (meshStage) {
        meshStage.removeAttribute("aria-busy");
      }
      const protocolHint = window.location.protocol === "file:"
        ? " Local file mode may block direct JSON loading. Open the project with start-local-server.bat and use http://127.0.0.1:8765/ instead."
        : "";
      setMessage(
        "3D player failed to load. " + (error && error.message ? error.message : String(error)) + protocolHint,
        "error"
      );
      throw error;
    });

    return bootstrapPromise;
  }

  async function applyMeshMode(newMode) {
    if (!meshStates[newMode]) {
      return;
    }

    const button = buttons.find(function (item) {
      return item.dataset.mode === newMode;
    });

    if (button && button.disabled) {
      return;
    }

    mode = newMode;
    setStatus(mode);
    setModeButtons(mode);
    setRecoverySwitchVisibility(mode);
    setRecoveryResultButtons(recoveryResult);

    try {
      await ensureDependencies();

      if (mode === "diagnostic") {
        resetPlayerInstance();
        startDiagnosticScene();
        setMessage("");
        return;
      }

      stopDiagnosticScene();
      const readyPlayer = await ensurePlayer();
      if (!readyPlayer) {
        return;
      }

      const switched = await readyPlayer.switchMode(getPlayerModeForUiMode(mode, playerAvailability));
      if (!switched) {
        setMessage("Failed to switch the 3D player to " + mode + ".", "error");
        return;
      }

      setMessage("");
    } catch (error) {
      setMessage(
        "Failed to activate the 3D player. " + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  async function applyRecoveryResult(nextResult) {
    if (nextResult !== "1" && nextResult !== "2") {
      return;
    }

    if (recoveryResult === nextResult) {
      return;
    }

    recoveryResult = nextResult;
    setRecoveryResultButtons(recoveryResult);
    setStatus(mode);

    if (mode !== "recovery") {
      return;
    }

    await applyMeshMode("recovery");
  }

  function shouldReduceMotion() {
    return !!(prefersReducedMotion && prefersReducedMotion.matches);
  }

  function setRevealState(isRevealed) {
    if (!page) {
      return;
    }
    page.classList.toggle("is-revealed", !!isRevealed);
    if (introTrigger) {
      introTrigger.setAttribute("aria-expanded", String(!!isRevealed));
    }
  }

  function syncStageAfterReveal() {
    window.dispatchEvent(new Event("resize"));
  }

  function schedulePostRevealSync() {
    if (revealSyncTimeout) {
      window.clearTimeout(revealSyncTimeout);
    }
    window.requestAnimationFrame(syncStageAfterReveal);
    revealSyncTimeout = window.setTimeout(function () {
      syncStageAfterReveal();
      revealSyncTimeout = 0;
    }, 760);
  }

  function updateIntroTitleTarget() {
    if (!page || !heroTitle) {
      return;
    }
    const heroRect = heroTitle.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    const targetLeft = ((heroRect.left + (heroRect.width / 2) - pageRect.left) / Math.max(pageRect.width, 1)) * 100;
    const targetTop = ((heroRect.top + (heroRect.height / 2) - pageRect.top) / Math.max(pageRect.height, 1)) * 100;
    const introRect = introTitle ? introTitle.getBoundingClientRect() : null;
    if (!introBaseWidth && introRect) {
      introBaseWidth = introRect.width;
    }
    const scale = heroRect.width / Math.max(introBaseWidth || (introRect ? introRect.width : 1), 1);

    page.style.setProperty("--mesh-intro-target-left", targetLeft + "%");
    page.style.setProperty("--mesh-intro-target-top", targetTop + "%");
    page.style.setProperty("--mesh-intro-target-scale", String(scale));
  }

  function enterStageState() {
    if (!page) {
      return;
    }
    if (revealSyncTimeout) {
      window.clearTimeout(revealSyncTimeout);
      revealSyncTimeout = 0;
    }
    updateIntroTitleTarget();
    setRevealState(true);
    window.requestAnimationFrame(syncStageAfterReveal);
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyMeshMode(button.dataset.mode);
    });
  });

  recoveryResultButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyRecoveryResult(button.dataset.recoveryResult).catch(function () {
        return null;
      });
    });
  });

  window.addEventListener("resize", function () {
    updateIntroTitleTarget();
  });

  window.addEventListener("storage", function (event) {
    if (!event || event.key !== DEMO_SCENE_STORAGE_KEY) {
      return;
    }
    if (mode === "diagnostic") {
      return;
    }
    resetPlayerInstance();
    applyMeshMode(mode).catch(function () {
      return null;
    });
  });

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "slideVisibility") {
      return;
    }

    if (event.data.active) {
      enterStageState();
    }
  });

  setStatus(mode);
  setModeButtons(mode);
  setRecoverySwitchVisibility(mode);
  setRecoveryResultButtons(recoveryResult);
  enterStageState();
  if (forceRevealOnLoad) {
    schedulePostRevealSync();
  }
  ensurePlayer().catch(function () {
    return null;
  });
}());


