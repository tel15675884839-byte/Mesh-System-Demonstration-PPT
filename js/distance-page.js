(function () {
  const page = document.querySelector(".page-distance");
  if (!page) {
    return;
  }

  const stage = document.querySelector(".distance-stage");
  const modeElement = document.getElementById("distance-stage-mode");
  const statusTitle = document.getElementById("distance-status-title");
  const statusCopy = document.getElementById("distance-status-copy");
  const sceneButtons = Array.from(document.querySelectorAll(".scene-toggle"));
  const scenes = Array.from(document.querySelectorAll(".distance-scene"));
  const sceneMeta = {
    open: {
      mode: "OPEN AREA",
      title: "Open area direct link established",
      copy: "Two nodes maintain a stable open-area connection at extended range."
    },
    relay: {
      mode: "MESH RELAY",
      title: "Relay chain extends total coverage",
      copy: "Signal advances hop-by-hop through nodes, reaching up to 16 km."
    }
  };
  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  function setReducedMotionClass() {
    page.classList.toggle("reduce-motion", !!(reducedMotionQuery && reducedMotionQuery.matches));
  }

  function getSceneTarget(button) {
    return button && button.dataset ? button.dataset.sceneTarget : "";
  }

  function applyScene(sceneName) {
    const nextSceneName = sceneMeta[sceneName] ? sceneName : "open";
    const meta = sceneMeta[nextSceneName];
    if (!meta || !stage) {
      return;
    }

    stage.dataset.scene = nextSceneName;

    scenes.forEach(function (scene) {
      const isActive = scene.dataset.scene === nextSceneName;
      scene.classList.toggle("is-visible", isActive);
      scene.setAttribute("aria-hidden", String(!isActive));
    });

    sceneButtons.forEach(function (button) {
      const isActive = getSceneTarget(button) === nextSceneName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (modeElement) {
      modeElement.textContent = meta.mode;
    }
    if (statusTitle) {
      statusTitle.textContent = meta.title;
    }
    if (statusCopy) {
      statusCopy.textContent = meta.copy;
    }
  }

  function handleToggleClick(event) {
    const target = getSceneTarget(event.currentTarget);
    if (!target) {
      return;
    }
    applyScene(target);
  }

  setReducedMotionClass();

  if (reducedMotionQuery) {
    const onMotionChange = function () {
      setReducedMotionClass();
    };

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", onMotionChange);
    } else if (typeof reducedMotionQuery.addListener === "function") {
      reducedMotionQuery.addListener(onMotionChange);
    }
  }

  sceneButtons.forEach(function (button) {
    button.addEventListener("click", handleToggleClick);
  });

  applyScene((stage && stage.dataset && stage.dataset.scene) || "open");

  window.__distancePageReady = true;
}());
