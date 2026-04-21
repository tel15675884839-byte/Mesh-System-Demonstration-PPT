(function () {
  function createSearchParams(search) {
    const SearchParams = window.URLSearchParams || (typeof URLSearchParams === "function" ? URLSearchParams : null);
    if (SearchParams) {
      return new SearchParams(search || "");
    }

    return {
      get() {
        return null;
      }
    };
  }

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
  const relaySideLinksSvg = relayScene ? relayScene.querySelector(".relay-side-links-svg") : null;
  const relayMainArc = relayScene ? relayScene.querySelector("#relay-main-arc") : null;
  const relayArcLeft = relayScene ? relayScene.querySelector("#relay-arc-left") : null;
  const relayArcRight = relayScene ? relayScene.querySelector("#relay-arc-right") : null;
  const relayNoteArc = relayScene ? relayScene.querySelector("#relay-note-arc") : null;
  const relayEntryLink = relayScene ? relayScene.querySelector("#relay-entry-link") : null;
  const relayEndWirelessUpper = relayScene ? relayScene.querySelector("#relay-end-wireless-upper") : null;
  const relayEndWirelessLower = relayScene ? relayScene.querySelector("#relay-end-wireless-lower") : null;
  const relayEntryPanel = relayScene ? relayScene.querySelector(".relay-entry-panel") : null;
  const relayEndSmoke = relayScene ? relayScene.querySelector(".relay-end-device-smoke") : null;
  const relayEndSounder = relayScene ? relayScene.querySelector(".relay-end-device-sounder") : null;
  const relayImpact = relayScene ? relayScene.querySelector("#relay-total-impact") : null;
  const relayPoints = relayScene ? Array.from(relayScene.querySelectorAll(".relay-point")) : [];
  const relayDistances = relayScene ? Array.from(relayScene.querySelectorAll(".relay-hop-distance:not(.dist-end-smoke):not(.dist-end-sounder)")) : [];
  const relayEndSmokeDist = relayScene ? relayScene.querySelector(".dist-end-smoke") : null;
  const relayEndSounderDist = relayScene ? relayScene.querySelector(".dist-end-sounder") : null;
  const relayGeometryTargets = [relayArcStage, relayArcSvg, relaySideLinksSvg, relayMainArc, relayArcLeft, relayArcRight].filter(Boolean);
  const presentationMessaging = window.meshPresentationMessaging || null;
  const searchParams = createSearchParams(window.location.search);
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

    // Auto-trigger the impact animation for the initial scene after a short delay
    const initial = stage.dataset.scene;
    setTimeout(function() {
      if (initial === "open") showOpenImpact();
      else if (initial === "relay") showRelayImpact();
    }, 1000);
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

  function buildSnakePath(start, end) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const amplitude = Math.max(34, Math.abs(deltaX) * 0.22);
    const bendAmplitude = amplitude * 1.12;
    const midX = start.x + (deltaX * 0.5);
    const midY = start.y + (deltaY * 0.5);

    return "M " + start.x.toFixed(2) + " " + start.y.toFixed(2) +
      " C " + (start.x + (deltaX * 0.14)).toFixed(2) + " " + (start.y - amplitude).toFixed(2) +
      ", " + (start.x + (deltaX * 0.33)).toFixed(2) + " " + (start.y + bendAmplitude).toFixed(2) +
      ", " + midX.toFixed(2) + " " + midY.toFixed(2) +
      " C " + (start.x + (deltaX * 0.67)).toFixed(2) + " " + (end.y - bendAmplitude).toFixed(2) +
      ", " + (start.x + (deltaX * 0.86)).toFixed(2) + " " + (end.y + amplitude).toFixed(2) +
      ", " + end.x.toFixed(2) + " " + end.y.toFixed(2);
  }

  function clampValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function parseCssNumber(value, fallback) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function getElementCenterInStage(element, stageRect) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + (rect.width / 2) - stageRect.left,
      y: rect.top + (rect.height / 2) - stageRect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function getDeviceLinkPoint(device, stageRect) {
    const center = getElementCenterInStage(device, stageRect);
    const styles = window.getComputedStyle(device);
    const offsetX = parseCssNumber(styles.getPropertyValue("--device-link-offset-x"), 0);
    const offsetY = parseCssNumber(styles.getPropertyValue("--device-link-offset-y"), 0);
    return {
      x: center.x + (center.width * offsetX),
      y: center.y + (center.height * offsetY)
    };
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

    if (relaySideLinksSvg) {
      relaySideLinksSvg.setAttribute("viewBox", "0 0 " + stageRect.width.toFixed(2) + " " + stageRect.height.toFixed(2));
    }

    const totalLength = relayMainArc.getTotalLength();
    if (!Number.isFinite(totalLength) || totalLength <= 0) {
      return;
    }

    const pointStep = totalLength / (relayPoints.length - 1);

    relayArcLeft.setAttribute("d", buildArcSlicePath(relayMainArc, 0, totalLength, 8));
    relayArcRight.setAttribute("d", "");

    relayPoints.forEach(function (point, index) {
      const arcPoint = relayMainArc.getPointAtLength(pointStep * index);
      const stagePoint = svgPointToStage(arcPoint, svgRect, stageRect, svgViewBox);
      point.style.left = stagePoint.x.toFixed(2) + "px";
      point.style.top = stagePoint.y.toFixed(2) + "px";
    });

    const leftNodePoint = relayMainArc.getPointAtLength(0);
    const rightNodePoint = relayMainArc.getPointAtLength(totalLength);
    const leftStagePoint = svgPointToStage(leftNodePoint, svgRect, stageRect, svgViewBox);
    const rightStagePoint = svgPointToStage(rightNodePoint, svgRect, stageRect, svgViewBox);

    if (relayEntryPanel) {
      const panelStyles = window.getComputedStyle(relayEntryPanel);
      const panelHalfWidth = (relayEntryPanel.offsetWidth || 188) / 2;
      const panelHalfHeight = (relayEntryPanel.offsetHeight || 188) / 2;
      const panelPoint = {
        x: clampValue(
          stageRect.width * 0.26,
          panelHalfWidth + 8,
          stageRect.width - panelHalfWidth - 8
        ),
        y: clampValue(
          stageRect.height * 0.8,
          panelHalfHeight + 8,
          stageRect.height - panelHalfHeight - 8
        )
      };
      relayEntryPanel.style.left = panelPoint.x.toFixed(2) + "px";
      relayEntryPanel.style.top = panelPoint.y.toFixed(2) + "px";

      if (relayEntryLink) {
        const panelAnchorX = parseCssNumber(panelStyles.getPropertyValue("--panel-link-anchor-x"), 0.42);
        const panelAnchorY = parseCssNumber(panelStyles.getPropertyValue("--panel-link-anchor-y"), -0.08);
        const panelAnchorPoint = {
          x: panelPoint.x + (panelHalfWidth * panelAnchorX),
          y: panelPoint.y + (panelHalfHeight * panelAnchorY)
        };
        relayEntryLink.setAttribute("d", buildSnakePath(panelAnchorPoint, leftStagePoint));
      }
    }

    let smokePoint = null;
    let sounderPoint = null;
    let smokeLinkPoint = null;
    let sounderLinkPoint = null;

    if (relayEndSmoke) {
      const smokeHalfWidth = (relayEndSmoke.offsetWidth || 36) / 2;
      const smokeHalfHeight = (relayEndSmoke.offsetHeight || 36) / 2;
      smokePoint = {
        x: stageRect.width * 1.022,
        y: clampValue(
          stageRect.height * 0.487,
          smokeHalfHeight + 4,
          stageRect.height - smokeHalfHeight - 4
        )
      };
      relayEndSmoke.style.left = smokePoint.x.toFixed(2) + "px";
      relayEndSmoke.style.top = smokePoint.y.toFixed(2) + "px";
      smokeLinkPoint = getDeviceLinkPoint(relayEndSmoke, stageRect);
    }

    if (relayEndSounder) {
      const sounderHalfWidth = (relayEndSounder.offsetWidth || 36) / 2;
      const sounderHalfHeight = (relayEndSounder.offsetHeight || 36) / 2;
      sounderPoint = {
        x: stageRect.width * 1.030,
        y: clampValue(
          stageRect.height * 0.807,
          sounderHalfHeight + 4,
          stageRect.height - sounderHalfHeight - 4
        )
      };
      relayEndSounder.style.left = sounderPoint.x.toFixed(2) + "px";
      relayEndSounder.style.top = sounderPoint.y.toFixed(2) + "px";
      sounderLinkPoint = getDeviceLinkPoint(relayEndSounder, stageRect);
    }

    if (relayEndWirelessUpper && smokeLinkPoint) {
      relayEndWirelessUpper.setAttribute("d", buildQuadraticPath(rightStagePoint, smokeLinkPoint, true));
    }

    if (relayEndWirelessLower && sounderLinkPoint) {
      relayEndWirelessLower.setAttribute("d", buildQuadraticPath(rightStagePoint, sounderLinkPoint, false));
    }

    relayDistances.forEach(function (label, index) {
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
      const noteCenter = pointStep * 5;
      const noteHalfSpan = pointStep * 1.0;
      const noteStartLength = Math.max(0, noteCenter - noteHalfSpan);
      const noteEndLength = Math.min(totalLength, noteCenter + noteHalfSpan);
      const notePath = buildOffsetArcPath(relayMainArc, noteStartLength, noteEndLength, 44, 32);
      relayNoteArc.setAttribute("d", notePath);
    }

    if (relayEndSmokeDist && rightStagePoint && smokeLinkPoint) {
      const midPoint = {
        x: (rightStagePoint.x + smokeLinkPoint.x) / 2,
        y: (rightStagePoint.y + smokeLinkPoint.y) / 2
      };
      relayEndSmokeDist.style.left = midPoint.x.toFixed(2) + "px";
      relayEndSmokeDist.style.top = midPoint.y.toFixed(2) + "px";
    }

    if (relayEndSounderDist && rightStagePoint && sounderLinkPoint) {
      const midPoint = {
        x: (rightStagePoint.x + sounderLinkPoint.x) / 2,
        y: (rightStagePoint.y + sounderLinkPoint.y) / 2
      };
      relayEndSounderDist.style.left = midPoint.x.toFixed(2) + "px";
      relayEndSounderDist.style.top = midPoint.y.toFixed(2) + "px";
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
    const config = arguments.length > 1 && arguments[1] ? arguments[1] : {};
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
      button.setAttribute("aria-selected", String(isActive));
      button.setAttribute("tabindex", isActive ? "0" : "-1");
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
      // Auto-trigger
      setTimeout(showOpenImpact, 400);
    }
    if (next === "relay") {
      resetInteractiveState();
      scheduleRelayGeometrySync();
      // Auto-trigger
      setTimeout(showRelayImpact, 400);
    }

    if (config.syncUrl && presentationMessaging && typeof presentationMessaging.syncPresentationState === "function") {
      presentationMessaging.syncPresentationState({
        scene: next
      });
    }
  }

  function handleToggleClick(event) {
    const target = getSceneTarget(event.currentTarget);
    if (!target) {
      return;
    }
    applyScene(target, { syncUrl: true });
  }

  function handleToggleKeydown(event) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") {
      return;
    }

    event.preventDefault();

    const currentIndex = sceneButtons.indexOf(event.currentTarget);
    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = sceneButtons.length - 1;
    } else {
      const step = event.key === "ArrowRight" ? 1 : -1;
      nextIndex = (currentIndex + step + sceneButtons.length) % sceneButtons.length;
    }

    const nextButton = sceneButtons[nextIndex];
    if (!nextButton) {
      return;
    }

    applyScene(getSceneTarget(nextButton), { syncUrl: true });
    if (typeof nextButton.focus === "function") {
      nextButton.focus();
    }
  }

  function getInitialSceneName() {
    const sharedSearchParams = presentationMessaging && typeof presentationMessaging.getSharedSearchParams === "function"
      ? presentationMessaging.getSharedSearchParams()
      : searchParams;
    const requestedScene = sharedSearchParams.get("scene");

    if (requestedScene && sceneMeta[requestedScene]) {
      return requestedScene;
    }

    return stage.dataset.scene;
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
    button.addEventListener("keydown", handleToggleKeydown);
  });

  if (openScene) {
    // Removed click requirement for automatic display
  }

  if (relayScene) {
    // Removed click requirement for automatic display
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

  const initialSceneName = getInitialSceneName();
  if (!sceneMeta[initialSceneName]) {
    console.warn("Distance page controller skipped: invalid initial scene key.", initialSceneName);
    return;
  }

  applyScene(initialSceneName, { syncUrl: false });
  resetInteractiveState();
  enterStageState();
  if (forceRevealOnLoad) {
    schedulePostRevealSync();
  }
  scheduleOpenGeometrySync();
  scheduleRelayGeometrySync();

  window.__distancePageReady = true;
}());
