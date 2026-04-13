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
  const totalDevices = panelCount * devicesPerPanel;
  const panelScale = 1.7;
  const arcStartAngle = Math.PI * 1.08;
  const arcEndAngle = Math.PI * 1.92;

  const panelRecords = [];
  const lineRecords = [];
  const activeParticleAnimations = new Set();
  let connectionSvg = null;
  let interactionStep = 0;
  let introRunId = 0;
  let aggregationFrame = 0;
  let countAnimationRunId = 0;
  let isIntroRunning = false;
  let isAggregating = false;

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
        `  <div>Wireless Loops: <strong>${loopsPerPanel}</strong></div>`,
        `  <div>Devices: <strong>${devicesPerPanel}</strong></div>`,
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

    if (aggregationFrame) {
      window.cancelAnimationFrame(aggregationFrame);
      aggregationFrame = 0;
    }
    countAnimationRunId += 1;

    capacityAggregation.classList.remove("is-visible");
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
        duration: 1350 + Math.random() * 450,
        delay,
        easing: "cubic-bezier(0.18, 0.84, 0.22, 1)",
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
    const startTime = performance.now();
    const runId = countAnimationRunId + 1;
    countAnimationRunId = runId;

    if (aggregationFrame) {
      window.cancelAnimationFrame(aggregationFrame);
      aggregationFrame = 0;
    }

    function tick(now) {
      if (runId !== countAnimationRunId) {
        return;
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
    capacityTotalValue.textContent = "0";

    setStageMessage(
      "All panel capacity is now converging into the lower stage hub, combining into the full Network level total of 2000 devices.",
      "Click to replay"
    );

    const target = getAggregationCenter();

    panelRecords.forEach((record, panelIndex) => {
      const center = getPanelCenter(record.element);
      const particleCount = 18;

      for (let particleIndex = 0; particleIndex < particleCount; particleIndex += 1) {
        const spreadX = (Math.random() - 0.5) * 18;
        const spreadY = (Math.random() - 0.5) * 18;
        const delay = panelIndex * 85 + particleIndex * 24;

        createParticle(center.x + spreadX, center.y + spreadY, target.x, target.y, delay);
      }
    });

    animateCountUp(totalDevices, 900);
  }

  function handleAdvance() {
    if (isIntroRunning || isAggregating) {
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
  }

  buildPanels();
  resetStageVisuals();
  setStageMessage(
    "Click to start the panel drop. The first click launches the arc landing, the next reveals per-panel capacity, and the third totals the system.",
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
