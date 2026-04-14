(function () {
  const page = document.querySelector(".page-capacity");
  const capacityStageShell = document.getElementById("capacity-stage-shell");
  const capacityStage = document.getElementById("capacity-stage");
  const capacityStageSurface = document.getElementById("capacity-stage-surface");
  const capacityStageStatus = document.getElementById("capacity-stage-status");
  const capacityStageHint = document.getElementById("capacity-stage-hint");
  const capacityNetwork = document.getElementById("capacity-network");
  const capacityPanels = document.getElementById("capacity-panels");
  const capacityDeviceOverlay = document.getElementById("capacity-device-overlay");
  const capacityAggregation = document.getElementById("capacity-aggregation");
  const capacityTotalValue = document.getElementById("capacity-total-value");
  const capacityStageTitle = capacityStage ? capacityStage.querySelector(".capacity-stage-title") : null;

  if (
    !page ||
    !capacityStageShell ||
    !capacityStage ||
    !capacityStageSurface ||
    !capacityStageStatus ||
    !capacityStageHint ||
    !capacityNetwork ||
    !capacityPanels ||
    !capacityDeviceOverlay ||
    !capacityAggregation ||
    !capacityTotalValue
  ) {
    return;
  }

  const panelCount = 8;
  const loopsPerPanel = 2;
  const devicesPerPanel = 250;
  const expansionLoopCount = 4;
  const nodesPerExpansionLoop = 32;
  const totalDevices = panelCount * devicesPerPanel;
  const panelScale = 1.7;
  const arcStartAngle = Math.PI * 1.08;
  const arcEndAngle = Math.PI * 1.92;

  const panelRecords = [];
  const lineRecords = [];
  const expansionRowRecords = [];
  const activeParticleAnimations = new Set();
  let connectionSvg = null;
  let interactionStep = 0;
  let introRunId = 0;
  let aggregationFrame = 0;
  let countAnimationRunId = 0;
  let expansionRunId = 0;
  let isIntroRunning = false;
  let isAggregating = false;
  let isExpansionRunning = false;
  let expansionSceneVisible = false;
  let capacityExpansion = document.getElementById("capacity-expansion");
  let capacityExpansionPanel = document.getElementById("capacity-expansion-panel");
  let capacityExpansionLink = document.getElementById("capacity-expansion-link");
  let capacityExpansionLinkLine = null;
  let capacityExpansionCard = document.getElementById("capacity-expansion-card");
  let capacityExpansionLoops = document.getElementById("capacity-expansion-loops");
  let capacityExpansionSvg = document.getElementById("capacity-expansion-svg");
  let expansionLinkRevealProgress = 0;
  const expansionConnections = [];

  // Synchronization settings: Scale physical particles for performance while maintaining dense swarm look
  const particlesPerPanel = 40; 
  const particleBaseDuration = 1400;
  const panelDelayStep = 50;
  const particleDelayStep = 10;
  // Total duration calculation: Last panels delay + Last particles delay + Particle duration
  const totalSyncDuration = ((panelCount - 1) * panelDelayStep) + ((particlesPerPanel - 1) * particleDelayStep) + particleBaseDuration;

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function setStageMessage(message, hint) {
    capacityStageStatus.textContent = message;
    capacityStageHint.textContent = hint;
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
        '  <div class="capacity-panel-glow"></div>',
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

  function setSceneMode(mode) {
    const isExpansionScene = mode === "expansion-card";

    page.dataset.capacityScene = isExpansionScene ? "expansion-card" : "network-level";
    capacityStage.classList.toggle("is-scene-expansion", isExpansionScene);

    if (capacityStageTitle) {
      capacityStageTitle.textContent = isExpansionScene ? "2 Loop Expansion Card" : "Network Level";
    }
  }

  function ensureExpansionScene() {
    if (!capacityExpansion) {
      capacityExpansion = document.createElement("div");
      capacityExpansion.id = "capacity-expansion";
      capacityExpansion.className = "capacity-expansion";
      capacityExpansion.setAttribute("aria-hidden", "true");
    }

    if (!capacityExpansionPanel) {
      capacityExpansionPanel = document.createElement("div");
      capacityExpansionPanel.id = "capacity-expansion-panel";
      capacityExpansionPanel.className = "capacity-expansion-panel";
      capacityExpansionPanel.setAttribute("aria-hidden", "true");
    }

    if (!capacityExpansionLink) {
      capacityExpansionLink = document.createElement("div");
      capacityExpansionLink.id = "capacity-expansion-link";
      capacityExpansionLink.className = "capacity-expansion-link";
      capacityExpansionLink.setAttribute("aria-hidden", "true");
    }

    if (!capacityExpansionLinkLine) {
      capacityExpansionLinkLine = document.createElement("span");
      capacityExpansionLinkLine.className = "capacity-expansion-link-line";
      capacityExpansionLinkLine.style.left = "0";
      capacityExpansionLinkLine.style.top = "0";
      capacityExpansionLinkLine.style.width = "0";
      capacityExpansionLinkLine.style.opacity = "0";
      capacityExpansionLinkLine.style.transition = "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease";
    }

    if (!capacityExpansionCard) {
      capacityExpansionCard = document.createElement("div");
      capacityExpansionCard.id = "capacity-expansion-card";
      capacityExpansionCard.className = "capacity-expansion-card";
      capacityExpansionCard.setAttribute("aria-hidden", "true");
      capacityExpansionCard.innerHTML = [
        '<img class="capacity-expansion-card-image" src="../assets/icons/loop expansion card.svg" alt="" aria-hidden="true">'
      ].join("");
    }

    if (!capacityExpansionLoops) {
      capacityExpansionLoops = document.createElement("div");
      capacityExpansionLoops.id = "capacity-expansion-loops";
      capacityExpansionLoops.className = "capacity-expansion-loops";
    }

    if (!capacityExpansionSvg) {
      capacityExpansionSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      capacityExpansionSvg.id = "capacity-expansion-svg";
      capacityExpansionSvg.setAttribute("class", "capacity-expansion-svg");
      capacityExpansionSvg.setAttribute("aria-hidden", "true");
    }

    if (!capacityExpansion.parentNode) {
      capacityStageSurface.appendChild(capacityExpansion);
    }

    if (!capacityExpansionPanel.parentNode) {
      capacityExpansion.appendChild(capacityExpansionPanel);
    }

    if (!capacityExpansionCard.parentNode) {
      capacityExpansion.appendChild(capacityExpansionCard);
    }

    if (!capacityExpansionLoops.parentNode) {
      capacityExpansion.appendChild(capacityExpansionLoops);
    }

    if (!capacityExpansionSvg.parentNode) {
      capacityExpansion.appendChild(capacityExpansionSvg);
    }
  }

  function buildExpansionRows(container = capacityExpansionLoops) {
    if (!container) {
      return [];
    }

    container.innerHTML = "";
    expansionRowRecords.length = 0;

    for (let index = 0; index < expansionLoopCount; index += 1) {
      const row = document.createElement("article");
      row.className = "capacity-expansion-row";
      row.dataset.loopIndex = String(index + 1);

      const track = document.createElement("div");
      track.className = "capacity-loop-track";
      track.setAttribute("aria-hidden", "true");

      const icon = document.createElement("img");
      icon.className = "capacity-row-icon";
      icon.src = "../assets/icons/node.svg";
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");

      const nodeCount = document.createElement("span");
      nodeCount.className = "capacity-node-count";
      nodeCount.textContent = `32 nodes`;

      row.appendChild(track);
      row.appendChild(icon);
      row.appendChild(nodeCount);
      container.appendChild(row);

      expansionRowRecords.push({
        element: row,
        track,
        icon,
        count: nodeCount
      });
    }

    return expansionRowRecords;
  }

  function positionExpansionLink(revealProgress = expansionLinkRevealProgress) {
    if (!capacityExpansionSvg || !capacityExpansionPanel || !capacityExpansionCard) {
      return;
    }

    const start = getPanelCenter(capacityExpansionPanel);
    const end = getPanelCenter(capacityExpansionCard);
    const clampedProgress = Math.min(Math.max(revealProgress, 0), 1);
    
    expansionLinkRevealProgress = clampedProgress;

    let line = capacityExpansionSvg.querySelector(".expansion-link-line");
    if (!line) {
      line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("class", "expansion-link-line");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "rgba(94, 230, 255, 0.92)");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-dasharray", "6,4");
      capacityExpansionSvg.appendChild(line);
    }

    const currentX = start.x + (end.x - start.x) * clampedProgress;

    line.setAttribute("d", `M ${start.x} ${start.y} L ${currentX} ${start.y}`);
    line.style.opacity = clampedProgress > 0 ? "0.8" : "0";
  }

  function renderExpansionConnections() {
    if (!capacityExpansionSvg || !capacityExpansionCard || !expansionRowRecords.length) {
      return;
    }

    const cardImage = capacityExpansionCard.querySelector(".capacity-expansion-card-image");
    const imageRect = (cardImage || capacityExpansionCard).getBoundingClientRect();
    const stageRect = capacityStageSurface.getBoundingClientRect();
    
    // Origin is the right edge of the card image
    const originX = imageRect.right - stageRect.left - 4; // slight padding inward
    const originY = imageRect.top - stageRect.top + imageRect.height / 2;

    expansionRowRecords.forEach((record, index) => {
      let line = expansionConnections[index];
      if (!line) {
        line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line.setAttribute("class", "expansion-loop-line");
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", "rgba(94, 230, 255, 0.92)");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-dasharray", "6,4");
        line.style.opacity = "0";
        line.style.transition = "opacity 300ms ease, stroke-dashoffset 500ms ease";
        capacityExpansionSvg.appendChild(line);
        expansionConnections[index] = line;
      }

      const iconRect = record.icon.getBoundingClientRect();
      const targetX = iconRect.left - stageRect.left + iconRect.width / 2;
      const targetY = iconRect.top - stageRect.top + iconRect.height / 2;

      line.setAttribute("d", `M ${originX} ${originY} L ${targetX} ${targetY}`);
    });
  }

  function resetExpansionVisuals() {
    expansionLinkRevealProgress = 0;
    expansionRunId += 1;
    isExpansionRunning = false;
    expansionSceneVisible = false;

    if (capacityExpansion) {
      capacityExpansion.classList.remove("is-visible", "is-panel-visible", "is-link-visible", "is-card-visible", "is-loops-visible", "is-complete", "is-animating");
      capacityExpansion.setAttribute("aria-hidden", "true");
    }

    if (capacityExpansionPanel) {
      capacityExpansionPanel.classList.remove("is-visible");
      capacityExpansionPanel.setAttribute("aria-hidden", "true");
    }

    if (capacityExpansionSvg) {
      capacityExpansionSvg.innerHTML = "";
    }

    expansionConnections.length = 0;

    if (capacityExpansionCard) {
      capacityExpansionCard.classList.remove("is-visible");
      capacityExpansionCard.setAttribute("aria-hidden", "true");
    }

    expansionRowRecords.forEach((record) => {
      record.element.classList.remove("is-visible");
      record.track.classList.remove("is-visible");
      record.icon.classList.remove("is-visible");
      record.count.classList.remove("is-visible");
    });
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
    const panelRect = panel.getBoundingClientRect();

    return {
      x: panelRect.left - stageRect.left + panelRect.width / 2,
      y: panelRect.top - stageRect.top + panelRect.height * 0.5
    };
  }

  function createArcConnection(fromPanel, toPanel) {
    const start = getPanelCenter(fromPanel);
    const end = getPanelCenter(toPanel);
    const stageRect = capacityStageSurface.getBoundingClientRect();
    const midpointX = (start.x + end.x) / 2;
    const midpointY = (start.y + end.y) / 2;
    const arcLift = Math.max(32, Math.min(120, Math.hypot(end.x - start.x, end.y - start.y) * 0.28));
    const centerBias = midpointX < stageRect.width / 2 ? -1 : 1;
    const controlX = midpointX + centerBias * Math.min(44, arcLift * 0.18);
    const controlY = midpointY - arcLift;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");

    ensureNetworkLayer();

    line.setAttribute("class", "capacity-network-line");
    line.setAttribute("d", `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "rgba(94, 230, 255, 0.92)");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("stroke-linejoin", "round");
    line.style.opacity = "0";
    line.style.transition = "opacity 360ms ease";
    line.style.filter = "drop-shadow(0 0 18px rgba(80, 210, 255, 0.28))";

    connectionSvg.appendChild(line);
    lineRecords.push(line);

    window.requestAnimationFrame(() => {
      line.style.opacity = "0.78";
    });
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
        try {
          record.animation.cancel();
        } catch (error) {
          // Ignore animations that have already completed.
        }
      }

      if (record.element && record.element.parentNode) {
        record.element.remove();
      }
    });

    activeParticleAnimations.clear();
    capacityDeviceOverlay.innerHTML = "";
  }

  function resetStageVisuals() {
    clearParticles();
    clearNetworkLines();
    resetPanels();
    resetExpansionVisuals();
    setSceneMode("network-level");

    if (aggregationFrame) {
      window.cancelAnimationFrame(aggregationFrame);
      aggregationFrame = 0;
    }
    countAnimationRunId += 1;

    capacityAggregation.classList.remove("is-visible", "is-finished");
    capacityStageShell.classList.remove("is-aggregating");
    capacityTotalValue.textContent = "0";
    isAggregating = false;
  }

  async function runIntroSequence() {
    const runId = introRunId + 1;
    introRunId = runId;
    interactionStep = 0;
    isIntroRunning = true;
    isAggregating = false;

    resetStageVisuals();
    setStageMessage(
      "Eight enlarged network panels are dropping onto an even arc before the wired topology links them together.",
      "Panels landing..."
    );

    applyPanelPositions();

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
    interactionStep = 1;
    setStageMessage(
      "The wired Network level layout is in place. Click once to reveal each panel's loops and connected devices.",
      "Click to reveal capacity"
    );
  }

  function revealPanelStats() {
    if (isIntroRunning || isAggregating || interactionStep !== 1) {
      return;
    }

    interactionStep = 2;
    panelRecords.forEach((record, index) => {
      window.setTimeout(() => {
        record.element.classList.add("is-stats-visible");
      }, index * 70);
    });

    setStageMessage(
      "Each panel contributes 2 wireless loops and 250 devices. Click again to aggregate the full system capacity.",
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
        {
          transform: "translate(-50%, -50%) scale(0.72)",
          opacity: 0
        },
        {
          transform: "translate(-50%, -50%) scale(1)",
          opacity: 1,
          offset: 0.08
        },
        {
          transform: `translate(${controlX - startX}px, ${controlY - startY}px) scale(1.05)`,
          opacity: 0.95,
          offset: 0.58
        },
        {
          transform: `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.24)`,
          opacity: 0
        }
      ],
      {
        duration: particleBaseDuration,
        delay,
        easing: "cubic-bezier(0.25, 0.1, 0.25, 1)", // Smoother swarm easing
        fill: "forwards"
      }
    );

    const record = { element: particle, animation };
    activeParticleAnimations.add(record);

    animation.finished
      .catch(() => {
        // Reset and replay cancel in-flight particles intentionally.
      })
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
      const roundedValue = Number.isFinite(targetValue * eased) ? Math.round(targetValue * eased) : 0;
      const clampedValue = Math.min(Math.max(roundedValue, 0), targetValue);
      capacityTotalValue.textContent = String(clampedValue);

      if (progress < 1) {
        aggregationFrame = window.requestAnimationFrame(tick);
      } else {
        aggregationFrame = 0;
        capacityTotalValue.textContent = String(targetValue);
        capacityAggregation.classList.add("is-finished");
        isAggregating = false;
      }
    }

    aggregationFrame = window.requestAnimationFrame(tick);
  }

  function animateAggregation() {
    if (isIntroRunning || isAggregating || interactionStep !== 2) {
      return;
    }

    interactionStep = 3;
    isAggregating = true;
    capacityStageShell.classList.add("is-aggregating");
    capacityAggregation.classList.add("is-visible");
    capacityAggregation.classList.remove("is-finished");
    capacityTotalValue.textContent = "0";

    animateCountUp(totalDevices, totalSyncDuration);

    setStageMessage(
      "All panel capacity is now converging into the lower stage hub, combining into the full Network level total of 2000 devices. Click again to open the 2 Loop Expansion Card.",
      "Click to open expansion card"
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

  function showExpansionScene() {
    if (isIntroRunning || isAggregating || isExpansionRunning || interactionStep !== 3) {
      return;
    }

    ensureExpansionScene();
    clearParticles();
    clearNetworkLines();
    resetPanels();
    buildExpansionRows();
    setSceneMode("expansion-card");
    capacityStageShell.classList.remove("is-aggregating");

    expansionSceneVisible = true;
    interactionStep = 4;

    capacityExpansion.setAttribute("aria-hidden", "false");
    capacityExpansion.classList.add("is-visible");
    positionExpansionLink(0);

    setStageMessage(
      "The 2 Loop Expansion Card is staged. Click again to play the one-time 4 loop and 32 Nodes infographic.",
      "Click to animate expansion"
    );
  }

  async function runExpansionSequence() {
    if (isIntroRunning || isAggregating || isExpansionRunning || interactionStep !== 4) {
      return;
    }

    ensureExpansionScene();

    if (!expansionSceneVisible) {
      return;
    }

    const runId = expansionRunId + 1;
    expansionRunId = runId;
    isExpansionRunning = true;

    capacityExpansion.classList.add("is-animating");
    capacityExpansionPanel.setAttribute("aria-hidden", "false");
    capacityExpansionLink.setAttribute("aria-hidden", "false");
    capacityExpansionCard.setAttribute("aria-hidden", "false");

    setStageMessage(
      "Panel reveal: the 2 Loop Expansion Card begins its infographic sequence.",
      "Revealing panel..."
    );

    capacityExpansionPanel.classList.add("is-visible");
    await sleep(220);

    if (runId !== expansionRunId) {
      return;
    }

    capacityExpansionLink.classList.add("is-visible");
    positionExpansionLink(0);

    window.requestAnimationFrame(() => {
      if (runId !== expansionRunId) {
        return;
      }

      positionExpansionLink(1);
    });

    setStageMessage(
      "The dashed line is growing toward the card before the 2 Loop Expansion Card reveals itself.",
      "Growing connector..."
    );

    await sleep(560);

    if (runId !== expansionRunId) {
      return;
    }

    capacityExpansionCard.classList.add("is-visible");
    setStageMessage(
      "The card is visible. Four loops now reveal from top to bottom.",
      "Revealing loops..."
    );

    await sleep(220);

    if (runId !== expansionRunId) {
      return;
    }

    for (let index = 0; index < expansionRowRecords.length; index += 1) {
      const record = expansionRowRecords[index];

      record.element.classList.add("is-visible");
      
      // Reveal the connection line to this row
      renderExpansionConnections();
      if (expansionConnections[index]) {
        expansionConnections[index].style.opacity = "0.8";
      }

      await sleep(120);

      if (runId !== expansionRunId) {
        return;
      }

      record.icon.classList.add("is-visible");
      record.count.classList.add("is-visible");
    }

    capacityExpansion.classList.add("is-loops-visible", "is-complete");
    isExpansionRunning = false;
    interactionStep = 0;

    setStageMessage(
      "The 2 Loop Expansion Card infographic is complete. Click to replay from the beginning.",
      "Click to replay"
    );
  }

  function handleAdvance() {
    if (isIntroRunning || isAggregating || isExpansionRunning) {
      return;
    }

    if (interactionStep === 0) {
      runIntroSequence();
      return;
    }

    if (interactionStep === 1) {
      revealPanelStats();
      return;
    }

    if (interactionStep === 2) {
      animateAggregation();
      return;
    }

    if (interactionStep === 3) {
      showExpansionScene();
      return;
    }

    if (interactionStep === 4) {
      runExpansionSequence();
      return;
    }

    interactionStep = 0;
    runIntroSequence();
  }

  function handleResize() {
    if (panelRecords.length) {
      applyPanelPositions();
    }

    if (lineRecords.length) {
      renderNetworkLines();
    }

    if (capacityExpansion && expansionSceneVisible) {
      positionExpansionLink();
    }
  }

  buildPanels();
  ensureExpansionScene();
  buildExpansionRows();
  resetStageVisuals();
  setStageMessage(
    "Click to start the panel drop. The first click launches the arc landing, the next reveals per-panel capacity, the third totals the system, and the fourth opens the 2 Loop Expansion Card.",
    "Click to start"
  );

  capacityStageShell.addEventListener("click", handleAdvance);
  capacityStageHint.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleAdvance();
  });
  window.addEventListener("resize", handleResize);
}());
