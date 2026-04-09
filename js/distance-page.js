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
  const introTrigger = page.querySelector("#distance-intro-trigger");
  const introTitle = page.querySelector(".distance-intro-title");
  const heroTitle = page.querySelector(".distance-hero h2");
  const modeElement = page.querySelector("#distance-stage-mode");
  const statusTitle = page.querySelector("#distance-status-title");
  const statusCopy = page.querySelector("#distance-status-copy");
  const sceneButtons = Array.from(page.querySelectorAll(".scene-toggle"));
  const scenes = Array.from(page.querySelectorAll(".distance-scene"));
  const openScene = page.querySelector("#distance-scene-open");
  const openArcSvg = openScene ? openScene.querySelector(".open-arc-svg") : null;
  const openArcUpper = openScene ? openScene.querySelector(".open-arc-path-upper") : null;
  const openArcLower = openScene ? openScene.querySelector(".open-arc-path-lower") : null;
  const openLeftNode = openScene ? openScene.querySelector(".node-open-left-node") : null;
  const openRightTopNode = openScene ? openScene.querySelector(".node-open-right-top") : null;
  const openRightBottomNode = openScene ? openScene.querySelector(".node-open-right-bottom") : null;
  const openUpperPulses = openScene ? Array.from(openScene.querySelectorAll(".pulse-open-upper")) : [];
  const openLowerPulses = openScene ? Array.from(openScene.querySelectorAll(".pulse-open-lower")) : [];
  const openImpact = openScene ? openScene.querySelector("#metric-open-impact") : null;
  const openGeometryTargets = [openScene, openLeftNode, openRightTopNode, openRightBottomNode].filter(Boolean);
  const relayScene = page.querySelector("#distance-scene-relay");
  const relayArcStage = relayScene ? relayScene.querySelector(".relay-arc-stage") : null;
  const relayArcSvg = relayScene ? relayScene.querySelector(".relay-arc-svg") : null;
  const relayMainArc = relayScene ? relayScene.querySelector("#relay-main-arc") : null;
  const relayArcLeft = relayScene ? relayScene.querySelector("#relay-arc-left") : null;
  const relayArcRight = relayScene ? relayScene.querySelector("#relay-arc-right") : null;
  const relayNoteArc = relayScene ? relayScene.querySelector("#relay-note-arc") : null;
  const relayImpact = relayScene ? relayScene.querySelector("#relay-total-impact") : null;
  const relayPoints = relayScene ? Array.from(relayScene.querySelectorAll(".relay-point")) : [];
  const relayDistances = relayScene ? Array.from(relayScene.querySelectorAll(".relay-hop-distance")) : [];
  const relayGeometryTargets = [relayArcStage, relayArcSvg, relayMainArc, relayArcLeft, relayArcRight].filter(Boolean);
  const searchParams = new URLSearchParams(window.location.search);
  const forceRevealOnLoad = searchParams.get("reveal") === "1";
  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  let openGeometryRafId = 0;
  let relayGeometryRafId = 0;
  let revealSyncTimeoutId = 0;
  let introBaseWidth = 0;
  let openImpactVisible = false;
  let relayImpactVisible = false;

  const hasRequiredScenes = sceneNames.every(function (sceneName) {
    return !!page.querySelector('.distance-scene[data-scene="' + sceneName + '"]');
  });
  const hasRequiredButtons = sceneNames.every(function (sceneName) {
    return !!page.querySelector('.scene-toggle[data-scene-target="' + sceneName + '"]');
  });

  if (!stage || !modeElement || !hasRequiredScenes || !hasRequiredButtons) {
    console.warn("Distance page controller skipped: required elements are missing.");
    return;
  }

  function setRevealState(isRevealed) {
    page.classList.toggle("is-revealed", !!isRevealed);
    if (introTrigger) {
      introTrigger.setAttribute("aria-expanded", String(!!isRevealed));
    }
  }

  function updateIntroTitleTarget() {
    if (!heroTitle) {
      return;
    }

    const heroRect = heroTitle.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    if (heroRect.width <= 0 || heroRect.height <= 0 || pageRect.width <= 0 || pageRect.height <= 0) {
      return;
    }

    const targetLeft = ((heroRect.left + (heroRect.width / 2) - pageRect.left) / pageRect.width) * 100;
    const targetTop = ((heroRect.top + (heroRect.height / 2) - pageRect.top) / pageRect.height) * 100;
    const introRect = introTitle ? introTitle.getBoundingClientRect() : null;

    if (!introBaseWidth && introRect && introRect.width > 0) {
      introBaseWidth = introRect.width;
    }

    const scale = heroRect.width / Math.max(introBaseWidth || (introRect ? introRect.width : 1), 1);

    page.style.setProperty("--distance-intro-target-left", targetLeft + "%");
    page.style.setProperty("--distance-intro-target-top", targetTop + "%");
    page.style.setProperty("--distance-intro-target-scale", String(scale));
  }

  function schedulePostRevealSync() {
    if (revealSyncTimeoutId) {
      window.clearTimeout(revealSyncTimeoutId);
    }
    window.requestAnimationFrame(function () {
      updateIntroTitleTarget();
      scheduleOpenGeometrySync();
      scheduleRelayGeometrySync();
    });
    revealSyncTimeoutId = window.setTimeout(function () {
      updateIntroTitleTarget();
      scheduleOpenGeometrySync();
      scheduleRelayGeometrySync();
      revealSyncTimeoutId = 0;
    }, 760);
  }

  function enterStageState() {
    if (revealSyncTimeoutId) {
      window.clearTimeout(revealSyncTimeoutId);
      revealSyncTimeoutId = 0;
    }
    updateIntroTitleTarget();
    setRevealState(true);
    schedulePostRevealSync();
  }

  function resetInteractiveState() {
    resetOpenImpact();
    resetRelayImpact();
  }

  function setReducedMotionClass() {
    page.classList.toggle("reduce-motion", !!(reducedMotionQuery && reducedMotionQuery.matches));
  }

  function setPageHiddenClass() {
    page.classList.toggle("is-hidden", document.hidden);
  }

  function showOpenImpact() {
    if (!openImpact || openImpactVisible || stage.dataset.scene !== "open" || !page.classList.contains("is-revealed")) {
      return;
    }

    openImpactVisible = true;
    openImpact.classList.remove("is-visible");
    openImpact.setAttribute("aria-hidden", "false");
    void openImpact.offsetWidth;
    openImpact.classList.add("is-visible");
  }

  function resetOpenImpact() {
    if (!openImpact) {
      return;
    }

    openImpactVisible = false;
    openImpact.classList.remove("is-visible");
    openImpact.setAttribute("aria-hidden", "true");
  }

  function showRelayImpact() {
    if (!relayImpact || relayImpactVisible || stage.dataset.scene !== "relay" || !page.classList.contains("is-revealed")) {
      return;
    }

    relayImpactVisible = true;
    relayImpact.classList.remove("is-visible");
    relayImpact.setAttribute("aria-hidden", "false");
    void relayImpact.offsetWidth;
    relayImpact.classList.add("is-visible");
  }

  function resetRelayImpact() {
    if (!relayImpact) {
      return;
    }

    relayImpactVisible = false;
    relayImpact.classList.remove("is-visible");
    relayImpact.setAttribute("aria-hidden", "true");
  }

  function getSceneTarget(button) {
    return button && button.dataset ? button.dataset.sceneTarget : "";
  }

  function centerRelativeTo(element, referenceRect) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + (rect.width / 2) - referenceRect.left,
      y: rect.top + (rect.height / 2) - referenceRect.top
    };
  }

  function applyOffsetPath(targets, path) {
    const cssPath = "path('" + path + "')";
    targets.forEach(function (target) {
      target.style.offsetPath = cssPath;
      target.style.webkitOffsetPath = cssPath;
    });
  }

  function buildQuadraticPath(start, end, isUpper) {
    const curveFactor = 0.18 * 1.3;
    const controlX = (start.x + end.x) / 2;
    const baseCurve = Math.abs(end.x - start.x) * curveFactor;
    const curveOffset = Math.max(16, baseCurve);
    const controlY = ((start.y + end.y) / 2) + (isUpper ? -curveOffset : curveOffset);
    return "M " + start.x.toFixed(2) + " " + start.y.toFixed(2) +
      " Q " + controlX.toFixed(2) + " " + controlY.toFixed(2) +
      " " + end.x.toFixed(2) + " " + end.y.toFixed(2);
  }

  function syncOpenGeometry() {
    if (!openScene || !openArcSvg || !openArcUpper || !openArcLower || !openLeftNode || !openRightTopNode || !openRightBottomNode) {
      return;
    }

    const svgRect = openArcSvg.getBoundingClientRect();
    if (svgRect.width <= 0 || svgRect.height <= 0) {
      return;
    }

    const leftCenter = centerRelativeTo(openLeftNode, svgRect);
    const rightTopCenter = centerRelativeTo(openRightTopNode, svgRect);
    const rightBottomCenter = centerRelativeTo(openRightBottomNode, svgRect);

    openArcSvg.setAttribute("viewBox", "0 0 " + svgRect.width.toFixed(2) + " " + svgRect.height.toFixed(2));

    const upperPath = buildQuadraticPath(leftCenter, rightTopCenter, true);
    const lowerPath = buildQuadraticPath(leftCenter, rightBottomCenter, false);

    openArcUpper.setAttribute("d", upperPath);
    openArcLower.setAttribute("d", lowerPath);

    applyOffsetPath(openUpperPulses, upperPath);
    applyOffsetPath(openLowerPulses, lowerPath);
  }

  function getSvgViewBox(svg) {
    const viewBox = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : null;
    if (!viewBox || viewBox.width <= 0 || viewBox.height <= 0) {
      return null;
    }
    return {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height
    };
  }

  function svgPointToStage(svgPoint, svgRect, stageRect, svgViewBox) {
    const xRatio = (svgPoint.x - svgViewBox.x) / svgViewBox.width;
    const yRatio = (svgPoint.y - svgViewBox.y) / svgViewBox.height;
    const pixelX = svgRect.left + (xRatio * svgRect.width);
    const pixelY = svgRect.top + (yRatio * svgRect.height);
    return {
      x: pixelX - stageRect.left,
      y: pixelY - stageRect.top
    };
  }

  function normalizeVector(x, y) {
    const length = Math.hypot(x, y);
    if (length <= 0.0001) {
      return { x: 0, y: -1 };
    }
    return { x: x / length, y: y / length };
  }

  function buildArcSlicePath(pathElement, startLength, endLength, stepSize) {
    if (!pathElement || endLength <= startLength) {
      return "";
    }
    const step = Math.max(2, stepSize || 8);
    let current = startLength;
    const firstPoint = pathElement.getPointAtLength(startLength);
    let d = "M " + firstPoint.x.toFixed(2) + " " + firstPoint.y.toFixed(2);
    while (current < endLength) {
      current = Math.min(endLength, current + step);
      const point = pathElement.getPointAtLength(current);
      d += " L " + point.x.toFixed(2) + " " + point.y.toFixed(2);
    }
    return d;
  }

  function buildOffsetArcPath(pathElement, startLength, endLength, offsetDistance, sampleCount) {
    if (!pathElement || endLength <= startLength) {
      return "";
    }
    const count = Math.max(6, sampleCount || 18);
    const points = [];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const currentLength = startLength + ((endLength - startLength) * t);
      const point = pathElement.getPointAtLength(currentLength);
      const prevPoint = pathElement.getPointAtLength(Math.max(0, currentLength - 1.5));
      const nextPoint = pathElement.getPointAtLength(Math.min(pathElement.getTotalLength(), currentLength + 1.5));
      const tangent = normalizeVector(nextPoint.x - prevPoint.x, nextPoint.y - prevPoint.y);
      let normal = { x: -tangent.y, y: tangent.x };
      if (normal.y > 0) {
        normal = { x: -normal.x, y: -normal.y };
      }
      points.push({
        x: point.x + (normal.x * offsetDistance),
        y: point.y + (normal.y * offsetDistance)
      });
    }

    let d = "M " + points[0].x.toFixed(2) + " " + points[0].y.toFixed(2);
    for (let i = 1; i < points.length; i += 1) {
      d += " L " + points[i].x.toFixed(2) + " " + points[i].y.toFixed(2);
    }
    return d;
  }

  function syncRelayGeometry() {
    if (!relayArcStage || !relayArcSvg || !relayMainArc || !relayArcLeft || !relayArcRight || relayPoints.length < 2) {
      return;
    }

    const svgViewBox = getSvgViewBox(relayArcSvg);
    if (!svgViewBox) {
      return;
    }

    const stageRect = relayArcStage.getBoundingClientRect();
    const svgRect = relayArcSvg.getBoundingClientRect();
    if (stageRect.width <= 0 || stageRect.height <= 0 || svgRect.width <= 0 || svgRect.height <= 0) {
      return;
    }

    const totalLength = relayMainArc.getTotalLength();
    if (!Number.isFinite(totalLength) || totalLength <= 0) {
      return;
    }

    const pointStep = totalLength / (relayPoints.length - 1);
    const gapSegmentIndex = Math.max(1, relayPoints.length - 3);
    const gapStartLength = pointStep * gapSegmentIndex;
    const gapEndLength = pointStep * (gapSegmentIndex + 1);
    const splitPadding = Math.min(22, pointStep * 0.22);
    const leftArcEnd = Math.max(0, gapStartLength - splitPadding);
    const rightArcStart = Math.min(totalLength, gapEndLength + splitPadding);

    relayArcLeft.setAttribute("d", buildArcSlicePath(relayMainArc, 0, leftArcEnd, 8));
    relayArcRight.setAttribute("d", buildArcSlicePath(relayMainArc, rightArcStart, totalLength, 8));

    relayPoints.forEach(function (point, index) {
      const arcPoint = relayMainArc.getPointAtLength(pointStep * index);
      const stagePoint = svgPointToStage(arcPoint, svgRect, stageRect, svgViewBox);
      point.style.left = stagePoint.x.toFixed(2) + "px";
      point.style.top = stagePoint.y.toFixed(2) + "px";
    });

    relayDistances.forEach(function (label, index) {
      if (index === gapSegmentIndex) {
        label.classList.add("is-hidden");
        return;
      }
      label.classList.remove("is-hidden");
      const midpointLength = pointStep * (index + 0.5);
      const centerPoint = relayMainArc.getPointAtLength(midpointLength);
      const prevPoint = relayMainArc.getPointAtLength(Math.max(0, midpointLength - 1.5));
      const nextPoint = relayMainArc.getPointAtLength(Math.min(totalLength, midpointLength + 1.5));
      const tangent = normalizeVector(nextPoint.x - prevPoint.x, nextPoint.y - prevPoint.y);
      let normal = { x: -tangent.y, y: tangent.x };
      if (normal.y > 0) {
        normal = { x: -normal.x, y: -normal.y };
      }

      const offsetDistance = 28;
      const labelPoint = {
        x: centerPoint.x + (normal.x * offsetDistance),
        y: centerPoint.y + (normal.y * offsetDistance)
      };
      const stagePoint = svgPointToStage(labelPoint, svgRect, stageRect, svgViewBox);
      label.style.left = stagePoint.x.toFixed(2) + "px";
      label.style.top = stagePoint.y.toFixed(2) + "px";
    });

    if (relayNoteArc) {
      const noteCenter = (gapStartLength + gapEndLength) / 2;
      const noteHalfSpan = pointStep * 0.72;
      const noteStartLength = Math.max(0, noteCenter - noteHalfSpan);
      const noteEndLength = Math.min(totalLength, noteCenter + noteHalfSpan);
      const notePath = buildOffsetArcPath(relayMainArc, noteStartLength, noteEndLength, 26, 24);
      relayNoteArc.setAttribute("d", notePath);
    }
  }

  function scheduleOpenGeometrySync() {
    if (openGeometryRafId) {
      return;
    }
    openGeometryRafId = window.requestAnimationFrame(function () {
      openGeometryRafId = 0;
      syncOpenGeometry();
    });
  }

  function scheduleRelayGeometrySync() {
    if (relayGeometryRafId) {
      return;
    }
    relayGeometryRafId = window.requestAnimationFrame(function () {
      relayGeometryRafId = 0;
      syncRelayGeometry();
    });
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

    if (next === "open") {
      resetInteractiveState();
      scheduleOpenGeometrySync();
    }
    if (next === "relay") {
      resetInteractiveState();
      scheduleRelayGeometrySync();
    }
  }

  function handleToggleClick(event) {
    const target = getSceneTarget(event.currentTarget);
    if (!target) {
      return;
    }
    applyScene(target);
  }

  function handleOpenSceneClick() {
    showOpenImpact();
  }

  function handleRelaySceneClick() {
    showRelayImpact();
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
  window.addEventListener("resize", updateIntroTitleTarget);
  window.addEventListener("resize", scheduleOpenGeometrySync);
  window.addEventListener("resize", scheduleRelayGeometrySync);
  window.addEventListener("load", updateIntroTitleTarget);
  window.addEventListener("load", scheduleOpenGeometrySync);
  window.addEventListener("load", scheduleRelayGeometrySync);

  if (document.fonts && typeof document.fonts.ready === "object" && typeof document.fonts.ready.then === "function") {
    document.fonts.ready.then(updateIntroTitleTarget);
    document.fonts.ready.then(scheduleOpenGeometrySync);
    document.fonts.ready.then(scheduleRelayGeometrySync);
  }

  if (typeof ResizeObserver === "function" && (openGeometryTargets.length > 0 || relayGeometryTargets.length > 0)) {
    const geometryObserver = new ResizeObserver(function () {
      scheduleOpenGeometrySync();
      scheduleRelayGeometrySync();
    });
    openGeometryTargets.forEach(function (target) {
      geometryObserver.observe(target);
    });
    relayGeometryTargets.forEach(function (target) {
      geometryObserver.observe(target);
    });
  }

  sceneButtons.forEach(function (button) {
    button.addEventListener("click", handleToggleClick);
  });

  if (openScene) {
    openScene.addEventListener("click", handleOpenSceneClick);
  }

  if (relayScene) {
    relayScene.addEventListener("click", handleRelaySceneClick);
  }

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "slideVisibility") {
      return;
    }

    if (event.data.active) {
      resetInteractiveState();
      enterStageState();
      scheduleOpenGeometrySync();
      scheduleRelayGeometrySync();
    }
  });

  const initialSceneName = stage.dataset.scene;
  if (!sceneMeta[initialSceneName]) {
    console.warn("Distance page controller skipped: invalid initial scene key.", initialSceneName);
    return;
  }

  applyScene(initialSceneName);
  resetInteractiveState();
  enterStageState();
  if (forceRevealOnLoad) {
    schedulePostRevealSync();
  }
  scheduleOpenGeometrySync();
  scheduleRelayGeometrySync();

  window.__distancePageReady = true;
}());
