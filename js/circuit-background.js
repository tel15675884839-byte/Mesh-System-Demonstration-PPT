(function () {
  const THEME = {
    r: 15,
    g: 235,
    b: 198
  };
  const ROOT_ANGLES = [0, 30, 60, 120, 150, 180, 210, 240, 300, 330];
  const BRANCH_PROBABILITY = 0.3;
  const MAX_SEGMENTS = 42;
  const MAX_ACTIVE_ROOTS = 7;
  const HOVER_RADIUS = 150;
  const ENERGY_RADIUS = 100;
  const SEGMENT_LIFE = 3600;
  const NODE_HOLD = 900;
  const SPAWN_INTERVAL = 900;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function distanceToSegment(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lenSq = dx * dx + dy * dy;

    if (!lenSq) {
      return Math.hypot(point.x - start.x, point.y - start.y);
    }

    let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lenSq;
    t = clamp(t, 0, 1);

    const projX = start.x + t * dx;
    const projY = start.y + t * dy;
    return Math.hypot(point.x - projX, point.y - projY);
  }

  function CircuitBackground(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.mouse = { x: -9999, y: -9999, active: false };
    this.segments = [];
    this.nodes = [];
    this.pendingBranches = [];
    this.lastSpawn = 0;
    this.lastFrame = performance.now();
    this.resize();
    this.bindEvents();
    requestAnimationFrame(this.tick.bind(this));
  }

  CircuitBackground.prototype.bindEvents = function () {
    window.addEventListener("resize", this.resize.bind(this));
    window.addEventListener("mousemove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
      this.mouse.active = true;
    });
    window.addEventListener("mouseleave", () => {
      this.mouse.active = false;
    });
  };

  CircuitBackground.prototype.resize = function () {
    const ratio = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  CircuitBackground.prototype.spawnRoot = function () {
    const aliveRoots = this.pendingBranches.filter((item) => item.isRoot).length;
    if (aliveRoots >= MAX_ACTIVE_ROOTS || this.segments.length >= MAX_SEGMENTS) {
      return;
    }

    const edgeBand = Math.min(this.width, this.height) * 0.2;
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;

    if (side === 0) {
      x = Math.random() * this.width;
      y = Math.random() * edgeBand;
    } else if (side === 1) {
      x = this.width - Math.random() * edgeBand;
      y = Math.random() * this.height;
    } else if (side === 2) {
      x = Math.random() * this.width;
      y = this.height - Math.random() * edgeBand;
    } else {
      x = Math.random() * edgeBand;
      y = Math.random() * this.height;
    }

    this.pendingBranches.push({
      x,
      y,
      angle: ROOT_ANGLES[Math.floor(Math.random() * ROOT_ANGLES.length)],
      depth: 0,
      isRoot: true,
      treeId: "tree-" + Math.random().toString(36).slice(2, 10),
      forcedBranchesRemaining: 3
    });
  };

  CircuitBackground.prototype.spawnBranch = function (branch) {
    if (this.segments.length >= MAX_SEGMENTS) {
      return;
    }

    const length = 36 + Math.random() * 42 - branch.depth * 3;
    const radians = branch.angle * Math.PI / 180;
    const end = {
      x: branch.x + Math.cos(radians) * length,
      y: branch.y + Math.sin(radians) * length
    };

    if (end.x < -40 || end.x > this.width + 40 || end.y < -40 || end.y > this.height + 40) {
      return;
    }

    const now = performance.now();
    const segment = {
      start: { x: branch.x, y: branch.y },
      end,
      bornAt: now,
      life: SEGMENT_LIFE + Math.random() * 1200,
      treeId: branch.treeId
    };
    const node = {
      x: end.x,
      y: end.y,
      bornAt: now + 140,
      fadeDelay: NODE_HOLD + Math.random() * 600,
      life: SEGMENT_LIFE + Math.random() * 1200
    };

    this.segments.push(segment);
    this.nodes.push(node);

    const mustContinue = branch.forcedBranchesRemaining > 0;
    const shouldBranch = branch.depth < 4 && (mustContinue || Math.random() < BRANCH_PROBABILITY);

    if (shouldBranch) {
      const count = mustContinue ? (Math.random() < 0.5 ? 1 : 2) : (Math.random() < 0.55 ? 1 : 2);
      for (let index = 0; index < count; index += 1) {
        const angleOffset = (Math.random() < 0.5 ? -1 : 1) * 30 * (1 + Math.floor(Math.random() * 2));
        this.pendingBranches.push({
          x: end.x,
          y: end.y,
          angle: branch.angle + angleOffset,
          depth: branch.depth + 1,
          isRoot: false,
          treeId: branch.treeId,
          forcedBranchesRemaining: Math.max(0, branch.forcedBranchesRemaining - 1)
        });
      }
    }
  };

  CircuitBackground.prototype.update = function (now) {
    if (now - this.lastSpawn > SPAWN_INTERVAL) {
      this.spawnRoot();
      this.lastSpawn = now;
    }

    const branchBudget = Math.min(3, this.pendingBranches.length);
    for (let index = 0; index < branchBudget; index += 1) {
      const branch = this.pendingBranches.shift();
      if (branch) {
        this.spawnBranch(branch);
      }
    }

    this.segments = this.segments.filter((segment) => now - segment.bornAt < segment.life);
    this.nodes = this.nodes.filter((node) => now - node.bornAt < node.life + node.fadeDelay);
  };

  CircuitBackground.prototype.segmentAlpha = function (segment, now) {
    const age = now - segment.bornAt;
    const fadeIn = clamp(age / 540, 0, 1);
    const fadeOut = clamp((segment.life - age) / 1200, 0, 1);
    return Math.min(fadeIn, fadeOut);
  };

  CircuitBackground.prototype.nodeAlpha = function (node, now) {
    const age = now - node.bornAt;
    const fadeIn = clamp(age / 420, 0, 1);
    const fadeOut = clamp((node.life + node.fadeDelay - age) / 1200, 0, 1);
    return Math.min(fadeIn, fadeOut);
  };

  CircuitBackground.prototype.draw = function (now) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const gradient = ctx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.48,
      0,
      this.width * 0.5,
      this.height * 0.5,
      Math.max(this.width, this.height) * 0.75
    );
    gradient.addColorStop(0, "rgba(16, 24, 28, 0.96)");
    gradient.addColorStop(0.35, "rgba(6, 10, 12, 0.98)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    this.segments.forEach((segment) => {
      const alpha = this.segmentAlpha(segment, now);
      if (alpha <= 0) {
        return;
      }

      const hoverDistance = this.mouse.active ? distanceToSegment(this.mouse, segment.start, segment.end) : 9999;
      const hoverBoost = this.mouse.active ? clamp(1 - hoverDistance / HOVER_RADIUS, 0, 1) : 0;
      const lineWidth = 1 + hoverBoost * 1.7;
      const glow = 8 + hoverBoost * 26;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(segment.start.x, segment.start.y);
      ctx.lineTo(segment.end.x, segment.end.y);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = "rgba(" + THEME.r + "," + THEME.g + "," + THEME.b + "," + (0.16 + alpha * 0.46 + hoverBoost * 0.32) + ")";
      ctx.shadowBlur = glow;
      ctx.shadowColor = "rgba(" + THEME.r + "," + THEME.g + "," + THEME.b + "," + (0.28 + hoverBoost * 0.5) + ")";
      ctx.stroke();
      ctx.restore();
    });

    this.nodes.forEach((node) => {
      const alpha = this.nodeAlpha(node, now);
      if (alpha <= 0) {
        return;
      }

      const distance = this.mouse.active ? Math.hypot(this.mouse.x - node.x, this.mouse.y - node.y) : 9999;
      const hoverBoost = this.mouse.active ? clamp(1 - distance / HOVER_RADIUS, 0, 1) : 0;
      const radius = 1.8 + hoverBoost * 1.8;

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + THEME.r + "," + THEME.g + "," + THEME.b + "," + (0.3 + alpha * 0.6 + hoverBoost * 0.25) + ")";
      ctx.shadowBlur = 10 + hoverBoost * 28;
      ctx.shadowColor = "rgba(" + THEME.r + "," + THEME.g + "," + THEME.b + "," + (0.35 + hoverBoost * 0.45) + ")";
      ctx.fill();
      ctx.restore();

      if (distance < ENERGY_RADIUS) {
        const energy = clamp(1 - distance / ENERGY_RADIUS, 0, 1);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(this.mouse.x, this.mouse.y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(" + THEME.r + "," + THEME.g + "," + THEME.b + "," + (0.05 + energy * 0.22) + ")";
        ctx.shadowBlur = 8 + energy * 20;
        ctx.shadowColor = "rgba(" + THEME.r + "," + THEME.g + "," + THEME.b + "," + (0.12 + energy * 0.28) + ")";
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  CircuitBackground.prototype.tick = function (now) {
    this.update(now);
    this.draw(now);
    this.lastFrame = now;
    requestAnimationFrame(this.tick.bind(this));
  };

  document.querySelectorAll("[data-circuit-bg]").forEach((canvas) => {
    new CircuitBackground(canvas);
  });
}());
