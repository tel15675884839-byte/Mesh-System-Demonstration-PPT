window.LinkEffects = (function () {
  function clamp01(value) {
    return THREE.MathUtils.clamp(value, 0, 1);
  }

  function getPathLength(points) {
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      total += points[i - 1].distanceTo(points[i]);
    }
    return total;
  }

  function samplePolyline(points, t, target) {
    if (!points || points.length === 0) {
      return target.set(0, 0, 0);
    }
    if (points.length === 1) {
      return target.copy(points[0]);
    }

    const clampedT = clamp01(t);
    const total = getPathLength(points);
    if (total <= 0.0001) {
      return target.copy(points[0]);
    }

    let remaining = total * clampedT;
    for (let i = 1; i < points.length; i += 1) {
      const segmentLength = points[i - 1].distanceTo(points[i]);
      if (remaining <= segmentLength || i === points.length - 1) {
        const localT = segmentLength <= 0.0001 ? 0 : remaining / segmentLength;
        return target.copy(points[i - 1]).lerp(points[i], localT);
      }
      remaining -= segmentLength;
    }

    return target.copy(points[points.length - 1]);
  }

  function getStraightLinkPoints(start, end) {
    return [start.clone(), end.clone()];
  }

  function getDeviceArcPoints(start, end) {
    const distanceValue = start.distanceTo(end);
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const arcHeight = THREE.MathUtils.clamp(distanceValue * 0.18, 1.2, 5.5);
    const control = midpoint.clone().add(new THREE.Vector3(0, arcHeight, 0));
    const curve = new THREE.QuadraticBezierCurve3(start.clone(), control, end.clone());
    return curve.getPoints(18);
  }

  function getMotionCarrierScale(isNodeLink, config, nodeSize, deviceSize) {
    const base = isNodeLink ? nodeSize * 0.16 : deviceSize * 0.42;
    return base;
  }

  function createLinkActor(options) {
    const {
      root,
      start,
      end,
      color,
      dashSize,
      gapSize,
      opacity,
      linewidth = 1,
      pathPoints
    } = options;

    const actor = new THREE.Group();
    const points = pathPoints || getStraightLinkPoints(start, end);

    const baseGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const baseMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: opacity * 0.28,
      depthWrite: false,
      depthTest: true
    });
    const baseLine = new THREE.Line(baseGeometry, baseMaterial);

    const pulseGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const pulseMaterial = new THREE.LineDashedMaterial({
      color,
      dashSize,
      gapSize,
      linewidth,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: true
    });
    const pulseLine = new THREE.Line(pulseGeometry, pulseMaterial);
    pulseLine.computeLineDistances();

    actor.add(baseLine);
    actor.add(pulseLine);

    const trailSegments = [];
    for (let i = 1; i < points.length; i += 1) {
      const trailGeometry = new THREE.BufferGeometry().setFromPoints([points[i - 1], points[i]]);
      const trailMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true
      });
      const trailLine = new THREE.Line(trailGeometry, trailMaterial);
      actor.add(trailLine);
      trailSegments.push(trailLine);
    }

    const carriers = [];
    for (let i = 0; i < 48; i += 1) {
      const carrier = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 10, 10),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          depthWrite: false
        })
      );
      carrier.visible = false;
      actor.add(carrier);
      carriers.push(carrier);
    }

    actor.userData.baseLine = baseLine;
    actor.userData.pulseLine = pulseLine;
    actor.userData.trailSegments = trailSegments;
    actor.userData.carriers = carriers;
    actor.userData.motionColor = new THREE.Color(color);
    actor.userData.pathPoints = points.map(function (point) { return point.clone(); });
    actor.userData.energyProfile = new Array(Math.max(1, points.length - 1)).fill(0);
    root.add(actor);
    return actor;
  }

  function updateLinkActorGeometry(actor, start, end, pathPoints) {
    const baseLine = actor.userData.baseLine;
    const pulseLine = actor.userData.pulseLine;
    const points = pathPoints || getStraightLinkPoints(start, end);

    baseLine.geometry.setFromPoints(points);
    baseLine.geometry.attributes.position.needsUpdate = true;

    pulseLine.geometry.setFromPoints(points);
    pulseLine.computeLineDistances();
    pulseLine.geometry.attributes.position.needsUpdate = true;

    const trailSegments = actor.userData.trailSegments || [];
    for (let i = 0; i < trailSegments.length; i += 1) {
      const a = points[Math.min(i, points.length - 2)];
      const b = points[Math.min(i + 1, points.length - 1)];
      trailSegments[i].geometry.setFromPoints([a, b]);
      trailSegments[i].geometry.attributes.position.needsUpdate = true;
    }
    actor.userData.pathPoints = points.map(function (point) { return point.clone(); });
    actor.userData.energyProfile = new Array(Math.max(1, points.length - 1)).fill(0);
  }

  function disposeLinkActor(actor) {
    const baseLine = actor.userData.baseLine;
    const pulseLine = actor.userData.pulseLine;
    const trailSegments = actor.userData.trailSegments || [];
    const carriers = actor.userData.carriers || [];
    if (baseLine) {
      baseLine.geometry.dispose();
      baseLine.material.dispose();
    }
    if (pulseLine) {
      pulseLine.geometry.dispose();
      pulseLine.material.dispose();
    }
    for (let i = 0; i < trailSegments.length; i += 1) {
      trailSegments[i].geometry.dispose();
      trailSegments[i].material.dispose();
    }
    for (let i = 0; i < carriers.length; i += 1) {
      carriers[i].geometry.dispose();
      carriers[i].material.dispose();
    }
  }

  function applyLinkAppearance(actor, options) {
    const { color, dashSize, gapSize, linewidth, baseOpacity, pulseOpacity } = options;
    const baseMat = actor.userData.baseLine.material;
    const pulseMat = actor.userData.pulseLine.material;
    const trailSegments = actor.userData.trailSegments || [];
    const carriers = actor.userData.carriers || [];

    baseMat.color.set(color);
    baseMat.opacity = baseOpacity;
    pulseMat.color.set(color);
    pulseMat.dashSize = dashSize;
    pulseMat.gapSize = gapSize;
    pulseMat.linewidth = linewidth;
    pulseMat.opacity = pulseOpacity;
    actor.userData.motionColor.set(color);
    for (let i = 0; i < trailSegments.length; i += 1) {
      trailSegments[i].material.color.set(color);
    }
    for (let i = 0; i < carriers.length; i += 1) {
      carriers[i].material.color.set(color);
    }
    actor.userData.pulseLine.computeLineDistances();
  }

  function resetTrailSegments(actor) {
    const trailSegments = actor.userData.trailSegments || [];
    for (let i = 0; i < trailSegments.length; i += 1) {
      trailSegments[i].visible = false;
      trailSegments[i].material.opacity = 0;
    }
  }

  function updateEnergyTrail(actor, color, widthStrength, phase, intensity, mode) {
    // Legacy modes cleared, ready for new implementations
    return {
      baseOpacity: 0.12 + widthStrength * 0.1,
      pulseOpacity: 0.5 + widthStrength * 0.2
    };
  }

  function updateQuantumParticles(actor, pathPoints, color, phase, intensity, isNodeLink, config, nodeSize, deviceSize) {
    const carriers = actor.userData.carriers || [];
    const headScale = (isNodeLink ? nodeSize * 0.18 : deviceSize * 0.46) * 1.1;
    const tailCount = 5;
    const streamCount = Math.max(1, Math.round(config.linkMotionIntensity || 1));
    const temp = new THREE.Vector3();
    const stepBack = 0.025;
    const streamSpacing = THREE.MathUtils.clamp(config.linkMotionSpacing || 0.18, 0.08, 0.4);
    const baseAlpha = 0.72;
    let carrierIndex = 0;
    const directions = config.bidirectionalMotion ? [1, -1] : [1];

    for (let dirIndex = 0; dirIndex < directions.length; dirIndex += 1) {
      const direction = directions[dirIndex];
      const directionPhase = direction === 1
        ? phase
        : (1 - phase + streamSpacing * 0.5 + dirIndex * 0.13) % 1;

      for (let stream = 0; stream < streamCount; stream += 1) {
        const headT = (directionPhase + stream * streamSpacing) % 1;

        for (let i = 0; i < tailCount && carrierIndex < carriers.length; i += 1, carrierIndex += 1) {
          const particleT = direction === 1
            ? headT - i * stepBack
            : headT + i * stepBack;
          const wrappedT = ((particleT % 1) + 1) % 1;
          samplePolyline(pathPoints, wrappedT, temp);

          const carrier = carriers[carrierIndex];
          const alpha = Math.max(0.08, 1 - i * 0.2) * baseAlpha * (direction === 1 ? 1 : 0.86);
          const scale = Math.max(0.08, headScale - i * (headScale * 0.16));

          carrier.visible = true;
          carrier.position.copy(temp);
          carrier.scale.setScalar(scale);
          carrier.material.color.copy(color);
          carrier.material.opacity = alpha;
          carrier.material.blending = i === 0 ? THREE.AdditiveBlending : THREE.NormalBlending;
        }
      }
    }

    for (let i = carrierIndex; i < carriers.length; i += 1) {
      carriers[i].visible = false;
      carriers[i].material.opacity = 0;
    }

    return {
      baseOpacity: 0.035,
      pulseOpacity: 0.18
    };
  }

  function updateStandardFlow(actor, pathPoints, color, phase, isNodeLink, config, nodeSize, deviceSize) {
    const carriers = actor.userData.carriers || [];
    const temp = new THREE.Vector3();
    const headScale = (isNodeLink ? nodeSize * 0.16 : deviceSize * 0.38) * 0.95;
    const packetCount = Math.max(1, Math.round(config.linkMotionIntensity || 1));
    const packetSpacing = THREE.MathUtils.clamp(config.linkMotionSpacing || 0.18, 0.08, 0.4);
    const directions = config.bidirectionalMotion ? [1, -1] : [1];
    let carrierIndex = 0;

    for (let dirIndex = 0; dirIndex < directions.length; dirIndex += 1) {
      const direction = directions[dirIndex];
      const directionPhase = direction === 1
        ? phase
        : (1 - phase + packetSpacing * 0.5 + dirIndex * 0.11) % 1;

      for (let i = 0; i < packetCount && carrierIndex < carriers.length; i += 1, carrierIndex += 1) {
        samplePolyline(pathPoints, (directionPhase + i * packetSpacing) % 1, temp);

        const carrier = carriers[carrierIndex];
        carrier.visible = true;
        carrier.position.copy(temp);
        carrier.scale.setScalar(headScale);
        carrier.material.color.copy(color);
        carrier.material.opacity = direction === 1 ? 0.88 : 0.76;
        carrier.material.blending = THREE.AdditiveBlending;
      }
    }

    for (let i = carrierIndex; i < carriers.length; i += 1) {
      carriers[i].visible = false;
      carriers[i].material.opacity = 0;
    }

    return {
      baseOpacity: 0.03,
      pulseOpacity: 0.16
    };
  }

  function updateLinkMotion(options) {
    const {
      actor,
      start,
      end,
      elapsed,
      isNodeLink,
      isSelected,
      isDisconnected,
      reconnectPulse,
      isHidden,
      config,
      nodeSize,
      deviceSize
    } = options;

    const baseMat = actor.userData.baseLine.material;
    const pulseMat = actor.userData.pulseLine.material;
    const carriers = actor.userData.carriers || [];
    const motionConfig = isNodeLink ? {
      mode: config.nodeLinkMotionMode || config.linkMotionMode || "off",
      speed: config.nodeLinkMotionSpeed ?? config.linkMotionSpeed ?? 1,
      intensity: config.nodeLinkMotionIntensity ?? config.linkMotionIntensity ?? 1,
      spacing: config.nodeLinkMotionSpacing ?? config.linkMotionSpacing ?? 0.18
    } : {
      mode: config.deviceLinkMotionMode || config.linkMotionMode || "off",
      speed: config.deviceLinkMotionSpeed ?? config.linkMotionSpeed ?? 1,
      intensity: config.deviceLinkMotionIntensity ?? config.linkMotionIntensity ?? 1,
      spacing: config.deviceLinkMotionSpacing ?? config.linkMotionSpacing ?? 0.18
    };
    const scopedConfig = Object.assign({}, config, {
      linkMotionMode: motionConfig.mode,
      linkMotionSpeed: motionConfig.speed,
      linkMotionIntensity: motionConfig.intensity,
      linkMotionSpacing: motionConfig.spacing
    });
    const mode = motionConfig.mode;
    const speed = motionConfig.speed;
    const intensity = motionConfig.intensity;
    const color = isSelected ? new THREE.Color(0xffffff) : actor.userData.motionColor;
    const pathPoints = actor.userData.pathPoints || getStraightLinkPoints(start, end);
    const widthStrength = THREE.MathUtils.clamp((isNodeLink ? config.nodeLinkWidth : config.deviceLinkWidth) / 5, 0, 1);
    const phase = elapsed * speed * (isNodeLink ? 0.8 : 1.1);
    const temp = new THREE.Vector3();
    const carrierScale = getMotionCarrierScale(isNodeLink, config, nodeSize, deviceSize);
    const reconnectStrength = THREE.MathUtils.clamp(reconnectPulse || 0, 0, 1);

    baseMat.color.copy(color);
    pulseMat.color.copy(color);
    pulseMat.dashSize = isNodeLink ? config.nodeLinkDash : config.deviceLinkDash;
    pulseMat.gapSize = isNodeLink ? config.nodeLinkGap : config.deviceLinkGap;
    pulseMat.linewidth = isNodeLink ? config.nodeLinkWidth : config.deviceLinkWidth;

    for (let i = 0; i < carriers.length; i += 1) {
      carriers[i].visible = false;
      carriers[i].material.opacity = 0;
      carriers[i].material.color.copy(color);
      carriers[i].scale.setScalar(carrierScale);
    }
    resetTrailSegments(actor);

    if (isHidden) {
      if ("dashOffset" in pulseMat) {
        pulseMat.dashOffset = 0;
      }
      baseMat.opacity = 0;
      pulseMat.opacity = 0;
      return;
    }

    if (isDisconnected) {
      const disconnectedColor = isSelected ? new THREE.Color(0xff8e8e) : new THREE.Color(0xff5c5c);
      const warningColor = new THREE.Color(0xffb07a);
      baseMat.color.copy(disconnectedColor);
      pulseMat.color.copy(disconnectedColor);
      pulseMat.dashSize = Math.max(2.2, (isNodeLink ? config.nodeLinkDash : config.deviceLinkDash) * 1.6);
      pulseMat.gapSize = Math.max(1.4, (isNodeLink ? config.nodeLinkGap : config.deviceLinkGap) * 2.8 + 0.5);
      pulseMat.linewidth = isNodeLink ? config.nodeLinkWidth : config.deviceLinkWidth;
      if ("dashOffset" in pulseMat) {
        pulseMat.dashOffset = -elapsed * 0.22;
      }
      const blink = 0.82 + Math.sin(elapsed * 6.6) * 0.12;
      baseMat.opacity = (isNodeLink ? 0.12 : 0.09) * blink + (isSelected ? 0.08 : 0);
      pulseMat.opacity = (isNodeLink ? 0.42 : 0.35) * blink + (isSelected ? 0.2 : 0);

      const centerWave = (Math.sin(elapsed * 2.4) + 1) * 0.5;
      const centerT = 0.35 + centerWave * 0.3;
      const drift = 0.06 + Math.sin(elapsed * 3.2) * 0.025;
      const disconnectedCarrierCount = Math.min(2, carriers.length);
      for (let i = 0; i < disconnectedCarrierCount; i += 1) {
        const offset = i === 0 ? -drift : drift;
        const sampleT = THREE.MathUtils.clamp(centerT + offset, 0.08, 0.92);
        samplePolyline(pathPoints, sampleT, temp);

        const carrier = carriers[i];
        carrier.visible = true;
        carrier.position.copy(temp);
        carrier.scale.setScalar(carrierScale * (i === 0 ? 1.15 : 0.9));
        carrier.material.color.copy(i === 0 ? warningColor : disconnectedColor);
        carrier.material.opacity = i === 0 ? 0.78 : 0.42;
        carrier.material.blending = THREE.AdditiveBlending;
      }

      return;
    }

    if (mode === "off") {
      if ("dashOffset" in pulseMat) {
        pulseMat.dashOffset = 0;
      }
      baseMat.opacity = isSelected ? 0.3 : (isNodeLink ? 0.12 : 0.08) + widthStrength * (isNodeLink ? 0.14 : 0.1);
      pulseMat.opacity = isSelected ? 1.0 : (isNodeLink ? 0.54 : 0.42) + widthStrength * 0.22;
      if (reconnectStrength > 0) {
        const reconnectColor = new THREE.Color(0x79ffb2);
        baseMat.color.lerp(reconnectColor, reconnectStrength * 0.45);
        pulseMat.color.lerp(reconnectColor, reconnectStrength * 0.35);
        baseMat.opacity += reconnectStrength * 0.12;
        pulseMat.opacity += reconnectStrength * 0.24;
      }
      return;
    }

    if (mode === "quantum") {
      const quantumState = updateQuantumParticles(
        actor,
        pathPoints,
        color,
        phase * (0.24 + motionConfig.speed * 0.18),
        intensity,
        isNodeLink,
        scopedConfig,
        nodeSize,
        deviceSize
      );

      if ("dashOffset" in pulseMat) {
        pulseMat.dashOffset = -phase * (0.18 + Math.min(intensity, 6) * 0.12);
      }
      baseMat.opacity = quantumState.baseOpacity;
      pulseMat.opacity = quantumState.pulseOpacity;

      if (isSelected) {
        baseMat.opacity = Math.max(baseMat.opacity, 0.22);
        pulseMat.opacity = Math.max(pulseMat.opacity, 0.38);
      }
      if (reconnectStrength > 0) {
        const reconnectColor = new THREE.Color(0x79ffb2);
        baseMat.color.lerp(reconnectColor, reconnectStrength * 0.45);
        pulseMat.color.lerp(reconnectColor, reconnectStrength * 0.4);
        pulseMat.opacity += reconnectStrength * 0.24;
      }
      return;
    }

    if (mode === "standard") {
      const standardState = updateStandardFlow(
        actor,
        pathPoints,
        color,
        phase * (0.18 + motionConfig.speed * 0.12),
        isNodeLink,
        scopedConfig,
        nodeSize,
        deviceSize
      );

      if ("dashOffset" in pulseMat) {
        pulseMat.dashOffset = -phase * 0.12;
      }
      baseMat.opacity = standardState.baseOpacity;
      pulseMat.opacity = standardState.pulseOpacity;

      if (isSelected) {
        baseMat.opacity = Math.max(baseMat.opacity, 0.22);
        pulseMat.opacity = Math.max(pulseMat.opacity, 0.38);
      }
      if (reconnectStrength > 0) {
        const reconnectColor = new THREE.Color(0x79ffb2);
        baseMat.color.lerp(reconnectColor, reconnectStrength * 0.4);
        pulseMat.color.lerp(reconnectColor, reconnectStrength * 0.35);
        pulseMat.opacity += reconnectStrength * 0.22;
      }
      return;
    }

    // New logic will be injected here for custom modes
    // Resetting defaults for now
    if ("dashOffset" in pulseMat) {
      pulseMat.dashOffset = 0;
    }
    baseMat.opacity = (isNodeLink ? 0.12 : 0.08) + widthStrength * 0.1;
    pulseMat.opacity = (isNodeLink ? 0.54 : 0.42) + widthStrength * 0.2;

    if (isSelected) {
      baseMat.opacity = Math.max(baseMat.opacity, 0.3);
      pulseMat.opacity = 1.0;
    }
    if (reconnectStrength > 0) {
      const reconnectColor = new THREE.Color(0x79ffb2);
      baseMat.color.lerp(reconnectColor, reconnectStrength * 0.42);
      pulseMat.color.lerp(reconnectColor, reconnectStrength * 0.36);
      pulseMat.opacity += reconnectStrength * 0.22;
    }
  }

  function ensureMotionControls() {
    // Moved to static HTML for better layout control
  }

  return {
    getStraightLinkPoints,
    getDeviceArcPoints,
    createLinkActor,
    updateLinkActorGeometry,
    disposeLinkActor,
    applyLinkAppearance,
    updateLinkMotion
  };
})();
