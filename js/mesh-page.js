(function () {
  const meshStates = {
    normal: {
      title: "Default route is active",
      copy: "Signal follows the primary path from detector to panel through the mesh network."
    },
    blocked: {
      title: "Primary route is interrupted",
      copy: "One link becomes unavailable, so the transmission is visibly interrupted before reaching the panel."
    },
    recovery: {
      title: "Backup path recovers communication",
      copy: "The mesh network reroutes through a secondary path automatically to maintain stable delivery."
    },
    diagnostic: {
      title: "Built-in 3D diagnostic scene",
      copy: "This mode bypasses JSON files and renders a hardcoded scene so we can verify the player itself is working."
    }
  };

  const ASSET_VERSION = "20260403q";

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

  function getStatePathsForSelection(result) {
    const recoveryPath = result === "2" ? LOCKED_STATE_PATHS.recovery2 : LOCKED_STATE_PATHS.recovery1;
    return {
      normal: [withVersion(LOCKED_STATE_PATHS.normal)],
      blocked: [withVersion(LOCKED_STATE_PATHS.blocked)],
      recovery: [withVersion(recoveryPath)]
    };
  }

  function getPlayerStateDataForSelection() {
    return Object.assign({}, diagnosticStateData);
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

  const meshStage = document.querySelector(".mesh-stage");
  const meshLayout = document.querySelector(".mesh-layout");
  const meshHero = document.querySelector(".mesh-hero");
  const meshControls = document.querySelector(".mesh-controls");
  const meshStatusPanel = document.querySelector(".mesh-status-panel");
  const meshPlayerHost = document.getElementById("mesh-player-host");
  const meshPlayerMessage = document.getElementById("mesh-player-message");
  const zoomResetButton = document.getElementById("mesh-zoom-reset");
  const expandToggleButton = document.getElementById("mesh-expand-toggle");
  const titleElement = document.getElementById("mesh-status-title");
  const copyElement = document.getElementById("mesh-status-copy");
  const buttons = Array.from(document.querySelectorAll(".mode-button"));
  const recoverySwitch = document.getElementById("mesh-recovery-switch");
  const recoveryResultButtons = Array.from(document.querySelectorAll(".mesh-recovery-result"));

  let mode = "normal";
  let recoveryResult = "1";
  let player = null;
  let bootstrapPromise = null;
  let diagnosticScene = null;
  let resolvedIconBasePathPromise = null;
  let playerRecoveryResult = null;
  let isPlayerExpanded = false;
  let stageFlipAnimation = null;
  let layoutFlipAnimations = [];
  let particleCanvas = null;
  let particleFrame = 0;
  let resizeDispatchTimer = 0;
  let transitionToken = 0;

  const TRANSITION_DURATION = 680;
  const EASING_CURVE = "cubic-bezier(0.22, 1, 0.36, 1)";
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
    if (!state || !titleElement || !copyElement) {
      return;
    }

    if (modeName === "recovery") {
      titleElement.textContent = state.title + " (Result " + recoveryResult + ")";
    } else {
      titleElement.textContent = state.title;
    }
    copyElement.textContent = state.copy;
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
    recoverySwitch.style.display = visible ? "inline-flex" : "none";
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

      const stateStatus = statusMap ? statusMap[button.dataset.mode] : null;
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
    playerRecoveryResult = null;
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
      const selectedStatePaths = getStatePathsForSelection(recoveryResult);
      const selectedStateData = getPlayerStateDataForSelection(recoveryResult);

      if (typeof window.MeshScenePlayer !== "function") {
        throw new Error("MeshScenePlayer is unavailable.");
      }

      player = new window.MeshScenePlayer({
        container: meshPlayerHost,
        statePaths: selectedStatePaths,
        stateData: selectedStateData,
        iconBasePath: iconBasePath,
        fallbackView: {
          camera: { x: 0, y: 24, z: 88 },
          target: { x: 0, y: 0, z: 0 }
        },
        initialMode: mode,
        autoFitView: false,
        autostart: false
      });

      await player.preload();

      const availability = typeof player.getStateAvailability === "function"
        ? player.getStateAvailability()
        : null;
      setAvailability(availability);

      const selectableModes = ["normal", "blocked", "recovery"];
      const preferredMode = selectableModes.indexOf(mode) >= 0 ? mode : "normal";
      const preferredStatus = availability && preferredMode ? availability[preferredMode] : null;
      let nextMode = preferredStatus && preferredStatus.ok ? preferredMode : null;

      if (!nextMode) {
        for (let i = 0; i < selectableModes.length; i += 1) {
          const modeName = selectableModes[i];
          if (availability && availability[modeName] && availability[modeName].ok) {
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

      const switched = await player.switchMode(mode);
      if (!switched) {
        throw new Error("Unable to activate the initial mesh state.");
      }

      if (meshStage) {
        meshStage.removeAttribute("aria-busy");
      }
      playerRecoveryResult = recoveryResult;
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
      if (mode === "recovery" && player && playerRecoveryResult !== recoveryResult) {
        resetPlayerInstance();
      }
      const readyPlayer = await ensurePlayer();
      if (!readyPlayer) {
        return;
      }

      const switched = await readyPlayer.switchMode(mode);
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

    resetPlayerInstance();
    await applyMeshMode("recovery");
  }

  function resetView() {
    try {
      if (mode === "diagnostic" && diagnosticScene && diagnosticScene.initialView) {
        diagnosticScene.camera.position.copy(diagnosticScene.initialView.position);
        if (diagnosticScene.controls) {
          diagnosticScene.controls.target.copy(diagnosticScene.initialView.target);
          diagnosticScene.controls.update();
        } else {
          diagnosticScene.camera.lookAt(diagnosticScene.initialView.target);
        }
        diagnosticScene.renderer.render(diagnosticScene.scene, diagnosticScene.camera);
        return;
      }

      if (!player) {
        return;
      }

      if (typeof player.resetView === "function") {
        player.resetView();
      } else if (typeof player.resetZoom === "function") {
        player.resetZoom();
      }
    } catch (error) {
      setMessage(
        "Failed to reset view. " + (error && error.message ? error.message : String(error)),
        "error"
      );
    }
  }

  function setExpandButtonState(expanded) {
    if (!expandToggleButton) {
      return;
    }
    expandToggleButton.textContent = expanded ? "Restore" : "Expand";
    expandToggleButton.setAttribute("aria-pressed", String(expanded));
  }

  function shouldReduceMotion() {
    return !!(prefersReducedMotion && prefersReducedMotion.matches);
  }

  function clearElementTransforms() {
    [meshStage, meshHero, meshControls, meshStatusPanel].forEach(function (element) {
      if (element) {
        element.style.transform = "";
      }
    });
  }

  function stopParticleTransition() {
    if (particleFrame) {
      window.cancelAnimationFrame(particleFrame);
      particleFrame = 0;
    }
    if (particleCanvas && particleCanvas.parentNode) {
      particleCanvas.parentNode.removeChild(particleCanvas);
    }
    particleCanvas = null;
  }

  function cancelExpandTransition() {
    transitionToken += 1;
    if (stageFlipAnimation) {
      stageFlipAnimation.cancel();
      stageFlipAnimation = null;
    }
    layoutFlipAnimations.forEach(function (animation) {
      if (animation && typeof animation.cancel === "function") {
        animation.cancel();
      }
    });
    layoutFlipAnimations = [];
    if (resizeDispatchTimer) {
      window.clearTimeout(resizeDispatchTimer);
      resizeDispatchTimer = 0;
    }
    stopParticleTransition();
    clearElementTransforms();
  }

  function createFlipAnimation(element, firstRect, lastRect, duration) {
    if (!element || !firstRect || !lastRect) {
      return null;
    }

    const deltaX = firstRect.left - lastRect.left;
    const deltaY = firstRect.top - lastRect.top;
    const scaleX = firstRect.width / Math.max(lastRect.width, 1);
    const scaleY = firstRect.height / Math.max(lastRect.height, 1);

    if (Math.abs(deltaX) < 0.2 && Math.abs(deltaY) < 0.2 && Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001) {
      return null;
    }

    return element.animate(
      [
        {
          transformOrigin: "top left",
          transform: "translate(" + deltaX + "px, " + deltaY + "px) scale(" + scaleX + ", " + scaleY + ")"
        },
        {
          transformOrigin: "top left",
          transform: "translate(0, 0) scale(1, 1)"
        }
      ],
      {
        duration: duration,
        easing: EASING_CURVE,
        fill: "both"
      }
    );
  }

  function startParticleTransition(rectPairs, duration) {
    stopParticleTransition();
    if (!meshLayout || shouldReduceMotion() || !rectPairs || rectPairs.length === 0) {
      return;
    }

    const layoutRect = meshLayout.getBoundingClientRect();
    const width = Math.max(1, Math.round(layoutRect.width));
    const height = Math.max(1, Math.round(layoutRect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    particleCanvas = document.createElement("canvas");
    particleCanvas.className = "mesh-transition-layer";
    particleCanvas.width = Math.max(1, Math.round(width * dpr));
    particleCanvas.height = Math.max(1, Math.round(height * dpr));
    particleCanvas.style.width = width + "px";
    particleCanvas.style.height = height + "px";
    meshLayout.appendChild(particleCanvas);

    const context = particleCanvas.getContext("2d");
    if (!context) {
      stopParticleTransition();
      return;
    }
    context.scale(dpr, dpr);

    const particles = [];
    rectPairs.forEach(function (pair) {
      if (!pair || !pair.from || !pair.to) {
        return;
      }

      const from = pair.from;
      const to = pair.to;
      const area = Math.max(12000, from.width * from.height);
      const count = Math.max(28, Math.min(72, Math.round(area / 22000)));

      for (let i = 0; i < count; i += 1) {
        particles.push({
          sx: from.left - layoutRect.left + (Math.random() * from.width),
          sy: from.top - layoutRect.top + (Math.random() * from.height),
          ex: to.left - layoutRect.left + (Math.random() * to.width),
          ey: to.top - layoutRect.top + (Math.random() * to.height),
          delay: Math.random() * duration * 0.24,
          life: duration * (0.6 + Math.random() * 0.32),
          size: 0.9 + Math.random() * 1.8,
          drift: (Math.random() - 0.5) * 24,
          hueShift: Math.random() * 36
        });
      }
    });

    const startTime = performance.now();
    const frameLimit = duration * 1.16;

    function draw(now) {
      const elapsed = now - startTime;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        const local = (elapsed - p.delay) / Math.max(p.life, 1);
        if (local <= 0 || local >= 1) {
          continue;
        }

        const eased = 1 - Math.pow(1 - local, 3);
        const bend = Math.sin((local * Math.PI) + p.hueShift) * p.drift * (1 - local);
        const x = p.sx + (p.ex - p.sx) * eased;
        const y = p.sy + (p.ey - p.sy) * eased + bend * 0.35;
        const prevLocal = Math.max(0, local - 0.05);
        const prevEased = 1 - Math.pow(1 - prevLocal, 3);
        const px = p.sx + (p.ex - p.sx) * prevEased;
        const py = p.sy + (p.ey - p.sy) * prevEased + Math.sin((prevLocal * Math.PI) + p.hueShift) * p.drift * (1 - prevLocal) * 0.35;
        const alpha = Math.max(0, (1 - Math.abs(local - 0.5) * 2) * 0.68);

        context.strokeStyle = "rgba(82, 237, 255, " + (alpha * 0.45) + ")";
        context.lineWidth = Math.max(0.7, p.size * 0.7);
        context.beginPath();
        context.moveTo(px, py);
        context.lineTo(x, y);
        context.stroke();

        context.fillStyle = "rgba(132, 248, 255, " + alpha + ")";
        context.shadowBlur = 10;
        context.shadowColor = "rgba(85, 238, 255, 0.62)";
        context.beginPath();
        context.arc(x, y, p.size, 0, Math.PI * 2);
        context.fill();
      }

      context.shadowBlur = 0;
      if (elapsed < frameLimit && particleCanvas) {
        particleFrame = window.requestAnimationFrame(draw);
        return;
      }
      stopParticleTransition();
    }

    particleFrame = window.requestAnimationFrame(draw);
  }

  function togglePlayerExpand() {
    if (!meshStage || !meshLayout) {
      return;
    }

    cancelExpandTransition();
    const nextExpanded = !isPlayerExpanded;
    const duration = shouldReduceMotion() ? 220 : TRANSITION_DURATION;
    const token = transitionToken + 1;
    transitionToken = token;

    const animatedElements = [meshStage, meshHero, meshControls, meshStatusPanel].filter(function (element) {
      return !!element;
    });
    const firstRects = new Map(animatedElements.map(function (element) {
      return [element, element.getBoundingClientRect()];
    }));

    meshLayout.classList.toggle("is-player-expanded", nextExpanded);
    const lastRects = new Map(animatedElements.map(function (element) {
      return [element, element.getBoundingClientRect()];
    }));

    const particlePairs = [meshHero, meshControls, meshStatusPanel]
      .filter(function (element) { return !!element; })
      .map(function (element) {
        return {
          from: firstRects.get(element),
          to: lastRects.get(element)
        };
      });

    startParticleTransition(particlePairs, duration);
    layoutFlipAnimations = [];
    stageFlipAnimation = null;

    animatedElements.forEach(function (element) {
      const animation = createFlipAnimation(element, firstRects.get(element), lastRects.get(element), duration);
      if (!animation) {
        return;
      }
      layoutFlipAnimations.push(animation);
      if (element === meshStage) {
        stageFlipAnimation = animation;
      }
    });

    Promise.all(layoutFlipAnimations.map(function (animation) {
      return animation.finished.catch(function () {
        return null;
      });
    })).then(function () {
      if (token !== transitionToken) {
        return;
      }
      clearElementTransforms();
      layoutFlipAnimations = [];
      stageFlipAnimation = null;
    });

    isPlayerExpanded = nextExpanded;
    setExpandButtonState(isPlayerExpanded);
    resizeDispatchTimer = window.setTimeout(function () {
      resizeDispatchTimer = 0;
      window.dispatchEvent(new Event("resize"));
    }, duration + 20);
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

  if (zoomResetButton) {
    zoomResetButton.addEventListener("click", function () {
      resetView();
    });
  }

  if (expandToggleButton) {
    expandToggleButton.addEventListener("click", function () {
      togglePlayerExpand();
    });
  }

  window.addEventListener("resize", function () {
    if (layoutFlipAnimations.length > 0 || particleCanvas) {
      cancelExpandTransition();
    }
  });

  setStatus(mode);
  setModeButtons(mode);
  setRecoverySwitchVisibility(mode);
  setRecoveryResultButtons(recoveryResult);
  setExpandButtonState(isPlayerExpanded);
  ensurePlayer().catch(function () {
    return null;
  });
}());


