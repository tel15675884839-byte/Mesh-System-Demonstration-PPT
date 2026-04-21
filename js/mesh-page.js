(function () {
  const page = document.querySelector(".page-mesh");
  const stage = document.getElementById("mesh-self-healing-stage");
  const canvas = document.getElementById("mesh-stage-canvas");

  if (!page || !stage || !canvas || typeof canvas.getContext !== "function") {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const BASE_WIDTH = 960;
  const BASE_HEIGHT = 540;
  const ACTIVE_PARTICLE_SPEED = 3.4;
  const INTERACTION_RADIUS = 16;
  const MAIN_PARTICLES_PER_EDGE = 2;
  const SUB_PARTICLES_PER_EDGE = 1;

  const stageState = {
    width: Math.max(stage.clientWidth || BASE_WIDTH, 1),
    height: Math.max(stage.clientHeight || BASE_HEIGHT, 1),
    centerX: BASE_WIDTH / 2,
    centerY: BASE_HEIGHT / 2,
    scale: 1,
    dpr: 1,
    time: 0,
    isActive: window.parent === window,
    frameHandle: 0,
    lastTimestamp: 0,
    trailPoints: [],
    isDrawingTrail: false,
    canvasBounds: {
      left: 0,
      top: 0
    },
    frameNodePoints: new Map(),
    frameEdgePoints: new Map()
  };

  const nodes = [
    { id: 0, type: "main", x: 0, y: -164 },
    { id: 1, type: "main", x: -188, y: 86, accessoryIcons: ["sounder"], accessoryLayout: "below", accessoryOffsetY: 154, accessorySizeScale: 0.7 },
    { id: 2, type: "main", x: 188, y: 86, accessoryIcons: ["sounder"], accessoryLayout: "below", accessoryOffsetY: 154, accessorySizeScale: 0.7 },
    { id: 3, type: "sub", x: -226, y: -124, sizeScale: 0.825 },
    { id: 4, type: "sub", x: 226, y: -124, sizeScale: 0.825 },
    { id: 5, type: "sub", x: 0, y: -26 },
    { id: 6, type: "sub", x: -324, y: 148, sizeScale: 0.75 },
    { id: 7, type: "sub", x: 324, y: 148, sizeScale: 0.75 },
    { id: 8, type: "sub", x: 0, y: 228, sizeScale: 0.825 }
  ];

  const edges = [
    { source: 0, target: 1, type: "main", active: true, broken: false },
    { source: 1, target: 2, type: "main", active: true, broken: false },
    { source: 2, target: 0, type: "main", active: true, broken: false },
    { source: 3, target: 0, type: "sub", active: true, broken: false },
    { source: 3, target: 1, type: "sub", active: false, broken: false },
    { source: 4, target: 0, type: "sub", active: true, broken: false },
    { source: 4, target: 2, type: "sub", active: false, broken: false },
    { source: 5, target: 0, type: "sub", active: true, broken: false },
    { source: 5, target: 1, type: "sub", active: false, broken: false },
    { source: 5, target: 2, type: "sub", active: false, broken: false },
    { source: 6, target: 1, type: "sub", active: true, broken: false },
    { source: 7, target: 2, type: "sub", active: true, broken: false },
    { source: 8, target: 1, type: "sub", active: true, broken: false },
    { source: 8, target: 2, type: "sub", active: false, broken: false },
    { source: 1, target: 1, targetAccessory: true, type: "sounder", active: true, broken: false },
    { source: 2, target: 2, targetAccessory: true, type: "sounder", active: true, broken: false },
    { source: 1, target: 2, targetAccessory: true, type: "sounder", active: false, broken: false },
    { source: 2, target: 1, targetAccessory: true, type: "sounder", active: false, broken: false }
  ];
  const nodeById = new Map();
  const subEdgesByNode = new Map();
  const edgeByKey = new Map();

  nodes.forEach(function (node) {
    nodeById.set(node.id, node);
  });

  edges.forEach(function (edge) {
    edge.key = edge.source + ":" + edge.target + (edge.targetAccessory ? ":accessory" : "");
    edgeByKey.set(edge.key, edge);

    if (edge.type !== "sub" && edge.type !== "sounder") {
      return;
    }

    const group = subEdgesByNode.get(edge.source);
    if (group) {
      group.push(edge);
      return;
    }

    subEdgesByNode.set(edge.source, [edge]);
  });

  const stars = Array.from({ length: 72 }, function (_value, index) {
    return {
      x: ((index * 97) % 1000) / 1000,
      y: ((index * 53) % 1000) / 1000,
      radius: 0.8 + (((index * 29) % 100) / 100) * 1.6,
      drift: 0.12 + (((index * 11) % 100) / 100) * 0.26,
      offset: index * 0.7
    };
  });

  const ripples = [];
  let particles = [];

  const iconAssets = {
    main: loadIcon("../assets/icons/node.svg"),
    sub: loadIcon("../assets/icons/smoke.svg"),
    sounder: loadIcon("../assets/icons/sounder.svg")
  };

  function loadIcon(relativePath) {
    const image = new Image();
    const asset = {
      image: image,
      ready: false
    };

    image.onload = function () {
      asset.ready = true;
    };
    image.onerror = function () {
      asset.ready = false;
    };

    try {
      image.src = String(new URL(relativePath, document.baseURI || location.href));
    } catch (_error) {
      image.src = relativePath;
    }

    if (image.complete && image.naturalWidth > 0) {
      asset.ready = true;
    }

    return asset;
  }

  function resizeStage() {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(stage.clientWidth || rect.width || BASE_WIDTH, 1);
    const height = Math.max(stage.clientHeight || rect.height || BASE_HEIGHT, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    stageState.width = width;
    stageState.height = height;
    stageState.centerX = width / 2;
    stageState.centerY = height / 2 + Math.min(height * 0.02, 10);
    stageState.scale = Math.min(width / 860, height / 620);
    stageState.dpr = dpr;
    stageState.canvasBounds.left = rect.left;
    stageState.canvasBounds.top = rect.top;
    stageState.frameNodePoints.clear();
    stageState.frameEdgePoints.clear();

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    if (typeof context.setTransform === "function") {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function getNodeById(id) {
    return nodeById.get(id);
  }

  function getNodeFloat(nodeId) {
    return Math.sin(stageState.time * 0.0018 + nodeId * 0.85) * 5.5;
  }

  function getNodePoint(node) {
    const cachedPoint = stageState.frameNodePoints.get(node.id);
    if (cachedPoint) {
      return cachedPoint;
    }

    const point = {
      x: stageState.centerX + node.x * stageState.scale,
      y: stageState.centerY + node.y * stageState.scale + getNodeFloat(node.id)
    };

    stageState.frameNodePoints.set(node.id, point);
    return point;
  }

  function getEdgePoints(edge) {
    const cachedPoints = stageState.frameEdgePoints.get(edge.key);
    if (cachedPoints) {
      return cachedPoints;
    }

    const sourceNode = getNodeById(edge.source);
    const targetNode = getNodeById(edge.target);
    const points = {
      start: getNodePoint(sourceNode),
      end: edge.targetAccessory ? getAccessoryPoint(targetNode, edge.targetAccessoryIndex || 0) : getNodePoint(targetNode)
    };

    stageState.frameEdgePoints.set(edge.key, points);
    return points;
  }

  function prepareFrameGeometry() {
    stageState.frameNodePoints.clear();
    stageState.frameEdgePoints.clear();
  }

  function getSubEdgesForNode(nodeId) {
    return subEdgesByNode.get(nodeId) || [];
  }

  function isNodeDisconnected(nodeId) {
    const nodeEdges = getSubEdgesForNode(nodeId);
    return nodeEdges.length > 0 && nodeEdges.every(function (edge) {
      return edge.broken;
    });
  }

  function buildParticles() {
    particles = [];

    edges.forEach(function (edge) {
      if (!edge.active || edge.broken) {
        return;
      }

      const count = edge.type === "main" ? MAIN_PARTICLES_PER_EDGE : SUB_PARTICLES_PER_EDGE;
      for (let index = 0; index < count; index += 1) {
        particles.push({
          edge: edge,
          progress: index / count,
          speed: ACTIVE_PARTICLE_SPEED * (edge.type === "main" ? 0.9 : 1.1)
        });
      }
    });
  }

  function pushRipple(nodeId, color) {
    ripples.push({
      nodeId: nodeId,
      radius: 0,
      maxRadius: 96 * stageState.scale,
      color: color
    });
  }

  function pointToSegmentDistance(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;

    if (!lengthSquared) {
      return Math.hypot(point.x - start.x, point.y - start.y);
    }

    const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
    const clamped = Math.max(0, Math.min(1, projection));
    const nearestX = start.x + dx * clamped;
    const nearestY = start.y + dy * clamped;
    return Math.hypot(point.x - nearestX, point.y - nearestY);
  }

  function getCanvasPoint(event) {
    return {
      x: (event.clientX !== undefined ? event.clientX : event.x) - stageState.canvasBounds.left,
      y: (event.clientY !== undefined ? event.clientY : event.y) - stageState.canvasBounds.top
    };
  }

  function getInteractiveEdgeAt(point) {
    let matchedEdge = null;
    let matchedDistance = Infinity;

    edges.forEach(function (edge) {
      if (edge.type !== "sub" && edge.type !== "sounder") {
        return;
      }

      const points = getEdgePoints(edge);
      const distance = pointToSegmentDistance(point, points.start, points.end);

      if (distance <= INTERACTION_RADIUS && distance < matchedDistance) {
        matchedEdge = edge;
        matchedDistance = distance;
      }
    });

    return matchedEdge;
  }

  function breakEdgeWithReroute(edge) {
    if (!edge || (edge.type !== "sub" && edge.type !== "sounder") || !edge.active || edge.broken) {
      return false;
    }

    const siblingEdges = getSubEdgesForNode(edge.source);
    siblingEdges.forEach(function (sibling) {
      if (sibling !== edge) {
        sibling.active = false;
      }
    });

    edge.active = false;
    edge.broken = true;
    edge.breakTime = stageState.time;

    const fallback = siblingEdges.find(function (candidate) {
      return candidate !== edge && !candidate.broken;
    });

    if (fallback) {
      fallback.active = true;
      fallback.healTime = stageState.time;
    }

    pushRipple(edge.source, "255, 132, 98");
    buildParticles();
    return true;
  }

  function recoverEdge(edge) {
    if (!edge || (edge.type !== "sub" && edge.type !== "sounder") || !edge.broken) {
      return false;
    }

    edge.broken = false;

    const siblingEdges = getSubEdgesForNode(edge.source);
    const hasActiveSibling = siblingEdges.some(function (candidate) {
      return candidate.active && !candidate.broken;
    });

    if (!hasActiveSibling) {
      edge.active = true;
    }

    pushRipple(edge.source, "100, 242, 167");
    buildParticles();
    return true;
  }

  function drawBackground() {
    context.clearRect(0, 0, stageState.width, stageState.height);

    const fill = context.createLinearGradient(0, 0, 0, stageState.height);
    fill.addColorStop(0, "#081220");
    fill.addColorStop(1, "#040913");
    context.fillStyle = fill;
    context.fillRect(0, 0, stageState.width, stageState.height);

    stars.forEach(function (star) {
      const x = star.x * stageState.width;
      const y = ((star.y + stageState.time * 0.000006 * star.drift + star.offset) % 1) * stageState.height;
      const alpha = 0.18 + Math.abs(Math.sin(stageState.time * 0.001 + star.offset)) * 0.44;

      context.beginPath();
      context.fillStyle = "rgba(200, 232, 255, " + alpha.toFixed(3) + ")";
      context.arc(x, y, star.radius, 0, Math.PI * 2);
      context.fill();
    });

  }

  function drawEdges() {
    edges.forEach(function (edge) {
      const points = getEdgePoints(edge);
      const midX = (points.start.x + points.end.x) / 2;
      const midY = (points.start.y + points.end.y) / 2;

      if (edge.broken) {
        const elapsed = stageState.time - (edge.breakTime || 0);
        const glitchDuration = 1200;

        // 1. Initial Glitch Animation (Effect 2)
        if (elapsed < glitchDuration) {
          const alpha = 1 - elapsed / glitchDuration;
          const segments = 12;
          const dx = (points.end.x - points.start.x) / segments;
          const dy = (points.end.y - points.start.y) / segments;

          context.beginPath();
          context.lineWidth = 2.4 * stageState.scale;
          context.strokeStyle = "rgba(255, 144, 114, " + alpha.toFixed(2) + ")";
          context.moveTo(points.start.x, points.start.y);

          for (let i = 1; i <= segments; i++) {
            const t = stageState.time * 0.04;
            const offsetX = (Math.random() - 0.5) * 6 * Math.sin(t + i);
            const offsetY = (Math.random() - 0.5) * 6 * Math.cos(t + i);
            const px = points.start.x + dx * i + offsetX;
            const py = points.start.y + dy * i + offsetY;
            context.lineTo(px, py);
          }
          context.stroke();

          if (Math.random() > 0.85) {
            const gx = points.start.x + Math.random() * (points.end.x - points.start.x);
            const gy = points.start.y + Math.random() * (points.end.y - points.start.y);
            const gl = 20 * stageState.scale;
            context.beginPath();
            context.moveTo(gx - gl, gy);
            context.lineTo(gx + gl, gy);
            context.stroke();
          }
        }

        // 2. Persistent Breathing Pulse (Recommended choice)
        // This keeps the red line visible but clearly in a "failed" state
        const pulseAlpha = 0.3 + Math.abs(Math.sin(stageState.time * 0.0015)) * 0.5;
        context.beginPath();
        context.lineWidth = 1.8 * stageState.scale;
        context.setLineDash([5, 8]);
        context.strokeStyle = "rgba(255, 132, 98, " + pulseAlpha.toFixed(3) + ")";
        context.moveTo(points.start.x, points.start.y);
        context.lineTo(points.end.x, points.end.y);
        context.stroke();
        context.setLineDash([]);

        // 3. Status "X" Mark with Breathing Glow
        const xSize = 7.5 * stageState.scale;
        const breath = 0.5 + Math.abs(Math.sin(stageState.time * 0.0018)) * 0.5;
        
        if (typeof context.translate === "function") {
          context.save();
          context.translate(midX, midY);
          context.beginPath();
          context.lineWidth = 1.8 * stageState.scale;
          context.strokeStyle = `rgba(255, 110, 90, ${breath.toFixed(3)})`;
          context.shadowBlur = 10 * breath * stageState.scale;
          context.shadowColor = "rgba(255, 60, 40, 0.6)";
          
          // Draw the X
          context.moveTo(-xSize, -xSize);
          context.lineTo(xSize, xSize);
          context.moveTo(xSize, -xSize);
          context.lineTo(-xSize, xSize);
          context.stroke();
          context.restore();
        }
      } else {
        context.beginPath();
        context.moveTo(points.start.x, points.start.y);
        context.lineTo(points.end.x, points.end.y);
        context.lineCap = "round";

        if (edge.type === "main") {
          context.lineWidth = 2.8;
          context.setLineDash([6, 14]);
          context.strokeStyle = "rgba(95, 214, 255, 0.54)";
        } else if (edge.active) {
          context.lineWidth = 2.2;
          context.setLineDash([4, 12]);
          context.strokeStyle = "rgba(100, 242, 167, 0.54)";
        } else {
          context.lineWidth = 1.7;
          context.setLineDash([4, 14]);
          context.strokeStyle = "rgba(100, 242, 167, 0.18)";
        }

        context.stroke();

        // 3. Self-Healing Highlight (Flash when activated as fallback)
        if (edge.healTime) {
          const elapsed = stageState.time - edge.healTime;
          const duration = 1600;
          if (elapsed < duration) {
            const progress = elapsed / duration;
            const alpha = 1 - progress;
            const glowWidth = (2.2 + 8 * Math.pow(alpha, 2)) * stageState.scale;
            
            context.save();
            context.beginPath();
            context.lineWidth = glowWidth;
            context.strokeStyle = `rgba(100, 242, 167, ${alpha * 0.45})`;
            context.moveTo(points.start.x, points.start.y);
            context.lineTo(points.end.x, points.end.y);
            context.stroke();

            // Bright core flash
            context.beginPath();
            context.lineWidth = (2.2 + 2 * alpha) * stageState.scale;
            context.strokeStyle = `rgba(244, 255, 250, ${alpha * 0.6})`;
            context.stroke();
            context.restore();
          }
        }

        context.setLineDash([]);
        context.lineCap = "butt";
      }
    });
  }

  function drawParticles(deltaFactor) {
    particles.forEach(function (particle) {
      if (!particle.edge.active || particle.edge.broken) {
        return;
      }

      particle.progress += particle.speed * deltaFactor * 0.004;
      if (particle.progress >= 1) {
        particle.progress -= 1;
      }

      const points = getEdgePoints(particle.edge);
      const trailLength = particle.edge.type === "main" ? 7 : 5;

      for (let index = trailLength; index >= 0; index -= 1) {
        const offset = particle.progress - index * 0.022;
        if (offset < 0) {
          continue;
        }

        const x = points.start.x + (points.end.x - points.start.x) * offset;
        const y = points.start.y + (points.end.y - points.start.y) * offset;
        const alpha = 1 - index / (trailLength + 1);
        const radius = Math.max((particle.edge.type === "main" ? 3.6 : 2.8) * alpha, 0.7);

        context.beginPath();
        context.fillStyle = particle.edge.type === "main"
          ? "rgba(95, 214, 255, " + (0.28 + alpha * 0.66).toFixed(3) + ")"
          : "rgba(100, 242, 167, " + (0.22 + alpha * 0.72).toFixed(3) + ")";
        context.arc(x, y, radius * stageState.scale, 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  function drawRipples(deltaFactor) {
    for (let index = ripples.length - 1; index >= 0; index -= 1) {
      const ripple = ripples[index];
      const node = getNodeById(ripple.nodeId);
      const point = getNodePoint(node);
      const alpha = 1 - ripple.radius / ripple.maxRadius;

      if (alpha <= 0) {
        ripples.splice(index, 1);
        continue;
      }

      ripple.radius += deltaFactor * 0.7 * stageState.scale;

      context.beginPath();
      context.lineWidth = Math.max(1.2, 3.4 * alpha);
      context.strokeStyle = "rgba(" + ripple.color + ", " + Math.max(alpha * 0.85, 0).toFixed(3) + ")";
      context.arc(point.x, point.y, ripple.radius, 0, Math.PI * 2);
      context.stroke();
    }
  }

  // Function drawNodeShell removed as it is no longer used per user request

  function getNodeIconSize(node) {
    let iconSize = (node.type === "main" ? 58 : 38) * stageState.scale;

    if (node.sizeScale) {
      iconSize *= node.sizeScale;
    }

    return iconSize;
  }

  function getAccessoryIconSize(node) {
    return getNodeIconSize(node) * (node.type === "main" ? 0.82 : 0.96) * (node.accessorySizeScale || 1);
  }

  function getAccessoryPoint(node, index) {
    const point = getNodePoint(node);
    const accessorySize = getAccessoryIconSize(node);
    const layout = node.accessoryLayout || "right";
    const offsetX = (node.accessoryOffsetX || 0) * stageState.scale;
    const offsetY = (node.accessoryOffsetY || 0) * stageState.scale;

    if (layout === "below") {
      return {
        x: point.x + offsetX,
        y: point.y + offsetY
      };
    }

    const iconSize = getNodeIconSize(node);
    const gap = Math.max(7, 10 * stageState.scale);
    const accessoryCount = Array.isArray(node.accessoryIcons) ? node.accessoryIcons.length : 1;
    const groupWidth = iconSize + gap + accessorySize * accessoryCount + gap * Math.max(accessoryCount - 1, 0);

    return {
      x: point.x - groupWidth / 2 + iconSize + gap + accessorySize / 2 + index * (accessorySize + gap) + offsetX,
      y: point.y + offsetY
    };
  }

  function drawFallbackIcon(node, point, size) {
    const fallbackSize = size || (node.type === "main" ? 38 : 24);

    if (node.type === "main") {
      context.beginPath();
      context.strokeStyle = "rgba(244, 249, 255, 0.92)";
      context.lineWidth = 2.4;
      context.roundRect(point.x - fallbackSize / 2, point.y - fallbackSize * 0.34, fallbackSize, fallbackSize * 0.68, 8);
      context.stroke();
      return;
    }

    context.beginPath();
    context.strokeStyle = "rgba(244, 249, 255, 0.92)";
    context.lineWidth = 2.2;
    context.arc(point.x, point.y, fallbackSize * 0.32, 0, Math.PI * 2);
    context.stroke();
  }

  function drawIconAsset(asset, node, point, iconSize, alpha) {
    if (asset && asset.ready) {
      context.save();
      context.globalAlpha = alpha;
      context.drawImage(
        asset.image,
        point.x - iconSize / 2,
        point.y - iconSize / 2,
        iconSize,
        iconSize
      );
      context.restore();
      return;
    }

    context.save();
    context.globalAlpha = alpha;
    drawFallbackIcon(node, point, iconSize);
    context.restore();
  }

  function drawNodes() {
    nodes.forEach(function (node) {
      const point = getNodePoint(node);
      const disconnected = node.type === "sub" && isNodeDisconnected(node.id);
      const iconAsset = node.type === "main" ? iconAssets.main : iconAssets.sub;
      const iconSize = getNodeIconSize(node);
      const accessoryIcons = Array.isArray(node.accessoryIcons) ? node.accessoryIcons : [];

      drawIconAsset(iconAsset, node, point, iconSize, disconnected ? 0.45 : 1);

      accessoryIcons.forEach(function (iconName, index) {
        const accessoryAsset = iconAssets[iconName];
        const accessoryPoint = getAccessoryPoint(node, index);

        drawIconAsset(accessoryAsset, node, accessoryPoint, getAccessoryIconSize(node), disconnected ? 0.45 : 1);
      });
    });
  }

  function render(deltaFactor) {
    prepareFrameGeometry();
    drawBackground();
    drawEdges();
    drawParticles(deltaFactor);
    drawRipples(deltaFactor);
    drawTrail();
    drawNodes();
  }

  /**
   * Laser Trail Effect (Scheme 3)
   * Draws a high-intensity laser trail that fades over time
   */
  function drawTrail() {
    if (stageState.trailPoints.length < 2) {
      return;
    }

    const now = stageState.time;
    const lifespan = 850; // ms

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    // 1. Red Outer Glow (Faint & Thick)
    context.beginPath();
    context.lineWidth = 12 * stageState.scale;
    context.moveTo(stageState.trailPoints[0].x, stageState.trailPoints[0].y);
    for (let i = 1; i < stageState.trailPoints.length; i++) {
      const p = stageState.trailPoints[i];
      const age = now - p.time;
      const alpha = Math.max(0, (1 - age / lifespan) * 0.22);
      context.strokeStyle = "rgba(255, 60, 0, " + alpha.toFixed(3) + ")";
      context.lineTo(p.x, p.y);
    }
    context.stroke();

    // 2. High-Intensity Core (Bright & Tapering Alpha)
    context.beginPath();
    context.lineWidth = 2.2 * stageState.scale;
    context.moveTo(stageState.trailPoints[0].x, stageState.trailPoints[0].y);
    for (let i = 1; i < stageState.trailPoints.length; i++) {
      const p = stageState.trailPoints[i];
      const age = now - p.time;
      const alpha = Math.max(0, 1 - age / lifespan);
      context.strokeStyle = "rgba(255, 144, 114, " + alpha.toFixed(3) + ")";
      context.lineTo(p.x, p.y);
    }
    context.stroke();

    // 3. Leading Spark Tip
    if (stageState.isDrawingTrail && stageState.trailPoints.length > 0) {
      const last = stageState.trailPoints[stageState.trailPoints.length - 1];
      context.beginPath();
      context.fillStyle = "#ffffff";
      context.shadowBlur = 15 * stageState.scale;
      context.shadowColor = "#ff9072";
      context.arc(last.x, last.y, 4.5 * stageState.scale, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  function tick(timestamp) {
    if (!stageState.isActive) {
      stageState.frameHandle = 0;
      return;
    }

    if (!stageState.lastTimestamp) {
      stageState.lastTimestamp = timestamp || 16;
    }

    const delta = Math.max(8, Math.min(32, (timestamp || 16) - stageState.lastTimestamp));
    const deltaFactor = delta / 16;
    stageState.lastTimestamp = timestamp || 16;
    stageState.time += delta;

    // Background cleanup of trail points
    const lifespan = 850;
    stageState.trailPoints = stageState.trailPoints.filter(function (p) {
      return stageState.time - p.time < lifespan;
    });

    render(deltaFactor);
    stageState.frameHandle = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (stageState.frameHandle) {
      return;
    }
    stageState.lastTimestamp = 0;
    stageState.frameHandle = window.requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (stageState.frameHandle && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(stageState.frameHandle);
    }
    stageState.frameHandle = 0;
    stageState.lastTimestamp = 0;
  }

  function renderStaticFrame() {
    stageState.time += 16;
    render(1);
  }

  function updateCursor(event) {
    const point = getCanvasPoint(event);
    const edge = getInteractiveEdgeAt(point);
    
    // Custom SVG Cursor for better visibility
    const defaultCursor = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='3.5' fill='%235fd6ff'/%3E%3Ccircle cx='16' cy='16' r='8' fill='none' stroke='%235fd6ff' stroke-width='1.5' stroke-opacity='0.4'/%3E%3C/svg%3E\") 16 16, crosshair";
    
    canvas.style.cursor = edge ? "pointer" : defaultCursor;

    if (stageState.isDrawingTrail) {
      stageState.trailPoints.push({
        x: point.x,
        y: point.y,
        time: stageState.time
      });
    }
  }

  function handlePointerUp() {
    stageState.isDrawingTrail = false;
  }

  function handlePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    const point = getCanvasPoint(event);
    const edge = getInteractiveEdgeAt(point);

    if (edge) {
      if (breakEdgeWithReroute(edge) && !stageState.isActive) {
        renderStaticFrame();
      }
    } else {
      stageState.isDrawingTrail = true;
      stageState.trailPoints.push({
        x: point.x,
        y: point.y,
        time: stageState.time
      });
    }
  }

  function handleContextMenu(event) {
    if (typeof event.preventDefault === "function") {
      event.preventDefault();
    }

    const point = getCanvasPoint(event);
    const edge = getInteractiveEdgeAt(point);
    if (!edge) {
      return;
    }

    if (recoverEdge(edge) && !stageState.isActive) {
      renderStaticFrame();
    }
  }

  function syncVisibility(isActive) {
    stageState.isActive = !!isActive;

    if (stageState.isActive) {
      startLoop();
      return;
    }

    stopLoop();
    renderStaticFrame();
  }

  function getSnapshot() {
    return {
      edges: edges.map(function (edge) {
        return {
          source: edge.source,
          target: edge.target,
          type: edge.type,
          active: edge.active,
          broken: edge.broken,
          targetAccessory: !!edge.targetAccessory
        };
      }),
      nodes: nodes.map(function (node) {
        return {
          id: node.id,
          type: node.type,
          accessoryIcons: Array.isArray(node.accessoryIcons) ? node.accessoryIcons.slice() : [],
          accessoryLayout: node.accessoryLayout || "",
          accessoryOffsetY: node.accessoryOffsetY || 0,
          accessorySizeScale: node.accessorySizeScale || 1
        };
      })
    };
  }

  function getDiagnostics() {
    return {
      flashIntensity: 0,
      mainParticlesPerEdge: MAIN_PARTICLES_PER_EDGE,
      subParticlesPerEdge: SUB_PARTICLES_PER_EDGE,
      sounderParticlesPerEdge: SUB_PARTICLES_PER_EDGE,
      alarmLinksVisible: false,
      subNodeShellVisible: false,
      subParticleSpeed: ACTIVE_PARTICLE_SPEED * 1.1,
      mainParticleSpeed: ACTIVE_PARTICLE_SPEED * 0.9
    };
  }

  function getEdgeMidpoint(source, target, targetAccessory) {
    const edge = edgeByKey.get(source + ":" + target + (targetAccessory ? ":accessory" : ""));

    if (!edge) {
      return null;
    }

    const points = getEdgePoints(edge);
    return {
      x: (points.start.x + points.end.x) / 2,
      y: (points.start.y + points.end.y) / 2
    };
  }

  page.classList.add("is-revealed");
  resizeStage();
  buildParticles();
  render(1);

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", updateCursor);
  window.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointerleave", function () {
    canvas.style.cursor = "crosshair";
  });
  canvas.addEventListener("contextmenu", handleContextMenu);

  window.addEventListener("resize", function () {
    resizeStage();
    if (!stageState.isActive) {
      renderStaticFrame();
    }
  });

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "slideVisibility") {
      return;
    }

    syncVisibility(event.data.active);
  });

  canvas.__meshController = {
    getDiagnostics: getDiagnostics,
    getSnapshot: getSnapshot,
    getEdgeMidpoint: getEdgeMidpoint
  };

  if (stageState.isActive) {
    startLoop();
  }
}());
