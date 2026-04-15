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
    lastTimestamp: 0
  };

  const nodes = [
    { id: 0, type: "main", x: 0, y: -164 },
    { id: 1, type: "main", x: -188, y: 86 },
    { id: 2, type: "main", x: 188, y: 86 },
    { id: 3, type: "sub", x: -226, y: -124 },
    { id: 4, type: "sub", x: 226, y: -124 },
    { id: 5, type: "sub", x: 0, y: -26 },
    { id: 6, type: "sub", x: -324, y: 148 },
    { id: 7, type: "sub", x: 324, y: 148 },
    { id: 8, type: "sub", x: 0, y: 228 }
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
    { source: 8, target: 2, type: "sub", active: false, broken: false }
  ];

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
    sub: loadIcon("../assets/icons/smoke.svg")
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

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    if (typeof context.setTransform === "function") {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function getNodeById(id) {
    return nodes.find(function (node) {
      return node.id === id;
    });
  }

  function getNodeFloat(nodeId) {
    return Math.sin(stageState.time * 0.0018 + nodeId * 0.85) * 5.5;
  }

  function getNodePoint(node) {
    return {
      x: stageState.centerX + node.x * stageState.scale,
      y: stageState.centerY + node.y * stageState.scale + getNodeFloat(node.id)
    };
  }

  function getEdgePoints(edge) {
    const sourceNode = getNodeById(edge.source);
    const targetNode = getNodeById(edge.target);

    return {
      start: getNodePoint(sourceNode),
      end: getNodePoint(targetNode)
    };
  }

  function getSubEdgesForNode(nodeId) {
    return edges.filter(function (edge) {
      return edge.type === "sub" && edge.source === nodeId;
    });
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
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX !== undefined ? event.clientX : event.x) - rect.left,
      y: (event.clientY !== undefined ? event.clientY : event.y) - rect.top
    };
  }

  function getInteractiveEdgeAt(point) {
    let matchedEdge = null;
    let matchedDistance = Infinity;

    edges.forEach(function (edge) {
      if (edge.type !== "sub") {
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
    if (!edge || edge.type !== "sub" || !edge.active || edge.broken) {
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

    const fallback = siblingEdges.find(function (candidate) {
      return candidate !== edge && !candidate.broken;
    });

    if (fallback) {
      fallback.active = true;
    }

    pushRipple(edge.source, "255, 132, 98");
    buildParticles();
    return true;
  }

  function recoverEdge(edge) {
    if (!edge || edge.type !== "sub" || !edge.broken) {
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

      context.beginPath();
      context.moveTo(points.start.x, points.start.y);
      context.lineTo(points.end.x, points.end.y);
      context.lineCap = "round";

      if (edge.type === "main") {
        context.lineWidth = 2.8;
        context.setLineDash([6, 14]);
        context.strokeStyle = "rgba(95, 214, 255, 0.54)";
      } else if (edge.broken) {
        context.lineWidth = 2.2;
        context.setLineDash([4, 11]);
        context.strokeStyle = "rgba(255, 128, 104, 0.62)";
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
      context.setLineDash([]);
      context.lineCap = "butt";

      if (edge.broken) {
        const pulse = 0.8 + Math.abs(Math.sin(stageState.time * 0.005)) * 0.35;
        const markerRadius = 10 * stageState.scale * pulse;

        context.beginPath();
        context.strokeStyle = "rgba(255, 144, 114, 0.95)";
        context.lineWidth = 2;
        context.arc(midX, midY, markerRadius + 6, 0, Math.PI * 2);
        context.stroke();

        context.beginPath();
        context.moveTo(midX - markerRadius, midY - markerRadius);
        context.lineTo(midX + markerRadius, midY + markerRadius);
        context.moveTo(midX + markerRadius, midY - markerRadius);
        context.lineTo(midX - markerRadius, midY + markerRadius);
        context.stroke();
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

  function drawNodeShell(point, radius, fillStyle, glowStyle) {
    context.beginPath();
    context.fillStyle = glowStyle;
    context.arc(point.x, point.y, radius * 1.9, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.fillStyle = fillStyle;
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawFallbackIcon(node, point) {
    if (node.type === "main") {
      context.beginPath();
      context.strokeStyle = "rgba(244, 249, 255, 0.92)";
      context.lineWidth = 2.4;
      context.roundRect(point.x - 19, point.y - 13, 38, 26, 8);
      context.stroke();
      return;
    }

    context.beginPath();
    context.strokeStyle = "rgba(244, 249, 255, 0.92)";
    context.lineWidth = 2.2;
    context.arc(point.x, point.y, 12, 0, Math.PI * 2);
    context.stroke();
  }

  function drawNodes() {
    nodes.forEach(function (node) {
      const point = getNodePoint(node);
      const disconnected = node.type === "sub" && isNodeDisconnected(node.id);
      const radius = (node.type === "main" ? 28 : 18) * stageState.scale;

      if (node.type === "main") {
        drawNodeShell(point, radius, "rgba(12, 26, 44, 0.98)", "rgba(95, 214, 255, 0.16)");
      }

      const iconAsset = node.type === "main" ? iconAssets.main : iconAssets.sub;
      const iconSize = (node.type === "main" ? 58 : 38) * stageState.scale;

      if (iconAsset.ready) {
        context.save();
        context.globalAlpha = disconnected ? 0.45 : 1;
        context.drawImage(
          iconAsset.image,
          point.x - iconSize / 2,
          point.y - iconSize / 2,
          iconSize,
          iconSize
        );
        context.restore();
      } else {
        drawFallbackIcon(node, point);
      }

      if (node.type === "sub" && disconnected) {
        context.beginPath();
        context.strokeStyle = "rgba(255, 144, 114, 0.72)";
        context.lineWidth = 1.5;
        context.arc(point.x, point.y, radius + 8 * stageState.scale, 0, Math.PI * 2);
        context.stroke();
      }
    });
  }

  function render(deltaFactor) {
    drawBackground();
    drawEdges();
    drawParticles(deltaFactor);
    drawRipples(deltaFactor);
    drawNodes();
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
    canvas.style.cursor = edge ? "pointer" : "crosshair";
  }

  function handlePointerDown(event) {
    if (event.button !== 0) {
      return;
    }

    const point = getCanvasPoint(event);
    const edge = getInteractiveEdgeAt(point);
    if (!edge) {
      return;
    }

    if (breakEdgeWithReroute(edge) && !stageState.isActive) {
      renderStaticFrame();
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
          broken: edge.broken
        };
      }),
      nodes: nodes.map(function (node) {
        return {
          id: node.id,
          type: node.type
        };
      })
    };
  }

  function getDiagnostics() {
    return {
      flashIntensity: 0,
      mainParticlesPerEdge: MAIN_PARTICLES_PER_EDGE,
      subParticlesPerEdge: SUB_PARTICLES_PER_EDGE,
      subNodeShellVisible: false,
      subParticleSpeed: ACTIVE_PARTICLE_SPEED * 1.1,
      mainParticleSpeed: ACTIVE_PARTICLE_SPEED * 0.9
    };
  }

  function getEdgeMidpoint(source, target) {
    const edge = edges.find(function (candidate) {
      return candidate.source === source && candidate.target === target;
    });

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
