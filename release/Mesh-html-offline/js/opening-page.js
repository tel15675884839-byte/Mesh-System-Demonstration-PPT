(function () {
  const ASSET_VERSION = "20260414a";

  function withVersion(path) {
    return path + "?v=" + ASSET_VERSION;
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

  const openingStatePath = withVersion("../assets/mesh-states/opening.json");
  const openingStateMode = "opening";
  const openingStage = document.querySelector(".opening-stage");
  const openingPlayerHost = document.getElementById("opening-player-host");
  const openingPlayerMessage = document.getElementById("opening-player-message");
  const embeddedOpeningScene = document.getElementById("opening-scene-data");
  const viewToggleButtons = document.querySelectorAll(".view-toggle-button");

  let player = null;
  let bootstrapPromise = null;
  let resolvedIconBasePathPromise = null;
  const startsActive = window.parent === window;
  let isSlideActive = startsActive;
  let currentView = "2d";

  if (!openingStage || !openingPlayerHost) {
    return;
  }

  function setMessage(message, kind) {
    if (!openingPlayerMessage || !openingStage) {
      return;
    }

    if (!message) {
      openingPlayerMessage.hidden = true;
      openingPlayerMessage.textContent = "";
      openingPlayerMessage.dataset.kind = "";
      openingStage.classList.remove("is-loading", "is-error");
      return;
    }

    openingPlayerMessage.hidden = false;
    openingPlayerMessage.textContent = message;
    openingPlayerMessage.dataset.kind = kind || "info";
    openingStage.classList.toggle("is-loading", kind === "loading");
    openingStage.classList.toggle("is-error", kind === "error");
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
      const selector = 'script[data-opening-dependency="' + dependencyName + '"][data-opening-source="' + src + '"]';
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
      script.dataset.openingDependency = dependencyName;
      script.dataset.openingSource = src;
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

  async function ensureDependencies() {
    for (let i = 0; i < dependencyScripts.length; i += 1) {
      await loadDependencyWithFallback(dependencyScripts[i]);
    }
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

  function parseOpeningScene(text) {
    const trimmed = String(text || "").replace(/^\uFEFF/, "").trim();
    if (!trimmed) {
      throw new Error("Opening state file is empty.");
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        if (parsed.PLAYER_SCENE && typeof parsed.PLAYER_SCENE === "object") {
          return parsed.PLAYER_SCENE;
        }
        return parsed;
      }
    } catch (_error) {
    }

    try {
      const sandboxWindow = {};
      const evaluate = new Function(
        "window",
        "\"use strict\";\n" +
        trimmed +
        "\nreturn window.PLAYER_SCENE || null;"
      );
      const scene = evaluate(sandboxWindow);
      if (scene && typeof scene === "object") {
        return scene;
      }
    } catch (_error) {
    }

    throw new Error("Failed to parse opening.json scene payload.");
  }

  function loadEmbeddedOpeningScene() {
    if (!embeddedOpeningScene) {
      return null;
    }

    const rawText = String(embeddedOpeningScene.textContent || "").trim();
    if (!rawText) {
      return null;
    }

    return parseOpeningScene(rawText);
  }

  function loadLocalJsonTextViaIframe(url) {
    return new Promise(function (resolve, reject) {
      const iframe = document.createElement("iframe");
      let settled = false;
      const timeout = window.setTimeout(function () {
        cleanup();
        reject(new Error("Timed out while reading local opening.json file."));
      }, 5000);

      function cleanup() {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeout);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }

      iframe.style.position = "fixed";
      iframe.style.left = "-9999px";
      iframe.style.top = "0";
      iframe.style.width = "1px";
      iframe.style.height = "1px";
      iframe.style.opacity = "0";
      iframe.setAttribute("aria-hidden", "true");

      iframe.onload = function () {
        if (settled) {
          return;
        }

        try {
          const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
          const text = doc && doc.documentElement ? String(doc.documentElement.textContent || "").trim() : "";
          cleanup();
          if (!text) {
            reject(new Error("Local opening.json file loaded but returned empty content."));
            return;
          }

          resolve(text);
        } catch (_error) {
          cleanup();
          reject(new Error("Browser blocked local file access for opening.json."));
        }
      };

      iframe.onerror = function () {
        if (settled) {
          return;
        }
        cleanup();
        reject(new Error("Failed to read local opening.json file."));
      };

      iframe.src = url;
      document.body.appendChild(iframe);
    });
  }

  function hideOpeningNodeOrbs(playerInstance) {
    if (!playerInstance || !playerInstance._states || typeof playerInstance._states.get !== "function") {
      return;
    }

    const openingState = playerInstance._states.get(openingStateMode);
    if (!openingState || !Array.isArray(openingState.nodes)) {
      return;
    }

    for (let i = 0; i < openingState.nodes.length; i += 1) {
      const node = openingState.nodes[i];
      if (node && node.mesh) {
        node.mesh.visible = false;
      }
      if (node && node.glow) {
        node.glow.visible = false;
      }
    }
  }

  async function loadOpeningScene() {
    if (window.location.protocol === "file:") {
      const embeddedScene = loadEmbeddedOpeningScene();
      if (embeddedScene) {
        return embeddedScene;
      }
    }

    try {
      const response = await fetch(openingStatePath, {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error("HTTP " + response.status + " loading opening.json");
      }

      const rawText = await response.text();
      return parseOpeningScene(rawText);
    } catch (fetchError) {
      const embeddedScene = loadEmbeddedOpeningScene();
      if (embeddedScene) {
        return embeddedScene;
      }

      if (window.location.protocol !== "file:") {
        throw fetchError;
      }

      const rawText = await loadLocalJsonTextViaIframe(openingStatePath);
      return parseOpeningScene(rawText);
    }
  }

  async function ensurePlayer() {
    if (bootstrapPromise) {
      return bootstrapPromise;
    }

    bootstrapPromise = (async function () {
      setMessage("Loading opening stage...", "loading");
      openingStage.setAttribute("aria-busy", "true");

      await ensureDependencies();
      if (!resolvedIconBasePathPromise) {
        resolvedIconBasePathPromise = detectIconBasePath();
      }
      const iconBasePath = await resolvedIconBasePathPromise;
      const openingScene = await loadOpeningScene();

      if (typeof window.MeshScenePlayer !== "function") {
        throw new Error("MeshScenePlayer is unavailable.");
      }

      player = new window.MeshScenePlayer({
        container: openingPlayerHost,
        stateOrder: [openingStateMode],
        stateData: {
          opening: openingScene
        },
        initialMode: openingStateMode,
        iconBasePath: iconBasePath,
        fallbackView: {
          camera: { x: 0, y: 24, z: 88 },
          target: { x: 0, y: 0, z: 0 }
        },
        autoFitView: false,
        autostart: false,
        startActive: isSlideActive
      });

      await player.preload();
      const switched = await player.switchMode(openingStateMode);
      if (!switched) {
        throw new Error("Unable to activate opening scene.");
      }
      if (typeof player.setActive === "function") {
        player.setActive(isSlideActive);
      }
      hideOpeningNodeOrbs(player);

      openingStage.removeAttribute("aria-busy");
      setMessage("");
      return player;
    }()).catch(function (error) {
      openingStage.removeAttribute("aria-busy");
      const protocolHint = window.location.protocol === "file:"
        ? " Local file mode may block direct JSON loading. Open with start-local-server.bat."
        : "";
      setMessage(
        "Opening stage failed to load. " + (error && error.message ? error.message : String(error)) + protocolHint,
        "error"
      );
      throw error;
    });

    return bootstrapPromise;
  }

  function syncPlayerVisibility() {
    if (player && typeof player.setActive === "function") {
      player.setActive(isSlideActive && currentView === "3d");
    }
  }

  function setView(view) {
    if (!openingStage || currentView === view) {
      return;
    }

    currentView = view;
    openingStage.dataset.view = view;

    viewToggleButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    if (view === "3d") {
      if (!player) {
        ensurePlayer().catch(() => null);
      } else {
        syncPlayerVisibility();
      }
    } else {
      syncPlayerVisibility();
    }
  }

  viewToggleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      setView(btn.dataset.view);
    });
  });

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "slideVisibility") {
      return;
    }
    if (event.data.active) {
      isSlideActive = true;
      
      // Always reset to 2D view when switching to this slide
      setView("2d");

      if (player) {
        syncPlayerVisibility();
        return;
      }
      // We don't necessarily need to ensurePlayer immediately if we are in 2D, 
      // but preloading is good for performance. 
      // However, the request says "show 2D first", so we don't need 3D visible yet.
      return;
    }

    isSlideActive = false;
    syncPlayerVisibility();
  });

  window.addEventListener("beforeunload", function () {
    if (player && typeof player.destroy === "function") {
      player.destroy();
    }
  });

  if (startsActive) {
    ensurePlayer().catch(function () {
      return null;
    });
  }
}());
