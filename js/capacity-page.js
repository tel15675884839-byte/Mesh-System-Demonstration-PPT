(function () {
  const page = document.querySelector(".page-capacity");
  const capacityStageShell = document.getElementById("capacity-stage-shell");
  const capacityStageSurface = document.getElementById("capacity-stage-surface");
  const capacityStageStatus = document.getElementById("capacity-stage-status");
  const capacityStageHint = document.getElementById("capacity-stage-hint");
  const capacityStageTitle = document.getElementById("capacity-stage-title");
  const capacityFirstScene = document.getElementById("capacity-first-scene");
  const capacityNetworkScene = document.getElementById("capacity-network-scene");
  const capacityNetwork = document.getElementById("capacity-network");
  const capacityPanels = document.getElementById("capacity-panels");
  const capacityDeviceOverlay = document.getElementById("capacity-device-overlay");
  const capacityAggregation = document.getElementById("capacity-aggregation");
  const capacityTotalValue = document.getElementById("capacity-total-value");
  const capacityTotalLoopsBadge = document.getElementById("capacity-total-loops-badge");

  if (
    !page ||
    !capacityStageShell ||
    !capacityStageSurface ||
    !capacityStageStatus ||
    !capacityStageHint ||
    !capacityStageTitle ||
    !capacityFirstScene ||
    !capacityNetworkScene ||
    !capacityNetwork ||
    !capacityPanels ||
    !capacityDeviceOverlay ||
    !capacityAggregation ||
    !capacityTotalValue
  ) {
    return;
  }

  const panelCount = 4;
  const loopsPerPanel = 4;
  const devicesPerPanel = 500;
  const totalDevices = panelCount * devicesPerPanel;
  const panelScale = 1;
  const arcStartAngle = Math.PI * 1.08;
  const arcEndAngle = Math.PI * 1.92;
  const particlesPerPanel = 40;
  const particleBaseDuration = 1400;
  const panelDelayStep = 50;
  const particleDelayStep = 10;
  const totalSyncDuration = ((panelCount - 1) * panelDelayStep) + ((particlesPerPanel - 1) * particleDelayStep) + particleBaseDuration;

  const STEP_FIRST_PAGE = 0;
  const STEP_NETWORK_INTRO = 1;
  const STEP_NETWORK_REVEAL_STATS = 2;
  const STEP_NETWORK_AGGREGATE = 3;
  const STEP_REPLAY = 4;

  const panelRecords = [];
  const lineRecords = [];
  const activeParticleAnimations = new Set();
  let interactionStep = STEP_FIRST_PAGE;
  let connectionSvg = null;
  let introRunId = 0;
  let countAnimationRunId = 0;
  let aggregationFrame = 0;
  let isIntroRunning = false;
  let isAggregating = false;

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function setStageMessage(message, hint) {
    capacityStageStatus.textContent = message;
    capacityStageHint.textContent = hint;
  }

  function setSceneMode(mode) {
    const isNetwork = mode === "network-level";
    page.dataset.capacityScene = isNetwork ? "network-level" : "first-page";
    capacityFirstScene.setAttribute("aria-hidden", isNetwork ? "true" : "false");
    capacityNetworkScene.setAttribute("aria-hidden", isNetwork ? "false" : "true");
    capacityStageTitle.textContent = isNetwork ? "Network" : "Hybrid System Scalability";
  }

  function buildArcPanelPositions() {
    const stageWidth = capacityStageSurface.clientWidth || 1;
    const stageHeight = capacityStageSurface.clientHeight || 1;
    const arcCenterX = stageWidth * 0.5;
    const arcCenterY = stageHeight * 1.05;
    const arcRadius = Math.min(stageWidth * 0.47, stageHeight * 0.78);
    const arcLength = Math.abs(arcEndAngle - arcStartAngle) * arcRadius;
    const arcStep = arcLength / panelCount;
    const positions = [];

    for (let index = 0; index < panelCount; index += 1) {
      const travelDistance = arcStep * (index + 0.5);
      const angle = arcStartAngle + travelDistance / arcRadius;
      const x = arcCenterX + Math.cos(angle) * arcRadius;
      const y = arcCenterY + Math.sin(angle) * arcRadius;

      positions.push({
        xPercent: (x / stageWidth) * 100,
        yPercent: (y / stageHeight) * 100
      });
    }

    return positions;
  }

  function applyPanelPositions(positions = buildArcPanelPositions()) {
    panelRecords.forEach((record, index) => {
      const position = positions[index];
      if (!position) {
        return;
      }
      record.element.style.setProperty("--panel-x", position.xPercent);
      record.element.style.setProperty("--panel-y", position.yPercent);
    });
  }

  function buildPanels() {
    capacityPanels.innerHTML = "";
    panelRecords.length = 0;

    for (let index = 0; index < panelCount; index += 1) {
      const panel = document.createElement("article");
      panel.className = "capacity-panel";
      panel.dataset.index = String(index + 1);
      panel.innerHTML = [
        '<div class="capacity-panel-visual">',
        '  <img class="capacity-panel-image" src="../assets/icons/panel.svg" alt="" aria-hidden="true">',
        `  <span class="capacity-panel-name">Panel ${String(index + 1).padStart(2, "0")}</span>`,
        "</div>",
        '<div class="capacity-panel-stats">',
        `  <div>LOOPs:<span class="panel-stat-val">${loopsPerPanel}</span></div>`,
        `  <div>DEV:<span class="panel-stat-val">${devicesPerPanel}</span></div>`,
        "</div>"
      ].join("");

      capacityPanels.appendChild(panel);
      panelRecords.push({ element: panel });
    }

    capacityStageSurface.style.setProperty("--panel-scale", String(panelScale));
    applyPanelPositions();
  }

  function clearNetworkLines() {
    capacityNetwork.innerHTML = "";
    connectionSvg = null;
    lineRecords.length = 0;
  }

  function ensureNetworkLayer() {
    if (!connectionSvg) {
      connectionSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      connectionSvg.setAttribute("class", "capacity-network-svg");
      connectionSvg.setAttribute("aria-hidden", "true");
      capacityNetwork.appendChild(connectionSvg);
    }

    const stageRect = capacityStageSurface.getBoundingClientRect();
    const viewWidth = Math.max(stageRect.width, 1);
    const viewHeight = Math.max(stageRect.height, 1);

    connectionSvg.setAttribute("viewBox", `0 0 ${viewWidth} ${viewHeight}`);
    connectionSvg.setAttribute("preserveAspectRatio", "none");
  }

  function getPanelCenter(panel) {
    const stageRect = capacityStageSurface.getBoundingClientRect();
    const visual = panel.querySelector("img") || panel;
    const panelRect = visual.getBoundingClientRect();

    return {
      x: panelRect.left - stageRect.left + panelRect.width / 2,
      y: panelRect.top - stageRect.top + panelRect.height * 0.5
    };
  }

  function createArcConnection(fromPanel, toPanel) {
    const start = getPanelCenter(fromPanel);
    const end = getPanelCenter(toPanel);
    const midpointX = (start.x + end.x) / 2;
    const midpointY = (start.y + end.y) / 2;
    const arcLift = Math.max(32, Math.min(120, Math.hypot(end.x - start.x, end.y - start.y) * 0.28));
    const centerBias = midpointX < capacityStageSurface.clientWidth / 2 ? -1 : 1;
    const controlX = midpointX + centerBias * Math.min(44, arcLift * 0.18);
    const controlY = midpointY - arcLift;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");

    ensureNetworkLayer();
    line.setAttribute("class", "capacity-network-line");
    line.setAttribute("d", `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`);
    connectionSvg.appendChild(line);
    lineRecords.push(line);
  }

  function renderNetworkLines() {
    clearNetworkLines();
    ensureNetworkLayer();
    for (let index = 1; index < panelRecords.length; index += 1) {
      createArcConnection(panelRecords[index - 1].element, panelRecords[index].element);
    }
  }

  function resetPanels() {
    panelRecords.forEach((record) => {
      record.element.classList.remove("is-landed", "is-stats-visible");
    });
  }

  function clearParticles() {
    activeParticleAnimations.forEach((record) => {
      if (record.animation) {
        record.animation.cancel();
      }
      if (record.element && record.element.parentNode) {
        record.element.remove();
      }
    });
    activeParticleAnimations.clear();
    capacityDeviceOverlay.innerHTML = "";
  }

  function resetNetworkVisuals() {
    clearParticles();
    clearNetworkLines();
    resetPanels();
    capacityAggregation.classList.remove("is-visible", "is-finished");
    if (capacityTotalLoopsBadge) {
      capacityTotalLoopsBadge.classList.remove("is-visible");
    }
    capacityTotalValue.textContent = "0";
    if (aggregationFrame) {
      window.cancelAnimationFrame(aggregationFrame);
      aggregationFrame = 0;
    }
    isAggregating = false;
  }

  function showNetworkScene() {
    setSceneMode("network-level");
    interactionStep = STEP_NETWORK_INTRO;
    runIntroSequence();
  }

  async function runIntroSequence() {
    const runId = introRunId + 1;
    introRunId = runId;
    isIntroRunning = true;
    resetNetworkVisuals();
    applyPanelPositions();
    setStageMessage(
      "Four enlarged network panels are dropping onto an even arc before the wired topology links them together.",
      "Panels landing..."
    );

    for (let index = 0; index < panelRecords.length; index += 1) {
      if (runId !== introRunId) {
        return;
      }
      panelRecords[index].element.classList.add("is-landed");
      await sleep(140);
    }

    await sleep(200);

    for (let index = 1; index < panelRecords.length; index += 1) {
      if (runId !== introRunId) {
        return;
      }
      createArcConnection(panelRecords[index - 1].element, panelRecords[index].element);
      await sleep(115);
    }

    if (runId !== introRunId) {
      return;
    }

    isIntroRunning = false;
    interactionStep = STEP_NETWORK_REVEAL_STATS;
    setStageMessage(
      "The wired Network level layout is in place. Click once to reveal each panel's loops and connected devices.",
      "Click to reveal capacity"
    );
  }

  function revealPanelStats() {
    if (isIntroRunning || isAggregating || interactionStep !== STEP_NETWORK_REVEAL_STATS) {
      return;
    }

    interactionStep = STEP_NETWORK_AGGREGATE;
    panelRecords.forEach((record, index) => {
      window.setTimeout(() => {
        record.element.classList.add("is-stats-visible");
      }, index * 70);
    });

    if (capacityTotalLoopsBadge) {
      capacityTotalLoopsBadge.classList.add("is-visible");
    }

    setStageMessage(
      "Each panel contributes 4 wireless loops and 500 devices. Click again to aggregate the full system capacity.",
      "Click to aggregate devices"
    );
  }

  function getAggregationCenter() {
    const stageRect = capacityStageSurface.getBoundingClientRect();
    const aggregationRect = capacityAggregation.getBoundingClientRect();

    return {
      x: aggregationRect.left - stageRect.left + aggregationRect.width / 2,
      y: aggregationRect.top - stageRect.top + 18
    };
  }

  function createParticle(startX, startY, targetX, targetY, delay) {
    const particle = document.createElement("span");
    particle.className = "capacity-device-particle";
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    capacityDeviceOverlay.appendChild(particle);

    const controlX = startX + (targetX - startX) * (0.35 + Math.random() * 0.18);
    const controlY = Math.min(startY, targetY) - (26 + Math.random() * 70);
    const animation = particle.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.72)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.08 },
        { transform: `translate(${controlX - startX}px, ${controlY - startY}px) scale(1.05)`, opacity: 0.95, offset: 0.58 },
        { transform: `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.24)`, opacity: 0 }
      ],
      {
        duration: particleBaseDuration,
        delay,
        easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        fill: "forwards"
      }
    );

    const record = { element: particle, animation };
    activeParticleAnimations.add(record);
    animation.finished
      .catch(() => {})
      .finally(() => {
        activeParticleAnimations.delete(record);
        if (particle.parentNode) {
          particle.remove();
        }
      });
  }

  function animateCountUp(targetValue, duration) {
    const runId = countAnimationRunId + 1;
    countAnimationRunId = runId;
    let startTime = null;

    if (aggregationFrame) {
      window.cancelAnimationFrame(aggregationFrame);
      aggregationFrame = 0;
    }

    function tick(now) {
      if (runId !== countAnimationRunId) {
        return;
      }
      if (startTime === null) {
        startTime = now;
      }

      const rawProgress = (now - startTime) / duration;
      const progress = Math.min(Math.max(rawProgress, 0), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const roundedValue = Math.round(targetValue * eased);
      capacityTotalValue.textContent = String(Math.min(Math.max(roundedValue, 0), targetValue));

      if (progress < 1) {
        aggregationFrame = window.requestAnimationFrame(tick);
      } else {
        aggregationFrame = 0;
        capacityTotalValue.textContent = String(targetValue);
        capacityAggregation.classList.add("is-finished");
        isAggregating = false;
        interactionStep = STEP_REPLAY;
        setStageMessage(
          "The Network page is complete at 2000 devices. Click to replay from the designed first page.",
          "Click to replay"
        );
      }
    }

    aggregationFrame = window.requestAnimationFrame(tick);
  }

  function animateAggregation() {
    if (isIntroRunning || isAggregating || interactionStep !== STEP_NETWORK_AGGREGATE) {
      return;
    }

    isAggregating = true;
    capacityAggregation.classList.add("is-visible");
    capacityAggregation.classList.remove("is-finished");
    capacityTotalValue.textContent = "0";
    animateCountUp(totalDevices, totalSyncDuration);

    setStageMessage(
      "All panel capacity is converging into the lower stage hub to reach the full Network total of 2000 devices.",
      "Aggregating..."
    );

    const target = getAggregationCenter();
    panelRecords.forEach((record, panelIndex) => {
      const center = getPanelCenter(record.element);
      for (let particleIndex = 0; particleIndex < particlesPerPanel; particleIndex += 1) {
        const spreadX = (Math.random() - 0.5) * 24;
        const spreadY = (Math.random() - 0.5) * 24;
        const delay = panelIndex * panelDelayStep + particleIndex * particleDelayStep;
        createParticle(center.x + spreadX, center.y + spreadY, target.x, target.y, delay);
      }
    });
  }

  function showFirstScene() {
    introRunId += 1;
    countAnimationRunId += 1;
    resetNetworkVisuals();
    setSceneMode("first-page");
    interactionStep = STEP_FIRST_PAGE;
    setStageMessage(
      "The first System Capacity page shows the overall architecture and scalability of the hybrid wireless system.",
      "Click to continue"
    );
  }

  function handleAdvance() {
    if (isIntroRunning || isAggregating) {
      return;
    }

    if (interactionStep === STEP_FIRST_PAGE) {
      showNetworkScene();
      return;
    }

    if (interactionStep === STEP_NETWORK_INTRO) {
      runIntroSequence();
      return;
    }

    if (interactionStep === STEP_NETWORK_REVEAL_STATS) {
      revealPanelStats();
      return;
    }

    if (interactionStep === STEP_NETWORK_AGGREGATE) {
      animateAggregation();
      return;
    }

    if (interactionStep === STEP_REPLAY) {
      showFirstScene();
    }
  }

  function handleResize() {
    if (panelRecords.length) {
      applyPanelPositions();
    }
    if (lineRecords.length) {
      renderNetworkLines();
    }
  }

  buildPanels();
  showFirstScene();

  capacityStageShell.addEventListener("click", handleAdvance);
  capacityStageHint.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleAdvance();
  });
  window.addEventListener("resize", handleResize);
}());
