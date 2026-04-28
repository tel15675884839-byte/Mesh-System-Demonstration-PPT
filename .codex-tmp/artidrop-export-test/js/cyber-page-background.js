(function () {
  const ROOT_SELECTOR = "[data-cyber-bg]";
  const THEME_RGB = "0, 255, 204";
  const MOUSE_RADIUS = 180;
  const MOUSE_RADIUS_SQUARED = MOUSE_RADIUS * MOUSE_RADIUS;
  const CONNECTION_DISTANCE = 122;
  const CONNECTION_DISTANCE_SQUARED = CONNECTION_DISTANCE * CONNECTION_DISTANCE;
  const CONNECTION_GRID_SIZE = CONNECTION_DISTANCE;
  const MIN_NODES = 28;
  const MAX_NODES = 105;
  const MIN_CLUSTERS = 6;
  const MAX_CLUSTERS = 48;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function createDataCluster(width, height) {
    const lineCount = Math.floor(Math.random() * 5) + 3;
    const lines = [];

    for (let index = 0; index < lineCount; index += 1) {
      lines.push({
        yOffset: Math.random() * 42,
        width: Math.random() * 66 + 8,
        xOffset: Math.random() * 10
      });
    }

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      width: Math.random() * 60 + 20,
      height: Math.random() * 40 + 20,
      opacity: Math.random() * 0.28 + 0.04,
      speed: Math.random() * 0.18 + 0.08,
      lines
    };
  }

  function createNode(width, height) {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.1,
      vy: (Math.random() - 0.5) * 1.1,
      radius: Math.random() * 1.8 + 0.8,
      label: (Math.random() * 99).toFixed(2)
    };
  }

  function CyberPageBackground(root) {
    this.root = root;
    this.canvas = root.querySelector("canvas");
    this.ctx = this.canvas && typeof this.canvas.getContext === "function"
      ? this.canvas.getContext("2d")
      : null;

    this.width = 0;
    this.height = 0;
    this.deviceScale = 1;
    this.frameHandle = 0;
    this.running = false;
    this.destroyed = false;

    this.mouseX = null;
    this.mouseY = null;
    this.nodes = [];
    this.dataClusters = [];
    this.rootBounds = {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    };
    this.connectionGrid = new Map();

    const forceActive = Boolean(
      this.root
      && typeof this.root.hasAttribute === "function"
      && this.root.hasAttribute("data-cyber-bg-force-active")
    );

    this.isSlideActive = forceActive || window.parent === window;
    this.isPageVisible = !document.hidden;
    this.lastTimestamp = 0;
    this.hasPaintedFirstFrame = false;

    this.tick = this.tick.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handlePageHide = this.handlePageHide.bind(this);

    if (!this.ctx) {
      this.bindNoopDebugController();
      return;
    }

    this.resize(true);
    this.bindEvents();
    this.bindDebugController();
    this.syncAnimationState();
  }

  CyberPageBackground.prototype.bindNoopDebugController = function () {
    if (!this.canvas) {
      return;
    }

    this.canvas.__cyberBackgroundController = {
      disabled: true,
      getDebugState() {
        return {
          disabled: true,
          width: 0,
          height: 0,
          particleCount: 0,
          clusterCount: 0
        };
      }
    };
  };

  CyberPageBackground.prototype.bindDebugController = function () {
    if (!this.canvas) {
      return;
    }

    const instance = this;
    this.canvas.__cyberBackgroundController = {
      getDebugState() {
        return {
          width: instance.width,
          height: instance.height,
          particleCount: instance.nodes.length,
          clusterCount: instance.dataClusters.length,
          running: instance.running,
          slideActive: instance.isSlideActive,
          pageVisible: instance.isPageVisible
        };
      },
      destroy() {
        instance.destroy();
      }
    };
  };

  CyberPageBackground.prototype.bindEvents = function () {
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("message", this.handleMessage);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerleave", this.handlePointerLeave);
    window.addEventListener("pagehide", this.handlePageHide);
  };

  CyberPageBackground.prototype.unbindEvents = function () {
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("message", this.handleMessage);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerleave", this.handlePointerLeave);
    window.removeEventListener("pagehide", this.handlePageHide);
  };

  CyberPageBackground.prototype.resize = function (forceRebuild) {
    if (!this.ctx || !this.canvas) {
      return;
    }

    const width = Math.max(1, toNumber(this.root.clientWidth, window.innerWidth || 1920));
    const height = Math.max(1, toNumber(this.root.clientHeight, window.innerHeight || 1080));
    const nextScale = clamp(toNumber(window.devicePixelRatio, 1), 1, 2);
    const changed = width !== this.width || height !== this.height || nextScale !== this.deviceScale;

    if (!changed && !forceRebuild) {
      return;
    }

    this.width = width;
    this.height = height;
    this.deviceScale = nextScale;

    this.canvas.width = Math.round(this.width * this.deviceScale);
    this.canvas.height = Math.round(this.height * this.deviceScale);
    this.ctx.setTransform(this.deviceScale, 0, 0, this.deviceScale, 0, 0);

    this.updateRootBounds();
    this.rebuildScene();
    this.paintBaseLayer();
  };

  CyberPageBackground.prototype.updateRootBounds = function () {
    if (!this.root || typeof this.root.getBoundingClientRect !== "function") {
      this.rootBounds = {
        left: 0,
        top: 0,
        width: this.width,
        height: this.height
      };
      return;
    }

    const rect = this.root.getBoundingClientRect();
    this.rootBounds = {
      left: toNumber(rect.left, 0),
      top: toNumber(rect.top, 0),
      width: toNumber(rect.width, this.width),
      height: toNumber(rect.height, this.height)
    };
  };

  CyberPageBackground.prototype.rebuildScene = function () {
    const area = this.width * this.height;
    let nodeCount = Math.floor((area / 12000) * 0.7);
    nodeCount = clamp(nodeCount, MIN_NODES, MAX_NODES);

    let clusterCount = Math.floor((area / 30000) * 0.7);
    clusterCount = clamp(clusterCount, MIN_CLUSTERS, MAX_CLUSTERS);

    this.nodes = [];
    this.dataClusters = [];

    for (let index = 0; index < nodeCount; index += 1) {
      this.nodes.push(createNode(this.width, this.height));
    }

    for (let index = 0; index < clusterCount; index += 1) {
      this.dataClusters.push(createDataCluster(this.width, this.height));
    }
  };

  CyberPageBackground.prototype.paintBaseLayer = function () {
    if (!this.ctx) {
      return;
    }

    this.ctx.fillStyle = "rgba(2, 8, 10, 1)";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.hasPaintedFirstFrame = true;
  };

  CyberPageBackground.prototype.handleResize = function () {
    this.updateRootBounds();
    this.resize(false);
  };

  CyberPageBackground.prototype.handleVisibilityChange = function () {
    this.isPageVisible = !document.hidden;
    this.syncAnimationState();
  };

  CyberPageBackground.prototype.handleMessage = function (event) {
    if (!event || !event.data || event.data.type !== "slideVisibility") {
      return;
    }

    this.isSlideActive = Boolean(event.data.active);
    this.syncAnimationState();
  };

  CyberPageBackground.prototype.handlePointerMove = function (event) {
    if (!event) {
      return;
    }

    if (!this.rootBounds.width && !this.rootBounds.height) {
      this.updateRootBounds();
    }

    this.mouseX = event.clientX - this.rootBounds.left;
    this.mouseY = event.clientY - this.rootBounds.top;
  };

  CyberPageBackground.prototype.handlePointerLeave = function () {
    this.mouseX = null;
    this.mouseY = null;
  };

  CyberPageBackground.prototype.handlePageHide = function () {
    this.stopAnimation();
  };

  CyberPageBackground.prototype.syncAnimationState = function () {
    if (this.destroyed || !this.ctx) {
      return;
    }

    if (this.isSlideActive && this.isPageVisible) {
      this.startAnimation();
      return;
    }

    this.stopAnimation();
  };

  CyberPageBackground.prototype.startAnimation = function () {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTimestamp = 0;

    if (!this.frameHandle) {
      this.frameHandle = window.requestAnimationFrame(this.tick);
    }
  };

  CyberPageBackground.prototype.stopAnimation = function () {
    this.running = false;

    if (!this.frameHandle) {
      return;
    }

    window.cancelAnimationFrame(this.frameHandle);
    this.frameHandle = 0;
  };

  CyberPageBackground.prototype.updateDataClusters = function (deltaFactor) {
    for (let index = 0; index < this.dataClusters.length; index += 1) {
      const cluster = this.dataClusters[index];

      cluster.x -= cluster.speed * deltaFactor;
      if (cluster.x < -(cluster.width + 40)) {
        cluster.x = this.width + 30;
        cluster.y = Math.random() * this.height;
      }

      if (Math.random() < 0.05) {
        cluster.opacity = Math.random() * 0.34 + 0.06;
      }

      this.ctx.save();
      this.ctx.fillStyle = `rgba(${THEME_RGB}, ${cluster.opacity})`;
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = `rgba(${THEME_RGB}, 0.6)`;

      for (let lineIndex = 0; lineIndex < cluster.lines.length; lineIndex += 1) {
        const line = cluster.lines[lineIndex];
        this.ctx.fillRect(cluster.x + line.xOffset, cluster.y + line.yOffset, line.width, 2);
      }

      this.ctx.restore();
    }
  };

  CyberPageBackground.prototype.updateNodes = function (deltaFactor) {
    for (let index = 0; index < this.nodes.length; index += 1) {
      const node = this.nodes[index];

      if (node.x > this.width || node.x < 0) {
        node.vx = -node.vx;
      }
      if (node.y > this.height || node.y < 0) {
        node.vy = -node.vy;
      }

      node.x += node.vx * deltaFactor;
      node.y += node.vy * deltaFactor;

      if (this.mouseX === null || this.mouseY === null) {
        continue;
      }

      const dx = this.mouseX - node.x;
      const dy = this.mouseY - node.y;
      const distanceSquared = (dx * dx) + (dy * dy);

      if (distanceSquared <= 0 || distanceSquared >= MOUSE_RADIUS_SQUARED) {
        continue;
      }

      const distance = Math.sqrt(distanceSquared);
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;

      node.x += forceDirectionX * force * 1.1 * deltaFactor;
      node.y += forceDirectionY * force * 1.1 * deltaFactor;
    }
  };

  CyberPageBackground.prototype.rebuildConnectionGrid = function () {
    const cellSize = CONNECTION_GRID_SIZE;

    this.connectionGrid.clear();

    for (let index = 0; index < this.nodes.length; index += 1) {
      const node = this.nodes[index];
      const cellX = Math.floor(node.x / cellSize);
      const cellY = Math.floor(node.y / cellSize);
      const key = cellX + "," + cellY;
      const bucket = this.connectionGrid.get(key);

      if (bucket) {
        bucket.push(index);
        continue;
      }

      this.connectionGrid.set(key, [index]);
    }
  };

  CyberPageBackground.prototype.drawNodeConnections = function () {
    const cellSize = CONNECTION_GRID_SIZE;

    this.rebuildConnectionGrid();

    for (let a = 0; a < this.nodes.length; a += 1) {
      const nodeA = this.nodes[a];
      const cellX = Math.floor(nodeA.x / cellSize);
      const cellY = Math.floor(nodeA.y / cellSize);

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const bucket = this.connectionGrid.get((cellX + offsetX) + "," + (cellY + offsetY));

          if (!bucket) {
            continue;
          }

          for (let index = 0; index < bucket.length; index += 1) {
            const b = bucket[index];

            if (b < a) {
              continue;
            }

            const nodeB = this.nodes[b];
            const dx = nodeA.x - nodeB.x;
            const dy = nodeA.y - nodeB.y;
            const distanceSquared = (dx * dx) + (dy * dy);

            if (distanceSquared >= CONNECTION_DISTANCE_SQUARED) {
              continue;
            }

            const distance = Math.sqrt(distanceSquared);
            let opacity = 1 - (distance / CONNECTION_DISTANCE);

            if (this.mouseX !== null) {
              const distToMouseASquared = ((this.mouseX - nodeA.x) * (this.mouseX - nodeA.x)) + ((this.mouseY - nodeA.y) * (this.mouseY - nodeA.y));
              const distToMouseBSquared = ((this.mouseX - nodeB.x) * (this.mouseX - nodeB.x)) + ((this.mouseY - nodeB.y) * (this.mouseY - nodeB.y));

              if (distToMouseASquared < MOUSE_RADIUS_SQUARED && distToMouseBSquared < MOUSE_RADIUS_SQUARED) {
                opacity += 0.5;
                this.ctx.lineWidth = 1.4;
              } else {
                this.ctx.lineWidth = 0.55;
              }
            } else {
              this.ctx.lineWidth = 0.55;
            }

            this.ctx.strokeStyle = `rgba(${THEME_RGB}, ${opacity * 0.78})`;
            this.ctx.beginPath();
            this.ctx.moveTo(nodeA.x, nodeA.y);
            this.ctx.lineTo(nodeB.x, nodeB.y);
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = `rgba(${THEME_RGB}, ${opacity * 0.88})`;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
          }
        }
      }

      if (this.mouseX !== null && this.mouseY !== null) {
        const mouseDx = nodeA.x - this.mouseX;
        const mouseDy = nodeA.y - this.mouseY;
        const mouseDistanceSquared = (mouseDx * mouseDx) + (mouseDy * mouseDy);

        if (mouseDistanceSquared < MOUSE_RADIUS_SQUARED) {
          const mouseDistance = Math.sqrt(mouseDistanceSquared);
          const mouseOpacity = 1 - (mouseDistance / MOUSE_RADIUS);
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${mouseOpacity * 0.45})`;
          this.ctx.setLineDash([5, 5]);
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(nodeA.x, nodeA.y);
          this.ctx.lineTo(this.mouseX, this.mouseY);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      }
    }
  };

  CyberPageBackground.prototype.drawNodes = function () {
    this.ctx.font = "10px Courier New";

    for (let index = 0; index < this.nodes.length; index += 1) {
      const node = this.nodes[index];
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${THEME_RGB}, 0.82)`;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = `rgba(${THEME_RGB}, 1)`;
      this.ctx.fill();

      this.ctx.fillStyle = `rgba(${THEME_RGB}, 0.54)`;
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(node.label, node.x + 6, node.y - 6);
    }
  };

  CyberPageBackground.prototype.render = function (deltaFactor) {
    if (!this.hasPaintedFirstFrame) {
      this.paintBaseLayer();
    }

    this.ctx.fillStyle = "rgba(2, 8, 10, 0.5)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.updateDataClusters(deltaFactor);
    this.updateNodes(deltaFactor);
    this.drawNodeConnections();
    this.drawNodes();
  };

  CyberPageBackground.prototype.tick = function (timestamp) {
    this.frameHandle = 0;
    if (!this.running || !this.ctx) {
      return;
    }

    const now = toNumber(timestamp, Date.now());
    const deltaMs = this.lastTimestamp ? clamp(now - this.lastTimestamp, 8, 40) : 16;
    this.lastTimestamp = now;
    const deltaFactor = deltaMs / 16.6667;

    this.render(deltaFactor);

    if (this.running) {
      this.frameHandle = window.requestAnimationFrame(this.tick);
    }
  };

  CyberPageBackground.prototype.destroy = function () {
    this.destroyed = true;
    this.stopAnimation();
    this.unbindEvents();
  };

  function bootstrap() {
    document.querySelectorAll(ROOT_SELECTOR).forEach(function (root) {
      if (!root || root.__cyberBackgroundInitialized) {
        return;
      }

      root.__cyberBackgroundInitialized = true;
      root.__cyberBackgroundInstance = new CyberPageBackground(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
}());
