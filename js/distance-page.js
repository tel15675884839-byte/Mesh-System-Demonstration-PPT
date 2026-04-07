(function () {
  const page = document.querySelector(".page-distance");
  if (!page) {
    return;
  }

  const sceneMeta = {
    open: {
      mode: "OPEN AREA",
      title: "Center node relay established",
      copy: "Two end devices exchange signals through the center node across open-area distance."
    },
    relay: {
      mode: "MESH RELAY",
      title: "Relay chain extends total coverage",
      copy: "Nodes and end devices are arranged in staged relays to reach up to 16 km."
    }
  };
  const sceneNames = Object.keys(sceneMeta);
  const stage = page.querySelector(".distance-stage");
  const modeElement = page.querySelector("#distance-stage-mode");
  const statusTitle = page.querySelector("#distance-status-title");
  const statusCopy = page.querySelector("#distance-status-copy");
  const sceneButtons = Array.from(page.querySelectorAll(".scene-toggle"));
  const scenes = Array.from(page.querySelectorAll(".distance-scene"));
  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

  const hasRequiredScenes = sceneNames.every(function (sceneName) {
    return !!page.querySelector('.distance-scene[data-scene="' + sceneName + '"]');
  });
  const hasRequiredButtons = sceneNames.every(function (sceneName) {
    return !!page.querySelector('.scene-toggle[data-scene-target="' + sceneName + '"]');
  });

  if (!stage || !modeElement || !statusTitle || !statusCopy || !hasRequiredScenes || !hasRequiredButtons) {
    console.warn("Distance page controller skipped: required elements are missing.");
    return;
  }

  function setReducedMotionClass() {
    page.classList.toggle("reduce-motion", !!(reducedMotionQuery && reducedMotionQuery.matches));
  }

  function setPageHiddenClass() {
    page.classList.toggle("is-hidden", document.hidden);
  }

  function getSceneTarget(button) {
    return button && button.dataset ? button.dataset.sceneTarget : "";
  }

  function applyScene(sceneName) {
    const next = sceneName;
    if (!sceneMeta[next] || !stage) {
      console.warn("Distance page controller ignored unknown scene key:", next);
      return;
    }
    const meta = sceneMeta[next];

    stage.dataset.scene = next;

    scenes.forEach(function (scene) {
      const isActive = scene.dataset.scene === next;
      scene.classList.toggle("is-visible", isActive);
      scene.setAttribute("aria-hidden", String(!isActive));
    });

    sceneButtons.forEach(function (button) {
      const isActive = getSceneTarget(button) === next;
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
  setPageHiddenClass();

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

  document.addEventListener("visibilitychange", setPageHiddenClass);

  sceneButtons.forEach(function (button) {
    button.addEventListener("click", handleToggleClick);
  });

  const initialSceneName = stage.dataset.scene;
  if (!sceneMeta[initialSceneName]) {
    console.warn("Distance page controller skipped: invalid initial scene key.", initialSceneName);
    return;
  }

  applyScene(initialSceneName);

  window.__distancePageReady = true;
}());
