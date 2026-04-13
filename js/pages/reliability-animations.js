(function () {
  const PARTICLE_INTERVAL_MS = 260;
  const PARTICLE_DURATION_MS = 540;
  const SIGNAL_FLASH_MS = 220;
  const DOUBLE_LANE_OFFSET = 6;
  const WIRED_SNAKE_AMPLITUDE = 108;
  const WIRELESS_BRANCH_CURVE_AMPLITUDE = 62;

  const STAGE_CONFIGS = {
    oneWay: {
      mapId: "reli-animation-map-one-way",
      layerId: "reli-connection-layer-one-way",
      alarmPanel: "oneway-panel",
      devices: [
        { id: "oneway-det", type: "det", left: "16%", top: "28%", scale: 0.94 },
        { id: "oneway-sounder", type: "sounder", left: "17%", top: "74%", scale: 0.94 },
        { id: "oneway-node", type: "node", left: "39%", top: "53%", scale: 1.06 },
        { id: "oneway-leader", type: "leader-node", left: "63%", top: "53%", scale: 1.16 },
        { id: "oneway-panel", type: "cie", left: "86%", top: "50%", scale: 0.68, label: "CIE", flipX: true }
      ],
      links: [
        { from: "oneway-det", to: "oneway-node", kind: "wireless-single", breakable: false },
        { from: "oneway-sounder", to: "oneway-node", kind: "wireless-single", breakable: false },
        { from: "oneway-node", to: "oneway-leader", kind: "wireless-single", breakable: false },
        { from: "oneway-leader", to: "oneway-panel", kind: "wired", breakable: false }
      ]
    },
    twoWay: {
      mapId: "reli-animation-map-two-way",
      layerId: "reli-connection-layer-two-way",
      alarmPanel: "twoway-panel",
      devices: [
        { id: "twoway-det-left", type: "det", left: "18%", top: "28%", scale: 0.9 },
        { id: "twoway-node", type: "node", left: "36%", top: "53%", scale: 1.02 },
        { id: "twoway-sounder", type: "sounder", left: "16%", top: "79%", scale: 0.92 },
        { id: "twoway-det-top", type: "det", left: "56%", top: "14%", scale: 0.88 },
        { id: "twoway-det-bottom", type: "det", left: "53%", top: "86%", scale: 0.9 },
        { id: "twoway-leader", type: "leader-node", left: "74%", top: "50%", scale: 1.12 },
        { id: "twoway-panel", type: "panel", left: "88%", top: "24%", scale: 0.62 }
      ],
      links: [
        { from: "twoway-det-left", to: "twoway-node", kind: "wireless-double", breakable: false, curveBias: -1, curveAmplitude: WIRELESS_BRANCH_CURVE_AMPLITUDE },
        { from: "twoway-sounder", to: "twoway-node", kind: "wireless-double", breakable: false, curveBias: 1, curveAmplitude: WIRELESS_BRANCH_CURVE_AMPLITUDE },
        { from: "twoway-node", to: "twoway-det-top", kind: "wireless-double", breakable: false, curveBias: -1, curveAmplitude: WIRELESS_BRANCH_CURVE_AMPLITUDE },
        { from: "twoway-node", to: "twoway-det-bottom", kind: "wireless-double", breakable: false, curveBias: 1, curveAmplitude: WIRELESS_BRANCH_CURVE_AMPLITUDE },
        { from: "twoway-det-top", to: "twoway-leader", kind: "wireless-double", breakable: false, curveBias: -1, curveAmplitude: WIRELESS_BRANCH_CURVE_AMPLITUDE },
        { from: "twoway-det-bottom", to: "twoway-leader", kind: "wireless-double", breakable: false, curveBias: 1, curveAmplitude: WIRELESS_BRANCH_CURVE_AMPLITUDE },
        { from: "twoway-node", to: "twoway-leader", kind: "wireless-double", breakable: true },
        { from: "twoway-leader", to: "twoway-panel", kind: "wired", breakable: false, curveBias: -1 }
      ]
    }
  };

  const stageState = {};
  let particleLoopId = null;

  init();

  function init() {
    const stageKeys = Object.keys(STAGE_CONFIGS).filter((stageKey) => {
      const config = STAGE_CONFIGS[stageKey];
      return document.getElementById(config.mapId) && document.getElementById(config.layerId);
    });

    if (stageKeys.length === 0) {
      return;
    }

    stageKeys.forEach((stageKey) => {
      if (!stageState[stageKey]) {
        stageState[stageKey] = {
          brokenLinks: new Set(),
          activeParticles: new Set(),
          deviceIndex: new Map()
        };
      }
    });

    const renderAll = () => {
      stageKeys.forEach((stageKey) => renderStage(stageKey, STAGE_CONFIGS[stageKey]));
    };

    renderAll();
    window.addEventListener("resize", renderAll);

    if (particleLoopId !== null) {
      window.clearInterval(particleLoopId);
    }

    particleLoopId = window.setInterval(() => {
      stageKeys.forEach((stageKey) => spawnParticlesForStage(stageKey, STAGE_CONFIGS[stageKey]));
    }, PARTICLE_INTERVAL_MS);
  }

  function renderStage(stageKey, stageConfig) {
    const map = document.getElementById(stageConfig.mapId);
    const layer = document.getElementById(stageConfig.layerId);

    if (!map || !layer) {
      return;
    }

    map.innerHTML = "";
    layer.innerHTML = "";

    const deviceIndex = new Map();

    stageConfig.devices.forEach((device) => {
      const element = createDeviceElement(device);
      map.appendChild(element);
      deviceIndex.set(device.id, { ...device, element });
    });

    stageConfig.links.forEach((link) => {
      drawConfiguredLink({
        stageKey,
        stageConfig,
        map,
        layer,
        from: deviceIndex.get(link.from),
        to: deviceIndex.get(link.to),
        link
      });
    });

    stageState[stageKey].deviceIndex = deviceIndex;
    updateStageAlarm(stageKey, stageConfig, deviceIndex);
  }

  function createDeviceElement(device) {
    const element = document.createElement("div");
    element.id = device.id;
    element.className = `reliability-device ${device.type}`;
    element.style.left = device.left;
    element.style.top = device.top;

    const icon = document.createElement("div");
    icon.className = "reli-icon";
    icon.style.transform = `scale(${device.scale ?? 1}) scaleX(${device.flipX ? -1 : 1})`;
    element.appendChild(icon);

    if (device.label) {
      const label = document.createElement("div");
      label.className = "reli-device-label";
      label.textContent = device.label;
      element.appendChild(label);
    }

    return element;
  }

  function drawConfiguredLink({ stageKey, stageConfig, map, layer, from, to, link }) {
    if (!from || !to) {
      return;
    }

    const linkId = `${stageKey}:${link.from}:${link.to}`;
    const isBroken = stageState[stageKey].brokenLinks.has(linkId);

    if (link.kind === "wireless-double") {
      const primaryGeometry = createDoubleLaneGeometry(map, from.element, to.element, link, DOUBLE_LANE_OFFSET);
      const secondaryGeometry = createDoubleLaneGeometry(map, from.element, to.element, link, -DOUBLE_LANE_OFFSET);

      drawGeometry(layer, primaryGeometry, getLinkClasses(link, "primary"), isBroken);
      drawGeometry(layer, secondaryGeometry, getLinkClasses(link, "secondary"), isBroken);

      if (link.kind !== "wired") {
        drawHitbox(layer, createDoubleLaneGeometry(map, from.element, to.element, link, 0), () => {
          toggleWirelessLink(linkId, stageKey, stageConfig);
        });
      }

      if (isBroken) {
        drawBreakMarker(layer, primaryGeometry, secondaryGeometry);
      }
      return;
    }

    const geometry = getConfiguredGeometry(map, from.element, to.element, link);
    drawGeometry(layer, geometry, getLinkClasses(link), isBroken);

    if (link.kind !== "wired") {
      drawHitbox(layer, geometry, () => {
        toggleWirelessLink(linkId, stageKey, stageConfig);
      });
    }

    if (isBroken) {
      drawBreakMarker(layer, geometry);
    }
  }

  function getConfiguredGeometry(map, fromElement, toElement, link) {
    if (link.kind === "wired") {
      return createCurvedGeometry(map, fromElement, toElement, WIRED_SNAKE_AMPLITUDE, link.curveBias || -1);
    }

    return createLineGeometry(map, fromElement, toElement, 0);
  }

  function drawGeometry(layer, geometry, className, isBroken) {
    if (geometry.type === "curve") {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", geometry.path);
      path.setAttribute("class", `${className}${isBroken ? " reli-link-broken" : ""}`);
      layer.appendChild(path);
      return;
    }

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", geometry.start.x);
    line.setAttribute("y1", geometry.start.y);
    line.setAttribute("x2", geometry.end.x);
    line.setAttribute("y2", geometry.end.y);
    line.setAttribute("class", `${className}${isBroken ? " reli-link-broken" : ""}`);
    layer.appendChild(line);
  }

  function drawHitbox(layer, geometry, onClick) {
    if (geometry.type === "curve") {
      const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hitbox.setAttribute("d", geometry.path);
      hitbox.setAttribute("class", "reli-connection-hitbox");
      hitbox.addEventListener("click", onClick);
      layer.appendChild(hitbox);
      return;
    }

    const hitbox = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hitbox.setAttribute("x1", geometry.start.x);
    hitbox.setAttribute("y1", geometry.start.y);
    hitbox.setAttribute("x2", geometry.end.x);
    hitbox.setAttribute("y2", geometry.end.y);
    hitbox.setAttribute("class", "reli-connection-hitbox");
    hitbox.addEventListener("click", onClick);
    layer.appendChild(hitbox);
  }

  function drawBreakMarker(layer, primaryGeometry, secondaryGeometry) {
    const midpoint = secondaryGeometry
      ? {
          x: (primaryGeometry.mid.x + secondaryGeometry.mid.x) / 2,
          y: (primaryGeometry.mid.y + secondaryGeometry.mid.y) / 2
        }
      : primaryGeometry.mid;

    const marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
    marker.setAttribute("class", "reli-break-x");

    const lineOne = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineOne.setAttribute("class", "reli-break-x-line");
    lineOne.setAttribute("x1", midpoint.x - 9);
    lineOne.setAttribute("y1", midpoint.y - 9);
    lineOne.setAttribute("x2", midpoint.x + 9);
    lineOne.setAttribute("y2", midpoint.y + 9);

    const lineTwo = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineTwo.setAttribute("class", "reli-break-x-line");
    lineTwo.setAttribute("x1", midpoint.x + 9);
    lineTwo.setAttribute("y1", midpoint.y - 9);
    lineTwo.setAttribute("x2", midpoint.x - 9);
    lineTwo.setAttribute("y2", midpoint.y + 9);

    marker.appendChild(lineOne);
    marker.appendChild(lineTwo);
    layer.appendChild(marker);
  }

  function toggleWirelessLink(linkId, stageKey, stageConfig) {
    const brokenLinks = stageState[stageKey].brokenLinks;
    if (brokenLinks.has(linkId)) {
      brokenLinks.delete(linkId);
    } else {
      brokenLinks.add(linkId);
    }

    renderStage(stageKey, stageConfig);
  }

  function updateStageAlarm(stageKey, stageConfig, deviceIndex) {
    const panel = deviceIndex.get(stageConfig.alarmPanel);
    if (!panel) {
      return;
    }

    panel.element.classList.toggle(
      "is-alarming",
      stageKey === "twoWay" && stageState[stageKey].brokenLinks.size > 0
    );
  }

  function spawnParticlesForStage(stageKey, stageConfig) {
    const state = stageState[stageKey];
    const map = document.getElementById(stageConfig.mapId);

    if (!state || !map || !state.deviceIndex) {
      return;
    }

    stageConfig.links.forEach((link) => {
      const linkId = `${stageKey}:${link.from}:${link.to}`;
      if (!shouldAnimateParticles(link) || state.brokenLinks.has(linkId)) {
        return;
      }

      const from = state.deviceIndex.get(link.from);
      const to = state.deviceIndex.get(link.to);

      if (!from || !to) {
        return;
      }

      if (link.kind === "wireless-double") {
        const cycleKey = `${linkId}:cycle`;
        if (state.activeParticles.has(cycleKey)) {
          return;
        }

        state.activeParticles.add(cycleKey);

        const outboundGeometry = createDoubleLaneGeometry(map, from.element, to.element, link, DOUBLE_LANE_OFFSET);
        const inboundGeometry = reverseGeometry(
          createDoubleLaneGeometry(map, from.element, to.element, link, -DOUBLE_LANE_OFFSET)
        );

        spawnParticlePair(stageKey, map, [
          {
            geometry: outboundGeometry,
            particleKey: `${linkId}:outbound`,
            secondary: false,
            targetElement: to.element
          },
          {
            geometry: inboundGeometry,
            particleKey: `${linkId}:inbound`,
            secondary: true,
            targetElement: from.element
          }
        ], () => {
          state.activeParticles.delete(cycleKey);
        });
        return;
      }

      const geometry = getConfiguredGeometry(map, from.element, to.element, link);
      spawnParticleOnGeometry(stageKey, map, geometry, `${linkId}:single`, false);
    });
  }

  function spawnParticleOnGeometry(stageKey, map, geometry, particleKey, secondary, onFinish) {
    const activeParticles = stageState[stageKey].activeParticles;
    if (activeParticles.has(particleKey)) {
      return;
    }

    activeParticles.add(particleKey);

    const particle = document.createElement("div");
    particle.className = `reli-particle${secondary ? " reli-particle-secondary" : ""}`;
    particle.style.left = `${geometry.start.x}px`;
    particle.style.top = `${geometry.start.y}px`;
    map.appendChild(particle);

    const keyframes = geometry.type === "curve"
      ? createCurveKeyframes(geometry)
      : createLineKeyframes(geometry);

    const animation = particle.animate(keyframes, {
      duration: PARTICLE_DURATION_MS,
      easing: "ease-in-out"
    });

    animation.onfinish = () => {
      particle.remove();
      activeParticles.delete(particleKey);
      if (typeof onFinish === "function") {
        onFinish();
      }
    };
  }

  function spawnParticlePair(stageKey, map, particleConfigs, onFinish) {
    let completedParticles = 0;

    particleConfigs.forEach(({ geometry, particleKey, secondary, targetElement }) => {
      spawnParticleOnGeometry(stageKey, map, geometry, particleKey, secondary, () => {
        flashDeviceSignal(targetElement);
        completedParticles += 1;
        if (completedParticles === particleConfigs.length && typeof onFinish === "function") {
          onFinish();
        }
      });
    });
  }

  function flashDeviceSignal(element) {
    if (!element) {
      return;
    }

    element.classList.remove("signal-flash");
    void element.offsetWidth;
    element.classList.add("signal-flash");

    window.setTimeout(() => {
      element.classList.remove("signal-flash");
    }, SIGNAL_FLASH_MS);
  }

  function createLineKeyframes(geometry) {
    const deltaX = geometry.end.x - geometry.start.x;
    const deltaY = geometry.end.y - geometry.start.y;

    return [
      { transform: "translate(0, 0) scale(0)", opacity: 0 },
      {
        transform: `translate(${deltaX * 0.12}px, ${deltaY * 0.12}px) scale(1.2)`,
        opacity: 1,
        offset: 0.12
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
        opacity: 0
      }
    ];
  }

  function createCurveKeyframes(geometry) {
    const keyframes = [{ transform: "translate(0, 0) scale(0)", opacity: 0, offset: 0 }];
    const samples = 8;

    for (let index = 1; index <= samples; index += 1) {
      const t = index / samples;
      const point = getBezierPoint(geometry, t);
      keyframes.push({
        transform: `translate(${point.x - geometry.start.x}px, ${point.y - geometry.start.y}px) scale(${t < 0.12 ? 1.16 : 1})`,
        opacity: t >= 1 ? 0 : 1,
        offset: t
      });
    }

    return keyframes;
  }

  function shouldAnimateParticles(link) {
    return link.kind !== "wired";
  }

  function getLinkClasses(link, lane = "primary") {
    if (link.kind === "wired") {
      return "reli-link reli-link-wired";
    }

    if (link.kind === "wireless-double" && lane === "secondary") {
      return "reli-link reli-link-wireless-secondary";
    }

    return "reli-link reli-link-wireless";
  }

  function createLineGeometry(map, fromElement, toElement, offset) {
    const mapRect = map.getBoundingClientRect();
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2 - mapRect.left;
    const startY = fromRect.top + fromRect.height / 2 - mapRect.top;
    const endX = toRect.left + toRect.width / 2 - mapRect.left;
    const endY = toRect.top + toRect.height / 2 - mapRect.top;

    if (!offset) {
      return {
        type: "line",
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        mid: { x: (startX + endX) / 2, y: (startY + endY) / 2 }
      };
    }

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const length = Math.hypot(deltaX, deltaY) || 1;
    const normalX = -deltaY / length;
    const normalY = deltaX / length;

    const adjustedStart = {
      x: startX + normalX * offset,
      y: startY + normalY * offset
    };
    const adjustedEnd = {
      x: endX + normalX * offset,
      y: endY + normalY * offset
    };

    return {
      type: "line",
      start: adjustedStart,
      end: adjustedEnd,
      mid: {
        x: (adjustedStart.x + adjustedEnd.x) / 2,
        y: (adjustedStart.y + adjustedEnd.y) / 2
      }
    };
  }

  function createCurvedGeometry(map, fromElement, toElement, amplitude, bias) {
    const base = createLineGeometry(map, fromElement, toElement, 0);
    const deltaX = base.end.x - base.start.x;
    const deltaY = base.end.y - base.start.y;
    const length = Math.hypot(deltaX, deltaY) || 1;
    const normalX = (-deltaY / length) * bias;
    const normalY = (deltaX / length) * bias;

    const control1 = {
      x: base.start.x + deltaX * 0.28 + normalX * amplitude,
      y: base.start.y + deltaY * 0.28 + normalY * amplitude
    };
    const control2 = {
      x: base.start.x + deltaX * 0.72 - normalX * amplitude,
      y: base.start.y + deltaY * 0.72 - normalY * amplitude
    };

    return {
      type: "curve",
      start: base.start,
      end: base.end,
      control1,
      control2,
      mid: getBezierPoint({
        start: base.start,
        control1,
        control2,
        end: base.end
      }, 0.5),
      path: `M ${base.start.x} ${base.start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${base.end.x} ${base.end.y}`
    };
  }

  function createDoubleLaneGeometry(map, fromElement, toElement, link, laneOffset) {
    if (link.curveAmplitude) {
      return createOffsetCurvedGeometry(
        map,
        fromElement,
        toElement,
        link.curveAmplitude,
        link.curveBias || 1,
        laneOffset
      );
    }

    return createLineGeometry(map, fromElement, toElement, laneOffset);
  }

  function createOffsetCurvedGeometry(map, fromElement, toElement, amplitude, bias, laneOffset) {
    const base = createLineGeometry(map, fromElement, toElement, laneOffset);
    const deltaX = base.end.x - base.start.x;
    const deltaY = base.end.y - base.start.y;
    const length = Math.hypot(deltaX, deltaY) || 1;
    const normalX = (-deltaY / length) * bias;
    const normalY = (deltaX / length) * bias;

    const control1 = {
      x: base.start.x + deltaX * 0.28 + normalX * amplitude,
      y: base.start.y + deltaY * 0.28 + normalY * amplitude
    };
    const control2 = {
      x: base.start.x + deltaX * 0.72 - normalX * amplitude,
      y: base.start.y + deltaY * 0.72 - normalY * amplitude
    };

    return {
      type: "curve",
      start: base.start,
      end: base.end,
      control1,
      control2,
      mid: getBezierPoint({
        start: base.start,
        control1,
        control2,
        end: base.end
      }, 0.5),
      path: `M ${base.start.x} ${base.start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${base.end.x} ${base.end.y}`
    };
  }

  function getBezierPoint(geometry, t) {
    const oneMinusT = 1 - t;
    const x =
      oneMinusT ** 3 * geometry.start.x +
      3 * oneMinusT ** 2 * t * geometry.control1.x +
      3 * oneMinusT * t ** 2 * geometry.control2.x +
      t ** 3 * geometry.end.x;
    const y =
      oneMinusT ** 3 * geometry.start.y +
      3 * oneMinusT ** 2 * t * geometry.control1.y +
      3 * oneMinusT * t ** 2 * geometry.control2.y +
      t ** 3 * geometry.end.y;

    return { x, y };
  }

  function reverseGeometry(geometry) {
    if (geometry.type === "curve") {
      return {
        ...geometry,
        start: geometry.end,
        end: geometry.start,
        control1: geometry.control2,
        control2: geometry.control1,
        path: `M ${geometry.end.x} ${geometry.end.y} C ${geometry.control2.x} ${geometry.control2.y}, ${geometry.control1.x} ${geometry.control1.y}, ${geometry.start.x} ${geometry.start.y}`
      };
    }

    return {
      ...geometry,
      start: geometry.end,
      end: geometry.start
    };
  }
}());
